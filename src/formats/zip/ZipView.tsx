import { useEffect, useRef, useState, type ComponentType } from "react";
import { explainFailure } from "../../open/openFile";
import type { TextPayload } from "../text/TextView";
import { MSG } from "../../messages";
import { readZip, type ZipList, type ZipPreview } from "./readZip";

type ImagePane = ComponentType<{ url: string; name: string }>;
type TextPane = ComponentType<TextPayload>;
type PdfPane = ComponentType<{ url: string; onFail?: (message: string) => void }>;

type ZipViewers = {
  image?: ImagePane;
  text?: TextPane;
  pdf?: PdfPane;
};

type Shown =
  | { kind: "text"; pane: TextPane; payload: TextPayload }
  | { kind: "image"; pane: ImagePane; url: string; name: string }
  | { kind: "pdf"; pane: PdfPane; url: string };

function defaultCreateUrl(bytes: Uint8Array, mime: string): string {
  return URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
}

async function loadZipFromUrl(url: string): Promise<ZipList> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("打不开");
  return readZip(await response.arrayBuffer());
}

function ZipSession({
  url,
  loadZip = loadZipFromUrl,
  viewers,
  createUrl = defaultCreateUrl,
  revokeUrl = URL.revokeObjectURL,
  onFail,
  onReady,
}: {
  url: string;
  loadZip?: (url: string) => Promise<ZipList>;
  viewers?: ZipViewers;
  createUrl?: (bytes: Uint8Array, mime: string) => string;
  revokeUrl?: (url: string) => void;
  onFail?: (message: string) => void;
  onReady?: () => void;
}) {
  const onFailRef = useRef(onFail);
  const onReadyRef = useRef(onReady);
  onFailRef.current = onFail;
  onReadyRef.current = onReady;
  const [list, setList] = useState<ZipList | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [innerError, setInnerError] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);
  const ticketRef = useRef(0);

  function dropBlob() {
    if (!blobRef.current) return;
    revokeUrl(blobRef.current);
    blobRef.current = null;
  }

  useEffect(() => {
    let cancelled = false;
    void loadZip(url)
      .then((next) => {
        if (cancelled) return;
        setList(next);
        onReadyRef.current?.();
      })
      .catch((error: unknown) => {
        if (!cancelled) onFailRef.current?.(explainFailure(error));
      });
    return () => {
      cancelled = true;
      ticketRef.current += 1;
      dropBlob();
    };
  }, [url, loadZip, revokeUrl]);

  async function openEntry(name: string) {
    if (!list) return;
    const ticket = ticketRef.current + 1;
    ticketRef.current = ticket;
    setShown(null);
    setInnerError(null);
    dropBlob();
    let preview: ZipPreview;
    try {
      preview = await list.preview(name);
    } catch (error) {
      if (ticket === ticketRef.current) setInnerError(explainFailure(error));
      return;
    }
    if (ticket !== ticketRef.current) return;
    if (preview.kind === "note") {
      setInnerError(preview.message);
      return;
    }
    if (preview.kind === "text") {
      const pane = viewers?.text ?? (await import("../text/TextView")).default;
      if (ticket !== ticketRef.current) return;
      setShown({ kind: "text", pane, payload: preview });
      return;
    }
    const mime = preview.kind === "pdf" ? "application/pdf" : preview.mime;
    const innerUrl = createUrl(preview.bytes, mime);
    if (ticket !== ticketRef.current) {
      revokeUrl(innerUrl);
      return;
    }
    blobRef.current = innerUrl;
    if (preview.kind === "image") {
      const pane = viewers?.image ?? (await import("../image/ImageView")).default;
      if (ticket !== ticketRef.current) return;
      setShown({ kind: "image", pane, url: innerUrl, name: preview.name });
      return;
    }
    const pane = viewers?.pdf ?? (await import("../pdf/PdfView")).default;
    if (ticket !== ticketRef.current) return;
    setShown({ kind: "pdf", pane, url: innerUrl });
  }

  return (
    <div className="zip-scroll" data-viewer="zip">
      {list ? (
        <>
          {list.entries.length === 0 ? <p className="muted">{MSG.zipEmpty}</p> : null}
          <ul className="zip-list">
            {list.entries.map((entry) => (
              <li key={entry.name}>
                {entry.dir ? (
                  <span>{entry.name}</span>
                ) : (
                  <button type="button" onClick={() => void openEntry(entry.name)}>
                    {entry.name}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {list.truncated ? <p className="muted">{MSG.zipListTruncated}</p> : null}
          {innerError ? <p className="error">{innerError}</p> : null}
          {shown?.kind === "text" ? <shown.pane {...shown.payload} /> : null}
          {shown?.kind === "image" ? <shown.pane url={shown.url} name={shown.name} /> : null}
          {shown?.kind === "pdf" ? (
            <shown.pane
              url={shown.url}
              onFail={(message) => {
                dropBlob();
                setShown(null);
                setInnerError(message);
              }}
            />
          ) : null}
        </>
      ) : (
        <p className="muted">正在打开</p>
      )}
    </div>
  );
}

export default function ZipView(props: {
  url: string;
  name: string;
  loadZip?: (url: string) => Promise<ZipList>;
  viewers?: ZipViewers;
  createUrl?: (bytes: Uint8Array, mime: string) => string;
  revokeUrl?: (url: string) => void;
  onFail?: (message: string) => void;
  onReady?: () => void;
}) {
  return <ZipSession key={`${props.url}\0${props.name}`} {...props} />;
}
