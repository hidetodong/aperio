---
状态: ack-frozen
ACK 日期: 2026-10-03
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0007

## Goal

- 仓库根有一份外人能照着读的 README。语气短，结构按开源项目说明来排。

## In Scope

- 新增仓库根 `README.md`。
- 用简体中文写清这是什么、能打开什么、不支持什么、本机要什么、怎么构建和跑测试。
- 状态和许可证按仓库现状写：版本号仍是 0.1.0，准备发布 0.0.1，许可证定为 MIT 但文件还没有，GitHub 仓库还没建。

## Out of Scope

- 不改 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`。
- 不新增 `LICENSE`。
- 不创建或推送 GitHub 仓库，不写 GitHub Actions。
- 不改界面，不改格式实现。

## Acceptance Checklist

- [x] AC1: 仓库根有 `README.md`。简体中文，句子短。章节顺序是：简介、功能、限制、要求、从源码构建、开发、状态、许可证。
- [x] AC2: 功能表和限制与代码一致，包括能打开的扩展名、明确不打开的老 Office 和 tar/gz、大小上限，以及成功打开的 PDF 不进最近打开。
- [x] AC3: 不把还没落地的事写成已经完成。版本号仍写 0.1.0，0.0.1 标明还没改；不链接一份不存在的许可证文件；不给还不存在的仓库写克隆命令。
- [x] AC4: 这一轮只新增说明。版本号三处不变，没有 `LICENSE`，界面和格式代码不动。

## Verification Method

- AC1: 读 `README.md`，核对语言、语气和章节顺序。
- AC2: 对照 `src/formats/route.ts`、`src/messages.ts`、`src/open/session.ts`。
- AC3: 读状态和许可证两节，确认没有克隆命令，也没有把 `LICENSE` 写成已经存在。
- AC4: 核对三处版本号仍是 0.1.0，仓库根没有 `LICENSE`。

## External References

- N/A

## Open Questions / Risks

- N/A
