import { isEnabled } from "../formats/enable";
import { OFFICE_BYTE_LIMIT } from "../formats/office/model";
import { ZIP_BYTE_LIMIT } from "../formats/zip/model";
import { baseName, familyOf, isHeic, isLegacyOffice, isSkippedArchive, languageFor, textMode } from "../formats/route";
import { MSG, TEXT_LIMIT } from "../messages";
import type { Current } from "./session";

export type FileIo = {
  readText: (path: string) => Promise<string>;
  fileUrl: (path: string) => string;
  decodeHeic: (path: string) => Promise<string>;
  confirmFile: (path: string) => Promise<void>;
  retainDecoded?: (path: string) => Promise<void>;
};

export type Opened = {
  current: Current;
  retain?: () => Promise<void>;
};

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message.trim();
  }
  return "";
}

export function explainFailure(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  return messageOf(error) || "打不开";
}

export function assertPlainText(text: string): string {
  if (text.includes("\u0000")) {
    throw new Error(MSG.notText);
  }
  return text;
}

export type BrowserPlan =
  | { kind: "error"; message: string }
  | { kind: "image" | "pdf" | "office" | "zip" | "media" | "text" };

export function browserPlan(name: string, size: number): BrowserPlan {
  if (isSkippedArchive(name)) return { kind: "error", message: MSG.archiveSkipped };
  const family = familyOf(name);
  if ((family !== "unknown" && !isEnabled(family)) || (family === "unknown" && !isEnabled("text"))) {
    return { kind: "error", message: MSG.disabled };
  }
  if (family === "image" && isHeic(name)) return { kind: "error", message: MSG.heicNeedsApp };
  if (family === "image" || family === "pdf" || family === "media") return { kind: family };
  if (family === "office" && isLegacyOffice(name)) return { kind: "error", message: MSG.oldOffice };
  if (family === "office" && size > OFFICE_BYTE_LIMIT) return { kind: "error", message: MSG.officeTooBig };
  if (family === "office") return { kind: "office" };
  if (family === "zip" && size > ZIP_BYTE_LIMIT) return { kind: "error", message: MSG.zipTooBig };
  if (family === "zip") return { kind: "zip" };
  if (size > TEXT_LIMIT) return { kind: "error", message: MSG.tooBig };
  return { kind: "text" };
}

export async function openLocalPath(path: string, io: FileIo): Promise<Opened> {
  const name = baseName(path);
  const family = familyOf(path);
  if (isSkippedArchive(path)) {
    return { current: { kind: "error", path, name, message: MSG.archiveSkipped } };
  }
  if (family !== "unknown" && !isEnabled(family)) {
    return { current: { kind: "error", path, name, message: MSG.disabled } };
  }
  if (family === "unknown" && !isEnabled("text")) {
    return { current: { kind: "error", path, name, message: MSG.disabled } };
  }
  try {
    if (family === "image") {
      await io.confirmFile(path);
      if (isHeic(path)) {
        const decoded = await io.decodeHeic(path);
        return {
          current: { kind: "image", path, name, url: io.fileUrl(decoded) },
          retain: io.retainDecoded ? () => io.retainDecoded!(decoded) : undefined,
        };
      }
      return { current: { kind: "image", path, name, url: io.fileUrl(path) } };
    }
    if (family === "pdf") {
      await io.confirmFile(path);
      return { current: { kind: "pdf", path, name, url: io.fileUrl(path) } };
    }
    if (family === "office") {
      if (isLegacyOffice(path)) {
        return { current: { kind: "error", path, name, message: MSG.oldOffice } };
      }
      await io.confirmFile(path);
      return { current: { kind: "office", path, name, url: io.fileUrl(path) } };
    }
    if (family === "zip" || family === "media") {
      await io.confirmFile(path);
      return { current: { kind: family, path, name, url: io.fileUrl(path) } };
    }
    const text = assertPlainText(await io.readText(path));
    const mode = textMode(path);
    const language = mode === "code" ? languageFor(path) ?? undefined : undefined;
    return { current: { kind: "text", path, name, mode, text, language } };
  } catch (error) {
    return { current: { kind: "error", path, name, message: explainFailure(error) } };
  }
}
