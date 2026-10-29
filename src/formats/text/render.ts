import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";
import { marked } from "marked";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("python", python);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);

function plain(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const REMOTE_SRC = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export function directoryOf(filePath: string): string | null {
  if (!filePath.startsWith("/")) return null;
  const slash = filePath.lastIndexOf("/");
  return slash <= 0 ? "/" : filePath.slice(0, slash);
}

export function resolveLocalImage(baseDir: string, src: string): string | null {
  if (REMOTE_SRC.test(src)) return null;
  let decoded = src;
  try {
    decoded = decodeURI(src);
  } catch {
    return null;
  }
  if (REMOTE_SRC.test(decoded)) return null;
  const absolute = decoded.startsWith("/") ? decoded : `${baseDir.replace(/\/+$/, "")}/${decoded.replace(/^\.\/+/, "")}`;
  const parts: string[] = [];
  for (const segment of absolute.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

function rewriteLocalImages(html: string, baseDir: string, toFileUrl: (absolutePath: string) => string): string {
  const holder = new DOMParser().parseFromString("<div></div>", "text/html").body.firstElementChild;
  if (!(holder instanceof HTMLDivElement)) return html;
  holder.innerHTML = html;
  for (const image of holder.querySelectorAll("img")) {
    const src = image.getAttribute("src");
    if (!src) continue;
    const absolute = resolveLocalImage(baseDir, src);
    if (!absolute) continue;
    try {
      image.setAttribute("src", toFileUrl(absolute));
    } catch {
      // 地址转换失败时留着原地址，文章其余部分照常显示。
    }
  }
  return holder.innerHTML;
}

export function renderMarkdown(
  source: string,
  options?: { filePath?: string; toFileUrl?: (absolutePath: string) => string },
): string {
  if (typeof DOMPurify.sanitize !== "function" || !DOMPurify.isSupported) {
    return plain(source);
  }
  const raw = marked.parse(source, { async: false }) as string;
  const clean = DOMPurify.sanitize(raw);
  const html = typeof clean === "string" ? clean : plain(source);
  const baseDir = options?.filePath ? directoryOf(options.filePath) : null;
  if (!baseDir || !options?.toFileUrl) return html;
  return rewriteLocalImages(html, baseDir, options.toFileUrl);
}

export function highlightCode(source: string, language: string): string {
  return hljs.highlight(source, { language, ignoreIllegals: true }).value;
}

export function plainParagraphs(source: string): string[] {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.split(/\n(?:[ \t]*\n)+/).filter((part) => part.length > 0);
}
