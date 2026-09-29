import * as XLSX from "xlsx";
import { capRows, type OfficeTable } from "./model";

export function parseXlsx(bytes: ArrayBuffer): OfficeTable {
  const book = XLSX.read(bytes, { type: "array", cellFormula: false });
  if (book.SheetNames.length === 0) throw new Error("这不是 Excel");
  let truncated = false;
  const sheets = book.SheetNames.map((name) => {
    const sheet = book.Sheets[name];
    const raw = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) : [];
    const rows = raw.map((row) => (Array.isArray(row) ? row : []).map((cell) => String(cell ?? "")));
    const capped = capRows(rows);
    if (capped.truncated) truncated = true;
    return { name, rows: capped.rows };
  });
  return { kind: "table", sheets, truncated };
}
