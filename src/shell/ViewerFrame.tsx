import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { canThumb, fitCss, tintOf, type FileRow, type Prefs } from "./catalog";
import {
  BookIcon,
  ChevronLeft,
  ChevronRight,
  CloseIcon,
  CopyIcon,
  ExtractIcon,
  FilmIcon,
  FlipIcon,
  InfoIcon,
  MinusIcon,
  MuteIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  PlusIcon,
  RepeatIcon,
  RotateLeftIcon,
  RotateRightIcon,
  ShareIcon,
  StopIcon,
  VolumeIcon,
  WrapIcon,
} from "./icons";
import { LookProvider, type Look } from "./look";

type InfoRow = { k: string; v: string };

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function scrollLabel(el: HTMLElement): { pct: number; label: string } {
  const max = el.scrollHeight - el.clientHeight;
  const pct = max <= 1 ? 0 : el.scrollTop / max;
  const total = Number(el.dataset.pages || 0);
  if (el.classList.contains("pdf-scroll") && total > 0) {
    const mid = el.scrollTop + el.clientHeight / 2;
    let best = 1;
    let dist = Number.POSITIVE_INFINITY;
    for (const page of el.querySelectorAll<HTMLElement>(".pdf-page")) {
      const center = page.offsetTop + page.offsetHeight / 2;
      const gap = Math.abs(center - mid);
      if (gap < dist) {
        dist = gap;
        best = Number(page.querySelector("canvas")?.dataset.page || 1);
      }
    }
    return { pct, label: `第 ${best} / ${total} 页` };
  }
  return { pct, label: `${Math.round(pct * 100)}%` };
}

function OverlayScroll({
  root,
  enabled,
  ink,
  side,
  bottom,
}: {
  root: HTMLElement | null;
  enabled: boolean;
  ink: boolean;
  side: number;
  bottom: number;
}) {
  const [box, setBox] = useState({ top: 0, size: 0, pct: 0, label: "", on: false });
  const [hot, setHot] = useState(false);
  const [drag, setDrag] = useState(false);
  const scroller = useRef<HTMLElement | null>(null);
  const hideTimer = useRef(0);

  useEffect(() => {
    if (!enabled || !root) {
      scroller.current = null;
      return;
    }
    const el = root.querySelector<HTMLElement>(".pdf-scroll, .office-scroll, .zip-scroll, .doc-scroll");
    scroller.current = el;
    if (!el) return;
    const measure = (show: boolean) => {
      const max = el.scrollHeight - el.clientHeight;
      const track = el.clientHeight - 12;
      if (max <= 1 || track <= 0) {
        setBox({ top: 0, size: 0, pct: 0, label: "", on: false });
        return;
      }
      const size = Math.max(36, (track * el.clientHeight) / el.scrollHeight);
      const { pct, label } = scrollLabel(el);
      setBox({ top: (track - size) * pct, size, pct, label, on: show });
      if (show) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
          setBox((prev) => ({ ...prev, on: false }));
        }, 900);
      }
    };
    const onScroll = () => measure(true);
    el.addEventListener("scroll", onScroll, { passive: true });
    measure(false);
    const observer = new ResizeObserver(() => measure(false));
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
      window.clearTimeout(hideTimer.current);
    };
  }, [root, enabled]);

  if (!enabled || box.size <= 0) return null;
  const shown = box.on || hot || drag;
  const color = ink
    ? drag
      ? "rgba(255,255,255,.75)"
      : "rgba(255,255,255,.45)"
    : drag
      ? "rgba(0,0,0,.55)"
      : "rgba(0,0,0,.3)";

  function jump(event: ReactMouseEvent<HTMLDivElement>) {
    const el = scroller.current;
    if (!el || event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    el.scrollTo({ top: ratio * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
  }

  function startDrag(event: ReactMouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const el = scroller.current;
    if (!el) return;
    const y0 = event.clientY;
    const top0 = el.scrollTop;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, el.clientHeight - 12 - box.size);
    setDrag(true);
    const move = (ev: MouseEvent) => {
      el.scrollTop = top0 + (ev.clientY - y0) * ratio;
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      setDrag(false);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  return (
    <>
      <div
        className="overlay-track"
        style={{ right: side }}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onMouseDown={jump}
      >
        <div
          className="overlay-thumb"
          onMouseDown={startDrag}
          style={{
            top: box.top,
            height: box.size,
            width: hot || drag ? 8 : 4,
            background: color,
            opacity: shown ? 1 : 0,
          }}
        />
      </div>
      <div
        className="scroll-pill"
        style={{
          right: 24 + side,
          bottom,
          opacity: box.on || drag ? 1 : 0,
          transform: `translateY(${box.on || drag ? 0 : 6}px)`,
        }}
      >
        <span className="scroll-meter">
          <span style={{ width: `${Math.round(box.pct * 100)}%` }} />
        </span>
        {box.label}
      </div>
    </>
  );
}

const SPEEDS = [1, 1.25, 1.5, 2, 0.5];

function playerOf(root: HTMLElement | null): HTMLVideoElement | null {
  return root?.querySelector("video.media-player, video") ?? null;
}

function VideoBar({ root, bottom }: { root: HTMLElement | null; bottom: number }) {
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = playerOf(root);
    if (!video) return;
    const sync = () => {
      setPlaying(!video.paused);
      setNow(video.currentTime || 0);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setMuted(video.muted);
      setLoop(video.loop);
    };
    video.addEventListener("timeupdate", sync);
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("loadedmetadata", sync);
    sync();
    return () => {
      video.removeEventListener("timeupdate", sync);
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("loadedmetadata", sync);
    };
  }, [root]);

  function withVideo(apply: (video: HTMLVideoElement) => void) {
    const video = playerOf(root);
    if (video) apply(video);
  }

  function toggle() {
    withVideo((video) => {
      if (video.paused) void video.play();
      else video.pause();
    });
  }

  function seek(event: ReactMouseEvent<HTMLDivElement>) {
    withVideo((video) => {
      if (!duration) return;
      const rect = event.currentTarget.getBoundingClientRect();
      video.currentTime = ((event.clientX - rect.left) / rect.width) * duration;
    });
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key !== "m" && event.key !== "M") return;
      event.preventDefault();
      withVideo((video) => {
        video.muted = !video.muted;
        setMuted(video.muted);
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [root]);

  const pct = duration > 0 ? `${Math.min(100, (now / duration) * 100)}%` : "0%";
  return (
    <div className="video-bar chrome-fade" style={{ bottom }}>
      <button
        type="button"
        className="video-side"
        title="停止"
        onClick={() => withVideo((video) => {
          video.pause();
          video.currentTime = 0;
        })}
      >
        <StopIcon />
      </button>
      <button type="button" className="video-side" title="后退 10 秒" onClick={() => withVideo((video) => { video.currentTime = Math.max(0, video.currentTime - 10); })}>
        <RotateLeftIcon size={16} />
      </button>
      <button type="button" className="video-play" title="播放 / 暂停" onClick={toggle}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button type="button" className="video-side" title="前进 10 秒" onClick={() => withVideo((video) => { video.currentTime = Math.min(duration || video.currentTime + 10, video.currentTime + 10); })}>
        <RotateRightIcon size={16} />
      </button>
      <span className="video-time">{clock(now)}</span>
      <div className="video-track" onClick={seek}>
        <span style={{ width: pct }} />
      </div>
      <span className="video-time dim">{clock(duration)}</span>
      <button
        type="button"
        className={speed === 1 ? "video-speed" : "video-speed on"}
        title="播放速度"
        onClick={() => withVideo((video) => {
          const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1;
          video.playbackRate = next;
          setSpeed(next);
        })}
      >
        {speed}×
      </button>
      <button
        type="button"
        className={loop ? "video-side on" : "video-side"}
        title="循环播放"
        onClick={() => withVideo((video) => {
          video.loop = !video.loop;
          setLoop(video.loop);
        })}
      >
        <RepeatIcon />
      </button>
      <button
        type="button"
        className="video-side"
        title="静音 M"
        onClick={() => withVideo((video) => {
          video.muted = !video.muted;
          setMuted(video.muted);
        })}
      >
        {muted ? <MuteIcon /> : <VolumeIcon />}
      </button>
    </div>
  );
}

const ZEN_HINT: Record<string, string> = {
  image: "禅模式 · 纯黑背景，完整显示 · Z 或 Esc 退出",
  video: "禅模式 · 环境光已开启，控件自动隐藏 · Z 或 Esc 退出",
  pdf: "禅模式 · 单页居中，纸色背景 · Z 或 Esc 退出",
  markdown: "禅模式 · 只突出指针所在的段落 · Z 或 Esc 退出",
  code: "禅模式 · 大字号，隐藏行号 · Z 或 Esc 退出",
};

export function ViewerFrame({
  name,
  path,
  index,
  total,
  ground,
  kind,
  zen,
  chromeOn,
  edge,
  info,
  stripOn,
  fit,
  hint,
  fade = false,
  ink,
  video,
  copyText,
  scrollable,
  strip,
  infoRows,
  thumb,
  thumbSrc,
  onWake,
  onEdge,
  onLeave,
  onBack,
  onPrev,
  onNext,
  onFit,
  onToggleZen,
  onToggleStrip,
  onToggleInfo,
  onReveal,
  onExtract,
  onStrip,
  children,
}: {
  name: string;
  path: string;
  index: number;
  total: number;
  ground: Prefs["ground"];
  kind: string;
  zen: boolean;
  chromeOn: boolean;
  edge: boolean;
  info: boolean;
  stripOn: boolean;
  fit: Prefs["fit"];
  hint: boolean;
  fade?: boolean;
  ink: boolean;
  video: boolean;
  copyText: string | null;
  scrollable: boolean;
  strip: FileRow[];
  infoRows: InfoRow[];
  thumb: FileRow | null;
  thumbSrc: (row: FileRow) => string | null;
  onWake: () => void;
  onEdge: (edge: boolean) => void;
  onLeave: () => void;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFit: (fit: Prefs["fit"]) => void;
  onToggleZen: () => void;
  onToggleStrip: () => void;
  onToggleInfo: () => void;
  onReveal: (path: string) => void;
  onExtract: () => Promise<"ok" | "cancel">;
  onStrip: (row: FileRow) => void;
  children: ReactNode;
}) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [rot, setRot] = useState(0);
  const [flip, setFlip] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pz, setPz] = useState(100);
  const [spread, setSpread] = useState<"single" | "double">("single");
  const [ts, setTs] = useState(0);
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [extractLabel, setExtractLabel] = useState("解压到…");
  const copyTimer = useRef(0);
  const extractRef = useRef(onExtract);
  extractRef.current = onExtract;
  useEffect(() => {
    setRot(0);
    setFlip(false);
    setZoom(100);
    setPz(100);
    setCopied(false);
    setExtractLabel("解压到…");
  }, [path]);
  const light = ground === "paper";
  const glass = light ? "rgba(255,255,255,.75)" : "rgba(60,60,64,.55)";
  const glassHover = light ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.12)";
  const shown = zen ? edge : chromeOn || info;
  const side = info ? 296 : 0;
  const stripVisible = stripOn && !zen && strip.length > 0;
  const pillBottom = stripVisible && chromeOn && !zen ? 88 : 20;
  const current = Math.min(index, Math.max(0, total - 1));
  const readBase = zen && kind === "markdown" ? 18 : 15;
  const codeBase = zen && kind === "code" ? 18 : 13;
  const groundBg = ground === "ink" ? "#111112" : ground === "gray" ? "#2c2c2e" : "#f2f2f0";
  const zenBg = kind === "image" || kind === "video" ? "#000" : kind === "pdf" ? "#ebe8e1" : kind === "markdown" ? "#f6f3ec" : groundBg;
  const look: Look = {
    family: kind,
    zen,
    light,
    rot,
    flip,
    zoom,
    fit,
    pz,
    spread,
    ts,
    wrap,
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const meta = event.metaKey || event.ctrlKey;
      if (kind === "image" && meta && (event.key === "l" || event.key === "L") && !event.shiftKey) {
        event.preventDefault();
        setRot((value) => value - 90);
        return;
      }
      if (kind === "image" && meta && (event.key === "r" || event.key === "R") && !event.shiftKey) {
        event.preventDefault();
        setRot((value) => value + 90);
        return;
      }
      if ((kind === "image" || kind === "pdf") && meta && event.key === "0") {
        event.preventDefault();
        if (kind === "pdf") setPz(100);
        else {
          setZoom(100);
          setRot(0);
          setFlip(false);
        }
        return;
      }
      if (meta && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        if (kind === "pdf") setPz((value) => Math.min(200, value + 10));
        else if (kind === "image") setZoom((value) => Math.min(300, value + 25));
        else if (kind === "markdown" || kind === "code") setTs((value) => Math.min(4, value + 1));
        return;
      }
      if (meta && event.key === "-") {
        event.preventDefault();
        if (kind === "pdf") setPz((value) => Math.max(40, value - 10));
        else if (kind === "image") setZoom((value) => Math.max(25, value - 25));
        else if (kind === "markdown" || kind === "code") setTs((value) => Math.max(-2, value - 1));
        return;
      }
      if (kind === "code" && event.altKey && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        setWrap((value) => !value);
        return;
      }
      if (kind === "code" && meta && event.shiftKey && (event.key === "c" || event.key === "C")) {
        event.preventDefault();
        void copyNow();
        return;
      }
      if (kind === "zip" && meta && (event.key === "e" || event.key === "E")) {
        event.preventDefault();
        void extractNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, copyText]);

  function copyNow() {
    if (!copyText) return;
    void navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => undefined);
  }

  function extractNow() {
    setExtractLabel("正在解压");
    void extractRef.current().then((result) => {
      setExtractLabel(result === "ok" ? "已解压" : "解压到…");
      if (result === "ok") window.setTimeout(() => setExtractLabel("解压到…"), 1500);
    }).catch(() => {
      setExtractLabel("解压失败");
      window.setTimeout(() => setExtractLabel("解压到…"), 1500);
    });
  }

  function pip() {
    const videoEl = playerOf(root);
    if (!videoEl || typeof videoEl.requestPictureInPicture !== "function") return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    else void videoEl.requestPictureInPicture();
  }

  function move(event: ReactMouseEvent<HTMLDivElement>) {
    if (zen) {
      const rect = event.currentTarget.getBoundingClientRect();
      const y = event.clientY - rect.top;
      onEdge(y < 64 || y > rect.height - 90);
      return;
    }
    onWake();
  }

  const textSize = `${ts > 0 ? "+" : ""}${ts}`;
  const zoomLabel = kind === "pdf" ? pz : zoom;
  return (
    <LookProvider value={look}>
    <div
      ref={setRoot}
      className={fade ? "stage stage-fade" : "stage"}
      data-ground={ground}
      data-kind={kind}
      data-wrap={wrap ? "true" : "false"}
      data-zen={zen ? "true" : "false"}
      data-chrome={shown ? "on" : "off"}
      style={{
        background: zen ? zenBg : groundBg,
        color: zen && (kind === "image" || kind === "video") ? "#fff" : light ? "#1d1d1f" : "#f5f5f7",
        ["--glass" as string]: glass,
        ["--glass-hover" as string]: glassHover,
        ["--side" as string]: `${side}px`,
        ["--img-fit" as string]: zen && kind === "image" ? "contain" : fitCss(fit),
        ["--img-transform" as string]: `rotate(${rot}deg) scale(${(zoom / 100) * (rot % 180 ? 0.75 : 1)}) scaleX(${flip ? -1 : 1})`,
        ["--read-size" as string]: `${readBase + ts * 2}px`,
        ["--code-size" as string]: `${codeBase + ts}px`,
        ["--col" as string]: zen && kind === "markdown" ? "680px" : "820px",
      }}
      onMouseMove={move}
      onMouseLeave={onLeave}
    >
      <div className="stage-body" style={{ paddingRight: side }}>
        {kind === "zip" ? (
          <div className="archive">
            <div className="archive-body">{children}</div>
          </div>
        ) : (
          children
        )}
        {video ? <VideoBar root={root} bottom={pillBottom} /> : null}
      </div>
      <OverlayScroll root={root} enabled={scrollable} ink={ink} side={side} bottom={pillBottom} />
      <button type="button" className="nav-btn chrome-fade" style={{ left: 20 }} title="上一个 ←" onClick={onPrev}>
        <ChevronLeft size={18} />
      </button>
      <button type="button" className="nav-btn chrome-fade" style={{ right: 20 + side }} title="下一个 →" onClick={onNext}>
        <ChevronRight size={18} />
      </button>
      <div className="view-top chrome-fade" data-tauri-drag-region="deep" style={{ paddingRight: 12 + side }}>
        <div className="lights" />
        <div className="glass-name">
          <button type="button" title="返回 Esc" onClick={onBack}>
            <ChevronLeft />
          </button>
          <span>{name}</span>
          <span className="pos">
            {current + 1} / {Math.max(total, 1)}
          </span>
        </div>
        <div className="drag-gap" />
        <div className="glass-tools">
          {kind === "image" ? (
            <>
              <button type="button" title="向左旋转 ⌘L" onClick={() => setRot((value) => value - 90)}>
                <RotateLeftIcon />
              </button>
              <button type="button" title="向右旋转 ⌘R" onClick={() => setRot((value) => value + 90)}>
                <RotateRightIcon />
              </button>
              <button type="button" className={flip ? "tool-icon on" : "tool-icon"} title="水平翻转" onClick={() => setFlip((value) => !value)}>
                <FlipIcon />
              </button>
              <span className="tool-rule" />
            </>
          ) : null}
          {kind === "image" || kind === "pdf" ? (
            <>
              <button type="button" title="缩小 ⌘−" onClick={() => (kind === "pdf" ? setPz((value) => Math.max(40, value - 10)) : setZoom((value) => Math.max(25, value - 25)))}>
                <MinusIcon />
              </button>
              <button
                type="button"
                className="zoom-label"
                title="重置缩放 ⌘0"
                onClick={() => {
                  if (kind === "pdf") setPz(100);
                  else {
                    setZoom(100);
                    setRot(0);
                    setFlip(false);
                  }
                }}
              >
                {zoomLabel}%
              </button>
              <button type="button" title="放大 ⌘+" onClick={() => (kind === "pdf" ? setPz((value) => Math.min(200, value + 10)) : setZoom((value) => Math.min(300, value + 25)))}>
                <PlusIcon />
              </button>
            </>
          ) : null}
          {kind === "image" || kind === "video" ? (
            <div className="vseg">
              {([
                ["fit", "适应", "完整显示"],
                ["fill", "填满", "填满窗口"],
                ["actual", "1:1", "实际像素"],
              ] as const).map(([id, label, title]) => (
                <button key={id} type="button" className={fit === id ? "on" : ""} title={title} onClick={() => onFit(id)}>
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          {kind === "pdf" ? (
            <div className="vseg">
              <button type="button" className={spread === "single" || zen ? "on" : ""} title="单页连续滚动" onClick={() => { setSpread("single"); setPz(100); }}>
                <PageMark two={false} />单页
              </button>
              <button type="button" className={spread === "double" && !zen ? "on" : ""} title="双页对开" onClick={() => { setSpread("double"); setPz(100); }}>
                <PageMark two />双页
              </button>
            </div>
          ) : null}
          {kind === "markdown" || kind === "code" ? (
            <>
              <button type="button" className="tool-font small" title="缩小字号 ⌘−" onClick={() => setTs((value) => Math.max(-2, value - 1))}>A</button>
              <span className="tool-step">{textSize}</span>
              <button type="button" className="tool-font large" title="放大字号 ⌘+" onClick={() => setTs((value) => Math.min(4, value + 1))}>A</button>
            </>
          ) : null}
          {kind === "code" ? (
            <>
              <button type="button" className={wrap ? "tool-icon on" : "tool-icon"} title="自动换行 ⌥Z" onClick={() => setWrap((value) => !value)}>
                <WrapIcon />
              </button>
              <button type="button" className="tool-text" title="复制全部 ⇧⌘C" onClick={() => copyNow()}>
                <CopyIcon />
                {copied ? "已复制" : "复制"}
              </button>
            </>
          ) : null}
          {kind === "zip" ? (
            <button type="button" className="tool-text" title="解压到… ⌘E" onClick={() => extractNow()}>
              <ExtractIcon />
              {extractLabel}
            </button>
          ) : null}
          {kind === "video" ? (
            <button type="button" title="画中画" onClick={pip}>
              <PipIcon />
            </button>
          ) : null}
          <span className="tool-rule" />
          {kind !== "zip" ? (
            <button type="button" className={zen ? "tool-text on" : "tool-text"} title="禅模式 Z" onClick={onToggleZen}>
              <BookIcon />
              禅模式
            </button>
          ) : null}
          <button type="button" className={stripOn ? "tool-icon on" : "tool-icon"} title="缩略图" onClick={onToggleStrip}>
            <FilmIcon />
          </button>
          <button type="button" className={info ? "tool-icon on" : "tool-icon"} title="信息 I" onClick={onToggleInfo}>
            <InfoIcon />
          </button>
          <button type="button" className="tool-icon" title="这一版不分享文件">
            <ShareIcon />
          </button>
        </div>
      </div>
      {stripVisible ? (
        <div className="film chrome-fade" style={{ left: `calc(50% - ${side / 2}px)` }}>
          {strip.map((row, item) => (
            <button
              key={row.path}
              type="button"
              title={row.name}
              className="film-item"
              style={{
                width: item === current ? 64 : 36,
                opacity: item === current ? 1 : 0.55,
                background: tintOf(row.kind)[0],
              }}
              onClick={() => onStrip(row)}
            >
              {thumbSrc(row) && canThumb(row.name) ? <img src={thumbSrc(row) ?? undefined} alt="" /> : <span style={{ color: tintOf(row.kind)[1] }}>{row.ext}</span>}
            </button>
          ))}
        </div>
      ) : null}
      <div className="zen-hint" style={{ opacity: hint ? 1 : 0 }}>
        {ZEN_HINT[kind] ?? "禅模式 · 移到窗口边缘唤出工具栏 · Z 或 Esc 退出"}
      </div>
      <aside className="info-panel" data-open={info ? "true" : "false"}>
        <div className="info-head">
          <div>信息</div>
          <button type="button" onClick={onToggleInfo} aria-label="关闭信息">
            <CloseIcon />
          </button>
        </div>
        <div className="info-preview" style={{ background: thumb ? tintOf(thumb.kind)[0] : "#e4e2dd" }}>
          {thumb && thumbSrc(thumb) && canThumb(thumb.name) ? <img src={thumbSrc(thumb) ?? undefined} alt="" /> : null}
        </div>
        {infoRows.map((row) => (
          <div key={row.k} className="info-row">
            <span>{row.k}</span>
            <span>{row.v}</span>
          </div>
        ))}
        <div className="info-actions">
          <button type="button" onClick={() => onReveal(path)} disabled={!path.startsWith("/")}>
            在访达中显示
          </button>
          <button type="button" className="linkish" title="这一版不交给别的应用">
            用其他应用打开…
          </button>
        </div>
      </aside>
    </div>
    </LookProvider>
  );
}

function PageMark({ two }: { two: boolean }) {
  return (
    <span className="page-mark">
      <span />
      {two ? <span /> : null}
    </span>
  );
}
