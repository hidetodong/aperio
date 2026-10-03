<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0006

> ⚠️ 危险模式：本轮审查由模型在同一上下文做完，不是另一份干净上下文的独立复核。项目没有打开独立复核。审查结论是 pass。没有必须先改才能交付的问题（ITER-0006，2026-09-30）。

## Verification Summary

- 这一段把现有界面改成 v1.1 的强调色，选中态改成墨色浅底，不再把选中画成蓝色。打开文件的行为不变。
- 审查看过逻辑、命名、性能和安全。没有必须先改才能交付的问题。旧蓝在源码扫描里已经不在。选中规则写在样式里，并用第二次执行复核过。
- 浏览器里读过焦点环、主按钮、开关和深色侧栏选中。列表、卡片和弹窗结果行是探进去的元素，这个浏览器配置里没有真实文件。这不是 Aperio 自己的系统窗口，不写成自动通过。

## AC Status

- [x] AC1 (auto·可靠): 源码里不再有旧强调色。主按钮、开着的开关、链接、焦点环和阅读进度条使用 #2f6fd1 这一支。
- [x] AC2 (auto·弱): 样式里侧栏选中底是黑 7%、字重 500、字色走正文色；列表和卡片选中底是黑 6%、名称字重 600、字色不是蓝；弹窗结果行悬停是黑 5%。深色选中底改成白墨。浏览器里看过，但计算色没有单独的机器记录。
- [x] AC3 (auto·可靠): 浅色变量与 v1.1 的 tokens.css 一致。侧栏行 30、列表行 36、分段 24、开关 38×22、工具栏搜索 28、主搜索 48 仍在。没有 lucide-react。标题仍上移 1.5px。主包与查看器分开。
- [x] AC4 (auto·可靠): 前端测试通过，其中有「PDF 成功不进最近列表」。package.json 的 name 仍是 emerge，包标识仍是 local.emerge.app。

## 人测道小结

- N/A（本轮四条验收都走自动道，人测道不适用）。系统窗口另记在剩余风险，不是验收条目。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| static-scan | AC1, AC3, AC4 | captured | failed | `.ai/iterations/ITER-0006/evidence/static-scan/record.json` |
| static-scan-2 | AC1, AC3, AC4 | captured | passed | `.ai/iterations/ITER-0006/evidence/static-scan-2/record.json` |
| fe-tests | AC4 | captured | passed | `.ai/iterations/ITER-0006/evidence/fe-tests/record.json` |
| frontend-build | AC3 | captured | passed | `.ai/iterations/ITER-0006/evidence/frontend-build/record.json` |
| chunk-split | AC3 | captured | passed | `.ai/iterations/ITER-0006/evidence/chunk-split/record.json` |
| selection-rules | AC2 | captured | passed | `.ai/iterations/ITER-0006/evidence/selection-rules/record.json` |
| review-static-scan | AC1, AC3, AC4 | reproduced | passed | `.ai/iterations/ITER-0006/evidence/review-static-scan/record.json` |
| review-fe-tests | AC4 | reproduced | passed | `.ai/iterations/ITER-0006/evidence/review-fe-tests/record.json` |
| review-chunk-split | AC3 | reproduced | passed | `.ai/iterations/ITER-0006/evidence/review-chunk-split/record.json` |
| review-selection-rules | AC2 | reproduced | passed | `.ai/iterations/ITER-0006/evidence/review-selection-rules/record.json` |

## Verification Results

- AC1：`static-scan` 没跑起来，是检查脚本自己的语法错误，不是界面里还留着旧蓝。`static-scan-2` 扫过 src 里的样式和组件，旧的 #3d63dd、61, 99, 221、61,99,221 和 #2f4fb8 都不在。`review-static-scan` 用同一条检查又跑了一遍，通过。主按钮、开着的开关、信息面板链接、焦点环和阅读进度条都接到强调色变量。视频进度条仍是白色，因为它躺在深色条上。
- AC2：`selection-rules` 核对样式原文。侧栏选中用墨色 7% 和字重 500，文字走正文色。列表和卡片选中用墨色 6%，名称字重 600，没有改成蓝。弹窗结果行悬停写死黑 5%。深色把选中底改成白墨，正文改成浅色。`review-selection-rules` 把这条检查又执行了一遍，通过。浏览器里的计算色只观察过，没有封成记录，所以这条是弱验证，不当成可靠。
- AC3：`static-scan-2` 确认 tokens.css 与仓库外的 v1.1 原文一致，标题仍上移 1.5px，依赖里没有 lucide-react。`frontend-build` 构建通过，主包 `index-DtV0_ve9.js` 约 271.69 kB。`chunk-split` 和 `review-chunk-split` 都确认主包与查看器分开，共 18 个脚本。审查没有把构建再打一遍。
- AC4：`fe-tests` 是 20 个文件、65 项通过，里面包含打开文件的 17 项。`review-fe-tests` 重新跑了同一套，仍是 65 项通过。包名和包标识由 `static-scan-2` 与 `review-static-scan` 读到，仍是 emerge 和 local.emerge.app。
- 浏览器里用键盘走到按钮上，焦点环是 2px 的新强调色半透明。注入的主按钮底是新强调色、字是白的、高 30。深色下关掉的开关是浅色轨道，开着的是强调色，看完又开回去。设置页选中的侧栏项是灰底，不是蓝。这些没有单独的机器记录。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。`check-tdd` 对热区的结果也是 N/A。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：旧蓝扫描、选中规则、前端 65 项、构建和分包都有证据记录。审查时重跑了扫描、测试、分包和选中规则。没有跳过测试，没有把失败改成通过。第一次扫描失败是脚本写错，原记录留着，没有拿它去勾验收。
- Workspace Scope：这一段没有需求切片钉住的代码范围，标 N/A。
- Active Profiles：没有启用额外的技术栈规则包。
- Tech Plan Alignment：新增 tokens.css，内容与 v1.1 一致。旧名字映射到新变量，组件上没有再写一遍强调色。选中文字改回正文色并加重。弹窗悬停写死黑 5%，不跟深色白墨走。深色白墨按方案里的比例写了。阅读进度条改成强调色，视频进度条保持白色。没有引入 lucide-react，没有新做还没用到的控件，没有改打开路径和包标识。
- 逻辑：选中底和强调色分开。深色只覆盖表面和墨色，不改强调色。开关关闭用墨色变量，打开才用强调色。
- 可读性：变量名沿用设计包里的名字。界面文案没有改。没有另造缩写。
- 性能：这一轮只动样式和三处类型色。查看器仍按需加载，主包里没有它们。没有为图标加依赖。
- 安全：没有改打开、解压、分享或交给其他应用的限制。没有放宽内容安全策略。
- 领域变更：没有改规则仓里的领域地图、术语或合同，这一维跳过。

## References Compliance

- N/A。设计包没有抄进 .ai/references。对照的是仓库外的 tokens.css。

## Remaining Risks

- 系统窗口这一轮没有点开。浏览器里同一套页面看过焦点环、主按钮、开关和深色侧栏。列表、卡片和弹窗结果行用的是探进去的元素，因为这个浏览器配置里没有文件。这不能当成系统窗口已经点过。后面没有依赖这件事的路线。
- 选中色的机器记录核对的是样式原文，不是页面上算出来的颜色。浏览器观察没有封成记录。
- 本段没有单独的 git 回退点。工作树在动手前就不干净。按约定不提交，也不能把以前的改动捆成一个提交来当锚点。
- 深色白墨比例是模型定的。规范只有浅色，没有深色稿。
- 胶片条 10px 和设置色块 11px 比规范的四档字号小。这一轮按范围留下，不改。
- 第一次静态扫描的记录是失败的。失败原因是检查脚本的语法，不是产品里还有旧蓝。这条记录留着，不拿来勾验收。
- 本轮是同一上下文的完整审查，不是独立复核。
- Rust 里有一处没用到的时间导入，是旧告警，这一段没改。

## Handoff / Next Step

- 审查已通过。下一步按收口仪式归档证据、快照四件套、写交付，并把这一段标成收口。
- 不另开一段去补系统窗口点按，也不把冷启动一秒和空闲内存写成下一段的通过线。
