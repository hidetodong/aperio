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

export type ListedFile = {
  path: string;
  name: string;
  size: number;
  modifiedMs: number;
  isDir?: boolean;
  folderCount?: number;
  fileCount?: number;
  rel?: string;
};

export function listPlace(place: string): Promise<ListedFile[]> {
  return invoke<ListedFile[]>("list_place", { place });
}

export function listDirectory(path: string): Promise<ListedFile[]> {
  return invoke<ListedFile[]>("list_directory", { path });
}

export function listTree(path: string): Promise<ListedFile[]> {
  return invoke<ListedFile[]>("list_tree", { path });
}

export async function pickDirectory(): Promise<string | null> {
  const picked = await open({ multiple: false, directory: true });
  return typeof picked === "string" ? picked : null;
}

export function extractZip(archive: string, dest: string): Promise<void> {
  return invoke("extract_zip", { archive, dest });
}

export function revealInFinder(path: string): Promise<void> {
  return invoke("reveal_in_finder", { path });
}
