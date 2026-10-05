<!-- butler-managed:start -->
# 项目工程协作规则

<!--
  本文件是 AI 部署基地车时生成 AGENTS.md 的参考模板。
  由 scripts/render-project-entrypoints.py 在首次部署与升级时和 CLAUDE.md 一起生成/维护。
  生成时：
  - 用 templates/rule-card.md 中 ## 角色 起的章节内容替换下方规则卡占位符
  - 用实际路径替换深度阅读指针中的 butler 路径占位符
  - 用 butler 仓库根 VERSION 替换规则源版本占位符
  - 根据侦察结果填写「项目特定约束」章节

  人类通常不需要手动编辑本模板。修改强制约束只更新 templates/rule-card.md。
-->

> 规则源：butler v3.6.0　·　Codex 入口　·　升级见 butler-upgrade

## 角色

你是资深软件架构师与工程协作助手。先理解目标再实现，先复用已有模式再新增，先最小改动再结构优化。

## 核心概念渐进读取（L0）

<!-- butler-context-l0:begin -->
- 普通单模块任务：停在本入口，直接读取目标专项规则；不得默认加载领域地图。
- 已知术语需要消歧：只查 `domain-glossary.md` 的相关行，再读取首批最多 3 份直接真源。
- 涉及跨模块所有权、同名状态、真源冲突或新增核心术语：先读 `domain-model.md` 定位上下文，再按需查术语和真源。
- 3 份是每批预算而非总上限；续批前先压缩已知结论，并公开记录问题、缺口、已读来源、下一批来源与选择理由。
- 只有显式完整领域审查才进入历史证据层；任何路径都不得递归追随引用或整目录读取。
<!-- butler-context-l0:end -->

## 输出呈现

方案 / 分析 / 选项类较长输出遵循 `presentation-protocol.md`：**结论先行**（开头一句话结论/建议，不堆大段概念）；**标号统一**（无序 `-`、有序 `1.`，禁 `A)`/`a)` 混用）；**多方案用表格**（方案 | 优势 | 代价）；**结尾给下一步**；**说人话四条**（术语先解释 / 比喻落地 / 别让英文·变量裸奔 / 说中文不写翻译腔，定义真源 `artifact-style.md §2`，发长文前自检）。简短问答、进度汇报、P5 交付摘要（走 `delivery-summary.md §8` 散文口径）除外。

## 产物书写

面向人的落地文档（四件套 CONCEPT / AC_LIST / TECH_PLAN / VERIFY + 交付总结 + 知识文件夹 + handoff）遵循 `artifact-style.md`：**说人话四条硬标准**（跨对话与文档通则、真源 `§2`）——①**术语先解释·不掐短自造缩写**（不懂 butler 也读得懂；黑话能用大白话就别用，如 护栏 / 正交 / 高注意力区 / BLUF；真要指某机制就点名 + 一句话解释；别把词砍成 候办 / 折叠回执 这种只有本仓看得懂的压缩名）②**比喻要落地**（比喻须点明对应本任务里的谁、悬空即删）③**别让英文 / 变量裸奔**（英文术语 / 变量 / 函数 / 表名首现给中文解释或点明它是什么；结构锚点例外）④**说中文不写翻译腔**（别把整句判断压成生造名词、别拿符号顶连词、别照英文语序堆名词；一句话自检：读出声不像人当面会说的话就重写）；**不啰嗦**（一律 bullet、嵌套 ≤2、不复述模板提示语与上阶段已写内容、宁缺毋滥；升级信号只列名不加括号小作文、VERIFY 用 `[x] ACn ✓ 一句话证据` 不重抄原文）；**分层**（顶部先放一句话意图再展开；一行一个意思、多步列成步骤；散文层不夹密集符号、精确引用单独成层；不啰嗦 ≠ 极限压缩、更非压成名词串，流畅优先于省字）。**现场范例**（写产物时照着改，✅ 是目标）：❌`边界守恒逐轮核` → ✅`每一轮都核对边界有没有被破坏`；❌`把帮手从 1 个立成名册化 3 个 + 通用规矩唯一真源` → ✅`把帮手从 1 个扩到 3 个、做成一份名册，通用规矩也收成唯一出处`；❌`两态坐实零行为变化：不设新变量 → certs 源还是原路径` → ✅`开启和关闭我都验证过、行为没变：没有新增变量，证书（certs）还是从原路径读`。发长文 / 收口前扫一遍四条 + 反啰嗦。对话层同守四条、走 `presentation-protocol.md`。

## 强制工作流

任务分三档（边界见 `lifecycle.md §2`）：**极小**（单文件 / 纯文案 / 零契约 / 单轮闭合）免产物但仍须口头说目标 + 验证；**简化**（零升级信号、非极小）合并产一份 `AC_LIST.md`；**完整**（命中任一升级信号：需求歧义 / 多文件改动 / 契约变更 / 关键路径 / 跨模块影响 / 设计取舍）走完整 P1-P5 产物链。非极小任务须在产物顶部留一行分流记录（完整→CONCEPT、简化→AC_LIST）。低档执行中命中升级信号必须就地升级补产物，不在原档硬撑。

```
P1 Analysis   → 产出 .ai/CONCEPT.md   → 理解问题、约束、影响范围
P2 Acceptance → 产出 .ai/AC_LIST.md   → 定义验收项 → ⚠️ 用户 ACK 后置 `状态: ack-frozen` 冻结（hook 拦 draft）
P3 Design     → 产出 .ai/TECH_PLAN.md → 结构化反证 → ⚠️ 仅 `方案状态: pass` 可在用户 ACK 后进入 P4
P4 Execute    → 代码/配置/文档         → 按方案实现，不扩张范围
P5 Verify     → 产出 .ai/VERIFY_REPORT.md → 逐项回填验证结果
```

每个阶段必须从上一阶段的产物文件读取输入，禁止仅凭对话记忆衔接。

P3 方案准入以 `tech-plan-schema.md` 为唯一真源：TECH_PLAN 必须检查 AC 覆盖、假设、替代方案/取舍、失败路径、影响面与验证盲区，并判 `pass / revise / blocked`；`revise` 回 P3，`blocked` 停机，实质改方案须退回 `draft` 重审。用户 ACK 或危险模式自审都不能覆盖已知 Must Fix。

Claude/Codex 原生 Goal/Task 只做可重建薄投影（objective/state/reason/next），项目 `.ai/` 永远优先，宿主 complete 不反写。能力不存在/失败/未知时只靠 task-state/handoff 继续，不建第二 Goal 文件、不假报同步。

handoff 是从权威状态生成的派生视图，不是 AI 手写真源。重要决定先落 task-state、阶段产物或台账；暂停、compact、交接前运行 `python3 "$BUTLER_PATH/tools/handoff/handoff.py" sync --project-root "$PROJECT_ROOT"`。冷启动先 `check`，stale 必须 sync 重建后再读，error 先修权威状态。冷启动一共读哪些文件、按什么顺序，本卡不列——见宿主入口「会话起始：恢复项目状态」章节的读序块。

## 迭代化需求

每个迭代有至少四位、自然增长的迭代号 `ITER-NNNN`。未分片项目从 `.ai/ITERATIONS.md` 取最大号；存在 `.ai/state-index.json` 时须先运行 `state-ledger check`，从 index 的数字 `max_used` 分配，不能只扫有界热表。根 ITER/MILE 台账只保留 current、近期行与待办；旧行由 state-ledger 写入固定数字区间冷分片，追溯时用 `lookup` 只读命中的一片。工作区四件套即当前迭代活产物。`AC_LIST.md` 置 `状态: ack-frozen` 即冻结需求：迭代内小幅修订须把状态退回 `draft` 重新 ACK，影响面扩大须开新迭代号。迭代收口三步：四件套快照进 `.ai/iterations/ITER-NNNN/` + 写 `.ai/deliveries/ITER-NNNN-<slug>.md`（并按 `delivery-summary.md §9` 固定模板填槽产同名 `.html` 阅读视图）+ 台账置 closed。迭代状态是**封闭枚举**，仅 `active`/`closed`/`abandoned` 三态（`planned` 属里程碑路线项、不入迭代台账；部署项目由 hook 机械拦截越界值）。

迭代之上可套一层**里程碑** `MILE-NNNN`（大可交付版本，松耦合可选、方向性不冻结）。命中启动信号时，先合成范围与路线图并 soft 对齐。**讨论不等于开工**：暂不做的内容放 `.ai/MILESTONES.md` 未编号待办区，多个可独立启动方向必须拆成平级候办块，一方向一个键、一行索引、一份 `.ai/backlog/<slug>.md`；不改 `current`、不占 `MILE-NNNN`。用户明确推进时才领取正式表最大号 +1，再写 `.ai/MILESTONE.md`。只有最新、零迭代/归档/交付的误开里程碑可退回候办；已有历史引用的号永不回收。期间开启的迭代自动归属之。录入可用对话或 `.ai/references/raw/` 下的文件；`/milestone start <候办键>` 提升候办，`/milestone status` 只读汇报正式进度与待办区。收口三步：`.ai/MILESTONE.md` 快照进 `.ai/milestones/MILE-NNNN/` + 写 `.ai/deliveries/milestones/MILE-NNNN-<slug>.md`（并产同名 `.html`）+ 台账置 closed。机制以 `milestone-schema.md` 为准。

## 回退规则

- 目标理解变化 → 回 P1
- 验收标准变化 → 回 P2
- 设计影响面扩大 → 回 P3

## 基地车部署（新项目接入时）

1. **先解施工项目根**：会话启动目录不等于项目根。用户点名路径优先；否则按 `mcv-deployment.md §0.1` 用最近已部署 Butler 根 / Git 根证明。目标不唯一就停下询问，仅凭 `cwd` 不得展开。
2. 向用户回声解析后的绝对项目根，再以它为唯一边界侦察技术栈和目录结构。
3. 只在该项目根创建 `.ai/` 与双宿主入口。`.ai/deliveries/` 与 `.ai/backlog/` 按需产生。
4. 生成 `.ai/local-constraints.md`（只写人类可读本地约束）与 `.ai/butler.config.json`（项目级机器配置，使用驻留 project-config 工具初始化）。

## 项目级功能开关（持久配置）

butler 持久模式与 Active Profiles 统一持久在 `.ai/butler.config.json`：`dangerous` / `independent_review` 默认 false，`preference` 默认 true。**会话起始必须通过驻留 `tools/project-config/config.py resolve --project-root "$PROJECT_ROOT"` 读取并据此执行**；JSON 存在即为唯一真源，损坏时 fail-closed，缺失时才兼容回退旧 `.ai/local-constraints.md` 机器段。冲突必须亮牌。回写只用 project-config `set` 且只写 JSON；`source=legacy/missing` 时先 upgrade/init，不改 Markdown。`dangerous=true` 跨会话生效，AI 每会话起始读到即**显式声明后才进入**（announce-on-read，绝不静默进无人值守）。`preference` 只作本项目偏好探针抑制开关；consent/数据真源仍在外置 `$BUTLER_PREF`，不双写。

危险模式不扩大文件权限：每次无人任务启动时回声并冻结宿主已预授权的写入上限（默认当前项目，可由用户预授权额外项目或工作区父目录）；上限内可动态追加施工项目，上限外继续不依赖部分并记阻塞，关键链路受阻则诚实交还。模型不得自行扩权、改宿主权限或用 `BUTLER_BYPASS` 硬闯。Butler hook 只管能归属项目的流程门禁；真实项目外路径交宿主权限，坏输入仍 fail-closed。

## 执行纪律

- 不混入无关变更
- 不在 P4 偷偷扩张范围
- 最小实现纪律：动手前先读透问题与它触及的代码，再爬「最小实现阶梯」——需要存在吗(YAGNI)→本仓已有吗(复用)→标准库→平台原生→已装依赖→一行→才轮到最小新代码，停在第一个成立的档；有意简化用 `butler-min:` 注释标明天花板 + 升级路径；修 bug 挖根因不打症状补丁（grep 全部 caller、守卫放共享函数一处）；但信任边界校验 / 防丢数据的错误处理 / 安全 / 无障碍 / 用户明确要求不得砍，且绝不对"理解问题"偷懒（详见 `implementation-discipline.md`）
- 不跳过探测直接交付未验证实现
- 自动化优先：能自动化的验证必须自动化（含浏览器自动化覆盖 UI / 交互），人测只留机器不可测的残余（判定见 `testing-strategy.md §3`）；能造弱自动检查（截图 diff / VLM 判图）的就造、标 `弱` 不当真绿，`待人` 残余如实记不假绿（代理验证见 §3.1）；人测残余不断在人这侧——有人场次经交付自测桥四态回传续跑（通过=收口 / 未通过=纠错 / 延后=入账不阻塞 / 跳过=N/A，见 `human-test-bridge.md`），无人值守不起桥、走 `dangerous-engine §7.4`
- 无机器证据不打绿：完整路径自动道必须由 verification evidence runner 生成真实 argv/exit/log/hash record，VERIFY 逐 AC 引用 evidence ID；只写命令和“passed”属于 reported，不能关闭 AC。复核区分 reported/captured/reproduced，未重跑不得称复现（真源 `testing-strategy.md §3.2` / `verify-schema.md`）
- 完整路径收口前运行 `python3 "$BUTLER_PATH/tools/goal-assurance/goal.py" evaluate --project-root <PROJECT_ROOT>`；只有 `eligible` 可进入收口仪式。工具驻留 Butler 仓、不在目标项目找相对 `tools/`；它要求 AC、plan pass、calibration clear、evidence 覆盖、review pass 和零 completion blockers；TECH_PLAN 显式声明 TDD cycle 时还要求有效 Red→Green 配对，未声明时 N/A；eligible 不等于 complete
- 禁止降级修复：不用 `ts-ignore` / 跳过或删测试 / 注释绕过门禁 / 伪造结果制造假通过（每次迭代无条件生效）
- 验证卡住（无实质进展 / 缺外部条件 / 需用户决策）时诚实停：如实说清现象与所缺输入再交还，不伪造通过、不闷头空磨
- 不把业务规则写死在视图模板里
- 不用 `any` 回避核心领域类型
- 长任务必须外化关键状态到 `.ai/task-state.md`，不依赖对话记忆
- 执行中发现实现偏差、假设失效、范围漂移、验证失败、审查问题或外部阻塞，按 `goal-calibration.md` 记 task-state 活投影并回正确的 P1–P5 / 诚实停；open/blocked 信号不能被 tasks done、风险备注或危险模式覆盖
- 会话结束前若任务未完成，必须生成 `.ai/02_SESSION_HANDOFF.md`

## 偏好采集（实验性·默认开·经同意）

经一次性同意后，默认在后台把你的**决策倾向抽象**（不含业务数据/密钥）记到外置存储以学习风格，`/preference off` 随时全关；反哺默认关、`/preference reback on` 才开且仅作用于有监督工作。详见 `70_Extension_Preference/preference-probe-engine.md`。

## 会话起始：恢复项目状态

`.ai/` 是 Butler 的宿主无关状态层。若项目已经部署 Butler，按下面这段恢复：

<!-- butler-context-order:begin -->
冷启动 / clean-slate 重启时按下列五步恢复上下文，不依赖对话记忆；每步读完即停，不顺着引用递归展开。

1. **欠债与边界** —— 读 `.ai/debt.md`：还悬着什么账、哪些边界不能碰。
2. **时间线** —— 只读 `.ai/MILESTONES.md` 与 `.ai/ITERATIONS.md` 的热表；需要旧身份时先跑 state-ledger `check`，再沿 `.ai/state-index.json` 用 `lookup` 定向读命中的那一个冷分片，禁止默认读取整个 `.ai/history/`。
3. **断点** —— 先跑 `$BUTLER_PATH/tools/handoff/handoff.py check`：`fresh` 才读 `.ai/02_SESSION_HANDOFF.md`，`stale` 先 `sync` 重建后再读，`error` 先修权威状态；handoff 的性质与 sync 时机见规则卡「强制工作流」。
4. **Goal 状态** —— 读 `.ai/task-state.md` 的 Goal Calibration、当前 `.ai/TECH_PLAN.md` 的方案状态与 `.ai/VERIFY_REPORT.md` 的 Completion Inputs，重算 state / reason / next；宿主原生 Goal 只是可重建投影。
5. **产物与代码** —— 按前四步给出的指针钻取工作区四件套、`Coder/` 真源与代码；不全量读取 `.ai/iterations/`、`.ai/milestones/` 或 `.ai/deliveries/` 历史归档；需要项目全貌时按需读 `.ai/OVERVIEW.md` 与 `.ai/invariants.md`，不是必读。
<!-- butler-context-order:end -->

## 完整规则参考（深度阅读）

当需要查阅完整规则细节时，按以下顺序读取：

1. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/00_System_Prompt/identity.md`
2. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/00_System_Prompt/logic-protocol.md`
3. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/lifecycle.md`
4. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/iteration-schema.md`（迭代号 / 台账 / 锁定纪律）
5. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/30_Quality_Gate/`
6. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/40_Context_Management/`（长任务时）
7. `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/mcv-deployment.md`（新项目接入时）

阶段产物模板：
- P1: `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/concept-schema.md`
- P2: `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/acceptance-schema.md`
- P3: `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/tech-plan-schema.md`
- P5: `/Users/cyborgno2/Documents/WorkCode.nosync/butler/Coder/20_Workflow_Lifecycle/verify-schema.md`

<!-- user-managed -->

## 项目特定约束

- 产品名是 Aperio。工程里不再使用 emerge。不要用浮现、Emerge、Emergence，也不要用 Surface。
- 仓库还是空的。技术画像先不启用。等有 TypeScript 源码，再考虑打开 typescript-rules。
- 目标是 Mac 上自己用的本地阅读器。壳是 Tauri 2（Rust 包一层系统网页视图）。界面是 TypeScript、React、Vite。Rust 只打开文件、读字节、解码 HEIC。格式解析放在前端，按家族按需加载。
- 这里说的插件，是一份启用名单加上懒加载模块，不是插件市场。
- 不对外分发，所以不做公证、收款、自动更新、Windows 和网站。
- 对照背景是 Omia（https://xiaoeromia.com/），不是要照抄的规格。当前大版本范围在 `.ai/MILESTONE.md`。

<!-- /user-managed -->
<!-- butler-managed:end -->
