export type MapUpsert = {
  has(key: unknown): boolean;
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): unknown;
  getOrInsert?: (key: unknown, value: unknown) => unknown;
  getOrInsertComputed?: (key: unknown, callback: (key: unknown) => unknown) => unknown;
};

export function installIterator(host: typeof globalThis & { Iterator?: unknown }): void;
export function installMapUpsert(proto: MapUpsert): void;
export function installPromiseTry(ctor: {
  try?: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown>;
}): void;
export function installBase64(
  proto: Uint8Array & { toBase64?: () => string },
  ctor: { fromBase64?: (input: string) => Uint8Array },
): void;
export function ensurePdfRuntime(): void;
