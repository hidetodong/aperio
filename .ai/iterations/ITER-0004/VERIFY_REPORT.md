<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0004

> ⚠️ 危险模式：本轮审查由模型在同一上下文做完，不是另一份干净上下文的独立复核。项目没有打开独立复核。审查结论是 pass。没有必须先改才能交付的问题（ITER-0004，2026-09-29）。

## Verification Summary

- 这一段要在自己的 Mac 上打开 Word、Excel、PPT 和 CSV，只看内容。自动检查通过。
- 审查看过逻辑、命名、性能和安全。第一轮发现：文件刚交出地址、正文还没出来，就已经进了最近列表。这和「内容打不开不记」不一致，已经改成正文出现之后才记，并重跑了测试。
- 浏览器里打开过 CSV、两张表的 Excel、Word，也打开过旧的 doc。窄屏下 Word 的两段字还在。这不是浮现自己的窗口。真窗口没有点，不写成自动通过。

## AC Status

- [x] AC1 (auto·可靠): 启用名单里 office 开着，图片、文本、PDF 仍开着，压缩包和影音关着。只有开着的 office 才有加载函数。
- [x] AC2 (auto·可靠): 构建之后，Office 查看器在主包以外。主包里没有 Office 查看器标记，也没有 JSZip 和 SheetJS。Rust 依赖里没有 Office 解析库。
- [x] AC3 (auto·可靠): 带引号和逗号的 CSV 分成对应格子。最小 Word 按段落出正文。最小 Excel 显示存好的格子，不把公式重算。最小 PPT 按页码出文字。旧的 doc 说明先不看，不去读。
- [x] AC4 (auto·可靠): 文件不在或解析失败时显示原因，最近列表不追加，上一份正文不留。超过 20MB 不解析。超过 2000 行只留前 2000 行，并说明后面还有。
- [x] AC5 (auto·可靠): 正文出现之后，Office 才进入最近列表。换文件后上一份正文不留。晚到的失败不盖住下一份，也不补记最近列表。

## 人测道小结

- N/A（本轮验收五条都是自动道，人测道不适用）。真窗口另记在剩余风险，不是验收条目。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| fe-tests | AC1, AC3, AC4, AC5 | captured | passed | `.ai/iterations/ITER-0004/evidence/fe-tests/record.json` |
| frontend-build | AC2 | captured | passed | `.ai/iterations/ITER-0004/evidence/frontend-build/record.json` |
| chunk-split | AC2 | captured | passed | `.ai/iterations/ITER-0004/evidence/chunk-split/record.json` |
| boundary-check | AC1, AC2 | captured | passed | `.ai/iterations/ITER-0004/evidence/boundary-check/record.json` |
| fe-tests-2 | AC1, AC3, AC4, AC5 | captured | passed | `.ai/iterations/ITER-0004/evidence/fe-tests-2/record.json` |
| frontend-build-2 | AC2 | captured | passed | `.ai/iterations/ITER-0004/evidence/frontend-build-2/record.json` |
| chunk-split-2 | AC2 | captured | passed | `.ai/iterations/ITER-0004/evidence/chunk-split-2/record.json` |
| review-fe-tests | AC1, AC3, AC4, AC5 | reproduced | passed | `.ai/iterations/ITER-0004/evidence/review-fe-tests/record.json` |
| review-chunk-split | AC2 | reproduced | passed | `.ai/iterations/ITER-0004/evidence/review-chunk-split/record.json` |
| review-boundary-check | AC1, AC2 | reproduced | passed | `.ai/iterations/ITER-0004/evidence/review-boundary-check/record.json` |

## Verification Results

- AC1：`review-fe-tests` 重新跑了前端测试，15 个文件、48 项通过，里面包含启用名单和加载函数。`review-boundary-check` 确认前端依赖里有 JSZip 和 SheetJS。`fe-tests` 是改最近列表时机之前的那一次，也是 48 项通过，但不能单独证明改完后的行为。
- AC2：`frontend-build-2` 是改完之后的构建。主包约 231.60 kB。Office 查看器、读文件、Word、PPT、JSZip、SheetJS 都在主包以外。`review-chunk-split` 对着这次构建复核，主包和查看器分开，共 16 个脚本。`review-boundary-check` 确认 Rust 侧没有 Office 解析库。`frontend-build` 和 `chunk-split` 是改代码之前的构建和分包，留作轨迹，不拿它们当最终结果。
- AC3：`review-fe-tests` 里，带引号的 CSV 分成格子；Word 两段按顺序出现，转义只展开一层；Excel 里公式 `1+1` 存的是 99，画面是 99，不是重算出来的 2；PPT 按 1、2、10 的页码而不是文件名顺序。旧的 doc、xls、ppt 只显示先不看，读和确认都是零次。
- AC4：同一份复核测试覆盖文件不在、解析失败、晚到的失败、20MB 和 2000 行。失败不进最近列表。上一份正文不留。
- AC5：交出地址时最近列表还不动。正文出现之后才叠进去。已经换成错误画面时，晚到的成功通知也不再追加。换文件后，画面里没有上一份段落。
- 浏览器里用「打开」依次选了 CSV、Excel 和 Word。CSV 能看到「价格,元」和「苹果」，并出现在最近打开里。Excel 换到第二张表后看到「香蕉」，「苹果」不在了。Word 能看到「第一段办公室」和「A & B」，CSV 那一格不在了。把窗口收成手机那么窄，这两段字还在。再选旧的 doc，画面是「旧的 Word、Excel、PPT 这一段先不看」，最近打开里没有这个旧文件，前面三份还在。这是弱验证：看过画面，没有机器记录，也不能代替系统窗口。第一次加载 Excel 和 Word 的库时，开发服务器重载过页面，重载之后再打开是成功的。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。`check-tdd` 对热区的结果也是 N/A。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：前端 48 项有证据记录。构建、分包和依赖边界也有。没有跳过测试，没有把失败改成通过。
- Workspace Scope：这一段没有需求切片钉住的代码范围，标 N/A。
- Active Profiles：没有启用额外的技术栈规则包。
- Tech Plan Alignment：解析在前端单独一块。Rust 不解析 Office。旧格式不读。超过 20MB 不解析。超过 2000 行有说明。公式不重算，测试里存 99 就显示 99。画面用文本节点。压缩包和影音没开。PDF 成功不进最近列表没改。
- 逻辑：正文没出来不记最近列表。换地址会卸掉上一份再加载新的。解析失败只改当前这一份。已经换走之后，晚到的失败或成功都不改新的一份。浏览器临时地址在失败时收回。
- 可读性：界面文案仍是「打开」「正在打开」。旧格式和太大各有一句人话。没有另造缩写。
- 性能：没打开 Office 时，JSZip 和 SheetJS 不在主包里。打开 CSV 不必先加载 Excel 的库。2000 行是显示上限，解析时仍会先读入这一张表。
- 安全：格子和段落都是文本节点，不用文档里的 HTML。不执行公式。不弹密码框。旧格式不拆包。
- 领域变更：没有改规则仓里的领域地图、术语或合同，这一维跳过。

## References Compliance

- N/A

## Remaining Risks

- 真窗口里没有打开这些文件。浏览器里同一套页面能看 CSV、换 Excel 的表、看 Word，旧的 doc 会说明先不看。这不能当成系统窗口已经点过。这是待人看的残余，不卡后面的压缩包和影音。
- 成功打开的 PDF 仍不进最近列表。这一段没改。
- 20MB 卡的是压缩后的体积。一个很小的包解开后仍可能很大。2000 行也只限制画面，解析时还是先读完整张表。
- 多张表里只要有一张超过 2000 行，换到短表时仍会显示截断说明。
- 从本机路径打开时，超过 20MB 会先把字节取下来再拒绝解析。浏览器里拖进来会先看大小。
- 页面用的 Excel 库是 npm 上的 0.18.5。这个版本有公开的原型污染问题，恶意表格有机会影响页面脚本。这一段只把格子画成文字，不换库。
- 依赖审计还有告警，没有强制升级。Rust 里有一处没用到的时间导入，是旧告警，这一段没改。
- 本轮是同一上下文的完整审查，不是独立复核。

## Handoff / Next Step

- 审查已通过。下一步按收口仪式归档证据、快照四件套、写交付，并把这一段标成收口。
- 北极星还没完成。收口之后按路线做压缩包和影音，不把这两件事塞进这一段，也不在这一段里补 PDF 的最近列表。
