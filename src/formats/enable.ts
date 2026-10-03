export const ENABLE = {
  image: true,
  text: true,
  pdf: true,
  office: true,
  zip: true,
  media: true,
} as const;

export type EnableKey = keyof typeof ENABLE;

export function isEnabled(family: string): boolean {
  return family in ENABLE && ENABLE[family as EnableKey];
}
