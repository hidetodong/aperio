<!-- butler-artifact-template: 1.0.0 artifact=concept -->
> 分流: 完整 | 命中升级信号: 多文件改动, 设计取舍 | 2026-10-03

# CONCEPT — ITER-0009 · 上传 GitHub 并配上自动检查和 Mac 打包

## Current Understanding

- 版本号、许可证和 npm run check 已经在仓库里。这一段把公开仓库建起来，推上去之后自动跑检查，打版本标签时打出 Mac 包，包只留在构建产物里。
- 已确认：公开仓库用 hidetodong/aperio。
- 已确认：推送时跑检查。打版本标签时打出 Mac 包，只作为 GitHub Actions 的构建产物，不自动创建 GitHub Release。
- 已确认：不发布到 npm。
- 已确认：版本号保持 0.0.1，许可证不改。
- 已确认：这一步要提交并推送。上一轮已经说明要先提交，这次说继续。
- 建议（未确认）：检查跑在 Ubuntu 上，因为 npm run check 不编译 Rust。
- 建议（未确认）：Mac 包跑在 GitHub 的 macOS 构建机上。产物是那台机器的架构，不是通用二进制，也不公证。
- 建议（未确认）：工作流只给读仓库的权限，避免误发 Release。
- 建议（未确认）：README 和发版检查改成仓库已经存在之后的说法，写上真实地址。
- 建议（未确认）：检查通过后再打 v0.0.1 标签，用来触发打包。

## Scope

- 创建公开仓库 hidetodong/aperio，并推送当前 master。
- 新增两个工作流：推送跑 npm run check；版本标签打出 Mac 包并上传为构建产物。
- 更新 README 的仓库地址和自动打包说明，不再写远程不存在。
- 调整发版检查，使它接受这个仓库地址，并拒绝 README 仍写远程不存在。

## Open Questions / Risks

- N/A
