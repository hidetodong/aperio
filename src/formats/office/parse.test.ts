import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { MSG } from "../../messages";
import { parseCsv } from "./csv";
import { parseDocx } from "./docx";
import { OFFICE_BYTE_LIMIT, OFFICE_ROW_CAP, officeTooBig } from "./model";
import { parsePptx } from "./pptx";
import { readOffice } from "./readOffice";
import { parseXlsx } from "./xlsx";

function bytesOf(data: ArrayBuffer | Uint8Array | number[]): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  const view = ArrayBuffer.isView(data) ? data : Uint8Array.from(data);
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

describe("Office 只读解析", () => {
  it("带引号的 CSV 分成对应格子，超行数只留前 2000 行", () => {
    const quoted = parseCsv('a,"b,c"\r\n1,"x""y"');
    expect(quoted.sheets[0]?.rows).toEqual([
      ["a", "b,c"],
      ["1", 'x"y'],
    ]);
    expect(quoted.truncated).toBe(false);

    const bom = parseCsv("\uFEFFa,b\n1,2");
    expect(bom.sheets[0]?.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);

    const lines = Array.from({ length: OFFICE_ROW_CAP + 1 }, (_, index) => `r${index}`);
    const capped = parseCsv(lines.join("\n"));
    expect(capped.truncated).toBe(true);
    expect(capped.sheets[0]?.rows).toHaveLength(OFFICE_ROW_CAP);
    expect(capped.sheets[0]?.rows[0]).toEqual(["r0"]);
    expect(capped.sheets[0]?.rows[OFFICE_ROW_CAP - 1]).toEqual([`r${OFFICE_ROW_CAP - 1}`]);
  });

  it("最小 Word 按段落顺序出正文，并只展开一层转义", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p><w:r><w:t>第一段</w:t></w:r><w:r><w:t>接上</w:t></w:r></w:p><w:p><w:r><w:t>A &amp;amp; B</w:t></w:r></w:p></w:body></w:document>",
    );
    const parsed = await parseDocx(bytesOf(await zip.generateAsync({ type: "uint8array" })));
    expect(parsed.paragraphs).toEqual(["第一段接上", "A &amp; B"]);

    const empty = new JSZip();
    empty.file("word/other.xml", "<w:t>不该出现</w:t>");
    await expect(parseDocx(bytesOf(await empty.generateAsync({ type: "uint8array" })))).rejects.toThrow(
      "这不是 Word 文档",
    );
  });

  it("最小 Excel 显示存好的格子，不把公式重算", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["名称", "数量"],
      ["苹果", 2],
    ]);
    sheet.B2 = { t: "n", f: "1+1", v: 99, w: "99" };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "表一");
    const parsed = parseXlsx(bytesOf(XLSX.write(book, { type: "array", bookType: "xlsx" }) as number[]));
    expect(parsed.sheets[0]?.name).toBe("表一");
    expect(parsed.sheets[0]?.rows[0]).toEqual(["名称", "数量"]);
    expect(parsed.sheets[0]?.rows[1]).toEqual(["苹果", "99"]);
    expect(JSON.stringify(parsed)).not.toContain("1+1");
  });

  it("最小 PPT 按页码而不是文件名顺序显示", async () => {
    const zip = new JSZip();
    zip.file("ppt/slides/slide10.xml", "<p:sld><a:t>第十页</a:t></p:sld>");
    zip.file("ppt/slides/slide2.xml", "<p:sld><a:t>第二页</a:t></p:sld>");
    zip.file("ppt/slides/slide1.xml", "<p:sld><a:t>第一页</a:t></p:sld>");
    const parsed = await parsePptx(bytesOf(await zip.generateAsync({ type: "uint8array" })));
    expect(parsed.slides.map((slide) => slide.number)).toEqual([1, 2, 10]);
    expect(parsed.slides.map((slide) => slide.lines.join(""))).toEqual(["第一页", "第二页", "第十页"]);

    await expect(parsePptx(bytesOf(await new JSZip().generateAsync({ type: "uint8array" })))).rejects.toThrow(
      "这不是 PPT",
    );
  });

  it("旧格式和超过 20MB 的文件不去拆", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", "<w:t>不该读</w:t>");
    const docx = bytesOf(await zip.generateAsync({ type: "uint8array" }));
    await expect(readOffice("old.doc", docx)).rejects.toThrow(MSG.oldOffice);
    expect(officeTooBig(OFFICE_BYTE_LIMIT)).toBe(false);
    expect(officeTooBig(OFFICE_BYTE_LIMIT + 1)).toBe(true);
    await expect(readOffice("big.docx", new ArrayBuffer(OFFICE_BYTE_LIMIT + 1))).rejects.toThrow(MSG.officeTooBig);
  });
});
