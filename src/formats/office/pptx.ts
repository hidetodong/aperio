import JSZip from "jszip";
import { decodeXml, type OfficeSlides } from "./model";

function linesOf(xml: string): string[] {
  return [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/gi)].map((match) => decodeXml(match[1] ?? ""));
}

function slideNumber(name: string): number {
  const match = name.match(/slide(\d+)\.xml$/i);
  return match ? Number(match[1]) : 0;
}

export async function parsePptx(bytes: ArrayBuffer): Promise<OfficeSlides> {
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files)
    .filter((name) => /ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((left, right) => slideNumber(left) - slideNumber(right));
  if (names.length === 0) throw new Error("这不是 PPT");
  const slides = [];
  for (const name of names) {
    const file = zip.file(name);
    if (!file) continue;
    slides.push({ number: slideNumber(name), lines: linesOf(await file.async("string")) });
  }
  return { kind: "slides", slides };
}
