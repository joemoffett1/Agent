---
description: Kick off a new feature through the planner -> builder -> reviewer -> verifier pipeline.
argument-hint: <feature description>
---

You are orchestrating the feature pipeline for this project.

Feature request: **$ARGUMENTS**

Run the pipeline, pausing for the operator's approval at each gate:

1. **Plan.** Delegate to the `planner` agent to produce or extend the feature spec in
   `docs/features/<NAME>.md` — deep, numbered, isolation-respecting. Show me the plan.
   → **STOP for my approval before any code is written.**

2. **Build.** On approval, the feature is built by the `builder` working in its own worktree
   / branch (`feat/<name>`, folder `src/features/<name>/`). If building from here, delegate
   to the `builder` agent. Builders follow the plan, may refine it, and log progress.

3. **Review.** Delegate to the `reviewer` agent — reads the diff, checks scope / house-rules
   / correctness; does NOT run it. Show the findings.

4. **Verify.** Delegate to the `verifier` agent — builds, runs tests + harness, confirms
   behavior. Show the evidence.

5. **Report.** Summarize: what shipped, what's deferred to `INTEGRATION.md`, the review
   verdict, the verify result, and what's left before the integration merge into `main`.

See `~/.claude/AGENTS_FRAMEWORK.md` for the full framework and the worktree map. If no
`<NAME>` is obvious from the request, ask me for the feature's short name first.
