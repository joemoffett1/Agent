# The HTML knowledge base — baseline, per project

Every framework project ships an HTML knowledge base: authored markdown under `docs/` renders
to a cross-linked static site under `docs-site/`, alongside three generated Agents pages — the
color-coded **Status** board, the **Kickoff cards** generator, and the **Verification** page of
screenshot evidence packs the owner approves merges from. `/bootstrap` stands this up in every
new repo; this folder is the self-contained, zero-dependency starter it copies from.

## What's here

- `build-docs.mjs` — the build entry (`npm run build:docs`). Renders every authored page in the
  MANIFEST (missing sources become "not written yet" placeholders, so a fresh repo builds day
  one), the generated pages, copies `docs/assets/img/**`, and validates every internal link.
- `shell.mjs` — the shared page shell: MANIFEST (the nav), markdown renderer (headings, tables,
  task lists, images), collapsible sections, provenance banners, CSS/JS. **Set `PROJECT` at the
  top to your app's name.**
- `fleet.mjs` — the Status board + Kickoff generator (reads `git worktree list` + each
  worktree's `HANDOFF.md` at build time; fill the `ROSTER` map for custom agent names).
- `verification.mjs` — the Verification page: aggregates every worktree's
  `src/features/<name>/VERIFY/` evidence pack (merged or not), copies the screenshots into the
  site, one section per feature with its verdict.
- `verify-shots.mjs` — the zero-dep screenshot capturer the reviewer uses (drives the
  installed Edge/Chrome headless from a shot-list JSON; unique scratch profile per capture).
- `FRAMEWORK.md`, `REVIEWER.md` — the authored Agents doc pages.

## Fresh repo (what `/bootstrap` does)

1. Copy `build-docs.mjs` and `verify-shots.mjs` → `<repo>/scripts/`.
2. Copy `shell.mjs`, `fleet.mjs`, `verification.mjs` → `<repo>/scripts/docs/`.
3. Copy `FRAMEWORK.md`, `REVIEWER.md` → `<repo>/docs/agents/`.
4. Set `PROJECT` in `scripts/docs/shell.mjs`; add to `package.json`:
   `"build:docs": "node scripts/build-docs.mjs"`.
5. Run `npm run build:docs` and open `docs-site/index.html`.

House rule from then on: **after editing any authored doc, rebuild** — never leave the HTML
stale relative to the markdown. Add a MANIFEST entry (group `Features`) as each feature spec is
written.

## Repo with an existing markdown→HTML docs build

Keep your build; lift the pieces instead: add the Agents MANIFEST entries (framework / status /
verification / kickoff / reviewer), copy `fleet.mjs` + `verification.mjs` into your generator
(they only need `esc`/`mdToHtml`/`section` exports and emit `{ source, headExtra, bodyHtml,
ids }`), make sure your markdown renderer handles `![caption](src)` images, and copy
`verify-shots.mjs` into `scripts/`.

## The evidence-pack convention the pages rely on

The reviewer writes, per verified feature:

```
src/features/<name>/VERIFY/
  VERIFICATION.md   <!--meta feature/branch/date/verdict--> + per-criterion
                    expected vs. observed + pass/fail + ![caption](shot.png)
  *.png             one screenshot per acceptance criterion (verify-shots.mjs)
```

`verification.mjs` finds these across **all** git worktrees at build time — the freshest copy
of a feature wins — so evidence appears before the branch merges. Bare-filename image
references are rewritten to the copied assets automatically.
