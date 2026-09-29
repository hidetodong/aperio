"""Parse Codex ``apply_patch`` input into per-target file changes.

The parser intentionally understands only the documented patch envelope. A
non-empty command that contains no valid file section raises ``ValueError`` so
the PreToolUse gate can fail closed instead of silently skipping protection.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PatchChange:
    path: str
    operation: str
    added_lines: tuple[str, ...] = ()
    removed_lines: tuple[str, ...] = ()


_SECTION_PREFIXES = {
    "*** Add File: ": "add",
    "*** Update File: ": "update",
    "*** Delete File: ": "delete",
}


def parse_apply_patch(command: str) -> list[PatchChange]:
    """Return ordered, path-aggregated changes from an apply_patch command."""
    if not command or not command.strip():
        raise ValueError("apply_patch command is empty")

    ordered: dict[str, dict[str, object]] = {}
    current_path: str | None = None

    def ensure(path: str, operation: str) -> dict[str, object]:
        path = path.strip()
        if not path:
            raise ValueError("apply_patch contains an empty path")
        entry = ordered.get(path)
        if entry is None:
            entry = {"operation": operation, "added": [], "removed": []}
            ordered[path] = entry
        elif operation in {"add", "delete"}:
            entry["operation"] = operation
        return entry

    for line in command.splitlines():
        matched = False
        for prefix, operation in _SECTION_PREFIXES.items():
            if line.startswith(prefix):
                current_path = line[len(prefix):].strip()
                ensure(current_path, operation)
                matched = True
                break
        if matched:
            continue

        if line.startswith("*** Move to: "):
            if current_path is None:
                raise ValueError("apply_patch Move to appears before a file section")
            destination = line[len("*** Move to: "):].strip()
            source_entry = ensure(current_path, "delete")
            source_entry["operation"] = "delete"
            ensure(destination, "add")
            current_path = destination
            continue

        if current_path is None or line.startswith("***"):
            continue
        entry = ordered[current_path]
        if line.startswith("+") and not line.startswith("+++"):
            entry["added"].append(line[1:])
        elif line.startswith("-") and not line.startswith("---"):
            entry["removed"].append(line[1:])

    if not ordered:
        raise ValueError("apply_patch contains no file sections")

    return [
        PatchChange(
            path=path,
            operation=str(data["operation"]),
            added_lines=tuple(data["added"]),
            removed_lines=tuple(data["removed"]),
        )
        for path, data in ordered.items()
    ]
