"""Rule: deny writes under 99_Business_Extension/."""
from __future__ import annotations

from lib.io import Context, Decision

RULE_ID = "protected_paths"
PROTECTED_PREFIXES = ("99_Business_Extension/",)


def evaluate(ctx: Context) -> Decision:
    target = ctx.target_path.as_posix()
    for prefix in PROTECTED_PREFIXES:
        p = prefix.rstrip("/")
        if target.startswith(p + "/"):
            return Decision(
                verdict="deny",
                rule_id=RULE_ID,
                reason=f"业务扩展目录 {prefix} 禁止直接写操作",
                remediation=(
                    "走 mcv-update 协议或显式 bypass"
                    "（BUTLER_BYPASS=1 + .ai/bypass-reason.md）"
                ),
            )
    return Decision(verdict="allow", rule_id=RULE_ID)
