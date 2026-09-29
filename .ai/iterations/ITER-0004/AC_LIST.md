---
状态: ack-frozen
ACK 日期: 2026-09-29
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0004

> ⚠️ 危险模式：本产物由模型自主 ACK（已过 §5 自审门），未经用户确认（ITER-0004，2026-09-29）

## Goal

- 在自己的 Mac 上打开 Word、Excel、PPT 和 CSV，只看内容，不编辑。

## In Scope

- 启用名单打开 office，图片、文本、PDF 仍开着，压缩包和影音关着
- 查看器按需加载，主包里没有 JSZip 和 SheetJS
- docx 按段落显示正文，pptx 按页显示文字，xlsx 和 csv 显示表格
- 旧的 doc、xls、ppt 说明先不看
- 成功打开进入最近列表；失败不进入，上一份正文不留
- 超过 2000 行只显示前面，并说明后面没显示
- 超过 20MB 不解析
- Rust 依赖里仍然没有 Office 解析库

## Out of Scope

- 编辑、动画、像素级版面、文档里的图片、密码框
- 旧的 doc、xls、ppt 的真实内容
- 压缩包、影音
- 改 PDF 成功不进最近列表这件事
- 真窗口里的观感不作为这一段的自动通过线

## Acceptance Checklist

- [x] AC1: 启用名单里 office 开着，图片、文本、PDF 仍开着，压缩包和影音关着。只有开着的 office 才有加载函数。
- [x] AC2: 构建之后，Office 查看器在主包以外。主包里没有 Office 查看器标记，也没有 JSZip 和 SheetJS。Rust 依赖里没有 Office 解析库。
- [x] AC3: 一份带引号和逗号的 CSV 显示成对应的格子。一份最小 docx 的段落按顺序出现。一份最小 xlsx 的单元格文字出现。一份最小 pptx 按页显示文字。旧的 doc 显示先不看，不去当压缩包拆。
- [x] AC4: 文件不在或内容打不开时，画面显示原因，最近列表不追加，上一份正文不留。超过 20MB 不解析。超过 2000 行时只留下前 2000 行，并说明后面还有。
- [x] AC5: 成功打开的 Office 进入最近列表。换文件后上一份正文不留在画面状态里。

## Verification Method

- AC1: 单测读启用名单和加载函数。关掉的格式没有加载函数。
- AC2: 构建后跑分包检查。依赖边界检查确认 Rust 侧没有 Office 解析库，前端依赖里有 JSZip 和 SheetJS。
- AC3: 用最小文件做解析测试。CSV 用带引号的文本。docx 和 pptx 用测试里生成的压缩包。xlsx 用测试里生成的工作簿。旧 doc 断言文案，并断言没有去读内容。
- AC4: 单测让确认文件失败，断言原因原文、最近列表不变、上一份不在。再断言超大和超行数。
- AC5: 单测断言成功的 Office 叠进最近列表，失败不叠。换文件的状态里没有上一份正文。

## External References

- N/A

## Open Questions / Risks

- 真窗口里的观感不在自动验收里。
- 公式不重算，只显示文件里已经存好的文字。
