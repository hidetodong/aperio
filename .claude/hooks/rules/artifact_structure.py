"""Post-write advisory for strict five-artifact structure drift."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from lib.io import Advisory, Context

RULE_ID = "artifact_structure"
PATHS = frozenset({".ai/CONCEPT.md", ".ai/AC_LIST.md", ".ai/TECH_PLAN.md", ".ai/VERIFY_REPORT.md", ".ai/01_CHANGELOG.md"})


def evaluate(ctx: Context) -> Advisory:
    relative = ctx.target_path.as_posix()
    if relative not in PATHS:
        return Advisory(rule_id=RULE_ID)
    butler = Path(os.environ.get("BUTLER_PATH", Path(__file__).resolve().parents[3]))
    tool = butler / "tools/artifact-pipeline/contract.py"
    if not tool.is_file():
        return Advisory(rule_id=RULE_ID)
    result = subprocess.run([sys.executable, str(tool), "check", _artifact(relative), "--project-root", ctx.cwd], text=True, capture_output=True, check=False)
    if result.returncode != 1:
        return Advisory(rule_id=RULE_ID)
    return Advisory(rule_id=RULE_ID, message="【五件套结构漂移】当前产物不符合 canonical manifest；先运行 artifact-pipeline check 查看并修复，不能把改名/缺段/换序带入下一阶段。")


def _artifact(relative: str) -> str:
    return {".ai/CONCEPT.md": "concept", ".ai/AC_LIST.md": "acceptance", ".ai/TECH_PLAN.md": "tech_plan", ".ai/VERIFY_REPORT.md": "verify_report", ".ai/01_CHANGELOG.md": "changelog"}[relative]
