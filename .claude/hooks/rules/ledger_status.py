"""Rule: validate the 状态 column in .ai/ITERATIONS.md against the closed iteration enum.

迭代行「状态」是封闭枚举（见 iteration-schema §4.2）。本规则在写迭代台账时机械校验，
拦截越界值（最常见的是把里程碑路线图『路线项状态』的 planned 误写进迭代台账）。
仅作用于 .ai/ITERATIONS.md；其余路径直接放行。
"""
from __future__ import annotations

import re

from lib.io import Context, Decision

RULE_ID = "ledger_status"

LEDGER_REL = ".ai/ITERATIONS.md"
# 镜像 iteration-schema §4.2 的封闭枚举；改这里必须同步 schema（注释互指）。
VALID_STATES = ("active", "closed", "abandoned")
_ITER_RE = re.compile(r"^ITER-\d{4,}$")


def evaluate(ctx: Context) -> Decision:
    if ctx.target_path.as_posix() != LEDGER_REL:
        return Decision(verdict="allow", rule_id=RULE_ID)

    text = _incoming_text(ctx)
    if not text:
        return Decision(verdict="allow", rule_id=RULE_ID)

    for raw in text.splitlines():
        line = raw.strip()
        if not line.startswith("|"):
            continue
        # 固定列序（iteration-schema §4.2/4.3）：迭代号 | 标题 | 状态 | …
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 3 or not _ITER_RE.match(cells[0]):
            continue
        status = cells[2].lower()
        if status and status not in VALID_STATES:
            return Decision(
                verdict="deny",
                rule_id=RULE_ID,
                reason=(
                    f"迭代台账状态非法：{cells[0]} 行状态='{cells[2]}'，"
                    f"合法封闭枚举仅 {'/'.join(VALID_STATES)}"
                ),
                remediation=(
                    "迭代状态封闭枚举只有 active/closed/abandoned（见 iteration-schema §4.2）；"
                    "planned 是里程碑路线图『路线项状态』，不写入迭代台账"
                    "（见 milestone-schema §5.3）"
                ),
            )
    return Decision(verdict="allow", rule_id=RULE_ID)


def _incoming_text(ctx: Context) -> str:
    """待写入的文本：Write 取 content、Edit 取 new_string、MultiEdit 取各 edits 的 new_string。"""
    ti = ctx.tool_input
    if ctx.tool_name == "Write":
        return ti.get("content", "") or ""
    if ctx.tool_name == "Edit":
        return ti.get("new_string", "") or ""
    if ctx.tool_name == "MultiEdit":
        return "\n".join(
            (e.get("new_string", "") or "") for e in ti.get("edits", [])
        )
    if ctx.tool_name == "apply_patch":
        return "\n".join(ti.get("butler_patch_added", []) or [])
    return ""
