import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  confirmFile,
  decodeHeic,
  fileUrl,
  extractZip,
  isTauri,
  listDirectory,
  listTree,
  pickDirectory,
  pickPath,
  readRecents,
  readText,
  retainDecoded,
  revealInFinder,
  writeRecents,
} from "./bridge";
import { loaderFor } from "./formats/load";
import { baseName, languageFor, textMode } from "./formats/route";
import { createOpenGate } from "./open/gate";
import { assertPlainText, browserPlan, explainFailure, openLocalPath } from "./open/openFile";
import {
  blobUrlOf,
  failOpen,
  recentsAfterOpen,
  recentsAfterShown,
  reduceOpen,
  type Current,
  type Session,
} from "./open/session";
import { settleOpen } from "./open/settle";
import { canThumb } from "./shell/catalog";
import { demoTree } from "./shell/libraryDemo";
import {
  hoverUnknown,
  IDLE_DRAG,
  invalidDrag,
  openablePaths,
  sameDrag,
  viewFromNames,
  type DragView,
  type DropIntent,
} from "./shell/homeDrag";
import { Shell } from "./shell/Shell";
import "./App.css";

type TextProps = {
  name: string;
  mode: "markdown" | "html" | "code" | "plain";
  text: string;
  language?: string;
  lined?: boolean;
};

type ImageProps = { url: string; name: string };
type PdfProps = { url: string; onFail: (message: string) => void };
type OfficeProps = { url: string; name: string; onFail: (message: string) => void; onReady: () => void };
type ZipProps = { url: string; name: string; onFail: (message: string) => void; onReady: () => void };
type MediaProps = { url: string; name: string; bare?: boolean; onFail: (message: string) => void; onReady: () => void };

export default function App() {
  const [session, setSession] = useState<Session>({ current: { kind: "empty" }, recents: [] });
  const [drag, setDrag] = useState<DragView>(IDLE_DRAG);
  const dragGen = useRef(0);
  const dropTimer = useRef(0);
  const dropping = useRef(false);
  const blocked = useRef<Set<string>>(new Set());
  const armed = useRef<DropIntent | null>(null);
  const dropIntent = useRef<DropIntent | null>(null);
  const [ready, setReady] = useState(!isTauri());
  const [bootOpen, setBootOpen] = useState(false);
  const [openedTick, setOpenedTick] = useState(0);
  const [ImagePane, setImagePane] = useState<ComponentType<ImageProps> | null>(null);
  const [TextPane, setTextPane] = useState<ComponentType<TextProps> | null>(null);
  const [PdfPane, setPdfPane] = useState<ComponentType<PdfProps> | null>(null);
  const [OfficePane, setOfficePane] = useState<ComponentType<OfficeProps> | null>(null);
  const [ZipPane, setZipPane] = useState<ComponentType<ZipProps> | null>(null);
  const [MediaPane, setMediaPane] = useState<ComponentType<MediaProps> | null>(null);
  const gateRef = useRef(createOpenGate(!isTauri()));

  function commit(current: Current) {
    setOpenedTick((tick) => tick + 1);
    setSession((state) => {
      const recents = recentsAfterOpen(state, current, Date.now());
      const reduced = reduceOpen(state, { current, recents });
      for (const url of reduced.revoke) URL.revokeObjectURL(url);
      if (isTauri() && gateRef.current.canWrite && reduced.session.recents !== state.recents) {
        void writeRecents(reduced.session.recents).catch(() => undefined);
      }
      return reduced.session;
    });
  }

  const commitRef = useRef(commit);
  commitRef.current = commit;

  function assignDrag(next: DragView) {
    setDrag((prev) => (sameDrag(prev, next) ? prev : next));
  }

  function takeArmed(): DropIntent | null {
    const intent = armed.current;
    armed.current = null;
    return intent;
  }

  async function acceptPath(path: string) {
    const started = gateRef.current.push(path);
    const intent = takeArmed();
    if ("queued" in started) {
      dropping.current = false;
      assignDrag(IDLE_DRAG);
      return;
    }
    if (intent) dropIntent.current = intent;
    const next = await openLocalPath(path, {
      readText,
      fileUrl,
      decodeHeic,
      confirmFile,
      retainDecoded,
    });
    const ticket = started.ticket;
    await settleOpen(
      () => gateRef.current.finish(ticket),
      next,
      (current) => commitRef.current(current),
    );
  }

  const acceptPathRef = useRef(acceptPath);
  acceptPathRef.current = acceptPath;

  useEffect(() => {
    if (!isTauri()) return;
    void readRecents()
      .then((recents) => {
        setSession((state) => ({ ...state, recents }));
        const queued = gateRef.current.loaded(true);
        setBootOpen(queued.length > 0);
        setReady(true);
        for (const path of queued) void acceptPathRef.current(path);
      })
      .catch(() => {
        const queued = gateRef.current.loaded(false);
        setBootOpen(queued.length > 0);
        setReady(true);
        for (const path of queued) void acceptPathRef.current(path);
      });
  }, []);

  function resetDrag() {
    window.clearTimeout(dropTimer.current);
    dropping.current = false;
    blocked.current = new Set();
    assignDrag(IDLE_DRAG);
  }

  async function inspectPaths(paths: string[], gen: number) {
    const found = new Map<string, string>();
    await Promise.all(
      paths.map(async (path) => {
        const known = openablePaths([path], true).length === 0 ? viewFromNames([path], true).reason : null;
        if (known) {
          found.set(path, known);
          return;
        }
        try {
          await confirmFile(path);
        } catch (error) {
          found.set(path, explainFailure(error));
        }
      }),
    );
    if (gen !== dragGen.current || dropping.current) return;
    blocked.current = new Set(found.keys());
    if (paths.length > 0 && found.size === paths.length) {
      assignDrag(invalidDrag(paths.length, baseName(paths[0] ?? ""), found.get(paths[0] ?? "") ?? ""));
    }
  }

  function beginDrop(view: DragView, open: () => void) {
    dropping.current = true;
    assignDrag({ ...view, phase: "dropping" });
    window.clearTimeout(dropTimer.current);
    dropTimer.current = window.setTimeout(() => {
      open();
    }, 300);
  }

  useEffect(() => () => window.clearTimeout(dropTimer.current), []);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let gone = false;
    void import("@tauri-apps/api/webview").then(async ({ getCurrentWebview }) => {
      const stop = await getCurrentWebview().onDragDropEvent((event) => {
        const kind = event.payload.type;
        if (kind === "enter") {
          const paths = event.payload.paths;
          const gen = ++dragGen.current;
          blocked.current = new Set();
          assignDrag(viewFromNames(paths, true));
          void inspectPaths(paths, gen);
        } else if (kind === "over") {
          setDrag((prev) => (prev.phase === "idle" ? hoverUnknown(0) : prev));
        } else if (kind === "leave") {
          if (dropping.current) return;
          dragGen.current += 1;
          resetDrag();
        } else if (kind === "drop") {
          dragGen.current += 1;
          const paths = event.payload.paths;
          const view = viewFromNames(paths, true);
          const openable = openablePaths(paths, true, blocked.current);
          if (view.phase === "invalid" || openable.length === 0) {
            resetDrag();
            return;
          }
          beginDrop(view, () => {
            armed.current = { paths: openable.length > 1 ? openable : null, fade: true };
            const first = openable[0];
            if (first) void acceptPathRef.current(first);
          });
        }
      });
      if (gone) stop();
      else unlisten = stop;
    });
    return () => {
      gone = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    const kind = session.current.kind;
    if (kind !== "image" && kind !== "text" && kind !== "pdf" && kind !== "office" && kind !== "zip" && kind !== "media") {
      setImagePane(null);
      setTextPane(null);
      setPdfPane(null);
      setOfficePane(null);
      setZipPane(null);
      setMediaPane(null);
      return;
    }
    const load = loaderFor(kind);
    if (!load) return;
    let cancelled = false;
    void load().then((mod) => {
      if (cancelled) return;
      if (kind === "image") setImagePane(() => (mod as { default: ComponentType<ImageProps> }).default);
      else if (kind === "text") setTextPane(() => (mod as { default: ComponentType<TextProps> }).default);
      else if (kind === "pdf") setPdfPane(() => (mod as { default: ComponentType<PdfProps> }).default);
      else if (kind === "office") setOfficePane(() => (mod as { default: ComponentType<OfficeProps> }).default);
      else if (kind === "zip") setZipPane(() => (mod as { default: ComponentType<ZipProps> }).default);
      else setMediaPane(() => (mod as { default: ComponentType<MediaProps> }).default);
    });
    return () => {
      cancelled = true;
    };
  }, [session.current.kind]);

  async function acceptFile(file: File) {
    const name = file.name;
    const started = gateRef.current.push(name);
    const intent = takeArmed();
    if ("queued" in started) {
      dropping.current = false;
      assignDrag(IDLE_DRAG);
      return;
    }
    if (intent) dropIntent.current = intent;
    const ticket = started.ticket;
    const plan = browserPlan(name, file.size);
    let opened: { current: Current };
    if (plan.kind === "error") {
      opened = { current: { kind: "error", path: name, name, message: plan.message } };
    } else if (plan.kind !== "text") {
      opened = { current: { kind: plan.kind, path: name, name, url: URL.createObjectURL(file) } };
    } else {
      try {
        const text = assertPlainText(await file.text());
        const mode = textMode(name);
        opened = {
          current: {
            kind: "text",
            path: name,
            name,
            mode,
            text,
            language: mode === "code" ? languageFor(name) ?? undefined : undefined,
          },
        };
      } catch (error) {
        opened = { current: { kind: "error", path: name, name, message: explainFailure(error) } };
      }
    }
    let adopted = false;
    await settleOpen(
      () => gateRef.current.finish(ticket),
      opened,
      (current) => {
        adopted = true;
        commitRef.current(current);
      },
    );
    const blob = blobUrlOf(opened.current);
    if (!adopted && blob) URL.revokeObjectURL(blob);
  }

  async function onPick() {
    if (isTauri()) {
      const path = await pickPath();
      if (path) await acceptPath(path);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void acceptFile(file);
    };
    input.click();
  }

  function rememberShown(kind: "office" | "zip" | "media", path: string, name: string) {
    setSession((state) => {
      const recents = recentsAfterShown(state, kind, path, name, Date.now());
      if (recents === state.recents) return state;
      if (isTauri() && gateRef.current.canWrite) {
        void writeRecents(recents).catch(() => undefined);
      }
      return { ...state, recents };
    });
  }

  const current = session.current;

  function fail(url: string, message: string) {
    const blob = blobUrlOf(current);
    if (blob) URL.revokeObjectURL(blob);
    setSession((state) => failOpen(state, url, message));
  }

  return (
    <Shell
      current={current}
      recents={session.recents}
      ready={ready}
      bootOpen={bootOpen}
      drag={drag}
      openedTick={openedTick}
      onOpenPath={(path) => void acceptPath(path)}
      onOpenFile={(file) => void acceptFile(file)}
      onPickPath={() => void onPick()}
      onReveal={(path) => {
        if (isTauri() && path.startsWith("/")) void revealInFinder(path).catch(() => undefined);
      }}
      onChangeRecents={(next) => {
        setSession((state) => {
          if (isTauri() && gateRef.current.canWrite) void writeRecents(next).catch(() => undefined);
          return { ...state, recents: next };
        });
      }}
      onListTree={(path) => (isTauri() ? listTree(path) : Promise.resolve(demoTree(path)))}
      onPickDirectory={async () => {
        if (!isTauri()) return null;
        return pickDirectory();
      }}
      onExtract={async () => {
        if (!isTauri() || current.kind !== "zip" || !current.path.startsWith("/")) return "cancel";
        const dest = await pickDirectory();
        if (!dest) return "cancel";
        await extractZip(current.path, dest);
        return "ok";
      }}
      onListDirectory={(path) => listDirectory(path)}
      onBrowserHover={(names, count) => {
        if (dropping.current) return;
        assignDrag(names.length > 0 ? viewFromNames(names, false) : hoverUnknown(count));
      }}
      onBrowserDrop={(files) => {
        const names = files.map((file) => file.name);
        const view = viewFromNames(names, false);
        const openable = files.filter((file) => openablePaths([file.name], false).length > 0);
        if (view.phase === "invalid" || openable.length === 0) {
          resetDrag();
          return;
        }
        beginDrop(view, () => {
          const file = openable[0];
          if (!file) {
            resetDrag();
            return;
          }
          armed.current = { paths: null, fade: true };
          void acceptFile(file);
        });
      }}
      onDragIdle={(force) => {
        if (dropping.current && !force) return;
        resetDrag();
      }}
      takeDropIntent={() => {
        const intent = dropIntent.current;
        dropIntent.current = null;
        return intent;
      }}
      thumbSrc={(path, name) => (isTauri() && path.startsWith("/") && canThumb(name) ? fileUrl(path) : null)}
      stage={() => (
        <>
          {ImagePane && current.kind === "image" ? <ImagePane url={current.url} name={current.name} /> : null}
          {TextPane && current.kind === "text" ? (
            <TextPane name={current.name} mode={current.mode} text={current.text} language={current.language} lined={current.mode === "code"} />
          ) : null}
          {PdfPane && current.kind === "pdf" ? <PdfPane url={current.url} onFail={(message) => fail(current.url, message)} /> : null}
          {OfficePane && current.kind === "office" ? (
            <OfficePane
              url={current.url}
              name={current.name}
              onFail={(message) => fail(current.url, message)}
              onReady={() => rememberShown("office", current.path, current.name)}
            />
          ) : null}
          {ZipPane && current.kind === "zip" ? (
            <ZipPane
              url={current.url}
              name={current.name}
              onFail={(message) => fail(current.url, message)}
              onReady={() => rememberShown("zip", current.path, current.name)}
            />
          ) : null}
          {MediaPane && current.kind === "media" ? (
            <MediaPane
              url={current.url}
              name={current.name}
              bare
              onFail={(message) => fail(current.url, message)}
              onReady={() => rememberShown("media", current.path, current.name)}
            />
          ) : null}
        </>
      )}
    />
  );
}
