# 播放 WMV

## 本次交付目标

WMV 用已经接好的播放准备来播。原文件不改。WebM 这一段仍然不放行。

## 已完成内容

- WMV 算影音，打开前先做播放准备。临时文件在应用缓存里，最近打开记的是原文件。
- 编码能播就只换包装。常见的 WMV 编码不在这张名单上，所以会重编码。
- 缺少播放组件时，仍说明播放组件没装好，不把原文件说成损坏。
- 文件图标、目录里的格式说明，以及使用说明，都写上了 WMV。
- WebM 没有放行。MP4、MOV、M4V 和 MP3 仍把原文件交给播放器。

## 关键变更 / 用户可感知变化

可以看 WMV 了。它会先准备再播，原文件不动。其他格式的打开方式没变。

## 高层影响范围

动的是「这个文件算哪一类」里的 WMV，以及使用说明。播放准备本身没改。界面布局没改。

## 验证方式与结果摘要

证据在 `.ai/iterations/ITER-0011/evidence/`。前端 75 条、Rust 12 条通过。短样片的原文件字节没变，WMV2 重编码成了 H.264。验证说明在 `.ai/iterations/ITER-0011/VERIFY_REPORT.md`。没有另开开发服务，应用窗口没打开。

## 已知剩余风险 / 延后事项

- 应用窗口没打开。真实的 WMV 在窗口里能不能播，这次没看。
- 短样片是生成的一秒 WMV2，不是一份现成的成片。
- 这次没有重新打安装包。
- 没有另一人复查。收口用的通过只表示同一次工作里没有必须先改的问题，不是独立复查已经通过。

## 引用（只引用，不嵌入）

- `.ai/iterations/ITER-0011/CONCEPT.md`
- `.ai/iterations/ITER-0011/AC_LIST.md`
- `.ai/iterations/ITER-0011/TECH_PLAN.md`
- `.ai/iterations/ITER-0011/VERIFY_REPORT.md`
- `.ai/iterations/ITER-0011/CHANGELOG.md`
- `.ai/iterations/ITER-0011/evidence/frontend-tests/record.json`
- `.ai/iterations/ITER-0011/evidence/rust-tests/record.json`
- `.ai/iterations/ITER-0011/evidence/review-playback/record.json`
