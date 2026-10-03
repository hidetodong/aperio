<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0008 变更流

## ADD

- `LICENSE`：MIT 全文。对应 AC2。
- `scripts/check-release.mjs`：核对版本号、许可证和 README。对应 AC1、AC2、AC4。

## EDIT

- `package.json`：版本改为 0.0.1，去掉 private，增加 `npm run check`。对应 AC1、AC3。
- `package-lock.json`：本包版本改为 0.0.1。对应 AC1。
- `src-tauri/Cargo.toml`：版本改为 0.0.1。对应 AC1。
- `src-tauri/Cargo.lock`：本包版本改为 0.0.1。对应 AC1。
- `src-tauri/tauri.conf.json`：版本改为 0.0.1。对应 AC1。
- `README.md`：开发、状态、许可证三节改成落地后的事实。对应 AC4。

## DELETE

- N/A
