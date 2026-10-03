<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
> ⚠️ 危险模式：本产物由模型自主 ACK（已过 §5 自审门），未经用户确认（ITER-0006，2026-09-30）

# TECH_PLAN — ITER-0006

方案状态: pass

方案审查日期: 2026-09-30
方案审查方式: dangerous-self-review

## Design Decisions

### Goal

- 支撑 AC1 到 AC4。只改颜色、选中态和已有控件与变量的衔接，不改打开行为。

### Files / Modules to Change

- 新增 src/shell/tokens.css，内容与 v1.1 tokens.css 相同，只含浅色变量。
- 改 src/shell/shell.css：引入变量，旧的蓝色选中改成墨色别名；深色覆盖白墨；选中文字改回正文色并加重；主按钮、开关、进度条和信息面板链接改用变量。
- 改 src/App.css 的焦点环，改用 --focus-ring。
- 改 src/shell/catalog.ts 里三处类型色 #3d63dd，改成规范里的 #2f6fd1。
- 改 src/shell/HomeScreen.tsx 的拖拽底色，改成按强调色混合 7%，不再写死旧蓝。

### Interface / Contract

- 不改打开、最近列表和 Tauri 命令。
- 样式别名保持现有名字：--selected、--side-on、--accent-2。--accent 只在 tokens.css 的 :root 定义，组件上不再写死，避免循环引用。
- 打开弹窗本身是浅色玻璃。它的结果行悬停写死 rgba(0, 0, 0, 0.05)，不跟着深色白墨走，否则深色主题下悬停会看不见。

### State / Boundary

- 主题仍由 .app 的 data-theme 决定。深色只覆盖表面和墨色，不改强调色。
- 不新增控件，不改查看器的显隐逻辑。
- 不改 package.json 的 name，不改 local.emerge.app。

### 取舍

- 采用把新变量映射到旧名字，而不是把每条样式都改成新名字。改动面小，选中逻辑仍集中在几条规则上。
- 不引入 lucide-react。现有图标已经是稿子的形状，加依赖会扩大包，也不服务这四条验收。
- 深色不用规范里的黑墨。黑墨在 #1c1c1e 上几乎看不见。白墨比例：悬停 6%、填充 8%、填充悬停 12%、列表选中 8%、侧栏选中 10%、列表选中悬停 10%、侧栏选中悬停 12%、开关关闭 22%。
- 阅读进度条的填色从白色改为强调色。视频进度条仍是白色，因为它躺在深色胶囊上，规范的视频行没有要求改成蓝。
- 不重做禅模式和滚动条。胶片 10px、色块 11px 留着。

### Plan Admission

- AC Coverage：AC1 由清掉旧蓝和把主按钮、开关、链接、焦点环、进度条接到 --accent 覆盖。AC2 由选中和悬停规则覆盖，深色由白墨覆盖。AC3 由 tokens 原文、现有尺寸和分包检查覆盖。AC4 由不改打开代码，并用原测试和标识读取兜住。
- Assumptions：开发服务仍在 http://[::1]:1420/。浅色和深色都能用 data-theme 切。用户的系统偏好是深色，但验收要两种都看。
- Alternatives / Trade-offs：整份重写样式被放弃，因为会碰到已经对过的布局。把黑墨原样用于深色被放弃，因为看不见。新做规范里还没有的控件被放弃，因为这一轮没有入口。
- Failure Modes：若 .app 再写一遍 --accent，会盖住 :root，旧蓝或循环引用会回来。若弹窗悬停用深色白墨，浅色弹窗上会消失。若只改变量、不改选中文字的 color，字会仍是蓝。
- Impact / Scope Challenge：影响面停在样式和三处类型色。更小的做法是只替换十六进制，但选中规则仍把字设成强调色，AC2 会失败，所以必须改那几条 color 和字重。
- Verification Blind Spots：浏览器看的是开发服务，不是 Tauri 系统窗口。没有量冷启动和内存。没有单独 git 锚点。
- Verdict：pass。没有必须先改方案才能写的缺陷。

### Execution Steps

- [ ] 写入 tokens.css，并让 shell.css 引入它 → AC1 AC3
- [ ] 替换强调色、选中底、选中字色和字重、弹窗悬停、进度条填色 → AC1 AC2
- [ ] 深色白墨覆盖 → AC2
- [ ] 焦点环、类型色、拖拽底色改掉旧蓝 → AC1
- [ ] 跑分包检查和 PDF 最近列表测试，浏览器读计算样式 → AC3 AC4

### Risks / Open Questions

- 没有干净回退点。见 CONCEPT。
- 深色比例未经设计稿确认。浏览器里看不清就调比例，不扩大范围。

## Failure Paths

- 旧蓝残留在内联样式或类型色里：用扫描脚本拦住，漏了就补那一处。
- 深色选中看不见：白墨已经写进深色覆盖；浏览器读到的 alpha 若是 0，就提高比例，不改回蓝色。
- 弹窗在深色主题下悬停消失：悬停写死浅色表面上的黑 5%，不走白墨变量。
- 分包检查失败：说明查看器被打进主包。这一轮不改加载方式；若失败，先确认是不是构建产物过期，再查是否误改了动态导入。不放宽检查。
- PDF 测试失败：停止界面收口，先恢复打开路径。这一轮的样式改动不应该碰到它。

## Test Strategy

- 不声明 TDD cycle。这是颜色和选中态替换，没有先写会失败的新测试再改行为的必要。原有 openFile 测试必须仍然通过。
- AC1 用扫描脚本，退出码 0 才算旧蓝已清。
- AC2 用浏览器读取计算样式，浅色和深色各一次。
- AC3 先构建，再跑 scripts/check-chunks.mjs；并读控件高度和 package.json。
- AC4 跑 vitest 的 openFile 测试，并读包标识。
- 证据用 verification evidence 工具封存，不在报告里手填通过。

## References Compliance

- N/A。没有把设计包写进 .ai/references。实现时对照仓库外的 tokens.css，不改那份只读副本。
