import JSZip from "jszip";
import { MSG, TEXT_LIMIT } from "../../messages";
import { explainFailure } from "../../open/openFile";
import { extensionOf, familyOf, isHeic, languageFor, textMode, type TextMode } from "../route";
import { ZIP_ENTRY_CAP, zipEntryTooBig, zipTooBig } from "./model";

export type ZipEntry = { name: string; dir: boolean };

export type ZipPreview =
  | { kind: "text"; name: string; mode: TextMode; text: string; language?: string }
  | { kind: "image"; name: string; bytes: Uint8Array; mime: string }
  | { kind: "pdf"; name: string; bytes: Uint8Array }
  | { kind: "note"; message: string };

export type ZipList = {
  entries: ZipEntry[];
  truncated: boolean;
  preview(name: string): Promise<ZipPreview>;
};

export function explainZipLoad(error: unknown): string {
  const text = explainFailure(error);
  if (text === MSG.zipTooBig) return text;
  if (/encrypted/i.test(text)) return MSG.zipEncrypted;
  return MSG.notZip;
}

function declaredUncompressedSize(file: JSZip.JSZipObject): number | null {
  const data = (file as unknown as { _data?: { uncompressedSize?: unknown } })._data;
  const size = data?.uncompressedSize;
  return typeof size === "number" && Number.isFinite(size) && size >= 0 ? size : null;
}

function mimeFor(name: string): string {
  const ext = extensionOf(name);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "application/octet-stream";
}

export async function previewZipEntry(file: JSZip.JSZipObject): Promise<ZipPreview> {
  if (file.dir || isHeic(file.name)) {
    return { kind: "note", message: isHeic(file.name) ? MSG.zipHeic : MSG.zipInnerSkipped };
  }
  const family = familyOf(file.name);
  if (family !== "text" && family !== "image" && family !== "pdf") {
    return { kind: "note", message: MSG.zipInnerSkipped };
  }
  const declared = declaredUncompressedSize(file);
  if (declared != null && zipEntryTooBig(declared)) {
    return { kind: "note", message: MSG.zipEntryTooBig };
  }
  const bytes = await file.async("uint8array");
  if (zipEntryTooBig(bytes.byteLength)) return { kind: "note", message: MSG.zipEntryTooBig };
  if (family === "text") {
    if (bytes.byteLength > TEXT_LIMIT) return { kind: "note", message: MSG.tooBig };
    const text = new TextDecoder().decode(bytes);
    if (text.includes("\u0000")) return { kind: "note", message: MSG.notText };
    const mode = textMode(file.name);
    return {
      kind: "text",
      name: file.name,
      mode,
      text,
      language: mode === "code" ? languageFor(file.name) ?? undefined : undefined,
    };
  }
  if (family === "image") return { kind: "image", name: file.name, bytes, mime: mimeFor(file.name) };
  return { kind: "pdf", name: file.name, bytes };
}

export async function readZip(bytes: ArrayBuffer): Promise<ZipList> {
  if (zipTooBig(bytes.byteLength)) throw new Error(MSG.zipTooBig);
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    throw new Error(explainZipLoad(error));
  }
  const all: ZipEntry[] = [];
  zip.forEach((_path, file) => {
    all.push({ name: file.name, dir: file.dir });
  });
  all.sort((left, right) => left.name.localeCompare(right.name, "zh"));
  const truncated = all.length > ZIP_ENTRY_CAP;
  const entries = truncated ? all.slice(0, ZIP_ENTRY_CAP) : all;
  const visible = new Set(entries.filter((entry) => !entry.dir).map((entry) => entry.name));
  return {
    entries,
    truncated,
    async preview(name: string) {
      if (!visible.has(name)) return { kind: "note", message: MSG.zipInnerSkipped };
      const file = zip.file(name);
      if (!file || file.dir) return { kind: "note", message: MSG.zipInnerSkipped };
      return previewZipEntry(file);
    },
  };
}
