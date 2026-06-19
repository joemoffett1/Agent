<!--meta
what: The agent framework that runs this project — the roles, the start-to-finish feature flow, the reasoning level each role uses, and the commands that drive it. The live status board and the launch cards are their own pages (Status, Kickoff cards).
who: The human running the project, and any agent that needs to understand its place in the pipeline.
matters: Two human gates only — you approve the plan and you approve the merge; everything else is automated. | Roles map to git worktrees; the orchestrator never starts work on its own — it observes, reports, and acts only when told. | The chain is self-propelling: each agent writes the next one's instructions into HANDOFF.md, so launching is a one-line kickoff. | Planning and orchestration use the deepest thinking.
status: active
lastUpdated: 2026-01-01
-->

# Agent framework

How features get built here: a small fleet of role-specialised agents, each living in its own git
worktree, moving a feature from idea to production through two human checkpoints. The role
definitions live at the user level (`~/.claude/agents/`) so they're portable; this page is the
human-readable view. The live board is on the [Status](status.html) page; the launch cards (with a
generator) are on the [Kickoff cards](kickoff.html) page. See also the
[feature workflow](features.html) and the [roadmap](roadmap.html).

## The flow, start to finish {#flow}

```
        YOU set direction
              │
   Orchestrator  ── observes / recommends; starts work only when you say so
              │  briefs
              ▼
        Planner  ── deep plan into docs/features/<NAME>.md   ▶ GATE 1: you approve the plan
              │  → Next: builder
              ▼
   Builders  ── build inside src/features/<name>/ (parallel, one per worktree)
              │  → Next: reviewer
              ▼
     Reviewer  ── reviews the diff (reads), then verifies (runs tests + harness)
              │  → Next: integrator   (or → Next: builder if changes requested)
              ▼
      Integrator  ── merges to main, applies INTEGRATION.md, wires it in   ▶ GATE 2: you approve the merge
              │  → Next: orchestrator
              ▼
        merged ── worktree freed for the next feature
```

Every arrow is a `→ Next:` block the finishing agent writes into the worktree's `HANDOFF.md`, so
the next agent needs only a one-line kickoff card to pick up.

## The roles {#roles}

| Role | Lives in | Job |
|------|----------|-----|
| Orchestrator | `main` worktree | Holds project scope + milestone, briefs planners, maintains the board, recommends moves. Starts nothing on its own. |
| Planner | the feature worktree | Turns a request into a deep, numbered plan in `docs/features/<NAME>.md`. Writes no code. |
| Builder | a `feat/<name>` worktree | Builds one feature inside its own `src/features/<name>/` folder. Your parallelism. |
| Reviewer + Verifier | the review worktree | One station: reads the diff (review), then runs it (verify). Never edits. See [Reviewer](reviewer.html). |
| Integrator | `main` worktree | Merges a verified feature to `main`. The only role allowed to edit shared / Danger-Zone files. |

**How many of each:** one orchestrator; many builders (one per worktree — this is the
parallelism); one shared reviewer/verifier station; one integrator, serialised (it edits `main`,
so two at once would collide). Each repo's worktree→agent-name roster lives in its `FLEET.md`.

## Reasoning level per role {#reasoning}

All roles run on one model tier — **Opus** on Max plans, **Sonnet** on others. They differ in
thinking depth, set in each kickoff card:

| Role | Thinking |
|------|----------|
| Planner | deepest — the plan drives everything downstream |
| Orchestrator | deepest — holds the whole-project scope |
| Reviewer | careful (one notch below) |
| Integrator | careful — touches production and shared files |
| Builder | default — executes a detailed plan |
| Verifier | default — mostly empirical (build, run, observe) |

## How to call it — commands {#commands}

| Command | What it does |
|---------|--------------|
| `/feature <description>` | Runs one feature through plan → build → review → verify, pausing after the plan for your approval. |
| `/fleet` | Adopts the orchestrator: refreshes the [Status](status.html) board, checks alignment, and recommends next moves (recommends only — starts nothing). |
| `/bootstrap <idea>` | Stands the whole framework up in a brand-new repo (greenfield), starting small. |
| `/role <name>` | Adopt a role (`planner`/`builder`/`reviewer`/`verifier`/`integrator`/`orchestrator`) in the current session — overrides the auto-role. |

Opening a session in a worktree auto-adopts the right role from its branch (`main` →
orchestrator, a review branch → reviewer, `feat/*` → builder), so the commands and cards are
confirmations more than necessities.

## Launching agents {#launch}

Each role launches from a short, paste-able card; most of the time you paste a card and approve at
the two gates. The full set — plus an **interactive generator** that fills a card for the worktree
you pick — is on the [Kickoff cards](kickoff.html) page.

## Vision — the north star {#vision}

Every planner plans toward the project's `VISION.md` (repo root): what you're building, the
principles, and the current milestone. The orchestrator keeps it current; for a brand-new project
`/bootstrap` drafts it with you. This page intentionally doesn't restate it — `VISION.md` is the
source of truth, and the [Status](status.html) board shows what's in flight against it.
