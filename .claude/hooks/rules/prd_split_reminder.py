"""Advisory rule: nudge PRD-split after a MILESTONE write with no references/prd/.

场景：用户给一份大 PRD（如 Confluence 文档、经 MCP 直读）当里程碑 brief，AI 顺手
合成了 .ai/MILESTONE.md，却没把这份逐字权威规格切进 .ai/references/prd/ 知识文件夹
（PRD 先行的软触发被绕过，见 logic-protocol §外部参考资料注入 + milestone-schema §6.4）。

本 advisory 在**唯一可观测的落盘点**（写 MILESTONE.md）补一道非阻塞自检：若此刻
.ai/references/prd/ 还不存在，就提醒模型"brief 若源自外部权威规格，先经 prd-split
落盘再推进"。它**只在 PostToolUse 跑、绝不 deny、不改任何写操作结果**——里程碑本身
罕见、提醒是条件式（非 PRD brief 一句话即可判忽略），false-positive 成本趋零。

注意：这是 advisory（返回 Advisory，无 verdict），不进 PreToolUse butler_gate 的
deny 链——一 deny 就会拦住正常的非 PRD 里程碑写，即踩非回归门。
"""
from __future__ import annotations

from pathlib import Path

from lib.io import Advisory, Context

RULE_ID = "prd_split_reminder"

MILESTONE_REL = ".ai/MILESTONE.md"
PRD_DIR_REL = ".ai/references/prd"

MESSAGE = (
    "【PRD 先行自检】刚写入 .ai/MILESTONE.md，但 .ai/references/prd/ 尚不存在。"
    "若本里程碑的 brief 源自外部权威规格（PRD / Confluence 文档 / 逐字 spec，"
    "含经 MCP 直读的），请先经 prd-split 把它切成 .ai/references/prd/ 知识文件夹"
    "再据此推进——切分见 40_Context_Management/prd-split.md，"
    "里程碑并进入口见 milestone-schema.md §6.4 的 PRD 分类闸。"
    "若只是对话或普通 brief（非逐字权威规格），忽略本提醒。"
)


def evaluate(ctx: Context) -> Advisory:
    if ctx.target_path.as_posix() != MILESTONE_REL:
        return Advisory(rule_id=RULE_ID)
    prd_dir = Path(ctx.cwd) / PRD_DIR_REL
    if prd_dir.is_dir():
        return Advisory(rule_id=RULE_ID)
    return Advisory(rule_id=RULE_ID, message=MESSAGE)
