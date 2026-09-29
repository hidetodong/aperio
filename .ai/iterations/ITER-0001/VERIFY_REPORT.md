<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0001

> ⚠️ 危险模式：本轮审查由模型在同一上下文做完，不是另一份干净上下文的独立复核。项目没有打开独立复核。审查结论是 pass，没有必须先改才能交付的问题（ITER-0001，2026-09-29）。

## Verification Summary

- 窗口壳、最近打开、图片和文本这一段可以收口。自动检查全部通过，开发窗口里也看到一张真的拖进去的图片。
- 没有必须先改的缺陷。剩下的是没在窗口里再打开一次 HEIC、启动时间没拿秒表卡、以及依赖审计告警。这些不挡这一段。

## AC Status

- [x] AC1 (auto·可靠): 打开结果会换成该文件并带上文件名。开发窗口里拖入的图片能看到内容和文件名。
- [x] AC2 (auto·可靠): 最近列表去重、最新在前、最多 20 条。临时目录里的 JSON 用 openedAt 读写。运行中的窗口已经把一条记录写进应用数据目录。缺文件时清掉上一份内容。
- [x] AC3 (auto·可靠): 八种图片扩展名归到图片。系统自带的 HEIC 经 sips 转成 PNG，非 HEIC 会被拒绝。页面拿到的是解码后的地址，不是原始字节。
- [x] AC4 (auto·可靠): Markdown 结果里没有脚本和事件。HTML 框架的 sandbox 为空。约定的语言能高亮，尖括号被转义。
- [x] AC5 (auto·可靠): 图片和文本开着，PDF、Office、压缩包、影音关着，关掉的不会去加载。没有扩展名的文本按原文打开。二进制和关掉的格式都显示不支持。
- [x] AC6 (auto·可靠): 换文件后状态里不再留上一份。超过 2MB 的文本被拒绝并说明原因。
- [x] AC7 (auto·可靠): 构建后图片和文本各自一块，主包里没有查看器标记。依赖和 Rust 里没有 Electron、字体、PDF 或 Office 解析。

## 人测道小结

- N/A（本轮无 human·待人 档 AC，人测道不适用）。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| fe-tests | AC1, AC2, AC4, AC5, AC6 | captured | passed | `.ai/iterations/ITER-0001/evidence/fe-tests/record.json` |
| rust-tests | AC2, AC3, AC6 | captured | passed | `.ai/iterations/ITER-0001/evidence/rust-tests/record.json` |
| frontend-build | AC7 | captured | passed | `.ai/iterations/ITER-0001/evidence/frontend-build/record.json` |
| chunk-split | AC5, AC7 | captured | passed | `.ai/iterations/ITER-0001/evidence/chunk-split/record.json` |
| boundary-check | AC7 | captured | passed | `.ai/iterations/ITER-0001/evidence/boundary-check/record.json` |
| recents-file | AC2 | captured | passed | `.ai/iterations/ITER-0001/evidence/recents-file/record.json` |
| review-fe-tests | AC1, AC4, AC5, AC6 | reproduced | passed | `.ai/iterations/ITER-0001/evidence/review-fe-tests/record.json` |
| review-rust-tests | AC2, AC3, AC6 | reproduced | passed | `.ai/iterations/ITER-0001/evidence/review-rust-tests/record.json` |

## Verification Results

- 前端测试、Rust 测试、构建、分包检查、依赖边界、以及本机最近列表文件，都由证据工具实际执行并通过。审查时又重跑了前端测试和 Rust 测试。
- 开发窗口已经起来。窗口里能看到拖入的 PNG，侧栏有同一条最近记录。应用数据目录里的 JSON 字段是 path、name、openedAt。
- 浏览器里另走了一遍打开：Markdown 只剩正文和去掉事件的图片；TypeScript 有高亮且尖括号被转义；HTML 在空 sandbox 的框架里；PDF 和超大文本显示不支持或拒绝原因；小图能显示。宽窗口是左右两栏，窄窗口合成一列。
- 消毒在不支持的测试环境里曾经把脚本原样放回。已改成用真正能消毒的环境做测试，并且环境不支持时改为转义原文，不再原样放回。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：自动测试和构建都有证据记录。没有跳过测试，也没有把失败改成通过。
- Active Profiles：这一段没有启用额外的技术栈规则包。
- Tech Plan Alignment：壳是 Tauri 2 加 React。查看器按需加载。HEIC 走 sips，参数是数组不是拼进命令行。文本有 2MB 上限。Markdown 消毒，HTML 不给脚本权限。最近列表的排序在前端纯函数里，Rust 只负责把 JSON 写到应用数据目录。
- 逻辑：换文件会丢掉上一份；关掉的格式不读内容、不进最近列表；HEIC 每次写一个新的缓存图，避免地址不变却还显示旧图。
- 可读性：界面文案是白话。错误原因直接显示，不套状态码。
- 性能：图片和文本不在主包里。文本整份读入有上限，图片不整份读进脚本。
- 安全：页面不执行 Markdown 或 HTML 里的脚本。本地资源协议开得宽，靠上面这条兜住。这是方案里已经接受的取舍。
- References Compliance：N/A。这一段没有外部规格要逐条对照。

## References Compliance

- N/A

## Remaining Risks

- 窗口里亲眼看到的是 PNG。HEIC 只在解码命令里用系统样例跑通，没有在窗口里再打开一次。
- 冷启动到能接拖放，没有用秒表量。开发窗口是编译完直接起来的，不能当成 1 秒启动的证据。80MB 也不是这一段的通过线。空窗口时主进程物理占用大约 32MB，打开一张照片后大约 38MB。系统网页视图另有自己的进程，没有合成成一个总账。
- 依赖审计还有 3 条告警。没有用强制升级去改版本，避免把能用的依赖改坏。
- Markdown 消毒默认仍可能留下样式标签。样式改的是样子，不是执行脚本。
- 最近列表写入失败时，界面先照改，错误被忽略。重启后会以磁盘上的那份为准。
- 本轮是同一上下文的完整审查，不是独立复核。

## Handoff / Next Step

- 这一段收口后，下一路线是 PDF。还没开工。
- 回退点仍是写代码前的那次提交。应用源码还没提交。
