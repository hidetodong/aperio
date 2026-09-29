"""Rule: placeholder reserved for AC-ID linkage and other artifact-chain checks.

Currently always returns allow. Future phases will populate this module
(AC-ID linkage linter, etc.) without touching the dispatcher wiring.
"""
from __future__ import annotations

from lib.io import Context, Decision

RULE_ID = "artifact_chain"


def evaluate(ctx: Context) -> Decision:
    return Decision(verdict="allow", rule_id=RULE_ID)
