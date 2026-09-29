"""Shared iteration-pointer helpers for PreToolUse rules."""
from __future__ import annotations

import re
from pathlib import Path, PurePosixPath

CURRENT_RE = re.compile(r"^current:\s*(\S+)\s*$", re.MULTILINE)
ROOT_META_NAMES = frozenset({
    "README.md",
    "CHANGELOG.md",
    ".gitignore",
    "VERSION",
    "LICENSE",
})


def is_root_meta(target: PurePosixPath) -> bool:
    return len(target.parts) == 1 and target.as_posix() in ROOT_META_NAMES


def has_active_iteration(cwd: str) -> bool:
    """True when the project currently has an active iteration.

    Missing ledger → no active iteration. Unreadable or unparseable ledger
    fails closed (treat as active) so the meta escape hatch does not fire.
    """
    path = Path(cwd) / ".ai" / "ITERATIONS.md"
    if not path.is_file():
        return False
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return True
    match = CURRENT_RE.search(text)
    if not match:
        return True
    return match.group(1) != "none"


def meta_escape_applies(cwd: str, target: PurePosixPath) -> bool:
    return is_root_meta(target) and not has_active_iteration(cwd)
