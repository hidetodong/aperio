import type { ReactNode } from "react";
import { ASSOC_DESC, KINDS, TABS, type Assoc, type GroupId, type Prefs } from "./catalog";

type Opt<T extends string> = { value: T; label: string };

function Seg<T extends string>({ value, options, onPick }: { value: T; options: Opt<T>[]; onPick: (value: T) => void }) {
  return (
    <div className="seg">
      {options.map((option) => (
        <button key={option.value} type="button" className={option.value === value ? "on" : ""} onClick={() => onPick(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="set-row">
      <div>
        <div className="set-label">{label}</div>
        {desc ? <div className="set-desc">{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={on ? "switch on" : "switch"} onClick={onToggle}>
      <span />
    </button>
  );
}

function Keys({ keys }: { keys: string[] }) {
  return (
    <div className="keycaps">
      {keys.map((key) => (
        <span key={key}>{key}</span>
      ))}
    </div>
  );
}

const KEY_ROWS: { label: string; keys: string[] }[] = [
  { label: "打开文件", keys: ["⌘", "K"] },
  { label: "目录", keys: ["⌘", "L"] },
  { label: "设置", keys: ["⌘", ","] },
  { label: "上一个 / 下一个", keys: ["←", "→"] },
  { label: "缩放", keys: ["⌘", "+", "−"] },
  { label: "文件信息", keys: ["I"] },
  { label: "退出浏览", keys: ["Esc"] },
];

export function SettingsScreen({
  tab,
  prefs,
  assoc,
  onTab,
  onPref,
  onAssoc,
}: {
  tab: string;
  prefs: Prefs;
  assoc: Assoc;
  onTab: (tab: string) => void;
  onPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  onAssoc: (key: GroupId, value: boolean) => void;
}) {
  const current = TABS.find((item) => item.id === tab) ?? TABS[0];
  return (
    <div className="set-screen">
      <aside className="side">
        <div className="side-group">
          {TABS.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "side-row tab on" : "side-row tab"} onClick={() => onTab(item.id)}>
              <span className="tab-chip" style={{ background: item.chip }}>
                {item.label.slice(0, 1)}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </aside>
      <div className="set-main">
        <div className="set-intro">{current.desc}</div>
        <div className="set-card">
          {tab === "general" ? (
            <>
              <Row label="启动时显示" desc="打开应用但未指定文件时">
                <Seg
                  value={prefs.startup}
                  options={[
                    { value: "home", label: "初始界面" },
                    { value: "last", label: "上次文件" },
                    { value: "lib", label: "目录" },
                  ]}
                  onPick={(value) => onPref("startup", value)}
                />
              </Row>
              <Row label="目录默认视图" desc="可在目录中随时切换">
                <Seg
                  value={prefs.dirView}
                  options={[
                    { value: "grid", label: "网格" },
                    { value: "list", label: "列表" },
                  ]}
                  onPick={(value) => onPref("dirView", value)}
                />
              </Row>
              <Row label="打开新文件" desc="从访达双击文件时">
                <Seg
                  value={prefs.newWin}
                  options={[
                    { value: "same", label: "当前窗口" },
                    { value: "new", label: "新窗口" },
                  ]}
                  onPick={(value) => onPref("newWin", value)}
                />
              </Row>
            </>
          ) : null}
          {tab === "look" ? (
            <>
              <Row label="主题">
                <Seg
                  value={prefs.theme}
                  options={[
                    { value: "light", label: "浅色" },
                    { value: "dark", label: "深色" },
                    { value: "system", label: "跟随系统" },
                  ]}
                  onPick={(value) => onPref("theme", value)}
                />
              </Row>
              <Row label="浏览背景" desc="沉浸浏览时内容背后的底色">
                <Seg
                  value={prefs.ground}
                  options={[
                    { value: "ink", label: "墨黑" },
                    { value: "gray", label: "深灰" },
                    { value: "paper", label: "纸白" },
                  ]}
                  onPick={(value) => onPref("ground", value)}
                />
              </Row>
              <Row label="界面密度" desc="工具栏与列表行高">
                <Seg
                  value={prefs.density}
                  options={[
                    { value: "compact", label: "紧凑" },
                    { value: "regular", label: "标准" },
                  ]}
                  onPick={(value) => onPref("density", value)}
                />
              </Row>
            </>
          ) : null}
          {tab === "view" ? (
            <>
              <Row label="自动隐藏工具栏" desc="鼠标静止 2 秒后隐藏，移动即出现">
                <Toggle on={prefs.autoHide} onToggle={() => onPref("autoHide", !prefs.autoHide)} />
              </Row>
              <Row label="显示缩略图栏" desc="在底部显示同文件夹内的其他文件">
                <Toggle on={prefs.strip} onToggle={() => onPref("strip", !prefs.strip)} />
              </Row>
              <Row label="循环浏览" desc="到达最后一个文件后回到第一个">
                <Toggle on={prefs.loop} onToggle={() => onPref("loop", !prefs.loop)} />
              </Row>
              <Row label="图片与视频" desc="双击画面可在填满与完整显示之间切换">
                <Seg
                  value={prefs.fit}
                  options={[
                    { value: "fill", label: "填满窗口" },
                    { value: "fit", label: "完整显示" },
                    { value: "actual", label: "实际大小" },
                  ]}
                  onPick={(value) => onPref("fit", value)}
                />
              </Row>
            </>
          ) : null}
          {tab === "assoc" ? (
            <>
              {KINDS.slice(1).map((item) => {
                const id = item.id as GroupId;
                return (
                  <Row key={id} label={item.label} desc={ASSOC_DESC[id]}>
                    <Toggle on={assoc[id]} onToggle={() => onAssoc(id, !assoc[id])} />
                  </Row>
                );
              })}
            </>
          ) : null}
          {tab === "keys" ? (
            <>
              {KEY_ROWS.map((row) => (
                <Row key={row.label} label={row.label}>
                  <Keys keys={row.keys} />
                </Row>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
