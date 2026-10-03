<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0005

> ⚠️ 危险模式：本轮审查由模型在同一上下文做完，不是另一份干净上下文的独立复核。项目没有打开独立复核。审查结论是 pass。没有必须先改才能交付的问题（ITER-0005，2026-09-30）。

## Verification Summary

- 这一段要在自己的 Mac 上打开 ZIP，看到里面的名字，并预览其中的文本、图片和 PDF。MP4、MOV、MP3 交给页面里的播放标签。自动检查通过。
- 审查看过逻辑、命名、性能和安全。没有必须先改才能交付的问题。名单出现之前不进最近列表，影音要等播放标签报告能播才进。包里的名字是文本，不会被当成标签。
- 浏览器里打开过一份样例压缩包、里面的文本和图片、一段一秒的 mp3，以及一个假的 tar。窄屏下名单还在。这不是浮现自己的窗口。真窗口没有点，不写成自动通过。

## AC Status

- [x] AC1 (auto·可靠): 启用名单里 zip 和 media 开着，图片、文本、PDF、Office 仍开着。只有开着的家族才有加载函数。
- [x] AC2 (auto·可靠): 构建之后，压缩包查看器和影音查看器都在主包以外。主包里没有这两个查看器标记，也没有 JSZip。Rust 依赖里没有压缩或影音解析库。压缩包的读取代码不引用 PDF 或图片查看器。
- [x] AC3 (auto·可靠): 最小 ZIP 列出文本、图片和 PDF 的名字。点文本能看到正文。图片和 PDF 交出去的是字节。包里的 Word、嵌套压缩包、影音只说明不预览。tar、gz、tgz 说明先不看，不去读内容。
- [x] AC4 (auto·可靠): 压缩包不在或内容打不开时显示原因，最近列表不追加，上一份不留。超过 20MB 不解析。有密码时说明先不看，不出现密码框。
- [x] AC5 (auto·可靠): 名单出现后 ZIP 才进最近列表。影音能播之后才进。失败不进。换文件后上一份不留。成功打开的 PDF 仍然不进最近列表。

## 人测道小结

- N/A（本轮验收五条都是自动道，人测道不适用）。真窗口另记在剩余风险，不是验收条目。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| fe-tests | AC1, AC3, AC4, AC5 | captured | passed | `.ai/iterations/ITER-0005/evidence/fe-tests/record.json` |
| frontend-build | AC2 | captured | passed | `.ai/iterations/ITER-0005/evidence/frontend-build/record.json` |
| chunk-split | AC2 | captured | passed | `.ai/iterations/ITER-0005/evidence/chunk-split/record.json` |
| boundary-check | AC1, AC2 | captured | passed | `.ai/iterations/ITER-0005/evidence/boundary-check/record.json` |
| review-fe-tests | AC1, AC3, AC4, AC5 | reproduced | passed | `.ai/iterations/ITER-0005/evidence/review-fe-tests/record.json` |
| review-chunk-split | AC2 | reproduced | passed | `.ai/iterations/ITER-0005/evidence/review-chunk-split/record.json` |
| review-boundary-check | AC1, AC2 | reproduced | passed | `.ai/iterations/ITER-0005/evidence/review-boundary-check/record.json` |

## Verification Results

- AC1：`review-fe-tests` 重新跑了前端测试，18 个文件、58 项通过，里面包含启用名单和加载函数。`review-boundary-check` 确认前端依赖里仍有 JSZip，Rust 侧没有压缩或影音解析库。`fe-tests` 是审查前的那一次，也是 58 项通过。
- AC2：`frontend-build` 打出主包 `index-DbCOzuYJ.js`，约 233.65 kB。压缩包查看器、影音查看器和 JSZip 都在主包以外。`review-chunk-split` 对着这次构建复核，主包和查看器分开，共 18 个脚本。审查没有把构建再打一遍。
- AC3：`review-fe-tests` 里，最小 ZIP 按名字列出文本、图片、PDF，以及这一段不预览的 Word、嵌套压缩包、影音和 HEIC。文本取出的是正文。图片和 PDF 交出去的是字节，不是解析结果。tar、gz、tgz 只显示先不看。
- AC4：同一份复核测试覆盖空包、坏包、超过 20MB、有密码，以及条目在取出来之前先看未压缩大小。文件不在时最近列表不动，上一份不留。密码没有输入框。
- AC5：交出地址时最近列表还不动。名单出现或播放标签报告能播之后才追加。已经换成下一份时，晚到的成功不再追加。成功打开的 PDF 仍然不进最近列表，原来的测试还在。
- 浏览器里用「打开」选了样例压缩包。名单出来之后，最近打开里是 sample.zip。点了里面的文本，能看到「包里的苹果」，再点图片，文本被换掉。接着打开一段一秒的 mp3，出现音频标签，最近打开变成 tone.mp3、sample.zip。再选一个假的 tar，画面含有「tar 和 gz 这一段先不看」，最近打开没有加上这个 tar。窗口收成 390 像素宽时，压缩包名单里的 note.txt 还在。这是弱验证：看过画面，没有单独的机器记录，也不能代替系统窗口。包里的 PDF 只在测试里交出过字节，浏览器里没有点。播不了的 mp3 只在测试里看过失败，浏览器里没有再试。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。`check-tdd` 对热区的结果也是 N/A。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：前端 58 项有证据记录。构建、分包和依赖边界也有。审查时重跑了测试、分包和依赖边界。没有跳过测试，没有把失败改成通过。
- Workspace Scope：这一段没有需求切片钉住的代码范围，标 N/A。
- Active Profiles：没有启用额外的技术栈规则包。
- Tech Plan Alignment：压缩包用已经在依赖里的 JSZip。影音只交地址给播放标签。两块查看器按需加载。超过 20MB 的压缩包不解析。单个条目先看未压缩大小。名单超过 2000 项会停。有密码只说明先不看。tar 和 gz 不读内容。PDF 成功不进最近列表没改。Office 解析没改。
- 逻辑：名单没出来不记最近列表。影音失败不记，能播之后才记。已经能播之后又出错，不会把刚记下的那条拿掉。换地址会卸掉上一份再加载新的。已经换走之后，晚到的失败不改新的一份。包里点到的名字必须在这份名单里。
- 可读性：界面文案仍是「打开」「正在打开」。太大、有密码、不是压缩包、这一段不预览，各有一句人话。没有另造缩写。
- 性能：没打开压缩包时，JSZip 不在主包里。影音查看器自己那一块很小，不带解析库。名单先列出来，只有点到的那一项才取字节。2000 项是显示上限，中央目录仍会整份读入再截断。
- 安全：包里的名字是文本节点。不执行压缩包里的脚本。不弹密码框。不把包解到磁盘，所以也不存在路径穿越写出文件。内容安全策略允许影音来自本机资源地址和临时地址，没有放宽脚本来源。这条策略还没在系统窗口里验证。
- 领域变更：没有改规则仓里的领域地图、术语或合同，这一维跳过。

## References Compliance

- N/A

## Remaining Risks

- 真窗口里没有打开压缩包和影音。浏览器里同一套页面能看名单、包内文本和图片、一段 mp3，假的 tar 会说明先不看。这不能当成系统窗口已经点过。内容安全策略里的影音来源改过，但应用窗口没有重启，所以系统窗口里能不能播还不知道。这是待人看的残余，后面没有依赖它的路线。
- 成功打开的 PDF 仍不进最近列表。这一段没改。
- 条目的未压缩大小读的是 JSZip 的内部字段。这个字段若读不到，会先取出字节再拒绝，并且不交给查看器。压缩包炸弹如果把这个大小藏起来，内存可能先涨一下。
- 从本机路径打开时，超过 20MB 会先把字节取下来再拒绝解析。浏览器里拖进来会先看大小。
- 名单超过 2000 项时，仍会先读完整份中央目录，再只显示前面。
- 页面用的 Excel 库仍是 npm 上的 0.18.5。这个版本有公开的原型污染问题。这一段不换库。
- Rust 里有一处没用到的时间导入，是旧告警，这一段没改。
- 本轮是同一上下文的完整审查，不是独立复核。

## Handoff / Next Step

- 审查已通过。下一步按收口仪式归档证据、快照四件套、写交付，并把这一段标成收口。
- 路线上的窗口、打开结果、PDF、Office、压缩包和影音到这里都做完了。收口之后收第一版里程碑，不另开一段去补 PDF 最近列表，也不把真窗口补点写成下一段的自动验收。
