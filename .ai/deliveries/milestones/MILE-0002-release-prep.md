# 开源仓库与 v0.0.1 发布准备

## 本次交付目标

按开源项目把 v0.0.1 准备好：仓库根有说明，版本号和许可证对齐，公开仓库会自动检查，打版本标签会打出 Mac 包。这一版不把安装包发给别人。

## 已完成内容

- 仓库根有 README，说明能看什么、不做什么、怎么在 Mac 上构建。
- 版本号是 0.0.1。仓库根有 MIT 许可证。发版前的检查是 `npm run check`。
- 公开仓库是 https://github.com/hidetodong/aperio 。推送会跑检查。标签 `v0.0.1` 打出了 Mac 包，挂在 Actions 的构建产物里。没有 GitHub Release。

各段细节见下面的迭代交付，这里不重复。

## 关键变更 / 用户可感知变化

源码可以在 GitHub 上看到。说明、许可证和版本号是 0.0.1 的事实。自动打出的安装包没有放到发布页，也没有公证。

## 高层影响范围

动的是说明、许可证、版本声明、发版检查和两个工作流。查看器的界面和格式没改。不做公证、自动更新、网站、Windows、收费和插件。

## 拆分路线图回填

| 路线 | 落到 | 结果 |
|---|---|---|
| 按开源项目写 README | `.ai/deliveries/ITER-0007-oss-readme.md` | 已收口 |
| 对齐版本号、许可证和发版检查 | `.ai/deliveries/ITER-0008-release-prep.md` | 已收口 |
| 上传 GitHub，并配上检查和 Mac 打包 | `.ai/deliveries/ITER-0009-github-actions.md` | 已收口 |

## 验证方式与结果摘要

README 那一段的记录在 `.ai/iterations/ITER-0007/evidence/readme-check/record.json`。版本和许可证那一段的记录在 `.ai/iterations/ITER-0008/evidence/release-check/record.json`，本机 `npm run check` 通过。上传和打包这一段的记录在 `.ai/iterations/ITER-0009/evidence/github-actions/record.json`。检查运行和 `v0.0.1` 打包运行都是 success，Release 列表是空的。

## 已知剩余风险 / 延后事项

- 自动打出的包是 Apple 芯片的，没有公证，也没有 GitHub Release。本机自己构建仍用 `npm run tauri build`。
- 版权人用的是 git 用户名 xingzidong。要改名字，得同时改 `LICENSE` 和发版检查里的同一行。
- 三段都没有另一人复查。
- 北极星仍写着不对外分发。这一版公开的是源码和构建产物，不是已经发给别人的安装包。

## 引用（只引用，不嵌入）

- `.ai/milestones/MILE-0002/MILESTONE.md`
- `.ai/deliveries/ITER-0007-oss-readme.md`
- `.ai/deliveries/ITER-0008-release-prep.md`
- `.ai/deliveries/ITER-0009-github-actions.md`
