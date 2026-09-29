import { isEnabled } from "../formats/enable";
import { baseName, familyOf, isHeic, isLegacyOffice, languageFor, textMode } from "../formats/route";
import { MSG } from "../messages";
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

export async function openLocalPath(path: string, io: FileIo): Promise<Opened> {
  const name = baseName(path);
  const family = familyOf(path);
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
    const text = assertPlainText(await io.readText(path));
    const mode = textMode(path);
    const language = mode === "code" ? languageFor(path) ?? undefined : undefined;
    return { current: { kind: "text", path, name, mode, text, language } };
  } catch (error) {
    return { current: { kind: "error", path, name, message: explainFailure(error) } };
  }
}
