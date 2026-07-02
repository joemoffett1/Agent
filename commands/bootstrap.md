---
description: Stand up the agent framework in a brand-new project and start its first features.
argument-hint: <one-line idea for the new app>
---

Adopt the **orchestrator** role (`~/.claude/agents/orchestrator.md`) in **greenfield bootstrap
mode** for a new project.

New project idea: **$ARGUMENTS**

Follow the orchestrator's "Greenfield bootstrap" steps, starting small:
1. **Grill me about the idea** (one question at a time, your recommended answer with each),
   then write the **Program PRD** (`docs/PRD.md`): problem, who it's for, solution, 3-5
   principles, a thin milestone 1, and a features list of 1-3 starter features.
   **Confirm it with me before continuing.**
2. Create the `docs/features/README.md` isolation convention and an empty `FLEET.md` with a
   fresh roster.
3. Stand up the HTML knowledge base from the kit's `kb/` starter (baseline — see the
   orchestrator's greenfield step 3): copy the build scripts + agent doc pages in, set
   `PROJECT`, add the `build:docs` npm script, and run it once.
4. **Set up version control and ask me the online-repo question:** `git init` if needed, add a
   `.gitignore`, make the initial commit, then ask whether this project uses an online repo
   (GitHub/GitLab/…) and, if so, wire the remote and push `main`. Push stays human-gated
   thereafter (see the orchestrator's Push policy).
5. Propose the first feature worktree(s) and, on my OK, create them
   (`git worktree add ../<dir> -b feat/<name>`).
6. Hand each first feature to the `planner` with its brief.

Don't over-scope a fresh app — get one or two features moving, then iterate via `/fleet`.
