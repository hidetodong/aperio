import { describe, expect, it } from "vitest";
import { recentsAfterOpen, urlsToRevoke, type Session } from "./session";

describe("换文件", () => {
  it("只收回浏览器临时地址", () => {
    const previous = { kind: "image" as const, path: "/a.png", name: "a.png", url: "blob:a" };
    const next = { kind: "text" as const, path: "/b.txt", name: "b.txt", mode: "plain" as const, text: "b" };
    expect(urlsToRevoke(previous, next)).toEqual(["blob:a"]);
    expect(urlsToRevoke({ ...previous, url: "asset://a" }, next)).toEqual([]);
    const pdf = { kind: "pdf" as const, path: "/a.pdf", name: "a.pdf", url: "blob:pdf" };
    expect(urlsToRevoke(pdf, next)).toEqual(["blob:pdf"]);
    expect(urlsToRevoke(pdf, { ...pdf })).toEqual([]);
    const office = { kind: "office" as const, path: "/a.docx", name: "a.docx", url: "blob:office" };
    expect(urlsToRevoke(office, next)).toEqual(["blob:office"]);
    expect(urlsToRevoke(office, { ...office })).toEqual([]);
  });

  it("成功时叠到当前列表上，失败时不动列表", () => {
    const state: Session = {
      current: { kind: "empty" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const added = recentsAfterOpen(
      state,
      { kind: "image", path: "/new.png", name: "new.png", url: "asset://new" },
      2,
    );
    expect(added.map((item) => item.path)).toEqual(["/new.png", "/old.txt"]);
    const kept = recentsAfterOpen(
      state,
      { kind: "error", path: "/gone.png", name: "gone.png", message: "找不到这个文件" },
      3,
    );
    expect(kept).toEqual(state.recents);
  });
});
