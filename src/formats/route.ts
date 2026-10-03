const IMAGE = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"]);
const OFFICE = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv"]);
const MEDIA = new Set(["mp4", "mov", "mp3"]);

const CODE: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  py: "python",
  go: "go",
  rs: "rust",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
  css: "css",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
};

export type Family = "image" | "text" | "pdf" | "office" | "zip" | "media" | "unknown";
export type TextMode = "markdown" | "html" | "code" | "plain";

export function baseName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

export function extensionOf(path: string): string {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function familyOf(path: string): Family {
  const ext = extensionOf(path);
  if (IMAGE.has(ext)) return "image";
  if (
    ext === "md" ||
    ext === "markdown" ||
    ext === "txt" ||
    ext === "html" ||
    ext === "htm" ||
    ext in CODE
  ) {
    return "text";
  }
  if (ext === "pdf") return "pdf";
  if (OFFICE.has(ext)) return "office";
  if (ext === "zip") return "zip";
  if (MEDIA.has(ext)) return "media";
  return "unknown";
}

export function languageFor(path: string): string | null {
  return CODE[extensionOf(path)] ?? null;
}

export function textMode(path: string): TextMode {
  const ext = extensionOf(path);
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "html" || ext === "htm") return "html";
  if (languageFor(path)) return "code";
  return "plain";
}

export function isLegacyOffice(path: string): boolean {
  const ext = extensionOf(path);
  return ext === "doc" || ext === "xls" || ext === "ppt";
}

const SKIPPED_ARCHIVE = new Set(["tar", "gz", "tgz", "gzip"]);

export function isSkippedArchive(path: string): boolean {
  return SKIPPED_ARCHIVE.has(extensionOf(path));
}

export function isHeic(path: string): boolean {
  const ext = extensionOf(path);
  return ext === "heic" || ext === "heif";
}
