<!-- butler-artifact-template: 1.0.0 artifact=verify_report -->
# VERIFY_REPORT — ITER-0010

## Verification Summary

- 第一批图片和视频的自动检查都过了。生成的短样片里，H.264 的 MKV 只换包装，MPEG-4 的 AVI 重编码成 H.264，原文件字节没变。应用窗口没有打开。

## AC Status

- [x] AC1 (auto·可靠): 前端测试确认 BMP、ICO、AVIF、JPEG XL、TIFF（`.tif` 和 `.tiff`）按图片打开，地址指向原文件，不调用解码 ✓
- [x] AC2 (auto·可靠): M4V 按现有视频播放，不先做临时文件。MP4、MOV、MP3 仍走原来的路径 ✓
- [x] AC3 (auto·可靠): 短样片准备后原文件字节不变。H.264 只换包装，MPEG-4 才重编码成 H.264。准备函数只写调用方给出的输出路径；打开命令把这个路径放在应用缓存里 ✓
- [x] AC4 (auto·可靠): 本机校验戳已对上，下载脚本跳过。二进制和校验戳都被仓库忽略。缺少播放组件时返回「播放组件没装好」，不说成文件坏了 ✓
- [x] AC5 (auto·可靠): 新图片成功打开后进最近打开。准备后的 MKV 仍按原路径记入。成功打开的 PDF 仍不进 ✓
- [x] AC6 (auto·可靠): 样式测试确认白色圆钮自己的深色规则压过按钮继承的浅色 ✓
- [x] AC7 (auto·可靠): PSD、WMV 仍不是可打开类型。旧版 Office、tar 和 gz 仍用原来的说明拒绝。相机原始文件不在放行名单里 ✓

## 人测道小结

- N/A（本轮无 human·待人 档 AC，人测道不适用）。

## Evidence Index

| Evidence ID | AC | 强度 | Outcome | Record |
|---|---|---|---|---|
| frontend-tests | AC1, AC2, AC4, AC5, AC6, AC7 | captured | passed | `.ai/iterations/ITER-0010/evidence/frontend-tests/record.json` |
| rust-tests | AC3, AC4 | captured | passed | `.ai/iterations/ITER-0010/evidence/rust-tests/record.json` |
| ffmpeg-fetch | AC4 | captured | passed | `.ai/iterations/ITER-0010/evidence/ffmpeg-fetch/record.json` |
| ffmpeg-ignore | AC4 | captured | passed | `.ai/iterations/ITER-0010/evidence/ffmpeg-ignore/record.json` |
| review-playback | AC3 | reproduced | passed | `.ai/iterations/ITER-0010/evidence/review-playback/record.json` |

## Verification Results

- 前端 23 个测试文件、75 条都通过。Rust 12 条都通过，其中短样片那条又单独跑了一次，仍通过。
- 下载脚本打印「播放组件已在，跳过下载」。忽略规则盖住 `src-tauri/resources/ffmpeg` 和 `src-tauri/resources/ffmpeg.sha256`。
- 没有另开开发服务，也没有重新打安装包。资源配置里已经把这份程序放进安装包资源。

## TDD Pair Status

- N/A（TECH_PLAN 未声明 TDD cycle）。

## Goal Calibration

- 当前无未闭合运行时信号（N/A）。

## Completion Inputs

- Review Verdict: pass
- Completion Blockers: none

## Gate Coverage

- 通用质量门禁：前端测试和 Rust 测试都通过。Rust 仍有一条原有的未使用导入警告，按原决定不改。
- Active Profiles：没有启用额外的技术栈细则。
- Tech Plan Alignment：图片只放行扩展名；M4V 不准备临时文件；MKV 和 AVI 才准备，最近打开记原路径；能播的编码换包装，不能播的重编码；播放组件按固定校验和在构建时取得且不进仓库；播放钮深色规则已写上。这些都有对应测试或脚本结果。
- References Compliance：N/A。没有需求集合范围要核。

## Remaining Risks

- 应用窗口没打开。新图片有没有真画出来、真实的 MKV 或 AVI 在窗口里能不能播、白色圆钮上的图标肉眼是否清楚，这次都没看。
- 短样片是生成的一秒画面，不是一份现成的成片。
- 这次没有重新打安装包，所以没有在打好的包里再点开那个程序。
- 不是 Apple 芯片的 Mac 不在这一步。下载脚本会直接失败，不拿错架构的程序。
- 没有另一人复查。上面的通过只是同一次工作里核对过，没有必须先改的问题，不是独立复查已经通过。

## Handoff / Next Step

- 自动检查已经够收口。里程碑还开着，下一批格式还没点名。不推送。
