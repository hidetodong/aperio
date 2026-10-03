import { describe, expect, it } from "vitest";
import { installBase64, installIterator, installMapUpsert, installPromiseTry, type MapUpsert } from "./pdfPrelude.js";

describe("PDF 库在系统网页视图里缺的能力", () => {
  it("没有 Iterator 时补一个空构造函数，已有的不换掉", () => {
    const host = {} as typeof globalThis & { Iterator?: unknown };
    installIterator(host);
    const made = host.Iterator as { prototype: object };
    expect(typeof made).toBe("function");
    expect(typeof made.prototype).toBe("object");
    installIterator(host);
    expect(host.Iterator).toBe(made);
  });

  it("Map 上缺的取值方法只在没有这个键时计算一次", () => {
    const store = new Map<unknown, unknown>();
    const proto: MapUpsert = {
      has: (key) => store.has(key),
      get: (key) => store.get(key),
      set: (key, value) => store.set(key, value),
    };
    installMapUpsert(proto);
    let calls = 0;
    expect(proto.getOrInsertComputed!("a", () => ++calls)).toBe(1);
    expect(proto.getOrInsertComputed!("a", () => ++calls)).toBe(1);
    expect(calls).toBe(1);
    expect(proto.getOrInsert!("b", 3)).toBe(3);
    expect(proto.getOrInsert!("b", 4)).toBe(3);
  });

  it("Promise.try 会接住同步抛出的错误", async () => {
    const ctor: { try?: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown> } = {};
    installPromiseTry(ctor);
    await expect(ctor.try!(() => "ok")).resolves.toBe("ok");
    await expect(ctor.try!(() => { throw new Error("nope"); })).rejects.toThrow("nope");
  });

  it("字节数组能转成 base64 再转回来", () => {
    const proto = {} as Uint8Array & { toBase64?: () => string };
    const ctor: { fromBase64?: (input: string) => Uint8Array } = {};
    installBase64(proto, ctor);
    const bytes = new Uint8Array([104, 105]);
    expect(proto.toBase64!.call(bytes)).toBe("aGk=");
    expect(Array.from(ctor.fromBase64!("aGk="))).toEqual([104, 105]);
  });
});
