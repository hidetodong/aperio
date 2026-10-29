# Markdown 的图和排版

## 本次交付目标

打开 Markdown 时，跟文件放在一起的图能显示，外链图地址不被改掉，标题和表格在现有阅读栏里能看出来。

## 已完成内容

- 相对图片按这份 Markdown 所在目录拼成路径，再交给现成的文件地址。https 地址保持原样。
- 应用的图片名单放行 https。脚本名单没有放行。
- 一级标题 20px，二级 17px，正文仍是 15px。表格有框线。链接用应用已有的强调色。
- 标题和表头固定深色。文章底是白的，不再跟着深色主题变成浅字。
- 脚本和事件属性仍会被去掉。

## 关键变更 / 用户可感知变化

Markdown 里同一目录的图可以出来。标题和表格能跟正文分开。外链图不再被改成别的地址，但本机代理打不开 https 时，徽章仍会是裂图。

看 Markdown 时还可以切到原文。认不出或不打开的格式，提示改成「暂不支持的文件格式」。这两件不在本轮验收里。

## 高层影响范围

动的是 Markdown 怎么出图、文章区的排版，以及图片能不能加载 https。压缩包里的 Markdown 没有磁盘目录，图片地址不动。窗口布局没改。

## 验证方式与结果摘要

证据在 `.ai/iterations/ITER-0012/evidence/markdown-render/record.json`。渲染和阅读区一共 11 条通过，四条验收都盖住了。说明在 `.ai/iterations/ITER-0012/VERIFY_REPORT.md`。

开发窗口里早先看过本地图和标题。那次没有另封证据。外链徽章仍是裂图。

## 已知剩余风险 / 延后事项

- 外链徽章仍可能出不来。本机 https 代理握手失败。
- 图片名单有没有在系统窗口里生效，这次没有封成证据。
- 打开网页文件把整窗打挂，这轮明确不做，仍然没查。里程碑里另列为下一条路线，还没开迭代。
- 原文模式和统一的打不开文案已经写进代码，但不在这四条验收里。
- 没有另一人复查。

## 引用（只引用，不嵌入）

- `.ai/iterations/ITER-0012/CONCEPT.md`
- `.ai/iterations/ITER-0012/AC_LIST.md`
- `.ai/iterations/ITER-0012/TECH_PLAN.md`
- `.ai/iterations/ITER-0012/VERIFY_REPORT.md`
- `.ai/iterations/ITER-0012/CHANGELOG.md`
- `.ai/iterations/ITER-0012/evidence/markdown-render/record.json`
