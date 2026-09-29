import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PdfPages } from "./PdfPages";
import type { PdfDocument } from "./types";

function fakeDoc(pageCount: number, drawn: number[]): PdfDocument {
  return {
    numPages: pageCount,
    destroy: () => undefined,
    getPage: async (pageNumber) => ({
      getViewport: () => ({ width: 100, height: 200 }),
      render: () => {
        drawn.push(pageNumber);
        return { promise: Promise.resolve(), cancel: () => undefined };
      },
    }),
  };
}

describe("视口里的画布", () => {
  it("五页文档先只画第一页，滚到末页后第一页的画布不留", async () => {
    const drawn: number[] = [];
    const doc = fakeDoc(5, drawn);
    const { rerender, container } = render(
      <PdfPages doc={doc} scrollTop={0} viewHeight={200} pageHeight={200} gap={12} />,
    );
    await waitFor(() => expect(container.querySelectorAll("canvas")).toHaveLength(1));
    expect(container.querySelector("canvas")?.getAttribute("data-page")).toBe("1");
    expect(drawn).toContain(1);

    rerender(<PdfPages doc={doc} scrollTop={4 * 212} viewHeight={200} pageHeight={200} gap={12} />);
    await waitFor(() => expect(container.querySelector("canvas")?.getAttribute("data-page")).toBe("5"));
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(container.querySelector('[data-page="1"]')).toBeNull();
    expect(drawn).toContain(5);
  });

  it("视口高度还是零时不画任何页", () => {
    const drawn: number[] = [];
    const { container } = render(<PdfPages doc={fakeDoc(5, drawn)} scrollTop={0} viewHeight={0} pageHeight={200} />);
    expect(container.querySelectorAll("canvas")).toHaveLength(0);
    expect(drawn).toEqual([]);
  });
});
