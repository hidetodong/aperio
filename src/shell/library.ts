import type { ListedFile } from "../bridge";
import type { KindId } from "./catalog";

export type DirEntry = {
  path: string;
  name: string;
  size: number;
  modifiedMs: number;
  isDir: boolean;
  folderCount: number;
  fileCount: number;
  rel: string;
};

export type SideFolder = {
  rel: string;
  name: string;
  path: string;
  depth: number;
  hasKids: boolean;
  open: boolean;
  pad: number;
};

export type Crumb = { name: string; rel: string };

const ROOTS_KEY = "aperio.roots";
const LEGACY_ROOTS_KEY = "emerge.roots";

export function asEntry(file: ListedFile): DirEntry {
  return {
    path: file.path,
    name: file.name,
    size: file.size,
    modifiedMs: file.modifiedMs,
    isDir: Boolean(file.isDir),
    folderCount: file.folderCount ?? 0,
    fileCount: file.fileCount ?? 0,
    rel: file.rel ?? "",
  };
}

function readRootsRaw(): string | null {
  const current = localStorage.getItem(ROOTS_KEY);
  if (current !== null) return current;
  const legacy = localStorage.getItem(LEGACY_ROOTS_KEY);
  if (legacy === null) return null;
  localStorage.setItem(ROOTS_KEY, legacy);
  localStorage.removeItem(LEGACY_ROOTS_KEY);
  return legacy;
}

export function loadRoots(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const data = JSON.parse(readRootsRaw() ?? "null") as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is string => typeof item === "string" && item.startsWith("/"));
  } catch {
    return [];
  }
}

export function saveRoots(roots: string[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ROOTS_KEY, JSON.stringify(roots));
}

export function parentRel(rel: string): string {
  const cut = rel.lastIndexOf("/");
  return cut < 0 ? "" : rel.slice(0, cut);
}

export function under(child: string, parent: string): boolean {
  if (!parent) return true;
  return child === parent || child.startsWith(`${parent}/`);
}

export function deepActive(kind: KindId, query: string): boolean {
  return kind !== "all" || query.trim().length > 0;
}

export function joinPath(root: string, rel: string): string {
  const base = root.replace(/\/+$/, "");
  return rel ? `${base}/${rel}` : base;
}

export function rootName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function displayPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const users = parts.indexOf("Users");
  if (users >= 0 && parts.length >= users + 2) {
    const rest = parts.slice(users + 2);
    return rest.length ? `~/${rest.join("/")}` : "~";
  }
  return path;
}

export function crumbs(rootLabel: string, rel: string): Crumb[] {
  const parts = rel ? rel.split("/").filter(Boolean) : [];
  return [rootLabel, ...parts].map((name, index) => ({
    name,
    rel: parts.slice(0, index).join("/"),
  }));
}

export function folderMeta(folderCount: number, fileCount: number): string {
  const bits = [folderCount ? `${folderCount} 个文件夹` : "", fileCount ? `${fileCount} 个文件` : ""].filter(Boolean);
  return bits.join(" · ") || "空文件夹";
}

export function countText(folderCount: number, fileCount: number): string {
  return (folderCount ? `${folderCount} 个文件夹 · ` : "") + `${fileCount} 个文件`;
}

export function filesUnder(entries: DirEntry[], rel: string): number {
  const direct = entries.filter((entry) => !entry.isDir && entry.rel === rel).length;
  const nested = entries
    .filter((entry) => entry.isDir && parentRel(entry.rel) === rel)
    .reduce((sum, entry) => sum + entry.fileCount, 0);
  return direct + nested;
}

export function childFolders(entries: DirEntry[], rel: string): DirEntry[] {
  return entries
    .filter((entry) => entry.isDir && parentRel(entry.rel) === rel)
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));
}

export function sideTree(entries: DirEntry[], currentRel: string): SideFolder[] {
  const folders = entries.filter((entry) => entry.isDir);
  return folders
    .filter((folder) => {
      const parent = parentRel(folder.rel);
      return parent === "" || under(currentRel, parent);
    })
    .sort((a, b) => a.rel.localeCompare(b.rel, "zh"))
    .map((folder) => {
      const depth = folder.rel.split("/").filter(Boolean).length;
      const hasKids = folders.some((other) => parentRel(other.rel) === folder.rel);
      return {
        rel: folder.rel,
        name: folder.name,
        path: folder.path,
        depth,
        hasKids,
        open: hasKids && under(currentRel, folder.rel),
        pad: 10 + depth * 14,
      };
    });
}

export function filesIn(entries: DirEntry[], rel: string, deep: boolean): DirEntry[] {
  return entries
    .filter((entry) => !entry.isDir && (deep ? under(entry.rel, rel) : entry.rel === rel))
    .sort((a, b) => b.modifiedMs - a.modifiedMs || a.name.localeCompare(b.name, "zh"));
}
