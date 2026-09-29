"""Types, constants, and stdin/path helpers for butler_gate."""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Literal

from lib.codex_patch import parse_apply_patch
from lib.project_root import RootResolutionError, resolve_project_root

GATED_BLACKLIST = frozenset({
    ".ai/",
    "deliveries/",
    ".claude/",
    ".git/",
    "node_modules/",
    ".vscode/",
    ".idea/",
})

# Butler has two materially different non-project cases:
# - UNKNOWN_TARGET: malformed/missing tool input; fail closed.
# - OUTSIDE_PROJECT: a real path Butler cannot anchor to a managed/VCS project;
#   Butler abstains and leaves filesystem authorization to the host.
UNKNOWN_TARGET = PurePosixPath("__UNKNOWN_TARGET__")
OUTSIDE_PROJECT = PurePosixPath("__OUTSIDE_PROJECT__")


@dataclass(frozen=True)
class Context:
    cwd: str
    tool_name: str
    target_path: PurePosixPath
    tool_input: dict = field(default_factory=dict)


@dataclass(frozen=True)
class Decision:
    verdict: Literal["allow", "deny"]
    rule_id: str
    reason: str = ""
    remediation: str = ""


@dataclass(frozen=True)
class Advisory:
    """PostToolUse advisory：放行 + 可选向模型注入的提醒。

    与 Decision（PreToolUse 的 allow/deny 门禁）刻意分开——advisory 只在工具
    执行之后跑，没有 verdict、不能 deny、不改工具结果。message 为空即静默不注入。
    """
    rule_id: str
    message: str = ""


def parse_stdin() -> dict:
    """Reads Claude Code PreToolUse JSON from stdin."""
    return json.loads(sys.stdin.read())


def resolve_target(tool_input: dict, cwd: str) -> PurePosixPath:
    """Normalize file_path into a path relative to cwd.

    Missing/empty input returns UNKNOWN_TARGET. A real path outside cwd returns
    OUTSIDE_PROJECT so Butler rules can abstain without treating bad input as an
    authorized external write.
    """
    raw = tool_input.get("file_path", "")
    if not raw:
        return UNKNOWN_TARGET

    p = Path(raw).expanduser()
    cwd_resolved = Path(cwd).resolve()

    if p.is_absolute():
        try:
            rel = p.resolve().relative_to(cwd_resolved)
        except ValueError:
            return OUTSIDE_PROJECT
        return PurePosixPath(rel.as_posix())

    # Relative path: resolve against cwd, check it stays inside.
    try:
        resolved = (cwd_resolved / p).resolve()
        rel = resolved.relative_to(cwd_resolved)
    except ValueError:
        return OUTSIDE_PROJECT
    return PurePosixPath(rel.as_posix())


def contexts_from_payload(payload: dict) -> list[Context]:
    """Build one context for Claude edits or one per Codex patch target."""
    tool_name = payload.get("tool_name", "")
    cwd = payload.get("cwd", ".")
    tool_input = payload.get("tool_input", {}) or {}
    if tool_name != "apply_patch":
        return [_project_context(cwd, tool_name, tool_input)]

    command = tool_input.get("command", "")
    contexts: list[Context] = []
    for change in parse_apply_patch(command):
        synthetic = dict(tool_input)
        synthetic.update({
            "file_path": change.path,
            "butler_patch_operation": change.operation,
            "butler_patch_added": list(change.added_lines),
            "butler_patch_removed": list(change.removed_lines),
        })
        contexts.append(_project_context(cwd, tool_name, synthetic))
    return contexts


def _project_context(cwd: str, tool_name: str, tool_input: dict) -> Context:
    """Anchor a write target to its actual Butler/VCS project root."""
    raw = tool_input.get("file_path", "")
    if not raw:
        return Context(cwd, tool_name, UNKNOWN_TARGET, tool_input)

    path = Path(raw).expanduser()
    try:
        cwd_resolved = Path(cwd).resolve()
        absolute = (
            path.resolve()
            if path.is_absolute()
            else (cwd_resolved / path).resolve()
        )
        anchor = absolute if absolute.is_dir() else absolute.parent
        while not anchor.exists() and anchor != anchor.parent:
            anchor = anchor.parent
    except OSError:
        return Context(cwd, tool_name, UNKNOWN_TARGET, tool_input)

    try:
        project_root = resolve_project_root(start=anchor).root
    except RootResolutionError:
        # Legacy/unmanaged projects may have neither a Butler marker nor Git.
        # Only an existing .ai directory proves that the host-provided cwd is
        # still a Butler project boundary; a plain aggregate directory is not.
        if not (cwd_resolved / ".ai").is_dir():
            return Context(cwd, tool_name, OUTSIDE_PROJECT, tool_input)
        project_root = cwd_resolved

    try:
        relative = absolute.relative_to(project_root)
    except ValueError:
        return Context(cwd, tool_name, OUTSIDE_PROJECT, tool_input)
    return Context(str(project_root), tool_name, PurePosixPath(relative.as_posix()), tool_input)


def is_gated(target: PurePosixPath, blacklist: frozenset = GATED_BLACKLIST) -> bool:
    """True when the target path is subject to gating (i.e. NOT in the exempt blacklist)."""
    if target == UNKNOWN_TARGET:
        return True
    if target == OUTSIDE_PROJECT:
        return False
    target_str = target.as_posix()
    for prefix in blacklist:
        p = prefix.rstrip("/")
        if target_str == p or target_str.startswith(p + "/"):
            return False
    return True
