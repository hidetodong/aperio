import { describe, expect, it } from "vitest";
import { ENABLE } from "./enable";
import { loaderFor } from "./load";

describe("按需加载", () => {
  it("只有开着的家族才有加载函数", () => {
    expect(ENABLE.pdf).toBe(true);
    expect(ENABLE.image).toBe(true);
    expect(ENABLE.text).toBe(true);
    expect(ENABLE.office).toBe(true);
    expect(ENABLE.zip).toBe(false);
    expect(ENABLE.media).toBe(false);
    expect(typeof loaderFor("pdf")).toBe("function");
    expect(typeof loaderFor("office")).toBe("function");
    expect(loaderFor("zip")).toBeNull();
    expect(loaderFor("media")).toBeNull();
    expect(typeof loaderFor("image")).toBe("function");
    expect(typeof loaderFor("text")).toBe("function");
  });
});
