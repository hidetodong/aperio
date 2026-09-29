import { describe, expect, it } from "vitest";
import { MSG } from "../messages";
import { assertPlainText, explainFailure, openLocalPath, type FileIo } from "./openFile";
import { failOpen, recentsAfterOfficeShown, recentsAfterOpen, reduceOpen, type Session } from "./session";

function io(partial: Partial<FileIo> = {}): FileIo {
  return {
    readText: async () => "正文",
    fileUrl: (path) => `asset://${path}`,
    decodeHeic: async (path) => `${path}.png`,
    confirmFile: async () => undefined,
    ...partial,
  };
}

describe("打开文件", () => {
  it("图片和文本会替换当前内容，并记入最近列表", async () => {
    const image = await openLocalPath("/tmp/a.jpg", io());
    expect(image.current).toMatchObject({ kind: "image", name: "a.jpg", url: "asset:///tmp/a.jpg" });
    const withImage: Session = { current: { kind: "empty" }, recents: [] };
    const imageRecents = recentsAfterOpen(withImage, image.current, 5);
    expect(imageRecents[0]?.path).toBe("/tmp/a.jpg");

    const text = await openLocalPath("/tmp/a.md", io());
    const state: Session = { current: image.current, recents: imageRecents };
    const folded = recentsAfterOpen(state, text.current, 6);
    const reduced = reduceOpen(state, { current: text.current, recents: folded });
    expect(reduced.session.current).toMatchObject({ kind: "text", text: "正文", mode: "markdown" });
    expect(JSON.stringify(reduced.session.current)).not.toContain("a.jpg");
    expect(reduced.session.recents.map((item) => item.path)).toEqual(["/tmp/a.md", "/tmp/a.jpg"]);
  });

  it("HEIC 先解码再给地址，并带上清理动作", async () => {
    const kept: string[] = [];
    const opened = await openLocalPath("/tmp/a.heic", io({
      retainDecoded: async (path) => {
        kept.push(path);
      },
    }));
    expect(opened.current).toMatchObject({ kind: "image", url: "asset:///tmp/a.heic.png" });
    await opened.retain?.();
    expect(kept).toEqual(["/tmp/a.heic.png"]);
  });

  it("关掉的格式不读文件，也不确认文件", async () => {
    let reads = 0;
    let checks = 0;
    const opened = await openLocalPath("/tmp/a.zip", io({
      readText: async () => {
        reads += 1;
        return "no";
      },
      confirmFile: async () => {
        checks += 1;
      },
    }));
    expect(opened.current).toMatchObject({ kind: "error", message: MSG.disabled });
    expect(reads).toBe(0);
    expect(checks).toBe(0);
  });

  it("字符串拒绝时显示原文，并清掉上一份", async () => {
    const previous: Session = {
      current: { kind: "text", path: "/old.txt", name: "old.txt", mode: "plain", text: "旧内容" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const failed = await openLocalPath("/missing.txt", io({
      readText: async () => {
        throw MSG.tooBig;
      },
    }));
    const recents = recentsAfterOpen(previous, failed.current, 2);
    const reduced = reduceOpen(previous, { current: failed.current, recents });
    expect(reduced.session.current).toMatchObject({ kind: "error", message: MSG.tooBig });
    expect(JSON.stringify(reduced.session)).not.toContain("旧内容");
    expect(reduced.session.recents).toEqual(previous.recents);
  });

  it("缺了的图片不进最近列表", async () => {
    const previous: Session = {
      current: { kind: "text", path: "/old.txt", name: "old.txt", mode: "plain", text: "旧内容" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const failed = await openLocalPath("/gone.jpg", io({
      confirmFile: async () => {
        throw MSG.notFound;
      },
    }));
    const recents = recentsAfterOpen(previous, failed.current, 2);
    const reduced = reduceOpen(previous, { current: failed.current, recents });
    expect(reduced.session.current).toMatchObject({ kind: "error", message: MSG.notFound });
    expect(JSON.stringify(reduced.session)).not.toContain("旧内容");
    expect(reduced.session.recents).toEqual(previous.recents);
  });

  it("没有扩展名的文本按原文打开", async () => {
    const opened = await openLocalPath("/tmp/README", io({ readText: async () => "说明" }));
    expect(opened.current).toMatchObject({ kind: "text", mode: "plain", text: "说明", name: "README" });
  });

  it("带空字节的内容不当文本", () => {
    expect(() => assertPlainText("a\u0000b")).toThrow(MSG.notText);
  });

  it("PDF 只交本地地址，不读成文本，成功也不进最近列表", async () => {
    let reads = 0;
    const previous: Session = {
      current: { kind: "text", path: "/old.txt", name: "old.txt", mode: "plain", text: "旧内容" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const opened = await openLocalPath("/tmp/a.pdf", io({
      readText: async () => {
        reads += 1;
        return "no";
      },
    }));
    const recents = recentsAfterOpen(previous, opened.current, 2);
    const reduced = reduceOpen(previous, { current: opened.current, recents });
    expect(opened.current).toMatchObject({ kind: "pdf", name: "a.pdf", url: "asset:///tmp/a.pdf" });
    expect(reads).toBe(0);
    expect(JSON.stringify(reduced.session.current)).not.toContain("旧内容");
    expect(reduced.session.recents).toEqual(previous.recents);
  });

  it("PDF 文件不在时显示原因，最近列表不动，上一份不留", async () => {
    const previous: Session = {
      current: { kind: "text", path: "/old.txt", name: "old.txt", mode: "plain", text: "旧内容" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const failed = await openLocalPath("/gone.pdf", io({
      confirmFile: async () => {
        throw MSG.notFound;
      },
    }));
    const recents = recentsAfterOpen(previous, failed.current, 2);
    const reduced = reduceOpen(previous, { current: failed.current, recents });
    expect(reduced.session.current).toMatchObject({ kind: "error", message: MSG.notFound });
    expect(JSON.stringify(reduced.session)).not.toContain("旧内容");
    expect(reduced.session.recents).toEqual(previous.recents);
  });

  it("PDF 解析失败后换成原因，晚到的失败不盖住下一份", () => {
    const opened: Session = {
      current: { kind: "pdf", path: "/tmp/a.pdf", name: "a.pdf", url: "asset:///tmp/a.pdf" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const failed = failOpen(opened, "asset:///tmp/a.pdf", "不是 PDF");
    expect(failed.current).toMatchObject({ kind: "error", message: "不是 PDF", name: "a.pdf" });
    expect(failed.recents).toEqual(opened.recents);
    expect("url" in failed.current).toBe(false);
    const next: Session = {
      current: { kind: "image", path: "/b.png", name: "b.png", url: "asset:///b.png" },
      recents: opened.recents,
    };
    expect(failOpen(next, "asset:///tmp/a.pdf", "不是 PDF")).toBe(next);
  });

  it("带原文的失败对象也显示原文", () => {
    expect(explainFailure({ message: "No password given" })).toBe("No password given");
  });

  it("Word 只交本地地址，正文出现后才进最近列表，上一份正文不留", async () => {
    let reads = 0;
    let checks = 0;
    const previous: Session = {
      current: { kind: "text", path: "/old.txt", name: "old.txt", mode: "plain", text: "旧内容" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const opened = await openLocalPath("/tmp/a.docx", io({
      readText: async () => {
        reads += 1;
        return "no";
      },
      confirmFile: async () => {
        checks += 1;
      },
    }));
    const pending = recentsAfterOpen(previous, opened.current, 2);
    const reduced = reduceOpen(previous, { current: opened.current, recents: pending });
    expect(opened.current).toMatchObject({ kind: "office", name: "a.docx", url: "asset:///tmp/a.docx" });
    expect(reads).toBe(0);
    expect(checks).toBe(1);
    expect(JSON.stringify(reduced.session.current)).not.toContain("旧内容");
    expect(reduced.session.recents).toEqual(previous.recents);
    const shown = recentsAfterOfficeShown(reduced.session, "/tmp/a.docx", "a.docx", 3);
    expect(shown.map((item) => item.path)).toEqual(["/tmp/a.docx", "/old.txt"]);
    const late = recentsAfterOfficeShown(
      { current: { kind: "error", path: "/tmp/a.docx", name: "a.docx", message: "这不是 Word 文档" }, recents: previous.recents },
      "/tmp/a.docx",
      "a.docx",
      4,
    );
    expect(late).toEqual(previous.recents);
  });

  it("旧的 Word、Excel、PPT 说明先不看，不去读也不确认", async () => {
    let reads = 0;
    let checks = 0;
    const probe = io({
      readText: async () => {
        reads += 1;
        return "no";
      },
      confirmFile: async () => {
        checks += 1;
      },
    });
    for (const path of ["/tmp/a.doc", "/tmp/a.xls", "/tmp/a.ppt"]) {
      const opened = await openLocalPath(path, probe);
      expect(opened.current).toMatchObject({ kind: "error", message: MSG.oldOffice });
    }
    expect(reads).toBe(0);
    expect(checks).toBe(0);
  });

  it("Office 文件不在时显示原因，最近列表不动，上一份不留", async () => {
    const previous: Session = {
      current: { kind: "text", path: "/old.txt", name: "old.txt", mode: "plain", text: "旧内容" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const failed = await openLocalPath("/gone.docx", io({
      confirmFile: async () => {
        throw MSG.notFound;
      },
    }));
    const recents = recentsAfterOpen(previous, failed.current, 2);
    const reduced = reduceOpen(previous, { current: failed.current, recents });
    expect(reduced.session.current).toMatchObject({ kind: "error", message: MSG.notFound });
    expect(JSON.stringify(reduced.session)).not.toContain("旧内容");
    expect(reduced.session.recents).toEqual(previous.recents);
  });

  it("Office 解析失败后换成原因，晚到的失败不盖住下一份", () => {
    const opened: Session = {
      current: { kind: "office", path: "/tmp/a.docx", name: "a.docx", url: "asset:///tmp/a.docx" },
      recents: [{ path: "/old.txt", name: "old.txt", openedAt: 1 }],
    };
    const failed = failOpen(opened, "asset:///tmp/a.docx", "这不是 Word 文档");
    expect(failed.current).toMatchObject({ kind: "error", message: "这不是 Word 文档", name: "a.docx" });
    expect(failed.recents).toEqual(opened.recents);
    const next: Session = {
      current: { kind: "pdf", path: "/b.pdf", name: "b.pdf", url: "asset:///b.pdf" },
      recents: opened.recents,
    };
    expect(failOpen(next, "asset:///tmp/a.docx", "这不是 Word 文档")).toBe(next);
  });
});
