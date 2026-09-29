import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PdfView from "./PdfView";
import type { PdfDocument } from "./types";

function fakeDoc(url: string, live: { count: number }, destroyed: string[]): PdfDocument {
  live.count += 1;
  return {
    numPages: 1,
    getPage: async () => ({
      getViewport: () => ({ width: 10, height: 10 }),
      render: () => ({ promise: Promise.resolve(), cancel: () => undefined }),
    }),
    destroy: () => {
      live.count -= 1;
      destroyed.push(url);
    },
  };
}

describe("换一份 PDF", () => {
  it("解析失败时把原因交出去", async () => {
    const onFail = vi.fn();
    render(
      <PdfView
        url="bad.pdf"
        loadDocument={async () => {
          throw "不是 PDF";
        }}
        onFail={onFail}
      />,
    );
    await waitFor(() => expect(onFail).toHaveBeenCalledWith("不是 PDF"));
  });

  it("换走之后释放上一份，同一时间只留一份", async () => {
    const live = { count: 0 };
    const destroyed: string[] = [];
    const loadDocument = (url: string) => Promise.resolve(fakeDoc(url, live, destroyed));
    const { rerender, unmount } = render(<PdfView url="a.pdf" loadDocument={loadDocument} />);
    await waitFor(() => expect(live.count).toBe(1));

    rerender(<PdfView url="b.pdf" loadDocument={loadDocument} />);
    await waitFor(() => expect(destroyed).toContain("a.pdf"));
    await waitFor(() => expect(live.count).toBe(1));
    expect(destroyed.filter((url) => url === "b.pdf")).toEqual([]);

    unmount();
    await waitFor(() => expect(live.count).toBe(0));
    expect(destroyed).toContain("b.pdf");
  });
});
