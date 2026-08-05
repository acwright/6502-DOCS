#!/usr/bin/env node
/**
 * check-links.mjs — every link on the site, and in the repo's own notes, goes
 * somewhere.
 *
 * VitePress checks dead links between Markdown pages and stops there. It never
 * opens a `<Figure src>`, never opens the raw HTML cards under `docs/public/`,
 * never checks that an anchor exists in the page it points at, and never asks
 * the network whether a datasheet is still where it was. This site is nearly a
 * thousand links across those blind spots, so it needs a checker that reads
 * what is actually served.
 *
 *   node scripts/check-links.mjs              # build output + repo notes, network on
 *   node scripts/check-links.mjs --offline    # skip the network, check structure only
 *   node scripts/check-links.mjs --verbose    # print every link, not just the broken ones
 *
 * Needs `npm run docs:build` to have run: it walks `docs/.vitepress/dist`,
 * which is the only place the cards, the images and the prose all sit together
 * in the shape a reader gets them.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(REPO, 'docs/.vitepress/dist')
const BASE = '/6502-DOCS/'

/**
 * The emulator frame, and every parameter it answers to.
 *
 * A frame URL is a link like any other and gets checked like one. Its query
 * string does not: the frame ignores a parameter it has never heard of, on
 * purpose, so that a page pinned to an old release keeps working. That is right
 * for a reader's page and wrong for this one — here a misspelled or renamed
 * parameter is a silently broken example, which is the worst kind. So the
 * spellings are checked against the contract instead.
 */
const EMULATOR = JSON.parse(readFileSync(join(REPO, 'data/emulator.json'), 'utf8'))
const FRAME_PARAMETERS = new Set([
  ...EMULATOR.parameters.media,
  ...EMULATOR.parameters.media.map((name) => `${name}64`),
  ...EMULATOR.parameters.flags,
  ...EMULATOR.parameters.other
])

const offline = process.argv.includes('--offline')
const verbose = process.argv.includes('--verbose')

/** Repo notes that carry links but are never built into a page. */
const NOTES = [
  'README.md',
  'PLAN.md',
  'ACCURACY.md',
  'IMAGES.md',
  'ASSETS-MIGRATION.md',
  'FEEDBACK.md',
  'samples/README.md',
  'assets/README.md'
]

const failures = []
const unreachable = []
const checked = { internal: 0, external: 0, anchors: 0, frames: 0 }

// ---------------------------------------------------------------------------
// Reading what is served
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** Every `href`/`src` in a document, with the raw attribute for the report. */
function linksIn(html) {
  return [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1])
}

/** Every id an anchor could land on. */
function anchorsIn(html) {
  const ids = new Set()
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1])
  for (const m of html.matchAll(/\bname="([^"]+)"/g)) ids.add(m[1])
  return ids
}

/** Markdown links, inline and reference-style, plus bare autolinks. */
function linksInMarkdown(md) {
  const out = []
  // Code fences carry example paths and shell snippets that are not links.
  const prose = md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  for (const m of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) out.push(m[1])
  for (const m of prose.matchAll(/<((?:https?:\/\/|mailto:)[^>]+)>/g)) out.push(m[1])
  return out
}

// ---------------------------------------------------------------------------
// Internal resolution
// ---------------------------------------------------------------------------

/**
 * Map a served URL path to the file that answers it. VitePress serves
 * `/using/serial` from `using/serial.html`, and a directory from its
 * `index.html`; both have to resolve or a reader gets a 404 the build never
 * mentioned.
 */
function resolveServed(pathname) {
  const rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '')
  const candidates = [rel, `${rel}.html`, join(rel, 'index.html')]
  for (const c of candidates) {
    if (!c) continue
    const full = join(DIST, c)
    if (existsSync(full) && statSync(full).isFile()) return full
  }
  return null
}

const anchorCache = new Map()
function anchorsOf(file) {
  if (!anchorCache.has(file)) anchorCache.set(file, anchorsIn(readFileSync(file, 'utf8')))
  return anchorCache.get(file)
}

/**
 * GitHub's own slugging, enough of it for the headings these notes use. Note
 * that it does *not* collapse runs of spaces: dropping the `&` from
 * "Voice & Style" leaves two, and the anchor really is `voice--style`.
 */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s/g, '-')
}

const headingCache = new Map()
function headingsOf(file) {
  if (!headingCache.has(file)) {
    const md = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
    const ids = new Set()
    for (const m of md.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) ids.add(slugify(m[1]))
    headingCache.set(file, ids)
  }
  return headingCache.get(file)
}

// ---------------------------------------------------------------------------
// External checking
// ---------------------------------------------------------------------------

const externalCache = new Map()

async function head(url, method) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // A default Node user-agent is refused outright by two of the vendor
        // sites these docs cite. Identify as what this is.
        'user-agent': '6502-DOCS link checker (+https://github.com/acwright/6502-DOCS)',
        accept: '*/*'
      }
    })
    return res.status
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Two different answers, deliberately kept apart.
 *
 * A server that says 404 is telling you the link is broken, and that fails the
 * build. A connection that times out or is reset is telling you nothing — the
 * host may be down for a minute, may refuse this network, or may block scripts
 * outright. `www.analog.com` does the last of those from here: it resolves,
 * and then no connection completes, from any client, while the same run
 * reaches forty-five other hosts. Failing on that would train everyone to
 * ignore this check, so an unreachable host is printed as unchecked and the
 * exit code stays clean.
 */
async function checkExternal(url) {
  if (externalCache.has(url)) return externalCache.get(url)
  const promise = (async () => {
    const u = new URL(url)

    // Anonymous requests to github.com are rate-limited by IP, and a limited
    // request answers 429 whether or not the page exists. The API answers
    // honestly, and a repo's existence is one cheap call.
    if (u.hostname === 'github.com') {
      const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/')
      if (parts.length === 2 && parts[0] && parts[1]) {
        const status = await head(`https://api.github.com/repos/${parts[0]}/${parts[1]}`, 'GET')
        return status === 200 ? null : { broken: `the GitHub API says ${status}` }
      }
    }

    let status
    try {
      status = await head(url, 'HEAD')
      // Plenty of servers answer HEAD with a refusal and GET with the file.
      if (status === 403 || status === 405 || status === 404 || status >= 500) {
        status = await head(url, 'GET')
      }
    } catch (err) {
      const why = err.name === 'AbortError' ? 'timed out after 20s' : (err.cause?.code ?? err.message)
      return { unreachable: why }
    }

    // 429 is not an answer about the link. It says "you are asking too often",
    // and on a shared CI runner that is about every other client on the same
    // address, not about this site — `itch.io` failed one run this way and
    // passed the next two. It belongs with the refused connections: the same
    // reasoning that keeps `www.analog.com` from failing the build applies, and
    // a check that goes red at random is a check everyone learns to re-run.
    if (status === 429) return { unreachable: 'HTTP 429 — rate-limited, not an answer' }

    return status >= 200 && status < 400 ? null : { broken: `HTTP ${status}` }
  })()
  externalCache.set(url, promise)
  return promise
}

/** Run `jobs` a few at a time — polite to the hosts, and fast enough. */
async function pool(jobs, width = 6) {
  const queue = [...jobs]
  const workers = Array.from({ length: width }, async () => {
    while (queue.length) await queue.shift()()
  })
  await Promise.all(workers)
}

// ---------------------------------------------------------------------------
// The passes
// ---------------------------------------------------------------------------

function report(where, link, problem) {
  failures.push({ where, link, problem })
}

/** Everything the built site serves: prose, components, cards, assets. */
function checkBuiltSite(external) {
  if (!existsSync(DIST)) {
    console.error('No build to check. Run `npm run docs:build` first.')
    process.exit(1)
  }

  const pages = walk(DIST).filter((f) => f.endsWith('.html'))
  for (const page of pages) {
    const html = readFileSync(page, 'utf8')
    const where = relative(REPO, page)

    for (const raw of linksIn(html)) {
      const link = raw.trim()
      if (!link || link.startsWith('data:') || link.startsWith('mailto:')) continue

      if (/^(https?:)?\/\//.test(link)) {
        external.add(link.startsWith('//') ? `https:${link}` : link)
        continue
      }

      const [pathPart, hash] = link.split('#')
      let target = page

      if (pathPart) {
        // A card is raw HTML with relative links; a page's links are absolute
        // under the base. Resolve both against the file that carries them.
        const abs = pathPart.startsWith('/')
          ? resolveServed(pathPart.split('?')[0])
          : resolveServedRelative(page, pathPart.split('?')[0])
        checked.internal++
        if (!abs) {
          report(where, link, 'resolves to nothing in the build')
          continue
        }
        target = abs
      }

      if (hash && target.endsWith('.html')) {
        checked.anchors++
        if (!anchorsOf(target).has(decodeURIComponent(hash))) {
          report(where, link, `no #${hash} in ${relative(DIST, target)}`)
        }
      }
    }
  }
  return pages.length
}

function resolveServedRelative(fromFile, rel) {
  const candidate = resolve(dirname(fromFile), rel)
  if (!candidate.startsWith(DIST)) return null
  for (const c of [candidate, `${candidate}.html`, join(candidate, 'index.html')]) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

/**
 * The repo's own notes. They are not served, but they are what a contributor
 * reads, and the sibling-repo table in the README is the densest set of links
 * in the project.
 */
function checkNotes(external) {
  for (const note of NOTES) {
    const file = join(REPO, note)
    if (!existsSync(file)) continue

    for (const link of linksInMarkdown(readFileSync(file, 'utf8'))) {
      if (link.startsWith('mailto:')) continue
      if (/^https?:\/\//.test(link)) {
        external.add(link)
        continue
      }

      const [pathPart, hash] = link.split('#')
      const target = pathPart ? resolve(dirname(file), pathPart) : file
      checked.internal++

      if (!existsSync(target)) {
        report(note, link, 'no such file in the repo')
        continue
      }
      if (hash && target.endsWith('.md')) {
        checked.anchors++
        if (!headingsOf(target).has(decodeURIComponent(hash))) {
          report(note, link, `no such heading in ${relative(REPO, target)}`)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// The emulator frame
// ---------------------------------------------------------------------------

/**
 * Every frame URL this repository writes, and every parameter it sets.
 *
 * Three sources, because the site reaches the frame three ways and all three
 * can be wrong independently: the examples a chapter prints, the starter page a
 * reader is invited to upload, and the component that builds a URL at run time.
 * Only the first two are text in the build; the component's are read out of its
 * source, since a URL assembled in the browser is in no HTML file to scan.
 */
function checkFrame(external) {
  external.add(EMULATOR.web.frame)
  checked.frames++

  const seen = []

  // A frame URL printed in a chapter arrives here HTML-escaped — `&` between
  // parameters is `&amp;`, and the quote that ends the attribute is `&quot;`.
  // Both have to come back before the query can be split, or the checker
  // reports the entity as a parameter.
  const decode = (html) =>
    html
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')

  // A parameter can be written two ways: into the URL, or set on it afterwards.
  // The starter page does the second — it cannot know the program's address
  // until it has loaded — so a scan for `embed.html?…` alone would stop
  // checking the one page a reader is invited to copy.
  const scan = (where, text) => {
    const decoded = decode(text)
    for (const m of decoded.matchAll(/embed\.html\?([^\s"'<>]+)/g)) {
      seen.push({ where, query: m[1] })
    }
    for (const m of decoded.matchAll(/searchParams\.set\(\s*['"]([^'"]+)['"]/g)) {
      seen.push({ where, query: `${m[1]}=` })
    }
  }

  for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8')
    if (html.includes('embed.html?')) scan(relative(REPO, file), html)
  }

  const starter = join(REPO, 'samples/embed/itch/index.html')
  if (existsSync(starter)) scan('samples/embed/itch/index.html', readFileSync(starter, 'utf8'))

  for (const { where, query } of seen) {
    checked.frames++
    for (const pair of query.split('&')) {
      const name = decodeURIComponent(pair.split('=')[0])
      if (!name) continue
      if (!FRAME_PARAMETERS.has(name)) {
        report(where, `embed.html?…${name}=…`, `the frame has no "${name}" parameter — it would be ignored`)
      }
    }
  }

  // The component, whose URLs never exist as text anywhere.
  const component = join(REPO, 'docs/.vitepress/theme/Emulator.vue')
  if (existsSync(component)) {
    const source = readFileSync(component, 'utf8')
    for (const m of source.matchAll(/params\.set\(\s*'([^']+)'/g)) {
      checked.frames++
      if (!FRAME_PARAMETERS.has(m[1])) {
        report('docs/.vitepress/theme/Emulator.vue', `params.set('${m[1]}')`,
          `the frame has no "${m[1]}" parameter — it would be ignored`)
      }
    }
    // The one parameter this site must never send. See data/emulator.json.
    if (/params\.set\(\s*'persist'/.test(source)) {
      report('docs/.vitepress/theme/Emulator.vue', "params.set('persist')", EMULATOR.banned.persist)
    }
  }
}

// ---------------------------------------------------------------------------

const external = new Set()
const pageCount = checkBuiltSite(external)
checkNotes(external)
checkFrame(external)

if (offline) {
  console.log(`Skipping ${external.size} external links (--offline).`)
} else {
  const urls = [...external].sort()
  await pool(
    urls.map((url) => async () => {
      const verdict = await checkExternal(url)
      checked.external++
      if (verdict?.broken) report('the site', url, verdict.broken)
      else if (verdict?.unreachable) unreachable.push({ url, why: verdict.unreachable })
      else if (verbose) console.log(`ok   ${url}`)
    })
  )
}

console.log(
  `\n${pageCount} pages · ${checked.internal} internal · ${checked.anchors} anchors · ` +
    `${checked.external} external (github.com via the API) · ${checked.frames} frame parameters`
)

if (unreachable.length) {
  console.log(`\n${unreachable.length} could not be checked from this network — open them by hand:\n`)
  for (const u of unreachable) console.log(`  ${u.url}\n    ${u.why}\n`)
}

if (failures.length) {
  console.error(`\n${failures.length} broken:\n`)
  for (const f of failures) console.error(`  ${f.where}\n    ${f.link}\n    ${f.problem}\n`)
  process.exit(1)
}

console.log('No broken links.')
