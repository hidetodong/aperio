import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MSG } from "../../messages";
import ZipView from "./ZipView";
import type { ZipList } from "./readZip";

function sampleList(): ZipList {
  return {
    entries: [
      { name: "a.txt", dir: false },
      { name: "<b>bad</b>", dir: false },
      { name: "dir/", dir: true },
    ],
    truncated: false,
    preview: async (entry) => {
      if (entry === "a.txt") return { kind: "text", name: entry, mode: "plain", text: "包里的正文" };
      if (entry === "pic.png") return { kind: "image", name: entry, bytes: new Uint8Array([1]), mime: "image/png" };
      return { kind: "note", message: MSG.zipInnerSkipped };
    },
  };
}

describe("压缩包画面", () => {
  it("列出名字，点文本才看到正文，标记不当成标签", async () => {
    const ready: string[] = [];
    const { container } = render(
      <ZipView
        url="blob:zip"
        name="a.zip"
        loadZip={async () => sampleList()}
        viewers={{
          text: ({ text }) => <p>{text}</p>,
          image: ({ url, name }) => <img alt={name} src={url} />,
          pdf: ({ url }) => <p>{url}</p>,
        }}
        onReady={() => ready.push("ready")}
      />,
    );
    await waitFor(() => expect(container.textContent).toContain("a.txt"));
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("<b>bad</b>");
    expect(container.textContent).not.toContain("包里的正文");
    expect(ready).toEqual(["ready"]);
    fireEvent.click(container.querySelector("button")!);
    await waitFor(() => expect(container.textContent).toContain("包里的正文"));
  });

  it("换一个包之后上一份正文不留，坏包不通知能记入最近列表", async () => {
    const onFail = vi.fn();
    const onReady = vi.fn();
    const loadZip = async (url: string): Promise<ZipList> => {
      if (url === "blob:bad") throw "不是压缩包";
      return {
        entries: [{ name: url, dir: false }],
        truncated: true,
        preview: async () => ({ kind: "text", name: url, mode: "plain", text: url === "blob:a" ? "旧名单" : "新名单" }),
      };
    };
    const { container, rerender } = render(
      <ZipView
        url="blob:a"
        name="a.zip"
        loadZip={loadZip}
        viewers={{ text: ({ text }) => <p>{text}</p> }}
        onReady={onReady}
      />,
    );
    await waitFor(() => expect(container.textContent).toContain("blob:a"));
    fireEvent.click(container.querySelector("button")!);
    await waitFor(() => expect(container.textContent).toContain("旧名单"));
    rerender(
      <ZipView
        url="blob:b"
        name="b.zip"
        loadZip={loadZip}
        viewers={{ text: ({ text }) => <p>{text}</p> }}
        onReady={onReady}
      />,
    );
    await waitFor(() => expect(container.textContent).toContain("blob:b"));
    expect(container.textContent).not.toContain("旧名单");
    expect(container.textContent).toContain(MSG.zipListTruncated);
    rerender(<ZipView url="blob:bad" name="bad.zip" loadZip={loadZip} onFail={onFail} onReady={onReady} />);
    await waitFor(() => expect(onFail).toHaveBeenCalledWith("不是压缩包"));
  });

  it("卸掉之后晚到的失败不交出去", async () => {
    let rejectLoad: (error: unknown) => void = () => undefined;
    const onFail = vi.fn();
    const { unmount } = render(
      <ZipView
        url="blob:a"
        name="a.zip"
        onFail={onFail}
        loadZip={() =>
          new Promise((_resolve, reject) => {
            rejectLoad = reject;
          })
        }
      />,
    );
    unmount();
    rejectLoad(new Error("晚到"));
    await Promise.resolve();
    expect(onFail).not.toHaveBeenCalled();
  });
});
