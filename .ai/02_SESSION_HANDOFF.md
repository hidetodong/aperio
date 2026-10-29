# Session Handoff

## 任务断点

- 迭代：无 active；里程碑：MILE-0003；阶段：已收口。
- 状态：打开网页时顶栏留着。隔离属性确认仍是空字符串才放入正文，放不上只留提示。里程碑不收口。

## 关键决策摘要

- 网页仍用空 sandbox 的隔离框。大页面大约 800 毫秒后再写一次正文。不监听窗口尺寸。

## 环境脏点

- 运行 `git status --short` 获取实时工作树；handoff 不缓存易陈旧的文件清单。

## 已知风险

- 系统窗口里的返回没有点到。
- 空 sandbox 以后若不被网页视图遵守，提示不会出现。
- 窗口拉大后隔离框不重算。800 毫秒再写一次只在本机浏览器里量过像素。

## 唤醒指令

- 先运行 `python3 tools/handoff/handoff.py check --project-root .`；若 stale，运行同工具 `sync` 后再读 `.ai/task-state.md`。下一动作：无。等下一段再开迭代。

## 状态指针

- `.ai/task-state.md`
- `.ai/ITERATIONS.md`
- `.ai/MILESTONES.md`
- `.ai/MILESTONE.md`
