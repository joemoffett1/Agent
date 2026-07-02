---
description: Compact the current work into a handoff — bring durable records current, rewrite the feature's HANDOFF.md (who left it → who picks it up, next goals, known problems, doc pointers only — never duplicated content), and print the copy/paste kickoff card for the next session. Every role runs it at the end of a completed turn; run it yourself anytime to shorten a long context window.
argument-hint: <next role, or "same" for a fresh session of the current role — optional; inferred from the pipeline if omitted>
---

Perform a handoff of the current work. Recipient: **$ARGUMENTS** (if empty, infer it: the next
role in the pipeline chain — planner → builder → reviewer → integrator → orchestrator — or
**same role, fresh session** if the work is mid-task and this handoff only exists to shorten
the context window).

If you are blocked on a decision only the human can make, say so and STOP — a handoff with an
unresolved blocker just moves the problem. Ask first; hand off after.

1. **Bring the durable records current FIRST.** Anything that belongs in a document goes there,
   not in the handoff: feature-PRD issue checkboxes + `## Progress log`, `CHANGELOG.md`,
   `INTEGRATION.md`, `.status.json`, decisions worth keeping → `docs/DECISIONS.md`. The
   handoff must never be the only home of durable information.

2. **Rewrite `src/features/<name>/HANDOFF.md`** (overwrite — it is a snapshot, not a log; git
   keeps every previous version). If the work isn't feature-scoped (orchestrator / project
   work), skip the file — project state already lives in the Program PRD + `FLEET.md` — and
   only print the card (step 3). File contents:
   - The `<!--fleet-->` header: `agent` (who is leaving it), `worktree`, `feature`, `branch`,
     `status`, `next` (the role picking up), `updated`.
   - A **From → To** line right under the title: `_<leaving agent/role> → <recipient>_`.
   - **Where it stands** — 3-6 bullets of current truth.
   - **Known problems / gotchas** — anything that will bite: a flaky test, a port in use, a
     decision that looked wrong, partial work, a surprise in the codebase.
   - **Pointers** — links/paths ONLY, never copied content: the Program PRD entry, the feature
     PRD + the specific **issue numbers** in play, relevant ADRs in `docs/DECISIONS.md`,
     `REVIEW.md` / `VERIFY/` / `INTEGRATION.md` as applicable, the harness URL.
   - **→ Next: <role>** — the recipient's goals in order, with exact commands, focus areas,
     and acceptance checks.
   - **Pertinent data** — ONLY facts that exist nowhere else and are too small to file
     elsewhere (a magic value, an env quirk, the one command that works).
   - **Open questions for the human** — only if a decision is genuinely theirs.

3. **Print the kickoff card** as the LAST thing in your reply — a short copy/paste block the
   human pastes into a fresh session: which worktree/folder to open, who the recipient is
   (role + name from the `FLEET.md` roster), and 2-3 lines pointing at this `HANDOFF.md`'s
   `→ Next` goals. For a same-role handoff, the card restarts the current role pointed at the
   same file, so the fresh session loses nothing the documents don't hold.
