import { describe, expect, it } from "vitest";
import { familyOf, isLegacyOffice, languageFor, textMode } from "./route";

describe("扩展名归类", () => {
  it("图片和文本落到对应家族", () => {
    for (const ext of ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"]) {
      expect(familyOf(`/tmp/a.${ext}`)).toBe("image");
    }
    expect(familyOf("/tmp/a.md")).toBe("text");
    expect(familyOf("/tmp/a.markdown")).toBe("text");
    expect(familyOf("/tmp/a.txt")).toBe("text");
    expect(familyOf("/tmp/a.html")).toBe("text");
    expect(familyOf("/tmp/README")).toBe("unknown");
  });

  it("后面的格式不会被当成文本", () => {
    expect(familyOf("/tmp/a.pdf")).toBe("pdf");
    expect(familyOf("/tmp/a.docx")).toBe("office");
    expect(familyOf("/tmp/a.xlsx")).toBe("office");
    expect(familyOf("/tmp/a.pptx")).toBe("office");
    expect(familyOf("/tmp/a.csv")).toBe("office");
    expect(familyOf("/tmp/a.doc")).toBe("office");
    expect(familyOf("/tmp/a.xls")).toBe("office");
    expect(familyOf("/tmp/a.ppt")).toBe("office");
    expect(isLegacyOffice("/tmp/a.doc")).toBe(true);
    expect(isLegacyOffice("/tmp/a.docx")).toBe(false);
    expect(familyOf("/tmp/a.zip")).toBe("zip");
    expect(familyOf("/tmp/a.mp4")).toBe("media");
  });

  it("只给约定的语言高亮", () => {
    const languages: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      mjs: "javascript",
      cjs: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      py: "python",
      go: "go",
      rs: "rust",
      sql: "sql",
      yml: "yaml",
      yaml: "yaml",
      css: "css",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
    };
    for (const [ext, language] of Object.entries(languages)) {
      expect(languageFor(`/tmp/a.${ext}`)).toBe(language);
      expect(textMode(`/tmp/a.${ext}`)).toBe("code");
    }
    expect(languageFor("/tmp/a.rb")).toBeNull();
    expect(textMode("/tmp/a.md")).toBe("markdown");
    expect(textMode("/tmp/a.html")).toBe("html");
    expect(textMode("/tmp/a.ts")).toBe("code");
    expect(textMode("/tmp/a.txt")).toBe("plain");
  });
});
