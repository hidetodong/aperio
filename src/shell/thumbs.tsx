import { canThumb, tintOf, type FileRow } from "./catalog";

export function Thumb({
  row,
  src,
  height,
  radius,
}: {
  row: Pick<FileRow, "name" | "ext" | "kind">;
  src: string | null;
  height: number;
  radius: number;
}) {
  const [bg, fg] = tintOf(row.kind);
  const photo = src != null && canThumb(row.name);
  return (
    <div className="thumb" style={{ height, borderRadius: radius, background: bg }}>
      {photo ? <img src={src} alt="" /> : null}
      {photo ? null : (
        <div className="thumb-fallback">
          <span />
          <span className="thumb-tag" style={{ color: fg }}>
            {row.ext}
          </span>
        </div>
      )}
    </div>
  );
}
