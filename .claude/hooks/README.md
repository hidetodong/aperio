---
title: Butler Hooks — 贡献者说明
audience: 开发者
scope: templates/hooks/ 的结构、运行机制、测试与应急流程
---

# Butler Hooks

`templates/hooks/` 是 butler 的 Claude Code hook SSOT，含两套平行 hook：**PreToolUse 门禁**（`butler_gate.py`，deny-based、fail-closed）与 **PostToolUse 提醒**（`butler_advisor.py`，advisory-only、fail-open）。`mcv-deployment.md` 协议在部署目标项目时，把这里除 `tests/` 外的内容拷到目标 `.claude/hooks/`，并把 `../settings.hooks-snippet.json`（含 PreToolUse + PostToolUse 两个键）合并进目标 `.claude/settings.json`。

Codex v2.14.0 适配也复用这里的 dispatcher 和规则：plugin 入口是 `plugins/butler/hooks/hooks.json`，`apply_patch` 由 `lib/codex_patch.py` 转成逐目标 Context。首次启用 plugin hook 须由用户审阅并信任，且 `BUTLER_PATH` 必须指向 Butler checkout；缺路径时门禁 fail-closed、提醒 fail-open。PreToolUse 只覆盖实际进入 hook 的事件，不是 sandbox，也不承诺拦截 shell、MCP 等所有写路径。

Butler 门禁管**项目流程**，不重复实现宿主的文件系统权限：目标能解析到 Butler / Git 项目根时，按该项目逐条执行门禁；真实路径无法归属项目时，Butler 退出判定，由宿主决定是否授权。缺失、空白或解析异常的目标不是“项目外授权”，仍 fail-closed。同一 Codex patch 可覆盖多个项目根，但任一目标 `deny` 都会拒绝整次工具调用。

两套为何分开：**风险方向相反**。门禁宁可错拦（fail-closed，任何异常都 `exit 2`）；提醒宁可漏提（fail-open，任何异常都静默 `exit 0`）。advisory 若混进门禁的 deny 链，会误伤正常写操作——例如非 PRD 里程碑写 `.ai/MILESTONE.md` 本该放行，却因提醒逻辑被拦。

## 目录结构

```txt
butler_gate.py           # PreToolUse 门禁入口（deny-based, fail-closed）
butler_advisor.py        # PostToolUse 提醒入口（advisory-only, fail-open）
rules/
  protected_paths.py     # [门禁] 拦 99_Business_Extension/
  phase_gate.py          # [门禁] 拦 P1/P2/P3 缺失、AC 未冻结或 TECH_PLAN 显式非 pass 的源码写
  ledger_status.py       # [门禁] 拦 .ai/ITERATIONS.md 状态列越界（封闭枚举 active/closed/abandoned）
  single_active_iteration.py  # [门禁] 拦 .ai/ITERATIONS.md 写入后出现 ≥2 个 active 行（未收口就开新迭代）
  artifact_chain.py      # [门禁] AC-ID linkage 等规则预留
  artifact_structure.py  # [提醒] strict 五件套写后检查 canonical manifest 漂移
  prd_split_reminder.py  # [提醒] 写 .ai/MILESTONE.md 且无 .ai/references/prd/ 时，注入 PRD 先行自检
  handoff_freshness.py   # [提醒] 写 handoff 权威来源后，提示交接前 sync、冷启动先 check
lib/
  io.py                  # Context/Decision/Advisory、目标分类、Claude/Codex payload → Context
  codex_patch.py         # apply_patch add/update/delete/move、多文件/多 hunk 解析
  bypass.py              # BUTLER_BYPASS 评估 + RUN_LOG 追加（仅门禁用）
tests/                   # 本目录的测试（不分发到目标项目）
```

## 运行机制

### PreToolUse 门禁（butler_gate.py）

1. Claude Code 在 `Edit` / `Write` / `MultiEdit` 前调用门禁；Codex plugin 在 canonical `apply_patch` 前调用同一 dispatcher。stdin 都传 JSON，宿主适配层将其归一为一个或多个 Context。
   - 能归属项目：切到实际项目根，继续执行 Butler 规则。
   - 真实项目外路径：Butler abstain，交宿主权限处理。
   - 缺失 / 空白 / 无法解析：按坏输入 fail-closed。
2. Dispatcher 顺序执行 `RULE_MODULES`（`protected_paths → phase_gate → ledger_status → single_active_iteration → artifact_chain`），任一 `deny` 即终止。`ledger_status` 与 `single_active_iteration` 仅在目标为 `.ai/ITERATIONS.md` 时生效：前者校验「状态」列只取封闭枚举 active/closed/abandoned（见 `iteration-schema.md §4.2`）；后者还原写入后全表，拦截 ≥2 个 active 行（等价于 iteration-schema §5.1「上一迭代未收口不得开新」，Edit/MultiEdit 无法可靠还原时按 allow-on-uncertainty 放行）。
3. `deny` 后走 `lib/bypass.py`：若 `BUTLER_BYPASS=1` 且 `.ai/bypass-reason.md` 非空，追加 `.ai/RUN_LOG.md` 后放行；否则先往 `.ai/.hook-blocks.log` 追加一行（拦截日志，进 gitignore、上限 256KB），再 `exit 2` + stderr 给 AI 可读的违规摘要。写拦截日志失败仍 deny。
4. 任何未捕获异常由 dispatcher 顶层 catch，`exit 2`（**fail-closed**）。

没有 active 迭代时（`.ai/ITERATIONS.md` 的 `current` 为 `none`，或没有这份台账），仓根 `README.md` / `CHANGELOG.md` / `.gitignore` / `VERSION` / `LICENSE` 不被 `phase_gate` 与 `workspace_scope` 拦截。有 active 迭代时这五份仍走原门禁。目标项目应把 `.ai/.hook-blocks.log` 写入 `.gitignore`，不要提交拦截日志。

### PostToolUse 提醒（butler_advisor.py）

1. Claude Code 在 `Edit` / `Write` / `MultiEdit` **之后**通过 PostToolUse 调用 `python3 .claude/hooks/butler_advisor.py`，stdin 传入 JSON（形状同 PreToolUse，另含 `tool_response`）。
2. Dispatcher 顺序执行 `ADVISORY_MODULES`（当前只有 `prd_split_reminder`），每条 rule 返回 `Advisory`（`rule_id` + `message`，`message` 为空即静默）；各 rule 独立、互不短路。
3. 收集到非空 `message` → stdout 输出 `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext": …}}`（模型可见的提醒），`exit 0`。无提醒 → 不输出、`exit 0`。
4. 任何未捕获异常静默 `exit 0`（**fail-open**）——提醒绝不阻塞、绝不改写工具结果。

## 退出码契约

| hook | exit | 含义 |
|---|---|---|
| 门禁 `butler_gate` | 0 | 放行（允许工具执行） |
| 门禁 `butler_gate` | 2 | 拒绝（含规则 deny 与 internal error，fail-closed） |
| 提醒 `butler_advisor` | 0 | **永远放行**；stdout 有 `additionalContext` JSON 则模型看到提醒，无则静默（含 fail-open 的异常路径） |

## Bypass 流程

```bash
# 在目标项目根
echo "hotfix: XYZ in prod, will supplement AC after" > .ai/bypass-reason.md
BUTLER_BYPASS=1 claude ...     # 或直接在该 shell 里用 Claude Code
```

- `bypass-reason.md` **不会**被 hook 自动清理；同一会话内多次 bypass 会复用同一 reason 并在 `RUN_LOG.md` 留多条记录。
- 绕过 **会被 git 看见**（RUN_LOG 是追加历史），review 时可追问。
- 真拦住的那次记在 `.ai/.hook-blocks.log`，这份文件进 gitignore，不进共享仓。

## Fail-closed 与应急流程

若 hook 自身有 bug 把你锁死（所有 Edit/Write 都 `exit 2`）：

1. 写 `.ai/bypass-reason.md`（非空）并设 `BUTLER_BYPASS=1` 绕过。
2. 在 butler 仓库提 issue，贴 stderr 里的 `internal error` 回溯。

## 本地测试

改 hook 后必须跑：

```bash
cd templates/hooks
python3 -m pytest tests/         # Tier 1 + Tier 2
bash tests/smoke.sh              # Tier 3（可选，不入 CI）
```

## 已测试的 Claude Code 版本

- 待补（首次部署后验证过的版本号写在这里）

## 平台支持

- macOS、Linux
- Windows 不在本 phase 范围
