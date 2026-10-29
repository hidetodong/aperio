import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { TextMode } from "../route";
import { MSG } from "../../messages";
import { useLook } from "../../shell/look";
import { highlightCode, plainParagraphs, renderMarkdown } from "./render";

function keepWindow(event: MouseEvent) {
  const node = event.target;
  if (!(node instanceof Node)) return;
  const element = node instanceof Element ? node : node.parentElement;
  if (element?.closest("a")) event.preventDefault();
}

export type TextPayload = {
  name: string;
  mode: TextMode;
  text: string;
  language?: string;
  filePath?: string;
  toFileUrl?: (absolutePath: string) => string;
};

export function HtmlFrame({ html, name }: { html: string; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [blockedFor, setBlockedFor] = useState<string | null>(null);
  useLayoutEffect(() => {
    const parent = host.current;
    if (!parent) return;
    const node = document.createElement("iframe");
    node.title = name;
    node.setAttribute("data-viewer", "text");
    parent.replaceChildren(node);
    const fit = () => {
      const box = parent.getBoundingClientRect();
      const width = `${box.width}px`;
      const height = `${box.height}px`;
      if (node.style.width !== width) node.style.width = width;
      if (node.style.height !== height) node.style.height = height;
    };
    fit();
    // 框交给页面自己插。再交给界面库改隔离属性，会把正文冲成空白页。
    node.setAttribute("sandbox", "");
    if (node.getAttribute("sandbox") !== "") {
      parent.replaceChildren();
      setBlockedFor(html);
      return;
    }
    node.srcdoc = html;
    let cancelled = false;
    // 大页面第一次写进去时画不出来。等这一小会儿，按同样的正文再写一次。
    const timer = window.setTimeout(() => {
      if (cancelled || !node.isConnected || node.getAttribute("sandbox") !== "") return;
      const current = node.srcdoc;
      if (!current) return;
      node.srcdoc = "";
      node.srcdoc = current;
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      parent.replaceChildren();
    };
  }, [html, name]);
  if (blockedFor === html) {
    return (
      <p className="stage-error" data-viewer="text">
        {MSG.htmlUnsafe}
      </p>
    );
  }
  return <div ref={host} className="html-host" />;
}

export default function TextView({ name, mode, text, language, filePath, toFileUrl, lined = false }: TextPayload & { lined?: boolean }) {
  const raw = useLook().raw;
  if ((mode === "markdown" || mode === "html") && raw) {
    return (
      <pre className={mode === "html" ? "html-source" : "md-source"} data-viewer="text">
        {text}
      </pre>
    );
  }
  if (mode === "code" && language && lined) {
    const lines = highlightCode(text, language).split("\n");
    return (
      <div className="code-lines" data-viewer="text">
        {lines.map((line, index) => (
          <div className="code-line" key={index}>
            <span className="code-gutter">{index + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: line.length ? line : " " }} />
          </div>
        ))}
      </div>
    );
  }
  if (mode === "markdown") {
    return (
      <article
        data-viewer="text"
        onClick={keepWindow}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(text, { filePath, toFileUrl }) }}
      />
    );
  }
  if (mode === "html") {
    return <HtmlFrame html={text} name={name} />;
  }
  if (mode === "code" && language) {
    return (
      <pre data-viewer="text">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(text, language) }} />
      </pre>
    );
  }
  const paragraphs = plainParagraphs(text);
  return (
    <article data-viewer="text">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </article>
  );
}
