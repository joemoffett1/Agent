/**
 * Shared documentation shell — the single source of truth for how every page in
 * the project knowledge base looks and behaves. Part of the framework's BASELINE
 * KB starter (see KB-INTEGRATION.md): copy into <repo>/scripts/docs/shell.mjs.
 *
 * Everything the build emits is rendered through `renderPage()` here, so the nav,
 * provenance banner, "Start here" header and collapsible sections stay identical
 * across the whole KB. Add a page to MANIFEST and it appears in every nav
 * automatically. Pure string-building, zero dependencies.
 *
 * EDIT ME: set PROJECT to your app's name; grow MANIFEST as you add docs.
 */

export const PROJECT = 'My Project' // <- your project name (nav brand + page titles)

/* --------------------------------- helpers -------------------------------- */

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/* ------------------------------- the manifest ----------------------------- */
/**
 * One entry per page, in nav order. `kind` drives the provenance banner; `src`
 * is the markdown an authored page renders from (and that agents read). Missing
 * authored sources render a "not written yet" placeholder, so a fresh repo
 * builds before every doc exists. Entries with a `group` collect into a nav
 * dropdown.
 */
export const MANIFEST = [
  { slug: 'index', title: 'Home', file: 'index.html', kind: 'generated' },
  { slug: 'prd', title: 'Program PRD', file: 'prd.html', kind: 'authored', src: 'docs/PRD.md' },
  { slug: 'decisions', title: 'Decisions', file: 'decisions.html', kind: 'authored', src: 'docs/DECISIONS.md' },
  { slug: 'bugs', title: 'Bugs', file: 'bugs.html', kind: 'authored', src: 'docs/BUGS.md' },
  { slug: 'glossary', title: 'Glossary', file: 'glossary.html', kind: 'authored', src: 'docs/GLOSSARY.md' },
  // Feature specs — add one authored entry per docs/features/<NAME>.md, group: 'Features'.
  { slug: 'features', title: 'Overview', file: 'features.html', kind: 'authored', src: 'docs/features/README.md', group: 'Features' },
  // Agent-ops pages.
  { slug: 'framework', title: 'Framework', file: 'framework.html', kind: 'authored', src: 'docs/agents/FRAMEWORK.md', group: 'Agents' },
  { slug: 'status', title: 'Status', file: 'status.html', kind: 'generated', group: 'Agents' },
  { slug: 'verification', title: 'Verification', file: 'verification.html', kind: 'generated', group: 'Agents' },
  { slug: 'kickoff', title: 'Kickoff cards', file: 'kickoff.html', kind: 'generated', group: 'Agents' },
  { slug: 'reviewer', title: 'Reviewer', file: 'reviewer.html', kind: 'authored', src: 'docs/agents/REVIEWER.md', group: 'Agents' },
  { slug: 'arch-review', title: 'Architecture Review', file: 'arch-review.html', kind: 'authored', src: 'docs/ARCH_REVIEW.md', group: 'Agents' },
]

/* ------------------------------ semantic axes ----------------------------- */
const SEV = { s1: 'Critical', s2: 'High', s3: 'Medium', s4: 'Low' }
const STATUS = { now: 'Now', next: 'Next', done: 'Done', backlog: 'Backlog', planned: 'Planned' }
const CRIT = { core: 'Core', important: 'Important', peripheral: 'Peripheral' }

export const LEGENDS = {
  severity: { label: 'Severity', items: [['b-s1', 'S1 Critical'], ['b-s2', 'S2 High'], ['b-s3', 'S3 Medium'], ['b-s4', 'S4 Low']] },
  status: { label: 'Status', items: [['b-now', 'Now'], ['b-next', 'Next'], ['b-done', 'Done'], ['b-backlog', 'Backlog']] },
  criticality: { label: 'Importance', items: [['b-core', 'Core'], ['b-important', 'Important'], ['b-peripheral', 'Peripheral']] },
}

export function legendHtml(...axes) {
  return axes.map((ax) => {
    const L = LEGENDS[ax]
    if (!L) return ''
    const sw = L.items.map(([cls, label]) => `<span class="lg-item"><span class="sw ${cls}"></span>${esc(label)}</span>`).join('')
    return `<div class="legend"><span class="lg-axis">${esc(L.label)}</span>${sw}</div>`
  }).join('')
}

/** A small coloured pill for a severity / status / criticality token. */
export function badge(token) {
  const t = String(token).trim().toLowerCase()
  if (/^s[1-4]$/.test(t)) return `<span class="badge b-${t}" title="${SEV[t]} severity">${t.toUpperCase()}</span>`
  if (t in STATUS) return `<span class="badge b-${t}">${esc(STATUS[t])}</span>`
  if (t in CRIT) return `<span class="badge b-${t}">${esc(CRIT[t])}</span>`
  return `<span class="badge">${esc(token)}</span>`
}

/* ----------------------------- markdown renderer -------------------------- */
/**
 * Deliberately small: headings (with `{#id}` / `{.class}` / leading `[badge]`),
 * tables, fenced + inline code, nested lists with task checkboxes + tags,
 * blockquotes, hr, links, images (`![caption](src)`), bold/italic.
 */
function inline(s) {
  s = esc(s)
  const code = []
  s = s.replace(/`([^`]+)`/g, (_, c) => ` ${code.push(c) - 1} `) // protect code spans
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img class="shot" src="${src}" alt="${alt}" loading="lazy">`)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  s = s.replace(/ (\d+) /g, (_, i) => `<code>${code[+i]}</code>`)
  return s
}

function tagPill(tok) {
  const t = tok.trim()
  if (/^P[1-3]$/i.test(t)) return `<span class="tag pri pri-${t.toLowerCase()}">${t.toUpperCase()}</span>`
  if (/^(confirmed|proposed)$/i.test(t)) return `<span class="tag ${t.toLowerCase()}">${t.toLowerCase()}</span>`
  if (/^(now|next|later)$/i.test(t)) return `<span class="tag ph ph-${t.toLowerCase()}">${t.toLowerCase()}</span>`
  return `<span class="tag">${esc(t)}</span>`
}
function renderTaskItem(raw, flushLinks, collectId) {
  let s = raw.trim()
  let id = null
  s = s.replace(/\{#([\w-]+)\}/g, (_, x) => ((id = x), '')).trim()
  if (id && collectId) collectId(id)
  let status = null
  const cb = s.match(/^\[([ x~!])\]\s+/)
  if (cb) {
    status = { ' ': 'todo', x: 'done', '~': 'wip', '!': 'blocked' }[cb[1]]
    s = s.slice(cb[0].length)
  }
  let tagsHtml = ''
  const pipe = s.lastIndexOf(' | ')
  if (pipe >= 0) {
    const known = /^(P[1-3]|confirmed|proposed|now|next|later)$/i
    const words = s.slice(pipe + 3).trim().split(/\s+/).filter(Boolean)
    const tags = []
    let j = 0
    while (j < words.length && known.test(words[j])) tags.push(words[j++])
    const rest = words.slice(j).join(' ')
    tagsHtml = tags.length ? ' ' + tags.map(tagPill).join('') : ''
    s = s.slice(0, pipe) + (rest ? ' ' + rest : '')
  }
  const marker = status ? `<span class="cb cb-${status}" title="${status}"></span>` : ''
  return `<li${id ? ` id="${id}"` : ''}${status ? ` class="task t-${status}"` : ''}>${marker}${flushLinks(inline(s))}${tagsHtml}</li>`
}
function renderTaskList(items, flushLinks, collectId) {
  let html = ''
  const depths = []
  for (const it of items) {
    if (depths.length === 0 || it.depth > depths[depths.length - 1]) {
      html += '<ul class="tasklist">'
      depths.push(it.depth)
    } else {
      while (depths.length > 1 && it.depth < depths[depths.length - 1]) {
        html += '</ul>'
        depths.pop()
      }
    }
    html += renderTaskItem(it.raw, flushLinks, collectId)
  }
  while (depths.length > 1) {
    html += '</ul>'
    depths.pop()
  }
  return depths.length ? html + '</ul>' : html
}

function parseHeading(line) {
  const m = line.match(/^(#{1,6})\s+(.*)$/)
  if (!m) return null
  let text = m[2].trim()
  let id = null
  const cls = []
  text = text.replace(/\{#([\w-]+)\}/g, (_, i) => ((id = i), '')).trim()
  text = text.replace(/\{\.([\w-]+)\}/g, (_, c) => (cls.push(c), '')).trim()
  let badgeTok = null
  const bm = text.match(/^\[([^\]]+)\]\s+/)
  if (bm) {
    badgeTok = bm[1]
    text = text.slice(bm[0].length).trim()
  }
  if (!id) id = slugify(text)
  return { level: m[1].length, text, id, cls, badge: badgeTok }
}

function headingHtml(h, collectId) {
  if (collectId) collectId(h.id)
  const b = h.badge ? badge(h.badge) + ' ' : ''
  const cls = h.cls.length ? ` class="${h.cls.join(' ')}"` : ''
  return `<h${h.level} id="${h.id}"${cls}>${b}${inline(h.text)}</h${h.level}>`
}

/** Render a markdown fragment (no H1/H2 sectioning) to HTML. */
export function mdToHtml(md, collectId, collectLink) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0
  const flushLinks = (html) => {
    if (collectLink) {
      const re = /href="([^"]+)"/g
      let m
      while ((m = re.exec(html))) collectLink(m[1])
    }
    return html
  }
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (/^```/.test(line)) {
      const buf = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++])
      i++
      out.push(`<pre class="code"><code>${esc(buf.join('\n'))}</code></pre>`)
      continue
    }
    if (/^#{1,6}\s+/.test(line)) {
      out.push(flushLinks(headingHtml(parseHeading(line), collectId)))
      i++
      continue
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|/.test(lines[i + 1])) {
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++])
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const head = cells(rows[0])
      const body = rows.slice(2).map(cells)
      let t = '<table><thead><tr>' + head.map((c) => `<th>${flushLinks(inline(c))}</th>`).join('') + '</tr></thead><tbody>'
      for (const r of body) t += '<tr>' + r.map((c) => `<td>${flushLinks(inline(c))}</td>`).join('') + '</tr>'
      out.push(t + '</tbody></table>')
      continue
    }
    if (/^>\s?/.test(line)) {
      const buf = []
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''))
      out.push(`<blockquote>${flushLinks(inline(buf.join(' ')))}</blockquote>`)
      continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)[-*]\s+(.*)$/)
        const indent = m[1].replace(/\t/g, '  ').length
        items.push({ depth: Math.floor(indent / 2), raw: m[2] })
        i++
      }
      out.push(renderTaskList(items, flushLinks, collectId))
      continue
    }
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*\||\s*([-*]|\d+\.)\s|(-{3,}|\*{3,})\s*$)/.test(lines[i])) {
      buf.push(lines[i++])
    }
    out.push(`<p>${flushLinks(inline(buf.join(' ')))}</p>`)
  }
  return out.join('\n')
}

/**
 * Split an authored body into a meta block, an intro (before the first H2) and
 * H2-delimited sections. Each H2 becomes a collapsible section; `{.crit-*}`
 * controls its weight (peripheral collapses by default).
 */
export function parseAuthored(md) {
  let body = String(md).replace(/\r\n/g, '\n')
  const meta = {}
  const mm = body.match(/^<!--meta\s*([\s\S]*?)-->\s*/)
  if (mm) {
    for (const ln of mm[1].split('\n')) {
      const kv = ln.match(/^\s*([\w-]+)\s*:\s*(.*)$/)
      if (kv) meta[kv[1]] = kv[2].trim()
    }
    body = body.slice(mm[0].length)
  }
  const lines = body.split('\n')
  let title = ''
  let cursor = 0
  if (/^#\s+/.test(lines[0] || '')) {
    title = lines[0].replace(/^#\s+/, '').trim()
    cursor = 1
  }
  const intro = []
  const secs = []
  let cur = null
  for (let i = cursor; i < lines.length; i++) {
    const ln = lines[i]
    if (/^##\s+/.test(ln)) {
      const h = parseHeading(ln)
      cur = { ...h, lines: [] }
      secs.push(cur)
    } else if (cur) cur.lines.push(ln)
    else intro.push(ln)
  }
  return {
    meta,
    title,
    intro: intro.join('\n').trim(),
    sections: secs.map((s) => ({ title: s.text, id: s.id, cls: s.cls, badge: s.badge, md: s.lines.join('\n').trim() })),
  }
}

/* ---------------------------- section rendering --------------------------- */
export function section({ id, title, crit = 'important', badge: badgeTok, bodyHtml, open }) {
  const isOpen = open ?? crit !== 'peripheral'
  const b = badgeTok ? badge(badgeTok) + ' ' : ''
  const cr = badge(crit)
  return `<details class="sec crit-${crit}" id="${id}"${isOpen ? ' open' : ''}>
<summary><span class="sec-t">${b}${esc(title)}</span><span class="sec-crit">${cr}</span></summary>
<div class="sec-body">${bodyHtml}</div>
</details>`
}

function critFromCls(cls = []) {
  for (const c of cls) {
    const m = c.match(/^crit-(core|important|peripheral)$/)
    if (m) return m[1]
  }
  return 'important'
}

export function renderAuthoredSections(parsed, collectId, collectLink) {
  return parsed.sections
    .map((s) => {
      collectId(s.id)
      return section({
        id: s.id, title: s.title, crit: critFromCls(s.cls), badge: s.badge,
        bodyHtml: mdToHtml(s.md, collectId, collectLink),
      })
    })
    .join('\n')
}

/* ------------------------------ the page shell ---------------------------- */

function navLink(p, currentSlug) {
  const cur = p.slug === currentSlug ? ' class="cur"' : ''
  const tag = p.kind === 'generated' ? '<span class="nav-k gen" title="generated">⚙</span>' : '<span class="nav-k auth" title="authored">✍</span>'
  return `<a href="${p.file}"${cur}>${tag}${esc(p.title)}</a>`
}

function navHtml(currentSlug) {
  const ungrouped = MANIFEST.filter((p) => !p.group)
  const groups = []
  for (const p of MANIFEST) {
    if (!p.group) continue
    let g = groups.find((x) => x.name === p.group)
    if (!g) groups.push((g = { name: p.group, pages: [] }))
    g.pages.push(p)
  }
  let html = ungrouped.map((p) => navLink(p, currentSlug)).join('')
  for (const g of groups) {
    const open = g.pages.some((p) => p.slug === currentSlug) ? ' open' : ''
    html += `<details class="nav-group"${open}><summary>${esc(g.name)}</summary>` +
      `<div class="nav-group-body">${g.pages.map((p) => navLink(p, currentSlug)).join('')}</div></details>`
  }
  return html
}

function provenanceHtml({ kind, source, buildTime, lastUpdated }) {
  if (kind === 'generated') {
    return `<div class="prov gen"><b>⚙ Generated</b> ${esc(buildTime)} from ${esc(source)}. Do not hand-edit this page — change the source or the generator and rebuild (<code>npm run build:docs</code>).</div>`
  }
  return `<div class="prov auth"><b>✍ Authored</b> — edit <code>${esc(source)}</code>${lastUpdated ? `, last updated ${esc(lastUpdated)}` : ''}. Built ${esc(buildTime)}. Run <code>npm run build:docs</code> after editing.</div>`
}

function startHereHtml(sh) {
  if (!sh) return ''
  const pts = (sh.points || []).map((p) => `<li>${inline(p)}</li>`).join('')
  return `<div class="starthere">
<div class="sh-tag">Start here</div>
<p class="sh-what">${inline(sh.what || '')}</p>
${sh.who ? `<p class="sh-who"><b>For:</b> ${inline(sh.who)}</p>` : ''}
${pts ? `<div class="sh-matters"><b>What matters most</b><ul>${pts}</ul></div>` : ''}
</div>`
}

export function renderPage(opts) {
  const {
    slug, title, kind, source, buildTime, lastUpdated, startHere,
    legends = [], toolbar = true, bodyHtml = '', headExtra = '', scriptExtra = '',
  } = opts
  const toolbarHtml = toolbar
    ? `<div class="toolbar">
<button class="tb" data-action="expand">Expand all</button>
<button class="tb" data-action="collapse">Collapse all</button>
<label class="tb chk"><input type="checkbox" id="core-only"> Core only</label>
</div>`
    : ''
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(PROJECT)} docs</title>
<link rel="stylesheet" href="assets/shell.css">
${headExtra}
</head>
<body class="page-${slug}">
<nav id="nav">
<div class="brand"><a href="index.html">${esc(PROJECT)}</a><span>Knowledge base</span></div>
${navHtml(slug)}
<div class="nav-foot"><button id="theme-toggle" title="Toggle light / dark">◐ Theme</button></div>
</nav>
<main id="main">
<header class="pg-head">
<h1>${esc(title)}</h1>
${provenanceHtml({ kind, source, buildTime, lastUpdated })}
</header>
${startHereHtml(startHere)}
${legends.length ? `<div class="legends">${legendHtml(...legends)}</div>` : ''}
${toolbarHtml}
<div class="content">
${bodyHtml}
</div>
<footer class="pg-foot">${esc(PROJECT)} knowledge base · built ${esc(buildTime)} · agent rules in <code>CLAUDE.md</code></footer>
</main>
<script src="assets/shell.js" defer></script>
${scriptExtra}
</body>
</html>`
}

/* ------------------------ shared CSS + JS (written to assets/) ------------- */

export const SHELL_CSS = `
:root{
  --bg:#0d1117;--bg2:#161b22;--bg3:#1c2230;--bd:#30363d;--tx:#e6edf3;--mut:#9aa4b2;
  --acc:#7c6cf6;--link:#b3a8ff;
  --s1:#f85149;--s2:#e3873a;--s3:#d29922;--s4:#8b949e;
  --now:#3fb950;--next:#58a6ff;--done:#8b949e;--backlog:#6e7681;
  --core:#7c6cf6;--important:#58a6ff;--peripheral:#6e7681;
}
:root[data-theme=light]{
  --bg:#ffffff;--bg2:#f6f8fa;--bg3:#eef1f5;--bd:#d0d7de;--tx:#1f2328;--mut:#59636e;
  --acc:#6b4bf6;--link:#4b35c9;
}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--bg);color:var(--tx);font:15px/1.65 system-ui,Segoe UI,sans-serif;display:flex;min-height:100vh}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:26px;line-height:1.2;margin:0 0 12px}
h2{font-size:20px;line-height:1.25}h3{font-size:16px;margin:18px 0 6px}
code{background:var(--bg2);border:1px solid var(--bd);padding:.5px 5px;border-radius:4px;font-family:Consolas,monospace;font-size:.88em}
pre.code{background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:12px 14px;overflow:auto;font-size:13px;line-height:1.5}
pre.code code{background:none;border:none;padding:0}
hr{border:none;border-top:1px solid var(--bd);margin:20px 0}
blockquote{margin:10px 0;padding:8px 14px;border-left:3px solid var(--acc);background:var(--bg2);border-radius:0 6px 6px 0;color:var(--mut)}
img.shot{display:block;max-width:100%;border:1px solid var(--bd);border-radius:8px;margin:10px 0;background:var(--bg2)}
.shot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin:10px 0}
.shot-grid img.shot{margin:0;width:100%}
table{border-collapse:collapse;width:100%;margin:10px 0;font-size:14px}
th,td{border:1px solid var(--bd);padding:8px 11px;text-align:left;vertical-align:top}
th{background:var(--bg2)}
ul,ol{padding-left:22px;margin:8px 0}li{margin:3px 0}

/* nav */
#nav{position:sticky;top:0;align-self:flex-start;height:100vh;overflow:auto;width:248px;flex:none;background:var(--bg2);border-right:1px solid var(--bd);padding:16px 12px;display:flex;flex-direction:column;gap:2px}
#nav .brand{margin-bottom:12px;line-height:1.25}
#nav .brand a{font-weight:700;font-size:16px;color:var(--tx)}
#nav .brand span{display:block;color:var(--mut);font-size:12px}
#nav>a{padding:7px 10px;border-radius:7px;color:var(--tx);display:flex;align-items:center;gap:8px}
#nav>a:hover{background:var(--bg3);text-decoration:none}
#nav>a.cur{background:var(--acc);color:#fff}
#nav .nav-k{font-size:11px;opacity:.7;width:14px;text-align:center}
#nav .nav-group{display:flex;flex-direction:column}
#nav .nav-group>summary{list-style:none;cursor:pointer;padding:7px 10px;border-radius:7px;color:var(--tx);display:flex;align-items:center;gap:8px;font-weight:600}
#nav .nav-group>summary::-webkit-details-marker{display:none}
#nav .nav-group>summary::before{content:"▸";color:var(--mut);font-size:11px;transition:transform .15s}
#nav .nav-group[open]>summary::before{transform:rotate(90deg)}
#nav .nav-group>summary:hover{background:var(--bg3)}
#nav .nav-group-body{display:flex;flex-direction:column;gap:2px;margin:2px 0 4px 9px;padding-left:9px;border-left:1px solid var(--bd)}
#nav .nav-group-body a{padding:6px 10px;border-radius:7px;color:var(--tx);display:flex;align-items:center;gap:8px;font-size:14px}
#nav .nav-group-body a:hover{background:var(--bg3);text-decoration:none}
#nav .nav-group-body a.cur{background:var(--acc);color:#fff}
#nav .nav-group-body .nav-k{font-size:11px;opacity:.7;width:14px;text-align:center}
.nav-foot{margin-top:auto;padding-top:12px}
#theme-toggle{width:100%;background:var(--bg3);border:1px solid var(--bd);color:var(--tx);border-radius:7px;padding:7px;cursor:pointer}
#theme-toggle:hover{filter:brightness(1.15)}

/* main */
#main{flex:1;min-width:0;padding:26px 36px;max-width:1060px}
.pg-head{margin-bottom:14px}
.prov{font-size:13px;border:1px solid var(--bd);border-radius:8px;padding:9px 12px;color:var(--mut)}
.prov.gen{background:rgba(124,108,246,.10);border-color:var(--acc)}
.prov.auth{background:rgba(63,185,80,.10);border-color:var(--now)}

/* start here */
.starthere{background:var(--bg2);border:1px solid var(--bd);border-left:4px solid var(--acc);border-radius:10px;padding:14px 16px;margin:16px 0}
.sh-tag{display:inline-block;background:var(--acc);color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;border-radius:5px;margin-bottom:8px}
.sh-what{font-size:16px;margin:4px 0}
.sh-who{color:var(--mut);font-size:14px;margin:4px 0}
.sh-matters{margin-top:8px}.sh-matters ul{margin:4px 0}

/* legends */
.legends{display:flex;flex-direction:column;gap:6px;margin:14px 0}
.legend{display:flex;flex-wrap:wrap;gap:12px;align-items:center;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:8px 12px;font-size:12.5px}
.lg-axis{font-weight:700;color:var(--mut);margin-right:4px}
.lg-item{display:inline-flex;align-items:center;gap:6px;color:var(--mut)}
.sw{width:12px;height:12px;border-radius:3px;border:1px solid;display:inline-block}
.sw.b-s1{background:var(--s1)}.sw.b-s2{background:var(--s2)}.sw.b-s3{background:var(--s3)}.sw.b-s4{background:var(--s4)}
.sw.b-now{background:var(--now)}.sw.b-next{background:var(--next)}.sw.b-done{background:var(--done)}.sw.b-backlog{background:var(--backlog)}
.sw.b-core{background:var(--core)}.sw.b-important{background:var(--important)}.sw.b-peripheral{background:var(--peripheral)}

/* toolbar */
.toolbar{display:flex;gap:8px;align-items:center;margin:6px 0 16px;flex-wrap:wrap}
.tb{background:var(--bg2);border:1px solid var(--bd);color:var(--tx);border-radius:7px;padding:5px 11px;cursor:pointer;font-size:13px}
.tb:hover{filter:brightness(1.15)}
.tb.chk{display:inline-flex;align-items:center;gap:6px}

/* badges */
.badge{display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:20px;border:1px solid;vertical-align:middle;white-space:nowrap}
.b-s1{color:#fff;background:var(--s1);border-color:var(--s1)}
.b-s2{color:#fff;background:var(--s2);border-color:var(--s2)}
.b-s3{color:#1f2328;background:var(--s3);border-color:var(--s3)}
.b-s4{color:var(--tx);background:transparent;border-color:var(--s4)}
.b-now{color:#fff;background:var(--now);border-color:var(--now)}
.b-next{color:#fff;background:var(--next);border-color:var(--next)}
.b-done{color:var(--tx);background:transparent;border-color:var(--done)}
.b-backlog{color:var(--mut);background:transparent;border-color:var(--backlog)}
.b-core{color:#fff;background:var(--core);border-color:var(--core)}
.b-important{color:var(--tx);background:transparent;border-color:var(--important)}
.b-peripheral{color:var(--mut);background:transparent;border-color:var(--peripheral)}

/* collapsible sections */
details.sec{border:1px solid var(--bd);border-radius:10px;margin:10px 0;background:var(--bg2);overflow:hidden}
details.sec>summary{list-style:none;cursor:pointer;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:600;font-size:17px}
details.sec>summary::-webkit-details-marker{display:none}
details.sec>summary:hover{background:var(--bg3)}
details.sec>summary::before{content:"▸";color:var(--mut);font-size:13px;margin-right:4px;transition:transform .15s}
details.sec[open]>summary::before{transform:rotate(90deg)}
.sec-t{flex:1}
.sec-crit{flex:none}
.sec-body{padding:4px 16px 16px;border-top:1px solid var(--bd)}
details.sec.crit-core{border-left:4px solid var(--core)}
details.sec.crit-important{border-left:4px solid var(--important)}
details.sec.crit-peripheral{border-left:4px solid var(--peripheral);opacity:.92}
body.coreonly details.sec:not(.crit-core){display:none}

/* task lists */
ul.tasklist{padding-left:22px;margin:6px 0}
ul.tasklist li{margin:3px 0}
ul.tasklist li.task{list-style:none}
.cb{display:inline-block;width:13px;height:13px;border:1.5px solid var(--mut);border-radius:3px;margin-right:8px;vertical-align:-2px;position:relative;flex:none}
.cb-todo{background:transparent}
.cb-done{background:var(--now);border-color:var(--now)}
.cb-done::after{content:"✓";color:#fff;font-size:10px;line-height:1;position:absolute;left:1.5px;top:1px}
.cb-wip{background:var(--s3);border-color:var(--s3)}
.cb-wip::after{content:"";position:absolute;left:3px;top:5px;width:7px;height:2px;background:#1f2328;border-radius:1px}
.cb-blocked{background:var(--s1);border-color:var(--s1)}
.cb-blocked::after{content:"!";color:#fff;font-size:10px;font-weight:700;line-height:1;position:absolute;left:4px;top:1px}
li.t-done>.cb+*,li.t-done{color:var(--mut)}
.tag{display:inline-block;font-size:10.5px;font-weight:600;padding:0 6px;border-radius:10px;border:1px solid var(--bd);color:var(--mut);margin-left:4px;vertical-align:1px;white-space:nowrap}
.tag.pri-p1{border-color:var(--s1);color:var(--s1)}
.tag.pri-p2{border-color:var(--s3);color:var(--s3)}
.tag.pri-p3{border-color:var(--bd);color:var(--mut)}
.tag.confirmed{border-color:var(--now);color:var(--now)}
.tag.proposed{border-color:var(--next);color:var(--next);border-style:dashed}
.tag.ph-now{border-color:var(--now);color:var(--now)}
.tag.ph-next{border-color:var(--next);color:var(--next)}
.tag.ph-later{border-color:var(--bd);color:var(--mut)}

/* home cards */
.home-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin:14px 0}
.home-card{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:14px 16px}
.home-card h3{margin:0 0 6px}
.home-card p{color:var(--mut);font-size:13.5px;margin:0}

/* footer */
.pg-foot{margin-top:36px;padding-top:14px;border-top:1px solid var(--bd);color:var(--mut);font-size:12.5px}
@media(max-width:820px){#nav{position:static;width:100%;height:auto;flex-direction:row;flex-wrap:wrap}#main{padding:18px}}
`

export const SHELL_JS = `
(function(){
  var KEY='kb-docs-theme';
  var saved=localStorage.getItem(KEY); if(saved) document.documentElement.setAttribute('data-theme',saved);
  var tt=document.getElementById('theme-toggle');
  if(tt) tt.addEventListener('click',function(){
    var cur=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme',cur); localStorage.setItem(KEY,cur);
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-action]'); if(!b) return;
    var open=b.getAttribute('data-action')==='expand';
    document.querySelectorAll('details.sec').forEach(function(d){d.open=open;});
  });
  var co=document.getElementById('core-only');
  if(co) co.addEventListener('change',function(){document.body.classList.toggle('coreonly',co.checked);});
  function openHash(){var h=location.hash.slice(1); if(!h) return; var el=document.getElementById(h);
    while(el){ if(el.tagName==='DETAILS') el.open=true; el=el.parentElement; }
    var t=document.getElementById(h); if(t) t.scrollIntoView();}
  window.addEventListener('hashchange',openHash); openHash();
})();
`
