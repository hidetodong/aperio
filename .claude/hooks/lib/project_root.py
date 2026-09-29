"""Side-effect-free project-root resolution shared by CLI and hook adapters."""
from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

MANAGED_MARKER = "<!-- butler-managed:start -->"
LEGACY_SIGNATURE = "规则源：butler v"
ENTRYPOINTS = ("CLAUDE.md", "AGENTS.md")


class RootResolutionError(ValueError):
    """Raised when a unique, writable project root cannot be proven."""


@dataclass(frozen=True)
class Resolution:
    root: Path
    evidence: str


def _validate_directory(path: Path, label: str) -> Path:
    root = path.expanduser().resolve()
    if not root.exists():
        raise RootResolutionError(f"{label} does not exist: {root}")
    if not root.is_dir():
        raise RootResolutionError(f"{label} is not a directory: {root}")
    if not os.access(root, os.R_OK | os.W_OK | os.X_OK):
        raise RootResolutionError(f"{label} is not readable/writable: {root}")
    return root


def _has_butler_entrypoint(root: Path) -> bool:
    if not (root / ".ai").is_dir():
        return False
    for name in ENTRYPOINTS:
        path = root / name
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if MANAGED_MARKER in text or LEGACY_SIGNATURE in text:
            return True
    return False


def _nearest_butler_root(start: Path) -> Path | None:
    for candidate in (start, *start.parents):
        if _has_butler_entrypoint(candidate):
            return candidate
    return None


def _git_root(start: Path) -> Path | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(start), "rev-parse", "--show-toplevel"],
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return None
    if result.returncode != 0:
        return None
    value = result.stdout.strip()
    return Path(value).resolve() if value else None


def resolve_project_root(
    *, user_target: Path | None = None, start: Path | None = None
) -> Resolution:
    """Resolve by explicit user target, existing Butler root, then VCS root."""
    if user_target is not None:
        return Resolution(_validate_directory(user_target, "user target"), "user-target")

    start_root = _validate_directory(start or Path.cwd(), "start directory")
    butler_root = _nearest_butler_root(start_root)
    if butler_root is not None:
        return Resolution(_validate_directory(butler_root, "Butler project root"), "butler-root")

    git_root = _git_root(start_root)
    if git_root is not None:
        return Resolution(_validate_directory(git_root, "VCS project root"), "vcs-root")

    raise RootResolutionError(
        "cannot prove one project root from the start directory; "
        "name the target project path explicitly"
    )
