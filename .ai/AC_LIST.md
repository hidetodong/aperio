---
状态: ack-frozen
ACK 日期: 2026-09-29
---
> ⚠️ 危险模式：本产物由模型自主 ACK（已过 §5 自审门），未经用户确认（ITER-0001，2026-09-29）

<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0001

## Goal

- 在自己的 Mac 上打开「浮现」的一个窗口，拖进或选中图片和文本就能看，并记住最近打开的文件。
- 格式按家族用到才加载。这一段只启用图片和文本。

## In Scope

- 一个朴素窗口：拖入文件，或用打开按钮选择文件。
- 最近打开列表：去重、最新在前、最多 20 条、重启后还在。
- 图片：JPG、JPEG、PNG、GIF、WebP、SVG、HEIC、HEIF。
- 文本：Markdown、TXT、HTML，以及任意能当纯文本读的文件。高亮只做 JavaScript、TypeScript、JSON、Python、Go、Rust、SQL、YAML、CSS、Shell。
- 启用名单。这一段只开图片和文本。
- Rust 只做读文本、记最近打开、用系统命令解 HEIC。

## Out of Scope

- PDF、Word、Excel、CSV、PPT、ZIP、MP4、MOV、MP3。
- 编辑、PPT 动画、插件市场、插件隔离。
- 公证、收款、自动更新、Windows、网站。
- 视觉定稿，以及把空闲内存数字本身写成这一段的通过条件。内存和启动时间要量，量完如实记，不在这一段假装已经达标。

## Acceptance Checklist

- [ ] AC1: 拖入一个文件，或用打开按钮选一个文件后，已启用的图片或文本能在窗口里看到内容，并显示文件名。
- [ ] AC2: 成功打开的文件进入最近列表。同一路径只留一条，最新在最前，最多 20 条。列表存在本机应用数据目录，重启后还在。点一条会重新打开。文件已经不在时，说明失败原因，画面上不继续留着上一份内容。
- [ ] AC3: 能看 jpg、jpeg、png、gif、webp、svg、heic、heif。heic 和 heif 先用系统的 sips 转成 png 再显示，不把原始字节交给页面。
- [ ] AC4: Markdown 渲染成阅读内容，原文里的脚本不会留在结果里。HTML 放在不带脚本权限的内嵌框架里。其他纯文本按原样显示。js、jsx、mjs、cjs、ts、tsx、json、py、go、rs、sql、yml、yaml、css、sh、bash、zsh 按对应语言高亮。
- [ ] AC5: 启用名单里 image 和 text 为开，pdf、office、zip、media 为关。关掉的格式显示不支持，且不会去加载查看模块。没有扩展名但内容是合法 UTF-8 的文件，按纯文本打开。认不出的二进制显示不支持。
- [ ] AC6: 打开新文件时，状态里只留这一份。换文件后，上一份的内容引用被丢掉。文本超过 2MB 就拒绝整文件读入，并说明原因。
- [ ] AC7: 图片查看器和文本查看器打成各自的包，主入口不静态引入它们。依赖里没有 Electron，仓库里没有打进来的字体文件。Rust 源码里没有 PDF 或 Office 解析。

## Verification Method

- AC1: 用脚本喂一条打开结果，断言画面状态变成该文件；再在本机把开发窗口拉起来，用样例图片和 Markdown 走一遍打开。
- AC2: 单测最近列表的去重、顺序和 20 条上限。持久化用临时目录读写同一份 JSON。缺文件的失败用一条不存在的路径断言错误，并断言当前内容被清空。
- AC3: 单测扩展名归类。另做一条 HEIC：先用 sips 造一个 heic，再调解码命令，确认产出的是 png，且命令拒绝非 heic 路径。
- AC4: 单测 Markdown 消毒、HTML 的框架属性、高亮语言选择和纯文本分支。
- AC5: 单测名单开关。关掉的家族不会调用加载函数。构建产物里不出现 PDF 查看块。
- AC6: 单测换文件后旧内容引用不再留在状态里。超过 2MB 的文本由读文件函数拒绝。
- AC7: 看构建清单，主包和两个查看器是分开的文件。检查 package.json 和仓库里没有 electron 与字体文件。检查 Rust 源码没有引入 PDF 或 Office 解析库。

## External References

- N/A

## Open Questions / Risks

- 系统网页视图本身就要占几十 MB。空闲内存和冷启动时间这一段会量，但高于 80MB 或慢于 1 秒时，先查是不是提前加载了查看器；查完仍超标，记成剩余风险，不写成已经达标。
- HTML 不执行页面里的脚本。这是阅读，不是把别人的网页当成应用跑。
- HEIC 依赖 Mac 自带的 sips。没有这道系统命令时，HEIC 明确失败，其他图片不受影响。
