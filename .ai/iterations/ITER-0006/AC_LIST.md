---
状态: ack-frozen
ACK 日期: 2026-09-30
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
> ⚠️ 危险模式：本产物由模型自主 ACK（已过 §5 自审门），未经用户确认（ITER-0006，2026-09-30）

# AC_LIST — ITER-0006

## Goal

- 现有界面改用 v1.1 的强调色，选中态改为墨色浅底，不再把选中画成蓝色。
- 已经出现的控件继续按组件规范的尺寸和状态工作。打开文件的行为不变。

## In Scope

- 浅色设计变量进入样式。旧强调色 #3d63dd 从 src 里消失。
- 侧栏、列表、文件卡片的选中态，以及打开弹窗结果行的悬停，改为墨色，文字保持正文色。
- 深色主题用白墨保住选中能看见。
- 主按钮、开着的开关、链接、焦点环、阅读进度条使用新强调色。

## Out of Scope

- 不新做复选、单选、菜单、提示条，不引入 lucide-react。
- 不重做禅模式、滚动条自动隐藏、标志和标题对齐。
- 不改格式范围、预览限制、最近列表规则、PDF 成功不进最近列表。
- 不改目录名、包名、包标识，不提交 git。
- 不把设计包抄进 .ai/references。

## Acceptance Checklist

- [x] AC1: src 里不再出现 #3d63dd，也不再出现 61, 99, 221 或 61,99,221。主按钮、开着的开关、链接、焦点环和阅读进度条使用 #2f6fd1 这一支强调色。
- [x] AC2: 浅色下侧栏选中底是 rgba(0, 0, 0, 0.07)、字重 500、字色 #1d1d1f；列表和卡片选中底是 rgba(0, 0, 0, 0.06)、名称字重 600、字色不是蓝；打开弹窗结果行悬停底是 rgba(0, 0, 0, 0.05)。深色下选中底是白墨，字色是浅色正文。
- [x] AC3: 浅色变量与 v1.1 tokens.css 一致。侧栏行高 30、列表行高 36、分段选项高 24、开关 38×22、工具栏搜索高 28、主搜索高 48。依赖里没有 lucide-react。标题仍上移 1.5px。主包与查看器仍然分开。
- [x] AC4: PDF 成功打开仍不进最近列表。package.json 的 name 仍是 emerge，包标识仍是 local.emerge.app。

## Verification Method

- AC1: 用脚本扫 src 下的样式和组件，确认旧蓝色不在；浏览器里读主按钮、开关、链接、焦点环和阅读进度条的计算色。
- AC2: 浏览器里分别切浅色和深色，读侧栏选中、列表选中和弹窗结果行悬停的计算样式。
- AC3: 对照 tokens.css；浏览器读控件高度；检查 package.json 没有 lucide-react；样式里仍有 translateY(-1.5px)；构建后跑 scripts/check-chunks.mjs。
- AC4: 跑 openFile 测试里「PDF 成功不进最近列表」那一条；读 package.json 和 tauri 配置里的标识。

## External References

- N/A。v1.1 设计包在仓库外，没有抄进 .ai/references。数值以 /tmp/aperio-v11/design_handoff_aperio/tokens.css 和 COMPONENTS.md 为准。

## Open Questions / Risks

- 本段没有单独的 git 回退点。工作树原先就不干净，按约定不提交。
- 深色白墨没有设计稿。系统窗口这一轮不重开，浏览器结果不能当成系统窗口已经点过。
- 胶片条 10px 和设置色块 11px 这一轮不改。
