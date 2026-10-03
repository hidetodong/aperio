<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0005 变更流

> 压缩包列表和影音播放（危险模式） · closed · 2026-09-30

## ADD

- `src/formats/zip/model.ts` — 压缩包和单个条目的 20MB 上限，以及名单最多 2000 项 → AC4
- `src/formats/zip/readZip.ts` — 用 JSZip 列名字、取出被点到的一项。文本、图片、PDF 交出去，其余只说明。超限和密码不解析 → AC3 AC4
- `src/formats/zip/ZipView.tsx` — 名单出现后才允许记入最近列表。点名字才预览。换包丢掉上一份 → AC3 AC5
- `src/formats/media/MediaView.tsx` — MP4 和 MOV 用视频标签，MP3 用音频标签。能播才通知，失败不通知成功 → AC5

## EDIT

- `src/formats/enable.ts` — 启用名单打开 zip 和 media。图片、文本、PDF、Office 仍开着 → AC1
- `src/formats/load.ts` — 压缩包和影音查看器按需加载，不进主包 → AC1 AC2
- `src/formats/route.ts` — 认出 zip、mp4、mov、mp3。tar、gz、tgz 单独标成这一段不看 → AC3
- `src/messages.ts` — 太大、有密码、不是压缩包、包内不预览、播不了，各有一句说明 → AC3 AC4
- `src/open/openFile.ts` — 压缩包和影音只确认文件还在并交出地址。tar 和 gz 不读。浏览器里超过 20MB 的压缩包不生成临时地址 → AC3 AC4 AC5
- `src/open/session.ts` — 当前内容可以是压缩包或影音。名单出现或能播之后才进最近列表 → AC4 AC5
- `src/App.tsx` — 接上两块画面。失败显示原因。换文件丢掉上一份临时地址 → AC4 AC5
- `src/App.css` — 名单在自己的滚动区域里看，播放器跟主区域一样宽 → AC3
- `src-tauri/tauri.conf.json` — 内容安全策略允许影音来自本机资源地址和临时地址，不放宽脚本来源 → AC5
- `scripts/check-chunks.mjs` — 主包里不许出现压缩包或影音查看器标记，单独一块里必须有 → AC2
- `scripts/check-boundaries.mjs` — 仍禁止 Rust 解析格式，并禁止压缩包读取代码去引 PDF 或图片查看器 → AC2

## DELETE

- 无
