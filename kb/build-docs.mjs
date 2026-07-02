/**
 * build-docs — the single command that builds the whole knowledge base.
 * Part of the framework's BASELINE KB starter (see KB-INTEGRATION.md):
 * copy to <repo>/scripts/build-docs.mjs (with shell/fleet/verification.mjs in
 * <repo>/scripts/docs/) and add to package.json:
 *   "build:docs": "node scripts/build-docs.mjs"
 *
 *   node scripts/build-docs.mjs            one-shot build
 *   node scripts/build-docs.mjs --watch    rebuild on change
 *
 * It renders the authored markdown pages in MANIFEST (missing sources become
 * "not written yet" placeholders, so a fresh repo builds before every doc
 * exists), the generated Agents pages (Status, Kickoff cards, Verification),
 * and a generated Home; copies docs/assets/img/** into the site; then
 * validates every internal cross-link. Zero dependencies.
 *
 * Run from the project root, like the other npm scripts.
 */
import { readFile, writeFile, mkdir, watch, cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  PROJECT, MANIFEST, renderPage, parseAuthored, mdToHtml, renderAuthoredSections,
  esc, SHELL_CSS, SHELL_JS,
} from './docs/shell.mjs'
import { buildFleetStatus, buildKickoff } from './docs/fleet.mjs'
import { buildVerification } from './docs/verification.mjs'

const ROOT = process.cwd()
const OUT = join(ROOT, 'docs-site')
const DOCS = join(ROOT, 'docs')

const fileToSlug = Object.fromEntries(MANIFEST.map((p) => [p.file, p.slug]))

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

async function build() {
  const t0 = Date.now()
  const buildTime = nowStamp()
  await mkdir(join(OUT, 'assets'), { recursive: true })
  await mkdir(DOCS, { recursive: true })

  const registry = {} // slug -> Set(ids)
  const pages = [] // { slug, file, html }

  /* ---- generated pages ---- */
  const home = buildHome(buildTime)
  emit('index', { kind: 'generated', source: 'the page manifest', bodyHtml: home, toolbar: false }, new Set())

  const status = buildFleetStatus(ROOT, buildTime)
  emit('status', {
    kind: 'generated', source: status.source, headExtra: status.headExtra,
    bodyHtml: status.bodyHtml, toolbar: false,
  }, status.ids)

  const kickoff = buildKickoff(ROOT, buildTime)
  emit('kickoff', {
    kind: 'generated', source: kickoff.source, headExtra: kickoff.headExtra,
    bodyHtml: kickoff.bodyHtml, scriptExtra: kickoff.scriptExtra, toolbar: false,
  }, kickoff.ids)

  const verification = buildVerification(ROOT, buildTime, OUT)
  emit('verification', {
    kind: 'generated', source: verification.source, headExtra: verification.headExtra,
    bodyHtml: verification.bodyHtml, toolbar: false,
  }, verification.ids)

  /* ---- authored pages (missing sources become placeholders) ---- */
  for (const p of MANIFEST.filter((m) => m.kind === 'authored')) {
    const srcPath = join(ROOT, p.src)
    if (!existsSync(srcPath)) {
      emit(p.slug, {
        kind: 'authored', source: p.src, toolbar: false,
        bodyHtml: `<p><em>Not written yet.</em> Create <code>${esc(p.src)}</code> (optionally starting with an <code>&lt;!--meta what/who/matters--&gt;</code> block and H2 sections) and rebuild.</p>`,
      }, new Set())
      continue
    }
    const parsed = parseAuthored(await readFile(srcPath, 'utf8'))
    const ids = new Set()
    const collectId = (id) => ids.add(id)
    const introHtml = parsed.intro ? mdToHtml(parsed.intro, collectId, () => {}) : ''
    const sectionsHtml = renderAuthoredSections(parsed, collectId, () => {})
    const startHere = parsed.meta.what
      ? { what: parsed.meta.what, who: parsed.meta.who, points: (parsed.meta.matters || '').split('|').map((s) => s.trim()).filter(Boolean) }
      : null
    emit(p.slug, {
      kind: 'authored', source: p.src, lastUpdated: parsed.meta.lastUpdated, startHere,
      legends: legendsFor(p.slug), bodyHtml: introHtml + sectionsHtml, title: parsed.title || p.title,
    }, ids)
  }

  /* ---- shared assets ---- */
  await writeFile(join(OUT, 'assets', 'shell.css'), SHELL_CSS, 'utf8')
  await writeFile(join(OUT, 'assets', 'shell.js'), SHELL_JS, 'utf8')
  // authored-doc images (docs/assets/img/**) ride into the site unchanged; reference
  // them from any authored .md as ![caption](assets/img/<file>.png)
  const IMGSRC = join(DOCS, 'assets', 'img')
  if (existsSync(IMGSRC)) await cp(IMGSRC, join(OUT, 'assets', 'img'), { recursive: true, force: true })

  /* ---- write pages + validate ---- */
  for (const pg of pages) await writeFile(join(OUT, pg.file), pg.html, 'utf8')
  const warnings = validateLinks(pages, registry)

  console.log(`build-docs: ${pages.length} pages → docs-site/  (${Date.now() - t0} ms, ${buildTime})`)
  if (warnings.length) {
    console.warn(`  ⚠ ${warnings.length} broken cross-link(s):`)
    for (const w of warnings) console.warn('    - ' + w)
  } else {
    console.log('  cross-links: all valid ✓')
  }

  function emit(slug, opts, ids) {
    const m = MANIFEST.find((x) => x.slug === slug)
    const html = renderPage({ slug, title: opts.title || m.title, buildTime, ...opts })
    registry[slug] = collectPageIds(html, ids)
    pages.push({ slug, file: m.file, html })
  }
}

/** The Home page: a card per manifest page, plus where to start. */
function buildHome(buildTime) {
  const DESC = {
    prd: 'The Program PRD — problem, solution, principles, milestone, and the features list.',
    decisions: 'Why the architecture is the way it is — invariants + tradeoffs.',
    bugs: 'Known problems, with severity and priority.',
    glossary: 'Domain and project terms.',
    features: 'The parallel-feature convention every agent follows.',
    framework: 'The agent roles, pipeline, and commands.',
    status: 'Live fleet board — every worktree and its status.',
    verification: 'Screenshot evidence packs — approve merges from here.',
    kickoff: 'Paste-able launch cards for each agent role.',
    'arch-review': 'On-demand whole-repo review — suggested architecture improvements.',
  }
  const cards = MANIFEST.filter((p) => p.slug !== 'index')
    .map((p) => `<a class="home-card" href="${p.file}"><h3>${esc(p.title)}${p.group ? ` <span class="tag">${esc(p.group)}</span>` : ''}</h3><p>${esc(DESC[p.slug] || '')}</p></a>`)
    .join('\n')
  return `<p>The ${esc(PROJECT)} knowledge base — authored pages are edited as markdown under <code>docs/</code>; generated pages rebuild from live state. Run <code>npm run build:docs</code> after editing any authored doc.</p>
<div class="home-grid">${cards}</div>`
}

/** All anchor ids actually present on a page = builder-provided ids ∪ ids in HTML. */
function collectPageIds(html, providedIds) {
  const ids = new Set(providedIds || [])
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1])
  return ids
}

function legendsFor(slug) {
  if (slug === 'bugs') return ['severity', 'criticality']
  if (slug === 'prd') return ['status', 'criticality']
  return ['criticality']
}

/** Warn on any internal link whose target page or #id does not exist. */
function validateLinks(pages, registry) {
  const warnings = []
  for (const pg of pages) {
    for (const m of pg.html.matchAll(/href="([^"]+)"/g)) {
      const href = m[1]
      if (/^(https?:|mailto:|#?$)/.test(href)) continue
      if (href.startsWith('assets/')) continue
      let page, id
      if (href.startsWith('#')) {
        page = pg.slug
        id = href.slice(1)
      } else {
        const mm = href.match(/^([\w.-]+\.html)(?:#(.+))?$/)
        if (!mm) continue
        page = fileToSlug[mm[1]]
        id = mm[2]
      }
      if (page === undefined) {
        warnings.push(`${pg.file}: link to unknown page → ${href}`)
        continue
      }
      if (id && !(registry[page] && registry[page].has(id))) {
        warnings.push(`${pg.file}: broken link → ${href}`)
      }
    }
  }
  return warnings
}

/* --------------------------------- watch ---------------------------------- */
async function watchMode() {
  await build().catch((e) => console.error(e))
  console.log('build-docs: watching docs/, src/features/, scripts/docs/ …')
  const dirs = [DOCS, join(ROOT, 'src', 'features'), join(ROOT, 'scripts', 'docs')]
  let timer = null
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => build().catch((e) => console.error(e)), 150)
  }
  await Promise.all(
    dirs.map(async (d) => {
      try {
        const w = watch(d, { recursive: true })
        for await (const _ of w) schedule()
      } catch { /* dir may not exist */ }
    }),
  )
}

if (process.argv.includes('--watch')) watchMode()
else build().catch((e) => { console.error(e); process.exit(1) })
