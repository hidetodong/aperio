import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MSG } from "../../messages";
import { HtmlFrame } from "./TextView";

const realSetAttribute = Element.prototype.setAttribute;

afterEach(() => {
  Element.prototype.setAttribute = realSetAttribute;
});

describe("HTML 框架", () => {
  it("确认隔离属性还在才放入正文", () => {
    render(<HtmlFrame html="<p>页</p><script>alert(1)</script>" name="页" />);
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("sandbox")).toBe("");
    expect(frame?.getAttribute("srcdoc")).toContain("页");
    expect(frame?.getAttribute("data-viewer")).toBe("text");
  });

  it("隔离属性写不进去时只留提示", () => {
    Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
      if (this instanceof HTMLIFrameElement && name === "sandbox") {
        this.removeAttribute("sandbox");
        return;
      }
      return realSetAttribute.call(this, name, value);
    };
    const view = render(<HtmlFrame html="<p>正文标记</p><script>alert(1)</script>" name="页" />);
    expect(view.container.querySelector("iframe")).toBeNull();
    expect(view.getByText(MSG.htmlUnsafe)).toBeTruthy();
    expect(view.container.textContent).not.toContain("正文标记");
    expect(view.container.textContent).not.toContain("alert");
  });
});
