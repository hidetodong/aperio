import { AperioLogo } from "./AperioLogo";
import { dragSubtitle, dragTitle, type DragView } from "./homeDrag";
import { ClockIcon, FolderIcon, SearchIcon } from "./icons";

export function HomeScreen({
  drag,
  onSearch,
  onBrowse,
  onRecent,
}: {
  drag: DragView;
  onSearch: () => void;
  onBrowse: () => void;
  onRecent: () => void;
}) {
  const idle = drag.phase === "idle";
  return (
    <div className="home" data-drag={drag.phase} data-tauri-drag-region="deep">
      <div className="home-spacer" />
      <div className="home-col">
        <div className="home-icon">
          <div className="home-glow" />
          <div className="home-ring" />
          <AperioLogo size={96} decorative />
        </div>
        <div className="home-copy">
          <div className="home-title">
            {dragTitle(drag)}
            {idle ? (
              <svg className="home-arrow" width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M36 4C30 2 20 4 14 12S8 22 6 25" />
                <path d="M3.5 19.5 6 25.5l5.5-3.2" />
              </svg>
            ) : null}
          </div>
          <div className="home-sub">{dragSubtitle(drag)}</div>
        </div>
        <div className="home-rest">
          <button type="button" className="home-search" onClick={onSearch}>
            <SearchIcon size={17} />
            <span>或者，搜索文件名…</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="home-pills">
            <button type="button" onClick={onBrowse}>
              <FolderIcon />
              浏览目录
            </button>
            <button type="button" onClick={onRecent}>
              <ClockIcon />
              最近打开
            </button>
          </div>
        </div>
      </div>
      <div className="home-spacer" />
    </div>
  );
}
