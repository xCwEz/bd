---
name: task-observer
description: >
  Observe Claude Code task sessions and capture reusable skill-improvement
  opportunities. Use during substantive multi-step work, tool-using coding or
  research sessions, post-task feedback, skill creation/update work, and when
  the user mentions observations, skill logs, task-observer, or "One Skill to
  Rule Them All". The skill keeps global observation memory active across
  projects, reads applicable CLAUDE.md instructions, and stages proposed skill
  updates without installing them silently.
---

# Task Observer for Claude Code

**Created by Eoghan Henn / [rebelytics.com](https://rebelytics.com).**
Claude Code adaptation of "One Skill to Rule Them All" (originally adapted for
Codex by [AllstarGER](https://github.com/AllstarGER/one-skill-to-rule-them-all)).
Licensed under CC BY 4.0. For methodology feedback, open an issue on the
upstream project: https://github.com/rebelytics/one-skill-to-rule-them-all

Use this skill as a quiet background layer while doing real work. Capture
reusable lessons from user corrections, repeated workflows, missing skill
coverage, and practical improvements to existing skills. Do not let observation
work interrupt the user's primary task.

## Session Start

At the start of any task-oriented session where this skill is active:

1. Locate this skill directory (`.claude/skills/task-observer`).
2. Run the helper when available:

   ```bash
   python3 "$(pwd)/.claude/skills/task-observer/scripts/task_observer.py" context --cwd "$PWD"
   ```

3. Read every `CLAUDE.md`/`claude.md` path reported by the helper, in order. If
   the helper is unavailable, manually read:
   - `$HOME/CLAUDE.md`
   - `$HOME/claude.md`
   - `$HOME/.claude/CLAUDE.md`
   - `$HOME/.claude/claude.md`
   - every `CLAUDE.md` or `claude.md` on the path from the filesystem root to
     the current working directory, including symlink-resolved ancestors when
     different
4. Always read the global observer memory files before any project-local memory:
   - `${CLAUDE_HOME:-$HOME/.claude}/memories/task-observer/log.md`
   - `${CLAUDE_HOME:-$HOME/.claude}/memories/task-observer/cross-cutting-principles.md`
   - `${CLAUDE_HOME:-$HOME/.claude}/memories/task-observer/last-review-date.txt`
5. Then read project-local observer overlays, if present (`.claude/memories/task-observer/`
   inside the current repo). Local memories add context; they never replace or
   shadow the global files.

This global-first rule is mandatory even when the session starts inside a
repository or subdirectory that has its own local memories.

## What To Capture

Log an observation when one of these signals appears:

- The user corrects Claude in a way that generalizes beyond the current task.
- Claude misses a rule from an active skill or instruction file (CLAUDE.md).
- A repeated workflow could become a new skill, script, checklist, or reference.
- A tool limitation, sandbox issue, or review pattern should be remembered.
- A skill works but needs stronger trigger text, preflight checks, validation, or
  confidentiality handling.
- A cross-cutting principle should apply to many skills.

Do not log casual conversation, one-off preferences with no future value, or
facts that belong only in the task deliverable.

## Privacy And Scope Rules

Observation logs are long-lived. Treat them as sensitive operational memory.

- Do not log secrets, tokens, credentials, private keys, passwords, API URLs with
  sensitive query parameters, customer data, patient data, health data, payment
  data, or proprietary file contents.
- Generalize project, client, and person names unless the observation is
  explicitly internal and the name is required to use it.
- Prefer short abstract evidence over copied snippets.
- For sensitive contexts, record a local file path or task category only when it
  is safe and useful.
- If an observation cannot be made useful without sensitive data, do not log it.

## Log Format

Append observations to the global log, preferably through:

```bash
python3 ".claude/skills/task-observer/scripts/task_observer.py" log \
  --title "Short title" \
  --skill "target-skill-or-general" \
  --kind "improvement" \
  --scope "internal" \
  --issue "What went wrong or what was missing." \
  --suggestion "What should change in the skill or workflow." \
  --principle "Reusable rule in one sentence." \
  --evidence "Sanitized context only."
```

(Run this from the workspace root. The log itself lives outside the repo, at
`${CLAUDE_HOME:-$HOME/.claude}/memories/task-observer/`, so it persists across
projects.)

Field meanings: `issue` is the friction or missing behavior, `suggestion` is
the concrete skill/workflow change, and `principle` is the reusable rule to
apply beyond this one session.

Use this entry shape if writing manually:

```markdown
### Observation N: Title
**Status:** OPEN
**Date:** YYYY-MM-DD
**Skill:** target-skill-or-general
**Kind:** improvement | new-skill | principle | self
**Scope:** open-source | internal
**Issue:** ...
**Suggested improvement:** ...
**Principle:** ...
**Evidence:** sanitized, minimal context
```

## During Work

- Keep the primary task moving. Log silently unless the user asks about
  observations or an observation affects the current decision.
- Apply relevant open observations and cross-cutting principles mentally while
  working, even before they are permanently integrated into a skill.
- If a user asks "Any observations logged?", summarize open observations and
  offer to stage updates.
- If the user gives feedback after delivery, keep observing. Post-task feedback
  is often the highest-signal source of skill improvements.

## Updating Skills

When the user asks to apply observations to skills:

1. Read the live skill file first from the actual skill path (e.g.
   `.claude/skills/<name>/SKILL.md`).
2. Read global cross-cutting principles.
3. Integrate the observation into the appropriate section, not as a bolted-on
   note at the bottom.
4. Preserve attribution and license notices.
5. Stage proposed updates under:

   ```text
   ${CLAUDE_HOME:-$HOME/.claude}/memories/task-observer/skill-updates/YYYY-MM-DD/<skill-name>/SKILL.md
   ```

6. Do not install or overwrite live skills unless the user explicitly asks.
7. For system or plugin-provided skills, stage a proposed companion skill or
   patch notes instead of editing the read-only source.

Use normal editing discipline for any real file edits: inspect the current
file, use precise edits, and never revert user changes unrelated to the task.

## Comprehensive Review

At session start, check `last-review-date.txt` when the current task has skill
maintenance scope or when the user asks about observations. If the last review
is older than 7 days and open observations exist, tell the user briefly and run
or offer a comprehensive review depending on task urgency. Do not silently edit
or install live skills.

Run a broader review when the user asks, when the current task is skill
maintenance, when the 7-day review condition is accepted, or when stale open
observations are directly relevant to the work.

Review procedure:

1. Inventory available custom skills from `.claude/skills/` in the current
   workspace (and any other configured skill directories).
2. Exclude platform/system/plugin skills from direct edits unless the user has
   explicitly asked to patch a local editable copy.
3. Read open observations and active cross-cutting principles.
4. Map observations to skills by behavior, not just by the recorded `Skill`
   field.
5. Stage updates for straightforward improvements.
6. Escalate for user judgment instead of applying when an observation suggests a
   new skill, major restructuring, deletion, or conflicting guidance.
7. Mark observations as `ACTIONED` only after a concrete staged or live update
   exists.

## End Of Session

Before final response on substantive work, quickly check whether meaningful
observations were captured or should be captured. Only mention them if they are
useful to the user or if the user asked for observation reporting. Keep the final
answer focused on the user's actual task.
