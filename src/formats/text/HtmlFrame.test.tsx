import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HtmlFrame } from "./TextView";

describe("HTML 框架", () => {
  it("不给脚本权限", () => {
    render(<HtmlFrame html="<p>页</p><script>alert(1)</script>" name="页" />);
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("sandbox")).toBe("");
    expect(frame?.getAttribute("srcdoc")).toContain("页");
    expect(frame?.getAttribute("data-viewer")).toBe("text");
  });
});
