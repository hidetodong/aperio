<!-- butler-artifact-template: 1.0.0 artifact=concept -->
> 分流: 完整 | 命中升级信号: 设计取舍 | 2026-10-03

# CONCEPT — ITER-0008 · 对齐 v0.0.1 并补上发版检查

## Current Understanding

- README 已经有了。这一段把发布前的工程补齐：三处版本号改成 0.0.1，加上 MIT 许可证，并给发版前的检查一条命令。不上传 GitHub，不写自动打包。
- 已确认：发布版本号用 0.0.1。package.json、src-tauri/Cargo.toml、src-tauri/tauri.conf.json 从 0.1.0 改过去，并去掉 package.json 的 private。
- 已确认：许可证用 MIT。
- 已确认：发版检查收成一条命令。推送仓库和 GitHub Actions 不在这一段。
- 已确认：README 里已经写过的版本号和许可证，改成和这一段落地后的事实一致。
- 建议（未确认）：MIT 版权行用仓库的 git 用户名 xingzidong，年份 2026。没有另外指定版权人。

## Scope

- 三处版本号改为 0.0.1，锁文件里这个包自己的版本一起改。
- 去掉 package.json 的 private。
- 新增仓库根 LICENSE，正文是 MIT。
- 增加 npm run check，作为发版前的唯一检查入口。
- 更新 README 的状态、许可证和开发命令，使它和改完后的仓库一致。

## Open Questions / Risks

- N/A
