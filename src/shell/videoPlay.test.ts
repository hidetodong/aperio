import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("视频播放钮", () => {
  it("白色圆钮自己的深色压过按钮继承", () => {
    const css = readFileSync(join(process.cwd(), "src/shell/shell.css"), "utf8");
    expect(css).toMatch(/\.app button\.video-play\s*\{[^}]*color:\s*#1d1d1f/);
  });
});
