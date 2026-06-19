# Customizing the kit for your project

The kit is project-agnostic — the roles describe *how* to work (plan → build → review → verify →
integrate, with feature-folder isolation), not *what* you're building. Almost everything
project-specific lives in three files **in your repo**, not in the kit.

## Easiest: let the orchestrator set it up
Install the kit, open your repo, and run:
```
/bootstrap <one-line idea for your app>
```
The orchestrator drafts a `VISION.md`, seeds `docs/ROADMAP.md`, creates the
`docs/features/README.md` isolation convention + an empty `FLEET.md` roster, and proposes the
first feature worktree(s). This is the intended way to start.

## The per-project files (these are yours, created once)
- **`VISION.md`** (repo root) — your north star: what you're building, principles, and the current
  milestone. Every planner plans toward it. Created by `/bootstrap`.
- **`FLEET.md`** (repo root) — your live dashboard + the worktree→agent-name roster (e.g.
  `feat-payments` → `Builder1`). Name the agents whatever you like.
- **`docs/features/README.md`** — the isolation convention for your repo: the feature-folder rule,
  the layer split, and your repo's **Danger Zone** list (the shared files only the integrator may
  edit). Adjust the Danger Zone list to your codebase.

## Naming the agents
The kit uses generic names (Orchestrator, Reviewer, Builder1, Builder2, …) derived automatically.
To use your own names, set them in your repo's `FLEET.md` roster — and, if you use the HTML
dashboard, in the `ROSTER` map at the top of `scripts/docs/fleet.mjs`.

## Conventions you can tune
The role files assume a TypeScript/web-style layout (`src/features/<name>/`, a pure `logic.ts`
core, a thin view, injected adapters, a dev harness, in-folder tests). If your stack differs,
edit the installed role files in `~/.claude/agents/` to match your structure — the *methodology*
(isolation, deferred shared edits via `INTEGRATION.md`, the handoff chain, the two human gates)
carries over unchanged.

## Worktrees
Create one per parallel feature:
```
git worktree add ../<dir> -b feat/<name>
```
Open each `../<dir>` as its own session; it auto-adopts the builder role from its branch
(`main` → orchestrator, a review branch → reviewer, `feat/*` → builder).
