export const OFFICE_ROW_CAP = 2000;
export const OFFICE_BYTE_LIMIT = 20 * 1024 * 1024;

export type OfficeTable = {
  kind: "table";
  sheets: { name: string; rows: string[][] }[];
  truncated: boolean;
};

export type OfficeProse = {
  kind: "prose";
  paragraphs: string[];
};

export type OfficeSlides = {
  kind: "slides";
  slides: { number: number; lines: string[] }[];
};

export type OfficeModel = OfficeTable | OfficeProse | OfficeSlides;

export function officeTooBig(byteLength: number): boolean {
  return byteLength > OFFICE_BYTE_LIMIT;
}

export function capRows(rows: string[][]): { rows: string[][]; truncated: boolean } {
  if (rows.length <= OFFICE_ROW_CAP) return { rows, truncated: false };
  return { rows: rows.slice(0, OFFICE_ROW_CAP), truncated: true };
}

export function decodeXml(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}
