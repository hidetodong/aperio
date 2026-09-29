export type Recent = {
  path: string;
  name: string;
  openedAt: number;
};

export function remember(list: Recent[], path: string, name: string, now: number, limit = 20): Recent[] {
  const next = [{ path, name, openedAt: now }, ...list.filter((item) => item.path !== path)];
  return next.slice(0, limit);
}
