<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0003 变更流

> PDF 只排看得见的页（危险模式） · closed · 2026-09-29

## ADD

- `src/formats/pdf/PdfView.tsx` — 按地址打开一份 PDF，换文件或离开画面时释放上一份 → AC5
- `src/formats/pdf/PdfPages.tsx` — 只给当前视口里的页建画布，离开视口就拆掉 → AC3
- `src/formats/pdf/pages.ts` — 按每页高度和间隙算出哪些页在视口里 → AC3
- `src/formats/pdf/loadDocument.ts` — 用 pdf.js 读取文档。不询问密码。后台线程失败时由库改到同一线程 → AC4
- `src/formats/pdf/types.ts` — 测试用的文档形状。测试不加载真的 pdf.js
- `scripts/pdfjs-assets.mjs` — 开发和构建时提供字符映射、标准字体和 wasm，不把这些文件拷进源码 → AC2

## EDIT

- `src/formats/enable.ts` — 启用名单打开 pdf，图片和文本仍开，Office、压缩包和影音仍关 → AC1
- `src/formats/load.ts` — pdf 查看器按需加载，不进主包 → AC1
- `src/open/openFile.ts` — PDF 只确认文件还在并交出地址，不读成文本 → AC4
- `src/open/session.ts` — 当前内容可以是一份 PDF。失败不进最近列表，成功也不追加 → AC4
- `src/App.tsx` — 接上 PDF 画面。解析失败显示原因，并收回浏览器临时地址 → AC4
- `src/App.css` — PDF 在自己的滚动区域里翻页 → AC3
- `vite.config.ts` — 挂上 pdf.js 的本地资源
- `scripts/check-chunks.mjs` — 主包里不许出现 PDF 查看器或 pdf.js，单独一块里必须有 → AC2
- `scripts/check-boundaries.mjs` — 允许前端依赖 pdf.js，仍禁止 Rust 解析 PDF，仍禁止仓库另拷字体 → AC2
- `src-tauri/tauri.conf.json` — 页面允许自己的后台线程，并允许 wasm → AC2
- `package.json` — 增加 pdf.js

## DELETE

- 无
