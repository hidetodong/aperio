import { useState } from "react";
import type { OfficeModel } from "./model";

export function OfficeBody({ model }: { model: OfficeModel }) {
  const [sheetIndex, setSheetIndex] = useState(0);
  if (model.kind === "prose") {
    return (
      <div className="office-scroll">
        {model.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    );
  }
  if (model.kind === "slides") {
    return (
      <div className="office-scroll">
        {model.slides.map((slide) => (
          <section key={slide.number}>
            <h2>第 {slide.number} 页</h2>
            {slide.lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </section>
        ))}
      </div>
    );
  }
  const sheet = model.sheets[Math.min(sheetIndex, model.sheets.length - 1)];
  return (
    <div className="office-scroll">
      {model.sheets.length > 1 ? (
        <div>
          {model.sheets.map((item, index) => (
            <button key={item.name} type="button" onClick={() => setSheetIndex(index)}>
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      {sheet ? (
        <table className="office-table">
          <tbody>
            {sheet.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {model.truncated ? <p>后面还有，这一段只显示前 2000 行</p> : null}
    </div>
  );
}
