#!/usr/bin/env node
/**
 * import-photos.mjs — bring the photographs of real machines into the site.
 *
 * Phase 8 of PLAN.md, tier 3. Everything a camera has to take already exists:
 * each KiCad repo carries one photograph of its machine in `Images/`, and those
 * cover the hero shot for the ACE, the KIM add-on and all three family pages.
 * They are 2–14 MB PNGs of 3000-pixel-wide photographs, which is right for a
 * repo that ships board files and wrong for a page a reader loads on a phone,
 * so they are resized and re-encoded here rather than copied.
 *
 *   node scripts/import-photos.mjs           re-import every photo
 *   node scripts/import-photos.mjs --check    every declared output exists (no writes)
 *
 * The sources live in sibling repos rather than in this one, so the import runs
 * on a machine that has them checked out and the *outputs* are committed. CI
 * only ever runs `--check`, which needs nothing but this repo.
 *
 * Crops are declared, not eyeballed each time: `crop` is `WxH+X+Y` in the
 * source photograph's own pixels, so the same command produces the same picture
 * however many times it is run.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const HOME = process.env.HOME ?? ''
const KICAD = join(HOME, 'Developer/Kicad')
const OUT = 'docs/public/images/photos'

// Wide enough for a full-bleed figure on a retina display, small enough that a
// chapter with three photographs is still a couple of hundred kilobytes.
const WIDTH = 1600
const QUALITY = 82

/**
 * Every photograph the site uses, and where it comes from.
 *
 * `subject` is what the picture shows — it goes in the page's
 * caption, and it is the thing to check when a photo is re-shot.
 */
const PHOTOS = [
  {
    to: 'ace.jpg',
    from: join(KICAD, '6502-ACE/Images/6502-ACE.png'),
    subject: 'A complete ACE from above: the board, its 67 keys, and every connector along the back edge.'
  },
  {
    // The tour chapter walks the board part by part, so it wants the board
    // filling the frame rather than a machine sitting in it.
    to: 'ace-board.jpg',
    from: join(KICAD, '6502-ACE/Images/6502-ACE.png'),
    crop: '3160x1430+95+85',
    subject: 'The top half of the same photograph — the board itself, connectors along the back edge, CPU and ROM in the middle, CF adapter at the right.'
  },
  {
    to: 'ace-keyboard.jpg',
    from: join(KICAD, '6502-ACE/Images/6502-ACE.png'),
    crop: '3030x950+150+1500',
    subject: 'The bottom half — the 67 keys, soldered to the board, with the reset button above Esc.'
  },
  {
    to: 'kim.jpg',
    from: join(KICAD, '6502-KIM/Images/6502-KIM.png'),
    subject: 'The keypad add-on: Keypad Card, Keypad Helper and the 16×2 LCD, wired to a Main Board.'
  },
  {
    // The keypad on its own, for the page that maps every key to what it does.
    to: 'kim-keypad.jpg',
    from: join(KICAD, '6502-KIM/Images/6502-KIM.png'),
    crop: '1620x1700+1900+900',
    subject: 'The 24-key pad close up: 0–F, and the eight command keys down the sides.'
  },
  {
    to: 'cob.jpg',
    from: join(KICAD, '6502-COB/Images/6502-COB.png'),
    subject: 'A populated COB backplane, side on, a dozen cards standing in their slots.'
  },
  {
    to: 'dev.jpg',
    from: join(KICAD, '6502-DEV/Images/6502-DEV.png'),
    subject: 'The DEV rig: Teensy-hosted CPU board with its four control buttons, and the output board with its LCD.'
  },
  {
    to: 'vcs.jpg',
    from: join(KICAD, '6502-VCS/Images/6502-VCS.png'),
    subject: 'A VCS with a ROM cartridge standing in the slot, Main Board and Input Board behind it.'
  },
  {
    // The one photograph that came out of ASSETS rather than a KiCad repo, and
    // the only one showing a machine driving a monitor. Its banner is two major
    // versions stale, which is why it is captioned as an older machine wherever
    // it appears — see ACCURACY.md A9.
    to: 'family-desk.jpg',
    from: join(REPO, 'docs/public/images/6502.png'),
    subject: 'An earlier machine on a desk with a monitor and a separate keyboard, photographed when BASIC still announced itself as v1.0.'
  },
  {
    // Not a board render — an original photograph, so its source lives in
    // assets/photos/ rather than a sibling repo's Images/.
    to: 'everything-connected.jpg',
    from: join(REPO, 'assets/photos/cables.png'),
    subject: 'The cable kit laid out: VGA, audio, power, PS/2, serial null-modem adapter, a joystick, and a CompactFlash card.'
  },
  {
    to: 'cartridge-burn.jpg',
    from: join(REPO, 'assets/photos/cartridge-burn.png'),
    subject: 'An AT28C256 in the ZIF socket of a TL866 programmer, lid open, with a finished cartridge board and its label beside it.'
  },
  {
    // A CoolTerm window rather than a laptop-and-ACE photo — the placeholder
    // wanted a camera; this is the substitute the site actually ships.
    to: 'serial-terminal.jpg',
    from: join(REPO, 'assets/photos/serial-terminal.png'),
    subject: "A CoolTerm window connected over serial: the BIOS banner, BASIC's own banner, and PRINT 2*2 answered with 4."
  }
]

// ---------------------------------------------------------------------------

const check = process.argv.includes('--check')
let problems = 0

function magick(args) {
  const result = spawnSync('magick', args, { encoding: 'utf-8' })
  if (result.error) {
    throw new Error('ImageMagick is not installed — `brew install imagemagick`')
  }
  if (result.status !== 0) {
    throw new Error(`magick ${args.join(' ')} failed:\n${(result.stderr || '').trim()}`)
  }
}

for (const photo of PHOTOS) {
  const out = join(REPO, OUT, photo.to)

  if (check) {
    if (existsSync(out)) {
      const kb = Math.round(statSync(out).size / 1024)
      console.log(`ok   ${OUT}/${photo.to}  (${kb} KB)`)
    } else {
      problems++
      console.log(`MISS ${OUT}/${photo.to}  — run \`npm run photos\` on a machine with ${relative(HOME, photo.from)}`)
    }
    continue
  }

  if (!existsSync(photo.from)) {
    problems++
    console.log(`MISS ${photo.to} — source not found: ${photo.from}`)
    continue
  }

  mkdirSync(dirname(out), { recursive: true })
  magick([
    photo.from,
    ...(photo.crop ? ['-crop', photo.crop, '+repage'] : []),
    // `>` only shrinks: a source smaller than WIDTH is left at its own size
    // rather than upscaled into mush.
    '-resize', `${WIDTH}>`,
    '-strip',
    '-quality', String(QUALITY),
    '-interlace', 'Plane',
    out
  ])

  console.log(`ok   ${OUT}/${photo.to}  (${Math.round(statSync(out).size / 1024)} KB)`)
}

if (problems) {
  console.log(`\n${problems} photo(s) missing — import them with \`npm run photos\``)
  process.exit(1)
}

console.log(`\n${PHOTOS.length} photos ${check ? 'present' : 'imported'}`)
