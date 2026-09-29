import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Recent } from "./recents";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function pickPath(): Promise<string | null> {
  const picked = await open({ multiple: false, directory: false });
  return typeof picked === "string" ? picked : null;
}

export function fileUrl(path: string): string {
  return convertFileSrc(path);
}

export function readText(path: string): Promise<string> {
  return invoke<string>("read_text", { path });
}

export function decodeHeic(path: string): Promise<string> {
  return invoke<string>("decode_heic_image", { path });
}

export function confirmFile(path: string): Promise<void> {
  return invoke("confirm_file", { path });
}

export function retainDecoded(path: string): Promise<void> {
  return invoke("retain_decoded_image", { path });
}

export function readRecents(): Promise<Recent[]> {
  return invoke<Recent[]>("read_recents");
}

export function writeRecents(items: Recent[]): Promise<void> {
  return invoke("write_recents", { items });
}
