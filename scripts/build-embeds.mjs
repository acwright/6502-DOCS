#!/usr/bin/env node
/**
 * build-embeds.mjs — the bytes behind every **Run this** button on the site.
 *
 *   npm run embeds          # write data/embeds.json
 *   npm run embeds:verify   # fail if a payload is out of date (CI)
 *
 * A chapter that shows a listing can also offer to run it, in a frame around
 * the emulator. The program travels in the URL rather than being fetched, which
 * makes the snippet self-contained — but it also means the bytes a reader runs
 * are a *copy* of the listing above them, and a copy can drift.
 *
 * So the copy is made here, from the same file under `samples/` that the
 * chapter displays and the harness runs, by the same tools a reader would use:
 * `bastok` for a BASIC listing, `cl65` for an assembly one. Change a listing
 * without re-running this and `--check` turns the build red. A **Run this**
 * button running something other than the printed program is the one failure
 * this whole repository is arranged to prevent.
 *
 * The encoding is URL-safe base64, unpadded — the first of the two alphabets
 * the frame accepts, and the one that survives a query string untouched.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAMPLES = join(ROOT, 'samples')
const OUT = join(ROOT, 'data', 'embeds.json')

/**
 * Every program a chapter offers to run, by its path under `samples/`.
 *
 * Adding one is one line here plus an `<Emulator sample="…">` on the page.
 * Two kinds of sample are deliberately absent:
 *
 * - **Anything that reads a card.** `file-browser`, `high-score` and `notes`
 *   are `console storage` cases: the harness boots them behind a prepared
 *   CompactFlash image, and a frame has a blank one. Carrying a real image in
 *   the URL is not an option either — the smallest one `cffs` makes is a
 *   megabyte, and the URL is where the program lives.
 * - **Anything under `/f18a/`.** The emulator is a faithful TMS9918A and masks
 *   the register writes those chapters are about, so a live machine there would
 *   demonstrate the stock branch and read as if the chapter were wrong.
 */
const EMBEDS = [
  // Getting started, and the chapter that teaches stopping a program: this one
  // is placed *without* being run, because pressing Esc is the exercise.
  'basic/goto-loop.bas',

  // Using your ACE
  'basic/color-loop.bas',

  // The BASIC guide's worked programs — the pages people photocopy.
  'basic/guessing-game.bas',
  'basic/times-table.bas',
  'basic/tune.bas',
  'basic/bouncing-ball.bas',
  'basic/whats-fitted.bas',
  'basic/shopping.bas',
  'basic/treasure.bas',

  // The assembly guide, a program per chapter.
  'assembly/hello.asm',
  'assembly/greeting.asm',
  'assembly/screen.asm',
  'assembly/graphics-1.asm',
  'assembly/graphics-2.asm',
  'assembly/multicolor.asm',
  'assembly/fanfare.asm',
  'assembly/stick.asm',
  'assembly/clock.asm',
  'assembly/ticker.asm',
  'assembly/inventory.asm',
  'assembly/bank-store.asm',
  'assembly/from-basic.bas'
]

/**
 * The starter the embedding section hands the reader.
 *
 * `samples/embed/itch/` is a folder they can zip and upload as it stands, so
 * the page in it needs a real program sitting beside it rather than a
 * placeholder — and the reader's first upload is then a change of filename
 * rather than a build. The program is written here from a listing the harness
 * already runs, so there is no second copy of a game in the repository and no
 * binary in git that nothing produces.
 */
const STARTER = { from: 'basic/treasure.bas', to: 'embed/itch/game.prg' }

// ---------------------------------------------------------------------------
// Building one program
// ---------------------------------------------------------------------------

/** Tokenize a BASIC listing the way `SAVE` would, as a raw image at $0800. */
function tokenize(source, out) {
  const result = spawnSync('bastok', ['-t', '-q', '-o', out, source], { encoding: 'utf-8' })
  if (result.error) throw new Error('bastok is not installed — run `npm run preflight`')
  if (result.status !== 0) {
    throw new Error(`bastok failed:\n${(result.stderr || result.stdout || '').trim()}`)
  }
}

/** Assemble the same way the harness does, so the bytes are the tested bytes. */
function assemble(source, out) {
  const result = spawnSync(
    'cl65',
    [
      '-t', 'none',
      '-C', join(SAMPLES, 'lib', '6502.cfg'),
      '--asm-include-dir', join(SAMPLES, 'lib'),
      '-o', out,
      source
    ],
    { encoding: 'utf-8' }
  )
  if (result.error) throw new Error('cl65 is not installed — run `npm run preflight`')
  if (result.status !== 0) {
    throw new Error(`cl65 failed:\n${(result.stderr || result.stdout || '').trim()}`)
  }
}

/** The program `samples/<rel>` builds into, as bytes. */
function program(rel, scratch) {
  const source = join(SAMPLES, rel)
  if (!existsSync(source)) throw new Error(`samples/${rel} does not exist`)

  const ext = extname(rel)
  const out = join(scratch, rel.replace(/[\/\\]/g, '-') + '.prg')

  if (ext === '.bas') tokenize(source, out)
  else if (ext === '.asm') assemble(source, out)
  else throw new Error(`samples/${rel}: only .bas and .asm can be built into a program`)

  return { bytes: readFileSync(out), built: ext === '.bas' ? 'bastok' : 'cl65' }
}

function build(rel, scratch) {
  const { bytes, built } = program(rel, scratch)

  return {
    source: `samples/${rel}`,
    built,
    bytes: bytes.length,
    // The frame accepts both alphabets; this is the one that needs no escaping.
    prg64: bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

const check = process.argv.includes('--check')
const scratch = mkdtempSync(join(tmpdir(), '6502-embeds-'))

let manifest
let starter
try {
  const programs = {}
  for (const rel of [...EMBEDS].sort()) {
    programs[rel.slice(0, -extname(rel).length)] = build(rel, scratch)
  }

  starter = program(STARTER.from, scratch).bytes

  manifest = {
    $meta: {
      title: 'Programs the site offers to run',
      description:
        'The base64 payload for every sample a chapter can run in a frame around the emulator, ' +
        'built from the same file under samples/ that the chapter displays and the harness ' +
        'executes — bastok for a BASIC listing, cl65 for an assembly one. A listing that changes ' +
        'without its payload changing is a red build, because a Run this button running something ' +
        'other than the printed program is the drift this repository exists to prevent.',
      generator: 'scripts/build-embeds.mjs',
      encoding: 'URL-safe base64, unpadded. Raw image loaded at $0800, no load-address header.',
      starter: `samples/${STARTER.to}, built from samples/${STARTER.from}`,
      warning: 'Generated file — edit the sample and re-run the builder, not this.'
    },
    programs
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

const rendered = JSON.stringify(manifest, null, 2) + '\n'
const current = existsSync(OUT) ? readFileSync(OUT, 'utf-8') : null

const starterFile = join(SAMPLES, STARTER.to)
const currentStarter = existsSync(starterFile) ? readFileSync(starterFile) : null
const starterMatches = currentStarter !== null && currentStarter.equals(starter)

const count = Object.keys(manifest.programs).length

if (check) {
  let stale = 0

  if (current === rendered) {
    console.log(`ok   data/embeds.json  (${count} programs)`)
  } else {
    stale++
    console.log(`DRIFT data/embeds.json — ${current === null ? 'missing' : 'differs from what the samples build'}`)
    if (current !== null) {
      // Name the listings that moved, so the failure says which page to look at.
      const was = JSON.parse(current).programs ?? {}
      for (const [name, entry] of Object.entries(manifest.programs)) {
        if (was[name]?.prg64 !== entry.prg64) {
          console.log(`      ${name} — ${was[name] ? 'the listing changed' : 'new'}`)
        }
      }
      for (const name of Object.keys(was)) {
        if (!(name in manifest.programs)) console.log(`      ${name} — no longer embedded`)
      }
    }
  }

  if (starterMatches) {
    console.log(`ok   samples/${STARTER.to}`)
  } else {
    stale++
    console.log(
      `DRIFT samples/${STARTER.to} — ${currentStarter === null ? 'missing' : `no longer what samples/${STARTER.from} builds`}`
    )
  }

  if (stale) {
    console.log('\nRun `npm run embeds`.')
    process.exit(1)
  }
} else {
  mkdirSync(dirname(OUT), { recursive: true })
  if (current !== rendered) writeFileSync(OUT, rendered)
  console.log(`ok   data/embeds.json  (${count} programs)`)

  mkdirSync(dirname(starterFile), { recursive: true })
  if (!starterMatches) writeFileSync(starterFile, starter)
  console.log(`ok   samples/${STARTER.to}`)
}
