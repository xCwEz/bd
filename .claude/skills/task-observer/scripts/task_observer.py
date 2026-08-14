#!/usr/bin/env python3
"""Claude Code task-observer helper.

The script keeps runtime file discovery deterministic:
- initialize global observer memory
- report CLAUDE.md and memory files that Claude Code must read
- append sanitized observations to the global log
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
import time
from pathlib import Path
from typing import List, Optional, Set


LOG_TEMPLATE = """# Skill Observation Log

Observations captured during Claude Code task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED = applied to a staged or live update | DECLINED = intentionally not pursued

---
"""

PRINCIPLES_TEMPLATE = """# Cross-Cutting Principles

Principles that apply across Claude Code skills. Read this before creating or updating skills.

---

## Active Principles

"""


def claude_home() -> Path:
    return Path(os.environ.get("CLAUDE_HOME", Path.home() / ".claude")).expanduser()


def global_dir() -> Path:
    return claude_home() / "memories" / "task-observer"


def global_files() -> List[Path]:
    base = global_dir()
    return [
        base / "log.md",
        base / "cross-cutting-principles.md",
        base / "last-review-date.txt",
    ]


def ensure_files() -> None:
    home = claude_home()
    if home.exists() and not home.is_dir():
        raise SystemExit(f"CLAUDE_HOME must be a directory, got file: {home}")

    base = global_dir()
    (base / "archive").mkdir(parents=True, exist_ok=True)
    (base / "skill-updates").mkdir(parents=True, exist_ok=True)

    log_path = base / "log.md"
    if not log_path.exists():
        log_path.write_text(LOG_TEMPLATE, encoding="utf-8")

    principles_path = base / "cross-cutting-principles.md"
    if not principles_path.exists():
        principles_path.write_text(PRINCIPLES_TEMPLATE, encoding="utf-8")

    review_path = base / "last-review-date.txt"
    if not review_path.exists():
        review_path.write_text("", encoding="utf-8")


def dedupe(paths: List[Path]) -> List[Path]:
    seen: Set[str] = set()
    result: List[Path] = []
    for path in paths:
        try:
            key = str(path.resolve()) if path.exists() else str(path)
        except OSError:
            key = str(path)
        if key not in seen:
            seen.add(key)
            result.append(path)
    return result


def normalize_existing_directory(path: Path, label: str) -> Path:
    path = path.expanduser()
    try:
        path = path.resolve()
    except OSError:
        path = path.absolute()

    if path.is_file():
        raise SystemExit(f"{label} must be a directory, got file: {path}")
    if not path.exists():
        raise SystemExit(f"{label} does not exist: {path}")
    if not path.is_dir():
        raise SystemExit(f"{label} must be a directory: {path}")
    return path


def discovery_root(path: Path) -> Path:
    for candidate in [path, *path.parents]:
        if (candidate / ".git").exists():
            return candidate

    home = Path.home().resolve()
    if path == home or home in path.parents:
        return home

    return path


def ancestors_root_first(path: Path) -> List[Path]:
    path = normalize_existing_directory(path, "path")

    root = discovery_root(path)
    chain = []
    current = path
    while True:
        chain.append(current)
        if current == root or current == current.parent:
            break
        current = current.parent
    return list(reversed(chain))


def instruction_file_candidates(directory: Path) -> List[Path]:
    return [directory / "CLAUDE.md", directory / "claude.md"]


def claude_md_paths(cwd: Path) -> List[Path]:
    home = Path.home()
    candidates = []
    for directory in [home, home / ".claude"]:
        candidates.extend(instruction_file_candidates(directory))

    raw_cwd = cwd.expanduser().absolute()
    resolved_cwd = raw_cwd.resolve()
    for base in dedupe([raw_cwd, resolved_cwd]):
        for parent in ancestors_root_first(base):
            candidates.extend(instruction_file_candidates(parent))

    return [path for path in dedupe(candidates) if path.exists()]


def local_memory_dirs(cwd: Path) -> List[Path]:
    candidates: List[Path] = []
    raw_cwd = cwd.expanduser().absolute()
    resolved_cwd = raw_cwd.resolve()
    for base in dedupe([raw_cwd, resolved_cwd]):
        for parent in ancestors_root_first(base):
            candidates.append(parent / ".claude" / "memories" / "task-observer")
    global_path = global_dir().resolve()
    result: List[Path] = []
    for path in dedupe(candidates):
        if not path.exists():
            continue
        if path.resolve() == global_path:
            continue
        result.append(path)
    return result


def next_observation_number(log_text: str) -> int:
    numbers = [int(match) for match in re.findall(r"^### Observation (\d+):", log_text, re.M)]
    return max(numbers, default=0) + 1


def sanitize_multiline(value: str) -> str:
    return " ".join(value.strip().splitlines())


def sanitize_heading(value: str) -> str:
    value = sanitize_multiline(value).lstrip("#").strip()
    return value or "Untitled observation"


class LockFile:
    def __init__(self, path: Path, timeout_seconds: float = 10.0) -> None:
        self.path = path
        self.timeout_seconds = timeout_seconds
        self.fd: Optional[int] = None

    def __enter__(self) -> "LockFile":
        deadline = time.monotonic() + self.timeout_seconds
        while True:
            try:
                self.fd = os.open(str(self.path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.write(self.fd, f"{os.getpid()} {dt.datetime.now().isoformat()}\n".encode("utf-8"))
                return self
            except FileExistsError:
                if time.monotonic() >= deadline:
                    raise TimeoutError(f"Timed out waiting for lock: {self.path}")
                time.sleep(0.05)

    def __exit__(self, _exc_type, _exc, _tb) -> None:
        try:
            if self.fd is not None:
                os.close(self.fd)
        finally:
            self.fd = None
            try:
                self.path.unlink()
            except FileNotFoundError:
                pass


def command_init(_args: argparse.Namespace) -> int:
    ensure_files()
    print(f"Initialized task-observer memory at {global_dir()}")
    return 0


def command_context(args: argparse.Namespace) -> int:
    ensure_files()
    try:
        cwd = normalize_existing_directory(Path(args.cwd) if args.cwd else Path.cwd(), "--cwd")
    except SystemExit as exc:
        print(f"warning: {exc}; falling back to {Path.home()}", file=sys.stderr)
        cwd = normalize_existing_directory(Path.home(), "fallback cwd")

    print("# Task Observer Context")
    print()
    print("Read these CLAUDE.md/claude.md files in order:")
    instruction_files = claude_md_paths(cwd)
    if instruction_files:
        for path in instruction_files:
            print(f"- {path}")
    else:
        print("- none found")

    print()
    print("Always read these global memory files before project-local memory:")
    for path in global_files():
        print(f"- {path}")

    print()
    print("Then read these project-local observer memory overlays, if present:")
    overlays = local_memory_dirs(cwd)
    if overlays:
        for path in overlays:
            print(f"- {path}")
    else:
        print("- none found")
    return 0


def command_status(_args: argparse.Namespace) -> int:
    ensure_files()
    log_path = global_dir() / "log.md"
    text = log_path.read_text(encoding="utf-8")
    counts = {
        "OPEN": len(re.findall(r"^\*\*Status:\*\* OPEN\b", text, re.M)),
        "ACTIONED": len(re.findall(r"^\*\*Status:\*\* ACTIONED\b", text, re.M)),
        "DECLINED": len(re.findall(r"^\*\*Status:\*\* DECLINED\b", text, re.M)),
    }
    for status, count in counts.items():
        print(f"{status}: {count}")
    print(f"Log: {log_path}")
    return 0


def command_log(args: argparse.Namespace) -> int:
    ensure_files()
    log_path = global_dir() / "log.md"
    lock_path = global_dir() / "log.md.lock"
    today = dt.date.today().isoformat()

    with LockFile(lock_path), log_path.open("r+", encoding="utf-8") as handle:
        text = handle.read()
        number = next_observation_number(text)
        entry = f"""
### Observation {number}: {sanitize_heading(args.title)}
**Status:** OPEN
**Date:** {today}
**Skill:** {sanitize_multiline(args.skill)}
**Kind:** {sanitize_multiline(args.kind)}
**Scope:** {sanitize_multiline(args.scope)}
**Issue:** {sanitize_multiline(args.issue)}
**Suggested improvement:** {sanitize_multiline(args.suggestion)}
**Principle:** {sanitize_multiline(args.principle)}
**Evidence:** {sanitize_multiline(args.evidence)}
"""
        handle.seek(0, os.SEEK_END)
        if not text.endswith("\n"):
            handle.write("\n")
        handle.write(entry)
        handle.flush()
        os.fsync(handle.fileno())
    print(f"Logged observation {number} to {log_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Claude Code task-observer helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="Initialize global observer memory")
    init_parser.set_defaults(func=command_init)

    context_parser = subparsers.add_parser("context", help="List CLAUDE.md and memory files to read")
    context_parser.add_argument("--cwd", default=None, help="Current working directory")
    context_parser.set_defaults(func=command_context)

    status_parser = subparsers.add_parser("status", help="Show observation status counts")
    status_parser.set_defaults(func=command_status)

    log_parser = subparsers.add_parser("log", help="Append a sanitized observation")
    log_parser.add_argument("--title", required=True)
    log_parser.add_argument("--skill", default="general")
    log_parser.add_argument("--kind", choices=["improvement", "new-skill", "principle", "self"], default="improvement")
    log_parser.add_argument("--scope", choices=["open-source", "internal"], default="internal")
    log_parser.add_argument("--issue", required=True)
    log_parser.add_argument("--suggestion", required=True)
    log_parser.add_argument("--principle", required=True)
    log_parser.add_argument("--evidence", default="sanitized session context")
    log_parser.set_defaults(func=command_log)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
