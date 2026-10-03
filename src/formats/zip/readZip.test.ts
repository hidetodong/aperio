import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import { MSG } from "../../messages";
import { ZIP_BYTE_LIMIT, ZIP_ENTRY_BYTE_LIMIT, ZIP_ENTRY_CAP } from "./model";
import { explainZipLoad, previewZipEntry, readZip } from "./readZip";

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function zipped(files: Record<string, string | Uint8Array>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [name, body] of Object.entries(files)) zip.file(name, body);
  return asArrayBuffer(await zip.generateAsync({ type: "uint8array" }));
}

function encryptCentralDirectory(bytes: Uint8Array): Uint8Array {
  const copy = bytes.slice();
  const signature = [0x50, 0x4b, 0x01, 0x02];
  for (let index = 0; index < copy.length - 10; index += 1) {
    if (signature.every((value, offset) => copy[index + offset] === value)) {
      copy[index + 8] = copy[index + 8]! | 0x01;
    }
  }
  return copy;
}

describe("压缩包", () => {
  it("列出名字，文本取出正文，图片和 PDF 只交出字节", async () => {
    const png = new Uint8Array([1, 2, 3, 4]);
    const pdf = new TextEncoder().encode("%PDF-1.4");
    const list = await readZip(
      await zipped({
        "note.txt": "价格,元",
        "pic.png": png,
        "doc.pdf": pdf,
        "sheet.docx": "<w:t>不该拆</w:t>",
        "inner.zip": new Uint8Array([1]),
        "song.mp3": new Uint8Array([2]),
        "photo.heic": new Uint8Array([3]),
      }),
    );
    expect(list.entries.map((entry) => entry.name)).toEqual([
      "doc.pdf",
      "inner.zip",
      "note.txt",
      "photo.heic",
      "pic.png",
      "sheet.docx",
      "song.mp3",
    ]);
    const text = await list.preview("note.txt");
    expect(text).toMatchObject({ kind: "text", text: "价格,元" });
    const image = await list.preview("pic.png");
    expect(image).toMatchObject({ kind: "image", mime: "image/png" });
    if (image.kind === "image") expect(Array.from(image.bytes)).toEqual([1, 2, 3, 4]);
    const innerPdf = await list.preview("doc.pdf");
    expect(innerPdf.kind).toBe("pdf");
    if (innerPdf.kind === "pdf") expect(new TextDecoder().decode(innerPdf.bytes)).toBe("%PDF-1.4");
    expect(await list.preview("sheet.docx")).toMatchObject({ kind: "note", message: MSG.zipInnerSkipped });
    expect(await list.preview("inner.zip")).toMatchObject({ kind: "note", message: MSG.zipInnerSkipped });
    expect(await list.preview("song.mp3")).toMatchObject({ kind: "note", message: MSG.zipInnerSkipped });
    expect(await list.preview("photo.heic")).toMatchObject({ kind: "note", message: MSG.zipHeic });
  });

  it("空包、坏包、超大和密码都有说明", async () => {
    const empty = await readZip(await zipped({}));
    expect(empty.entries).toEqual([]);
    await expect(readZip(new Uint8Array([1, 2, 3, 4]).buffer)).rejects.toThrow(MSG.notZip);
    await expect(readZip(new ArrayBuffer(ZIP_BYTE_LIMIT + 1))).rejects.toThrow(MSG.zipTooBig);
    const plain = new Uint8Array(await zipped({ "a.txt": "hi" }));
    const locked = encryptCentralDirectory(plain);
    await expect(readZip(asArrayBuffer(locked))).rejects.toThrow(MSG.zipEncrypted);
    expect(explainZipLoad(new Error("Encrypted zip are not supported"))).toBe(MSG.zipEncrypted);
  });

  it("条目太大时不取内容，名单超过 2000 项就停", async () => {
    const read = vi.fn(async () => new Uint8Array());
    const preview = await previewZipEntry({
      name: "big.txt",
      dir: false,
      async: read,
      _data: { uncompressedSize: ZIP_ENTRY_BYTE_LIMIT + 1 },
    } as unknown as JSZip.JSZipObject);
    expect(preview).toMatchObject({ kind: "note", message: MSG.zipEntryTooBig });
    expect(read).not.toHaveBeenCalled();

    const zip = new JSZip();
    for (let index = 0; index < ZIP_ENTRY_CAP + 1; index += 1) {
      zip.file(`f${String(index).padStart(4, "0")}.txt`, "x");
    }
    const list = await readZip(asArrayBuffer(await zip.generateAsync({ type: "uint8array" })));
    expect(list.truncated).toBe(true);
    expect(list.entries).toHaveLength(ZIP_ENTRY_CAP);
    expect(await list.preview(list.entries[0]!.name)).toMatchObject({ kind: "text" });
    expect(await list.preview("f2000.txt")).toMatchObject({ kind: "note", message: MSG.zipInnerSkipped });
  });
});
