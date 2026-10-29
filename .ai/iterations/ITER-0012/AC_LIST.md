---
状态: ack-frozen
ACK 日期: 2026-10-28
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0012

## Goal

- 打开 Markdown 时，跟文件放在一起的图能显示，外链图也不被挡住，标题和表格能看出来是标题和表格。

## In Scope

- 相对图片按这份 Markdown 所在目录拼成绝对路径，再用现有的文件地址显示。
- 图片加载名单放行 https。脚本名单不动。
- 文章区里一级、二级、三级标题拉开字号，表格加上框线。链接用应用已有的强调色。

## Out of Scope

- 不改窗口布局，不换阅读栏宽度。
- 不放行 http 图片，也不放行脚本。
- 压缩包里的 Markdown 没有磁盘目录，这次不改它的图片地址。
- 网页文件打挂整窗的问题这次不改。

## Acceptance Checklist

- [ ] AC1: 跟 Markdown 放在同一目录的相对图片，会换成该目录下的文件地址。https 图片地址保持原样。
- [ ] AC2: 应用的图片加载名单包含 https，脚本名单仍然只有本应用自己。
- [ ] AC3: 文章里的一级标题大于二级，二级大于正文。表格单元格有框线。链接颜色是应用已有的强调色。
- [ ] AC4: Markdown 里的脚本和事件属性仍然被去掉。

## Verification Method

- AC1: 渲染测试对照相对路径、上级目录和外链地址。
- AC2: 读取 `src-tauri/tauri.conf.json` 的图片名单和脚本名单。
- AC3: 读取 `src/App.css` 里文章标题、表格和链接的规则。
- AC4: 沿用现有渲染测试，确认脚本和事件属性不在结果里。

## External References

- N/A

## Open Questions / Risks

- 放行 https 之后，整份应用里的图片都可以加载外链，不只是 Markdown。这是已经点头的取舍。
- 网页白屏还没查，不在这份验收里。
