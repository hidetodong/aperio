"""Rule: at most one active row in .ai/ITERATIONS.md (open-gate).

开新迭代 = 台账新增一行 active。若上一迭代未先收口 / 废弃，写入后台账会出现 ≥2 个
active 行。本规则在写迭代台账时机械校验「写入后 active 迭代行 ≤ 1」，等价于
iteration-schema §5.1「上一迭代未收口不得开新」。仅作用于 .ai/ITERATIONS.md。

判据基于「写入后的全表」，而非 incoming 片段：
  Write     → tool_input.content 即全文，直接解析。
  Edit      → 读现文件，对 old_string 首次出现替换 new_string，得写入后全文。
  MultiEdit → 读现文件，按序套用各 (old, new)。
无法可靠还原（现文件缺失 / old_string 未命中）时，退化为只数 incoming 片段：
片段内 >1 active 才 deny，否则放行（allow-on-uncertainty，避免误杀；残留由 Write
全覆写路径 + 冷启动一致性自检兜底）。与 phase_gate 容忍 legacy AC_LIST 同策略。
"""
from __future__ import annotations

import re
from pathlib import Path

from lib.io import Context, Decision

RULE_ID = "single_active_iteration"

LEDGER_REL = ".ai/ITERATIONS.md"
ACTIVE = "active"
# 与 ledger_status 共用的迭代号形状；固定列序见 iteration-schema §4.2/4.3。
_ITER_RE = re.compile(r"^ITER-\d{4,}$")


def evaluate(ctx: Context) -> Decision:
    if ctx.target_path.as_posix() != LEDGER_REL:
        return Decision(verdict="allow", rule_id=RULE_ID)

    text = _effective_text(ctx)
    if not text:
        return Decision(verdict="allow", rule_id=RULE_ID)

    active = _active_iterations(text)
    if len(active) > 1:
        return Decision(
            verdict="deny",
            rule_id=RULE_ID,
            reason=(
                f"迭代台账出现 {len(active)} 个 active 行：{', '.join(active)}；"
                "上一迭代未收口 / 废弃就开新迭代"
            ),
            remediation=(
                "开新迭代前先按 iteration-schema §5.5 收口或 §5.6 废弃旧迭代"
                "（同一时刻至多一个 active 迭代）"
            ),
        )
    return Decision(verdict="allow", rule_id=RULE_ID)


def _active_iterations(text: str) -> list[str]:
    """写入后全表中状态为 active 的迭代号（固定列序：迭代号 | 标题 | 状态 | …）。"""
    found: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 3 or not _ITER_RE.match(cells[0]):
            continue
        if cells[2].lower() == ACTIVE:
            found.append(cells[0])
    return found


def _effective_text(ctx: Context) -> str:
    """还原「写入后」的台账全文；无法可靠还原时退化为 incoming 片段。"""
    ti = ctx.tool_input
    if ctx.tool_name == "Write":
        return ti.get("content", "") or ""

    current = _read_current(ctx)
    if ctx.tool_name == "Edit":
        old = ti.get("old_string", "") or ""
        new = ti.get("new_string", "") or ""
        if current is not None and old and old in current:
            return current.replace(old, new, 1)
        return new  # uncertainty fallback：只看片段
    if ctx.tool_name == "MultiEdit":
        edits = ti.get("edits", []) or []
        if current is not None:
            buf = current
            ok = True
            for e in edits:
                old = e.get("old_string", "") or ""
                new = e.get("new_string", "") or ""
                if old and old in buf:
                    buf = buf.replace(old, new, 1)
                else:
                    ok = False
                    break
            if ok:
                return buf
        return "\n".join((e.get("new_string", "") or "") for e in edits)
    if ctx.tool_name == "apply_patch":
        added = ti.get("butler_patch_added", []) or []
        removed = ti.get("butler_patch_removed", []) or []
        if current is not None:
            lines = current.splitlines()
            for old_line in removed:
                try:
                    lines.remove(old_line)
                except ValueError:
                    return "\n".join(added)
            lines.extend(added)
            return "\n".join(lines)
        return "\n".join(added)
    return ""


def _read_current(ctx: Context) -> str | None:
    try:
        return (Path(ctx.cwd) / LEDGER_REL).read_text(encoding="utf-8")
    except OSError:
        return None
