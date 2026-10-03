import { useLayoutEffect, useRef } from "react";
import { KINDS, type FileRow, type KindId, type ViewMode } from "./catalog";
import { ClockIcon, CloseIcon, FileTypeIcon, FolderGlyph } from "./icons";
import { folderMeta, type DirEntry, type SideFolder } from "./library";
import { Thumb } from "./thumbs";

export function LibraryScreen({
  place,
  dir,
  kind,
  view,
  roots,
  tree,
  folders,
  rows,
  counts,
  selectedFile,
  selectedDir,
  status,
  deepNote,
  emptyText,
  undo,
  thumbSrc,
  onRecent,
  onRoot,
  onEnter,
  onAdd,
  onKind,
  onSelectFile,
  onSelectDir,
  onOpen,
  onForget,
  onUndo,
}: {
  place: string;
  dir: string;
  kind: KindId;
  view: ViewMode;
  roots: { path: string; name: string; count: number; title: string; hasKids: boolean }[];
  tree: SideFolder[];
  folders: DirEntry[];
  rows: FileRow[];
  counts: Record<KindId, number>;
  selectedFile: string;
  selectedDir: string;
  status: "idle" | "loading" | "ready" | "error";
  deepNote: string;
  emptyText: string;
  undo: string;
  thumbSrc: (row: FileRow) => string | null;
  onRecent: () => void;
  onRoot: (path: string) => void;
  onEnter: (rel: string) => void;
  onAdd: () => void;
  onKind: (kind: KindId) => void;
  onSelectFile: (path: string) => void;
  onSelectDir: (rel: string) => void;
  onOpen: (row: FileRow) => void;
  onForget: (path: string) => void;
  onUndo: () => void;
}) {
  const recent = place === "all";
  const showFolders = !recent && !deepNote;
  const empty = rows.length === 0 && (!showFolders || folders.length === 0) && status !== "loading";
  return (
    <div className="lib-screen">
      <aside className="side">
        <div className="side-group">
          <button type="button" className={recent ? "side-row dir on" : "side-row dir"} onClick={onRecent}>
            <ClockIcon size={15} />
            最近打开
          </button>
        </div>
        <div className="side-group">
          <div className="side-head">
            <div className="side-label">已打开的目录</div>
            <button type="button" className="side-plus" title="打开目录… ⇧⌘O" onClick={onAdd}>
              <FolderPlus />
            </button>
          </div>
          {roots.map((root) => {
            const current = place === root.path;
            const atRoot = current && !dir;
            return (
              <div key={root.path}>
                <button
                  type="button"
                  title={root.title}
                  className={atRoot ? "side-row dir root on" : current ? "side-row dir root bold" : "side-row dir root"}
                  onClick={() => onRoot(root.path)}
                >
                  <TreeChevron open={current && root.hasKids} hidden={!root.hasKids} />
                  <FolderGlyph size={15} />
                  <ScrollName className="side-name" text={root.name} on={atRoot} />
                  <span className="side-count">{root.count}</span>
                </button>
                {current
                  ? tree.map((node) => (
                      <button
                        key={node.rel}
                        type="button"
                        title={node.path}
                        className={dir === node.rel ? "side-row dir child on" : "side-row dir child"}
                        style={{ paddingLeft: node.pad }}
                        onClick={() => onEnter(node.rel)}
                      >
                        <TreeChevron open={node.open} hidden={!node.hasKids} />
                        <FolderGlyph size={14} />
                        <ScrollName className="side-name" text={node.name} on={dir === node.rel} />
                      </button>
                    ))
                  : null}
              </div>
            );
          })}
          <button type="button" className="side-row add-dir" onClick={onAdd}>
            <FolderGlyph size={15} stroke={1.8} fillOpacity={0} plus />
            打开目录…
          </button>
        </div>
        <div className="side-group">
          <div className="side-label">类型</div>
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={kind === item.id ? "side-row kind on" : "side-row kind"}
              onClick={() => onKind(item.id)}
            >
              <span>{item.label}</span>
              <span className="side-count">{counts[item.id]}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="lib-main">
        <div className="lib-scroll">
        {deepNote ? <div className="lib-note">{deepNote}</div> : null}
        {status === "loading" ? <p className="lib-empty">正在读取</p> : null}
        {empty && status === "error" ? <p className="lib-empty">读不了这个目录</p> : null}
        {empty && status !== "error" ? <p className="lib-empty">{emptyText}</p> : null}
        {view === "grid" && (rows.length > 0 || (showFolders && folders.length > 0)) ? (
          <div className="lib-grid">
            {showFolders
              ? folders.map((folder) => (
                  <div
                    key={folder.rel}
                    className={folder.rel === selectedDir ? "lib-cell on" : "lib-cell"}
                    onClick={() => onSelectDir(folder.rel)}
                    onDoubleClick={() => onEnter(folder.rel)}
                  >
                    <div className="folder-thumb">
                      <FolderGlyph size={56} stroke={1} fillOpacity={1} strokeColor="#b9b5ad" />
                      <span className="thumb-tag">文件夹</span>
                    </div>
                    <div className="lib-copy">
                      <ScrollName className="lib-name" text={folder.name} on={folder.rel === selectedDir} />
                      <div className="lib-meta">{folderMeta(folder.folderCount, folder.fileCount)}</div>
                    </div>
                  </div>
                ))
              : null}
            {rows.map((row) => (
              <div
                key={row.path}
                className={row.path === selectedFile ? "lib-cell on" : "lib-cell"}
                onClick={() => onSelectFile(row.path)}
                onDoubleClick={() => onOpen(row)}
              >
                <div className="thumb-wrap">
                  <Thumb row={row} src={thumbSrc(row)} height={120} radius={9} />
                  {recent && row.path === selectedFile ? (
                    <button type="button" className="forget-x" title="从最近打开中移除 ⌫" onClick={(event) => { event.stopPropagation(); onForget(row.path); }}>
                      <CloseIcon />
                    </button>
                  ) : null}
                </div>
                <div className="lib-copy">
                  <ScrollName className="lib-name" text={row.name} on={row.path === selectedFile} />
                  <div className="lib-meta">{row.sizeLabel}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {view === "list" && (rows.length > 0 || (showFolders && folders.length > 0)) ? (
          <div className="lib-list">
            <div className="lib-list-head">
              <span>名称</span>
              <span>类型</span>
              <span>大小</span>
              <span>修改日期</span>
            </div>
            {showFolders
              ? folders.map((folder) => (
                  <div
                    key={folder.rel}
                    className={folder.rel === selectedDir ? "lib-list-row on" : "lib-list-row"}
                    onClick={() => onSelectDir(folder.rel)}
                    onDoubleClick={() => onEnter(folder.rel)}
                  >
                    <span className="lib-list-name">
                      <FolderGlyph size={22} stroke={1.5} fillOpacity={0.16} />
                      <ScrollName className="list-name" text={folder.name} on={folder.rel === selectedDir} />
                    </span>
                    <span>文件夹</span>
                    <span className="lib-span">{folderMeta(folder.folderCount, folder.fileCount)}</span>
                  </div>
                ))
              : null}
            {rows.map((row) => (
              <div
                key={row.path}
                className={row.path === selectedFile ? "lib-list-row on" : "lib-list-row"}
                onClick={() => onSelectFile(row.path)}
                onDoubleClick={() => onOpen(row)}
              >
                <span className="lib-list-name">
                  <FileTypeIcon name={row.name} />
                  <ScrollName className="list-name" text={row.name} on={row.path === selectedFile} />
                </span>
                <span>{row.ext}</span>
                <span>{row.sizeLabel}</span>
                <span className="lib-date">
                  {row.dateLabel}
                  {recent ? (
                    <button type="button" className="row-x" title="从最近打开中移除 ⌫" onClick={(event) => { event.stopPropagation(); onForget(row.path); }}>
                      <CloseIcon />
                    </button>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        </div>
        {undo ? (
          <div className="lib-toast">
            <div>
              <span>{undo}</span>
              <button type="button" onClick={onUndo}>
                撤销
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScrollName({ text, className, on }: { text: string; className: string; on: boolean }) {
  const clipRef = useRef<HTMLSpanElement>(null);
  const runRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const clip = clipRef.current;
    const run = runRef.current;
    if (!clip || !run) return;

    const apply = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      run.style.maxWidth = "none";
      const overflow = Math.ceil(run.scrollWidth - clip.clientWidth);
      run.style.removeProperty("max-width");
      if (!on || reduce || overflow <= 2) {
        run.classList.remove("scroll");
        run.style.removeProperty("--name-shift");
        run.style.removeProperty("--name-time");
        return;
      }
      const shift = `-${overflow}px`;
      if (run.style.getPropertyValue("--name-shift") !== shift) {
        const seconds = Math.min(24, Math.max(7, overflow / 5.8)).toFixed(2);
        run.style.setProperty("--name-shift", shift);
        run.style.setProperty("--name-time", `${seconds}s`);
      }
      run.classList.add("scroll");
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(clip);
    return () => observer.disconnect();
  }, [text, on]);

  return (
    <span ref={clipRef} className={`${className} name-clip`}>
      <span ref={runRef} className="name-run">
        {text}
      </span>
    </span>
  );
}

function TreeChevron({ open, hidden }: { open: boolean; hidden: boolean }) {
  return (
    <svg
      className="tree-chev"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? "rotate(90deg)" : "none", opacity: hidden ? 0 : 1 }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function FolderPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
