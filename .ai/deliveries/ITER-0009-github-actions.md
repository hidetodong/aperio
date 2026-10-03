# 上传 GitHub 并配上自动检查和 Mac 打包

## 本次交付目标

公开仓库上有当前代码。推送会自动跑检查。打版本标签会打出 Mac 包，包只留在构建产物里。

## 已完成内容

- 公开仓库是 https://github.com/hidetodong/aperio 。默认分支是 `master`，这次代码提交是 `7fc72e5`。
- 新增 `.github/workflows/check.yml`。每次推送在 Ubuntu 上跑 `npm run check`。
- 新增 `.github/workflows/package.yml`。`v` 开头的标签在 macOS 构建机上打包，并上传为构建产物。两个工作流都只读仓库，不能创建 Release。
- 已推送标签 `v0.0.1`。产物名是 `aperio-macos`，约 9.6MB。构建日志里有 Apple 芯片的 `Aperio.app` 和 `Aperio_0.0.1_aarch64.dmg`。
- `README.md` 写上了真实仓库地址。`scripts/check-release.mjs` 改为接受这个地址，并拒绝说明里仍写远程不存在。
- 没有 GitHub Release。

## 关键变更 / 用户可感知变化

源码可以在 GitHub 上看到。之后每次推送都会自动检查。`v0.0.1` 的安装包挂在 Actions 的构建产物里，不在发布页上。

## 高层影响范围

动的是两个工作流、README 的构建和状态两节，以及发版检查脚本。查看器的界面和格式没改。仓库从没有远程变成这个公开仓库。

## 验证方式与结果摘要

取证在 `.ai/iterations/ITER-0009/evidence/github-actions/record.json`。检查运行是 https://github.com/hidetodong/aperio/actions/runs/37110126783 ，打包运行是 https://github.com/hidetodong/aperio/actions/runs/37110259648 ，两次都是 success。`gh release list` 为空。验证说明在 `.ai/iterations/ITER-0009/VERIFY_REPORT.md`。没有另开开发服务。

## 已知剩余风险 / 延后事项

- 自动打出的包是 Apple 芯片的，没有公证，也没有放到 GitHub Release。
- 没有另一人复查。收口判定因此不算通过，这里不把它写成审查已经通过。
- 版权人仍是 git 用户名 xingzidong。要改名字，得同时改 `LICENSE` 和发版检查里的同一行。
- 推上去的那一笔把之前没提交的阅读器一起收了进去。再往前的一笔只记到压缩包和影音动手之前。

## 引用（只引用，不嵌入）

- `.ai/iterations/ITER-0009/CONCEPT.md`
- `.ai/iterations/ITER-0009/AC_LIST.md`
- `.ai/iterations/ITER-0009/TECH_PLAN.md`
- `.ai/iterations/ITER-0009/VERIFY_REPORT.md`
- `.ai/iterations/ITER-0009/CHANGELOG.md`
- `.ai/iterations/ITER-0009/evidence/github-actions/record.json`
