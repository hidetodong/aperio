<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
# TECH_PLAN — ITER-0008

方案状态: pass

## Design Decisions

- 版本号只改这个包自己的四处事实：`package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`，再加 `src-tauri/tauri.conf.json`。不改依赖的版本。
- 去掉 `private`，因为已经决定按开源仓库准备。这一段仍然不发布到 npm。
- 许可证用英文 MIT 全文。版权行用 git 用户名 `xingzidong`，不另造法律主体。
- 发版入口是 `npm run check`。版本和许可证的核对放在 `scripts/check-release.mjs`，后面串已有的边界检查、测试、构建和分块检查。不新造第二套测试。
- README 只改开发、状态、许可证三节，使说明和仓库一致。不重写功能表。
- 对应 AC1 到 AC4。放弃的做法：把 0.1.0 留着却把说明改成 0.0.1，以及这一段就推 GitHub。

## Failure Paths

- 只改了三处声明、漏了锁文件，下次安装或构建又写回 0.1.0。核对锁文件里的包名 `emerge`。
- 许可证写成说明里的一句话，没有全文。`LICENSE` 用 MIT 标准正文。
- `npm run check` 只跑前端、不看版本是否对齐。核对脚本先比较三处版本，再看许可证文件在不在。

## Test Strategy

- 跑 `npm run check`。它本身包含测试、构建和分块检查。
- 另读版本号、`LICENSE` 和 README 三节。不另开开发服务，不改界面。

## References Compliance

- N/A
