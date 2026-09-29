import { remember, type Recent } from "../recents";

export type Current =
  | { kind: "empty" }
  | { kind: "image"; path: string; name: string; url: string }
  | { kind: "pdf"; path: string; name: string; url: string }
  | { kind: "office"; path: string; name: string; url: string }
  | {
      kind: "text";
      path: string;
      name: string;
      mode: "markdown" | "html" | "code" | "plain";
      text: string;
      language?: string;
    }
  | { kind: "error"; path: string; name: string; message: string };

export type Session = {
  current: Current;
  recents: Recent[];
};

export function recentsAfterOpen(state: Session, current: Current, now: number): Recent[] {
  if (current.kind !== "image" && current.kind !== "text") return state.recents;
  return remember(state.recents, current.path, current.name, now);
}

export function recentsAfterOfficeShown(state: Session, path: string, name: string, now: number): Recent[] {
  const current = state.current;
  if (current.kind !== "office" || current.path !== path) return state.recents;
  return remember(state.recents, path, name, now);
}

export function blobUrlOf(current: Current): string | null {
  if (current.kind !== "image" && current.kind !== "pdf" && current.kind !== "office") return null;
  return current.url.startsWith("blob:") ? current.url : null;
}

export function failOpen(state: Session, url: string, message: string): Session {
  const current = state.current;
  if ((current.kind !== "pdf" && current.kind !== "office") || current.url !== url) return state;
  return {
    ...state,
    current: { kind: "error", path: current.path, name: current.name, message },
  };
}

export function urlsToRevoke(previous: Current, next: Current): string[] {
  const url = blobUrlOf(previous);
  if (!url) return [];
  if (blobUrlOf(next) === url) return [];
  return [url];
}

export function reduceOpen(state: Session, next: { current: Current; recents: Session["recents"] }): {
  session: Session;
  revoke: string[];
} {
  return {
    session: { current: next.current, recents: next.recents },
    revoke: urlsToRevoke(state.current, next.current),
  };
}
