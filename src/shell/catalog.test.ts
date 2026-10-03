import { describe, expect, it } from "vitest";
import { countKinds, filterRows, formatSize, formatWhen, locationLabel, presentFile, thumbKind } from "./catalog";

describe("目录里的文件", () => {
  const now = new Date(2026, 8, 30, 12, 0).getTime();

  it("按扩展名归类，未知文件不进某一类型", () => {
    expect(thumbKind("街景.JPG")).toBe("image");
    expect(thumbKind("笔记.md")).toBe("md");
    expect(thumbKind("main.py")).toBe("code");
    expect(thumbKind("片子.mp4")).toBe("video");
    expect(thumbKind("歌.mp3")).toBe("audio");
    expect(thumbKind("包.zip")).toBe("archive");
    expect(thumbKind("表.xlsx")).toBe("office");
    expect(thumbKind("没有")).toBe("file");
  });

  it("大小和日期用设计稿的写法", () => {
    expect(formatSize(6 * 1024)).toBe("6 KB");
    expect(formatSize(4.2 * 1024 * 1024)).toBe("4.2 MB");
    expect(formatSize(218 * 1024 * 1024)).toBe("218 MB");
    expect(formatWhen(new Date(2026, 8, 30, 9, 41).getTime(), now)).toBe("今天 09:41");
    expect(formatWhen(new Date(2026, 8, 29, 22, 3).getTime(), now)).toBe("昨天 22:03");
    expect(formatWhen(new Date(2026, 8, 18, 8, 0).getTime(), now)).toBe("9月18日");
  });

  it("搜索和类型一起筛，计数不受搜索影响", () => {
    const rows = [
      presentFile({ path: "/a.jpg", name: "城市街景.jpg", bytes: 10, when: now }),
      presentFile({ path: "/b.pdf", name: "报告.pdf", bytes: 10, when: now }),
      presentFile({ path: "/c.py", name: "main.py", bytes: 10, when: now }),
    ];
    expect(filterRows(rows, "doc", "").map((row) => row.name)).toEqual(["报告.pdf"]);
    expect(filterRows(rows, "all", "城").map((row) => row.name)).toEqual(["城市街景.jpg"]);
    expect(countKinds(rows).image).toBe(1);
    expect(countKinds(rows).all).toBe(3);
    expect(locationLabel("/Users/cyborgno2/Downloads/报告.pdf")).toBe("~/Downloads");
  });
});
