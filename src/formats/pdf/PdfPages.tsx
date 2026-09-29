import { useEffect, useRef, useState } from "react";
import { documentHeight, pageOffset, pagesInView, PDF_PAGE_GAP, PDF_PAGE_HEIGHT } from "./pages";
import type { PdfDocument, PdfRenderTask } from "./types";

function PageCanvas({
  doc,
  pageNumber,
  top,
  onHeight,
}: {
  doc: PdfDocument;
  pageNumber: number;
  top: number;
  onHeight: (height: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onHeightRef = useRef(onHeight);
  onHeightRef.current = onHeight;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    let task: PdfRenderTask | null = null;
    void doc
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return;
        const css = page.getViewport({ scale: 1 });
        const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
        const bitmap = ratio === 1 ? css : page.getViewport({ scale: ratio });
        canvas.width = Math.max(1, Math.floor(bitmap.width));
        canvas.height = Math.max(1, Math.floor(bitmap.height));
        canvas.style.width = `${css.width}px`;
        canvas.style.height = `${css.height}px`;
        onHeightRef.current(css.height);
        task = page.render({ canvas, viewport: bitmap });
        return task.promise;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber]);

  return (
    <div className="pdf-page" style={{ top }}>
      <canvas ref={ref} data-page={pageNumber} />
    </div>
  );
}

export function PdfPages({
  doc,
  scrollTop,
  viewHeight,
  pageHeight = PDF_PAGE_HEIGHT,
  gap = PDF_PAGE_GAP,
}: {
  doc: PdfDocument;
  scrollTop: number;
  viewHeight: number;
  pageHeight?: number;
  gap?: number;
}) {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: doc.numPages }, () => pageHeight));

  useEffect(() => {
    setHeights(Array.from({ length: doc.numPages }, () => pageHeight));
  }, [doc, pageHeight]);

  function updateHeight(pageNumber: number, height: number) {
    setHeights((prev) => {
      const index = pageNumber - 1;
      if (Math.abs((prev[index] ?? 0) - height) < 1) return prev;
      const next = prev.slice();
      next[index] = height;
      return next;
    });
  }

  const visible = pagesInView({ scrollTop, viewHeight, heights, gap });

  return (
    <div className="pdf-pages" style={{ position: "relative", height: documentHeight(heights, gap) }}>
      {visible.map((pageNumber) => (
        <PageCanvas
          key={pageNumber}
          doc={doc}
          pageNumber={pageNumber}
          top={pageOffset(heights, pageNumber - 1, gap)}
          onHeight={(height) => updateHeight(pageNumber, height)}
        />
      ))}
    </div>
  );
}
