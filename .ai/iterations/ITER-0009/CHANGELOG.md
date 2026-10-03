<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0009 变更流

## ADD

- `.github/workflows/check.yml`：推送时在 Ubuntu 上跑 `npm run check`。对应 AC2。
- `.github/workflows/package.yml`：版本标签在 macOS 上打包，并上传为构建产物。对应 AC3。

## EDIT

- `README.md`：构建一节写上真实仓库地址。状态一节不再写远程不存在，改为检查和构建产物。对应 AC4。
- `scripts/check-release.mjs`：要求 README 含有仓库地址，并拒绝仍写远程不存在。对应 AC4。

## DELETE

- N/A
