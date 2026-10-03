<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
# TECH_PLAN — ITER-0009

方案状态: pass

## Design Decisions

- 检查和打包分成两个工作流。检查在每次推送时跑，打包只在 `v` 开头的标签上跑。不使用会顺便创建 Release 的 `tauri-action`。
- 检查用 Ubuntu 和 Node.js 22，执行 `npm ci` 然后 `npm run check`。这条命令不编译 Rust。
- 打包用 GitHub 的 macOS 构建机和 Rust stable，执行 `npm run tauri build`，把 `src-tauri/target/release/bundle/` 上传为构建产物。不改 `tauri.conf.json` 的打包目标。产物是那台机器的架构，不是通用二进制。
- 两个工作流的权限都只读仓库内容，不授予写权限，这样令牌不能创建 Release。
- README 的构建一节写上真实克隆地址。状态一节写明推送会跑检查、标签会把包留在构建产物里、没有 Release。
- `scripts/check-release.mjs` 改为要求 README 含有 `https://github.com/hidetodong/aperio`，并拒绝「远程不存在」这类旧句子。不再因为出现克隆命令而失败。
- 本地检查通过后提交并推送 `master`。检查运行成功后再打 `v0.0.1`，用来触发打包。
- 对应 AC1 到 AC4。放弃的做法：用 `tauri-action` 自动发 Release，以及在检查还没绿时就打标签。

## Failure Paths

- 打包动作顺便创建 Release。工作流里只保留构建和上传产物，权限不给写仓库。
- README 仍写远程不存在，发版检查会失败，检查工作流也会红。先改说明和检查脚本，再推送。
- macOS 上打 dmg 失败。那时只收窄这次构建的包格式，不改本机默认配置，并在说明里写清实际产物。

## Test Strategy

- 推送前在本机跑 `npm run check`。
- 推送后看检查运行的结论。
- 打标签后看打包运行的结论和产物，并确认 Release 列表是空的。
- 不另开开发服务，不改界面。

## References Compliance

- N/A
