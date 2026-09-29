import { describe, expect, it } from "vitest";
import { settleOpen } from "./settle";
import type { Current } from "./session";

const shown: Current = { kind: "image", path: "/a.heic", name: "a.heic", url: "asset:///cache/current-1.png" };

describe("采纳之后才清理", () => {
  it("还不是最后一次时，不改画面，也不清理", async () => {
    let committed = false;
    let retained = false;
    await settleOpen(
      () => false,
      { current: shown, retain: async () => { retained = true; } },
      () => { committed = true; },
    );
    expect(committed).toBe(false);
    expect(retained).toBe(false);
  });

  it("先采纳，仍然是最后一次才清理", async () => {
    const order: string[] = [];
    await settleOpen(
      () => true,
      { current: shown, retain: async () => { order.push("retain"); } },
      () => { order.push("commit"); },
    );
    expect(order).toEqual(["commit", "retain"]);
  });

  it("采纳时如果已经不是最后一次，就不清理", async () => {
    let current = true;
    let retained = false;
    await settleOpen(
      () => current,
      { current: shown, retain: async () => { retained = true; } },
      () => { current = false; },
    );
    expect(retained).toBe(false);
  });

  it("清理失败不推翻已经采纳的画面", async () => {
    let committed = false;
    await expect(settleOpen(
      () => true,
      { current: shown, retain: async () => { throw new Error("清理失败"); } },
      () => { committed = true; },
    )).resolves.toBeUndefined();
    expect(committed).toBe(true);
  });
});
