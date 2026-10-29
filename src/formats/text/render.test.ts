import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { highlightCode, renderMarkdown, resolveLocalImage } from "./render";

describe("文本渲染", () => {
  it("Markdown 去掉脚本和事件", () => {
    const html = renderMarkdown("你好\n\n<script>alert(1)</script>\n\n<img src=x onerror=\"alert(1)\">");
    expect(html).toContain("你好");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onerror");
  });

  it("同一目录和上级目录的图换成文件地址，外链保持原样", () => {
    const html = renderMarkdown("![标](docs/aperio-logo.svg)\n\n![上](../pic.png)\n\n![徽](https://img.shields.io/badge/x-y-blue)", {
      filePath: "/repo/README.md",
      toFileUrl: (path) => `asset://${path}`,
    });
    expect(html).toContain('src="asset:///repo/docs/aperio-logo.svg"');
    expect(html).toContain('src="asset:///pic.png"');
    expect(html).toContain('src="https://img.shields.io/badge/x-y-blue"');
  });

  it("地址转换失败时留着原来的相对路径", () => {
    const html = renderMarkdown("![标](docs/aperio-logo.svg)", {
      filePath: "/repo/README.md",
      toFileUrl: () => {
        throw new Error("没有文件地址");
      },
    });
    expect(html).toContain('src="docs/aperio-logo.svg"');
  });

  it("没有磁盘路径时不改图片地址", () => {
    const html = renderMarkdown("![标](docs/aperio-logo.svg)", {
      filePath: "inside/README.md",
      toFileUrl: (path) => `asset://${path}`,
    });
    expect(html).toContain('src="docs/aperio-logo.svg"');
  });

  it("带空格的文件名会先解开再拼路径", () => {
    expect(resolveLocalImage("/repo", "docs/my%20logo.svg")).toBe("/repo/docs/my logo.svg");
  });

  it("图片名单放行 https，脚本名单仍然只有自己", () => {
    const config = readFileSync(join(process.cwd(), "src-tauri/tauri.conf.json"), "utf8");
    expect(config).toContain("img-src 'self' https:");
    expect(config).toContain("script-src 'self'");
    expect(config).not.toContain("script-src 'self' https:");
  });

  it("文章标题、表格和链接有单独的样式", () => {
    const css = readFileSync(join(process.cwd(), "src/App.css"), "utf8");
    expect(css).toContain(".doc-scroll article h1");
    expect(css).toContain(".doc-scroll article h2");
    expect(css).toMatch(/\.doc-scroll article h1 \{[^}]*font-size: var\(--text-lg, 20px\)/);
    expect(css).toMatch(/\.doc-scroll article h2 \{[^}]*font-size: 17px/);
    expect(css).toContain(".doc-scroll article table");
    expect(css).toContain("border: 1px solid #e6e6ea");
    expect(css).toContain("color: var(--accent, #2f6fd1)");
    expect(css).toMatch(/\.doc-scroll article :is\(h1, h2, h3\) \{[^}]*color: #1d1d1f/);
    expect(css).toMatch(/\.doc-scroll article th \{[^}]*background: #f7f7f5/);
    expect(css).toMatch(/\.doc-scroll article th \{[^}]*color: #1d1d1f/);
  });

  it("约定语言能高亮，结果里没有原文的尖括号被当成标签", () => {
    const html = highlightCode("const name = '<b>';", "javascript");
    expect(html).toContain("hljs-");
    expect(html).not.toContain("<b>");
  });
});
