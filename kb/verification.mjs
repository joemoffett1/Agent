/**
 * verification — the generated Verification page: aggregates each feature's
 * screenshot evidence pack into one KB page, so the owner can approve a feature
 * from evidence instead of hand-testing it.
 *
 * Convention (the review station writes the pack — see ~/.claude/agents/reviewer.md):
 *   src/features/<name>/VERIFY/VERIFICATION.md   the evidence report (meta: feature,
 *                                                branch, date, verdict)
 *   src/features/<name>/VERIFY/*.png             the screenshots it embeds, referenced
 *                                                by bare filename: ![caption](shot.png)
 *
 * Packs are collected from EVERY git worktree at build time (a feature branch does
 * not need to be merged for its evidence to appear); the freshest copy of a feature
 * wins. Images are copied to docs-site/assets/verify/<feature>/ and the markdown
 * references are rewritten to match. Pure read + string-building, like the rest of
 * the docs build; degrades to an explanatory empty state when no packs exist yet.
 */
import { existsSync, readdirSync, readFileSync, mkdirSync, copyFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { esc, mdToHtml, section } from './shell.mjs'
import { readWorktrees } from './fleet.mjs'

const IMG_RE = /\.(png|jpe?g|gif|webp|svg)$/i

/** Every feature VERIFY pack across all worktrees; freshest VERIFICATION.md wins. */
function collectPacks(root) {
  const packs = new Map() // feature -> pack
  const wts = readWorktrees(root)
  const roots = wts.length ? wts : [{ path: root, dir: '', branch: '' }]
  for (const wt of roots) {
    const featRoot = join(wt.path, 'src', 'features')
    if (!existsSync(featRoot)) continue
    for (const feat of readdirSync(featRoot, { withFileTypes: true })) {
      if (!feat.isDirectory()) continue
      const vdir = join(featRoot, feat.name, 'VERIFY')
      const mdPath = join(vdir, 'VERIFICATION.md')
      if (!existsSync(mdPath)) continue
      const mtime = statSync(mdPath).mtimeMs
      const prev = packs.get(feat.name)
      if (prev && prev.mtime >= mtime) continue
      packs.set(feat.name, {
        feature: feat.name, worktree: wt.dir, branch: wt.branch, dir: vdir, mtime,
        md: readFileSync(mdPath, 'utf8'),
        images: readdirSync(vdir).filter((f) => IMG_RE.test(f)),
      })
    }
  }
  return [...packs.values()].sort((a, b) => a.feature.localeCompare(b.feature))
}

/** Pull the `<!--meta ... -->` block + drop the H1 (the section header carries the title). */
function stripMeta(md) {
  const meta = {}
  let body = String(md).replace(/\r\n/g, '\n')
  const mm = body.match(/^<!--meta\s*([\s\S]*?)-->\s*/)
  if (mm) {
    for (const ln of mm[1].split('\n')) {
      const kv = ln.match(/^\s*([\w-]+)\s*:\s*(.*)$/)
      if (kv) meta[kv[1]] = kv[2].trim()
    }
    body = body.slice(mm[0].length)
  }
  body = body.replace(/^#\s+.*\n/, '')
  return { meta, body }
}

const VERDICT_CLASS = { verified: 'v-pass', 'partially-verified': 'v-part', failed: 'v-fail' }

const VERIFICATION_CSS = `
.page-verification .v-note{color:var(--mut);font-size:13px;margin:0 0 14px}
.page-verification .v-meta{color:var(--mut);font-size:12.5px;margin:4px 0 12px}
.page-verification .badge.v-pass{color:#fff;background:var(--now);border-color:var(--now)}
.page-verification .badge.v-part{color:#1f2328;background:var(--s3);border-color:var(--s3)}
.page-verification .badge.v-fail{color:#fff;background:var(--s1);border-color:var(--s1)}
`

export function buildVerification(root, buildTime, outDir) {
  const packs = collectPacks(root)
  const ids = new Set()
  const sections = []

  for (const p of packs) {
    // copy the pack's images into the site and point the markdown at the copies
    const assetDir = join(outDir, 'assets', 'verify', p.feature)
    mkdirSync(assetDir, { recursive: true })
    for (const img of p.images) copyFileSync(join(p.dir, img), join(assetDir, img))
    const { meta, body } = stripMeta(p.md)
    const rewritten = body.replace(
      /(!?\[[^\]]*\]\()(?!https?:|assets\/|\/)([^)]+\.(?:png|jpe?g|gif|webp|svg))\)/gi,
      (_, pre, file) => `${pre}assets/verify/${p.feature}/${file})`,
    )
    const verdict = (meta.verdict || '').toLowerCase()
    const vBadge = verdict
      ? `<span class="badge ${VERDICT_CLASS[verdict] || ''}">${esc(meta.verdict)}</span>`
      : ''
    const head = `<p class="v-meta">${vBadge}${vBadge ? ' · ' : ''}<code>${esc(p.worktree || 'main')}</code>` +
      `${p.branch ? ` · <code>${esc(p.branch)}</code>` : ''} · <code>src/features/${esc(p.feature)}/VERIFY/</code>` +
      `${meta.date ? ` · ${esc(meta.date)}` : ''}</p>`
    const id = `verify-${p.feature}`
    ids.add(id)
    sections.push(section({
      id,
      title: meta.feature || p.feature,
      crit: verdict === 'failed' ? 'core' : 'important',
      open: true,
      bodyHtml: head + mdToHtml(rewritten, (x) => ids.add(x), () => {}),
    }))
  }

  const bodyHtml = `<p class="v-note">Generated from every worktree's <code>src/features/*/VERIFY/</code> evidence pack at build time (${esc(buildTime)}) — a feature branch does not need to be merged for its evidence to appear. The review station captures one screenshot per acceptance criterion when it verifies a feature; approve or reject the merge from this page instead of hand-testing. Refresh with <code>npm run build:docs</code>. The station's manual is on the <a href="reviewer.html">Reviewer</a> page.</p>
${sections.length ? sections.join('\n') : `<p>No evidence packs yet. When the review station verifies a feature it writes <code>src/features/&lt;name&gt;/VERIFY/VERIFICATION.md</code> plus one screenshot per acceptance criterion (captured via <code>scripts/verify-shots.mjs</code>); rebuild the docs and each pack appears here as a section.</p>`}`

  return {
    source: 'src/features/*/VERIFY/ evidence packs across all git worktrees, at build time',
    headExtra: `<style>${VERIFICATION_CSS}</style>`,
    bodyHtml,
    ids,
  }
}
