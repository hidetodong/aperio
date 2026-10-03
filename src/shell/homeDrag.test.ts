import { describe, expect, it } from "vitest";
import { MSG } from "../messages";
import { dragSubtitle, dragTitle, IDLE_DRAG, openablePaths, viewFromNames } from "./homeDrag";

describe("首页拖拽文案", () => {
  it("单个能打开的文件显示文件名", () => {
    const view = viewFromNames(["/tmp/海边日落.jpg"], true);
    expect(view).toMatchObject({ phase: "hover", count: 1, name: "海边日落.jpg" });
    expect(dragTitle(view)).toBe("松开即可打开");
    expect(dragSubtitle(view)).toBe("海边日落.jpg");
  });

  it("多个文件按数量提示，并按顺序留下能打开的", () => {
    const paths = ["/tmp/a.pdf", "/tmp/b.doc", "/tmp/c.png"];
    const view = viewFromNames(paths, true);
    expect(view).toMatchObject({ phase: "hover-multi", count: 3 });
    expect(dragTitle(view)).toBe("松开打开 3 个文件");
    expect(dragSubtitle(view)).toBe("按拖入顺序浏览，← → 切换");
    expect(openablePaths(paths, true)).toEqual(["/tmp/a.pdf", "/tmp/c.png"]);
  });

  it("打不开的格式在松开前就拒绝", () => {
    const view = viewFromNames(["/tmp/old.doc"], true);
    expect(view.phase).toBe("invalid");
    expect(dragTitle(view)).toBe("无法读取这个文件");
    expect(dragSubtitle(view)).toBe(MSG.oldOffice);
    expect(viewFromNames(["/tmp/a.tar"], true).reason).toBe(MSG.archiveSkipped);
  });

  it("应用里的 HEIC 可以接住，浏览器里不行", () => {
    expect(viewFromNames(["/tmp/a.heic"], true).phase).toBe("hover");
    expect(viewFromNames(["a.heic"], false).phase).toBe("invalid");
  });

  it("还不知道文件名时用兜底副文", () => {
    const view = { phase: "hover" as const, count: 0, name: "", reason: "" };
    expect(dragSubtitle(view)).toBe("将用 Aperio 打开");
    expect(dragTitle(IDLE_DRAG)).toBe("把文件拖进窗口");
  });
});
