import { describe, expect, it } from "vitest";
import { highlightCode, renderMarkdown } from "./render";

describe("文本渲染", () => {
  it("Markdown 去掉脚本和事件", () => {
    const html = renderMarkdown("你好\n\n<script>alert(1)</script>\n\n<img src=x onerror=\"alert(1)\">");
    expect(html).toContain("你好");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onerror");
  });

  it("约定语言能高亮，结果里没有原文的尖括号被当成标签", () => {
    const html = highlightCode("const name = '<b>';", "javascript");
    expect(html).toContain("hljs-");
    expect(html).not.toContain("<b>");
  });
});
