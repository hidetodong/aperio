export type PdfViewport = {
  width: number;
  height: number;
};

export type PdfRenderTask = {
  promise: Promise<void>;
  cancel: () => void;
};

export type PdfPage = {
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: { canvas: HTMLCanvasElement; viewport: PdfViewport }) => PdfRenderTask;
};

export type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy: () => Promise<void> | void;
};
