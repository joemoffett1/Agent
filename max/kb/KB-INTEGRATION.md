# Optional: the HTML knowledge-base pages

The framework runs fine with **no** HTML. These files add the human-readable **Agents** pages
(Framework, Status, Kickoff cards, Reviewer) to a repo that already has a markdown→HTML doc
build like a reference build (`scripts/build-docs.mjs` + `scripts/docs/shell.mjs` with a
`MANIFEST`). If your repo has no such build, skip this — or lift `fleet.mjs` into any static-site
generator you use.

## What's here
- `FRAMEWORK.md`, `REVIEWER.md` — authored doc pages (flow/roles/reasoning/commands/vision; the
  reviewer+verifier station).
- `fleet.mjs` — a generator that reads `git worktree list` + each worktree's `HANDOFF.md` at
  build time and emits the **color-coded Status board** and the **interactive Kickoff generator**.

## Wiring it into a reference build
1. Copy `FRAMEWORK.md` and `REVIEWER.md` into your repo's `docs/agents/`.
2. Copy `fleet.mjs` into your repo's `scripts/docs/`.
3. In `scripts/docs/shell.mjs`, add to `MANIFEST` (an "Agents" group):
   ```js
   { slug: 'framework', title: 'Framework', file: 'framework.html', kind: 'authored', src: 'docs/agents/FRAMEWORK.md', group: 'Agents' },
   { slug: 'status',    title: 'Status',    file: 'status.html',    kind: 'generated', group: 'Agents' },
   { slug: 'kickoff',   title: 'Kickoff cards', file: 'kickoff.html', kind: 'generated', group: 'Agents' },
   { slug: 'reviewer',  title: 'Reviewer',  file: 'reviewer.html',  kind: 'authored', src: 'docs/agents/REVIEWER.md', group: 'Agents' },
   ```
4. In `scripts/build-docs.mjs`:
   ```js
   import { buildFleetStatus, buildKickoff } from './docs/fleet.mjs'
   // ...inside build(), after the generated pages:
   const status = buildFleetStatus(ROOT, buildTime)
   emit('status', { kind: 'generated', source: status.source, headExtra: status.headExtra, bodyHtml: status.bodyHtml, toolbar: false }, status.ids)
   const kickoff = buildKickoff(ROOT, buildTime)
   emit('kickoff', { kind: 'generated', source: kickoff.source, headExtra: kickoff.headExtra, bodyHtml: kickoff.bodyHtml, scriptExtra: kickoff.scriptExtra, toolbar: false }, kickoff.ids)
   ```
5. Run `npm run build:docs`. The pages appear under the Agents nav group.

`fleet.mjs` only assumes `esc` is exported from your `shell.mjs`. Adjust the `ROSTER` map at the
top of `fleet.mjs` to your worktree dir → agent-name mapping.
