"""PostToolUse advisory for authoritative state writes that stale handoff."""
from __future__ import annotations

from lib.io import Advisory, Context

RULE_ID = "handoff_freshness"
EXACT = frozenset({
    ".ai/task-state.md", ".ai/ITERATIONS.md", ".ai/MILESTONES.md", ".ai/MILESTONE.md",
    ".ai/CONCEPT.md", ".ai/AC_LIST.md", ".ai/TECH_PLAN.md", ".ai/VERIFY_REPORT.md",
})
MESSAGE = (
    "【handoff 新鲜度】刚写入 handoff 的权威来源，现有 .ai/02_SESSION_HANDOFF.md 可能已陈旧。"
    "阶段结束、暂停、compact 或交接前运行 `python3 $BUTLER_PATH/tools/handoff/handoff.py sync "
    "--project-root $PROJECT_ROOT`；冷启动先运行同工具 `check`，stale 时先 sync 再读取。"
)


def evaluate(ctx: Context) -> Advisory:
    if ctx.target_path.as_posix() not in EXACT:
        return Advisory(rule_id=RULE_ID)
    return Advisory(rule_id=RULE_ID, message=MESSAGE)
