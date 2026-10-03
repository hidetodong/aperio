---
状态: ack-frozen
ACK 日期: 2026-10-03
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0008

## Goal

- 发 v0.0.1 前，版本号、许可证和发版检查都落在仓库里，说明跟现状一致。

## In Scope

- `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 的版本号改为 `0.0.1`。
- 去掉 `package.json` 的 `private`。
- 锁文件里这个包自己的版本一起改。
- 新增 MIT 许可证。版权行用 `xingzidong`，年份 2026。
- `npm run check` 作为发版前的唯一检查入口。
- 更新 `README.md` 里已经过时的版本号、许可证和开发命令。

## Out of Scope

- 不创建或推送 GitHub 仓库。
- 不添加 GitHub Actions。
- 不打安装包，不做公证，不对外发布。
- 不改界面，不改格式实现。

## Acceptance Checklist

- [x] AC1: 三处版本号都是 `0.0.1`，`package.json` 不再有 `private`。`package-lock.json` 和 `src-tauri/Cargo.lock` 里这个包自己的版本也是 `0.0.1`。
- [x] AC2: 仓库根有 `LICENSE`，正文是 MIT，版权人是 `xingzidong`，年份是 2026。
- [x] AC3: `npm run check` 先核对版本号和许可证，再跑边界检查、测试、前端构建和分块检查。
- [x] AC4: `README.md` 写的是已经落地的 `0.0.1` 和 `LICENSE`，并写明发版前跑 `npm run check`。GitHub 远程仍写明还不存在。

## Verification Method

- AC1: 读三处版本号和两份锁文件里的本包版本，确认没有 `private`。
- AC2: 读 `LICENSE` 的标题、版权行和授权句。
- AC3: 跑一次 `npm run check`，退出码为 0。
- AC4: 读 `README.md` 的开发、状态、许可证三节。

## External References

- N/A

## Open Questions / Risks

- N/A
