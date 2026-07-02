# Agent framework

The single reference for the roles and the feature pipeline. Everything here is user-level, so
it applies in every worktree of a repo that uses the framework, and is portable across machines.

## The roles

Each role is defined once, in `~/.claude/agents/<role>.md`. That file is both the spawnable
subagent (the Agent/Task tool can delegate to it) and the role's job description (the `/role`
command loads it into a long-lived session).

| Role | Reads/Writes | Job |
|------|--------------|-----|
| **orchestrator** | owns the Program PRD + FLEET; delegates | Project lead / console. Holds whole-project scope, briefs+aligns planners, maintains the dashboard, sequences & dispatches work, tees up decisions for the human, bootstraps new projects. Runs on `main`. Starts nothing on its own. |
| **planner** | writes the PRD, never code | Grills the human, then writes the Feature PRD in `docs/features/<NAME>.md` and cuts it into vertical-slice issues (detailed plans, seams, blocked-by). |
| **builder** | writes code in its own folder | Implements one feature inside `src/features/<name>/`, issue by issue, test-first at the PRD's seams; may refine the plan; logs progress. |
| **reviewer** | reads + runs; edits no code | The review station, one dispatch, three phases: reviews the diff (scope discipline, layer integrity, plan fidelity, correctness), verifies it works (build, tests, dev harness), and captures the screenshot **evidence pack** into `src/features/<name>/VERIFY/` for the KB's Verification page. |
| **integrator** | edits shared files | Merges a reviewed+verified feature into `main`: applies the deferred `INTEGRATION.md` edits, wires it in, folds the changelog, verifies the whole app. The ONLY role allowed in the Danger Zone. |

**Review vs. verify are phases, not roles.** The review phase answers *"is this code right?"*
by reading; the verify phase answers *"does it actually work?"* by running (code routinely
passes one and fails the other, so the station always does both, in order). The evidence-pack
phase turns the verify result into screenshots the owner approves from — the merge gate is
"skim the Verification page," not "hand-test the feature."

## The pipeline

Full lifecycle: **orchestrator grills you and writes/updates the Program PRD -> planner grills
you and writes the Feature PRD + vertical-slice issues -> (you approve the slice list) ->
builder builds issue-by-issue, test-first at the PRD's seams -> reviewer reviews + verifies +
captures evidence -> (you approve from the Verification page) -> integrator merges to `main`**.

- `/grill [topic]` runs a relentless one-question-at-a-time interview (with recommended
  answers) until a plan's decision tree is resolved - the same behavior the orchestrator and
  planner apply automatically before writing any PRD.
- `/fleet` adopts the **orchestrator**: refreshes `FLEET.md`, checks alignment to the Program
  PRD, and recommends what to advance / start / merge next (recommends only).
- `/bootstrap <idea>` stands the whole framework up in a brand-new repo (greenfield), starting small.
- `/architecture-review` (on demand only) scans the repo for deepening opportunities and writes
  a suggested-improvements page into the KB - recommendations only, no code changes.
- `/handoff [recipient|same]` compacts the current work into the feature's `HANDOFF.md` + the
  next kickoff card — every role's end-of-turn step, and a mid-task context-window compactor.
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
  per worktree, your parallelism. **Reviewer: one, shared, on-demand** (the review station —
  review + verify + evidence pack in one dispatch; bursty work, no standing per-worktree
  instance). **Integrator: exactly one, serialized** — it edits `main` + shared files, so two at
  once would collide; the orchestrator dispatches it one feature at a time.
- **`FLEET.md`** (repo root) is the single dashboard: worktree | feature | agent name | status.
  It's a **generated snapshot** — regenerate with `/fleet`, never hand-edit the table.
- **Status is pull-based, not a polling loop.** Each agent stamps its own status in its worktree's
  `HANDOFF.md` header on every transition; `/fleet` aggregates those on demand.

## The handoff contract (self-propelling chain)

Every role **orients** on start and **hands off** on finish, so launching the next agent is a
one-line kickoff (see `~/.claude/KICKOFF.md`).

- **Orient on start:** your instructions are the `→ Next: <your role>` block in this worktree's
  `HANDOFF.md`, read with the Feature PRD (`docs/features/<NAME>.md`) and the Program PRD.
- **Hand off on finish/pause:** rewrite `HANDOFF.md` — set the `<!--fleet-->` header (`status` +
  `next`) and write a precise `→ Next: <role>` block with the exact commands, focus areas, and
  acceptance checks the next agent needs.

**End-of-turn rule — the human dispatches every agent.** No agent starts another agent. When
your work is done and the next step belongs to another role, finish by running the
**`/handoff` skill**: bring the durable records current (PRD issues/progress log, CHANGELOG,
INTEGRATION.md, .status.json — the handoff is never the only home of information), rewrite the
feature's `HANDOFF.md` (from → to, where it stands, known problems, doc POINTERS rather than
copies), and END your final message with a short **copy/paste kickoff card** — which
worktree/folder to open, who picks up, plus 2-3 lines pointing at the `→ Next` goals — then
set your status to its completed value and stop. If you need a decision or input instead, ask
and **wait — no card** until the blocker is resolved. (Most of the time the human just pastes
the card the previous agent printed.) `/handoff` also works **mid-task, anytime**, to compact
a long context window: it hands off to a fresh session of the SAME role, losing nothing the
documents don't hold.


`HANDOFF.md` template (lives INSIDE the feature folder — `src/features/<name>/HANDOFF.md` — so
it rides the branch, stays within the builder's allowed scope, and can never collide at merge):
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
_Builder1 → Reviewer_

## Where it stands
- <what's done, what isn't, anything surprising>

## Known problems / gotchas
- <anything that will bite: flaky test, port in use, partial work, a surprise>

## Pointers (paths/links only — no copied content)
- <feature PRD + issue numbers in play · ADRs · REVIEW.md / VERIFY/ / INTEGRATION.md · harness URL>

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
2. **`docs/features/<NAME>.md`** — the Feature PRD: definition (problem / solution / stories /
   decisions / seams) + the vertical-slice issues + `## Progress log`. The planner writes it;
   builders refine it. Working memory for an in-flight feature.
3. **`src/features/<name>/CHANGELOG.md` + `INTEGRATION.md`** — the feature's running log and its
   deferred-merge spec. These ride the feature branch.

## House rules every role inherits (from `docs/features/README.md`)

- Build entirely inside `src/features/<name>/`; touch nothing in the Danger Zone / shared files —
  defer those edits to `INTEGRATION.md`.
- Three-layer split: pure core (`logic.ts`) / thin view / injected adapters.
- Respect the project's scope (per the Program PRD); anything new goes on its features list first.
- **The HTML knowledge base is baseline.** Every framework project ships the docs KB (the kit's
  `kb/` starter: `build:docs` renders `docs/*.md` → `docs-site/`, plus the generated Status,
  Kickoff, and Verification pages). After editing any authored doc, run `npm run build:docs` —
  never leave the HTML stale. The owner approves merges from the Verification page's screenshot
  evidence packs (`src/features/<name>/VERIFY/`, captured by the review station with
  `scripts/verify-shots.mjs`) instead of hand-testing.

## Model & reasoning — set by you, in-app

The framework pins **no model and no thinking level**: role files carry no `model:` frontmatter
and the kickoff cards carry no thinking directives, so every agent runs on whatever the session
is set to. Pick the model and thinking depth in the app per session (or add your own pins to the
role files) — heavier for planning/orchestration, lighter for mechanical runs, entirely your
call and your credit budget.

## Porting to another machine

Use the portable kit — no terminal needed: open the kit folder in the Claude Code app and use
the install card in its `README.md`. It copies `agents/`, `commands/`, `KICKOFF.md`, and this
file into `~/.claude/`, and appends the auto-role block to `~/.claude/CLAUDE.md`. The kit's `kb/` folder is the per-project KB starter — `/bootstrap`
copies it into each new repo (see `kb/KB-INTEGRATION.md`). The role files assume the
`docs/features/` convention exists in whatever project they run in; they degrade gracefully (the
planner just creates it) if it doesn't.
