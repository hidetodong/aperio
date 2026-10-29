import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileRow } from "./catalog";
import { ViewerFrame } from "./ViewerFrame";

const row: FileRow = {
  path: "/tmp/a.html",
  name: "a.html",
  ext: "html",
  kind: "text",
  group: "doc",
  sizeLabel: "1 KB",
  dateLabel: "今天",
};

function frame(kind: string, chromeOn: boolean) {
  return render(
    <ViewerFrame
      name={row.name}
      path={row.path}
      index={0}
      total={1}
      ground="paper"
      kind={kind}
      zen={false}
      chromeOn={chromeOn}
      edge={false}
      info={false}
      stripOn={false}
      fit="fit"
      hint={false}
      ink={false}
      video={false}
      copyText={null}
      scrollable={false}
      strip={[]}
      infoRows={[]}
      thumb={row}
      thumbSrc={() => null}
      onWake={() => undefined}
      onEdge={() => undefined}
      onLeave={() => undefined}
      onBack={() => undefined}
      onPrev={() => undefined}
      onNext={() => undefined}
      onFit={() => undefined}
      onToggleZen={() => undefined}
      onToggleStrip={() => undefined}
      onToggleInfo={() => undefined}
      onReveal={() => undefined}
      onExtract={() => Promise.resolve("cancel")}
      onStrip={() => undefined}
    >
      <p>正文</p>
    </ViewerFrame>,
  );
}

describe("阅读顶栏", () => {
  it("网页打开时顶栏不藏，返回按钮还在", () => {
    const view = frame("html", false);
    expect(view.container.querySelector(".stage")?.getAttribute("data-chrome")).toBe("on");
    expect(view.getByTitle("返回 Esc")).toBeTruthy();
  });

  it("其他文件仍会在自动隐藏后收起顶栏", () => {
    const view = frame("markdown", false);
    expect(view.container.querySelector(".stage")?.getAttribute("data-chrome")).toBe("off");
  });

  it("Markdown 用阅读和原文两个按钮区分", () => {
    const view = frame("markdown", true);
    const buttons = [...view.container.querySelectorAll(".glass-tools .vseg button")];
    expect(buttons.map((button) => button.textContent)).toEqual(["阅读", "原文"]);
  });

  it("纯文本没有阅读和渲染切换", () => {
    const view = frame("plain", true);
    const labels = [...view.container.querySelectorAll(".glass-tools .vseg button")].map((button) => button.textContent);
    expect(labels).not.toContain("阅读");
    expect(labels).not.toContain("原文");
    expect(labels).not.toContain("渲染");
  });

  it("网页用渲染和原文两个按钮区分", () => {
    const view = frame("html", true);
    const buttons = [...view.container.querySelectorAll(".glass-tools .vseg button")];
    expect(buttons.map((button) => button.textContent)).toEqual(["渲染", "原文"]);
    expect(buttons[0]?.className).toContain("on");
    expect(buttons[1]?.className).not.toContain("on");
    fireEvent.click(buttons[1]!);
    expect(buttons[1]?.className).toContain("on");
    expect(buttons[0]?.className).not.toContain("on");
  });
});
