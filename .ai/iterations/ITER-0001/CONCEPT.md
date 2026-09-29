> 分流: 完整 | 命中升级信号: 多文件改动、契约变更、设计取舍 | 2026-09-29

<!-- butler-artifact-template: 1.0.0 artifact=concept -->
# CONCEPT — ITER-0001 · 窗口壳、最近打开、图片和文本

## Current Understanding

- 浮现第一段只做自己 Mac 上的轻窗口：拖进文件就能看图片和文本，记住最近打开的，格式按家族用到才加载。PDF、Office、压缩包和影音不在这一段。
- 已确认：产品名是浮现，英文 Emerge，工程目录是 emerge
- 已确认：只给自己在 Mac 上用，不对外分发
- 已确认：这一段只做窗口壳、最近打开、图片、文本，以及格式启用名单和按需加载
- 已确认：插件指懒加载模块加启用名单，不是插件市场，也不做插件隔离
- 已确认：壳用 Tauri 2，界面用 TypeScript、React、Vite。Rust 只打开文件、读字节、用系统能力解 HEIC
- 已确认：文本含 Markdown、TXT、HTML 和任意纯文本。高亮只做 JavaScript、TypeScript、JSON、Python、Go、Rust、SQL、YAML、CSS、Shell
- 已确认：图片含 JPG、PNG、GIF、WebP、SVG、HEIC
- 已确认：不打包浏览器，不打包中文字体，用系统字体
- 已确认：冷启动到能拖文件控制在 1 秒内。空闲内存按不超过 80MB 来要求。内存里只留当前这一份文件
- 已确认：启用名单这一段先只打开图片和文本。PDF、Office、压缩包和影音先关着，留给后面的路线
- 已确认：界面先做成能拖、能看、能回到最近打开的朴素窗口，视觉不在这一段定稿

## Scope

- Mac 窗口能拖入文件并打开
- 记住最近打开的文件
- 看 JPG、PNG、GIF、WebP、SVG、HEIC
- 看 Markdown、TXT、HTML 和纯文本，并按约定语言高亮
- 格式按家族按需加载，并有一份启用名单

## Open Questions / Risks

- N/A
