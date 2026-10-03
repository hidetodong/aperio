---
状态: ack-frozen
ACK 日期: 2026-10-03
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0009

## Goal

- 公开仓库 `hidetodong/aperio` 上有当前代码。推送会自动跑检查，打版本标签会打出 Mac 包，包只留在构建产物里。

## In Scope

- 创建公开仓库并推送 `master`。
- 推送时跑 `npm run check`。
- 版本标签打出 Mac 包，并作为 Actions 构建产物上传。
- README 改成仓库已经存在之后的说法。
- 发版检查接受这个仓库地址，并拒绝 README 仍写远程不存在。

## Out of Scope

- 不创建 GitHub Release，不把安装包发给别人。
- 不公证，不自动更新，不做网站、Windows、收费和插件。
- 不改查看器界面，不改能打开的格式。
- 不发布到 npm，不改版权人。

## Acceptance Checklist

- [ ] AC1: 公开仓库 `hidetodong/aperio` 存在，`master` 上有这次提交。
- [ ] AC2: 推送会跑 `npm run check`，并且这次推送的检查成功。该工作流不创建 GitHub Release。
- [ ] AC3: 版本标签会打出 Mac 包并上传为构建产物。`v0.0.1` 这次运行成功，产物在，仓库没有 Release。
- [ ] AC4: `README.md` 写上 `https://github.com/hidetodong/aperio`，不再写远程不存在。发版检查通过。

## Verification Method

- AC1: 用 `gh repo view` 看仓库是否公开，并用 `git ls-remote` 看 `master`。
- AC2: 读检查工作流，再看这次推送对应的 Actions 运行是否成功。确认工作流里没有发 Release 的步骤。
- AC3: 读打包工作流。推送 `v0.0.1` 后看运行是否成功、产物是否在，并用 `gh release list` 确认没有 Release。
- AC4: 读 `README.md` 的构建和状态两节，并跑 `node scripts/check-release.mjs`。

## External References

- N/A

## Open Questions / Risks

- N/A
