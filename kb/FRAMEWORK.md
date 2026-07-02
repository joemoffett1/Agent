<!--meta
what: The agent framework that runs this project — the roles, the start-to-finish feature flow, the reasoning level each role uses, and the commands that drive it. The live status board and the launch cards are their own pages (Status, Kickoff cards).
who: The human running the project, and any agent that needs to understand its place in the pipeline.
matters: Two human gates only — you approve the plan and you approve the merge (from the Verification page's evidence pack); everything else is automated. | Roles map to git worktrees; the orchestrator never starts work on its own — it observes, reports, and acts only when told. | The chain is self-propelling: each agent writes the next one's instructions into HANDOFF.md, so launching is a one-line kickoff. | Planning and orchestration use the deepest thinking.
status: active
lastUpdated: 2026-01-01
-->

# Agent framework

How features get built here: a small fleet of role-specialised agents, each living in its own git
worktree, moving a feature from idea to production through two human checkpoints. The role
definitions live at the user level (`~/.claude/agents/`) so they're portable; this page is the
human-readable view. The live board is on the [Status](status.html) page; the launch cards (with a
generator) are on the [Kickoff cards](kickoff.html) page. See also the
[feature workflow](features.html) and the [Program PRD](prd.html).

## The flow, start to finish {#flow}

```
        YOU set direction
              │
   Orchestrator  ── observes / recommends; starts work only when you say so
              │  briefs
              ▼
        Planner  ── grills you, then writes the Feature PRD + vertical-slice
              │      issues into docs/features/<NAME>.md   ▶ GATE 1: you approve the slice list
              │  → Next: builder
              ▼
   Builders  ── build inside src/features/<name>/ (parallel, one per worktree)
              │  → Next: reviewer
              ▼
     Reviewer  ── dispatched INTO the feature's own worktree: reviews the diff (reads),
              │   verifies (tests + harness), captures the VERIFY/ evidence pack —
              │   all committed on the feature branch → the Verification page
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
| Planner | the feature worktree | Grills you, then writes the Feature PRD in `docs/features/<NAME>.md` and cuts it into vertical-slice issues. Writes no code. |
| Builder | a `feat/<name>` worktree | Builds one feature inside its own `src/features/<name>/` folder, issue by issue, test-first at the PRD's seams. Your parallelism. |
| Reviewer | the feature's own worktree (dispatched) | Dispatched into the feature being reviewed, three phases: reads the diff (review), runs it (verify), screenshots it (evidence pack → [Verification](verification.html)). Commits REVIEW.md + VERIFY/ on the feature branch so they merge with it. Never edits app code. See [Reviewer](reviewer.html). |
| Integrator | `main` worktree | Merges a verified feature to `main`. The only role allowed to edit shared / Danger-Zone files. |

**How many of each:** one orchestrator; many builders (one per worktree — this is the
parallelism); the reviewer is a role dispatched into whichever feature worktree needs it (no
standing worktree); one integrator, serialised (it edits `main`,
so two at once would collide). Each repo's worktree→agent-name roster lives in its `FLEET.md`.

## Model & reasoning {#reasoning}

The framework pins **no model and no thinking level** — role files and kickoff cards are
model-agnostic, so every agent runs on whatever the session is set to. The operator picks model
and thinking depth in the app per session (heavier for planning/orchestration, lighter for
mechanical runs), keeping credit spend entirely in their hands.

## How to call it — commands {#commands}

| Command | What it does |
|---------|--------------|
| `/grill [topic]` | A relentless one-question-at-a-time interview (with recommended answers) until a plan's decision tree is resolved. |
| `/fleet` | Adopts the orchestrator: refreshes the [Status](status.html) board, checks alignment to the Program PRD, and recommends next moves (recommends only — starts nothing). |
| `/bootstrap <idea>` | Stands the whole framework up in a brand-new repo (greenfield), starting small. |
| `/architecture-review` | On demand: scans the repo for deepening opportunities and writes the [Architecture Review](arch-review.html) page. Recommends only. |
| `/handoff [recipient]` | Every role's end-of-turn step: rewrite the feature's `HANDOFF.md` (from → to, goals, problems, pointers) + print the next kickoff card. Also compacts a long session mid-task (`/handoff same`). |
| `/role <name>` | Adopt a role (`planner`/`builder`/`reviewer`/`integrator`/`orchestrator`) in the current session — overrides the auto-role. |

Opening a session in a worktree auto-adopts the right role from its branch (`main` →
orchestrator, `feat/*` → builder), so the commands and cards are confirmations more than
necessities. To **review** a feature, open its `feat/*` worktree and invoke `/role reviewer`
(or paste a Reviewer kickoff card) — review runs in the feature's own worktree, not a
dedicated one.

## Launching agents {#launch}

Each role launches from a short, paste-able card; most of the time you paste a card and approve at
the two gates. The full set — plus an **interactive generator** that fills a card for the worktree
you pick — is on the [Kickoff cards](kickoff.html) page.

## The Program PRD — the north star {#vision}

Every planner plans toward the [Program PRD](prd.html) (`docs/PRD.md`): the problem, the
solution, the principles, the current milestone, and the features list (each entry linking its
Feature PRD). The orchestrator keeps it current; for a brand-new project `/bootstrap` grills
you and writes it with you. This page intentionally doesn't restate it — the PRD is the source
of truth, and the [Status](status.html) board shows what's in flight against it.
