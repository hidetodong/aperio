#!/usr/bin/env python3
"""Claude Code PostToolUse dispatcher for butler advisory nudges.

与 butler_gate.py（PreToolUse，deny 门禁，fail-closed）刻意分开的一条平行通道：
本 dispatcher 在工具**执行之后**跑，只做 advisory——收集各 advisory rule 的提醒，
经 hookSpecificOutput.additionalContext 注入模型上下文，供模型自检 / 自纠。

关键契约：
  - 永远 exit 0。advisory 绝不阻塞、绝不改写工具结果（PostToolUse 时工具已执行完）。
  - fail-open：任何未捕获异常一律静默 exit 0——advisory 出问题也绝不能破坏正常流程
    （这与 butler_gate 的 fail-closed 正好相反，因为二者风险方向相反：门禁宁可错拦，
    提醒宁可漏提）。
  - 只在有非空提醒时才写 stdout JSON；无提醒则不输出、直接放行。

PostToolUse stdin JSON 形状同 PreToolUse（tool_name / tool_input / cwd），另含
tool_response（本 dispatcher 不需要）。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Make absolute imports work when invoked as a script.
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from lib.io import contexts_from_payload, parse_stdin
from rules import artifact_structure, handoff_freshness, prd_split_reminder

GATED_TOOLS = frozenset({"Edit", "Write", "MultiEdit", "apply_patch"})

# Advisory rules，按注册序执行；各自独立、互不短路（不同于 gate 的 first-deny-wins）。
ADVISORY_MODULES = [
    prd_split_reminder,
    handoff_freshness,
    artifact_structure,
]


def main() -> int:
    try:
        payload = parse_stdin()
        tool_name = payload.get("tool_name", "")
        if tool_name not in GATED_TOOLS:
            return 0

        messages: list[str] = []
        for ctx in contexts_from_payload(payload):
            for mod in ADVISORY_MODULES:
                advisory = mod.evaluate(ctx)
                if advisory.message and advisory.message not in messages:
                    messages.append(advisory.message)

        if messages:
            _emit("\n\n".join(messages))
        return 0
    except Exception:
        # fail-open：advisory 绝不破坏流程。静默放行。
        return 0


def _emit(context_text: str) -> None:
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": context_text,
        }
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
