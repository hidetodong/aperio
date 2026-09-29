<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0003

> ⚠️ 危险模式：本轮审查由模型在同一上下文做完，不是另一份干净上下文的独立复核。项目没有打开独立复核。审查结论是 pass。没有必须先改才能交付的问题（ITER-0003，2026-09-29）。

## Verification Summary

- 这一段要在自己的 Mac 上打开 PDF，顺着翻页，并且只画看得到的页。自动检查通过。
- 审查看过逻辑、命名、性能和安全。成功打开的 PDF 不进最近列表，单页绘制失败会被吞掉。这两件记在剩余风险里，不挡收口。
- 浏览器里打开过一份五页样例，能看到字，滚到底后第一页的画布不在了。这是另一套浏览器，不是浮现自己的窗口。真窗口没有再点，不写成自动通过。

## AC Status

- [x] AC1 (auto·可靠): 启用名单里 pdf 开着，图片和文本仍开着，Office、压缩包和影音关着。只有开着的 pdf 才有加载函数。
- [x] AC2 (auto·可靠): 构建之后 PDF 查看器在主包以外。主包里没有 PDF 标记，也没有 pdf.js。Rust 依赖里没有 PDF 解析库，仓库根下没有另拷的字体。
- [x] AC3 (auto·可靠): 假文档在只看得到第一页时只画第一页。视口移到最后一页后，第一页的画布不留。视口高度还是零时不画任何页。
- [x] AC4 (auto·可靠): 文件不在或解析失败时，画面是原因原文，最近列表不追加，上一份不留。晚到的失败不盖住下一份。
- [x] AC5 (auto·可靠): 换文件时上一份文档的释放函数被调用，新的一份还在。

## 人测道小结

- N/A（本轮验收五条都是自动道，人测道不适用）。真窗口另记在剩余风险，不是验收条目。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| fe-tests | AC1, AC3, AC4, AC5 | captured | passed | `.ai/iterations/ITER-0003/evidence/fe-tests/record.json` |
| frontend-build | AC2 | captured | passed | `.ai/iterations/ITER-0003/evidence/frontend-build/record.json` |
| chunk-split | AC2 | captured | passed | `.ai/iterations/ITER-0003/evidence/chunk-split/record.json` |
| boundary-check | AC1, AC2 | captured | passed | `.ai/iterations/ITER-0003/evidence/boundary-check/record.json` |
| review-fe-tests | AC1, AC3, AC4, AC5 | reproduced | passed | `.ai/iterations/ITER-0003/evidence/review-fe-tests/record.json` |
| review-chunk-split | AC2 | reproduced | passed | `.ai/iterations/ITER-0003/evidence/review-chunk-split/record.json` |
| review-boundary-check | AC1, AC2 | reproduced | passed | `.ai/iterations/ITER-0003/evidence/review-boundary-check/record.json` |

## Verification Results

- AC1：`review-fe-tests` 重新跑了前端测试，35 项通过，里面包含启用名单和加载函数。`review-boundary-check` 确认前端依赖里有 pdf.js。第一次跑的 `fe-tests` 和 `boundary-check` 也是通过，那两份我没有再单独叫做复核者复现。
- AC2：`frontend-build` 构建通过，产物里有单独的 PDF 脚本，也有 pdf.js 的字体和 wasm。构建命令没有再跑第二遍，这份记录是 captured。`review-chunk-split` 对着这次构建结果复核，主包和查看器分开，共 9 个脚本。`review-boundary-check` 确认 Rust 侧没有 PDF 解析库，仓库里没有另拷字体。
- AC3：组件测试用假文档。视口只盖住第一页时只有第一页的画布；移到第五页后第一页不留；视口高度为零时一张画布都没有。`review-fe-tests` 复现了这些断言。
- AC4：同一份前端测试覆盖缺文件、解析失败和晚到的失败。失败不进最近列表。成功打开也不进最近列表，这是测试钉住的当前行为，不是验收要求的成功记入。
- AC5：`review-fe-tests` 里换地址后，上一份的释放函数被调用，新的一份还在。
- 浏览器里用「打开」选了 `/tmp/emerge-pages.pdf`。开头能看到 Page 1，下面露出下一页一截。滚到底后画面是 Page 5，页面上已没有第一页的画布。另选一份不是 PDF 的文件，画面是 Invalid PDF structure.，画布没有了，最近列表仍是空的。窄屏下页面还在，字还看得清。这是弱验证：看过画面，但没有机器记录，也不能代替系统窗口。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。`check-tdd` 对热区的结果也是 N/A。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：前端 35 项有证据记录。构建、分包和依赖边界也有。没有跳过测试，没有把失败改成通过。
- Workspace Scope：这一段没有需求切片钉住的代码范围，标 N/A。
- Active Profiles：没有启用额外的技术栈规则包。
- Tech Plan Alignment：pdf.js 在前端单独一块。Rust 不解析 PDF。只给视口里的页建画布。换文件释放上一份。加密不弹密码框。不铺文字选择层。字体不拷进仓库。
- 逻辑：视口高度未知时不画页。换地址会卸掉上一份再加载新的。解析失败只改当前这一份，晚到的失败不盖住已经换上的文件。浏览器临时地址在失败时收回。
- 可读性：界面文案仍是「打开」「正在打开」。代码里的页、视口、文档都用原来的词，没有另造缩写。
- 性能：离开视口的画布会拆掉。点阵密度最多到屏幕的两倍。整份文件由页面一次取完，长文件会占内存，这是方案里接受的取舍。没打开 PDF 时，pdf.js 不在主包里。
- 安全：不挂文字层，不填表，不执行 PDF 里的脚本。加密文件直接拒绝。本地资源中间件拒绝路径往上跳。页面脚本策略允许 wasm，后台线程只允许本页。本地资源协议仍然开得比较宽，这是上一份方案已经接受的取舍。
- 领域变更：没有改规则仓里的领域地图、术语或合同，这一维跳过。

## References Compliance

- N/A

## Remaining Risks

- 真窗口里没有打开这份 PDF。浏览器里同一套页面能画出 Page 1 和 Page 5，滚走后第一页画布不在。这不能当成系统窗口已经点过。这是待人看的残余，不卡后面的 Office。
- 成功打开的 PDF 不进最近列表，侧栏不能点回去。验收只要求失败不记入。测试把「成功也不记入」钉成了当前行为。要改的话另开一小步，不写进这一段的变更流。
- 某一页绘制失败时，错误被吞掉，可能只剩一张空白画布。整份文件打不开时仍会显示原因。
- 还没滚到的页先按 842 点估算高度，滚到才改成真实高度。滚动条长度会跳一下。页比估算更高时，相邻页可能短暂叠住。
- 浏览器里选文件没有本机路径，缺文件这条验收不覆盖那条路。
- pdf.js 带的脚本 wasm 会随资源提供。这一段没有打开脚本执行，也不挂官方那套查看器。
- 依赖审计还有告警，没有强制升级。Rust 里有一处没用到的时间导入，是旧告警，这一段没改。
- 本轮是同一上下文的完整审查，不是独立复核。

## Handoff / Next Step

- 审查已通过。下一步按收口仪式归档证据、快照四件套、写交付，并把这一段标成收口。
- 北极星还没完成。收口之后按路线做 Office 预览，不把压缩包和影音塞进下一段，也不在这一段里补最近列表。
