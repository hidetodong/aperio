# 浮现个人阅读器第一版

## 本次交付目标

在自己的 Mac 上，用一个轻窗口看常见文件。窗口能拖文件、能记最近打开。PDF 翻页，Word、Excel、PPT 和 CSV 只看内容，文本和图片能看，ZIP 能列名单并预览里面的文本、图片和 PDF，MP4、MOV、MP3 交给系统播放。不做编辑，不对外分发，不做插件市场。这五段都由模型在危险模式里自主推进，没有逐项等人点头。每一段收口前的审查都是同一上下文做的，不是另一份干净上下文的独立复核。

## 已完成内容

- 窗口、最近打开、图片和文本，以及格式按需加载的启用名单。
- 打开失败会说出原因。缺了的文件不会装成成功。连续打开只认最后一次。
- PDF 只画看得到的页。
- Word、Excel、PPT 和 CSV 只预览内容。旧的 doc、xls、ppt 说明先不看。
- ZIP 先列名单，再预览里面的文本、图片和 PDF。MP4、MOV、MP3 用播放条播放。tar 和 gz 说明先不看。

各段细节见下面的迭代交付，这里不重复。

## 关键变更 / 用户可感知变化

一个叫「浮现」的窗口。文件拖进去，内容才出来。打不开时会看到原因。图片、文本、Office、压缩包和能播的影音会进入最近打开。成功打开的 PDF 不会进入最近打开。关掉的格式就等于不支持。

## 高层影响范围

程序在 `/Users/cyborgno2/Documents/research/emerge`。壳是 Tauri 2，界面是 TypeScript、React 和 Vite。Rust 只打开文件、读字节、用系统能力解 HEIC。格式解析在前端，用到才加载。没有做公证、收款、自动更新、Windows、网站，也没有插件市场。

## 拆分路线图回填

| 路线 | 落到 | 结果 |
|---|---|---|
| 窗口、最近打开、图片和文本 | `.ai/deliveries/ITER-0001-window-image-text.md` | 已收口 |
| 打开失败说清原因，只认最后一次 | `.ai/deliveries/ITER-0002-last-open.md` | 已收口 |
| PDF 只排看得见的页 | `.ai/deliveries/ITER-0003-pdf-pages.md` | 已收口 |
| Word、Excel、CSV、PPT 只预览 | `.ai/deliveries/ITER-0004-office-preview.md` | 已收口 |
| ZIP 名单、包内预览，以及 MP4、MOV、MP3 | `.ai/deliveries/ITER-0005-zip-and-media.md` | 已收口 |

## 验证方式与结果摘要

五段各自的验收都有机器记录，结论是通过。记录分别在 `.ai/iterations/ITER-0001/evidence/` 到 `.ai/iterations/ITER-0005/evidence/`。浏览器里看过图片、文本、PDF、Office、压缩包和一段 mp3。系统窗口里没有把这些文件再点一遍。冷启动到能接拖放是否在一秒内、空闲时是否不超过 80MB，都没有量过。

## 已知剩余风险 / 延后事项

- 系统窗口没有点过。浏览器里能看，不能当成自己的窗口里已经点过。影音那条内容安全策略也还没在重启后的系统窗口里验证。
- 成功打开的 PDF 仍不进最近列表。当时单独记下了，没有塞进后面的段。
- 冷启动一秒、空闲内存 80MB，是规划时的要求，不是各段的通过线，也没有量过。不写成已经达到。
- 压缩包超过 20MB 时，从本机路径打开会先把字节取下来再拒绝。条目大小读的是库的内部字段。名单上限只限制显示。
- Excel 用的库是 npm 上的 0.18.5，这个版本有公开的原型污染问题。没有换库。
- 五段审查都是同一上下文做的，不是独立复核。

## 引用（只引用，不嵌入）

- `.ai/milestones/MILE-0001/MILESTONE.md`
- `.ai/deliveries/ITER-0001-window-image-text.md`
- `.ai/deliveries/ITER-0002-last-open.md`
- `.ai/deliveries/ITER-0003-pdf-pages.md`
- `.ai/deliveries/ITER-0004-office-preview.md`
- `.ai/deliveries/ITER-0005-zip-and-media.md`
