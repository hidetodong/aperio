<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0006 变更流

> 按 v1.1 规范改现有界面 · closed · 2026-09-30

## ADD

- `src/shell/tokens.css` — 接入 v1.1 浅色变量。强调色改为 #2f6fd1，选中用墨色浅底 → AC1 AC3

## EDIT

- `src/shell/shell.css` — 引入变量。选中底和字色改为墨色与正文色，深色改为白墨。主按钮、开关、阅读进度条和链接改用强调色 → AC1 AC2
- `src/App.css` — 焦点环改用 --focus-ring → AC1
- `src/shell/catalog.ts` — 三处类型色从旧蓝改为 #2f6fd1 → AC1
- `src/shell/HomeScreen.tsx` — 拖入文件时的底色按强调色混合 7%，不再写死旧蓝 → AC1

## DELETE

- 无
