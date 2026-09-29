import { describe, expect, it } from "vitest";
import { pagesInView } from "./pages";

const heights = [200, 200, 200, 200, 200];
const gap = 12;

describe("只排看得见的页", () => {
  it("视口只盖住第一页时，不把后面的页算进去", () => {
    expect(pagesInView({ scrollTop: 0, viewHeight: 200, heights, gap })).toEqual([1]);
  });

  it("滚到最后一页时，第一页已经不在视口里", () => {
    expect(pagesInView({ scrollTop: 4 * (200 + gap), viewHeight: 200, heights, gap })).toEqual([5]);
  });

  it("还不知道视口高度时，一页都不排", () => {
    expect(pagesInView({ scrollTop: 0, viewHeight: 0, heights, gap })).toEqual([]);
  });
});
