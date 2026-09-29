"""Deterministic workspace discovery and PRD-backed write-scope checks.

This module is deliberately standard-library-only and side-effect-free.  It is
copied with Claude hooks and imported in place by the Butler resident CLI, so
the hook and verification commands share one parser and one authorization
decision.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


SCOPE_KEYS = ("primary_write", "supporting_write", "read_only", "excluded")
WRITE_KEYS = ("primary_write", "supporting_write")
WORKSPACE_KINDS = {"app", "service", "library", "tooling", "root", "other"}
WORKSPACE_STATUSES = {"active", "retired"}
OWNERSHIP_KINDS = {"shared", "generated"}
PRD_ID_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$")
VERSION_RE = re.compile(r"^v[0-9]+(?:\.[0-9]+)*$")
MODULE_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
KEY_RE = re.compile(r"^[^\s\[\],|]+$")


class ScopeError(ValueError):
    """A deterministic contract or boundary violation."""


def _clean_cell(value: str) -> str:
    value = value.strip().strip("`").strip()
    match = re.fullmatch(r"\[([^]]+)]\(([^)]+)\)", value)
    return match.group(2).strip() if match else value


def parse_tables(text: str) -> list[tuple[list[str], list[list[str]]]]:
    lines = text.splitlines()
    tables: list[tuple[list[str], list[list[str]]]] = []
    index = 0
    while index + 1 < len(lines):
        if not lines[index].lstrip().startswith("|"):
            index += 1
            continue
        headers = [part.strip().strip("`") for part in lines[index].strip().strip("|").split("|")]
        divider = [part.strip() for part in lines[index + 1].strip().strip("|").split("|")]
        if len(headers) != len(divider) or not divider or not all(re.fullmatch(r":?-{3,}:?", part) for part in divider):
            index += 1
            continue
        rows: list[list[str]] = []
        index += 2
        while index < len(lines) and lines[index].lstrip().startswith("|"):
            row = [part.strip() for part in lines[index].strip().strip("|").split("|")]
            if len(row) != len(headers):
                raise ScopeError("markdown table row width does not match its header")
            rows.append(row)
            index += 1
        tables.append((headers, rows))
    return tables


def _exact_table(text: str, headers: tuple[str, ...], *, required: bool) -> list[dict[str, str]]:
    matches: list[list[dict[str, str]]] = []
    for actual, rows in parse_tables(text):
        if tuple(actual) == headers:
            matches.append([{key: _clean_cell(value) for key, value in zip(headers, row)} for row in rows])
    if not matches:
        if required:
            raise ScopeError(f"required markdown table is missing: {' | '.join(headers)}")
        return []
    if len(matches) != 1:
        raise ScopeError(f"markdown table must appear exactly once: {' | '.join(headers)}")
    return matches[0]


def _read_text(path: Path) -> str:
    if path.is_symlink():
        raise ScopeError(f"symlink is not allowed: {path}")
    if not path.is_file():
        raise ScopeError(f"required file is missing: {path}")
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as error:
        raise ScopeError(f"cannot read UTF-8 file {path}: {error}") from error


def _root(project_root: Path | str) -> Path:
    try:
        root = Path(project_root).resolve(strict=True)
    except OSError as error:
        raise ScopeError(f"project root is missing: {project_root}") from error
    if not root.is_dir():
        raise ScopeError(f"project root is not a directory: {root}")
    return root


def _normal_rel(value: str, *, allow_prefix: bool = False) -> str:
    raw = value.strip().replace("\\", "/")
    suffix = "/**" if allow_prefix and raw.endswith("/**") else ""
    if suffix:
        raw = raw[:-3].rstrip("/")
    if not raw or raw.startswith("/") or "\x00" in raw:
        raise ScopeError(f"invalid project-relative path: {value!r}")
    pure = PurePosixPath(raw)
    if any(part in {"", ".", ".."} for part in pure.parts):
        raise ScopeError(f"path must be normalized and stay in the project: {value!r}")
    normalized = pure.as_posix()
    return normalized + suffix


def _validate_real_path(root: Path, relative: str, *, directory: bool) -> Path:
    path = root / relative
    current = root
    for part in PurePosixPath(relative).parts:
        current = current / part
        if current.is_symlink():
            raise ScopeError(f"path traverses a symlink: {relative}")
    try:
        resolved = path.resolve(strict=True)
        resolved.relative_to(root)
    except (OSError, ValueError) as error:
        raise ScopeError(f"path is missing or escapes project root: {relative}") from error
    if directory and not resolved.is_dir():
        raise ScopeError(f"workspace path is not a directory: {relative}")
    return resolved


def _list_cell(value: str, label: str) -> list[str]:
    match = re.fullmatch(r"\[([^]]*)]", value.strip())
    if not match:
        raise ScopeError(f"{label} must use [item, item] list syntax")
    items = [part.strip().strip("`") for part in match.group(1).split(",") if part.strip()]
    if len(items) != len(set(items)):
        raise ScopeError(f"{label} contains duplicate values")
    return items


def _valid_key(value: str, label: str = "workspace_key") -> str:
    if not KEY_RE.fullmatch(value) or value in {"*", "all", ".", ".."}:
        raise ScopeError(f"invalid {label}: {value!r}")
    return value


def _is_prefix(parent: str, child: str) -> bool:
    return child == parent or child.startswith(parent.rstrip("/") + "/")


def _patterns_overlap(left: str, right: str) -> bool:
    left_prefix = left.endswith("/**")
    right_prefix = right.endswith("/**")
    left_base = left[:-3].rstrip("/") if left_prefix else left
    right_base = right[:-3].rstrip("/") if right_prefix else right
    if not left_prefix and not right_prefix:
        return left_base == right_base
    if left_prefix and right_prefix:
        return _is_prefix(left_base, right_base) or _is_prefix(right_base, left_base)
    if left_prefix:
        return _is_prefix(left_base, right_base)
    return _is_prefix(right_base, left_base)


def _pattern_matches(pattern: str, relative: str) -> bool:
    if pattern.endswith("/**"):
        return _is_prefix(pattern[:-3].rstrip("/"), relative)
    return pattern == relative


def _manifest_identity(path: Path) -> str | None:
    manifest = path / "package.json"
    if not manifest.exists():
        return None
    try:
        value = json.loads(_read_text(manifest))
    except json.JSONDecodeError as error:
        raise ScopeError(f"invalid package manifest JSON: {manifest}") from error
    name = value.get("name") if isinstance(value, dict) else None
    return name if isinstance(name, str) and name.strip() else None


def load_workspace_map(project_root: Path) -> dict[str, Any]:
    root = _root(project_root)
    path = root / ".ai/project/workspaces.md"
    text = _read_text(path)
    rows = _exact_table(
        text,
        ("workspace_key", "package_identity", "path", "kind", "status", "evidence"),
        required=True,
    )
    if not rows:
        raise ScopeError("workspace map must contain at least one row")
    workspaces: dict[str, dict[str, str]] = {}
    active_paths: list[tuple[str, str]] = []
    for row in rows:
        key = _valid_key(row["workspace_key"])
        if key in workspaces:
            raise ScopeError(f"duplicate workspace_key: {key}")
        if row["kind"] not in WORKSPACE_KINDS:
            raise ScopeError(f"invalid workspace kind for {key}: {row['kind']}")
        if row["status"] not in WORKSPACE_STATUSES:
            raise ScopeError(f"invalid workspace status for {key}: {row['status']}")
        relative = "." if row["path"] == "." else _normal_rel(row["path"])
        if relative == "." and (key != "root" or row["kind"] != "root"):
            raise ScopeError("only workspace_key=root with kind=root may own project path .")
        if not row["evidence"]:
            raise ScopeError(f"workspace evidence must not be empty: {key}")
        normalized = dict(row)
        normalized["workspace_key"] = key
        normalized["path"] = relative
        workspaces[key] = normalized
        if row["status"] == "active":
            real = root if relative == "." else _validate_real_path(root, relative, directory=True)
            if relative != ".":
                active_paths.append((key, relative))
            identity = _manifest_identity(real)
            declared = row["package_identity"]
            if declared != "—" and identity != declared:
                raise ScopeError(f"manifest identity mismatch for {key}: map={declared}, manifest={identity}")
    for index, (left_key, left_path) in enumerate(active_paths):
        for right_key, right_path in active_paths[index + 1 :]:
            if _is_prefix(left_path, right_path) or _is_prefix(right_path, left_path):
                raise ScopeError(f"active workspace paths overlap: {left_key}={left_path}, {right_key}={right_path}")

    ownership_rows = _exact_table(
        text,
        ("path_pattern", "workspace_key", "path_kind", "evidence"),
        required=False,
    )
    ownership: list[dict[str, str]] = []
    for row in ownership_rows:
        pattern = _normal_rel(row["path_pattern"], allow_prefix=True)
        key = _valid_key(row["workspace_key"])
        if key not in workspaces or workspaces[key]["status"] != "active":
            raise ScopeError(f"Path Ownership references missing or retired workspace: {key}")
        if row["path_kind"] not in OWNERSHIP_KINDS:
            raise ScopeError(f"invalid Path Ownership kind: {row['path_kind']}")
        if not row["evidence"]:
            raise ScopeError(f"Path Ownership evidence must not be empty: {pattern}")
        ownership.append({**row, "path_pattern": pattern, "workspace_key": key})
    for index, left in enumerate(ownership):
        for right in ownership[index + 1 :]:
            if _patterns_overlap(left["path_pattern"], right["path_pattern"]):
                raise ScopeError(
                    f"Path Ownership patterns overlap: {left['path_pattern']} and {right['path_pattern']}"
                )
    return {"root": root, "workspaces": workspaces, "ownership": ownership}


def classify_path(workspace_map: dict[str, Any], relative_path: str) -> dict[str, str]:
    relative = _normal_rel(relative_path)
    candidates: list[tuple[str, str, str]] = []
    for key, row in workspace_map["workspaces"].items():
        if row["status"] != "active":
            continue
        base = row["path"]
        if base == "." or _is_prefix(base, relative):
            candidates.append((key, "workspace", base))
    for row in workspace_map["ownership"]:
        if _pattern_matches(row["path_pattern"], relative):
            candidates.append((row["workspace_key"], row["path_kind"], row["path_pattern"]))
    keys = {item[0] for item in candidates}
    if not candidates:
        raise ScopeError(f"path has no workspace owner: {relative}")
    if len(keys) != 1:
        raise ScopeError(f"path has ambiguous workspace owners: {relative} -> {sorted(keys)}")
    key = next(iter(keys))
    strongest = next((item for item in candidates if item[1] != "workspace"), candidates[0])
    return {"path": relative, "workspace_key": key, "ownership": strongest[1], "matched_by": strongest[2]}


def _workspace_patterns_from_package_json(root: Path) -> list[str]:
    manifest = root / "package.json"
    if not manifest.is_file():
        return []
    try:
        value = json.loads(_read_text(manifest))
    except json.JSONDecodeError as error:
        raise ScopeError(f"invalid package manifest JSON: {manifest}") from error
    raw = value.get("workspaces") if isinstance(value, dict) else None
    if raw is None:
        return []
    if isinstance(raw, dict):
        if set(raw) != {"packages"}:
            raise ScopeError("package.json workspaces object must contain exactly packages")
        raw = raw["packages"]
    if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
        raise ScopeError("package.json workspaces must be a string list")
    return raw


def _workspace_patterns_from_pnpm(root: Path) -> list[str]:
    path = root / "pnpm-workspace.yaml"
    if not path.exists():
        return []
    lines = _read_text(path).splitlines()
    in_packages = False
    patterns: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if not line.startswith((" ", "\t")):
            if stripped != "packages:":
                if in_packages:
                    break
                continue
            in_packages = True
            continue
        if in_packages:
            match = re.fullmatch(r"-\s*['\"]?([^'\"]+)['\"]?", stripped)
            if not match:
                raise ScopeError("pnpm-workspace.yaml packages must be a plain string list")
            patterns.append(match.group(1).strip())
    if not in_packages:
        raise ScopeError("pnpm-workspace.yaml is missing packages")
    return patterns


def _validate_discovery_pattern(value: str) -> str:
    pattern = value.strip().replace("\\", "/").rstrip("/")
    if not pattern or pattern.startswith(("/", "!")) or ".." in PurePosixPath(pattern).parts:
        raise ScopeError(f"unsafe workspace pattern: {value!r}")
    if "**" in pattern or any(char in pattern for char in "?[]{}"):
        raise ScopeError(f"unsupported workspace pattern: {value!r}")
    if pattern.count("*") > 1 or ("*" in pattern and not pattern.endswith("/*")):
        raise ScopeError(f"workspace pattern only supports one trailing /*: {value!r}")
    return pattern


def discover_workspaces(project_root: Path) -> dict[str, Any]:
    root = _root(project_root)
    npm_patterns = [_validate_discovery_pattern(item) for item in _workspace_patterns_from_package_json(root)]
    pnpm_patterns = [_validate_discovery_pattern(item) for item in _workspace_patterns_from_pnpm(root)]
    if npm_patterns and pnpm_patterns and set(npm_patterns) != set(pnpm_patterns):
        raise ScopeError("npm and pnpm workspace declarations disagree")
    patterns = sorted(set(npm_patterns or pnpm_patterns))
    if not patterns:
        identity = _manifest_identity(root)
        return {
            "layout": "single-package",
            "patterns": [],
            "candidates": [{
                "workspace_key": "root", "package_identity": identity or "—", "path": ".",
                "kind": "root", "status": "active", "evidence": "project-root",
            }],
        }
    manifests: dict[str, Path] = {}
    for pattern in patterns:
        bases: Iterable[Path]
        if pattern.endswith("/*"):
            parent = root / pattern[:-2]
            if parent.is_symlink():
                raise ScopeError(f"workspace pattern parent is a symlink: {pattern}")
            bases = sorted((item for item in parent.iterdir() if item.is_dir()), key=lambda item: item.name) if parent.is_dir() else []
        else:
            bases = [root / pattern]
        for base in bases:
            relative = base.relative_to(root).as_posix()
            if base.is_symlink():
                raise ScopeError(f"workspace path is a symlink: {relative}")
            manifest = base / "package.json"
            if manifest.is_symlink():
                raise ScopeError(f"workspace package.json is a symlink: {relative}")
            if not manifest.is_file():
                if pattern.endswith("/*"):
                    continue
                raise ScopeError(f"declared workspace has no package.json: {relative}")
            _validate_real_path(root, relative, directory=True)
            identity = _manifest_identity(base)
            if not identity:
                raise ScopeError(f"workspace package.json has no non-empty name: {relative}")
            if identity in manifests:
                raise ScopeError(f"duplicate package identity: {identity}")
            manifests[identity] = base
    if not manifests:
        raise ScopeError("workspace declarations matched no package manifests")
    paths = sorted(base.relative_to(root).as_posix() for base in manifests.values())
    for index, left in enumerate(paths):
        for right in paths[index + 1 :]:
            if _is_prefix(left, right) or _is_prefix(right, left):
                raise ScopeError(f"discovered workspace paths overlap: {left}, {right}")
    candidates = []
    for identity, base in sorted(manifests.items()):
        relative = base.relative_to(root).as_posix()
        first = PurePosixPath(relative).parts[0]
        kind = "app" if first in {"app", "apps"} else "library" if first in {"package", "packages", "libs"} else "other"
        candidates.append({
            "workspace_key": identity, "package_identity": identity, "path": relative,
            "kind": kind, "status": "active", "evidence": f"{relative}/package.json:name",
        })
    return {"layout": "monorepo", "patterns": patterns, "candidates": candidates}


def parse_prd_refs(ac_text: str) -> list[dict[str, Any]]:
    legacy = bool(re.search(r"(?m)^\s*prd_version\s*:", ac_text))
    marker = re.search(r"(?m)^\s*prd_refs\s*:\s*$", ac_text)
    if marker is None:
        if legacy:
            raise ScopeError("legacy prd_version has no stable prd_id; migrate before workspace gating")
        return []
    block: list[str] = []
    for line in ac_text[marker.end() :].splitlines():
        if line and not line.startswith((" ", "\t")):
            break
        block.append(line)
    refs: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for line in block:
        start = re.fullmatch(r"\s+-\s+prd_id\s*:\s*([^\s]+)\s*", line)
        if start:
            if current is not None:
                refs.append(current)
            current = {"prd_id": start.group(1).strip("`")}
            continue
        field = re.fullmatch(r"\s+(prd_version|module_slugs)\s*:\s*(.*?)\s*", line)
        if field and current is not None:
            key, value = field.groups()
            current[key] = _list_cell(value, "module_slugs") if key == "module_slugs" else value.strip("`")
            continue
        if line.strip():
            raise ScopeError(f"invalid prd_refs line: {line.strip()}")
    if current is not None:
        refs.append(current)
    if not refs:
        raise ScopeError("prd_refs must contain at least one item")
    seen: set[str] = set()
    for ref in refs:
        if set(ref) != {"prd_id", "prd_version", "module_slugs"}:
            raise ScopeError(f"prd_refs item has missing or unknown fields: {ref.get('prd_id', '?')}")
        if not PRD_ID_RE.fullmatch(ref["prd_id"]) or ref["prd_id"] in seen:
            raise ScopeError(f"invalid or duplicate prd_id in prd_refs: {ref['prd_id']}")
        if not VERSION_RE.fullmatch(ref["prd_version"]):
            raise ScopeError(f"invalid prd_version for {ref['prd_id']}: {ref['prd_version']}")
        if not ref["module_slugs"] or any(not MODULE_RE.fullmatch(item) for item in ref["module_slugs"]):
            raise ScopeError(f"invalid module_slugs for {ref['prd_id']}")
        seen.add(ref["prd_id"])
    return refs


def _scope_from_index(text: str, active_keys: set[str], label: str) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for key in SCOPE_KEYS:
        matches = re.findall(rf"(?m)^\s*-\s*{key}\s*:\s*(\[[^]]*])\s*$", text)
        if len(matches) != 1:
            raise ScopeError(f"{label} must contain exactly one {key} list")
        result[key] = _list_cell(matches[0], f"{label} {key}")
    categories: dict[str, str] = {}
    for category, keys in result.items():
        for key in keys:
            _valid_key(key)
            if key not in active_keys:
                raise ScopeError(f"{label} references missing or retired workspace: {key}")
            if key in categories:
                raise ScopeError(f"{label} workspace {key} appears in both {categories[key]} and {category}")
            categories[key] = category
    if not result["primary_write"]:
        raise ScopeError(f"{label} primary_write must not be empty")
    return result


def _module_scopes(text: str, requirement_scope: dict[str, list[str]], active_keys: set[str]) -> dict[str, dict[str, list[str]]]:
    rows = _exact_table(text, ("module_slug", *SCOPE_KEYS), required=False)
    result: dict[str, dict[str, list[str]]] = {}
    for row in rows:
        slug = row["module_slug"]
        if not MODULE_RE.fullmatch(slug) or slug in result:
            raise ScopeError(f"invalid or duplicate module_slug in Module Workspace Scope: {slug}")
        scope = {key: _list_cell(row[key], f"{slug} {key}") for key in SCOPE_KEYS}
        seen: dict[str, str] = {}
        for category, keys in scope.items():
            for key in keys:
                _valid_key(key)
                if key not in active_keys:
                    raise ScopeError(f"module {slug} references missing or retired workspace: {key}")
                if key in seen:
                    raise ScopeError(f"module {slug} workspace {key} appears in two categories")
                seen[key] = category
        if not set(scope["primary_write"]).issubset(requirement_scope["primary_write"]):
            raise ScopeError(f"module {slug} expands primary_write")
        if not set(scope["supporting_write"]).issubset(requirement_scope["supporting_write"]):
            raise ScopeError(f"module {slug} expands supporting_write")
        allowed_read = set(requirement_scope["read_only"]) | set(requirement_scope["primary_write"]) | set(requirement_scope["supporting_write"])
        if not set(scope["read_only"]).issubset(allowed_read):
            raise ScopeError(f"module {slug} expands read_only")
        if not set(scope["excluded"]).issuperset(requirement_scope["excluded"]):
            raise ScopeError(f"module {slug} removes requirement exclusions")
        result[slug] = scope
    return result


def resolve_effective_scope(project_root: Path, refs: list[dict[str, Any]], workspace_map: dict[str, Any]) -> dict[str, Any]:
    root = workspace_map["root"]
    active_keys = {key for key, row in workspace_map["workspaces"].items() if row["status"] == "active"}
    aggregate: dict[str, str] = {}
    sources: list[dict[str, str]] = []
    for ref in refs:
        directory = root / ".ai/references/prd" / ref["prd_id"]
        live = directory / "00_INDEX.md"
        live_text = _read_text(live)
        versions = re.findall(r"(?m)^\s*-\s*current_version\s*:\s*`?([^`\s]+)`?\s*$", live_text)
        if len(versions) != 1:
            raise ScopeError(f"single PRD index must contain one current_version: {ref['prd_id']}")
        if versions[0] == ref["prd_version"]:
            index_path, text = live, live_text
        else:
            index_path = directory / ".archive" / ref["prd_version"] / "00_INDEX.md"
            text = _read_text(index_path)
        requirement_scope = _scope_from_index(text, active_keys, ref["prd_id"])
        module_scopes = _module_scopes(text, requirement_scope, active_keys)
        registry = _exact_table(
            text,
            ("module_slug", "标题 / 章节", "首见版本", "当前版本", "状态"),
            required=True,
        )
        known = {row["module_slug"] for row in registry}
        for slug in ref["module_slugs"]:
            if slug not in known:
                raise ScopeError(f"pinned module is missing from {ref['prd_id']}@{ref['prd_version']}: {slug}")
            scope = module_scopes.get(slug, requirement_scope)
            for category, keys in scope.items():
                for key in keys:
                    previous = aggregate.get(key)
                    if previous is not None and previous != category:
                        raise ScopeError(f"explicit workspace permission conflict for {key}: {previous} vs {category}")
                    aggregate[key] = category
            sources.append({"prd_id": ref["prd_id"], "prd_version": ref["prd_version"], "module_slug": slug, "index": index_path.relative_to(root).as_posix()})
    return {
        "categories": {category: sorted(key for key, value in aggregate.items() if value == category) for category in SCOPE_KEYS},
        "by_workspace": dict(sorted(aggregate.items())),
        "sources": sources,
    }


def parse_write_plan(plan_text: str, effective: dict[str, Any], workspace_map: dict[str, Any]) -> list[dict[str, Any]]:
    rows = _exact_table(
        plan_text,
        ("workspace_key", "access", "path_patterns", "rationale"),
        required=True,
    )
    if not rows:
        raise ScopeError("Workspace Write Plan must contain at least one row")
    result: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    has_primary = False
    for row in rows:
        key = _valid_key(row["workspace_key"])
        if key in seen_keys:
            raise ScopeError(f"Workspace Write Plan contains duplicate workspace_key: {key}")
        access = row["access"]
        if access not in WRITE_KEYS:
            raise ScopeError(f"invalid Workspace Write Plan access for {key}: {access}")
        if effective["by_workspace"].get(key) != access:
            raise ScopeError(f"Workspace Write Plan access exceeds or disagrees with pinned scope for {key}")
        if not row["rationale"]:
            raise ScopeError(f"Workspace Write Plan rationale must not be empty: {key}")
        patterns = [_normal_rel(item, allow_prefix=True) for item in _list_cell(row["path_patterns"], f"{key} path_patterns")]
        if not patterns:
            raise ScopeError(f"Workspace Write Plan path_patterns must not be empty: {key}")
        for pattern in patterns:
            probe = pattern[:-3].rstrip("/") if pattern.endswith("/**") else pattern
            owner = classify_path(workspace_map, probe)
            if owner["workspace_key"] != key:
                raise ScopeError(f"planned path is owned by {owner['workspace_key']}, not {key}: {pattern}")
        result.append({"workspace_key": key, "access": access, "path_patterns": patterns, "rationale": row["rationale"]})
        seen_keys.add(key)
        has_primary = has_primary or access == "primary_write"
    if not has_primary:
        raise ScopeError("Workspace Write Plan must include at least one primary_write workspace")
    return result


def authorize_paths(project_root: Path, paths: Iterable[str]) -> dict[str, Any]:
    root = _root(project_root)
    ac_text = _read_text(root / ".ai/AC_LIST.md")
    refs = parse_prd_refs(ac_text)
    normalized = [_normal_rel(item) for item in paths]
    if not refs:
        return {"applicable": False, "reason": "AC_LIST has no prd_refs", "paths": normalized, "results": []}
    workspace_map = load_workspace_map(root)
    effective = resolve_effective_scope(root, refs, workspace_map)
    plan = parse_write_plan(_read_text(root / ".ai/TECH_PLAN.md"), effective, workspace_map)
    results: list[dict[str, str]] = []
    for relative in normalized:
        owner = classify_path(workspace_map, relative)
        category = effective["by_workspace"].get(owner["workspace_key"])
        if category not in WRITE_KEYS:
            raise ScopeError(f"write denied by pinned scope: {relative} -> {owner['workspace_key']} ({category or 'undeclared'})")
        row = next((item for item in plan if item["workspace_key"] == owner["workspace_key"]), None)
        if row is None or not any(_pattern_matches(pattern, relative) for pattern in row["path_patterns"]):
            raise ScopeError(f"write is outside Workspace Write Plan: {relative} -> {owner['workspace_key']}")
        results.append({**owner, "access": category})
    return {"applicable": True, "reason": "prd_refs scope enforced", "paths": normalized, "results": results, "effective_scope": effective, "write_plan": plan}


def git_changed_paths(project_root: Path, base: str, head: str | None, include_untracked: bool) -> list[str]:
    root = _root(project_root)
    if not base or base.startswith("-") or (head is not None and (not head or head.startswith("-"))):
        raise ScopeError("git revisions must be non-empty and must not start with '-'")
    command = ["git", "-C", str(root), "diff", "--name-status", "-z", "--find-renames", base]
    if head:
        command.append(head)
    try:
        result = subprocess.run(command, capture_output=True, check=False)
    except OSError as error:
        raise ScopeError(f"cannot run git diff: {error}") from error
    if result.returncode != 0:
        raise ScopeError(f"git diff failed: {result.stderr.decode('utf-8', 'replace').strip()}")
    fields = result.stdout.decode("utf-8").split("\0")
    paths: list[str] = []
    index = 0
    while index < len(fields) and fields[index]:
        status = fields[index]
        index += 1
        count = 2 if status.startswith(("R", "C")) else 1
        if index + count > len(fields):
            raise ScopeError("git diff returned a malformed name-status stream")
        paths.extend(fields[index : index + count])
        index += count
    if include_untracked:
        untracked = subprocess.run(
            ["git", "-C", str(root), "ls-files", "--others", "--exclude-standard", "-z"],
            capture_output=True,
            check=False,
        )
        if untracked.returncode != 0:
            raise ScopeError(f"git ls-files failed: {untracked.stderr.decode('utf-8', 'replace').strip()}")
        paths.extend(item for item in untracked.stdout.decode("utf-8").split("\0") if item)
    return sorted(set(paths))
