export const ZIP_ENTRY_CAP = 2000;
export const ZIP_BYTE_LIMIT = 20 * 1024 * 1024;
export const ZIP_ENTRY_BYTE_LIMIT = 20 * 1024 * 1024;

export function zipTooBig(byteLength: number): boolean {
  return byteLength > ZIP_BYTE_LIMIT;
}

export function zipEntryTooBig(byteLength: number): boolean {
  return byteLength > ZIP_ENTRY_BYTE_LIMIT;
}
