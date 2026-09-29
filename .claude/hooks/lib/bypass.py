"""BUTLER_BYPASS evaluation and RUN_LOG append."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from lib.io import Context, Decision

_MAX_REASON_LEN = 200


def _sanitize_reason(reason: str) -> str:
    cleaned = "".join(" " if ord(c) < 0x20 else c for c in reason)
    cleaned = cleaned.replace("|", "/")
    if len(cleaned) > _MAX_REASON_LEN:
        cleaned = cleaned[:_MAX_REASON_LEN] + "…"
    return cleaned


def evaluate_bypass(ctx: Context, decision: Decision) -> Decision:
    """Decide whether an environment-based bypass overrides a deny decision.

    Returns a new Decision: the original if not overridden, or an allow Decision
    with RUN_LOG appended if bypass succeeds.
    """
    if decision.verdict != "deny":
        return decision
    if os.environ.get("BUTLER_BYPASS") != "1":
        return decision

    reason_path = Path(ctx.cwd) / ".ai" / "bypass-reason.md"
    if not reason_path.exists():
        return Decision(
            verdict="deny",
            rule_id=decision.rule_id,
            reason=f"{decision.reason}\n  bypass 失败：需先在 .ai/bypass-reason.md 写明理由",
            remediation=decision.remediation,
        )

    content = reason_path.read_text(encoding="utf-8").strip()
    if not content:
        return Decision(
            verdict="deny",
            rule_id=decision.rule_id,
            reason=f"{decision.reason}\n  bypass 失败：.ai/bypass-reason.md 为空",
            remediation=decision.remediation,
        )

    first_line = content.splitlines()[0].strip()
    _append_run_log(ctx, decision, first_line)

    return Decision(
        verdict="allow",
        rule_id=decision.rule_id,
        reason="bypass ok",
        remediation="",
    )


def _append_run_log(ctx: Context, decision: Decision, reason_first_line: str) -> None:
    # Intentionally no try/except: write failures must propagate so the
    # dispatcher can fail-closed (deny). Silent log loss would kill audit trail.
    log_path = Path(ctx.cwd) / ".ai" / "RUN_LOG.md"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    safe_reason = _sanitize_reason(reason_first_line)
    line = (
        f"{ts} | {decision.rule_id} | {ctx.tool_name} | "
        f"{ctx.target_path.as_posix()} | {safe_reason}\n"
    )
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(line)
