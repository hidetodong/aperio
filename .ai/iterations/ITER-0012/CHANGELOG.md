<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0012 变更流

> Markdown 能看清 · closed · 2026-10-28

## ADD

- 无

## EDIT

- `src/formats/text/render.ts` — 清洗之后，相对图片按这份 Markdown 所在目录换成文件地址，https 保持原样 → AC1
- `src/App.tsx` — 在应用里打开 Markdown 时，把文件路径和文件地址函数交给阅读区 → AC1
- `src-tauri/tauri.conf.json` — 图片名单放行 https，脚本名单不动 → AC2
- `src/App.css` — 文章标题拉开字号，表格加框线，链接用已有强调色；标题和表头固定深色，避免深色主题下发白 → AC3
- `src/formats/text/render.test.ts` — 钉住路径改写、图片名单、标题表格和脚本清洗 → AC1、AC2、AC3、AC4
- `src/formats/text/TextView.tsx` — Markdown 可以切到原文，原文按字面显示，不排成文章
- `src/formats/text/TextView.test.tsx` — 原文模式下正文仍是源码，不排成文章
- `src/shell/ViewerFrame.tsx` — 看 Markdown 时工具栏有「阅读」和「原文」
- `src/shell/look.tsx` — 原文开关随当前文件清掉
- `src/messages.ts` — 认不出或明确不打开的格式，统一说「暂不支持的文件格式」
- `src/open/openFile.ts` — 打不开且没有更具体的原因时，用同一句
- `src/formats/office/OfficeView.tsx` — 文档读不出来时用同一句
- `src/formats/zip/ZipView.tsx` — 压缩包读不出来时用同一句

## DELETE

- 无
