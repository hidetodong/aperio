<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0002 变更流

> 打开失败说清原因，只认最后一次打开（危险模式） · closed · 2026-09-29

## ADD

- `src/open/gate.ts` — 列表没读完先排队，读失败则不许把空列表写回磁盘 → AC3
- `src/open/gate.test.ts` — 钉住排队、读失败不写盘，以及只认最后一次号码 → AC3
- `src/open/settle.ts` — 先采纳这次打开，确认仍是最后一次才清理缓存 → AC4
- `src/open/settle.test.ts` — 钉住过期结果不改画面、不清理，清理失败也不推翻已经看上的文件 → AC4

## EDIT

- `src/open/openFile.ts` — 失败原因保留原文；普通图片先确认还在；关掉的格式不读也不确认 → AC1
- `src/open/session.ts` — 最近列表按提交那一刻的状态往上叠，失败和空画面不追加 → AC3
- `src/App.tsx` — 本机打开和浏览器拖入都只提交最后一次 → AC3
- `src/bridge.ts` — 增加确认文件和清理缓存两个调用 → AC2
- `src/formats/text/TextView.tsx` — 点在链接或链接文字上都不让当前窗口跳走 → AC6
- `src-tauri/src/files.rs` — 打开前确认这是还在的文件；解码程序固定为 `/usr/bin/sips` → AC5
- `src-tauri/src/lib.rs` — 解码只写新图；序号已经过期的清理直接返回，不删缓存里更新的图 → AC4

## DELETE

- 无
