import { extensionOf, languageFor } from "../formats/route";

type IconProps = { size?: number; strokeWidth?: number };

type TypeIcon =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "word"
  | "sheet"
  | "slides"
  | "markdown"
  | "text"
  | "code"
  | "archive"
  | "file";

const TYPE_COLOR: Record<TypeIcon, string> = {
  image: "#6e6e73",
  video: "#6e6e73",
  audio: "#6e6e73",
  pdf: "#b5452f",
  word: "#2f6fd1",
  sheet: "#3f7a45",
  slides: "#c47b2b",
  markdown: "#2f6fd1",
  text: "#6e6e73",
  code: "#3f7a45",
  archive: "#8a6a22",
  file: "#8e8e93",
};

const TYPE_BODY: Record<TypeIcon, string> = {
  image: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect>',
  audio: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
  pdf: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M8 13h8"></path><path d="M8 17h5"></path>',
  word: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M8 13h8"></path><path d="M8 17h8"></path>',
  sheet: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path>',
  slides: '<path d="M2 3h20"></path><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path><path d="m7 21 5-5 5 5"></path>',
  markdown: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M8 13h3"></path><path d="M8 17h6"></path>',
  text: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M8 13h8"></path><path d="M8 17h6"></path>',
  code: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="m9 8-3 4 3 4"></path><path d="m15 8 3 4-3 4"></path>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>',
};

function typeIconOf(name: string): TypeIcon {
  const ext = extensionOf(name);
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "webp" || ext === "svg" || ext === "heic" || ext === "heif") return "image";
  if (ext === "mp4" || ext === "mov") return "video";
  if (ext === "mp3") return "audio";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "word";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "sheet";
  if (ext === "ppt" || ext === "pptx") return "slides";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "txt") return "text";
  if (ext === "html" || ext === "htm" || languageFor(name)) return "code";
  if (ext === "zip") return "archive";
  return "file";
}

export function FileTypeIcon({ name, size = 18 }: { name: string; size?: number }) {
  const kind = typeIconOf(name);
  return (
    <span className="file-type" style={{ color: TYPE_COLOR[kind] }}>
      {svg(size, 1.75, TYPE_BODY[kind])}
    </span>
  );
}

function svg(size: number, strokeWidth: number, body: string, fill = false) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

export function SearchIcon({ size = 16 }: IconProps) {
  return svg(size, 2, '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>');
}

export function ChevronLeft({ size = 16 }: IconProps) {
  return svg(size, 2, '<path d="m15 18-6-6 6-6"></path>');
}

export function ChevronRight({ size = 16 }: IconProps) {
  return svg(size, 2, '<path d="m9 18 6-6-6-6"></path>');
}

export function FolderIcon({ size = 14 }: IconProps) {
  return svg(size, 2, '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>');
}

export function ClockIcon({ size = 14 }: IconProps) {
  return svg(size, 2, '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>');
}

export function GridIcon() {
  return svg(14, 2, '<rect width="7" height="7" x="3" y="3" rx="1.5"></rect><rect width="7" height="7" x="14" y="3" rx="1.5"></rect><rect width="7" height="7" x="14" y="14" rx="1.5"></rect><rect width="7" height="7" x="3" y="14" rx="1.5"></rect>');
}

export function ListIcon() {
  return svg(14, 2, '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>');
}

export function SettingsIcon() {
  return svg(
    16,
    1.8,
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>',
  );
}

export function MinusIcon() {
  return svg(15, 2, '<path d="M5 12h14"></path>');
}

export function PlusIcon() {
  return svg(15, 2, '<path d="M5 12h14"></path><path d="M12 5v14"></path>');
}

export function BookIcon() {
  return svg(15, 2, '<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>');
}

export function FilmIcon() {
  return svg(15, 2, '<rect width="18" height="12" x="3" y="4" rx="2"></rect><path d="M7 20h.01"></path><path d="M12 20h.01"></path><path d="M17 20h.01"></path>');
}

export function InfoIcon() {
  return svg(15, 2, '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>');
}

export function ShareIcon() {
  return svg(15, 2, '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="m16 6-4-4-4 4"></path><path d="M12 2v13"></path>');
}

export function CloseIcon() {
  return svg(12, 2.5, '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>');
}

export function PlayIcon() {
  return svg(14, 2, '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"></path>', true);
}

export function PauseIcon() {
  return svg(14, 2, '<rect x="5" y="4" width="4.5" height="16" rx="1.5"></rect><rect x="14.5" y="4" width="4.5" height="16" rx="1.5"></rect>', true);
}

export function FolderGlyph({
  size,
  stroke = 1.8,
  fillOpacity = 0.18,
  strokeColor,
  plus = false,
  className = "folder-glyph",
}: {
  size: number;
  stroke?: number;
  fillOpacity?: number;
  strokeColor?: string;
  plus?: boolean;
  className?: string;
}) {
  const ink = strokeColor ?? "currentColor";
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke={ink}
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      {plus ? (
        <path d="M12 10v6M9 13h6" fill="none" stroke={ink} strokeWidth={stroke} strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

export function RotateLeftIcon({ size = 15 }: IconProps = {}) {
  return svg(size, 2, '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>');
}

export function RotateRightIcon({ size = 15 }: IconProps = {}) {
  return svg(size, 2, '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>');
}

export function FlipIcon() {
  return svg(15, 2, '<path d="m3 7 5 5-5 5V7"></path><path d="m21 7-5 5 5 5V7"></path><path d="M12 20v2"></path><path d="M12 14v2"></path><path d="M12 8v2"></path><path d="M12 2v2"></path>');
}

export function WrapIcon() {
  return svg(15, 2, '<path d="M3 6h18"></path><path d="M3 12h15a3 3 0 1 1 0 6h-4"></path><path d="m16 16-2 2 2 2"></path><path d="M3 18h7"></path>');
}

export function CopyIcon() {
  return svg(14, 2, '<rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>');
}

export function ExtractIcon() {
  return svg(14, 2, '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>');
}

export function PipIcon() {
  return svg(15, 2, '<path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"></path><rect width="10" height="7" x="12" y="13" rx="2"></rect>');
}

export function StopIcon() {
  return svg(16, 2, '<rect x="5" y="5" width="14" height="14" rx="2.5"></rect>');
}

export function RepeatIcon() {
  return svg(16, 2, '<path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>');
}

export function VolumeIcon() {
  return svg(
    16,
    2,
    '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"></path><path d="M16 9a5 5 0 0 1 0 6"></path><path d="M19.4 18.4a9 9 0 0 0 0-12.8"></path>',
  );
}

export function MuteIcon() {
  return svg(
    16,
    2,
    '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"></path><path d="m22 9-6 6"></path><path d="m16 9 6 6"></path>',
  );
}
