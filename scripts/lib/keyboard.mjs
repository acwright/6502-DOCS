// The ACE's keyboard, drawn from the KLE layout migrated in Phase 2.
//
// Lives here rather than in one script because two things draw it: the
// printable keyboard-layout card, and the keyboard chapter's diagram. Same
// geometry, same legends, different stylesheet.
//
// The `.svg` that came with the layout is unusable: keyboard-layout-editor.com's
// SVG export draws the keycaps and **omits every legend**, so it is 40 KB of
// blank rectangles. Only the `.png` carried the labels, and both consumers want
// something that prints at the printer's resolution and follows the grayscale.
//
// So the picture is drawn from the JSON, which is the actual source: KLE puts
// one unit at 54 px, keys are 52 px with a 1 px margin, and a bare object
// before a legend sets the width (`w`), the gap in front of it (`x`) and the
// row offset (`y`) for the key that follows.

import { readFileSync } from 'node:fs'

const U = 54
const GAP = 1
const CAP = 52

// The board is two-tone: white caps for everything that types a character, dark
// caps for the modifiers and the keys down the right-hand side. The spacebar is
// white and `\` is white; every other non-typing key is dark.
//
// This does *not* come from the layout file's `c` values. Those are the KLE
// mock-up's colors, and the keyboard that got built doesn't match them — KLE
// has a dark spacebar and a light Tab, the board has the opposite. The photo in
// the keyboard chapter is the machine, so the machine wins.
const DARK = new Set([
  'Esc',
  'Backspace',
  'Tab',
  'Insert',
  'Caps Lock',
  'Enter',
  'Delete',
  'Shift',
  'Ctrl',
  'Menu',
  'Alt',
  'Fn',
  '↑',
  '↓',
  '←',
  '→'
])

/** Parse the KLE layout into flat `{ x, y, w, legend }` keys, in units. */
export function keyboardKeys(path) {
  const layout = JSON.parse(readFileSync(path, 'utf-8'))
  const keys = []
  let y = 0
  let maxX = 0

  for (const row of layout) {
    if (!Array.isArray(row)) continue // the metadata object at the top
    let x = 0
    let w = 1
    for (const item of row) {
      if (typeof item === 'object') {
        if (item.x) x += item.x
        if (item.y) y += item.y
        if (item.w) w = item.w
        continue
      }
      keys.push({ x, y, w, legend: item })
      x += w
      maxX = Math.max(maxX, x)
      w = 1
    }
    y += 1
  }

  return { keys, width: Math.round(maxX * U + GAP), height: Math.round(y * U + GAP) }
}

/**
 * Draw the layout as an SVG.
 *
 * `escape` is passed in so each caller keeps its own escaping — the card's
 * `esc()` also lets a few entities through, and the site's does not.
 */
export function keyboardSvg(path, { escape, className = 'keyboard' } = {}) {
  const { keys, width, height } = keyboardKeys(path)

  const parts = [
    `<svg class="${className}" viewBox="0 0 ${width} ${height}" role="img" aria-label="The ACE's ${keys.length}-key layout">`,
    `<rect x="0" y="0" width="${width}" height="${height}" class="kb-plate"/>`
  ]

  for (const key of keys) {
    const kx = Math.round(key.x * U + GAP)
    const ky = Math.round(key.y * U + GAP)
    const kw = Math.round(key.w * U - GAP * 2)
    // A legend is one or two lines: KLE writes "shifted\nunshifted", and the
    // unshifted character is the one printed on the front of the cap.
    const lines = key.legend.split('\n').filter((l) => l !== '')
    const cx = kx + kw / 2
    const text = lines.map((line, i) => {
      const ty = lines.length === 1 ? ky + CAP / 2 + 4 : ky + 16 + i * 17
      const cls = lines.length === 1 || i === 1 ? 'kb-legend' : 'kb-legend kb-legend-shift'
      return `<text class="${cls}" x="${cx}" y="${ty}">${escape(line)}</text>`
    })
    // The shade goes on the group rather than the cap, so a stylesheet that
    // wants it can reach both the cap and its legend, and one that doesn't —
    // the printable card, which stays white-on-black for the toner — ignores it.
    const shade = DARK.has(key.legend) ? ' class="kb-key-dark"' : ''
    parts.push(
      `<g${shade}><rect class="kb-cap" x="${kx}" y="${ky}" width="${kw}" height="${CAP}" rx="5"/>${text.join('')}</g>`
    )
  }

  parts.push('</svg>')
  return { svg: parts.join('\n'), count: keys.length }
}
