import { DEFAULT_ASSOC, DEFAULT_PREFS, type Assoc, type Prefs } from "./catalog";

const KEY = "aperio.shell";
const LEGACY_KEY = "emerge.shell";

export type StoredShell = { prefs: Prefs; assoc: Assoc };

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseStored(raw: string | null): StoredShell {
  if (!raw) return { prefs: DEFAULT_PREFS, assoc: DEFAULT_ASSOC };
  try {
    const data = JSON.parse(raw) as { prefs?: Partial<Prefs>; assoc?: Partial<Assoc> };
    const prefs = data.prefs ?? {};
    const assoc = data.assoc ?? {};
    return {
      prefs: {
        startup: pick(prefs.startup, ["home", "last", "lib"] as const, DEFAULT_PREFS.startup),
        dirView: pick(prefs.dirView, ["grid", "list"] as const, DEFAULT_PREFS.dirView),
        newWin: pick(prefs.newWin, ["same", "new"] as const, DEFAULT_PREFS.newWin),
        theme: pick(prefs.theme, ["light", "dark", "system"] as const, DEFAULT_PREFS.theme),
        ground: pick(prefs.ground, ["ink", "gray", "paper"] as const, DEFAULT_PREFS.ground),
        density: pick(prefs.density, ["compact", "regular"] as const, DEFAULT_PREFS.density),
        autoHide: bool(prefs.autoHide, DEFAULT_PREFS.autoHide),
        strip: bool(prefs.strip, DEFAULT_PREFS.strip),
        loop: bool(prefs.loop, DEFAULT_PREFS.loop),
        fit: pick(prefs.fit, ["fill", "fit", "actual"] as const, DEFAULT_PREFS.fit),
      },
      assoc: {
        image: bool(assoc.image, DEFAULT_ASSOC.image),
        doc: bool(assoc.doc, DEFAULT_ASSOC.doc),
        media: bool(assoc.media, DEFAULT_ASSOC.media),
        code: bool(assoc.code, DEFAULT_ASSOC.code),
        archive: bool(assoc.archive, DEFAULT_ASSOC.archive),
      },
    };
  } catch {
    return { prefs: DEFAULT_PREFS, assoc: DEFAULT_ASSOC };
  }
}

function readStoredRaw(): string | null {
  const current = localStorage.getItem(KEY);
  if (current !== null) return current;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === null) return null;
  localStorage.setItem(KEY, legacy);
  localStorage.removeItem(LEGACY_KEY);
  return legacy;
}

export function loadStored(): StoredShell {
  if (typeof localStorage === "undefined") return { prefs: DEFAULT_PREFS, assoc: DEFAULT_ASSOC };
  return parseStored(readStoredRaw());
}

export function saveStored(value: StoredShell) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(value));
}
