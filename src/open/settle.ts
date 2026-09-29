import type { Opened } from "./openFile";
import type { Current } from "./session";

export async function settleOpen(
  isCurrent: () => boolean,
  opened: Opened,
  commit: (current: Current) => void,
): Promise<void> {
  if (!isCurrent()) return;
  commit(opened.current);
  if (!isCurrent() || !opened.retain) return;
  try {
    await opened.retain();
  } catch {
    // 画面已经采纳。清理失败只留下多余缓存，不把这次打开再打成失败。
  }
}
