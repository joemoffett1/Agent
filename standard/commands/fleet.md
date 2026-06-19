---
description: Run a fleet cycle — adopt the orchestrator, refresh the FLEET.md dashboard, and report project state + what needs your decision.
---

Adopt the **orchestrator** role (`~/.claude/agents/orchestrator.md`) and run one **fleet
cycle** for this project. Per that role:

1. **Regenerate `FLEET.md`** from live worktree state — `git worktree list`, each branch's
   `git rev-list --count main..<branch>`, the agent name from the FLEET.md roster, the feature,
   and the `status:` from each worktree's `HANDOFF.md` `<!--fleet-->` header (infer from git if
   absent). Rewrite the table; update the `Last regenerated` date; keep roster + vocabulary.
2. **Assess alignment** against `VISION.md` + `docs/ROADMAP.md` — flag scope drift / duplicated
   effort / out-of-scope work.
3. **Sequence & recommend** — what's awaiting my gate (plans/merges to approve), what's ready to
   advance (completed→review, verified→integrate), what a free builder should start next, and
   any blockers. One integrator at a time; reviewer/verifier are shared.
4. **Report** the refreshed table + a short "state of the project," and recommend next moves.
   **Recommend only — do not start, dispatch, or merge anything unless I tell you to.** Do not
   edit feature code or Danger-Zone files.
