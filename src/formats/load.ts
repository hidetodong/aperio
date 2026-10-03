import { ENABLE, isEnabled, type EnableKey } from "./enable";

const LOADERS: Partial<Record<EnableKey, () => Promise<unknown>>> = {
  image: () => import("./image/ImageView"),
  text: () => import("./text/TextView"),
  pdf: () => import("./pdf/PdfView"),
  office: () => import("./office/OfficeView"),
  zip: () => import("./zip/ZipView"),
  media: () => import("./media/MediaView"),
};

export function loaderFor(family: string): (() => Promise<unknown>) | null {
  if (!isEnabled(family)) return null;
  return LOADERS[family as EnableKey] ?? null;
}

export async function loadViewer(family: string): Promise<{ default: unknown } | null> {
  const load = loaderFor(family);
  if (!load) return null;
  return (await load()) as { default: unknown };
}

export function enabledFamilies(): EnableKey[] {
  return (Object.keys(ENABLE) as EnableKey[]).filter((key) => ENABLE[key]);
}
