# Agent framework

The single reference for the roles and the feature pipeline. Everything here is user-level, so
it applies in every worktree of a repo that uses the framework, and is portable across machines.

## The roles

Each role is defined once, in `~/.claude/agents/<role>.md`. That file is both the spawnable
subagent (the Agent/Task tool can delegate to it) and the role's job description (the `/role`
command loads it into a long-lived session).

| Role | Reads/Writes | Job |
|------|--------------|-----|
| **orchestrator** | owns VISION/ROADMAP/FLEET; delegates | Project lead / console. Holds whole-project scope, briefs+aligns planners, maintains the dashboard, sequences & dispatches work, tees up decisions for the human, bootstraps new projects. Runs on `main`. Starts nothing on its own. |
| **planner** | writes the spec, never code | Turns a request into a deep, numbered plan in `docs/features/<NAME>.md`. |
| **builder** | writes code in its own folder | Implements one feature inside `src/features/<name>/`, may refine the plan, logs progress. |
| **reviewer** | reads only | Judges the diff: scope discipline, layer integrity, plan fidelity, correctness. Never runs it. |
| **verifier** | runs only | Builds, runs tests + the dev harness, confirms behavior matches the plan. Never edits. |
| **integrator** | edits shared files | Merges a reviewed+verified feature into `main`: applies the deferred `INTEGRATION.md` edits, wires it in, folds the changelog, verifies the whole app. The ONLY role allowed in the Danger Zone. |

**Reviewer vs. verifier:** the reviewer answers *"is this code right?"* by reading; the verifier
answers *"does it actually work?"* by running. Code can pass one and fail the other, so they stay
separate.

## The pipeline

Full lifecycle: **orchestrator briefs planner -> plan -> (you approve) -> builder builds ->
reviewer reviews -> verifier verifies -> (you approve) -> integrator merges to `main`**.

- `/feature <description>` runs one feature through plan -> build -> review -> verify, pausing
  after the plan for your approval.
- `/fleet` adopts the **orchestrator**: refreshes `FLEET.md`, checks alignment to `VISION.md` +
  `ROADMAP.md`, and recommends what to advance / start / merge next (recommends only).
- `/bootstrap <idea>` stands the whole framework up in a brand-new repo (greenfield), starting small.
- `/role <name>` adopts a role in the current session (overrides the auto-role).

**Two human gates only:** you approve the plan, and you approve the merge to production.
Everything else — research, building, review, verification, status upkeep — is automated. The
orchestrator never starts or dispatches work on its own; it recommends and waits to be told.

## Worktrees & auto-roles

The framework runs on git worktrees: one repo, several working directories, each on its own
branch, so several agents work in parallel without collisions. Roles are assigned automatically
by branch (see `~/.claude/CLAUDE.md`):

- `main` -> orchestrator (the console)
- a dedicated review branch (e.g. `agents`) or a `*review*` worktree -> reviewer
- `feat/<name>` -> builder, working `src/features/<name>/`

Each repo keeps its own worktree→agent-name roster in its `FLEET.md`. To add a builder:
`git worktree add ../<dir> -b feat/<name>`.

## Fleet dashboard & how many of each role

- **Orchestrator: exactly one**, on `main` — the only project-wide role. **Builders: many** — one
  per worktree, your parallelism. **Reviewer + verifier: one each, shared, on-demand** (bursty
  work; no standing per-worktree instance). **Integrator: exactly one, serialized** — it edits
  `main` + shared files, so two at once would collide; the orchestrator dispatches it one feature
  at a time.
- **`FLEET.md`** (repo root) is the single dashboard: worktree | feature | agent name | status.
  It's a **generated snapshot** — regenerate with `/fleet`, never hand-edit the table.
- **Status is pull-based, not a polling loop.** Each agent stamps its own status in its worktree's
  `HANDOFF.md` header on every transition; `/fleet` aggregates those on demand.

## The handoff contract (self-propelling chain)

Every role **orients** on start and **hands off** on finish, so launching the next agent is a
one-line kickoff (see `~/.claude/KICKOFF.md`).

- **Orient on start:** your instructions are the `→ Next: <your role>` block in this worktree's
  `HANDOFF.md`, read with the feature spec (`docs/features/<NAME>.md`) and `VISION.md`.
- **Hand off on finish/pause:** rewrite `HANDOFF.md` — set the `<!--fleet-->` header (`status` +
  `next`) and write a precise `→ Next: <role>` block with the exact commands, focus areas, and
  acceptance checks the next agent needs.

`HANDOFF.md` template (root of each feature worktree):
```
<!--fleet
agent: Builder1
worktree: feat-payments
feature: Payments (payments)
branch: feat/payments
status: completed — pending review
next: reviewer
updated: 2026-01-01
-->

# Handoff — Payments

## Where it stands
- <what's done, what isn't, anything surprising>

## → Next: reviewer
- Review `git diff main..feat/payments`: folder-only scope, layer purity, plan fidelity, correctness.
- Then verify: run the feature's tests; start the harness; check <acceptance criteria>.
- Write findings to `src/features/payments/REVIEW.md`; set status `verified — pending integration` or `changes requested`.

## Open questions for the human
- <only if you need a decision>
```
Status vocabulary: planning · in progress · completed — pending review · in review ·
changes requested · verified — pending integration · integrating · merged · blocked · idle.
The chain: planner →next builder →next reviewer →next (pass) integrator / (fail) builder ->
integrator →next orchestrator (pick next feature).

## Memory model — three tiers, no per-agent memory needed

Subagents are stateless (each runs in a fresh context and returns one final message), so shared
state lives in **files**, not agent memory:

1. **`~/.claude/memory/`** (if you use it) — durable, cross-project facts.
2. **`docs/features/<NAME>.md`** — the feature's plan + `## Progress log`. The planner writes it;
   builders refine it. Working memory for an in-flight feature.
3. **`src/features/<name>/CHANGELOG.md` + `INTEGRATION.md`** — the feature's running log and its
   deferred-merge spec. These ride the feature branch.

## House rules every role inherits (from `docs/features/README.md`)

- Build entirely inside `src/features/<name>/`; touch nothing in the Danger Zone / shared files —
  defer those edits to `INTEGRATION.md`.
- Three-layer split: pure core (`logic.ts`) / thin view / injected adapters.
- Respect the project's scope (per `VISION.md`); add a `ROADMAP.md` entry before anything new.
- After editing an authored doc, run the project's docs build (if it has one).

## Reasoning level per role

All roles run on one model tier (Opus on Max plans, Sonnet on others). Thinking depth, set in the
kickoff cards: **planner & orchestrator** = deepest (ultrathink on Max / think-hard on standard);
**reviewer & integrator** = one notch below; **builder & verifier** = default.

## Porting to another machine

Use the portable kit (this folder's parent): run `install.ps1`/`install.sh` with a tier. It copies
`agents/`, `commands/`, `KICKOFF.md`, and this file into `~/.claude/`, and appends the auto-role
block to `~/.claude/CLAUDE.md`. The role files assume the `docs/features/` convention exists in
whatever project they run in; they degrade gracefully (the planner just creates it) if it doesn't.
