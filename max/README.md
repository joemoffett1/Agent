# Agent framework — MAX tier

Self-contained. Copy this whole `max/` folder to any machine and install it — it needs nothing
from outside this folder.

**This tier is for Claude Max plans.** Every role runs on **Opus**; planning + orchestration use
the deepest thinking (ultrathink); `effortLevel` is `high`. Built for running several worktrees in
parallel. (On a Pro plan you can't use Opus — use the `standard` tier instead.)

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
settings.snippet.json         settings to merge (effortLevel high)
KICKOFF.md                    paste-able launch cards (one per role)
AGENTS_FRAMEWORK.md           full framework reference
CLAUDE-autorole.md            branch→role block the installer appends to ~/.claude/CLAUDE.md
ADAPT-FOR-NEW-PROJECT.md      how to customize for your project
agents/                       the 6 roles (Opus, ultrathink/think-hard)
commands/                     /feature /fleet /bootstrap /role
kb/                           optional HTML docs: FRAMEWORK.md, REVIEWER.md, fleet.mjs, KB-INTEGRATION.md
```

To switch to the lighter tier later, install the `standard` folder instead (re-running its
installer overwrites the role files; your `CLAUDE.md`/`settings.json` edits stay intact).
