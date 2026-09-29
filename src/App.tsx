import { useEffect, useRef, useState, type ComponentType, type DragEvent } from "react";
import {
  confirmFile,
  decodeHeic,
  fileUrl,
  isTauri,
  pickPath,
  readRecents,
  readText,
  retainDecoded,
  writeRecents,
} from "./bridge";
import { isEnabled } from "./formats/enable";
import { loaderFor } from "./formats/load";
import { OFFICE_BYTE_LIMIT } from "./formats/office/model";
import { familyOf, isHeic, isLegacyOffice, languageFor, textMode } from "./formats/route";
import { MSG, TEXT_LIMIT } from "./messages";
import { createOpenGate } from "./open/gate";
import { assertPlainText, explainFailure, openLocalPath } from "./open/openFile";
import {
  blobUrlOf,
  failOpen,
  recentsAfterOfficeShown,
  recentsAfterOpen,
  reduceOpen,
  type Current,
  type Session,
} from "./open/session";
import { settleOpen } from "./open/settle";
import "./App.css";

type TextProps = {
  name: string;
  mode: "markdown" | "html" | "code" | "plain";
  text: string;
  language?: string;
};

type ImageProps = { url: string; name: string };
type PdfProps = { url: string; onFail: (message: string) => void };
type OfficeProps = { url: string; name: string; onFail: (message: string) => void; onReady: () => void };

export default function App() {
  const [session, setSession] = useState<Session>({ current: { kind: "empty" }, recents: [] });
  const [over, setOver] = useState(false);
  const [ImagePane, setImagePane] = useState<ComponentType<ImageProps> | null>(null);
  const [TextPane, setTextPane] = useState<ComponentType<TextProps> | null>(null);
  const [PdfPane, setPdfPane] = useState<ComponentType<PdfProps> | null>(null);
  const [OfficePane, setOfficePane] = useState<ComponentType<OfficeProps> | null>(null);
  const gateRef = useRef(createOpenGate(!isTauri()));

  function commit(current: Current) {
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

  async function acceptPath(path: string) {
    const started = gateRef.current.push(path);
    if ("queued" in started) return;
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
        for (const path of queued) void acceptPathRef.current(path);
      })
      .catch(() => {
        const queued = gateRef.current.loaded(false);
        for (const path of queued) void acceptPathRef.current(path);
      });
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let gone = false;
    void import("@tauri-apps/api/webview").then(async ({ getCurrentWebview }) => {
      const stop = await getCurrentWebview().onDragDropEvent((event) => {
        const kind = event.payload.type;
        if (kind === "enter" || kind === "over") setOver(true);
        if (kind === "leave") setOver(false);
        if (kind === "drop") {
          setOver(false);
          const path = event.payload.paths[0];
          if (path) void acceptPathRef.current(path);
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
    if (kind !== "image" && kind !== "text" && kind !== "pdf" && kind !== "office") {
      setImagePane(null);
      setTextPane(null);
      setPdfPane(null);
      setOfficePane(null);
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
      else setOfficePane(() => (mod as { default: ComponentType<OfficeProps> }).default);
    });
    return () => {
      cancelled = true;
    };
  }, [session.current.kind]);

  async function acceptFile(file: File) {
    const name = file.name;
    const started = gateRef.current.push(name);
    if ("queued" in started) return;
    const ticket = started.ticket;
    const family = familyOf(name);
    let opened: { current: Current };
    if ((family !== "unknown" && !isEnabled(family)) || (family === "unknown" && !isEnabled("text"))) {
      opened = { current: { kind: "error", path: name, name, message: MSG.disabled } };
    } else if (family === "image" && isHeic(name)) {
      opened = { current: { kind: "error", path: name, name, message: MSG.heicNeedsApp } };
    } else if (family === "image") {
      opened = { current: { kind: "image", path: name, name, url: URL.createObjectURL(file) } };
    } else if (family === "pdf") {
      opened = { current: { kind: "pdf", path: name, name, url: URL.createObjectURL(file) } };
    } else if (family === "office" && isLegacyOffice(name)) {
      opened = { current: { kind: "error", path: name, name, message: MSG.oldOffice } };
    } else if (family === "office" && file.size > OFFICE_BYTE_LIMIT) {
      opened = { current: { kind: "error", path: name, name, message: MSG.officeTooBig } };
    } else if (family === "office") {
      opened = { current: { kind: "office", path: name, name, url: URL.createObjectURL(file) } };
    } else if (file.size > TEXT_LIMIT) {
      opened = { current: { kind: "error", path: name, name, message: MSG.tooBig } };
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

  async function onOpen() {
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

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    if (isTauri()) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void acceptFile(file);
  }

  const current = session.current;

  return (
    <div className="shell">
      <aside>
        <h1>浮现</h1>
        <button type="button" onClick={() => void onOpen()}>
          打开
        </button>
        <p className="label">最近打开</p>
        {session.recents.length === 0 ? (
          <p className="muted">还没有打开过文件</p>
        ) : (
          <ul>
            {session.recents.map((item) => (
              <li key={item.path}>
                <button type="button" onClick={() => void acceptPath(item.path)}>
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <main
        className={over ? "over" : ""}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {current.kind === "image" || current.kind === "text" || current.kind === "pdf" || current.kind === "office" ? (
          <p className="name">{current.name}</p>
        ) : null}
        {current.kind === "empty" ? <p className="drop">把文件拖到这里</p> : null}
        {current.kind === "error" ? <p className="error">{current.message}</p> : null}
        {ImagePane && current.kind === "image" ? <ImagePane url={current.url} name={current.name} /> : null}
        {TextPane && current.kind === "text" ? (
          <TextPane name={current.name} mode={current.mode} text={current.text} language={current.language} />
        ) : null}
        {PdfPane && current.kind === "pdf" ? (
          <PdfPane
            url={current.url}
            onFail={(message) => {
              const url = current.url;
              const blob = blobUrlOf(current);
              if (blob) URL.revokeObjectURL(blob);
              setSession((state) => failOpen(state, url, message));
            }}
          />
        ) : null}
        {OfficePane && current.kind === "office" ? (
          <OfficePane
            url={current.url}
            name={current.name}
            onFail={(message) => {
              const url = current.url;
              const blob = blobUrlOf(current);
              if (blob) URL.revokeObjectURL(blob);
              setSession((state) => failOpen(state, url, message));
            }}
            onReady={() => {
              const path = current.path;
              const name = current.name;
              setSession((state) => {
                const recents = recentsAfterOfficeShown(state, path, name, Date.now());
                if (recents === state.recents) return state;
                if (isTauri() && gateRef.current.canWrite) {
                  void writeRecents(recents).catch(() => undefined);
                }
                return { ...state, recents };
              });
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
