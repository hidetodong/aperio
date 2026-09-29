"""Append-only intercept log for final PreToolUse denies."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from lib.io import Context, Decision

LOG_RELATIVE = Path(".ai") / ".hook-blocks.log"
MAX_BYTES = 256 * 1024
_MAX_REASON_LEN = 200


def sanitize_field(value: str) -> str:
    cleaned = "".join(" " if ord(c) < 0x20 else c for c in value)
    cleaned = cleaned.replace("|", "/")
    if len(cleaned) > _MAX_REASON_LEN:
        cleaned = cleaned[:_MAX_REASON_LEN] + "…"
    return cleaned


def format_line(ctx: Context, decision: Decision, *, now: datetime | None = None) -> str:
    ts = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")
    reason = sanitize_field(decision.reason.splitlines()[0] if decision.reason else "")
    return (
        f"{ts} | {decision.rule_id} | {ctx.tool_name} | "
        f"{ctx.target_path.as_posix()} | {reason}\n"
    )


def trim_to_budget(existing: bytes, incoming: bytes, max_bytes: int = MAX_BYTES) -> bytes:
    if len(incoming) >= max_bytes:
        return incoming[-max_bytes:]
    if len(existing) + len(incoming) <= max_bytes:
        return existing + incoming
    text = existing.decode("utf-8", errors="replace")
    lines = text.splitlines(keepends=True)
    data = existing
    while lines and len(data) + len(incoming) > max_bytes:
        lines.pop(0)
        data = "".join(lines).encode("utf-8")
    return data + incoming


def append_block_log(ctx: Context, decision: Decision, *, log_path: Path | None = None) -> None:
    """Write one deny line. Exceptions propagate so the dispatcher stays fail-closed."""
    path = log_path if log_path is not None else Path(ctx.cwd) / LOG_RELATIVE
    incoming = format_line(ctx, decision).encode("utf-8")
    existing = path.read_bytes() if path.is_file() else b""
    payload = trim_to_budget(existing, incoming, MAX_BYTES)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
