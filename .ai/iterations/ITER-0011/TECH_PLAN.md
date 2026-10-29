<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
# TECH_PLAN — ITER-0011

方案状态: pass

## Design Decisions

- WMV 放进现有影音集合，并和 MKV、AVI 一样先做播放准备。MP4、MOV、M4V、MP3 仍把原文件交给播放器。
- 准备函数不改。输出仍是应用缓存里的临时 MP4，当前记录仍指向原路径。
- 能不能换包装仍看现有规则：视频是 H.264、HEVC、AV1 或 ProRes，并且音频没有或已是 AAC、MP3、ALAC、AC-3 时，只换包装。WMV 里常见的编码不在这张名单上，所以会重编码。
- 文件图标和目录里的格式说明加上 WMV。使用说明的格式表，以及开发小节里「哪些格式依赖播放组件」的那句，也加上 WMV。
- WebM 不放进影音集合，也不做准备。

## Failure Paths

- 找不到播放组件：返回「播放组件没装好」，不把原文件说成损坏。MKV 和 AVI 的这条不变。
- 不是 MKV、AVI 或 WMV：准备直接拒绝。
- 探测不到流，或换包装和两次重编码都失败：删掉未完成的临时文件，返回「这个影音播不了」。原文件不写。

## Test Strategy

- 前端测试覆盖 WMV 的归类和准备标记、WebM 仍被排除、打开时调用准备且最近打开仍是原路径、没有准备函数时的缺组件说明。
- Rust 测试覆盖 WMV 要准备、WebM 不要。本机已有播放组件时，用一段短的 WMV 样片准备临时文件，核对原文件字节不变，并且输出是重编码后的 MP4。

## References Compliance

- N/A
