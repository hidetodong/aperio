import { useEffect, useRef, useState } from "react";
import { explainFailure } from "../../open/openFile";
import { useLook } from "../../shell/look";
import { loadPdfDocument } from "./loadDocument";
import { PdfPages } from "./PdfPages";
import type { PdfDocument } from "./types";

function PdfSession({
  url,
  loadDocument = loadPdfDocument,
  onFail,
}: {
  url: string;
  loadDocument?: (url: string) => Promise<PdfDocument>;
  onFail?: (message: string) => void;
}) {
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;
  const look = useLook();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [frame, setFrame] = useState({ scrollTop: 0, viewHeight: 0, fitWidth: 0 });
  const columns = look.spread === "double" && !look.zen ? 2 : 1;
  const scale = look.pz / 100;
  const inner = look.zen ? Math.min(frame.fitWidth, 720 * scale) : frame.fitWidth * scale;
  const pageWidth = columns === 2 ? Math.max(0, (inner - 12) / 2) : inner;
  const gap = look.zen ? 28 : 1;

  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDocument | null = null;
    void loadDocument(url)
      .then((next) => {
        if (cancelled) {
          void next.destroy();
          return;
        }
        loaded = next;
        setDoc(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) onFailRef.current?.(explainFailure(error));
      });
    return () => {
      cancelled = true;
      const dying = loaded;
      loaded = null;
      setDoc(null);
      if (dying) void dying.destroy();
    };
  }, [url, loadDocument]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const read = () => setFrame({ scrollTop: el.scrollTop, viewHeight: el.clientHeight, fitWidth: el.clientWidth });
    read();
    el.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(read);
      observer.observe(el);
    }
    return () => {
      el.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="pdf-scroll" ref={scrollerRef} data-viewer="pdf" data-pages={doc?.numPages ?? 0}>
      {doc ? (
        <PdfPages
          doc={doc}
          scrollTop={frame.scrollTop}
          viewHeight={frame.viewHeight}
          fitWidth={pageWidth}
          gap={gap}
          columns={columns}
        />
      ) : (
        <p className="muted">正在打开</p>
      )}
    </div>
  );
}

export default function PdfView(props: {
  url: string;
  loadDocument?: (url: string) => Promise<PdfDocument>;
  onFail?: (message: string) => void;
}) {
  return <PdfSession key={props.url} {...props} />;
}
