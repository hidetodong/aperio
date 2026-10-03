import { extensionOf, familyOf, textMode } from "../formats/route";

export type Screen = "home" | "lib" | "view" | "settings";
export type PlaceId = "all" | "docs" | "downloads" | "desktop" | "icloud";
export type FolderId = Exclude<PlaceId, "all">;
export type KindId = "all" | "image" | "doc" | "media" | "code" | "archive";
export type ViewMode = "grid" | "list";
export type ThumbKind = "image" | "video" | "audio" | "pdf" | "office" | "md" | "text" | "code" | "archive" | "file";
export type GroupId = Exclude<KindId, "all">;

export type Prefs = {
  startup: "home" | "last" | "lib";
  dirView: ViewMode;
  newWin: "same" | "new";
  theme: "light" | "dark" | "system";
  ground: "ink" | "gray" | "paper";
  density: "compact" | "regular";
  autoHide: boolean;
  strip: boolean;
  loop: boolean;
  fit: "fill" | "fit" | "actual";
};

export type Assoc = Record<GroupId, boolean>;

export type FileRow = {
  path: string;
  name: string;
  ext: string;
  kind: ThumbKind;
  group: GroupId | null;
  sizeLabel: string;
  dateLabel: string;
};

export const DEFAULT_PREFS: Prefs = {
  startup: "home",
  dirView: "grid",
  newWin: "same",
  theme: "system",
  ground: "ink",
  density: "compact",
  autoHide: true,
  strip: true,
  loop: true,
  fit: "fill",
};

export const DEFAULT_ASSOC: Assoc = {
  image: true,
  doc: true,
  media: true,
  code: true,
  archive: true,
};

export const PLACES: { id: PlaceId; label: string; dot: string }[] = [
  { id: "all", label: "最近", dot: "#8e8e93" },
  { id: "docs", label: "项目资料", dot: "#2f6fd1" },
  { id: "downloads", label: "下载", dot: "#3f7a45" },
  { id: "desktop", label: "桌面", dot: "#8a6a22" },
  { id: "icloud", label: "iCloud 云盘", dot: "#5aa0e6" },
];

export const KINDS: { id: KindId; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "image", label: "图片" },
  { id: "doc", label: "文档" },
  { id: "media", label: "视频" },
  { id: "code", label: "代码" },
  { id: "archive", label: "压缩包" },
];

export const TABS: { id: string; label: string; desc: string; chip: string }[] = [
  { id: "general", label: "通用", desc: "启动与窗口行为", chip: "#8e8e93" },
  { id: "look", label: "外观", desc: "主题、浏览背景与密度", chip: "#2f6fd1" },
  { id: "view", label: "浏览", desc: "沉浸浏览时的界面元素", chip: "#3f7a45" },
  { id: "assoc", label: "文件关联", desc: "选择由 Aperio 默认打开的文件类型", chip: "#b5452f" },
  { id: "keys", label: "快捷键", desc: "常用操作的键盘快捷方式", chip: "#8a6a22" },
];

export const ASSOC_DESC: Record<GroupId, string> = {
  image: "JPG · PNG · GIF · WEBP · SVG · HEIC",
  doc: "PDF · MD · TXT · HTML · DOCX · XLSX · PPTX · CSV",
  media: "MP4 · MOV · MP3",
  code: "JS · TS · JSON · PY · GO · RS · SQL · YAML · CSS · SH",
  archive: "ZIP",
};

const TINT: Record<ThumbKind, [string, string]> = {
  image: ["#e4e2dd", "#6e6e73"],
  video: ["#e4e2dd", "#6e6e73"],
  audio: ["#e4e2dd", "#6e6e73"],
  pdf: ["#f6e3df", "#b5452f"],
  office: ["#f6e3df", "#b5452f"],
  md: ["#e3e8f6", "#2f6fd1"],
  text: ["#e3e8f6", "#2f6fd1"],
  code: ["#e6ede4", "#3f7a45"],
  archive: ["#f1ebdc", "#8a6a22"],
  file: ["#e4e2dd", "#6e6e73"],
};

const RASTER = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

export const GROUNDS = {
  ink: { bg: "#111112", fg: "#f5f5f7", light: false },
  gray: { bg: "#2c2c2e", fg: "#f5f5f7", light: false },
  paper: { bg: "#f2f2f0", fg: "#1d1d1f", light: true },
} as const;

export function tintOf(kind: ThumbKind): [string, string] {
  return TINT[kind];
}

export function thumbKind(name: string): ThumbKind {
  const family = familyOf(name);
  const ext = extensionOf(name);
  if (family === "image") return "image";
  if (family === "media") return ext === "mp3" ? "audio" : "video";
  if (family === "pdf") return "pdf";
  if (family === "office") return "office";
  if (family === "zip") return "archive";
  if (family === "text") {
    const mode = textMode(name);
    if (mode === "code") return "code";
    if (mode === "markdown") return "md";
    return "text";
  }
  return "file";
}

export function groupOf(kind: ThumbKind): GroupId | null {
  if (kind === "image") return "image";
  if (kind === "video" || kind === "audio") return "media";
  if (kind === "pdf" || kind === "office" || kind === "md" || kind === "text") return "doc";
  if (kind === "code") return "code";
  if (kind === "archive") return "archive";
  return null;
}

export function canThumb(name: string): boolean {
  return RASTER.has(extensionOf(name));
}

export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? trimNum(kb) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? trimNum(mb) : Math.round(mb)} MB`;
  const gb = mb / 1024;
  return `${gb < 10 ? trimNum(gb) : Math.round(gb)} GB`;
}

function trimNum(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatWhen(ms: number, now = Date.now()): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const date = new Date(ms);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - day.getTime()) / 86_400_000);
  const hm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (diff === 0) return `今天 ${hm}`;
  if (diff === 1) return `昨天 ${hm}`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function presentFile(input: { path: string; name: string; bytes?: number; when?: number }, now = Date.now()): FileRow {
  const kind = thumbKind(input.name);
  const ext = extensionOf(input.name);
  return {
    path: input.path,
    name: input.name,
    ext: ext ? ext.toUpperCase() : "文件",
    kind,
    group: groupOf(kind),
    sizeLabel: input.bytes == null ? "—" : formatSize(input.bytes),
    dateLabel: input.when == null ? "—" : formatWhen(input.when, now),
  };
}

export function filterRows(rows: FileRow[], kind: KindId, query: string): FileRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => (kind === "all" || row.group === kind) && (!q || row.name.toLowerCase().includes(q)));
}

export function countKinds(rows: FileRow[]): Record<KindId, number> {
  const counts: Record<KindId, number> = { all: rows.length, image: 0, doc: 0, media: 0, code: 0, archive: 0 };
  for (const row of rows) {
    if (row.group) counts[row.group] += 1;
  }
  return counts;
}

export function locationLabel(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const users = parts.indexOf("Users");
  if (users >= 0 && parts.length >= users + 3) {
    const rest = parts.slice(users + 2, -1);
    return rest.length ? `~/${rest.join("/")}` : "~";
  }
  if (parts.length >= 2) return parts[parts.length - 2] ?? "—";
  return "—";
}

export function parentDir(path: string): string | null {
  const cut = path.lastIndexOf("/");
  if (cut <= 0) return null;
  return path.slice(0, cut);
}

export function fitCss(fit: Prefs["fit"]): string {
  if (fit === "fill") return "cover";
  if (fit === "actual") return "none";
  return "contain";
}
