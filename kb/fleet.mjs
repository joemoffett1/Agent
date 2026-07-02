/**
 * fleet — generated Agents pages: the Status board and the Kickoff-card generator.
 *
 * Both read the live git worktrees at build time (so a docs rebuild / `/fleet` refreshes them),
 * then emit static HTML. The Status board is colour-coded server-side; the Kickoff page ships the
 * worktree list + card templates to a small client-side generator so you can fill a card for
 * whichever worktree you pick.
 *
 * Pure string-building, plus read-only git via execSync. Degrades gracefully (empty board, no
 * targets) if git or the worktrees aren't available.
 *
 * Agent names are derived generically (Orchestrator / Reviewer / Builder1..n). To use custom
 * names, fill the ROSTER map below: { '<worktree-dir>': { agent, role } }.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { esc } from './shell.mjs'

/* Optional custom names per worktree dir. Leave empty to auto-name. */
const ROSTER = {
  // 'main-worktree-dir': { agent: 'Lead', role: 'orchestrator' },
  // 'feat-payments':     { agent: 'Builder1', role: 'builder' },
}

function sh(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

/** Read all git worktrees + their branch, ahead-count, agent, feature and fleet status. */
export function readWorktrees(root) {
  const out = sh('git worktree list --porcelain', root)
  if (!out) return []
  const wts = []
  for (const block of out.split(/\n\n+/)) {
    const pathM = block.match(/^worktree (.+)$/m)
    if (!pathM) continue
    const path = pathM[1].trim()
    const dir = path.replace(/\\/g, '/').split('/').filter(Boolean).pop()
    const branchM = block.match(/^branch refs\/heads\/(.+)$/m)
    const branch = branchM ? branchM[1].trim() : (/^detached$/m.test(block) ? '(detached)' : '(none)')
    const roster = ROSTER[dir] || {}
    let role = roster.role
    if (!role) {
      role = branch === 'main' ? 'orchestrator'
        : (/review/.test(branch) || branch === 'agents') ? 'reviewer'
        : branch.startsWith('feat/') ? 'builder' : 'builder'
    }
    const feature = branch.startsWith('feat/') ? branch.slice(5)
      : role === 'orchestrator' ? 'orchestration + integration'
      : role === 'reviewer' ? 'review / verify' : branch
    let ahead = ''
    if (branch && branch !== 'main' && !branch.startsWith('(')) ahead = sh(`git rev-list --count main..${branch}`, root)

    // uncommitted work in the worktree (staged + unstaged + untracked), as a file count
    const dirty = sh('git status --porcelain', path).split('\n').filter(Boolean).length

    // status: prefer the HANDOFF.md fleet header; otherwise infer (and mark it).
    // The handoff lives INSIDE the feature folder (rides the branch); root copy is a fallback.
    let status = '', inferred = false
    let hp = join(path, 'HANDOFF.md')
    const featRoot = join(path, 'src', 'features')
    if (existsSync(featRoot)) {
      for (const d of readdirSync(featRoot, { withFileTypes: true })) {
        if (d.isDirectory() && existsSync(join(featRoot, d.name, 'HANDOFF.md'))) {
          hp = join(featRoot, d.name, 'HANDOFF.md')
          break
        }
      }
    }
    const hasHandoff = existsSync(hp)
    if (hasHandoff) {
      const fm = readFileSync(hp, 'utf8').match(/<!--fleet([\s\S]*?)-->/)
      if (fm) {
        const sm = fm[1].match(/status:\s*(.+)/)
        if (sm) status = sm[1].trim()
      }
    }
    if (!status) {
      inferred = true
      if (role === 'orchestrator' || role === 'reviewer') status = 'idle'
      else if (hasHandoff) status = 'completed — pending review'
      else if (ahead && +ahead > 0) status = 'in progress'
      else status = 'idle'
    }
    wts.push({ path, dir, branch, role, agent: roster.agent || '', feature, ahead, dirty, status, inferred })
  }
  const rank = { orchestrator: 0, builder: 1, reviewer: 2 }
  wts.sort((a, b) => (rank[a.role] ?? 9) - (rank[b.role] ?? 9) || a.dir.localeCompare(b.dir))
  // Auto-name anything the roster didn't: Orchestrator / Reviewer / Builder1..n.
  let b = 0
  for (const w of wts) {
    if (w.agent) continue
    if (w.role === 'builder') w.agent = 'Builder' + (++b)
    else w.agent = w.role[0].toUpperCase() + w.role.slice(1)
  }
  return wts
}

/* status → colour (substring match, robust to em-dash / "(inferred)" variants). */
const STATUS_VOCAB = [
  'planning', 'in progress', 'completed — pending review', 'in review', 'changes requested',
  'verified — pending integration', 'integrating', 'merged', 'blocked', 'idle',
]
function statusColor(s) {
  const t = String(s).toLowerCase()
  if (t.includes('merged')) return '#3fb950'
  if (t.includes('blocked') || t.includes('changes requested')) return '#f85149'
  if (t.includes('pending integration') || t.includes('verified')) return '#39c5cf'
  if (t.includes('integrating')) return '#3b6fe0'
  if (t.includes('review')) return '#d29922'
  if (t.includes('in progress')) return '#58a6ff'
  if (t.includes('planning')) return '#a371f7'
  if (t.includes('idle')) return '#8b949e'
  return '#8b949e'
}
const ROLE_COLOR = { orchestrator: '#7c6cf6', builder: '#58a6ff', reviewer: '#d29922', integrator: '#3fb950' }

const STATUS_CSS = `
.page-status .fleet-note,.page-kickoff .kg-note{color:var(--mut);font-size:13px;margin:0 0 14px}
.page-status .fleet-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 18px}
.page-status .fleet-legend .li{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--mut)}
.page-status .fleet-legend .dot{width:10px;height:10px;border-radius:3px;display:inline-block}
.page-status .fleet-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.page-status .wt{background:var(--bg2);border:1px solid var(--bd);border-left:5px solid var(--c);border-radius:10px;padding:14px 15px}
.page-status .wt-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px}
.page-status .wt-agent{font-weight:650;font-size:15px}
.page-status .role-badge{font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:999px;color:#0d1117;font-weight:650}
.page-status .wt-feat{font-size:14px;margin:2px 0 8px}
.page-status .wt-meta{color:var(--mut);font-size:12px;margin-bottom:10px}
.page-status .wt-meta code{font-size:11.5px}
.page-status .wt-status{display:inline-block;font-size:12.5px;font-weight:600;padding:3px 10px;border-radius:999px;color:#0d1117;background:var(--c)}
.page-status .wt-status .inf{font-weight:500;opacity:.8;font-style:italic;margin-left:5px}
.page-status .ahead{display:inline-block;background:var(--bg3);border:1px solid var(--bd);border-radius:999px;padding:0 7px;color:var(--tx)}
.page-status .dirty{display:inline-block;color:#d29922;font-weight:600;white-space:nowrap}
.page-kickoff .kg{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:16px;margin:0 0 22px}
.page-kickoff .kg-controls{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:14px}
.page-kickoff .kg-controls label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--mut)}
.page-kickoff .kg-controls select,.page-kickoff .kg-controls input{background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:7px;padding:7px 9px;font:14px system-ui,sans-serif;min-width:240px}
.page-kickoff .kg-out{position:relative}
.page-kickoff #kg-card{white-space:pre-wrap;margin:0}
.page-kickoff .kg-bar{display:flex;align-items:center;gap:10px;margin-top:10px}
.page-kickoff #kg-copy{background:var(--acc);color:#fff;border:none;border-radius:7px;padding:8px 16px;font-size:13.5px;font-weight:600;cursor:pointer}
.page-kickoff #kg-copy:hover{filter:brightness(1.08)}
.page-kickoff #kg-copied{color:var(--now,#3fb950);font-size:13px}
.page-kickoff .cards h3{margin-top:22px}
`

/* --------------------------------- Status page --------------------------- */
export function buildFleetStatus(root, buildTime) {
  const wts = readWorktrees(root)
  const legend = STATUS_VOCAB
    .map((s) => `<span class="li"><span class="dot" style="background:${statusColor(s)}"></span>${esc(s)}</span>`)
    .join('')
  const cards = wts.length
    ? wts.map((w) => {
        const c = statusColor(w.status)
        const rc = ROLE_COLOR[w.role] || '#8b949e'
        const ahead = w.ahead ? ` · <span class="ahead">+${esc(w.ahead)}</span>` : ''
        const dirty = w.dirty ? ` · <span class="dirty" title="${esc(String(w.dirty))} file(s) with uncommitted changes">● ${esc(String(w.dirty))} uncommitted</span>` : ''
        const inf = w.inferred ? ' <span class="inf">inferred</span>' : ''
        return `<article class="wt" style="--c:${c}">
<div class="wt-top"><span class="wt-agent">${esc(w.agent)}</span><span class="role-badge" style="background:${rc}">${esc(w.role)}</span></div>
<div class="wt-feat">${esc(w.feature)}</div>
<div class="wt-meta"><code>${esc(w.dir)}</code> · <code>${esc(w.branch)}</code>${ahead}${dirty}</div>
<div class="wt-status" style="background:${c}">${esc(w.status)}${inf}</div>
</article>`
      }).join('\n')
    : `<p class="fleet-note">No git worktrees found at build time. Once this repo has worktrees, they'll appear here.</p>`

  const bodyHtml = `<p class="fleet-note">Generated from <code>git worktree list</code> + each worktree's <code>HANDOFF.md</code> fleet header at build time (${esc(buildTime)}). Refresh with <code>/fleet</code> or a docs rebuild. Statuses without a handoff header are shown <em>inferred</em> from git. The full framework is on the <a href="framework.html">Framework</a> page; launch agents from <a href="kickoff.html">Kickoff cards</a>.</p>
<div class="fleet-legend">${legend}</div>
<div id="board" class="fleet-board">
${cards}
</div>`

  return {
    source: 'git worktree list + HANDOFF.md headers, at build time',
    headExtra: `<style>${STATUS_CSS}</style>`,
    bodyHtml,
    ids: new Set(['board']),
  }
}

/* ------------------------------- Kickoff page ---------------------------- */
const TEMPLATES = {
  orchestrator: `You are the Orchestrator for this project, running on main ({{WORKTREE}}). Read ~/.claude/agents/orchestrator.md, the Program PRD (docs/PRD.md), and FLEET.md to orient. Run a fleet cycle: refresh FLEET.md and tell me the project state and what needs my decision. Do NOT start, dispatch, or merge anything unless I tell you to — recommend, don't act. Beyond that, act on whatever I direct.`,
  planner: `You are the Planner for feature {{NAME}}. Brief: <one-line goal>. Read ~/.claude/agents/planner.md, the Program PRD (docs/PRD.md), docs/features/README.md, and any existing feature PRD. GRILL ME FIRST — one question at a time with your recommended answer — until the design tree is resolved. Then write/extend docs/features/{{NAME}}.md as a Feature PRD and cut it into vertical-slice issues (what to build / detailed plan / acceptance criteria / tests-first / blocked-by / Evidence: pending review). Quiz me on the slice list — my approval of it is the plan gate; STOP there.`,
  builder: `You are a Builder Agent assigned to the worktree {{WORKTREE}} (branch {{BRANCH}}, feature {{FEATURE}}). Read ~/.claude/agents/builder.md and operate under it. Orient from the Program PRD (docs/PRD.md), your feature PRD in docs/features/, and this worktree's HANDOFF.md (the "→ Next: builder" block). Build inside src/features/{{FEATURE}}/ only, working the PRD's issues in blocked-by order, test-first at the PRD's seams. Check each issue off as it closes. Update HANDOFF.md (status + "→ Next" block) when you pause or finish.`,
  reviewer: `You are the Reviewer for feature {{FEATURE}}, working in its own worktree {{WORKTREE}} (branch {{BRANCH}}). Read ~/.claude/agents/reviewer.md. Orient from this worktree's HANDOFF.md "→ Next: reviewer" block, the spec, and git diff main..{{BRANCH}}. Phase 1 review the diff (read-only); phase 2 verify (tests + harness, right here in this worktree); phase 3 capture the screenshot evidence pack into src/features/{{FEATURE}}/VERIFY/ (scripts/verify-shots.mjs). Commit REVIEW.md + the VERIFY/ pack on this feature branch so they merge with the feature, then rebuild the docs from the main worktree so the owner can approve from the KB's Verification page. Set the HANDOFF.md status + "→ Next" block.`,
  integrator: `You are the Integrator assigned to {{BRANCH}} (feature {{FEATURE}}), on main ({{WORKTREE}}). Read ~/.claude/agents/integrator.md. Confirm reviewed + verified (REVIEW.md / HANDOFF.md), then merge to main, apply INTEGRATION.md, wire it in, fold the changelog, mark it done in the Program PRD, and verify the whole app. Stop and confirm before the final merge. Set status merged and run /fleet.`,
}

export function buildKickoff(root, buildTime) {
  const wts = readWorktrees(root)
  const station = {
    main: (wts.find((w) => w.role === 'orchestrator') || {}).dir || '(main worktree)',
  }
  const data = JSON.stringify({ wts, station, templates: TEMPLATES })

  const staticCards = Object.entries(TEMPLATES)
    .map(([role, tpl]) => `<h3>${esc(role[0].toUpperCase() + role.slice(1))}</h3>\n<pre class="code">${esc(tpl)}</pre>`)
    .join('\n')

  const bodyHtml = `<p class="kg-note">Pick a role and the worktree/feature it should touch — the card fills in and copies. The worktree list is read at build time (${esc(buildTime)}); refresh it with a docs rebuild. Back to the <a href="framework.html">Framework</a> or the live <a href="status.html">Status</a> board.</p>
<div id="generator" class="kg">
  <div class="kg-controls">
    <label>Role
      <select id="kg-role">
        <option value="builder">Builder</option>
        <option value="reviewer">Reviewer (in the feature's worktree)</option>
        <option value="integrator">Integrator</option>
        <option value="orchestrator">Orchestrator</option>
        <option value="planner">Planner</option>
      </select>
    </label>
    <label id="kg-target-wrap">Target worktree / feature
      <select id="kg-target"></select>
    </label>
    <label id="kg-name-wrap" hidden>Feature name (NAME)
      <input id="kg-name" placeholder="e.g. USER_PROFILE">
    </label>
  </div>
  <div class="kg-out">
    <pre id="kg-card" class="code"></pre>
    <div class="kg-bar"><button id="kg-copy" type="button">Copy card</button><span id="kg-copied"></span></div>
  </div>
</div>
<div class="cards">
  <h2>All cards (reference)</h2>
  ${staticCards}
</div>`

  const scriptExtra = `<script>
(function(){
  var DATA = ${data};
  var roleEl=document.getElementById('kg-role'), targetEl=document.getElementById('kg-target'),
      targetWrap=document.getElementById('kg-target-wrap'), nameWrap=document.getElementById('kg-name-wrap'),
      nameEl=document.getElementById('kg-name'), cardEl=document.getElementById('kg-card'),
      copyEl=document.getElementById('kg-copy'), copiedEl=document.getElementById('kg-copied');
  function targetsFor(role){
    if(role==='orchestrator') return DATA.wts.filter(function(w){return w.role==='orchestrator';});
    if(role==='builder') return DATA.wts.filter(function(w){return w.role==='builder';});
    if(role==='reviewer'||role==='integrator') return DATA.wts.filter(function(w){return w.role==='builder';});
    return [];
  }
  function fill(tpl,m){return tpl.replace(/\\{\\{(\\w+)\\}\\}/g,function(_,k){return m[k]!=null?m[k]:'<'+k.toLowerCase()+'>';});}
  function render(){
    var role=roleEl.value, tpl=DATA.templates[role], t=targetEl.value, wt=targetsFor(role).filter(function(w){return w.branch===t||w.dir===t;})[0]||{};
    var m={};
    if(role==='planner'){ m.NAME=(nameEl.value||'<NAME>'); }
    else if(role==='orchestrator'){ m.WORKTREE=wt.dir||DATA.station.main; m.BRANCH='main'; }
    else if(role==='builder'){ m.WORKTREE=wt.dir||''; m.BRANCH=wt.branch||''; m.FEATURE=wt.feature||''; }
    else if(role==='reviewer'){ m.WORKTREE=wt.dir||''; m.BRANCH=wt.branch||''; m.FEATURE=wt.feature||''; }
    else if(role==='integrator'){ m.WORKTREE=DATA.station.main; m.BRANCH=wt.branch||''; m.FEATURE=wt.feature||''; }
    cardEl.textContent=fill(tpl,m);
  }
  function syncControls(){
    var role=roleEl.value;
    var isPlanner=role==='planner';
    nameWrap.hidden=!isPlanner; targetWrap.hidden=isPlanner;
    if(!isPlanner){
      var ts=targetsFor(role);
      targetEl.innerHTML=ts.map(function(w){
        var label=(role==='reviewer'||role==='integrator')?(w.feature+'  ('+w.branch+')'):(w.dir+'  —  '+w.feature);
        var val=(role==='orchestrator')?w.dir:w.branch;
        return '<option value="'+val+'">'+label+'</option>';
      }).join('')||'<option value="">(no worktrees found)</option>';
    }
    render();
  }
  roleEl.addEventListener('change',syncControls);
  targetEl.addEventListener('change',render);
  nameEl.addEventListener('input',render);
  copyEl.addEventListener('click',function(){
    var txt=cardEl.textContent;
    function done(){copiedEl.textContent='Copied!';setTimeout(function(){copiedEl.textContent='';},1600);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){fallback(txt);done();});}
    else{fallback(txt);done();}
  });
  function fallback(txt){var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);}
  syncControls();
})();
</script>`

  return {
    source: 'role templates + git worktrees, at build time',
    headExtra: `<style>${STATUS_CSS}</style>`,
    bodyHtml,
    scriptExtra,
    ids: new Set(['generator']),
  }
}
