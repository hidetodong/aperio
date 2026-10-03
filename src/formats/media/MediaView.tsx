import { useEffect, useRef } from "react";
import { MSG } from "../../messages";
import { useLook } from "../../shell/look";
import { extensionOf } from "../route";

function MediaSession({
  url,
  name,
  onFail,
  onReady,
  bare = false,
}: {
  url: string;
  name: string;
  bare?: boolean;
  onFail?: (message: string) => void;
  onReady?: () => void;
}) {
  const onFailRef = useRef(onFail);
  const onReadyRef = useRef(onReady);
  onFailRef.current = onFail;
  onReadyRef.current = onReady;
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    return () => {
      readyRef.current = true;
    };
  }, [url, name]);

  function ready() {
    if (readyRef.current) return;
    readyRef.current = true;
    onReadyRef.current?.();
  }

  function failed() {
    if (readyRef.current) return;
    readyRef.current = true;
    onFailRef.current?.(MSG.mediaFailed);
  }

  const audio = extensionOf(name) === "mp3";
  const look = useLook();
  const ambientRef = useRef<HTMLVideoElement>(null);
  if (audio) {
    return <audio data-viewer="media" src={url} controls onLoadedMetadata={ready} onError={failed} />;
  }
  const ambient = look.zen && look.family === "video";
  return (
    <div className="video-stage">
      <video
        className="media-player"
        data-viewer="media"
        src={url}
        controls={!bare}
        playsInline
        onLoadedMetadata={ready}
        onError={failed}
        onTimeUpdate={(event) => {
          const back = ambientRef.current;
          if (!back) return;
          const front = event.currentTarget;
          if (Math.abs(back.currentTime - front.currentTime) > 0.35) back.currentTime = front.currentTime;
          if (front.paused) back.pause();
          else void back.play().catch(() => undefined);
        }}
      />
      {ambient ? <video ref={ambientRef} className="video-ambient" src={url} muted playsInline aria-hidden="true" /> : null}
    </div>
  );
}

export default function MediaView(props: {
  url: string;
  name: string;
  bare?: boolean;
  onFail?: (message: string) => void;
  onReady?: () => void;
}) {
  return <MediaSession key={`${props.url}\0${props.name}`} {...props} />;
}
