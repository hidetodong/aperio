<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
# TECH_PLAN — ITER-0007

方案状态: pass

## Design Decisions

- 只新增仓库根 `README.md`。中文，短句。章节按开源项目说明的阅读顺序：是什么、能做什么、限制、环境、构建、开发、状态、许可证。
- 格式用表，命令用代码块。不写徽章，因为还没有自动构建。不写 `git clone`，因为远程仓库还不存在。
- 不写英文版。界面和这次要求的语气都是中文。
- 版本、许可证、仓库地址按现状写。0.1.0 是现在的号，0.0.1 和 MIT 是已经定了但还没改文件。
- 对照 AC1 到 AC4：章节和语气对应 AC1，格式事实对应 AC2，不虚写对应 AC3，不动其他文件对应 AC4。
- 放弃的写法：宣传长文，以及把 0.0.1、许可证文件、GitHub 仓库写成已经完成。

## Failure Paths

- 格式写多或写漏，读者按说明去打开打不开的文件。写之前对照路由和报错文案，写完再对一遍。
- 把不存在的仓库或许可证文件写成已经有。状态和许可证两节明确写还没有。
- 写成产品介绍。用短句和表，不写欢迎词。

## Test Strategy

- 读 `README.md`，核对章节顺序和有没有克隆命令。
- 用脚本把说明里的扩展名、2MB、20MB、2000 项和 PDF 不进最近打开，对上 `src/formats/route.ts`、`src/messages.ts`、`src/open/session.ts`。
- 核对 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 仍是 0.1.0，且仓库根没有 `LICENSE`。
- 不跑界面，不另开开发服务。说明文件没有可点的界面。

## References Compliance

- N/A
