import { describe, expect, it } from "vitest";
import { remember } from "./recents";

describe("最近列表", () => {
  it("同一路径只留一条，最新在最前，最多 20 条", () => {
    let list = remember([], "/a/one.txt", "one.txt", 1);
    list = remember(list, "/a/one.txt", "one.txt", 2);
    expect(list).toEqual([{ path: "/a/one.txt", name: "one.txt", openedAt: 2 }]);
    for (let i = 0; i < 25; i += 1) {
      list = remember(list, `/f/${i}.txt`, `${i}.txt`, 10 + i);
    }
    expect(list).toHaveLength(20);
    expect(list[0]?.path).toBe("/f/24.txt");
    expect(list.some((item) => item.path === "/a/one.txt")).toBe(false);
  });
});
