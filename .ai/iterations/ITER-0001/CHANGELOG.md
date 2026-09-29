<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0001 变更流

> 窗口壳、最近打开、图片和文本 · closed · 2026-09-29

## ADD

- `src/App.tsx` — 朴素窗口：打开、拖入、最近列表，查看器用到才加载 → AC1
- `src/recents.ts` — 同一路径只留一条，最新在前，最多 20 条 → AC2
- `src-tauri/src/lib.rs` — 最近列表写成应用数据目录里的 JSON，HEIC 解成单独的缓存图 → AC2
- `src/formats/route.ts` — 按扩展名归到图片、文本或后面的格式 → AC3
- `src-tauri/src/files.rs` — 用系统 sips 把 HEIC 转成 PNG，拒绝别的扩展名 → AC3
- `src/formats/text/render.ts` — Markdown 先排版再消毒，环境不支持时改为转义，不把脚本原样留下 → AC4
- `src/formats/text/TextView.tsx` — HTML 放进不带脚本权限的框架，约定语言才高亮 → AC4
- `src/formats/enable.ts` — 这一段只开图片和文本 → AC5
- `src/formats/load.ts` — 关掉的格式没有加载函数 → AC5
- `src/open/openFile.ts` — 换文件时只留当前这一份，打不开就清掉上一份 → AC6
- `src/open/session.ts` — 换走浏览器临时地址时收回，不收回正式窗口的资源地址 → AC6
- `scripts/check-chunks.mjs` — 确认主包和两个查看器是分开的 → AC7
- `scripts/check-boundaries.mjs` — 确认没有 Electron、打进来的字体，以及 PDF 或 Office 解析 → AC7

## EDIT

- 无

## DELETE

- 无
