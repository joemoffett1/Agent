---
description: Stand up the agent framework in a brand-new project and start its first features.
argument-hint: <one-line idea for the new app>
---

Adopt the **orchestrator** role (`~/.claude/agents/orchestrator.md`) in **greenfield bootstrap
mode** for a new project.

New project idea: **$ARGUMENTS**

Follow the orchestrator's "Greenfield bootstrap" steps, starting small:
1. Draft a one-page `VISION.md` with me (problem, who it's for, 3-5 principles, a thin
   milestone 1). **Confirm it with me before continuing.**
2. Seed `docs/ROADMAP.md` with milestone 1 as 1-3 starter features.
3. Create the `docs/features/README.md` isolation convention and an empty `FLEET.md` with a
   fresh roster.
4. Propose the first feature worktree(s) and, on my OK, create them
   (`git worktree add ../<dir> -b feat/<name>`).
5. Hand each first feature to the `planner` with its brief.

Don't over-scope a fresh app — get one or two features moving, then iterate via `/fleet`.
