# 对齐 v0.0.1 并补上发版检查

## 本次交付目标

发版前该对齐的三件事落地：版本号是 0.0.1，仓库里有 MIT 许可证，发版检查有一条命令。

## 已完成内容

- `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 改为 `0.0.1`，并去掉 `package.json` 的 `private`。
- 锁文件里这个包自己的版本一起改了。
- 新增 `LICENSE`，MIT，版权人是 xingzidong。
- 新增 `npm run check`。它核对版本号和许可证，再跑已有的边界检查、测试、构建和分块检查。
- `README.md` 的开发、状态、许可证三节改成现在的事实。

## 关键变更 / 用户可感知变化

说明里的版本号从「还没改」变成已经是 0.0.1。许可证可以打开 `LICENSE` 看到全文。发版前跑 `npm run check`。

## 高层影响范围

动的是版本声明、许可证、一条检查脚本和说明里的三节。界面和格式代码没改。仓库还没推到 GitHub。

## 验证方式与结果摘要

`npm run check` 通过。测试 72 项通过，前端构建和分块检查通过。记录在 `.ai/iterations/ITER-0008/evidence/release-check/record.json`。验证说明在 `.ai/iterations/ITER-0008/VERIFY_REPORT.md`。没有打安装包，也没有另开开发服务。

## 已知剩余风险 / 延后事项

- GitHub 仓库还没建，自动打包还没配。说明里写了远程还不存在。
- 版权人用的是 git 用户名 xingzidong。要改成别的名字，得改 `LICENSE` 和检查脚本里的同一行。
- 没有另一人复查。

## 引用（只引用，不嵌入）

- `.ai/iterations/ITER-0008/CONCEPT.md`
- `.ai/iterations/ITER-0008/AC_LIST.md`
- `.ai/iterations/ITER-0008/TECH_PLAN.md`
- `.ai/iterations/ITER-0008/VERIFY_REPORT.md`
- `.ai/iterations/ITER-0008/CHANGELOG.md`
- `.ai/iterations/ITER-0008/evidence/release-check/record.json`
