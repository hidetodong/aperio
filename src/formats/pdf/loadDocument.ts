import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { ensurePdfRuntime } from "./pdfPrelude.js";
import type { PdfDocument, PdfRenderTask } from "./types";

function assetUrl(dir: string): string {
  return `${window.location.origin}/pdfjs/${dir}/`;
}

function adapt(raw: PDFDocumentProxy): PdfDocument {
  return {
    numPages: raw.numPages,
    destroy: () => raw.loadingTask.destroy(),
    getPage: async (pageNumber: number) => {
      const page: PDFPageProxy = await raw.getPage(pageNumber);
      return {
        getViewport: (params) => page.getViewport(params),
        render: ({ canvas, viewport }): PdfRenderTask => {
          const task = page.render({
            canvas,
            viewport: viewport as ReturnType<PDFPageProxy["getViewport"]>,
          });
          return { promise: task.promise, cancel: () => task.cancel() };
        },
      };
    },
  };
}

export async function loadPdfDocument(url: string): Promise<PdfDocument> {
  ensurePdfRuntime();
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("/pdfjs/pdf.worker.mjs", window.location.href).href;
  const task = pdfjs.getDocument({
    url,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    cMapUrl: assetUrl("cmaps"),
    cMapPacked: true,
    standardFontDataUrl: assetUrl("standard_fonts"),
    wasmUrl: assetUrl("wasm"),
    iccUrl: assetUrl("iccs"),
    enableXfa: false,
  });
  // 不设置 onPassword。库会把加密文件直接拒绝，而不是停下来等密码。
  // 后台线程创建失败时，库会改在同一线程里解析。
  try {
    return adapt(await task.promise);
  } catch (error) {
    await task.destroy().catch(() => undefined);
    throw error;
  }
}
