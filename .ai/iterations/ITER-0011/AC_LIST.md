---
状态: ack-frozen
ACK 日期: 2026-10-06
---
<!-- butler-artifact-template: 1.0.0 artifact=acceptance -->
# AC_LIST — ITER-0011

## Goal

- WMV 能用现成的播放准备来播。原文件不改。WebM 这一段仍然不放行。

## In Scope

- 放行 WMV。能换包装就换包装，编码本身播不了才重编码。临时文件只为播放，不写在原文件旁边。
- 成功打开后进最近打开，记的是原路径。
- 说明里写上 WMV。

## Out of Scope

- WebM、FLV、MPEG 传输流、Ogg、3GP。
- 新的图片格式。PSD、相机原始文件、旧版 Office、tar 和 gz。
- 不改 MP4、MOV、M4V、MKV、AVI、MP3 的打开方式。
- 不编辑，不另存为，不分享。
- 不把播放组件二进制提交进仓库。
- 不改界面布局。

## Acceptance Checklist

- [ ] AC1: WMV 按影音打开，并且要先做播放准备。WebM 仍不是影音，也不做播放准备。
- [ ] AC2: 打开 WMV 时调用播放准备。画面用准备后的地址，记录和最近打开仍是原路径。M4V 仍不准备，MKV 仍准备。
- [ ] AC3: WMV 播放时原文件内容不变。常见的 WMV 编码不能直接换包装，所以重编码。临时文件不写在原文件旁边。
- [ ] AC4: 缺少播放组件时，WMV 说明播放组件没装好，不说成文件坏了。

## Verification Method

- AC1: 路由测试确认 `.wmv` 算影音且需要准备，`.webm` 两者都不是。
- AC2: 打开测试确认 WMV 调用准备、最近打开记原路径，并确认 M4V 不准备、MKV 仍准备。
- AC3: 扩展名测试确认 WMV 要准备、WebM 不要。有播放组件时，用短样片准备临时文件，核对原文件字节没变，并且不能直接换包装的编码会重编码。
- AC4: 打开测试在没有准备函数时，WMV 返回「播放组件没装好」。

## External References

- N/A

## Open Questions / Risks

- 重编码仍依赖这台 Mac 的硬件编码器。硬件编码器失败时再试软件编码。两种都不行就说明播不了，不改原文件。
