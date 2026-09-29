# Session Handoff

## 任务断点

- 迭代：ITER-0001；里程碑：MILE-0001；阶段：P1 Analysis。
- 状态：已从会话结晶需求，等待确认 Current Understanding 与 Scope。

## 关键决策摘要

- 浮现第一段只做自己 Mac 上的轻窗口：拖进文件就能看图片和文本，记住最近打开的，格式按家族用到才加载。PDF、Office、压缩包和影音不在这一段。
- 已确认：产品名是浮现，英文 Emerge，工程目录是 emerge
- 已确认：只给自己在 Mac 上用，不对外分发

## 环境脏点

- 运行 `git status --short` 获取实时工作树；handoff 不缓存易陈旧的文件清单。

## 已知风险

- N/A

## 唤醒指令

- 先运行 `python3 tools/handoff/handoff.py check --project-root .`；若 stale，运行同工具 `sync` 后再读 `.ai/task-state.md`。下一动作：审阅 `.ai/CONCEPT.md`，确认后进入 P2。

## 状态指针

- `.ai/task-state.md`
- `.ai/ITERATIONS.md`
- `.ai/MILESTONES.md`
- `.ai/MILESTONE.md`
- `.ai/CONCEPT.md`
