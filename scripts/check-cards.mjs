#!/usr/bin/env node
/**
 * check-cards.mjs — hold the reference cards to the rules Phase 2 set for them.
 *
 * The cards are raw HTML under docs/public/, so nothing in the VitePress build
 * so much as opens them. Without this, a card could regrow an inline stylesheet
 * or a Google Fonts <link> and the site would still build green — which is
 * exactly how the originals ended up as seventeen drifting copies that printed
 * in Helvetica whenever the machine was offline.
 *
 *   node scripts/check-cards.mjs [--verbose]
 *
 * Runs in CI. Needs nothing but this repo.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CARDS = join(REPO, 'docs/public/cards')
const FONTS = join(REPO, 'docs/public/fonts')

const verbose = process.argv.includes('--verbose')

/** Every rule a card has to satisfy, and why it exists. */
const RULES = [
  {
    name: 'no external requests',
    // A card is printed at a workbench, at a display table, or on a machine
    // that has never seen this network. Anything it fetches, it fetches wrong.
    test: (html) => {
      const urls = [...html.matchAll(/(?:href|src)="(https?:)?\/\/[^"]*"/g)].map((m) => m[0])
      return urls.length ? `fetches from outside the repo: ${urls.join(', ')}` : null
    }
  },
  {
    name: 'no inline stylesheet',
    test: (html) => (/<style[\s>]/.test(html) ? 'carries its own <style> block instead of using card.css' : null)
  },
  {
    name: 'links the shared stylesheet',
    test: (html, { depth }) => {
      const want = `${'../'.repeat(depth)}card.css`
      return html.includes(`href="${want}"`) ? null : `does not link ${want}`
    }
  },
  {
    name: 'body is classed as a card',
    // card.css scopes every rule under .card, so an unclassed body renders as
    // unstyled HTML rather than as a slightly-off card — a loud failure.
    test: (html) => {
      const body = html.match(/<body[^>]*>/)
      if (!body) return 'has no <body> tag'
      return /class="card(\s|")/.test(body[0]) ? null : `body is not classed .card: ${body[0]}`
    }
  },
  {
    name: 'declares letter pages',
    test: (html) => (/class="page"/.test(html) ? null : 'has no .page elements')
  },
  {
    name: 'every local asset resolves',
    // A card may reference a file next to it — the keyboard layout is an SVG
    // rather than inline markup, because the KLE export carries its own
    // <style> block and the rule above forbids one. A moved or renamed asset
    // would print as an empty box, which nothing else here would catch.
    test: (html, { dir }) => {
      const missing = [...html.matchAll(/(?:href|src)="([^":]+)"/g)]
        .map((m) => m[1])
        .filter((url) => !url.startsWith('#') && !existsSync(resolve(dir, url)))
      return missing.length ? `references files that are not there: ${missing.join(', ')}` : null
    }
  }
]

function cards(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) cards(full, out)
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

const problems = []

if (!existsSync(CARDS)) {
  console.error(`✗ no cards directory at ${relative(REPO, CARDS)}`)
  process.exit(2)
}

// The stylesheet's @font-face rules are relative to itself; if the woff2 files
// move, every card silently falls back and only a printout would show it.
const css = readFileSync(join(CARDS, 'card.css'), 'utf-8')
for (const [, url] of css.matchAll(/url\('([^']+)'\)/g)) {
  if (!existsSync(resolve(CARDS, url))) problems.push(`cards/card.css: @font-face points at a missing file: ${url}`)
}
if (!existsSync(FONTS)) problems.push('docs/public/fonts/ is missing — cards have no faces to embed')

const files = cards(CARDS)
for (const file of files) {
  const rel = relative(join(REPO, 'docs/public'), file)
  const html = readFileSync(file, 'utf-8')
  const depth = rel.split('/').length - 2 // cards/x.html → 0, cards/archive/x.html → 1
  const failed = []
  for (const rule of RULES) {
    const why = rule.test(html, { depth, dir: dirname(file) })
    if (why) failed.push(`${rel}: ${why}`)
  }
  problems.push(...failed)
  if (verbose && !failed.length) console.log(`  ok    ${rel}`)
}

console.log(`checked ${files.length} cards against ${RULES.length} rules`)

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log('✓ every card is self-contained and on the shared stylesheet')
