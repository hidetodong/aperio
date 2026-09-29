"""Rule: require P1/P2/P3 artifacts before gated source edits."""
from __future__ import annotations

import re
from pathlib import Path

from lib.io import Context, Decision, UNKNOWN_TARGET, is_gated
from lib.iteration_state import meta_escape_applies

RULE_ID = "phase_gate"

REQUIRED_ARTIFACTS = [
    (".ai/CONCEPT.md", "P1", "先完成 P1 分析并产出 .ai/CONCEPT.md"),
    (".ai/AC_LIST.md", "P2", "先完成 P2 验收清单并产出 .ai/AC_LIST.md"),
    (".ai/TECH_PLAN.md", "P3", "先完成 P3 技术方案并产出 .ai/TECH_PLAN.md"),
]

# D1: AC_LIST 冻结门。AC_LIST 顶部 `状态` 字段须为 ack-frozen 才放行源码写。
FROZEN_STATE = "ack-frozen"
_STATUS_RE = re.compile(r"^\s*(?:状态|status)\s*[:：]\s*(\S+)", re.IGNORECASE)

# P3 方案准入门。显式状态只有 pass 放行；无字段是旧部署兼容态。
PASSED_PLAN_STATE = "pass"
_PLAN_STATUS_RE = re.compile(
    r"^\s*(?:方案状态|plan_status)\s*[:：]\s*(\S+)", re.IGNORECASE
)


def evaluate(ctx: Context) -> Decision:
    if ctx.target_path == UNKNOWN_TARGET:
        return Decision(
            verdict="deny",
            rule_id=RULE_ID,
            reason="写入目标无法解析，不能判断 Butler 项目边界",
            remediation="请提供非空、可解析的目标文件路径",
        )

    if meta_escape_applies(ctx.cwd, ctx.target_path):
        return Decision(verdict="allow", rule_id=RULE_ID)

    if not is_gated(ctx.target_path):
        return Decision(verdict="allow", rule_id=RULE_ID)

    for rel_path, phase, hint in REQUIRED_ARTIFACTS:
        artifact = Path(ctx.cwd) / rel_path
        if not _is_nonempty(artifact):
            return Decision(
                verdict="deny",
                rule_id=RULE_ID,
                reason=f"{phase} 产物缺失：{rel_path} 不存在或为空",
                remediation=hint,
            )

    # D1: AC_LIST 须已冻结（状态: ack-frozen）才放行源码写。
    # 无 `状态` 字段 → legacy AC_LIST → 放行（向后兼容，不误杀已部署项目）。
    ac_state = _ac_freeze_state(Path(ctx.cwd) / ".ai" / "AC_LIST.md")
    if ac_state is not None and ac_state != FROZEN_STATE:
        return Decision(
            verdict="deny",
            rule_id=RULE_ID,
            reason=f"P2 未冻结：AC_LIST 状态={ac_state}，需用户 ACK 后置 ack-frozen",
            remediation="用户 ACK 后把 .ai/AC_LIST.md 顶部 `状态` 改为 ack-frozen 再继续",
        )

    # P3: 新版 TECH_PLAN 只有明确 pass 才可进入源码执行。
    # 无字段保持 legacy allow，避免模板升级前误杀既有部署；新 schema 禁止省略。
    plan_state = _plan_admission_state(Path(ctx.cwd) / ".ai" / "TECH_PLAN.md")
    if plan_state is not None and plan_state != PASSED_PLAN_STATE:
        return Decision(
            verdict="deny",
            rule_id=RULE_ID,
            reason=f"P3 方案未通过：TECH_PLAN 方案状态={plan_state}，只有 pass 可进入 P4",
            remediation=(
                "按 tech-plan-schema.md 完成 Plan Admission；revise 回 P3 修订，"
                "blocked 先解除阻塞，重审通过后再置 pass"
            ),
        )
    return Decision(verdict="allow", rule_id=RULE_ID)


def _is_nonempty(path: Path) -> bool:
    if not path.exists() or not path.is_file():
        return False
    try:
        return bool(path.read_text(encoding="utf-8").strip())
    except OSError:
        return False


def _ac_freeze_state(path: Path) -> str | None:
    """AC_LIST 冻结态：返回 `状态` 字段值（小写）；无该字段返回 None（legacy）。

    扫描文本行取首个 `状态:`/`status:` 匹配，不引入 YAML 依赖，
    保持 hook 零三方依赖、跨 Python 版本可移植。
    """
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    for line in text.splitlines():
        m = _STATUS_RE.match(line)
        if m:
            return m.group(1).strip().lower()
    return None


def _plan_admission_state(path: Path) -> str | None:
    """返回 TECH_PLAN 的显式准入状态；无字段返回 None（legacy）。"""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    for line in text.splitlines():
        match = _PLAN_STATUS_RE.match(line)
        if match:
            return match.group(1).strip().lower()
    return None
