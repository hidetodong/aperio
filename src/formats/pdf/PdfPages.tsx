import { useEffect, useRef, useState } from "react";
import { documentHeight, pageOffset, pagesInView, spreadHeight, spreadLayout, PDF_PAGE_GAP, PDF_PAGE_HEIGHT } from "./pages";
import type { PdfDocument, PdfRenderTask } from "./types";

function PageCanvas({
  doc,
  pageNumber,
  top,
  fitWidth,
  lane,
  onHeight,
}: {
  doc: PdfDocument;
  pageNumber: number;
  top: number;
  fitWidth: number;
  lane: "full" | "left" | "right";
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
        const base = page.getViewport({ scale: 1 });
        const fit = fitWidth > 0 && base.width > 0 ? fitWidth / base.width : 1;
        const css = page.getViewport({ scale: fit });
        const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
        const bitmap = page.getViewport({ scale: fit * ratio });
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
  }, [doc, pageNumber, fitWidth]);

  const laneStyle =
    lane === "left" ? { left: 0, width: "50%", right: "auto" } : lane === "right" ? { left: "50%", width: "50%", right: "auto" } : {};
  return (
    <div className="pdf-page" style={{ top, ...laneStyle }}>
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
  fitWidth = 0,
  columns = 1,
}: {
  doc: PdfDocument;
  scrollTop: number;
  viewHeight: number;
  pageHeight?: number;
  gap?: number;
  fitWidth?: number;
  columns?: number;
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

  const paired = columns === 2;
  const layout = paired ? spreadLayout(heights, gap, 2) : [];
  const visible = paired
    ? layout.flatMap((box, index) => (box.row > 0 && box.top + box.row > scrollTop && box.top < scrollTop + viewHeight ? [index + 1] : []))
    : pagesInView({ scrollTop, viewHeight, heights, gap });

  return (
    <div className="pdf-pages" style={{ position: "relative", height: paired ? spreadHeight(layout) : documentHeight(heights, gap) }}>
      {visible.map((pageNumber) => (
        <PageCanvas
          key={pageNumber}
          doc={doc}
          pageNumber={pageNumber}
          top={paired ? (layout[pageNumber - 1]?.top ?? 0) : pageOffset(heights, pageNumber - 1, gap)}
          fitWidth={fitWidth}
          lane={paired ? (pageNumber % 2 === 1 ? "left" : "right") : "full"}
          onHeight={(height) => updateHeight(pageNumber, height)}
        />
      ))}
    </div>
  );
}
