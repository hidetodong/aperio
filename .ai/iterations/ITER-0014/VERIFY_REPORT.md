<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0014

## Verification Summary

- 看网页时顶栏留着，返回按钮还在。页面正文等隔离属性确认仍是空字符串之后才放进框。放不上就只显示「这个网页没法安全打开」，框卸掉。读失败仍是原来的原因。
- 自动检查 4 个文件、38 条通过。证据是 html-isolation。系统窗口里没有点到返回。

## AC Status

- [x] AC1 (auto·可靠): 网页在顶栏本应收起时，阶段标记仍是打开，返回按钮标题是「返回 Esc」 ✓
- [x] AC2 (auto·可靠): 放行时隔离属性是空字符串，正文在框里。属性被丢掉时框不在，只显示「这个网页没法安全打开」，正文和脚本文字不出现 ✓
- [x] AC3 (auto·可靠): 网页按钮是「渲染 / 原文」。Markdown 在同样条件下阶段标记是收起，按钮是「阅读 / 原文」 ✓
- [x] AC4 (auto·可靠): 读入被拒绝时，当前结果是失败，原因是「文件超过 2MB，这一段不整份读入」 ✓

## 人测道小结

- N/A（本轮无 human·待人 档 AC，人测道不适用）。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| html-isolation | AC1, AC2, AC3, AC4 | captured | passed | `.ai/iterations/ITER-0014/evidence/html-isolation/record.json` |

## Verification Results

- `npx vitest run` 跑了隔离框、文本视图、阅读顶栏和打开文件，38 条通过，退出码 0。证据是 html-isolation。记录在 `.ai/iterations/ITER-0014/evidence/html-isolation/record.json`。
- 本机浏览器里曾打开设计页，数到窗口红点 9 个、页面灰 64458 处，说明那一版大页面画出来了。那次没有封进证据记录，这一轮没有重跑，只记为 reported，不拿来勾验收。
- 同一轮浏览器里，返回按钮的命中是按钮本身，点一下回到首页。这也没有封进证据记录。
- 系统窗口这一下没有点到。前台停在别的程序上，没有往正在跑的阅读器里送按键。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：38 条自动检查通过。没有删测试，也没有绕过检查。
- Workspace Scope：N/A。这轮验收没有钉住外部需求文档。
- Tech Plan Alignment：隔离框由页面自己插入。先确认隔离属性仍是空字符串，再写入正文，失败就卸框并提示。顶栏不收沿用阅读框里已有的网页条件，这一轮没有改那一行。方案原先写不改样式表。网页宿主没有高度时框是空白，所以补了一条只作用于网页的高度。大页面大约 800 毫秒后再写一次正文，窗口拉大后不重算像素。
- References Compliance：N/A。

## References Compliance

- N/A

## Remaining Risks

- 系统窗口里的返回没有点到。浏览器里点过一次，没有封进证据记录。
- 空的隔离属性以后若不被网页视图遵守，提示不会出现。
- 窗口拉大后，隔离框不跟着重算。后写尺寸会把大页面冲成空白。
- 800 毫秒后再写一次，是本机浏览器里让大页面画出来的办法。系统网页视图只确认过脚本被挡住，没有用同一份设计页再量像素。
- 没有另一人复查。这次审查和实现是同一次工作，不是独立复核。通过只表示这次自审没有必须先改的问题。
- 打开文件后选择框有时不自己关上。这轮没改。

## Handoff / Next Step

- 四条验收都有自动证据。迭代已于 2026-10-28 收口。里程碑 MILE-0003 仍开着，这一轮不收口。
