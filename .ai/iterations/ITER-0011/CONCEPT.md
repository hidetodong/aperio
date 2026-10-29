<!-- butler-artifact-template: 1.0.0 artifact=concept -->
> 分流: 完整 | 命中升级信号: 多文件改动, 契约变更, 跨模块影响, 设计取舍 | 2026-10-06

# CONCEPT — ITER-0011 · 播放 WMV

## Current Understanding

- 用已经接好的播放准备来播 WMV。原文件不改。这一段不加 WebM，也不加新的图片。
- 已确认：这一段只加 WMV
- 已确认：WMV 走已经接好的播放准备：原文件不改，临时文件在缓存里，编码能播就换包装，不能播才重编码
- 已确认：播放组件仍不提交进仓库，缺少时仍说明播放组件没装好
- 已确认：成功打开后进最近打开，记原路径，和现有视频一样
- 已确认：WebM、其他新图片、FLV 和传输流这一段不做

## Scope

- 放行 WMV，经现有播放准备后播放
- 最近打开记原文件
- 说明和测试覆盖 WMV，且不误放 WebM

## Open Questions / Risks

- N/A
