import type { MouseEvent } from "react";
import type { TextMode } from "../route";
import { highlightCode, renderMarkdown } from "./render";

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
};

export function HtmlFrame({ html, name }: { html: string; name: string }) {
  return <iframe data-viewer="text" sandbox="" srcDoc={html} title={name} />;
}

export default function TextView({ name, mode, text, language, lined = false }: TextPayload & { lined?: boolean }) {
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
        dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
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
  return <pre data-viewer="text">{text}</pre>;
}
