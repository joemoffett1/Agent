---
description: Scan the whole repo for architecture-deepening opportunities and write a suggested-improvements page into the KB. On-demand only (owner or orchestrator) — never automatic, never changes code. (Adapted from mattpocock/skills "improve-codebase-architecture"; findings go to the KB, not an issue tracker.)
argument-hint: <optional area to focus on>
---

Run a whole-repo architecture review. Focus (optional): **$ARGUMENTS**

Scan the codebase for **deepening opportunities** — refactoring candidates that would turn
shallow modules into deeper ones:

- **Shallow modules** — interfaces nearly as complex as their implementations.
- **Scattered understanding** — one concept requiring navigation across many small files.
- **Poor locality** — pure functions extracted only for testability, hiding real bugs in
  their interactions.
- **Leaky seams** — tightly coupled modules breaching their boundaries.
- **Testability gaps** — untested or hard-to-test code given the current interfaces.

Apply the **deletion test**: if removing a component would *concentrate* complexity rather
than just relocate it, the component is shallow and worth deepening.

Ground every finding in the project's own vocabulary (the Program PRD `docs/PRD.md`,
`docs/GLOSSARY.md`) and check each proposal against `docs/DECISIONS.md` — if a proposal
conflicts with an existing ADR, flag the conflict explicitly rather than designing around it.

Write the report to **`docs/ARCH_REVIEW.md`** (an authored KB page — it renders at
`arch-review.html`): a `<!--meta what/who/matters/lastUpdated-->` block, a **Top
recommendation** section first, then one H2 section per candidate containing the affected
modules, the problem, the proposed deepening, the expected benefits (locality + leverage), a
before/after sketch (plain text/ASCII — the KB shell has no diagram runtime), and a strength
badge: `[s2]` Strong · `[s3]` Worth exploring · `[s4]` Speculative. Overwrite the previous
report (git history keeps old ones). Then run `npm run build:docs`.

**Recommend only — change no code.** The owner decides what becomes a feature or fix.
