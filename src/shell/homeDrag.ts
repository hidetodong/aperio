import { isEnabled } from "../formats/enable";
import { baseName, familyOf, isHeic, isLegacyOffice, isSkippedArchive } from "../formats/route";
import { MSG } from "../messages";

export type DragPhase = "idle" | "hover" | "hover-multi" | "invalid" | "dropping";

export type DragView = {
  phase: DragPhase;
  count: number;
  name: string;
  reason: string;
};

export type DropIntent = {
  paths: string[] | null;
  fade: boolean;
};

export const IDLE_DRAG: DragView = { phase: "idle", count: 0, name: "", reason: "" };

export function sameDrag(a: DragView, b: DragView): boolean {
  return a.phase === b.phase && a.count === b.count && a.name === b.name && a.reason === b.reason;
}

/** 拖进来就能判断的拒绝理由。权限要等系统确认，不在这里。 */
export function rejectReason(path: string, inApp: boolean): string | null {
  if (isSkippedArchive(path)) return MSG.archiveSkipped;
  const family = familyOf(path);
  if ((family !== "unknown" && !isEnabled(family)) || (family === "unknown" && !isEnabled("text"))) {
    return MSG.disabled;
  }
  if (!inApp && family === "image" && isHeic(path)) return MSG.heicNeedsApp;
  if (family === "office" && isLegacyOffice(path)) return MSG.oldOffice;
  return null;
}

export function openablePaths(paths: string[], inApp: boolean, blocked: ReadonlySet<string> = new Set()): string[] {
  return paths.filter((path) => !blocked.has(path) && rejectReason(path, inApp) == null);
}

export function viewFromNames(paths: string[], inApp: boolean): DragView {
  if (paths.length === 0) return { phase: "hover", count: 0, name: "", reason: "" };
  const reasons = paths.map((path) => rejectReason(path, inApp));
  if (reasons.every((reason) => reason != null)) {
    return {
      phase: "invalid",
      count: paths.length,
      name: baseName(paths[0] ?? ""),
      reason: reasons[0] ?? MSG.notText,
    };
  }
  if (paths.length > 1) return { phase: "hover-multi", count: paths.length, name: "", reason: "" };
  return { phase: "hover", count: 1, name: baseName(paths[0] ?? ""), reason: "" };
}

export function hoverUnknown(count: number): DragView {
  if (count > 1) return { phase: "hover-multi", count, name: "", reason: "" };
  return { phase: "hover", count, name: "", reason: "" };
}

export function invalidDrag(count: number, name: string, reason: string): DragView {
  return { phase: "invalid", count, name, reason };
}

export function dragTitle(drag: DragView): string {
  if (drag.phase === "idle") return "把文件拖进窗口";
  if (drag.phase === "invalid") return "无法读取这个文件";
  if (drag.count > 1) return `松开打开 ${drag.count} 个文件`;
  return "松开即可打开";
}

export function dragSubtitle(drag: DragView): string {
  if (drag.phase === "idle") return "窗口任意位置都可以放下 · 图片、文档、视频、代码、压缩包";
  if (drag.phase === "invalid") return drag.reason || "松开不会打开";
  if (drag.count > 1) return "按拖入顺序浏览，← → 切换";
  return drag.name || "将用 Aperio 打开";
}
