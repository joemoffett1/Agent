# Agent framework — STANDARD tier

Self-contained. Copy this whole `standard/` folder to any machine and install it — it needs
nothing from outside this folder.

**This tier is for non-Max plans (e.g. Pro).** Every role runs on **Sonnet** (Pro can't use
Opus), thinking is dialed down, and `effortLevel` is `medium` — same workflow, lower usage.
Nothing that requires Max is enabled.

If you hit rate limits, the first lever is **fewer worktrees at once** (run one feature through
plan→build→review→integrate, then start the next), not lower quality.

## Install

**Windows (PowerShell):**
```
powershell -ExecutionPolicy Bypass -File install.ps1
```
**macOS / Linux:**
```
chmod +x install.sh && ./install.sh
```

The installer copies into `~/.claude/`: `agents/` (the 6 roles), `commands/`
(`/feature` `/fleet` `/bootstrap` `/role`), `KICKOFF.md`, `AGENTS_FRAMEWORK.md`, and appends the
auto-role block to `~/.claude/CLAUDE.md` (idempotent — safe to re-run). Then **manually** merge
`settings.snippet.json` into `~/.claude/settings.json` so your existing settings aren't clobbered.

## After installing
- **Existing project:** open a worktree folder as a session — it auto-adopts its role from the
  branch (`main` → orchestrator, review branch → reviewer, `feat/*` → builder). Or paste a card
  from `~/.claude/KICKOFF.md`.
- **Brand-new project:** open the repo and run `/bootstrap <idea>`.
- **Customizing names / scope / stack:** read `ADAPT-FOR-NEW-PROJECT.md`.
- **Optional HTML dashboard pages:** read `kb/KB-INTEGRATION.md`.

## What's in this folder
```
install.ps1 / install.sh      installer (no arguments needed)
settings.snippet.json         settings to merge (effortLevel medium)
KICKOFF.md                    paste-able launch cards (one per role)
AGENTS_FRAMEWORK.md           full framework reference
CLAUDE-autorole.md            branch→role block the installer appends to ~/.claude/CLAUDE.md
ADAPT-FOR-NEW-PROJECT.md      how to customize for your project
agents/                       the 6 roles (Sonnet, think-hard/think)
commands/                     /feature /fleet /bootstrap /role
kb/                           optional HTML docs: FRAMEWORK.md, REVIEWER.md, fleet.mjs, KB-INTEGRATION.md
```

To switch to the heavier tier later (if you upgrade to Max), install the `max` folder instead.
