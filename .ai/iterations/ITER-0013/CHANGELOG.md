<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0013 变更流

> 文字排版和代码高亮 · closed · 2026-10-28

## ADD

- `src/shell/ViewerFrame.test.tsx` — 阅读顶栏测试钉住纯文本没有「阅读 / 原文」和「渲染 / 原文」，Markdown 与网页的两套文案仍在 → AC4

## EDIT

- `src/formats/text/render.ts` — 新增按空行分段。Windows 换行先看成换行，连续空白行不进入段落文字 → AC1、AC2
- `src/formats/text/TextView.tsx` — 纯文本从一整块等宽原文改成文章段落，原文当文字显示 → AC1、AC2
- `src/App.css` — 纯文本改到文章容器：无衬线字体、阅读字号、长行换行。段距沿用文章的 16px，专注底色仍在 → AC1、AC6
- `src/formats/text/TextView.test.tsx` — 钉住空行分段、段内缩进、代码行号和纯文本样式 → AC1、AC2、AC3、AC6
- `src/formats/route.test.ts` — 认不出的 log 仍是 unknown，文本模式仍是纯文本 → AC5

## DELETE

- 无
