<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0012

## Verification Summary

- Markdown 的相对图、图片名单、标题表格和脚本清洗都有自动检查，11 条通过。
- 开发窗口里早先看过本地图和标题。那次观看没有另封证据。外链徽章仍是裂图。

## AC Status

- [x] AC1 (auto·可靠): 同一目录和上级目录的图换成文件地址，https 地址保持原样 ✓
- [x] AC2 (auto·可靠): 图片名单包含 https，脚本名单仍然只有本应用自己 ✓
- [x] AC3 (auto·可靠): 一级标题 20px，二级 17px，正文 15px。表格有框线。链接用已有强调色 ✓
- [x] AC4 (auto·可靠): Markdown 结果里没有脚本和事件属性 ✓

## 人测道小结

- N/A（本轮无 human·待人 档 AC，人测道不适用）。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| markdown-render | AC1, AC2, AC3, AC4 | captured | passed | `.ai/iterations/ITER-0012/evidence/markdown-render/record.json` |

## Verification Results

- 渲染测试和阅读区测试一共 11 条通过。证据是 markdown-render。
- 内容安全策略写在应用配置里。开发页本身不带这份名单，这次没有用系统窗口证明它已经生效。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：渲染和阅读区测试通过。没有为了通过去删测试或绕过检查。
- Workspace Scope：N/A。这轮验收没有钉住外部需求文档。
- Tech Plan Alignment：清洗之后才改图片地址。相对路径按文件目录拼接，https 保持原样。文件地址函数由界面传入，转换失败留原地址。图片名单只加 https，脚本名单没加。标题没有超过 20px。表格有细框线，链接用已有强调色。压缩包里的 Markdown 不传文件地址函数。
- References Compliance：N/A。

## Remaining Risks

- 外链徽章在开发窗口里仍是裂图。本机 https 代理握手失败，不是这次测试能证明的事。
- 图片名单是否在系统窗口里生效，这次没有封成证据。
- 打开网页文件把整窗打挂，这轮验收明确不做，仍然没查。
- 原文模式，以及打不开时统一说「暂不支持的文件格式」，已经写进代码，但不在这四条验收里。
- 没有另一人复查。通过只表示同一次工作里没有必须先改的问题。

## Handoff / Next Step

- 这四条可以收口。网页打挂仍悬着，不在本轮里。里程碑先不收。
