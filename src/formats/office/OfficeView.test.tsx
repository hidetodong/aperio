import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OfficeBody } from "./OfficeBody";
import OfficeView from "./OfficeView";
import type { OfficeModel } from "./model";

describe("Office 画面", () => {
  it("表格格子和截断说明都出现，多张表可以换", () => {
    const { container } = render(
      <OfficeBody
        model={{
          kind: "table",
          truncated: true,
          sheets: [
            { name: "表一", rows: [["苹果"]] },
            { name: "表二", rows: [["香蕉"]] },
          ],
        }}
      />,
    );
    expect(container.textContent).toContain("苹果");
    expect(container.textContent).toContain("后面还有，这一段只显示前 2000 行");
    fireEvent.click(container.querySelectorAll("button")[1]!);
    expect(container.textContent).toContain("香蕉");
    expect(container.textContent).not.toContain("苹果");
  });

  it("解析失败时把原因交出去", async () => {
    const onFail = vi.fn();
    const onReady = vi.fn();
    render(
      <OfficeView
        url="blob:bad"
        name="a.csv"
        loadOffice={async () => {
          throw "文件坏了";
        }}
        onFail={onFail}
        onReady={onReady}
      />,
    );
    await waitFor(() => expect(onFail).toHaveBeenCalledWith("文件坏了"));
    expect(onReady).not.toHaveBeenCalled();
  });

  it("换文件后上一份正文不留，正文出现才通知可以记入最近列表", async () => {
    const ready: string[] = [];
    const loadOffice = async (_url: string, name: string): Promise<OfficeModel> => ({
      kind: "prose",
      paragraphs: [name === "a.docx" ? "旧段落" : "新段落"],
    });
    const { container, rerender } = render(
      <OfficeView url="blob:a" name="a.docx" loadOffice={loadOffice} onReady={() => ready.push("a.docx")} />,
    );
    await waitFor(() => expect(container.textContent).toContain("旧段落"));
    expect(ready).toEqual(["a.docx"]);
    rerender(<OfficeView url="blob:b" name="b.docx" loadOffice={loadOffice} onReady={() => ready.push("b.docx")} />);
    await waitFor(() => expect(container.textContent).toContain("新段落"));
    expect(container.textContent).not.toContain("旧段落");
    expect(ready).toEqual(["a.docx", "b.docx"]);
  });

  it("卸掉之后晚到的失败不交出去", async () => {
    let rejectLoad: (error: unknown) => void = () => undefined;
    const onFail = vi.fn();
    const { unmount } = render(
      <OfficeView
        url="blob:a"
        name="a.docx"
        onFail={onFail}
        loadOffice={() =>
          new Promise((_resolve, reject) => {
            rejectLoad = reject;
          })
        }
      />,
    );
    unmount();
    rejectLoad(new Error("晚到"));
    await Promise.resolve();
    expect(onFail).not.toHaveBeenCalled();
  });
});
