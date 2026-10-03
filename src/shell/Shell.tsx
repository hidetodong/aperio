import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { isTauri, type ListedFile } from "../bridge";
import { baseName, extensionOf } from "../formats/route";
import type { Current } from "../open/session";
import type { Recent } from "../recents";
import {
  countKinds,
  filterRows,
  locationLabel,
  parentDir,
  presentFile,
  TABS,
  type Assoc,
  type FileRow,
  type GroupId,
  type KindId,
  type Prefs,
  type Screen,
  type ViewMode,
} from "./catalog";
import { ChevronLeft, ChevronRight, GridIcon, ListIcon, SearchIcon, SettingsIcon } from "./icons";
import {
  asEntry,
  childFolders,
  countText,
  crumbs,
  deepActive,
  displayPath,
  filesIn,
  filesUnder,
  loadRoots,
  parentRel,
  rootName,
  saveRoots,
  sideTree,
  type DirEntry,
} from "./library";
import { DEMO_DOWNLOADS, DEMO_RECENTS, DEMO_ROOT } from "./libraryDemo";
import { HomeScreen } from "./HomeScreen";
import { openablePaths, viewFromNames, type DragView, type DropIntent } from "./homeDrag";
import { LibraryScreen } from "./LibraryScreen";
import { PickerDialog } from "./PickerDialog";
import { loadStored, saveStored } from "./prefs";
import { SettingsScreen } from "./SettingsScreen";
import { AperioLogo } from "./AperioLogo";
import { ViewerFrame } from "./ViewerFrame";
import "./shell.css";

export type ShellProps = {
  current: Current;
  recents: Recent[];
  ready: boolean;
  bootOpen: boolean;
  drag: DragView;
  openedTick: number;
  onOpenPath: (path: string) => void;
  onOpenFile: (file: File) => void;
  onPickPath: () => void;
  onBrowserHover: (names: string[], count: number) => void;
  onBrowserDrop: (files: File[]) => void;
  onDragIdle: (force?: boolean) => void;
  takeDropIntent: () => DropIntent | null;
  onReveal: (path: string) => void;
  onChangeRecents: (next: Recent[]) => void;
  onListTree: (path: string) => Promise<ListedFile[]>;
  onPickDirectory: () => Promise<string | null>;
  onExtract: () => Promise<"ok" | "cancel">;
  onListDirectory: (path: string) => Promise<ListedFile[]>;
  thumbSrc: (path: string, name: string) => string | null;
  stage: () => ReactNode;
};

function useResolvedTheme(theme: Prefs["theme"]) {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setSystemDark(media.matches);
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return systemDark ? "dark" : "light";
}

function listedRow(file: ListedFile): FileRow {
  return presentFile({ path: file.path, name: file.name, bytes: file.size, when: file.modifiedMs });
}

export function Shell(props: ShellProps) {
  const stored = useRef(loadStored());
  const [prefs, setPrefs] = useState<Prefs>(stored.current.prefs);
  const [assoc, setAssoc] = useState<Assoc>(stored.current.assoc);
  const [screen, setScreen] = useState<Screen>("home");
  const [stageFade, setStageFade] = useState(false);
  const [from, setFrom] = useState<Screen>("home");
  const [settingsReturn, setSettingsReturn] = useState<Screen>("home");
  const browser = !isTauri();
  const [roots, setRoots] = useState<string[]>(() => {
    const storedRoots = loadRoots();
    if (storedRoots.length > 0) return storedRoots;
    return browser ? [DEMO_ROOT, DEMO_DOWNLOADS] : [];
  });
  const [place, setPlace] = useState("all");
  const [dir, setDir] = useState("");
  const [kind, setKind] = useState<KindId>("all");
  const [query, setQuery] = useState("");
  const [pq, setPq] = useState("");
  const [view, setView] = useState<ViewMode>(stored.current.prefs.dirView);
  const [sel, setSel] = useState("");
  const [selDir, setSelDir] = useState("");
  const [picker, setPicker] = useState(false);
  const [chromeOn, setChromeOn] = useState(true);
  const [info, setInfo] = useState(false);
  const [zen, setZen] = useState(false);
  const [zenHint, setZenHint] = useState(false);
  const [edge, setEdge] = useState(false);
  const [tab, setTab] = useState("general");
  const [trees, setTrees] = useState<Record<string, DirEntry[]>>({});
  const [treeError, setTreeError] = useState<Record<string, boolean>>({});
  const [demoRecents, setDemoRecents] = useState<Recent[]>(DEMO_RECENTS);
  const [undo, setUndo] = useState<{ prev: Recent[]; label: string; demo: boolean } | null>(null);
  const [browse, setBrowse] = useState<FileRow[]>([]);
  const theme = useResolvedTheme(prefs.theme);
  const hideTimer = useRef(0);
  const hintTimer = useRef(0);
  const undoTimer = useRef(0);
  const treesRef = useRef<Record<string, DirEntry[]>>({});
  const hold = useRef(false);
  const seenTick = useRef(0);
  const booted = useRef(false);
  const currentRef = useRef(props.current);
  const recentsRef = useRef(props.recents);
  const listTreeRef = useRef(props.onListTree);
  const listDirRef = useRef(props.onListDirectory);
  const openPathRef = useRef(props.onOpenPath);
  const pickPathRef = useRef(props.onPickPath);
  const pickDirRef = useRef(props.onPickDirectory);
  const changeRecentsRef = useRef(props.onChangeRecents);
  currentRef.current = props.current;
  recentsRef.current = props.recents;
  listTreeRef.current = props.onListTree;
  listDirRef.current = props.onListDirectory;
  openPathRef.current = props.onOpenPath;
  pickPathRef.current = props.onPickPath;
  pickDirRef.current = props.onPickDirectory;
  changeRecentsRef.current = props.onChangeRecents;
  const prefsRef = useRef(prefs);
  const infoRef = useRef(info);
  prefsRef.current = prefs;
  infoRef.current = info;
  treesRef.current = trees;

  const recentSource = props.recents.length > 0 || !browser ? props.recents : demoRecents;
  const recentRows = recentSource.map((item) => presentFile({ path: item.path, name: item.name, when: item.openedAt }));
  const entries = place === "all" ? [] : (trees[place] ?? []);
  const deep = place !== "all" && deepActive(kind, query);
  const folderCards = deep || place === "all" ? [] : childFolders(entries, dir);
  const shown = filterRows(place === "all" ? recentRows : filesIn(entries, dir, deep).map(listedRow), kind, query);
  const counts = countKinds(place === "all" ? recentRows : filesIn(entries, dir, true).map(listedRow));
  const fileSelected = shown.some((row) => row.path === sel) ? sel : "";
  const dirSelected = folderCards.some((item) => item.rel === selDir) ? selDir : "";
  const selectedFile = fileSelected || dirSelected ? fileSelected : (folderCards.length === 0 ? (shown[0]?.path ?? "") : "");
  const selectedDir = dirSelected || (selectedFile ? "" : (folderCards[0]?.rel ?? ""));
  const known = new Map<string, FileRow>();
  for (const row of [...recentRows, ...shown, ...browse]) known.set(row.path, row);
  const pickerRows = [...known.values()].filter((row) => !pq.trim() || row.name.toLowerCase().includes(pq.trim().toLowerCase()));
  const crumbItems = place === "all" ? [] : crumbs(rootName(place), dir);
  const visibleFolders = place === "all" || deep ? 0 : folderCards.length;
  const counter = countText(visibleFolders, shown.length);
  const deepNote = deep ? "包含子文件夹中的结果" : "";
  const emptyText = query.trim() ? `没有匹配“${query.trim()}”的文件` : place === "all" ? "没有最近打开的记录" : "这个目录里没有可打开的文件";
  const libStatus = place === "all" ? "ready" : treeError[place] ? "error" : place in trees ? "ready" : "loading";
  const rootRows = roots.map((path) => ({
    path,
    name: rootName(path),
    count: filesUnder(trees[path] ?? [], ""),
    title: displayPath(path),
    hasKids: (trees[path] ?? []).some((entry) => entry.isDir),
  }));
  const tabTitle = TABS.find((item) => item.id === tab)?.label ?? "通用";
  const upTitle = place !== "all" && dir ? "上一级 ⌘↑" : "返回首页";

  function armHide() {
    window.clearTimeout(hideTimer.current);
    if (!prefsRef.current.autoHide) return;
    hideTimer.current = window.setTimeout(() => {
      if (!infoRef.current) setChromeOn(false);
    }, 1500);
  }

  function wake() {
    setChromeOn(true);
    armHide();
  }

  function leave() {
    if (!prefsRef.current.autoHide) return;
    setChromeOn(false);
    setEdge(false);
  }

  function go(next: Screen) {
    setFrom((prev) => (screen === "view" ? prev : screen));
    setScreen(next);
    setZen(false);
    setZenHint(false);
    setPicker(false);
    setChromeOn(true);
    armHide();
  }

  function openSettings() {
    if (screen !== "settings") setSettingsReturn(screen);
    setScreen("settings");
    setZen(false);
    setZenHint(false);
    setPicker(false);
    setChromeOn(true);
    armHide();
  }

  function leaveSettings() {
    setScreen(settingsReturn === "settings" ? "home" : settingsReturn);
    setZen(false);
    setZenHint(false);
    setPicker(false);
    setChromeOn(true);
    armHide();
  }

  function openRow(row: FileRow, list: FileRow[]) {
    setStageFade(false);
    hold.current = true;
    setBrowse(list.length ? list : [row]);
    setFrom((prev) => (screen === "view" ? prev : screen));
    setScreen("view");
    setPicker(false);
    setPq("");
    setChromeOn(true);
    props.onOpenPath(row.path);
    armHide();
  }

  function viewKind(current: typeof props.current): string {
    if (current.kind === "image") return "image";
    if (current.kind === "media") return extensionOf(current.name) === "mp3" ? "audio" : "video";
    if (current.kind === "pdf") return "pdf";
    if (current.kind === "text") return current.mode === "markdown" ? "markdown" : current.mode === "code" ? "code" : current.mode === "html" ? "html" : "plain";
    if (current.kind === "office" || current.kind === "zip") return current.kind;
    return "other";
  }

  function toggleZen() {
    if (viewKind(currentRef.current) === "zip") return;
    setZen((value) => {
      const next = !value;
      setZenHint(next);
      setInfo(false);
      setChromeOn(!next);
      setEdge(false);
      window.clearTimeout(hintTimer.current);
      if (next) hintTimer.current = window.setTimeout(() => setZenHint(false), 2400);
      else armHide();
      return next;
    });
  }

  function step(delta: number) {
    if (browse.length === 0) return;
    const currentPath = props.current.kind === "empty" ? "" : props.current.path;
    let index = browse.findIndex((row) => row.path === currentPath);
    if (index < 0) index = 0;
    let next = index + delta;
    if (next < 0 || next >= browse.length) {
      if (!prefs.loop) return;
      next = (next + browse.length) % browse.length;
    }
    const row = browse[next];
    if (row) openRow(row, browse);
  }

  function toggleFit() {
    setPrefs((value) => ({ ...value, fit: value.fit === "fill" ? "fit" : "fill" }));
  }

  function enterDir(rel: string) {
    setDir(rel);
    setQuery("");
    setSel("");
    setSelDir("");
  }

  function goUp() {
    if (place !== "all" && dir) enterDir(parentRel(dir));
    else go("home");
  }

  function publishRecents(next: Recent[], label: string) {
    const usingDemo = browser && props.recents.length === 0;
    setUndo({ prev: usingDemo ? demoRecents : props.recents, label, demo: usingDemo });
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
    if (usingDemo) setDemoRecents(next);
    else changeRecentsRef.current(next);
  }

  function forget(path: string) {
    const item = recentSource.find((entry) => entry.path === path);
    if (!item) return;
    publishRecents(
      recentSource.filter((entry) => entry.path !== path),
      `已从最近打开中移除“${item.name}”`,
    );
  }

  function clearVisible() {
    const drop = new Set(shown.map((row) => row.path));
    publishRecents(
      recentSource.filter((entry) => !drop.has(entry.path)),
      `已清除 ${shown.length} 条记录`,
    );
  }

  function undoRecents() {
    setUndo((current) => {
      if (!current) return null;
      if (current.demo) setDemoRecents(current.prev);
      else changeRecentsRef.current(current.prev);
      window.clearTimeout(undoTimer.current);
      return null;
    });
  }

  async function addDirectory() {
    const path = await pickDirRef.current();
    if (!path) return;
    setRoots((prev) => {
      if (prev.includes(path)) return prev;
      const next = [...prev, path];
      saveRoots(next);
      return next;
    });
    setPlace(path);
    setDir("");
    setQuery("");
    setSel("");
    setSelDir("");
    setPicker(false);
    setScreen("lib");
  }

  const actions = useRef({
    go,
    openRow,
    toggleZen,
    step,
    pickerRows,
    shown,
    folderCards,
    selectedFile,
    selectedDir,
    place,
    openSettings,
    leaveSettings,
    goUp,
    enterDir,
    forget,
    addDirectory,
  });
  actions.current = {
    go,
    openRow,
    toggleZen,
    step,
    pickerRows,
    shown,
    folderCards,
    selectedFile,
    selectedDir,
    place,
    openSettings,
    leaveSettings,
    goUp,
    enterDir,
    forget,
    addDirectory,
  };

  useEffect(() => {
    saveStored({ prefs, assoc });
  }, [prefs, assoc]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      const act = actions.current;
      if (meta && event.shiftKey && (event.key === "o" || event.key === "O")) {
        event.preventDefault();
        void act.addDirectory();
        return;
      }
      if (meta && !event.shiftKey && (event.key === "k" || event.key === "K" || event.key === "o" || event.key === "O")) {
        event.preventDefault();
        setPicker(true);
        return;
      }
      if (meta && !event.shiftKey && (event.key === "l" || event.key === "L")) {
        if (screen === "view" && viewKind(currentRef.current) === "image") return;
        event.preventDefault();
        act.go("lib");
        return;
      }
      if (meta && event.key === ",") {
        event.preventDefault();
        if (screen === "settings") act.leaveSettings();
        else act.openSettings();
        return;
      }
      if (meta && event.key === "ArrowUp" && screen === "lib") {
        event.preventDefault();
        act.goUp();
        return;
      }
      if (event.key === "Escape") {
        if (zen && screen === "view") act.toggleZen();
        else if (picker) setPicker(false);
        else if (screen === "view") act.go(from === "view" ? "home" : from);
        else if (screen === "settings") act.leaveSettings();
        return;
      }
      if (picker) {
        if (event.key === "Enter") {
          const first = act.pickerRows[0];
          if (first) act.openRow(first, act.pickerRows);
          else pickPathRef.current();
        }
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (screen === "view") {
        if (event.key === "ArrowRight") act.step(1);
        else if (event.key === "ArrowLeft") act.step(-1);
        else if (!meta && (event.key === "i" || event.key === "I")) {
          setInfo((open) => !open);
          setChromeOn(true);
          setZen(false);
        } else if (!meta && !event.altKey && (event.key === "z" || event.key === "Z")) act.toggleZen();
        else if (event.key === " ") {
          event.preventDefault();
          act.go(from === "view" ? "home" : from);
        }
      } else if (screen === "lib") {
        const items = [
          ...act.folderCards.map((folder) => ({ dir: folder.rel, file: "" })),
          ...act.shown.map((row) => ({ dir: "", file: row.path })),
        ];
        const index = items.findIndex(
          (item) => (item.dir && item.dir === act.selectedDir) || (item.file && item.file === act.selectedFile),
        );
        if ((event.key === " " || event.key === "Enter") && index >= 0) {
          event.preventDefault();
          const item = items[index];
          if (item?.dir) act.enterDir(item.dir);
          else if (item?.file) {
            const row = act.shown.find((entry) => entry.path === item.file);
            if (row) act.openRow(row, act.shown);
          }
        } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          const next = items[event.key === "ArrowRight" ? index + 1 : index - 1];
          if (!next) return;
          if (next.dir) {
            setSelDir(next.dir);
            setSel("");
          } else {
            setSel(next.file);
            setSelDir("");
          }
        } else if ((event.key === "Backspace" || event.key === "Delete") && act.place === "all" && act.selectedFile) {
          event.preventDefault();
          act.forget(act.selectedFile);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [from, picker, screen, zen]);

  useEffect(() => {
    if (!props.ready || booted.current) return;
    booted.current = true;
    if (props.bootOpen) return;
    if (prefsRef.current.startup === "lib") setScreen("lib");
    const last = recentsRef.current[0];
    if (prefsRef.current.startup === "last" && last) openPathRef.current(last.path);
  }, [props.ready, props.bootOpen]);

  useEffect(() => {
    if (props.openedTick === seenTick.current) return;
    seenTick.current = props.openedTick;
    const opened = currentRef.current;
    if (opened.kind === "empty") return;
    const intent = props.takeDropIntent();
    setStageFade(Boolean(intent?.fade));
    props.onDragIdle(true);
    setScreen("view");
    setChromeOn(true);
    if (hold.current) {
      hold.current = false;
      return;
    }
    if (intent?.paths && intent.paths.length > 1) {
      setBrowse(intent.paths.map((path) => presentFile({ path, name: baseName(path) })));
      return;
    }
    const row = presentFile({ path: opened.path, name: opened.name });
    setBrowse([row]);
    const dir = parentDir(opened.path);
    if (!dir) return;
    let cancelled = false;
    void listDirRef.current(dir).then((files) => {
      if (cancelled) return;
      const rows = files.map(listedRow);
      if (!rows.some((item) => item.path === opened.path)) rows.unshift(row);
      setBrowse(rows);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [props.openedTick]);

  useEffect(() => {
    if (screen !== "lib") return;
    const targets = roots.filter((root) => !(root in treesRef.current));
    if (targets.length === 0) return;
    let cancelled = false;
    void Promise.all(
      targets.map((root) =>
        listTreeRef
          .current(root)
          .then((files) => ({ root, entries: files.map(asEntry), error: false }))
          .catch(() => ({ root, entries: [] as DirEntry[], error: true })),
      ),
    ).then((results) => {
      if (cancelled) return;
      setTrees((prev) => {
        const next = { ...prev };
        for (const result of results) {
          if (result.root in next) continue;
          next[result.root] = result.entries;
        }
        return next;
      });
      setTreeError((prev) => {
        const next = { ...prev };
        for (const result of results) if (result.error) next[result.root] = true;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [screen, roots]);

  useEffect(() => () => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(hintTimer.current);
    window.clearTimeout(undoTimer.current);
  }, []);

  function thumbOf(row: FileRow) {
    return props.thumbSrc(row.path, row.name);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (isTauri()) return;
    const transfer = event.dataTransfer;
    if (!transfer) return;
    const files = Array.from(transfer.files);
    const count = files.length || Array.from(transfer.items).filter((item) => item.kind === "file").length;
    const names = files.map((file) => file.name);
    const rejected = names.length > 0 && viewFromNames(names, false).phase === "invalid";
    transfer.dropEffect = rejected || props.drag.phase === "invalid" ? "none" : "copy";
    props.onBrowserHover(names, count);
  }

  function onDragLeave(event: DragEvent) {
    if (isTauri()) return;
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    props.onDragIdle();
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    if (isTauri()) return;
    const files = Array.from(event.dataTransfer?.files ?? []);
    const names = files.map((file) => file.name);
    if (names.length === 0 || viewFromNames(names, false).phase === "invalid" || openablePaths(names, false).length === 0) {
      props.onDragIdle();
      return;
    }
    props.onBrowserDrop(files);
  }

  const current = props.current;
  const active = current.kind === "empty" ? null : (browse.find((row) => row.path === current.path) ?? presentFile({ path: current.path, name: current.name }));
  const viewIndex = active ? Math.max(0, browse.findIndex((row) => row.path === active.path)) : 0;
  const audio = current.kind === "media" && extensionOf(current.name) === "mp3";

  return (
    <div
      className="app"
      data-theme={theme}
      data-density={prefs.density}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {screen !== "view" ? (
        <header className="titlebar" data-tauri-drag-region="deep">
          <div className="lights" />
          {screen === "home" ? (
            <div className="title-home">
              <AperioLogo size={18} decorative />
              <span>Aperio</span>
            </div>
          ) : null}
          {screen === "lib" ? (
            <div className="title-place">
              <button type="button" title={upTitle} onClick={goUp}>
                <ChevronLeft />
              </button>
              {place === "all" ? (
                <div>最近打开</div>
              ) : (
                <div className="crumbs">
                  {crumbItems.map((crumb, index) => (
                    <span key={`${crumb.rel}/${crumb.name}`} className="crumb-part">
                      {index > 0 ? <ChevronRight size={12} /> : null}
                      <button
                        type="button"
                        className={index === crumbItems.length - 1 ? "crumb last" : "crumb"}
                        onClick={() => enterDir(crumb.rel)}
                      >
                        {crumb.name}
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <span>{counter}</span>
            </div>
          ) : null}
          {screen === "settings" ? (
            <div className="title-place">
              <button type="button" title="返回" onClick={leaveSettings}>
                <ChevronLeft />
              </button>
              <div>{tabTitle}</div>
            </div>
          ) : null}
          <div className="drag-gap" />
          {screen === "lib" ? (
            <div className="lib-tools">
              {place === "all" && shown.length > 0 ? (
                <button type="button" className="clear-recents" onClick={clearVisible}>
                  清除记录
                </button>
              ) : null}
              <div className="seg icon-seg">
                <button type="button" className={view === "grid" ? "on" : ""} title="网格" onClick={() => setView("grid")}>
                  <GridIcon />
                </button>
                <button type="button" className={view === "list" ? "on" : ""} title="列表" onClick={() => setView("list")}>
                  <ListIcon />
                </button>
              </div>
              <label className="lib-search">
                <SearchIcon size={13} />
                <input value={query} placeholder="搜索" onChange={(event) => setQuery(event.target.value)} />
              </label>
            </div>
          ) : null}
          <button
            type="button"
            className="icon-btn"
            title={screen === "settings" ? "关闭设置" : "设置 ⌘,"}
            onClick={() => (screen === "settings" ? leaveSettings() : openSettings())}
          >
            <SettingsIcon />
          </button>
        </header>
      ) : null}
      <div className="workspace">
        {screen === "home" ? (
          <HomeScreen
            drag={props.drag}
            onSearch={() => setPicker(true)}
            onBrowse={() => go("lib")}
            onRecent={() => {
              setPlace("all");
              setDir("");
              setKind("all");
              setQuery("");
              setSel("");
              setSelDir("");
              go("lib");
            }}
          />
        ) : null}
        {screen === "lib" ? (
          <LibraryScreen
            place={place}
            dir={dir}
            kind={kind}
            view={view}
            roots={rootRows}
            tree={place === "all" ? [] : sideTree(entries, dir)}
            folders={folderCards}
            rows={shown}
            counts={counts}
            selectedFile={selectedFile}
            selectedDir={selectedDir}
            status={libStatus}
            deepNote={deepNote}
            emptyText={emptyText}
            undo={undo?.label ?? ""}
            thumbSrc={thumbOf}
            onRecent={() => {
              setPlace("all");
              setDir("");
              setQuery("");
              setSel("");
              setSelDir("");
            }}
            onRoot={(path) => {
              setPlace(path);
              setDir("");
              setQuery("");
              setSel("");
              setSelDir("");
            }}
            onEnter={enterDir}
            onAdd={() => void addDirectory()}
            onKind={setKind}
            onSelectFile={(path) => {
              setSel(path);
              setSelDir("");
            }}
            onSelectDir={(rel) => {
              setSelDir(rel);
              setSel("");
            }}
            onOpen={(row) => openRow(row, shown)}
            onForget={forget}
            onUndo={undoRecents}
          />
        ) : null}
        {screen === "settings" ? (
          <SettingsScreen
            tab={tab}
            prefs={prefs}
            assoc={assoc}
            onTab={setTab}
            onPref={(key, value) => {
              setPrefs((prev) => ({ ...prev, [key]: value }));
              if (key === "dirView") setView(value as ViewMode);
              if (key === "autoHide") armHide();
            }}
            onAssoc={(key: GroupId, value) => setAssoc((prev) => ({ ...prev, [key]: value }))}
          />
        ) : null}
        {screen === "view" && active ? (
          <ViewerFrame
            name={active.name}
            path={active.path}
            index={viewIndex}
            total={browse.length || 1}
            ground={prefs.ground}
            zen={zen}
            chromeOn={chromeOn}
            edge={edge}
            info={info}
            stripOn={prefs.strip}
            kind={viewKind(current)}
            fit={prefs.fit}
            hint={zenHint}
            fade={stageFade}
            ink={current.kind === "text" && current.mode === "code"}
            video={current.kind === "media" && !audio}
            copyText={current.kind === "text" ? current.text : null}
            scrollable={current.kind === "pdf" || current.kind === "text" || current.kind === "office" || current.kind === "zip"}
            strip={browse}
            infoRows={[
              { k: "名称", v: active.name },
              { k: "类型", v: active.ext },
              { k: "大小", v: active.sizeLabel },
              { k: "规格", v: "—" },
              { k: "修改", v: active.dateLabel },
              { k: "位置", v: locationLabel(active.path) },
            ]}
            thumb={active}
            thumbSrc={thumbOf}
            onWake={wake}
            onEdge={setEdge}
            onLeave={leave}
            onBack={() => go(from === "view" ? "home" : from)}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onFit={(fit) => setPrefs((value) => ({ ...value, fit }))}
            onExtract={props.onExtract}
            onToggleZen={toggleZen}
            onToggleStrip={() => setPrefs((value) => ({ ...value, strip: !value.strip }))}
            onToggleInfo={() => {
              setInfo((open) => !open);
              setChromeOn(true);
            }}
            onReveal={props.onReveal}
            onStrip={(row) => openRow(row, browse)}
          >
            <StageBody current={current} audio={audio} onToggleFit={toggleFit}>
              {props.stage()}
            </StageBody>
          </ViewerFrame>
        ) : null}
      </div>
      {picker ? (
        <PickerDialog query={pq} rows={pickerRows} onQuery={setPq} onOpen={(row) => openRow(row, pickerRows)} onClose={() => setPicker(false)} />
      ) : null}
    </div>
  );
}

function StageBody({
  current,
  audio,
  onToggleFit,
  children,
}: {
  current: Current;
  audio: boolean;
  onToggleFit: () => void;
  children: ReactNode;
}) {
  if (current.kind === "image") {
    return (
      <div className="fill" onDoubleClick={onToggleFit}>
        {children}
      </div>
    );
  }
  if (current.kind === "media") {
    return audio ? (
      <div className="audio-fit">{children}</div>
    ) : (
      <div className="video-wrap" onDoubleClick={onToggleFit}>
        {children}
      </div>
    );
  }
  if (current.kind === "text") {
    return (
      <div className="doc-scroll" data-kind={current.mode}>
        {children}
      </div>
    );
  }
  if (current.kind === "error") return <p className="stage-error">{current.message}</p>;
  if (current.kind === "empty") return null;
  return <div className="fill">{children}</div>;
}
