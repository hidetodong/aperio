import type { ListedFile } from "../bridge";
import type { Recent } from "../recents";

export const DEMO_ROOT = "/Users/cyborgno2/Documents/Aperio 项目";
export const DEMO_DOWNLOADS = "/Users/cyborgno2/Downloads";

export function isDemoRoot(path: string): boolean {
  return path === DEMO_ROOT || path === DEMO_DOWNLOADS;
}

export const DEMO_RECENTS: Recent[] = [
  { path: `${DEMO_ROOT}/设计稿/导出/城市街景.jpg`, name: "城市街景.jpg", openedAt: 1_759_200_000_000 },
  { path: `${DEMO_ROOT}/文档/2026 年度报告.pdf`, name: "2026 年度报告.pdf", openedAt: 1_759_190_000_000 },
  { path: `${DEMO_ROOT}/README.md`, name: "README.md", openedAt: 1_759_100_000_000 },
  { path: `${DEMO_DOWNLOADS}/发布会片段.mp4`, name: "发布会片段.mp4", openedAt: 1_758_900_000_000 },
];

function file(root: string, rel: string, name: string, size: number, modifiedMs: number): ListedFile {
  return { path: `${root}/${rel ? `${rel}/` : ""}${name}`, name, size, modifiedMs, isDir: false, folderCount: 0, fileCount: 0, rel };
}

function dir(root: string, rel: string, name: string, folderCount: number, fileCount: number): ListedFile {
  const path = `${root}/${rel}`;
  return { path, name, size: 0, modifiedMs: 0, isDir: true, folderCount, fileCount, rel };
}

const PROJECT: ListedFile[] = [
  dir(DEMO_ROOT, "设计稿", "设计稿", 2, 3),
  dir(DEMO_ROOT, "设计稿/图标", "图标", 0, 1),
  dir(DEMO_ROOT, "设计稿/导出", "导出", 0, 2),
  dir(DEMO_ROOT, "文档", "文档", 1, 2),
  dir(DEMO_ROOT, "文档/归档", "归档", 0, 1),
  file(DEMO_ROOT, "", "README.md", 3 * 1024, 1_759_100_000_000),
  file(DEMO_ROOT, "", "main.py", 6 * 1024, 1_759_180_000_000),
  file(DEMO_ROOT, "设计稿/图标", "app-icon@2x.png", 184 * 1024, 1_759_160_000_000),
  file(DEMO_ROOT, "设计稿/导出", "城市街景.jpg", 4.2 * 1024 * 1024, 1_759_200_000_000),
  file(DEMO_ROOT, "设计稿/导出", "建筑立面.jpg", 3.7 * 1024 * 1024, 1_758_800_000_000),
  file(DEMO_ROOT, "文档", "2026 年度报告.pdf", 2.8 * 1024 * 1024, 1_759_190_000_000),
  file(DEMO_ROOT, "文档/归档", "会议纪要-0915.md", 4 * 1024, 1_758_200_000_000),
];

const DOWNLOADS: ListedFile[] = [
  dir(DEMO_DOWNLOADS, "素材包", "素材包", 0, 1),
  file(DEMO_DOWNLOADS, "", "发布会片段.mp4", 218 * 1024 * 1024, 1_758_900_000_000),
  file(DEMO_DOWNLOADS, "", "合同扫描件.pdf", 1.1 * 1024 * 1024, 1_758_600_000_000),
  file(DEMO_DOWNLOADS, "素材包", "设计素材.zip", 46.1 * 1024 * 1024, 1_758_700_000_000),
];

export function demoTree(root: string): ListedFile[] {
  if (root === DEMO_ROOT) return PROJECT;
  if (root === DEMO_DOWNLOADS) return DOWNLOADS;
  return [];
}
