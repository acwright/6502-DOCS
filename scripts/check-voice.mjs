#!/usr/bin/env node
//
// Voice check (PLAN.md, "Voice & Style").
//
// The docs are a user's guide. The verification method that keeps them honest
// is real, necessary, and none of the reader's business — it belongs in
// samples/, scripts/ and ACCURACY.md, not on a page. This check fails the build
// if the machinery leaks back into the prose.
//
//   npm run check:voice
//
// Every rule here comes from a specific thing that went wrong in the first pass
// of Phase 3; see PLAN.md's "Course Correction" section.

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(ROOT, 'docs')

const RULES = [
  {
    name: 'verification vocabulary',
    pattern: /\b(RUN[-\s]verified|GREP[-\s]only|\bGREP\b|\bSCHEM\b|INSPECT-verified|verified against|not RUN-verified)/i,
    why: 'the reader did not ask for a chain of custody — say the thing, not how you checked it'
  },
  {
    name: 'fact-base plumbing',
    pattern: /\bdata\/[a-z-]+\.json\b|\bfact base\b|npm run facts/i,
    why: 'generated tables should just look like tables'
  },
  {
    name: 'BIOS source citation',
    pattern: /\b(Kernal|BASIC|Monitor|BIOS)\.(asm|inc|cfg):\d+/,
    why: 'source line numbers belong in ACCURACY.md'
  },
  {
    name: 'project management',
    pattern: /\bPhase \d\b|\bscripts\/[a-z-]+\.mjs\b|npm run verify|samples\/|PLAN\.md|ACCURACY\.md/,
    why: 'the reader does not know this repository exists'
  },
  {
    name: 'test scaffolding in a listing',
    pattern: /PRINT "(PASS|FAIL)"/,
    why: 'a shown program should do something worth doing'
  },
  // The machine and its author are American, and so is the voice. This drifted
  // once already: the site shipped "colour" on nine chapters and "COLOUR" in a
  // sample, three lines from a `COLOR` statement the ROM actually spells that
  // way. The BIOS source is written in British English and its prose is lifted
  // wholesale into the fact base, so the pull is constant — `extract-facts.mjs`
  // americanizes on the way out, and these two rules catch what is typed here.
  {
    name: 'British spelling',
    pattern:
      /\b(colours?|colour(ed|ing|ful)|behaviours?|centres?|centred|licence|greys?|greyscale|maths|amongst|whilst|neighbours?|neighbouring|labell(ed|ing)|modell(ed|ing)|catalogues?|chequer(ed|board)|aluminium|programme|(initiali|recogni|reali|optimi|summari|organi|analy|customi|standardi|prioriti|emphasi|speciali|utili|visuali)s(e|es|ed|ing|ation))\b/i,
    why: 'the docs are written in American English — color, behavior, center, gray, initialize'
  },
  {
    name: 'British idiom',
    pattern: /\b(way round|time round|round again|straight away|full stop\b(?! character)|fortnight|rubbish|ticked a box|doing sums)\b/i,
    why: 'say it the American way — the other way around, each time through, right away, period'
  }
]

// Snippet imports are paths by necessity — `<<< @/../samples/basic/x.bas` — and
// are never rendered as text, so they are exempt from the path rules.
const EXEMPT_LINE = /^\s*<<< @/

function markdownFiles(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'public') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...markdownFiles(path))
    else if (extname(entry.name) === '.md') found.push(path)
  }
  return found
}

let failures = 0

for (const file of markdownFiles(DOCS)) {
  const lines = readFileSync(file, 'utf-8').split('\n')

  for (const [n, line] of lines.entries()) {
    if (EXEMPT_LINE.test(line)) continue

    for (const rule of RULES) {
      const hit = line.match(rule.pattern)
      if (!hit) continue
      failures++
      console.log(`${relative(ROOT, file)}:${n + 1}  ${rule.name} — "${hit[0]}"`)
      console.log(`       ${rule.why}`)
    }
  }
}

if (failures) {
  console.log(`\n${failures} voice problem(s) — see PLAN.md, "Voice & Style"`)
  process.exit(1)
}

console.log('voice: ok')
