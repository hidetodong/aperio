"""Rule: enforce PRD-pinned workspace scope and the current write plan."""
from __future__ import annotations

from lib.io import Context, Decision, OUTSIDE_PROJECT, UNKNOWN_TARGET, is_gated
from lib.iteration_state import meta_escape_applies
from lib.workspace_scope import ScopeError, authorize_paths


RULE_ID = "workspace_scope"


def evaluate(ctx: Context) -> Decision:
    if ctx.target_path == UNKNOWN_TARGET:
        return Decision(
            verdict="deny",
            rule_id=RULE_ID,
            reason="写入目标无法解析，不能核对工作区范围",
            remediation="请提供非空、可解析的目标文件路径",
        )
    if meta_escape_applies(ctx.cwd, ctx.target_path):
        return Decision(verdict="allow", rule_id=RULE_ID)
    if ctx.target_path == OUTSIDE_PROJECT or not is_gated(ctx.target_path):
        return Decision(verdict="allow", rule_id=RULE_ID)
    try:
        result = authorize_paths(ctx.cwd, [ctx.target_path.as_posix()])
    except ScopeError as error:
        return Decision(
            verdict="deny",
            rule_id=RULE_ID,
            reason=str(error),
            remediation=(
                "先修复工作区地图/钉版范围/Workspace Write Plan；确需扩张时先改 PRD Scope，"
                "再退回 AC 与方案重审"
            ),
        )
    if not result["applicable"]:
        return Decision(verdict="allow", rule_id=RULE_ID)
    return Decision(verdict="allow", rule_id=RULE_ID)
