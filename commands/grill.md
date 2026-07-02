---
description: Get relentlessly interviewed about a plan, design, or PRD until every branch of the decision tree is resolved. (Adapted from mattpocock/skills "grilling".)
argument-hint: <topic or plan to grill — optional, defaults to the current discussion>
---

Run a grilling session on: **$ARGUMENTS** (if empty, grill the current discussion).

Interview me relentlessly about every aspect of this plan until we reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between
decisions one by one.

Rules:
- Ask **one question at a time** and wait for my answer — multiple questions at once are
  bewildering.
- With every question, state **your recommended answer** and why.
- If a question can be answered by exploring the codebase or the project docs (the Program PRD
  `docs/PRD.md`, feature PRDs, `docs/DECISIONS.md`, the KB), **explore instead of asking**.
- Keep going until the decision tree has no unresolved branches. Then summarize every decision
  reached as a numbered list and say which document each belongs in (Program PRD, feature PRD,
  or `docs/DECISIONS.md`) — and offer to write them there.
