import { useId, type CSSProperties } from "react";

/** 定稿标志。app 是深色圆角底；glyph 是单色字形，颜色跟着文字走。 */
export function AperioLogo({
  size = 18,
  variant = "app",
  style,
  title = "Aperio",
  decorative = false,
}: {
  size?: number;
  variant?: "app" | "glyph";
  style?: CSSProperties;
  title?: string;
  decorative?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const label = decorative ? undefined : title;
  if (variant === "glyph") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={label} style={style}>
        <path d="M50 12L80 86" fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={15} strokeLinecap="round" />
        <path d="M20 86L50 12" fill="none" stroke="currentColor" strokeWidth={15} strokeLinecap="round" />
        <circle cx={50} cy={62} r={7.5} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={label} style={style}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34343a" />
          <stop offset=".55" stopColor="#1c1c20" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}l1`} x1="33" y1="27.5" x2="33" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e2e7" />
        </linearGradient>
        <linearGradient id={`${id}l2`} x1="50" y1="27.5" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c9c9cf" />
          <stop offset="1" stopColor="#9d9da5" />
        </linearGradient>
        <radialGradient id={`${id}dot`} cx="48.3" cy="57.7" r="6.9" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b3c4ff" />
          <stop offset=".55" stopColor="#6a8cf5" />
          <stop offset="1" stopColor="#3b5fd6" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" rx="22.5" fill={`url(#${id}bg)`} />
      <rect x=".5" y=".5" width="99" height="99" rx="22" fill="none" stroke="#fff" strokeOpacity={0.1} />
      <path d="M50 27.5L67 75" fill="none" stroke={`url(#${id}l2)`} strokeWidth={9.5} strokeLinecap="round" />
      <path d="M33 75L50 27.5" fill="none" stroke={`url(#${id}l1)`} strokeWidth={9.5} strokeLinecap="round" />
      <circle cx="50" cy="60" r="4.6" fill={`url(#${id}dot)`} />
      <ellipse cx="48.6" cy="58.4" rx="1.5" ry="1" fill="#fff" fillOpacity={0.65} />
    </svg>
  );
}
