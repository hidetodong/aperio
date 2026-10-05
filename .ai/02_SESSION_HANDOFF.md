# Session Handoff

## 任务断点

- 迭代：无 active；里程碑：MILE-0003；阶段：无。
- 状态：先做图片和视频的更多格式。建议沿用窗口直出和系统转 PNG。办法还没定，路线先不拆。

## 关键决策摘要

- 以当前阶段产物和 task-state 为准；本文件不另立决策真源。

## 环境脏点

- 运行 `git status --short` 获取实时工作树；handoff 不缓存易陈旧的文件清单。

## 已知风险

- N/A

## 唤醒指令

- 先运行 `python3 tools/handoff/handoff.py check --project-root .`；若 stale，运行同工具 `sync` 后再读 `.ai/task-state.md`。下一动作：确认这个办法后，再点名第一批扩展名并开第一段。

## 状态指针

- `.ai/task-state.md`
- `.ai/ITERATIONS.md`
- `.ai/MILESTONES.md`
- `.ai/MILESTONE.md`
