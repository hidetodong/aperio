import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IDLE_LOOK, LookProvider } from "../../shell/look";
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

  it("打开磁盘上的 Markdown 时，旁边的图走文件地址", () => {
    render(
      <TextView
        name="README.md"
        mode="markdown"
        text="![标](docs/aperio-logo.svg)"
        filePath="/repo/README.md"
        toFileUrl={(path) => `asset://${path}`}
      />,
    );
    expect(document.querySelector("img")?.getAttribute("src")).toBe("asset:///repo/docs/aperio-logo.svg");
  });

  it("原文模式展示 Markdown 原文，不排成文章", () => {
    const source = "# 标题\n\n<script>alert(1)</script>";
    const view = render(
      <LookProvider value={{ ...IDLE_LOOK, raw: true }}>
        <TextView name="a.md" mode="markdown" text={source} />
      </LookProvider>,
    );
    expect(view.container.innerHTML).toContain("md-source");
    expect(view.container.querySelector("article")).toBeNull();
    expect(view.container.querySelector("pre.md-source")?.textContent).toBe(source);
  });

  it("原文模式展示网页源码，不放进框架", () => {
    const source = "<p>页</p><script>alert(1)</script>";
    const view = render(
      <LookProvider value={{ ...IDLE_LOOK, raw: true }}>
        <TextView name="a.html" mode="html" text={source} />
      </LookProvider>,
    );
    expect(view.container.querySelector("iframe")).toBeNull();
    expect(view.container.querySelector("pre.html-source")?.textContent).toBe(source);
  });

  it("渲染模式把网页放进没有脚本权限的框架", () => {
    const view = render(<TextView name="a.html" mode="html" text="<p>页</p>" />);
    expect(view.container.querySelector("pre.html-source")).toBeNull();
    expect(view.container.querySelector("iframe")?.getAttribute("sandbox")).toBe("");
  });
});

describe("纯文本排版", () => {
  it("空行隔开的两段分开显示，段内文字保持原样", () => {
    const view = render(<TextView name="a.txt" mode="plain" text={"甲\n\n乙"} />);
    const paragraphs = [...view.container.querySelectorAll("article p")];
    expect(paragraphs.map((paragraph) => paragraph.textContent)).toEqual(["甲", "乙"]);
    expect(view.container.querySelector("button")).toBeNull();
  });

  it("缩进和单个换行留在同一段里", () => {
    const view = render(<TextView name="a.txt" mode="plain" text={"  甲\n乙"} />);
    expect(view.container.querySelector("article p")?.textContent).toBe("  甲\n乙");
  });

  it("Windows 换行也按空行分段", () => {
    const view = render(<TextView name="a.txt" mode="plain" text={"甲\r\n\r\n乙"} />);
    expect([...view.container.querySelectorAll("article p")].map((paragraph) => paragraph.textContent)).toEqual(["甲", "乙"]);
  });

  it("空文件和只有空行时不造段落", () => {
    const empty = render(<TextView name="a.txt" mode="plain" text="" />);
    expect(empty.container.querySelector("article")).toBeTruthy();
    expect(empty.container.querySelector("p")).toBeNull();
    const blank = render(<TextView name="b.txt" mode="plain" text={"\n\n"} />);
    expect(blank.container.querySelector("p")).toBeNull();
  });

  it("尖括号当文字显示，不当脚本执行", () => {
    const view = render(<TextView name="a.txt" mode="plain" text={"<script>alert(1)</script>"} />);
    expect(view.container.querySelector("script")).toBeNull();
    expect(view.container.querySelector("article p")?.textContent).toBe("<script>alert(1)</script>");
  });

  it("纯文本使用阅读字体、阅读字号和文章段距，专注模式仍换底色", () => {
    const css = readFileSync(join(process.cwd(), "src/App.css"), "utf8");
    expect(css).toMatch(/\.doc-scroll\[data-kind="plain"\] article \{[^}]*font-family: var\(--font-sans\)/);
    expect(css).toMatch(/\.doc-scroll\[data-kind="plain"\] article \{[^}]*white-space: pre-wrap/);
    expect(css).toMatch(/\.doc-scroll\[data-kind="plain"\] article \{[^}]*overflow-wrap: break-word/);
    expect(css).toMatch(
      /\.doc-scroll\[data-kind="markdown"\] article,\s*\.doc-scroll\[data-kind="plain"\] article \{[^}]*font-size: var\(--read-size, 15px\)/,
    );
    expect(css).toMatch(/\.doc-scroll article :is\(p, ul, ol, pre, blockquote\) \{[^}]*margin: 16px 0 0/);
    expect(css).toMatch(
      /\.stage\[data-zen="true"\] \.doc-scroll\[data-kind="markdown"\],\s*\.stage\[data-zen="true"\] \.doc-scroll\[data-kind="plain"\] \{[^}]*background: #f6f3ec/,
    );
    expect(css).not.toContain('.doc-scroll[data-kind="plain"] pre');
  });
});

describe("代码上色", () => {
  it("TypeScript 按关键字上色，并且每一行有行号", () => {
    const view = render(<TextView name="a.ts" mode="code" language="typescript" lined text={"const n = 1;\nlet m = 2;"} />);
    const gutters = [...view.container.querySelectorAll(".code-gutter")];
    expect(gutters.map((gutter) => gutter.textContent)).toEqual(["1", "2"]);
    expect(view.container.querySelector(".hljs-keyword")?.textContent).toBe("const");
  });
});
