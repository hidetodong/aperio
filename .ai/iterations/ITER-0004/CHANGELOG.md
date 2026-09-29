<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0004 变更流

> Office 只预览内容（危险模式） · closed · 2026-09-29

## ADD

- `src/formats/office/readOffice.ts` — 按扩展名把字节交给 CSV、Word、Excel 或 PPT。超过 20MB 不解析。旧格式直接说明 → AC3 AC4
- `src/formats/office/csv.ts` — 自己解析带引号的 CSV。超过 2000 行只留前面并记一笔 → AC3 AC4
- `src/formats/office/docx.ts` — 用 JSZip 读正文段落，只展开一层转义 → AC3
- `src/formats/office/xlsx.ts` — 用 SheetJS 读已经存好的格子，不重算公式 → AC3
- `src/formats/office/pptx.ts` — 用 JSZip 按页码读每页文字 → AC3
- `src/formats/office/OfficeView.tsx` — 正文出现后才允许记入最近列表。解析失败把原因交出去。换文件丢掉上一份 → AC4 AC5
- `src/formats/office/OfficeBody.tsx` — 段落、幻灯片和表格都用文本节点画。多张表可以换。截断时说明后面还有 → AC3 AC4
- `src/formats/office/model.ts` — 行数上限、体积上限，以及三种预览结果的形状 → AC4

## EDIT

- `src/formats/enable.ts` — 启用名单打开 office。图片、文本、PDF 仍开，压缩包和影音仍关 → AC1
- `src/formats/load.ts` — Office 查看器按需加载，不进主包 → AC1 AC2
- `src/formats/route.ts` — 旧的 doc、xls、ppt 仍算 Office 家族，但单独标成这一段不看 → AC3
- `src/messages.ts` — 旧格式和超过 20MB 各有一句说明 → AC4
- `src/open/openFile.ts` — 新格式只确认文件还在并交出地址。旧格式不读也不确认 → AC4
- `src/open/session.ts` — 当前内容可以是 Office。正文出现之后才进最近列表。失败不追加 → AC4 AC5
- `src/App.tsx` — 接上 Office 画面。浏览器里超过 20MB 不生成临时地址。解析失败显示原因 → AC4 AC5
- `src/App.css` — Office 在自己的滚动区域里看，表格有格子线 → AC3
- `scripts/check-chunks.mjs` — 主包里不许出现 Office 查看器或解析库，单独一块里必须有 → AC2
- `scripts/check-boundaries.mjs` — 允许前端依赖 JSZip 和 SheetJS，仍禁止 Rust 解析 Office → AC2
- `package.json` — 增加 JSZip 和 SheetJS → AC2

## DELETE

- 无
