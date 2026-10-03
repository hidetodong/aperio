<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0007

## Verification Summary

- 仓库根 `README.md` 已按开源项目说明的章节写完。格式、上限和版本号用脚本对过代码，三处版本号仍是 0.1.0。

## AC Status

- [x] AC1 (auto·可靠): 章节顺序和中文短句已核对 ✓
- [x] AC2 (auto·可靠): 扩展名、2MB、20MB、2000 项、PDF 不进最近打开，与代码一致 ✓
- [x] AC3 (auto·可靠): 没有克隆命令，没有把许可证文件写成已经存在 ✓
- [x] AC4 (auto·可靠): 三处版本号仍是 0.1.0，仓库根没有 LICENSE ✓

## 人测道小结

- N/A（本轮无 human·待人 档 AC，人测道不适用）。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| readme-check | AC1, AC2, AC3, AC4 | reproduced | pass | `.ai/iterations/ITER-0007/evidence/readme-check/record.json` |

## Verification Results

- 对照脚本覆盖功能表里的扩展名、限制里的上限，以及状态里的版本号和仓库名。
- 产物结构检查通过：concept、acceptance、tech_plan、verify_report、changelog 都是 ok。
- 没有跑测试，也没有另开开发服务。这一轮没改会进测试的代码。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: not-run
- Completion Blockers: present

## Gate Coverage

- AC1 到 AC4 都有对照结果。说明没有界面要人点。

## References Compliance

- N/A

## Remaining Risks

- 说明里写了预定仓库 `hidetodong/aperio`，并写明地址现在不存在。仓库真的建好之前，读者不能凭这个名字克隆。

## Handoff / Next Step

- README 已放在仓库根。版本号、许可证文件、上传 GitHub 和自动打包还没做。这一轮先不收口。
