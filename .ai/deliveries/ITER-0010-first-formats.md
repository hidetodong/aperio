# 第一批图片和视频格式

## 本次交付目标

BMP、ICO、AVIF、JPEG XL 和 TIFF 能直接打开。M4V 能播。MKV 和 AVI 用构建时下载的播放组件准备临时文件再播，原文件不改。白色圆钮上的播放和暂停图标改成深色。

## 已完成内容

- 图片放行 BMP、ICO、AVIF、JPEG XL（`.jxl`）、TIFF。`.tif` 和 `.tiff` 都认。这些文件直接交给窗口，不转换。
- M4V 交给现有播放器，不先做临时文件。
- MKV 和 AVI 才准备。临时文件在应用缓存里，最近打开记的是原文件。编码本身能播就只换包装，不能播才重编码。
- 播放组件不进仓库。打开开发版或打安装包之前，按固定校验和下载一份只给 Apple 芯片的程序。缺少它时说明播放组件没装好。
- 新图片和新视频成功打开后进最近打开。成功打开的 PDF 仍不进。
- 白色圆钮上的图标改成深色，避免和钮面融在一起。

## 关键变更 / 用户可感知变化

能看的图片和视频多了一批。MKV 和 AVI 会先准备再播，原文件不动。播放钮在白底上应该能看清。仓库里仍然没有那份播放程序，所以安装包要在构建时才变大。

## 高层影响范围

动的是「这个文件算哪一类」、MKV 和 AVI 打开前的准备、构建前的下载，以及播放钮颜色。界面布局没改。PSD、相机原始文件、WMV、旧版 Office、tar 和 gz 仍然不支持。

## 验证方式与结果摘要

证据在 `.ai/iterations/ITER-0010/evidence/`。前端 75 条、Rust 12 条通过。短样片的原文件字节没变：H.264 的 MKV 只换包装，MPEG-4 的 AVI 重编码成 H.264。验证说明在 `.ai/iterations/ITER-0010/VERIFY_REPORT.md`。没有另开开发服务，应用窗口没打开。

## 已知剩余风险 / 延后事项

- 应用窗口没打开。新图片有没有真画出来、真实的 MKV 或 AVI 在窗口里能不能播、图标肉眼是否清楚，这次都没看。
- 短样片是生成的一秒画面，不是一份现成的成片。
- 这次没有重新打安装包，所以没有在打好的包里再确认那份程序。
- 不是 Apple 芯片的 Mac 不在这一步。
- 没有另一人复查。收口用的通过只表示同一次工作里没有必须先改的问题，不是独立复查已经通过。

## 引用（只引用，不嵌入）

- `.ai/iterations/ITER-0010/CONCEPT.md`
- `.ai/iterations/ITER-0010/AC_LIST.md`
- `.ai/iterations/ITER-0010/TECH_PLAN.md`
- `.ai/iterations/ITER-0010/VERIFY_REPORT.md`
- `.ai/iterations/ITER-0010/CHANGELOG.md`
- `.ai/iterations/ITER-0010/evidence/frontend-tests/record.json`
- `.ai/iterations/ITER-0010/evidence/rust-tests/record.json`
- `.ai/iterations/ITER-0010/evidence/ffmpeg-fetch/record.json`
- `.ai/iterations/ITER-0010/evidence/ffmpeg-ignore/record.json`
- `.ai/iterations/ITER-0010/evidence/review-playback/record.json`
