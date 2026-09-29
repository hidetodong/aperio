import { describe, expect, it } from "vitest";
import { createOpenGate } from "./gate";

describe("打开排队", () => {
  it("列表没读完时只排队，读完后才允许写，并且只认最后一次", () => {
    const gate = createOpenGate(false);
    expect(gate.canWrite).toBe(false);
    expect(gate.push("/a.png")).toEqual({ queued: true });
    expect(gate.push("/b.png")).toEqual({ queued: true });
    expect(gate.loaded(true)).toEqual(["/a.png", "/b.png"]);
    expect(gate.canWrite).toBe(true);

    const first = gate.push("/a.png");
    const second = gate.push("/b.png");
    if ("queued" in first || "queued" in second) throw new Error("读完后不应再排队");
    expect(gate.finish(first.ticket)).toBe(false);
    expect(gate.finish(second.ticket)).toBe(true);
  });

  it("列表读取失败时放行画面，但不允许写盘", () => {
    const gate = createOpenGate(false);
    gate.push("/a.png");
    expect(gate.loaded(false)).toEqual(["/a.png"]);
    expect(gate.canWrite).toBe(false);
  });
});
