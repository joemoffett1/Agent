/**
 * verify-shots — capture a feature's screenshot evidence pack.
 *
 * Zero-dependency: drives the machine's installed Edge (or Chrome) in headless
 * mode, matching the docs build's no-dependency house style. Used by the review
 * station to capture one screenshot per acceptance criterion into the feature's
 * VERIFY/ folder; the docs build then aggregates every pack into the KB's
 * Verification page (docs-site/verification.html).
 *
 *   node scripts/verify-shots.mjs <shotlist.json>
 *   node scripts/verify-shots.mjs --url <url> --out <path/to/shot.png> [--size 1280x900] [--settle 5000]
 *
 * Shot-list format (relative paths resolve against the CURRENT WORKING DIR):
 *   {
 *     "out": "src/features/<name>/VERIFY",     // folder the PNGs land in
 *     "size": "1280x900",                      // default viewport (per-shot override ok)
 *     "settle": 5000,                          // ms of virtual time for the app to render
 *     "shots": [
 *       { "name": "harness-default", "url": "http://localhost:1734/src/features/<name>/__dev__/harness.html" },
 *       { "name": "state-x", "url": "http://localhost:1734/...harness.html?scenario=x", "size": "900x700" }
 *     ]
 *   }
 *
 * The feature's dev server must already be running (see .claude/launch.json in the
 * worktree parent, or `npm --prefix ../mc-<name> run dev -- --port <port> --strictPort`).
 * A blank capture usually means `settle` was too short for the harness to render.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'

const CANDIDATES = [
  process.env.VERIFY_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

function findBrowser() {
  for (const p of CANDIDATES) if (existsSync(p)) return p
  console.error('verify-shots: no Edge/Chrome found — set VERIFY_BROWSER to a browser executable.')
  process.exit(1)
}

function capture(browser, { url, out, size = '1280x900', settle = 5000 }) {
  const [w, h] = size.split(/[x,]/).map(Number)
  mkdirSync(dirname(out), { recursive: true })
  // A UNIQUE profile per capture is load-bearing: reusing a profile dir lets the
  // launcher hand off to an existing browser singleton and exit without ever
  // taking the screenshot. The scratch profile is removed after the run.
  const profile = mkdtempSync(join(tmpdir(), 'verify-shots-'))
  try {
    execFileSync(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      `--window-size=${w},${h}`,
      `--virtual-time-budget=${settle}`,
      `--screenshot=${out}`,
      url,
    ], { stdio: 'ignore', timeout: 90_000 })
  } finally {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3 })
  }
  const size_ = existsSync(out) ? statSync(out).size : 0
  const flag = size_ === 0 ? '  ✗ MISSING' : size_ < 6_000 ? '  ⚠ suspiciously small — likely blank; raise settle?' : ''
  console.log(`  ${out}  (${(size_ / 1024).toFixed(1)} KB)${flag}`)
  return size_ > 0
}

const args = process.argv.slice(2)
const browser = findBrowser()
let ok = true

if (args[0] === '--url') {
  const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
  ok = capture(browser, {
    url: get('--url'), out: resolve(get('--out', 'shot.png')),
    size: get('--size', '1280x900'), settle: +get('--settle', 5000),
  })
} else if (args[0] && existsSync(args[0])) {
  const list = JSON.parse(readFileSync(args[0], 'utf8'))
  const outDir = resolve(list.out || '.')
  console.log(`verify-shots: ${list.shots.length} shot(s) → ${outDir}`)
  for (const s of list.shots) {
    ok = capture(browser, {
      url: s.url, out: join(outDir, `${s.name}.png`),
      size: s.size || list.size, settle: s.settle ?? list.settle,
    }) && ok
  }
} else {
  console.error('usage: node scripts/verify-shots.mjs <shotlist.json> | --url <url> --out <file.png> [--size WxH] [--settle ms]')
  process.exit(1)
}
process.exit(ok ? 0 : 1)
