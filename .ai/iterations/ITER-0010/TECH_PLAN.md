<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
# TECH_PLAN — ITER-0010

方案状态: pass

## Design Decisions

- 图片只扩扩展名：BMP、ICO、AVIF、JPEG XL（`.jxl`）、TIFF（`.tif`、`.tiff`）走现在的图片路径，地址指向原文件。HEIC 仍先转 PNG。动图不转换。
- M4V 放进现有影音集合，和 MP4、MOV 一样把原文件交给播放器。
- MKV 和 AVI 才调用准备。准备结果是缓存目录里的临时 MP4，当前记录仍指向用户的原路径，所以最近打开记的是原文件。
- 准备时先看编码。视频是 H.264、HEVC、AV1 或 ProRes，并且音频没有或已是 AAC、MP3、ALAC、AC-3 时，只换包装。否则重编码成 H.264 和 AAC。优先用系统硬件编码器，失败再试软件编码。
- FFmpeg 用 Martin Riedl 的 macOS arm64 9.0 压缩包，构建前按固定地址和校验和下载到 `src-tauri/resources/ffmpeg`。该文件不进仓库。程序以独立进程调用，不链进应用。许可是 GPLv3，来源写在资源说明里。
- 播放钮用 `.app button.video-play` 把颜色设成 `#1d1d1f`，压过 `.app button { color: inherit }`。

## Failure Paths

- 找不到播放组件：返回「播放组件没装好」，不把原文件说成损坏。
- 不是 MKV 或 AVI：准备直接拒绝，避免误处理别的文件。
- 探测不到流，或换包装和两次重编码都失败：删掉未完成的临时文件，返回「这个影音播不了」。原文件不写。
- 输出路径和输入路径相同：拒绝执行。
- 非 Apple 芯片的 Mac 不在这一步。下载脚本在不是 darwin arm64 时直接失败，不拿错架构的程序。

## Test Strategy

- 前端测试覆盖新扩展名的归类、打开地址、MKV 走准备且最近打开仍是原路径、M4V 不走准备、播放钮颜色规则。
- Rust 测试覆盖探测文本如何决定换包装或重编码，以及扩展名守卫。本机已有播放组件时，再跑一段短样片，核对临时文件是 MP4、原文件字节不变。
- `npm test` 不下载播放组件。下载只发生在打开应用或打安装包之前。

## References Compliance

- N/A
