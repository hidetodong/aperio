import { useEffect, useRef } from "react";
import type { FileRow } from "./catalog";
import { FileTypeIcon, SearchIcon } from "./icons";

export function PickerDialog({
  query,
  rows,
  onQuery,
  onOpen,
  onClose,
}: {
  query: string;
  rows: FileRow[];
  onQuery: (value: string) => void;
  onOpen: (row: FileRow) => void;
  onClose: () => void;
}) {
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    field.current?.focus();
  }, []);
  return (
    <div className="picker-mask" onClick={onClose}>
      <div className="picker" onClick={(event) => event.stopPropagation()}>
        <label className="picker-field">
          <SearchIcon size={17} />
          <input ref={field} value={query} placeholder="输入文件名…" onChange={(event) => onQuery(event.target.value)} />
        </label>
        <div className="picker-section">文件</div>
        <div className="picker-list">
          {rows.length === 0 ? <p className="picker-empty">没有匹配的文件，回车可以选择一个</p> : null}
          {rows.map((row) => (
            <button key={row.path} type="button" className="picker-row" onClick={() => onOpen(row)}>
              <FileTypeIcon name={row.name} />
              <span className="picker-name">{row.name}</span>
              <span className="picker-size">{row.sizeLabel}</span>
            </button>
          ))}
        </div>
        <div className="picker-foot">
          <span>↵ 打开 · Esc 关闭</span>
          <span>也可以直接把文件拖进窗口</span>
        </div>
      </div>
    </div>
  );
}
