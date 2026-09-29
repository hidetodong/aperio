# Task State

- 当前迭代：ITER-0001
- 当前里程碑：MILE-0001
- 阶段：P3 Design 已结束，准备进入 P4
- 危险模式：ON。写入上限只限 `/Users/cyborgno2/Documents/research/emerge`

## 当前已完成项

- P1 理解已经由用户确认，并补上了完整路径分流记录。
- P2 验收已过自审并冻结。AC1 到 AC7。
- P3 方案已过自审，方案状态是 pass。

## 关键设计决策

- 壳用 Tauri 2，界面用 React 和 Vite。不用 Electron。
- 查看器只有图片和文本，用到才加载。
- HEIC 用系统 sips，不在 Rust 里引解码库。
- HTML 不执行脚本。Markdown 要消毒。
- 被放弃的做法：启动时加载全部格式，以及在 Rust 里写格式解析。

## 已修改文件

- `.ai/CONCEPT.md`
- `.ai/AC_LIST.md`
- `.ai/TECH_PLAN.md`
- `.ai/RUN_LOG.md`
- `.ai/ITERATIONS.md`
- `.ai/butler.config.json` 的 dangerous 已打开

## 尚未完成项

- T1 到 T7 还没写代码。
- 进入写代码之前要先有 git 回滚锚点。当前目录还不是 git 仓库。

## 剩余风险

- 系统网页视图的内存下限可能让空闲内存高于 80MB。超标就记剩余风险，不写成达标。
- 拖放手感要等人看窗口。

## 下一步入口

- 在本目录建立 git 仓库并提交当前文档，作为写代码前的回滚锚点。
- 然后按技术方案 T1 到 T7 实现，并跑 AC 对应的检查。

# Goal Calibration

- 当前无未闭合运行时信号（N/A）。
