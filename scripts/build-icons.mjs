#!/usr/bin/env node
/**
 * build-icons.mjs — the site's icons, at every size something asks for one.
 *
 * Two problems, one source of artwork:
 *
 * 1. On a Mac, "Add to Dock" was picking up the wrong picture. Everything the
 *    author publishes lives under `acwright.github.io`, and Safari files a
 *    site's icon by host, not by path — so this site, which declared no web app
 *    manifest, inherited the icon of the sibling that does. A manifest with its
 *    own `id` is what makes the two distinguishable.
 *
 * 2. A link posted to Facebook had no picture worth showing. `og:image` was a
 *    root-relative path, which the Open Graph spec does not allow and scrapers
 *    do not reliably resolve, and it pointed at a square, which renders as a
 *    thumbnail beside the text rather than as a card. Hence `og-card.png`, at
 *    the 1.91:1 every scraper wants.
 *
 *   node scripts/build-icons.mjs           redraw every icon
 *   node scripts/build-icons.mjs --check    every icon exists at its declared size (no writes)
 *
 * Same arrangement as `import-photos.mjs`: generating needs ImageMagick and a
 * system font, so it runs on a Mac and the *outputs* are committed. CI only
 * runs `--check`, which reads PNG headers directly and needs nothing at all.
 *
 * `docs/public/favicon.ico` is deliberately not written here. It is copied
 * byte-for-byte out of 6502-ASSETS by `migrate-assets.mjs`, which fails if the
 * two ever differ — so the .ico stays the 16×16 original it has always been and
 * the PNGs below carry the sizes it does not have.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// The square mark: an opaque black tile with the wordmark centered in it,
// already composed as an app icon wants to be.
const MARK = join(REPO, 'assets/branding/6502.png')
// The wordmark alone: white glyphs on transparency, so it composites onto the
// card's white paper without dragging a plate along behind it.
const WORDMARK = join(REPO, 'assets/branding/logo.png')
// The hand-pixeled favicon. Sixteen pixels of deliberate drawing beats any
// downscale of the mark, which turns to mush below about 48px.
const PIXEL = join(REPO, 'assets/branding/favicon.ico')

const FONT = '/System/Library/Fonts/HelveticaNeue.ttc'

const OUT = 'docs/public'

/**
 * Every icon the site serves, what draws it, and the size it must come out at.
 *
 * The size is the contract: `--check` re-reads it from the PNG header, so an
 * icon that got regenerated at the wrong dimensions fails CI rather than
 * quietly shipping blurry.
 */
const ICONS = [
  // ── Browser tab ─────────────────────────────────────────────────────────
  // Straight out of the .ico, and then the same pixels doubled. Nearest-
  // neighbor on purpose: this is pixel art for a machine made of pixels, and a
  // smooth 2× would just be a blurry 16.
  { to: 'icons/favicon-16.png', size: 16, draw: (out) => magick([PIXEL, '-strip', out]) },
  { to: 'icons/favicon-32.png', size: 32, draw: (out) => magick([PIXEL, '-scale', '200%', '-strip', out]) },

  // ── Home screen and Dock ────────────────────────────────────────────────
  // Big enough that the real mark reads, so these come off the artwork.
  { to: 'icons/apple-touch-icon.png', size: 180, draw: (out) => square(180, out) },
  { to: 'icons/icon-192.png', size: 192, draw: (out) => square(192, out) },
  { to: 'icons/icon-512.png', size: 512, draw: (out) => square(512, out) },

  // ── Maskable ────────────────────────────────────────────────────────────
  // Android crops a maskable icon to whatever shape the launcher likes, and
  // guarantees only the inner 80% circle. The wordmark fills 78% of the mark's
  // width, so its corners fall outside that circle and a round launcher would
  // clip the 6 and the 2. Redrawn smaller rather than trusting the crop.
  { to: 'icons/icon-maskable-512.png', size: 512, draw: maskable },

  // ── Link previews ───────────────────────────────────────────────────────
  { to: 'images/og-card.png', size: [1200, 630], draw: ogCard }
]

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function magick(args) {
  const result = spawnSync('magick', args, { encoding: 'utf-8' })
  if (result.error) {
    throw new Error('ImageMagick is not installed — `brew install imagemagick`')
  }
  if (result.status !== 0) {
    throw new Error(`magick ${args.join(' ')} failed:\n${(result.stderr || '').trim()}`)
  }
}

/** The mark, straight down to `size`. */
function square(size, out) {
  magick([MARK, '-resize', `${size}x${size}`, '-colorspace', 'sRGB', '-strip', out])
}

/** The mark redrawn with the wordmark small enough to survive a circular crop. */
function maskable(out) {
  const SIZE = 512
  // 60% of the width leaves the glyph corners at a radius of 0.33 of the icon,
  // comfortably inside the 0.40 the safe zone guarantees.
  const WIDTH = Math.round(SIZE * 0.6)
  magick([
    '-size', `${SIZE}x${SIZE}`, 'xc:black',
    // Trimming the mark against its own black tile leaves the wordmark alone.
    '(', MARK, '-fuzz', '5%', '-trim', '+repage', '-resize', `${WIDTH}x`, ')',
    '-gravity', 'center', '-composite',
    '-colorspace', 'sRGB', '-strip', out
  ])
}

/**
 * The 1200×630 card a link preview shows.
 *
 * Black on white, like the machine's own screen and like the site's default
 * appearance. Laid out by hand in absolute pixels from the top edge: the
 * numbers are a composition, not a formula, and they want to be readable as
 * one.
 */
function ogCard(out) {
  magick([
    '-size', '1200x630', 'xc:white',

    // The wordmark. `logo.png` is white glyphs on transparency; negating the
    // color channels leaves the alpha alone and gives black glyphs to sit on
    // the white paper.
    '(', WORDMARK, '-channel', 'RGB', '-negate', '+channel', '-resize', '620x', ')',
    '-gravity', 'north', '-geometry', '+0+128', '-composite',

    // A short rule, then the title, then what the machine is. A reader
    // scrolling past a shared link gets all three in one glance.
    '-fill', '#000000', '-draw', 'rectangle 520,478 680,481',
    '-font', FONT, '-gravity', 'north',
    '-pointsize', '30', '-kerning', '9', '-annotate', '+5+512', 'ACE DOCUMENTATION',
    '-fill', '#555555', '-pointsize', '23', '-kerning', '0',
    '-annotate', '+0+562', 'A whole 65C02 computer on one board',

    // Scrapers are the least forgiving consumers of any image here, and some
    // of them will not take a grayscale PNG. Force full-color 8-bit.
    '-colorspace', 'sRGB', '-type', 'TrueColor', '-depth', '8', '-strip', out
  ])
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

/** Width and height out of a PNG's IHDR, without decoding the image. */
function pngSize(file) {
  const buf = readFileSync(file)
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
}

// ---------------------------------------------------------------------------

const check = process.argv.includes('--check')
let problems = 0

for (const icon of ICONS) {
  const [w, h] = Array.isArray(icon.size) ? icon.size : [icon.size, icon.size]
  const out = join(REPO, OUT, icon.to)

  if (check) {
    if (!existsSync(out)) {
      problems++
      console.log(`MISS ${OUT}/${icon.to}  — run \`npm run icons\` on a Mac with ImageMagick`)
      continue
    }
    const actual = pngSize(out)
    if (!actual || actual[0] !== w || actual[1] !== h) {
      problems++
      console.log(`SIZE ${OUT}/${icon.to}  — want ${w}×${h}, found ${actual ? actual.join('×') : 'not a PNG'}`)
      continue
    }
    console.log(`ok   ${OUT}/${icon.to}  (${w}×${h}, ${Math.round(statSync(out).size / 1024)} KB)`)
    continue
  }

  if (!existsSync(FONT) && icon.to.endsWith('og-card.png')) {
    problems++
    console.log(`MISS ${icon.to} — font not found: ${FONT}`)
    continue
  }

  mkdirSync(dirname(out), { recursive: true })
  icon.draw(out)

  const actual = pngSize(out)
  if (!actual || actual[0] !== w || actual[1] !== h) {
    problems++
    console.log(`SIZE ${OUT}/${icon.to}  — want ${w}×${h}, drew ${actual ? actual.join('×') : 'not a PNG'}`)
    continue
  }
  console.log(`ok   ${OUT}/${icon.to}  (${w}×${h}, ${Math.round(statSync(out).size / 1024)} KB)`)
}

if (problems) {
  console.log(`\n${problems} icon(s) wrong or missing`)
  process.exit(1)
}

console.log(`\n${ICONS.length} icons ${check ? 'present' : 'drawn'}`)
