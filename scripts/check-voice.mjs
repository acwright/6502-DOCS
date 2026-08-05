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
  },
  // The reader may be at an ACE, at the emulator, or reading before they have
  // either. Nothing on this site is for sale, so nothing on it should read as
  // though the reader bought a machine or is being sold one. "the ACE" and "an
  // ACE" cover every reader; "your ACE" only covers one of them. This is about
  // the computer alone — `your program`, `your laptop` and `your work` really
  // are the reader's, and stay.
  {
    name: 'ownership of the machine',
    pattern: /\byour ACE\b|\bships with the computer\b|\bout of the box\b|\bcame in the box\b/i,
    why: 'write "the ACE" or "an ACE" — the reader may not own one, and none of this is selling them one'
  },
  // Several chapters now carry a live machine beside the listing they show. To
  // the reader that is a machine, and the caption under it says so — it does
  // not say what it is made of, any more than a photograph's caption says JPEG.
  // Naming an emulator release is the same class of mistake as naming a BIOS
  // release: it is a number that goes stale on a page nobody remembers to edit.
  {
    name: 'embed mechanism',
    pattern: /\biframes?\b|\bbase64\b|\bembed(s|ded|ding)?\b|\bpostMessage\b|\bembed\.html\b/i,
    why: 'a machine on the page is a machine — describe what it does, not what it is built out of',
    // The one place on the site where the mechanism *is* the subject: a reader
    // who has written a game and wants a link to send someone. A section that
    // could not say "iframe" could not teach this. The banned list is about
    // verification vocabulary and about the site talking about itself — not
    // about refusing to name the web.
    except: { file: 'docs/using/emulator.md', from: '## Putting your program on the web', to: /^## /m }
  }
]

// Snippet imports are paths by necessity — `<<< @/../samples/basic/x.bas` — and
// are never rendered as text, so they are exempt from the path rules.
const EXEMPT_LINE = /^\s*<<< @/

// The site footer reads the BIOS version out of the fact base, so it cannot go
// stale. Prose and splash transcripts are typed by hand and can — which is
// precisely how the sheets this site replaced ended up describing a v1.0 ROM on
// a v1.5 machine. Any version a page states next to the word BIOS has to be the
// one the firmware actually reports.
const BIOS_VERSION = JSON.parse(readFileSync(join(ROOT, 'data/boot.json'), 'utf-8')).version.string
const VERSION_NEAR_BIOS = /BIOS[^\n]{0,40}?\b(v\d+\.\d+)/gi
// `cards/archive/` holds the superseded v1.0–v1.4 sheets, and a link to one is
// supposed to name an old version — that is the whole point of the archive.
const ARCHIVE_LINE = /cards\/archive\//

// The emulator's own version goes stale the same way, and in the same place: a
// transcript inside a code fence, where nothing can interpolate. The two pages
// that show `6502 --version` and `6502 dbg info` are quoting a machine, so what
// they quote has to be the release this site was written against. Every
// three-part version number in the docs is one of those — if a page ever needs
// a different one, this reports it and somebody decides rather than nobody
// noticing.
const EMULATOR_VERSION = JSON.parse(
  readFileSync(join(ROOT, 'data/emulator.json'), 'utf-8')
).version
const THREE_PART_VERSION = /\b\d+\.\d+\.\d+\b/g

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

/**
 * The lines of `file` a rule does not apply to.
 *
 * A rule's `except` names one section of one page, from a heading to the next
 * one. So far there is exactly one, and it is worth stating why the checker
 * needs the machinery at all: the emulator chapter has a section about framing
 * the emulator on your own page, and a section that could not write the word
 * *iframe* could not teach it. Everywhere else on the site a machine on the
 * page is a machine, and the caption says what it does rather than what it is
 * made of.
 */
function exemptRange(rule, path, lines) {
  const exempt = new Set()
  if (!rule.except || relative(ROOT, path) !== rule.except.file) return exempt

  let inside = false
  for (const [n, line] of lines.entries()) {
    if (!inside) {
      if (line.trim() === rule.except.from) inside = true
      continue
    }
    if (rule.except.to.test(line)) break
    exempt.add(n)
  }

  if (!inside) {
    throw new Error(
      `${rule.except.file} no longer has the heading "${rule.except.from}" — ` +
        `the "${rule.name}" exception is pointing at nothing`
    )
  }
  return exempt
}

let failures = 0

for (const file of markdownFiles(DOCS)) {
  const lines = readFileSync(file, 'utf-8').split('\n')
  const exemptions = RULES.map((rule) => exemptRange(rule, file, lines))

  for (const [n, line] of lines.entries()) {
    if (EXEMPT_LINE.test(line)) continue

    for (const [r, rule] of RULES.entries()) {
      if (exemptions[r].has(n)) continue
      const hit = line.match(rule.pattern)
      if (!hit) continue
      failures++
      console.log(`${relative(ROOT, file)}:${n + 1}  ${rule.name} — "${hit[0]}"`)
      console.log(`       ${rule.why}`)
    }

    for (const hit of line.matchAll(THREE_PART_VERSION)) {
      if (hit[0] === EMULATOR_VERSION) continue
      failures++
      console.log(`${relative(ROOT, file)}:${n + 1}  stale emulator version — "${hit[0]}"`)
      console.log(`       the site is written against ${EMULATOR_VERSION}; re-run the transcript and fix the page`)
    }

    if (ARCHIVE_LINE.test(line)) continue

    for (const hit of line.matchAll(VERSION_NEAR_BIOS)) {
      if (hit[1].toLowerCase() === BIOS_VERSION.toLowerCase()) continue
      failures++
      console.log(`${relative(ROOT, file)}:${n + 1}  stale BIOS version — "${hit[0].trim()}"`)
      console.log(`       the firmware reports ${BIOS_VERSION}; re-run \`npm run facts\` and fix the page`)
    }
  }
}

if (failures) {
  console.log(`\n${failures} voice problem(s) — see PLAN.md, "Voice & Style"`)
  process.exit(1)
}

console.log('voice: ok')
