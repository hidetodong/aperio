import JSZip from "jszip";
import { decodeXml, type OfficeProse } from "./model";

function paragraphsOf(xml: string): string[] {
  const paragraphs: string[] = [];
  for (const part of xml.split(/<\/w:p>/i)) {
    const bits = [...part.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/gi)].map((match) => decodeXml(match[1] ?? ""));
    if (bits.length > 0) paragraphs.push(bits.join(""));
  }
  return paragraphs;
}

export async function parseDocx(bytes: ArrayBuffer): Promise<OfficeProse> {
  const zip = await JSZip.loadAsync(bytes);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("这不是 Word 文档");
  const xml = await file.async("string");
  return { kind: "prose", paragraphs: paragraphsOf(xml) };
}
