<!-- butler-artifact-template: 1.0.0 artifact=changelog -->
# ITER-0014 变更流

> 打开网页失败不把窗口打挂（危险模式） · closed · 2026-10-28

## ADD

- 无

## EDIT

- `src/formats/text/TextView.tsx §HtmlFrame` — 网页框改由页面自己插入。先确认隔离属性仍是空字符串，再写入正文；大约 800 毫秒后再写一次，大页面才画得出来。确认失败就卸掉框，只留提示 → AC2
- `src/messages.ts §MSG` — 加上「这个网页没法安全打开」 → AC2
- `src/formats/text/HtmlFrame.test.tsx` — 钉住放行时隔离属性是空字符串、正文在框里；属性被丢掉时只留提示，正文和脚本不出现 → AC2
- `src/App.css §.html-host` — 给网页宿主补上铺满阅读区的高度。没有这条，隔离框没有高度，正文画不出来 → AC2

## DELETE

- 无
