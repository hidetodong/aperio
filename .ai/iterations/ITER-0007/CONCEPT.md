<!-- butler-artifact-template: 1.0.0 artifact=concept -->
> 分流: 完整 | 命中升级信号: 设计取舍 | 2026-10-03

# CONCEPT — ITER-0007 · 按开源项目写 README

## Current Understanding

- 仓库根现在没有 README。这一段只补这一份说明，让没参与开发的人能看懂 Aperio 是什么、只在 Mac 上用、能打开什么、怎么在本机跑和构建、以及它不做什么。版本号、许可证文件、上传 GitHub 和自动打包留到后面的迭代。
- 已确认：用户确认按四条默认开工：公开仓库预定为 hidetodong/aperio；许可证用 MIT；发布版本号用 0.0.1，三处版本号从现在的 0.1.0 改过去，并去掉 package.json 里的 private；GitHub Actions 以后在推送时跑检查，在版本标签上打出 Mac 包作为构建产物，不自动建 GitHub Release。
- 已确认：这一段只写仓库根的 README，挂在里程碑 MILE-0002 的第一条路线上。上面四条只在说明里按已决定、尚未改文件来写，不在这一段落地。
- 已确认：不改查看器界面，不改能打开的格式。
- 已确认：README 用简体中文，句子短，按大型开源项目的说明来分节。不另写英文版。
- 已确认：说明按今天仓库里的事实写。现状版本是 0.1.0，许可证文件和 GitHub 远程都还没有。MIT、0.0.1 和 hidetodong/aperio 写成已经定了、文件和远程还没改。

## Scope

- 在仓库根新增一份 README。
- 写清这是什么、给谁用、只支持 Mac。
- 写清能打开的文件，以及明确不打开的老 Office 和 tar、gz。
- 写清本机怎么装依赖、怎么开发和构建、怎么跑测试。
- 写明不做什么：不编辑、不公证、不自动更新、没有网站、没有 Windows、不收费、没有插件市场，这一版也不提供给人下载的安装包。
- 许可证和版本按已决定但尚未改文件来写，不新增 LICENSE，不改版本号。

## Open Questions / Risks

- N/A
