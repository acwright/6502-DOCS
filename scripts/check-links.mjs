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
const SITE = `https://acwright.github.io${BASE}`

/**
 * The two emulator frames, and every parameter each one answers to.
 *
 * A frame URL is a link like any other and gets checked like one. Its query
 * string does not: the frame ignores a parameter it has never heard of, on
 * purpose, so that a page pinned to an old release keeps working. That is right
 * for a reader's page and wrong for this one — here a misspelled or renamed
 * parameter is a silently broken example, which is the worst kind. So the
 * spellings are checked against the contract instead.
 *
 * The ACE and the KIM are separate machines with separate contracts, and the
 * overlap between them is the trap: both take `bin`, `autotype` and `controls`,
 * neither takes the other's media parameter. Checking a KIM frame against the
 * union would pass `prg64=` on a machine with no BASIC to load it into, which is
 * exactly the silence this check exists to prevent. So each frame is checked
 * against its own set, matched by which host the URL names.
 */
const CONTRACTS = ['emulator', 'kimulator'].map((name) => {
  const contract = JSON.parse(readFileSync(join(REPO, `data/${name}.json`), 'utf8'))
  return {
    name,
    contract,
    parameters: new Set([
      ...contract.parameters.media,
      ...contract.parameters.media.map((media) => `${media}64`),
      ...contract.parameters.flags,
      ...contract.parameters.other
    ])
  }
})

const offline = process.argv.includes('--offline')
const verbose = process.argv.includes('--verbose')

/** Repo notes that carry links but are never built into a page. */
const NOTES = ['README.md', 'ACCURACY.md', 'samples/README.md', 'assets/README.md']

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
 * The site's own address, rewritten as a path this build can answer.
 *
 * Every page carries a canonical tag naming its deployed URL, and the notes
 * link to the live site — so a run collects a handful of links pointing back
 * here and would ask the network about them. That is the one host whose answer
 * is worth less than the build sitting in `dist`: a page added in this commit
 * has never been deployed, so the network says 404 about a link that is correct
 * and about to be live, and every new page turns CI red on its way in. The
 * build is what that URL is going to serve, so ask the build.
 *
 * Returns null for anything else, which is every genuinely external link.
 */
function ownAddress(url) {
  if (url === SITE.slice(0, -1)) return BASE
  return url.startsWith(SITE) ? BASE + url.slice(SITE.length) : null
}

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

/**
 * A token lifts GitHub's API quota from 60 requests an hour per *address* to
 * 5,000 per token — and an address is exactly the wrong unit on a CI runner,
 * where it is shared with everyone else building anything. CI has one already;
 * locally this is usually unset, which is fine, because sixty an hour is
 * plenty for one person.
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

async function head(url, method) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const headers = {
      // A default Node user-agent is refused outright by two of the vendor
      // sites these docs cite. Identify as what this is.
      'user-agent': '6502-DOCS link checker (+https://github.com/acwright/6502-DOCS)',
      accept: '*/*'
    }
    if (GITHUB_TOKEN && new URL(url).hostname === 'api.github.com') {
      headers.authorization = `Bearer ${GITHUB_TOKEN}`
    }

    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers
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
        if (status === 200) return null
        // The API answers an exhausted quota with 403, not 429. Without a token
        // that quota is sixty an hour per address, which a CI runner shares
        // with the whole of GitHub Actions — so this says nothing about whether
        // the repository exists, and must not fail the build.
        if (status === 403 || status === 429) {
          return { unreachable: `the GitHub API says ${status} — out of quota, not an answer` }
        }
        return { broken: `the GitHub API says ${status}` }
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

      const own = ownAddress(link)
      if (!own && /^(https?:)?\/\//.test(link)) {
        external.add(link.startsWith('//') ? `https:${link}` : link)
        continue
      }

      const [pathPart, hash] = (own ?? link).split('#')
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

      // A note linking to the live site is asking about a page in this build,
      // and the build is the better authority — see `ownAddress`.
      const own = ownAddress(link)
      if (own) {
        const [servedPath, servedHash] = own.split('#')
        checked.internal++
        const target = resolveServed(servedPath.split('?')[0])
        if (!target) {
          report(note, link, 'resolves to nothing in the build')
        } else if (servedHash) {
          checked.anchors++
          if (!anchorsOf(target).has(decodeURIComponent(servedHash))) {
            report(note, link, `no #${servedHash} in ${relative(DIST, target)}`)
          }
        }
        continue
      }

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
// The emulator frames
// ---------------------------------------------------------------------------

/**
 * Every frame URL this repository writes, and every parameter it sets.
 *
 * Four sources, because the site reaches a frame four ways and all four can be
 * wrong independently: the examples a chapter prints, the starter page a reader
 * is invited to upload, and the two components that build a URL at run time.
 * Only the first two are text in the build; a component's are read out of its
 * source, since a URL assembled in the browser is in no HTML file to scan.
 */
function checkFrame(external) {
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

  /**
   * Which contract a printed URL is held to: the one whose frame it names.
   *
   * A chapter is allowed to abbreviate — `…/embed.html?prg64=…` is how the
   * emulator chapter writes a URL whose host it has already given a paragraph
   * earlier — so a URL that names no host answers to the ACE, which is the
   * machine every one of those paragraphs is about.
   */
  const contractFor = (url) =>
    CONTRACTS.find((c) => url.includes(c.contract.web.frame)) ?? CONTRACTS[0]

  // A parameter can be written two ways: into the URL, or set on it afterwards.
  // The starter page does the second — it cannot know the program's address
  // until it has loaded — so a scan for `embed.html?…` alone would stop
  // checking the one page a reader is invited to copy. That form carries no
  // host either, and it is the ACE's starter: the KIM has nothing to fetch.
  const scan = (where, text) => {
    const decoded = decode(text)
    // Greedy, so the match carries the host back to `contractFor`. Lazy would
    // start at `embed.html` every time and hand it a URL with no host in it,
    // which every frame on the site would then answer to the ACE's contract.
    for (const m of decoded.matchAll(/\S*embed\.html\?([^\s"'<>]+)/g)) {
      seen.push({ where, query: m[1], of: contractFor(m[0]) })
    }
    for (const m of decoded.matchAll(/searchParams\.set\(\s*['"]([^'"]+)['"]/g)) {
      seen.push({ where, query: `${m[1]}=`, of: CONTRACTS[0] })
    }
  }

  for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8')
    if (html.includes('embed.html?')) scan(relative(REPO, file), html)
  }

  const starter = join(REPO, 'samples/embed/itch/index.html')
  if (existsSync(starter)) scan('samples/embed/itch/index.html', readFileSync(starter, 'utf8'))

  for (const { where, query, of } of seen) {
    checked.frames++
    for (const pair of query.split('&')) {
      const name = decodeURIComponent(pair.split('=')[0])
      if (!name) continue
      if (!of.parameters.has(name)) {
        report(where, `embed.html?…${name}=…`,
          `the ${of.name} frame has no "${name}" parameter — it would be ignored`)
      }
    }
  }

  // The components, whose URLs never exist as text anywhere.
  const components = [
    { file: 'docs/.vitepress/theme/Emulator.vue', of: CONTRACTS[0] },
    { file: 'docs/.vitepress/theme/KIM.vue', of: CONTRACTS[1] }
  ]

  for (const { file, of } of components) {
    external.add(of.contract.web.frame)
    checked.frames++

    const component = join(REPO, file)
    if (!existsSync(component)) continue

    const source = readFileSync(component, 'utf8')
    for (const m of source.matchAll(/params\.set\(\s*'([^']+)'/g)) {
      checked.frames++
      if (!of.parameters.has(m[1])) {
        report(file, `params.set('${m[1]}')`,
          `the ${of.name} frame has no "${m[1]}" parameter — it would be ignored`)
      }
    }
    // The one parameter this site must never send. See data/emulator.json.
    // The KIM has no such parameter — nothing on that machine persists — so
    // the ban is only asked about where it exists.
    if (of.contract.banned?.persist && /params\.set\(\s*'persist'/.test(source)) {
      report(file, "params.set('persist')", of.contract.banned.persist)
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
