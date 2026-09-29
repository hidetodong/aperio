import { extensionOf } from "../route";
import { parseCsv } from "./csv";
import { MSG } from "../../messages";
import { officeTooBig, type OfficeModel } from "./model";

export async function readOffice(name: string, bytes: ArrayBuffer): Promise<OfficeModel> {
  if (officeTooBig(bytes.byteLength)) throw new Error(MSG.officeTooBig);
  const ext = extensionOf(name);
  if (ext === "csv") return parseCsv(new TextDecoder().decode(bytes));
  if (ext === "docx") {
    const { parseDocx } = await import("./docx");
    return parseDocx(bytes);
  }
  if (ext === "pptx") {
    const { parsePptx } = await import("./pptx");
    return parsePptx(bytes);
  }
  if (ext === "xlsx") {
    const { parseXlsx } = await import("./xlsx");
    return parseXlsx(bytes);
  }
  throw new Error(MSG.oldOffice);
}
