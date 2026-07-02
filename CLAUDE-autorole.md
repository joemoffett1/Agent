## Agent framework — automatic worktree roles

If the current repo uses this framework (it has a root `FLEET.md` or a
`docs/features/README.md`), adopt a role automatically at session start, based on the
checked-out git branch:

- branch `main` -> **orchestrator** (project lead / console) -> `~/.claude/agents/orchestrator.md`
- branch `feat/<name>` -> **builder** -> `~/.claude/agents/builder.md`, working `src/features/<name>/`
  (the feature name comes from the branch: `feat/<name>` -> `src/features/<name>/`).

There is no dedicated review branch/worktree. **Reviewing happens inside the feature's own
`feat/<name>` worktree**: open it (it auto-adopts builder) and run `/role reviewer` — the
reviewer commits its `REVIEW.md` + `VERIFY/` evidence pack on the feature branch so they merge
with the feature (`~/.claude/agents/reviewer.md`).

Read the matching role file and operate under it for the session. Use your assigned **name**
from that repo's `FLEET.md` roster when stamping the fleet status header in your worktree's
`HANDOFF.md`. Override with `/role <name>`. To stand up the framework in a brand-new repo, run
`/bootstrap <idea>`. Full framework: `~/.claude/AGENTS_FRAMEWORK.md`.

Ignore this block in any project that doesn't use the framework.
