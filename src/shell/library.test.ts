import { describe, expect, it } from "vitest";
import { childFolders, countText, crumbs, deepActive, filesUnder, folderMeta, parentRel, sideTree, type DirEntry } from "./library";

const tree: DirEntry[] = [
  { path: "/项目/设计稿", name: "设计稿", size: 0, modifiedMs: 0, isDir: true, folderCount: 2, fileCount: 3, rel: "设计稿" },
  { path: "/项目/设计稿/图标", name: "图标", size: 0, modifiedMs: 0, isDir: true, folderCount: 0, fileCount: 1, rel: "设计稿/图标" },
  { path: "/项目/设计稿/导出", name: "导出", size: 0, modifiedMs: 0, isDir: true, folderCount: 0, fileCount: 2, rel: "设计稿/导出" },
  { path: "/项目/文档", name: "文档", size: 0, modifiedMs: 0, isDir: true, folderCount: 1, fileCount: 2, rel: "文档" },
  { path: "/项目/文档/归档", name: "归档", size: 0, modifiedMs: 0, isDir: true, folderCount: 0, fileCount: 1, rel: "文档/归档" },
  { path: "/项目/README.md", name: "README.md", size: 1, modifiedMs: 3, isDir: false, folderCount: 0, fileCount: 0, rel: "" },
  { path: "/项目/设计稿/图标/a.png", name: "a.png", size: 1, modifiedMs: 2, isDir: false, folderCount: 0, fileCount: 0, rel: "设计稿/图标" },
  { path: "/项目/设计稿/导出/b.jpg", name: "b.jpg", size: 1, modifiedMs: 1, isDir: false, folderCount: 0, fileCount: 0, rel: "设计稿/导出" },
  { path: "/项目/设计稿/导出/c.jpg", name: "c.jpg", size: 1, modifiedMs: 1, isDir: false, folderCount: 0, fileCount: 0, rel: "设计稿/导出" },
];

describe("目录树", () => {
  it("只展开当前路径上的文件夹", () => {
    const rows = sideTree(tree, "设计稿/图标");
    expect(rows.map((row) => row.rel)).toEqual(["设计稿", "设计稿/导出", "设计稿/图标", "文档"]);
    expect(rows.find((row) => row.rel === "设计稿")?.open).toBe(true);
    expect(rows.find((row) => row.rel === "文档")?.open).toBe(false);
    expect(rows.find((row) => row.rel === "设计稿/图标")?.pad).toBe(10 + 2 * 14);
  });

  it("面包屑、计数和文件夹副文按层级来", () => {
    expect(crumbs("Aperio 项目", "设计稿/图标").map((item) => item.name)).toEqual(["Aperio 项目", "设计稿", "图标"]);
    expect(crumbs("Aperio 项目", "设计稿/图标")[1]?.rel).toBe("设计稿");
    expect(parentRel("设计稿/图标")).toBe("设计稿");
    expect(childFolders(tree, "设计稿").map((item) => item.name)).toEqual(["导出", "图标"]);
    expect(filesUnder(tree, "")).toBe(1 + 3 + 2);
    expect(folderMeta(2, 3)).toBe("2 个文件夹 · 3 个文件");
    expect(folderMeta(0, 0)).toBe("空文件夹");
    expect(countText(2, 4)).toBe("2 个文件夹 · 4 个文件");
    expect(countText(0, 4)).toBe("4 个文件");
    expect(deepActive("image", "")).toBe(true);
    expect(deepActive("all", " 报告 ")).toBe(true);
    expect(deepActive("all", "  ")).toBe(false);
  });
});
