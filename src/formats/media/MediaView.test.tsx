import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MSG } from "../../messages";
import MediaView from "./MediaView";

describe("影音画面", () => {
  it("视频和音频都交给播放标签，能播才通知，失败不通知成功", () => {
    const onReady = vi.fn();
    const onFail = vi.fn();
    const video = render(<MediaView url="blob:movie" name="a.mp4" onReady={onReady} onFail={onFail} />);
    const player = video.container.querySelector("video");
    expect(player?.getAttribute("src")).toBe("blob:movie");
    expect(player?.hasAttribute("autoplay")).toBe(false);
    expect(video.container.querySelector("[data-viewer='media']")).not.toBeNull();
    fireEvent.error(player!);
    expect(onFail).toHaveBeenCalledWith(MSG.mediaFailed);
    expect(onReady).not.toHaveBeenCalled();

    const audio = render(<MediaView url="blob:song" name="a.mp3" onReady={onReady} onFail={onFail} />);
    const sound = audio.container.querySelector("audio");
    expect(sound?.getAttribute("src")).toBe("blob:song");
    fireEvent.loadedMetadata(sound!);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("换文件后上一份地址不留", () => {
    const { container, rerender } = render(<MediaView url="blob:a" name="a.mov" />);
    expect(container.querySelector("video")?.getAttribute("src")).toBe("blob:a");
    rerender(<MediaView url="blob:b" name="b.mov" />);
    expect(container.querySelector("video")?.getAttribute("src")).toBe("blob:b");
    expect(container.textContent).not.toContain("blob:a");
  });
});
