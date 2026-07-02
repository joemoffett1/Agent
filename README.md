# Claude agent framework — portable kit

A planner → builder → reviewer → integrator agent framework for Claude Code, built around
git worktrees: several builder agents work in parallel with zero merge collisions, a reviewer is
dispatched into each feature's own worktree to check it (reads the diff, runs it, and captures a
**screenshot evidence pack** committed on the feature branch), and a single serialized integrator
merges to `main`. You approve exactly two
things per feature: the plan (a Feature PRD cut into vertical-slice issues, written after the
planner relentlessly interviews you), and the merge — the latter from the project knowledge
base's **Verification page**, so you approve from evidence instead of hand-testing. Builders
work test-first (red → green) at the seams the PRD pre-agrees.

Self-contained: copy this folder to any machine and install. No dependencies anywhere — the
docs build, dashboards, and screenshot capturer are all zero-dep Node scripts.

**Built for the Claude Code app, on its defaults.** The framework configures nothing the app
already handles: no model or thinking-level pins, no effort settings, no permission overrides —
you use Claude Code's own UI for model, thinking, and permission prompts, so credit spend and
approvals stay entirely in your hands. (Add your own pins to the role files if you ever want
them.) And **you never need a terminal**: agents run any commands themselves; you only chat.

## Prerequisites

- **Claude Code** (desktop app or CLI) — where you run everything; no terminal required of you.
- **Git** — the whole model is git worktrees (parallel branches checked out side by side).
- **Node.js** (any recent LTS) — runs the zero-dependency knowledge-base build and the
  screenshot capturer. The framework installs no npm packages of its own.
- **Microsoft Edge or Google Chrome** — driven headlessly by `verify-shots.mjs` to capture the
  reviewer's screenshot evidence packs. Only needed for projects with a UI to screenshot.

## Install — no terminal needed

Open this folder in the Claude Code app and paste:

> Install this agent framework: copy `agents/` into `~/.claude/agents/`, `commands/` into
> `~/.claude/commands/`, and `KICKOFF.md` + `AGENTS_FRAMEWORK.md` into `~/.claude/`. Then append
> the contents of `CLAUDE-autorole.md` to `~/.claude/CLAUDE.md` unless it already contains the
> heading "Agent framework — automatic worktree roles". Overwrite older copies; tell me what you
> copied.

Safe to re-run — it just refreshes the files.

## After installing

- **Brand-new project:** open the repo and run `/bootstrap <idea>` — it grills you about the
  idea and writes the Program PRD, creates the feature-isolation convention, **stands up the
  HTML knowledge base from `kb/`** (baseline in every framework repo), sets up git (asking once
  about an online repo), and starts the first features.
- **Existing project:** open a worktree folder as a session — it auto-adopts its role from the
  branch (`main` → orchestrator, review branch → reviewer, `feat/*` → builder). Or paste a card
  from `~/.claude/KICKOFF.md`.
- **Customizing names / scope / stack:** read `ADAPT-FOR-NEW-PROJECT.md`.

## What's in this folder

```
KICKOFF.md                    paste-able launch cards (one per role)
AGENTS_FRAMEWORK.md           full framework reference
CLAUDE-autorole.md            branch→role block the install card appends to ~/.claude/CLAUDE.md
ADAPT-FOR-NEW-PROJECT.md      how to customize for your project
agents/                       the 5 roles: orchestrator, planner, builder, reviewer, integrator
commands/                     /grill /handoff /fleet /bootstrap /role /architecture-review
kb/                           the per-project knowledge-base starter (baseline — /bootstrap
                              copies it into each new repo): zero-dep markdown→HTML doc build,
                              generated Status / Kickoff / Verification pages, and the
                              verify-shots.mjs screenshot capturer. See kb/KB-INTEGRATION.md.
```

## The 30-second tour

- **Roles** live in `~/.claude/agents/` — each file is both a spawnable subagent and a job
  description for a long-lived session. The **orchestrator** (on `main`) recommends but never
  starts work on its own; **builders** each own one `src/features/<name>/` folder and touch
  nothing outside it (shared edits are deferred to `INTEGRATION.md`); the **reviewer** is one
  station with three phases (review the diff → verify by running → capture the `VERIFY/`
  evidence pack); the **integrator** is the only role allowed to edit shared files, one feature
  at a time.
- **Handoffs** self-propel: every role ends by writing the next role's instructions into the
  feature's `HANDOFF.md` — and **ends its reply with a copy/paste kickoff card** for the next
  agent (or, if it needs your decision, asks and waits instead). You dispatch every agent
  yourself, usually by pasting the card the previous agent printed.
- **The knowledge base** renders `docs/*.md` to a cross-linked static site with three generated
  pages: **Status** (the live fleet board), **Kickoff cards** (a card generator), and
  **Verification** (every feature's screenshot evidence pack — your merge-approval gate).

Full reference: `AGENTS_FRAMEWORK.md`.
