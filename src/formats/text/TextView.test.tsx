import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TextView from "./TextView";

describe("Markdown 链接", () => {
  it("点击链接不把窗口带走", () => {
    render(<TextView name="a.md" mode="markdown" text="[外站](https://example.com)" />);
    const link = document.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(fireEvent.click(link!)).toBe(false);
    const text = link?.firstChild;
    expect(text).toBeTruthy();
    const onText = new MouseEvent("click", { bubbles: true, cancelable: true });
    text?.dispatchEvent(onText);
    expect(onText.defaultPrevented).toBe(true);
  });
});
