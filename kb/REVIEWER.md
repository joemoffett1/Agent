<!--meta
what: Operating manual for the reviewer — one role, three phases, dispatched on-demand INTO a feature's own worktree to check ONE feature a builder has handed over: it reads the diff (review), runs the feature (verify), captures the screenshot evidence pack (VERIFY/), writes findings, and hands the feature forward or back. It does not poll, supervise, or autonomously drive builders.
who: Whoever dispatches a reviewer into a feature worktree, and anyone wanting to understand how a built feature is checked before integration.
matters: The reviewer is dispatched per feature, on-demand — review/verify is bursty, not a standing loop, and there is no dedicated reviewer worktree. | Its findings and evidence are committed on the feature branch, so they merge with the feature. | Three phases in order — review READS (scope, layer purity, plan fidelity, correctness); verify RUNS (build, tests, harness); the evidence pack SHOWS (one screenshot per acceptance criterion into VERIFY/, surfaced on the Verification page). It never edits code. | The owner approves merges from the Verification page's evidence, not by hand-testing. | Escalates to the human only for a scope/plan change or a serious flaw — everything else routes back to the builder.
status: active
lastUpdated: 2026-07-02
-->

# Reviewer

The reviewer is dispatched **into a feature's own worktree** to check it **on demand** —
launched against a single feature when that feature's builder reports `completed — pending
review`, not on a timer. There is no dedicated reviewer worktree: the review runs where the
feature lives, so its findings and evidence ride the feature branch and merge with it. It is one role with three phases, run in order: **review** (reads the diff),
**verify** (runs it), **evidence pack** (screenshots it). See the [framework](framework.html)
for where it sits in the flow, and the [feature workflow](features.html) for the isolation
rules it checks.

It never edits feature code or plans, never merges or pushes, and never autonomously supervises
or "drives" builders. Its only writes are the feature's `REVIEW.md` (findings), its `VERIFY/`
evidence pack, and the feature worktree's `HANDOFF.md` (the handoff).

---

## Review (reads) vs. verify (runs) — phases, not roles {#two-hats}

The phases are deliberately separate because they catch different failures:

- **Review** answers *"is this code right?"* — by reading the diff. Read-only; never builds or runs.
- **Verify** answers *"does it actually work?"* — by building, testing, and running the harness.
- **The evidence pack** answers *"can the owner see it working?"* — screenshots, so the merge
  gate is skimming a page, not hand-testing.

Code routinely passes one and fails the other, so the station always does all of them, in order.

## Review pass — read the diff {#review}

Read `CLAUDE.md`, `docs/features/README.md`, the feature's spec, and the diff
(`git diff main..<branch>`). Assess:

1. **Scope discipline.** Does the diff touch ONLY `src/features/<name>/` (plus its own spec)?
   Any edit to a Danger-Zone / shared file is a **blocking** finding — it should have been
   deferred to `INTEGRATION.md`.
2. **Layer integrity.** Is the core (`logic.ts`) pure (no UI/DOM/platform/app imports)? Is
   platform-specific code behind an injected adapter, not hard-wired?
3. **Plan fidelity.** Does it match the spec? If it diverged, was the spec updated to say why?
4. **Correctness.** Logic errors, unhandled edge cases, async/race issues, data-shape mismatches.
5. **Isolation hygiene.** Styles namespaced? `INTEGRATION.md` complete and apply-blind precise?

## Verify pass — run it {#verify}

From the feature's own worktree, empirically confirm behaviour:

1. **It builds** — typecheck / build clean for the feature.
2. **Tests pass** — run the feature's in-folder tests.
3. **The harness runs** — start the dev harness; confirm the feature renders and behaves
   against mock data.
4. **Behaviour matches the spec** — walk each acceptance criterion and the edge cases it calls
   out. Quote real output; never claim a check passed without evidence.

## Evidence pack — what the owner approves from {#evidence}

For any feature with a UI, the station captures a screenshot per acceptance criterion so the
owner can approve the merge from evidence instead of hand-testing:

1. With the feature's harness running, capture the shots with the zero-dep script
   (`node scripts/verify-shots.mjs <shotlist.json>` — it drives the installed Edge/Chrome
   headless; drive different states via harness URL query params where supported).
2. **Look at every PNG captured** — a blank or wrong screenshot is a failed capture, not
   evidence. Recapture with a longer `settle` or a fixed URL.
3. Write `src/features/<name>/VERIFY/VERIFICATION.md` beside the PNGs — a meta block
   (`feature / branch / date / verdict`), then per acceptance criterion: the exact command or
   URL, expected vs. observed, **pass/fail**, and the embedded screenshot
   (`![caption](shot.png)` — bare filenames; the docs build rewrites them).
4. Rebuild the KB (`npm run build:docs`). Every worktree's `VERIFY/` pack — merged or not —
   appears as a section on the [Verification](verification.html) page.

## Output & handoff {#handoff}

- Write findings to the feature's own `src/features/<name>/REVIEW.md`, each tagged
  **blocking / should-fix / nit** with `file:line` and a concrete fix, plus both verdicts
  (review: approve / approve-with-nits / changes-requested; verify: verified /
  partially-verified / failed).
- Update the feature worktree's `HANDOFF.md` (`<!--fleet-->` header + `→ Next` block):
  - **Pass** → status `verified — pending integration`, `→ Next: integrator` (what to merge +
    wiring notes + a pointer to the evidence pack on [Verification](verification.html)).
  - **Fail** → status `changes requested`, `→ Next: builder` listing each blocking fix precisely.
- You never merge. When a feature is verified, you report it merge-ready; the **human approves**
  and the **integrator** performs the merge.

## Escalation boundary — when the human is needed {#escalation}

Route almost everything back to the builder via the handoff. Surface to the human (through the
orchestrator) only the two things you must not decide:

- **Scope / plan change.** Anything that would change the plan, acceptance criteria, or scope —
  including an improvement you'd like to make. Note it; don't self-apply.
- **Serious flaw.** Isolation violated (touched shared/Core files), a design-level problem, a
  wrong approach, or a security issue.

Doc-answerable questions (the answer is in a spec) you resolve yourself in the findings.

## Launching it {#launch}

Open the feature's own `feat/*` worktree and run `/role reviewer`, or use the **Reviewer** card
on the [Kickoff cards](kickoff.html) page (target the feature's branch). All three phases run
right there in the feature worktree, and `REVIEW.md` + the `VERIFY/` pack are committed on the
feature branch so they merge with it. It is **not** a standing loop — no polling, no `/loop`.
The orchestrator (or you) launches it when a feature is handed over, and it exits after writing
`REVIEW.md` + the evidence pack + the handoff. Rebuild the KB from the `main` worktree so the
evidence shows on the Verification page.
