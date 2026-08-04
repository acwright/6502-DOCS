#!/usr/bin/env node
/**
 * build-diagrams.mjs — draw the site's diagrams.
 *
 *   npm run diagrams          # write them
 *   npm run diagrams:verify   # fail if any is out of date (CI)
 *
 * Phase 8 of PLAN.md, tier 2: anything the emulator cannot photograph and a
 * camera should not have to. They are SVG so they stay crisp, diffable and
 * restyleable, and they are written by a script for the same reason the cards
 * are — half of them are `data/` in a different shape, and a hand-drawn memory
 * map is a memory map that goes stale the next time the ROM moves.
 *
 * Output goes to `docs/.vitepress/diagrams/`, not to `public/`: the
 * `<Diagram>` component inlines the file into the page so the drawing inherits
 * the reader's theme. Nothing here carries a colour. Shapes are `currentColor`
 * at a few fixed opacities, text is `currentColor`, and light and dark come out
 * of the same file.
 *
 * The shared vocabulary, styled in `docs/.vitepress/theme/style.css`:
 *
 *   .dg-r .dg-r2 .dg-r3   a block, three weights of shading
 *   .dg-solid + .dg-inv   an inked block and the text that goes on it
 *   .dg-open              an outline with nothing behind it
 *   .dg-t .dg-a .dg-n     a label, an address, a note
 *   .dg-l .dg-dash        a rule, and a dashed one
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { keyboardSvg } from './lib/keyboard.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
const OUT = join(ROOT, 'docs/.vitepress/diagrams')

const facts = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf-8'))

// ---------------------------------------------------------------------------
// Drawing furniture
// ---------------------------------------------------------------------------

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Wrap a drawing in its document, with the arrowhead every flow chart uses. */
function svg({ width, height, title, body }) {
  return [
    `<svg class="dg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"`,
    ` xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`,
    `<title>${esc(title)}</title>`,
    '<defs>',
    '<marker id="dg-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7"',
    ' orient="auto-start-reverse"><path class="dg-head" d="M0 0 L8 4 L0 8 z"/></marker>',
    '</defs>',
    body.filter(Boolean).join('\n'),
    '</svg>',
    ''
  ].join('\n')
}

const rect = (x, y, w, h, cls = 'dg-r', extra = '') =>
  `<rect class="${cls}" x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}"${extra}/>`

const text = (x, y, content, cls = 'dg-t', anchor = 'start') =>
  `<text class="${cls}" x="${r(x)}" y="${r(y)}" text-anchor="${anchor}">${esc(content)}</text>`

const line = (x1, y1, x2, y2, cls = 'dg-l') =>
  `<line class="${cls}" x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}"/>`

const arrow = (x1, y1, x2, y2, cls = 'dg-l') =>
  `<line class="${cls}" x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" marker-end="url(#dg-arrow)"/>`

const path = (d, cls = 'dg-l', extra = '') => `<path class="${cls}" d="${d}"${extra}/>`

/** Round to a tenth: shorter files, and no float noise in the diffs. */
const r = (n) => Math.round(n * 10) / 10

/** A box with a label centred in it, and an optional second line under it. */
function box(x, y, w, h, label, { sub = null, cls = 'dg-r', labelCls = 'dg-t', rx = 3 } = {}) {
  const cy = y + h / 2
  const out = [rect(x, y, w, h, cls, ` rx="${rx}"`)]
  if (sub) {
    out.push(text(x + w / 2, cy - 2, label, labelCls, 'middle'))
    out.push(text(x + w / 2, cy + 14, sub, 'dg-a', 'middle'))
  } else {
    out.push(text(x + w / 2, cy + 5, label, labelCls, 'middle'))
  }
  return out.join('')
}

// ---------------------------------------------------------------------------
// The whole address space
// ---------------------------------------------------------------------------

const hex = (s) => parseInt(String(s).replace('$', ''), 16)

/**
 * The 64 KB address space as one strip, zero page at the bottom.
 *
 * Nothing is to scale — at 64 KB in 700 pixels, zero page is two and a half
 * pixels and the reader learns nothing. Band heights go by the square root of
 * the region's size, clamped, which keeps program RAM visibly the biggest thing
 * on the map without letting the six-byte vector table vanish. Every band
 * carries its real range, so the sizes are readable even where the picture is
 * not.
 */
function memoryMap() {
  const map = facts('memory-map.json')

  const rom = Object.fromEntries(map.rom.map((seg) => [seg.name, seg]))
  const bands = [
    ...map.ram.map((region) => ({
      name: region.name,
      start: region.start,
      end: region.end,
      size: region.size,
      group: 'RAM'
    })),
    {
      name: 'Eight I/O slots',
      start: map.io.start,
      end: map.io.end,
      size: hex(map.io.end) - hex(map.io.start) + 1,
      group: 'I/O',
      cls: 'dg-r3'
    },
    ...['KERNAL', 'CHARS', 'BASIC', 'MONITOR', 'WOZMON', 'VECTORS'].map((name) => ({
      name: { KERNAL: 'Kernal', CHARS: 'Character set', BASIC: 'BASIC', MONITOR: 'Monitor', WOZMON: 'Wozmon', VECTORS: 'Vectors' }[name],
      start: rom[name].start,
      end: rom[name].end,
      size: hex(rom[name].end) - hex(rom[name].start) + 1,
      group: 'ROM',
      cls: 'dg-r2'
    }))
  ]

  const W = 640
  const X = 150
  const BOX = 250
  const TOP = 34
  const PAD = 18

  let y = TOP
  const drawn = []
  for (const band of [...bands].reverse()) {
    const h = Math.min(112, Math.max(30, Math.sqrt(band.size) * 0.85))
    drawn.push({ ...band, y, h })
    y += h
  }
  const bottom = y
  const height = bottom + PAD + 22

  const body = [text(X, TOP - 12, 'The 64K address space', 'dg-t')]

  // One address per boundary, at the line it belongs to. Labelling both ends of
  // every band puts two addresses within a few pixels of each other wherever a
  // band is short, and the map stops being readable exactly where it is
  // densest.
  body.push(text(X - 10, TOP + 5, drawn[0].end, 'dg-a', 'end'))
  for (const band of drawn) {
    body.push(rect(X, band.y, BOX, band.h, band.cls ?? 'dg-r'))
    body.push(text(X + 12, band.y + band.h / 2 + 5, band.name, 'dg-t'))
    body.push(text(X - 10, band.y + band.h + 5, band.start, 'dg-a', 'end'))
    body.push(text(X + BOX + 12, band.y + band.h / 2 + 4, size(band.size), 'dg-n'))
  }

  // The group brackets down the left edge.
  for (const group of ['RAM', 'I/O', 'ROM']) {
    const rows = drawn.filter((b) => b.group === group)
    const top = Math.min(...rows.map((b) => b.y))
    const foot = Math.max(...rows.map((b) => b.y + b.h))
    const x = X - 62
    body.push(path(`M${r(x + 8)} ${r(top)} H${r(x)} V${r(foot)} H${r(x + 8)}`, 'dg-l'))
    body.push(
      `<text class="dg-t" x="${r(x - 8)}" y="${r((top + foot) / 2)}" text-anchor="middle"` +
        ` transform="rotate(-90 ${r(x - 8)} ${r((top + foot) / 2)})">${group}</text>`
    )
  }

  body.push(
    text(
      X,
      bottom + 34,
      'Your program loads at $0800. Everything from $8000 up is cards and ROM.',
      'dg-n'
    )
  )

  return svg({ width: W, height, title: 'The 64K address space, from zero page to the processor vectors', body })
}

const size = (bytes) => (bytes >= 1024 ? `${r(bytes / 1024)} KB` : `${bytes} bytes`)

// ---------------------------------------------------------------------------
// Zero page
// ---------------------------------------------------------------------------

/**
 * All 256 bytes of zero page, one cell each, with the Kernal's own workspace
 * inked in.
 *
 * The boundary is not hard-coded: it is read out of the region's own
 * description in the fact base, and a run fails rather than draws a guess if
 * that sentence ever stops naming an address.
 */
function zeroPage() {
  const region = facts('memory-map.json').ram.find((r) => r.name === 'Zero page')
  const claim = region.purpose.match(/\$([0-9A-F]{2,4})-\$00FF is unclaimed/i)
  if (!claim) {
    throw new Error(
      "zero-page: the fact base no longer says which byte the Kernal's workspace ends at — " +
        `got "${region.purpose}"`
    )
  }
  const free = parseInt(claim[1], 16) & 0xff

  const CELL = 26
  const X = 46
  const TOP = 46
  const W = X + CELL * 16 + 20
  const H = TOP + CELL * 16 + 76

  const body = [text(X, 20, 'Zero page, byte by byte', 'dg-t')]

  for (let lo = 0; lo < 16; lo++) {
    body.push(text(X + lo * CELL + CELL / 2, TOP - 8, lo.toString(16).toUpperCase(), 'dg-a', 'middle'))
  }

  for (let hi = 0; hi < 16; hi++) {
    const y = TOP + hi * CELL
    body.push(text(X - 8, y + CELL / 2 + 4, `$${hi.toString(16).toUpperCase()}0`, 'dg-a', 'end'))
    for (let lo = 0; lo < 16; lo++) {
      const addr = hi * 16 + lo
      body.push(rect(X + lo * CELL, y, CELL, CELL, addr < free ? 'dg-solid' : 'dg-open'))
    }
  }

  const key = TOP + CELL * 16 + 30
  body.push(rect(X, key, 18, 18, 'dg-solid'))
  body.push(text(X + 26, key + 13, `$00–$${(free - 1).toString(16).toUpperCase().padStart(2, '0')} — the Kernal, BASIC, the Monitor and XModem`, 'dg-n'))
  body.push(rect(X, key + 26, 18, 18, 'dg-open'))
  body.push(text(X + 26, key + 39, `$${free.toString(16).toUpperCase().padStart(2, '0')}–$FF — ${256 - free} bytes, yours`, 'dg-n'))

  return svg({ width: W, height: H, title: 'The 256 bytes of zero page, showing which are the Kernal’s and which are yours', body })
}

// ---------------------------------------------------------------------------
// Where BASIC keeps things
// ---------------------------------------------------------------------------

/** Program up from $0800, strings down from $8000, and the gap `FRE(0)` counts. */
function basicMemory() {
  const constants = facts('memory-map.json').constants
  const start = hex(constants.programStart)
  const top = hex(constants.memoryTop)

  const W = 680
  const X = 150
  const BOX = 230
  const TOP = 40

  const rows = [
    { label: 'String heap', h: 74, cls: 'dg-r2', note: 'grows down' },
    { label: 'Free', h: 120, cls: 'dg-open', note: null },
    { label: 'Arrays', h: 54, cls: 'dg-r' },
    { label: 'Variables', h: 54, cls: 'dg-r' },
    { label: 'Your program', h: 96, cls: 'dg-r', note: 'grows up' }
  ]

  let y = TOP
  const body = [text(X, TOP - 14, 'What sits where, between 2048 and 32768', 'dg-t')]
  const placed = []
  for (const row of rows) {
    placed.push({ ...row, y })
    y += row.h
  }
  const bottom = y

  for (const row of placed) {
    body.push(rect(X, row.y, BOX, row.h, row.cls))
    body.push(text(X + 14, row.y + row.h / 2 + 5, row.label, 'dg-t'))
  }

  // The two growth arrows, in the margin beside the blocks they belong to.
  const heap = placed[0]
  const program = placed[4]
  body.push(arrow(X + BOX + 26, heap.y + 12, X + BOX + 26, heap.y + heap.h + 34))
  body.push(text(X + BOX + 36, heap.y + 30, 'strings grow', 'dg-n'))
  body.push(text(X + BOX + 36, heap.y + 46, 'downwards', 'dg-n'))
  body.push(arrow(X + BOX + 26, program.y + program.h - 12, X + BOX + 26, program.y - 34))
  body.push(text(X + BOX + 36, program.y + program.h - 34, 'program, then', 'dg-n'))
  body.push(text(X + BOX + 36, program.y + program.h - 18, 'variables, then arrays', 'dg-n'))

  // The gap between them is the number FRE(0) prints.
  const free = placed[1]
  body.push(path(`M${r(X - 22)} ${r(free.y)} H${r(X - 10)} M${r(X - 22)} ${r(free.y + free.h)} H${r(X - 10)}`, 'dg-l'))
  body.push(line(X - 16, free.y, X - 16, free.y + free.h, 'dg-l dg-dash'))
  body.push(text(X - 28, free.y + free.h / 2, 'FRE(0)', 'dg-t', 'end'))
  body.push(text(X - 28, free.y + free.h / 2 + 16, 'counts this', 'dg-n', 'end'))

  body.push(text(X - 10, TOP + 6, String(top), 'dg-a', 'end'))
  body.push(text(X - 10, bottom - 2, String(start), 'dg-a', 'end'))
  body.push(
    text(X, bottom + 34, 'They grow towards each other. ?OUT OF MEMORY is what you get when they meet.', 'dg-n')
  )

  return svg({ width: W, height: bottom + 52, title: 'How BASIC divides the memory between 2048 and 32768', body })
}

// ---------------------------------------------------------------------------
// The joystick byte
// ---------------------------------------------------------------------------

/** One byte, eight boxes, and the fact that a pressed control reads zero. */
function joystickBits() {
  const joystick = facts('hardware.json').joystick
  const names = {
    R: 'Right', L: 'Left', D: 'Down', U: 'Up',
    Y: 'Button Y', X: 'Button X', B: 'Button B', A: 'Button A'
  }

  const CELL = 68
  const X = 118
  const TOP = 56
  const W = X + CELL * 8 + 64
  const H = TOP + CELL + 200

  const body = [text(X, 24, 'One byte from JOY(1)', 'dg-t')]

  joystick.bits.forEach((bit, i) => {
    const x = X + i * CELL
    body.push(text(x + CELL / 2, TOP - 10, `bit ${bit.bit}`, 'dg-n', 'middle'))
    body.push(rect(x, TOP, CELL, CELL, 'dg-open'))
    body.push(text(x + CELL / 2, TOP + 32, names[bit.label], 'dg-t', 'middle'))
    body.push(text(x + CELL / 2, TOP + 56, bit.mask, 'dg-a', 'middle'))
  })

  // An untouched stick, then the same stick pushed up: the one bit that moves.
  const row = (y, label, bits, note) => {
    const out = [text(X - 12, y + CELL * 0.34, label, 'dg-n', 'end')]
    bits.forEach((value, i) => {
      const x = X + i * CELL
      out.push(rect(x, y, CELL, 40, value ? 'dg-open' : 'dg-solid'))
      out.push(text(x + CELL / 2, y + 27, String(value), value ? 'dg-a' : 'dg-a dg-inv', 'middle'))
    })
    out.push(text(X + CELL * 8 + 14, y + 26, note, 'dg-n'))
    return out.join('')
  }

  body.push(row(TOP + CELL + 30, 'nothing held', [1, 1, 1, 1, 1, 1, 1, 1], '$FF'))
  body.push(row(TOP + CELL + 86, 'pushed up', [1, 1, 1, 0, 1, 1, 1, 1], '$EF'))
  body.push(
    text(X, TOP + CELL + 158, 'A held direction or button reads 0, not 1. That is why the test is', 'dg-n')
  )
  body.push(text(X, TOP + CELL + 176, `${joystick.test}`, 'dg-a'))

  return svg({ width: W, height: H, title: 'The joystick byte: eight bits, and a held control reads zero', body })
}

// ---------------------------------------------------------------------------
// The I/O window
// ---------------------------------------------------------------------------

/** The eight 1 KB slots between $8000 and $9FFF, and the bit that reports each. */
function ioSlots() {
  const hardware = facts('hardware.json')

  const W = 620
  const X = 120
  const BOX = 300
  const ROW = 42
  const TOP = 52

  const body = [
    text(X, 22, 'The hardware window, $8000 to $9FFF', 'dg-t'),
    text(X, 40, 'Eight slots of one kilobyte, one card each', 'dg-n')
  ]

  hardware.slots.forEach((slot, i) => {
    const y = TOP + i * ROW
    body.push(rect(X, y, BOX, ROW - 4, 'dg-r'))
    body.push(text(X - 10, y + 24, slot.start, 'dg-a', 'end'))
    body.push(rect(X + 8, y + 7, 24, 24, 'dg-solid', ' rx="3"'))
    body.push(text(X + 20, y + 24, String(slot.slot), 'dg-a dg-inv', 'middle'))
    body.push(text(X + 42, y + 24, slot.card, 'dg-t'))
    body.push(text(X + BOX + 14, y + 24, slot.chip, 'dg-n'))
  })

  const foot = TOP + hardware.slots.length * ROW
  body.push(
    text(X, foot + 16, `The Reset probe writes one bit per slot to ${hardware.hwPresent.address}, in slot order.`, 'dg-n')
  )
  body.push(text(X, foot + 34, `MEM prints it as HW=$xx; from BASIC it is ${hardware.hwPresent.readFromBasic}.`, 'dg-n'))

  return svg({ width: W, height: foot + 50, title: 'The eight I/O slots between $8000 and $9FFF', body })
}

// ---------------------------------------------------------------------------
// A cartridge in the slot
// ---------------------------------------------------------------------------

/** What a cartridge replaces, and what survives underneath it. */
function cartridgeOverlay() {
  const W = 620
  const COL = 230
  const LEFT = 40
  const RIGHT = W - COL - 40
  const TOP = 62

  // Bottom-up, as the memory map is drawn.
  const rows = [
    { label: 'RAM', addr: '$0000', h: 90 },
    { label: 'I/O slots', addr: '$8000', h: 46 },
    { label: 'Kernal', addr: '$A000', h: 56 },
    { label: 'Character set', addr: '$B800', h: 36 },
    { label: 'BASIC, Monitor, Wozmon', addr: '$C000', h: 92, swap: true }
  ]

  const stacked = []
  let y = TOP
  for (const row of [...rows].reverse()) {
    stacked.push({ ...row, y })
    y += row.h
  }
  const bottom = y

  const body = [
    text(LEFT, 26, 'Normally', 'dg-t'),
    text(RIGHT, 26, 'With a cartridge in the slot', 'dg-t'),
    text(LEFT, 44, 'the top 16K is ROM the machine came with', 'dg-n'),
    text(RIGHT, 44, 'the cartridge answers instead', 'dg-n')
  ]

  // A short band has no room for a label above an address, so those two go side
  // by side instead of stacked.
  const label = (x, row, name, addr, inv) => {
    const t = inv ? 'dg-t dg-inv' : 'dg-t'
    const a = inv ? 'dg-a dg-inv' : 'dg-a'
    if (row.h < 46) {
      return [
        text(x + 12, row.y + row.h / 2 + 5, name, t),
        text(x + COL - 12, row.y + row.h / 2 + 5, addr, a, 'end')
      ]
    }
    return [text(x + 12, row.y + 22, name, t), text(x + 12, row.y + 40, addr, a)]
  }

  for (const row of stacked) {
    body.push(rect(LEFT, row.y, COL, row.h, row.swap ? 'dg-r2' : 'dg-r'))
    body.push(...label(LEFT, row, row.label, row.addr, false))

    const swapped = row.swap
    body.push(rect(RIGHT, row.y, COL, row.h, swapped ? 'dg-solid' : 'dg-r'))
    body.push(...label(RIGHT, row, swapped ? 'Your cartridge' : row.label, swapped ? '$C000–$FFFF' : row.addr, swapped))
    if (swapped) {
      body.push(text(RIGHT + 12, row.y + 64, 'including the reset vectors', 'dg-n dg-inv'))
    }
  }

  const swap = stacked.find((row) => row.swap)
  body.push(arrow(LEFT + COL + 14, swap.y + swap.h / 2, RIGHT - 14, swap.y + swap.h / 2))

  const keep = stacked.find((row) => row.label === 'Kernal')
  body.push(
    path(
      `M${r(LEFT + COL + 14)} ${r(keep.y + keep.h / 2)} H${r(RIGHT - 14)}`,
      'dg-l dg-dash'
    )
  )
  body.push(text((LEFT + COL + RIGHT) / 2, keep.y + keep.h / 2 - 8, 'stays', 'dg-n', 'middle'))

  body.push(
    text(LEFT, bottom + 26, 'The Kernal and the character set survive, so a cartridge still has the jump table.', 'dg-n')
  )

  return svg({ width: W, height: bottom + 44, title: 'What a cartridge replaces, and what stays underneath it', body })
}

// ---------------------------------------------------------------------------
// The card, its disks, and their files
// ---------------------------------------------------------------------------

/** One CompactFlash card holds 256 disks; a disk holds 16 files. */
function cfDisks() {
  const W = 620
  const H = 330

  const body = [
    text(40, 24, 'One card, 256 disks, 16 files each', 'dg-t'),
    box(40, 46, 150, 74, 'CompactFlash', { sub: 'one card', cls: 'dg-r2' })
  ]

  // The card's disks, as a strip with the far end trailing off.
  const stripX = 250
  for (let i = 0; i < 6; i++) {
    body.push(rect(stripX + i * 46, 46, 40, 74, i === 0 ? 'dg-solid' : 'dg-r'))
    if (i < 5) {
      body.push(text(stripX + i * 46 + 20, 88, String(i), i === 0 ? 'dg-a dg-inv' : 'dg-a', 'middle'))
    } else {
      body.push(text(stripX + i * 46 + 20, 88, '…', 'dg-a', 'middle'))
    }
  }
  body.push(text(stripX, 138, 'Disk 0 to disk 255, one megabyte each. DISK n picks one.', 'dg-n'))
  body.push(arrow(200, 83, stripX - 10, 83))

  // One disk, opened up.
  const dirY = 176
  body.push(arrow(stripX + 20, 122, stripX + 20, dirY - 10))
  body.push(rect(stripX - 40, dirY, 300, 108, 'dg-r'))
  body.push(text(stripX - 28, dirY + 24, 'Disk 0', 'dg-t'))
  for (let i = 0; i < 4; i++) {
    const y = dirY + 36 + i * 17
    body.push(line(stripX - 28, y, stripX + 100, y, 'dg-l dg-dash'))
  }
  body.push(text(stripX + 120, dirY + 44, 'Sixteen files.', 'dg-n'))
  body.push(text(stripX + 120, dirY + 62, 'Eight characters, a dot,', 'dg-n'))
  body.push(text(stripX + 120, dirY + 80, 'three more: GAME.PRG.', 'dg-n'))

  body.push(text(40, 176, 'DIR', 'dg-a'))
  body.push(text(40, 196, 'lists the disk', 'dg-n'))
  body.push(text(40, 220, 'DISK 3', 'dg-a'))
  body.push(text(40, 240, 'moves to another', 'dg-n'))
  body.push(text(40, 264, 'FORMAT', 'dg-a'))
  body.push(text(40, 284, 'empties the one', 'dg-n'))
  body.push(text(40, 300, "you're on", 'dg-n'))

  return svg({ width: W, height: H, title: 'A CompactFlash card, its 256 disks, and the sixteen files on a disk', body })
}

// ---------------------------------------------------------------------------
// XModem
// ---------------------------------------------------------------------------

/** The handshake, as it actually goes: the receiver starts it. */
function xmodem() {
  const W = 640
  const LEFT = 120
  const RIGHT = 400
  const TOP = 64

  const steps = [
    { from: 'right', label: 'NAK', note: 'ready when you are' },
    { from: 'left', label: 'SOH  block 1  128 bytes  checksum', note: null },
    { from: 'right', label: 'ACK', note: 'got it, send the next' },
    { from: 'left', label: 'SOH  block 2  …', note: null },
    { from: 'right', label: 'ACK', note: null },
    { from: 'left', label: 'EOT', note: 'that was the last one' },
    { from: 'right', label: 'ACK', note: null }
  ]

  const GAP = 46
  const bottom = TOP + steps.length * GAP + 10

  const body = [
    text(LEFT, 26, 'The sender', 'dg-t', 'middle'),
    text(RIGHT, 26, 'The ACE', 'dg-t', 'middle'),
    text(LEFT, 44, 'your laptop', 'dg-n', 'middle'),
    text(RIGHT, 44, 'waiting in LOAD', 'dg-n', 'middle'),
    line(LEFT, TOP - 8, LEFT, bottom, 'dg-l dg-dash'),
    line(RIGHT, TOP - 8, RIGHT, bottom, 'dg-l dg-dash')
  ]

  steps.forEach((step, i) => {
    const y = TOP + i * GAP
    const leftToRight = step.from === 'left'
    body.push(arrow(leftToRight ? LEFT : RIGHT, y, leftToRight ? RIGHT : LEFT, y))
    body.push(text((LEFT + RIGHT) / 2, y - 8, step.label, 'dg-a', 'middle'))
    // Notes go in the margin, not under the arrow: under the arrow is where the
    // next step's label lives, and the two read as one thing.
    if (step.note) body.push(text(RIGHT + 40, y + 4, step.note, 'dg-n'))
  })

  body.push(
    text(30, bottom + 26, 'A block that arrives damaged is answered with NAK and sent again, up to ten times.', 'dg-n')
  )

  return svg({ width: W, height: bottom + 44, title: 'The XModem handshake between a laptop and the ACE', body })
}

// ---------------------------------------------------------------------------
// The cross-development loop
// ---------------------------------------------------------------------------

/** Editor to machine, by all four routes. */
function toolchain() {
  const W = 660
  const MID = W / 2

  const body = [text(30, 22, 'From your editor to the machine', 'dg-t')]

  // What you write, what builds it, what comes out.
  body.push(box(30, 44, 180, 56, 'Your editor', { sub: '.asm  .bas', cls: 'dg-r' }))
  body.push(box(240, 44, 180, 56, 'cl65 · bastok', { sub: 'assemble, tokenize', cls: 'dg-r' }))
  body.push(box(450, 44, 180, 56, 'build/game.prg', { sub: 'the program', cls: 'dg-solid', labelCls: 'dg-t dg-inv' }))
  body.push(arrow(210, 72, 232, 72))
  body.push(arrow(420, 72, 442, 72))

  // Four ways of getting that one file across.
  const routes = [
    { label: 'The emulator', sub: 'seconds, no cables' },
    { label: 'A CF card', sub: 'cffs, then carry it' },
    { label: 'The serial port', sub: 'XModem, both ways' },
    { label: 'An EEPROM', sub: 'bin2woz · minipro' }
  ]

  const BW = 150
  const GAP = 20
  const ROW = 168
  const RH = 58
  const first = (W - (routes.length * BW + (routes.length - 1) * GAP)) / 2

  // A bus down from the program, along, and into each route.
  body.push(path(`M${r(540)} ${r(100)} V${r(ROW - 34)} H${r(first + BW / 2)}`, 'dg-l'))
  routes.forEach((route, i) => {
    const x = first + i * (BW + GAP)
    body.push(arrow(x + BW / 2, ROW - 34, x + BW / 2, ROW - 6))
    body.push(box(x, ROW, BW, RH, route.label, { sub: route.sub, cls: 'dg-r' }))
    body.push(path(`M${r(x + BW / 2)} ${r(ROW + RH)} V${r(ROW + RH + 30)}`, 'dg-l'))
  })

  // And back together into the machine.
  const busY = ROW + RH + 30
  body.push(line(first + BW / 2, busY, first + (routes.length - 1) * (BW + GAP) + BW / 2, busY))
  body.push(arrow(MID, busY, MID, busY + 28))
  body.push(box(MID - 90, busY + 28, 180, 56, 'Your ACE', { sub: 'or the emulator’s window', cls: 'dg-r2' }))

  body.push(text(30, busY + 110, 'The same .prg every time. Only the way it gets there changes.', 'dg-n'))

  return svg({
    width: W,
    height: busY + 128,
    title: 'The cross-development toolchain, from editor to machine',
    body
  })
}

// ---------------------------------------------------------------------------
// Switching on
// ---------------------------------------------------------------------------

/** The five seconds between the power switch and the prompt. */
function bootFlow() {
  const W = 560
  const X = 150
  const BOX = 260
  const TOP = 30

  const steps = [
    { label: 'Power on', sub: 'or the reset button' },
    { label: 'The Kernal starts', sub: 'clears the screen, sets up the video card' },
    { label: 'It looks for the cards', sub: 'one bit per slot: RAM, clock, disk, serial, sound, video' },
    { label: 'Splash, and five seconds', sub: 'ENTER=BASIC · ESC=MONITOR', cls: 'dg-r2' }
  ]

  const H = 66
  const GAP = 30
  let y = TOP
  const body = []

  steps.forEach((step, i) => {
    body.push(rect(X, y, BOX, H, step.cls ?? 'dg-r'))
    body.push(text(X + 14, y + 26, step.label, 'dg-t'))
    body.push(text(X + 14, y + 46, step.sub, 'dg-n'))
    // The last box does not get an arrow of its own: what follows it is the
    // fork, which draws its own two.
    if (i < steps.length - 1) body.push(arrow(X + BOX / 2, y + H, X + BOX / 2, y + H + GAP))
    else body.push(line(X + BOX / 2, y + H, X + BOX / 2, y + H + GAP - 16))
    y += H + GAP
  })

  // The fork at the end of the countdown.
  const forkY = y
  body.push(rect(40, forkY, 220, H, 'dg-solid'))
  body.push(text(54, forkY + 26, 'BASIC', 'dg-t dg-inv'))
  body.push(text(54, forkY + 46, 'OK, and a beep', 'dg-n dg-inv'))
  body.push(rect(300, forkY, 220, H, 'dg-r'))
  body.push(text(314, forkY + 26, 'The Monitor', 'dg-t'))
  body.push(text(314, forkY + 46, 'a dot, and a cursor', 'dg-n'))

  body.push(path(`M${r(X + BOX / 2)} ${r(forkY - GAP)} V${r(forkY - 16)} H150 V${r(forkY)}`, 'dg-l', ' marker-end="url(#dg-arrow)"'))
  body.push(path(`M${r(X + BOX / 2)} ${r(forkY - GAP)} V${r(forkY - 16)} H410 V${r(forkY)}`, 'dg-l', ' marker-end="url(#dg-arrow)"'))
  body.push(text(142, forkY - 22, 'Enter, or wait', 'dg-n', 'end'))
  body.push(text(418, forkY - 22, 'Esc', 'dg-n'))

  return svg({ width: W, height: forkY + H + 20, title: 'What happens between the power switch and the prompt', body })
}

// ---------------------------------------------------------------------------
// Where a comma puts things
// ---------------------------------------------------------------------------

/** PRINT's zones: fourteen columns wide, three and a bit across the screen. */
function printZones() {
  const COLUMNS = 40
  const ZONE = 14
  const CELL = 15
  const X = 30
  // Low enough that the zone brackets above the first line clear the two
  // lines of heading.
  const TOP = 96
  const ROW = 30
  const W = X + COLUMNS * CELL + 30

  const body = [
    text(X, 22, 'PRINT "A","B","C","D" on a 40-column screen', 'dg-t'),
    text(X, 40, 'A comma jumps to the start of the next zone, and a zone is fourteen columns', 'dg-n')
  ]

  // Two lines of screen, because the fourth zone is where the interesting
  // thing happens.
  const line = (y, letters) => {
    const out = []
    for (let c = 0; c < COLUMNS; c++) {
      const zone = Math.floor(c / ZONE)
      out.push(rect(X + c * CELL, y, CELL, ROW - 4, zone % 2 ? 'dg-r' : 'dg-open'))
      const letter = letters[c]
      if (letter) out.push(text(X + c * CELL + CELL / 2, y + 19, letter, 'dg-a', 'middle'))
    }
    return out
  }

  body.push(...line(TOP, { 0: 'A', [ZONE]: 'B', [ZONE * 2]: 'C' }))
  body.push(...line(TOP + ROW + 8, { 0: 'D' }))

  // The zone boundaries, marked above the first line.
  for (let z = 0; z * ZONE < COLUMNS; z++) {
    const from = X + z * ZONE * CELL
    const to = Math.min(X + (z + 1) * ZONE * CELL, X + COLUMNS * CELL)
    body.push(path(`M${r(from)} ${r(TOP - 8)} V${r(TOP - 14)} H${r(to)} V${r(TOP - 8)}`, 'dg-l'))
    // Labelled by number rather than by width: the third zone is fourteen
    // columns like the others, but the screen ends inside it, so a "14 columns"
    // label over a twelve-column bracket would be its own small lie.
    body.push(text((from + to) / 2, TOP - 20, `zone ${z + 1}`, 'dg-n', 'middle'))
  }

  body.push(
    text(X, TOP + ROW * 2 + 32, 'Three zones fit. The fourth has nowhere to go, so it starts the next line.', 'dg-n')
  )
  body.push(text(X, TOP + ROW * 2 + 50, 'A semicolon does none of this: it prints straight on, with no gap.', 'dg-n'))

  return svg({ width: W, height: TOP + ROW * 2 + 68, title: "PRINT's fourteen-column zones", body })
}

// ---------------------------------------------------------------------------
// The status register
// ---------------------------------------------------------------------------

/** One byte of flags, in the order the Monitor prints them. */
function statusFlags() {
  const flags = [
    { bit: 7, name: 'N', meaning: 'negative' },
    { bit: 6, name: 'V', meaning: 'overflow' },
    { bit: 5, name: '–', meaning: 'unused' },
    { bit: 4, name: 'B', meaning: 'break' },
    { bit: 3, name: 'D', meaning: 'decimal' },
    { bit: 2, name: 'I', meaning: 'no IRQs' },
    { bit: 1, name: 'Z', meaning: 'zero' },
    { bit: 0, name: 'C', meaning: 'carry' }
  ]

  const CELL = 68
  const X = 60
  const TOP = 56
  const W = X + CELL * flags.length + 60

  const body = [text(X, 24, 'P, one bit at a time', 'dg-t')]

  flags.forEach((flag, i) => {
    const x = X + i * CELL
    body.push(text(x + CELL / 2, TOP - 10, `bit ${flag.bit}`, 'dg-n', 'middle'))
    body.push(rect(x, TOP, CELL, CELL, flag.name === '–' ? 'dg-open' : 'dg-r'))
    body.push(text(x + CELL / 2, TOP + 34, flag.name, 'dg-t', 'middle'))
    body.push(text(x + CELL / 2, TOP + 54, flag.meaning, 'dg-n', 'middle'))
  })

  body.push(
    text(X, TOP + CELL + 34, 'The Monitor prints them in this order, a letter where a flag is set:', 'dg-n')
  )
  body.push(text(X, TOP + CELL + 58, '---B-IZC', 'dg-a'))
  body.push(text(X + 110, TOP + CELL + 58, 'break, interrupts off, zero, carry.', 'dg-n'))

  return svg({ width: W, height: TOP + CELL + 80, title: 'The eight flags of the status register', body })
}

// ---------------------------------------------------------------------------
// The jump table
// ---------------------------------------------------------------------------

/** Why a Kernal call goes through a table instead of straight at the code. */
function kernalTable() {
  const kernal = facts('kernal.json')
  const first = kernal.slots[0]

  const W = 660
  const TOP = 60

  const body = [
    text(30, 24, 'What jsr Chrout actually does', 'dg-t'),
    text(30, 42, `${kernal.publishedSlots} slots, ${kernal.slotSize} bytes each, from ${kernal.base}`, 'dg-n')
  ]

  body.push(box(30, TOP, 170, 56, 'Your program', { sub: `jsr ${first.address}`, cls: 'dg-r' }))
  body.push(arrow(200, TOP + 28, 232, TOP + 28))
  body.push(box(232, TOP, 190, 56, 'The jump table', { sub: `jmp ${first.target}`, cls: 'dg-solid', labelCls: 'dg-t dg-inv' }))
  body.push(arrow(422, TOP + 28, 454, TOP + 28))
  body.push(box(454, TOP, 176, 56, 'The routine', { sub: 'somewhere in ROM', cls: 'dg-r' }))

  // The table, a few slots of it, to show that the addresses are fixed.
  const listTop = TOP + 96
  const ROW = 30
  kernal.slots.slice(0, 4).forEach((slot, i) => {
    const y = listTop + i * ROW
    body.push(rect(232, y, 190, ROW - 4, 'dg-r'))
    body.push(text(244, y + 18, slot.address, 'dg-a'))
    body.push(text(318, y + 18, slot.name, 'dg-t'))
  })
  const dots = listTop + 4 * ROW
  body.push(text(244, dots + 16, '…', 'dg-a'))
  body.push(line(232, TOP + 60, 232, dots + 20, 'dg-l dg-dash'))
  body.push(line(422, TOP + 60, 422, dots + 20, 'dg-l dg-dash'))

  body.push(
    text(30, dots + 54, 'The routine moves whenever the ROM is rebuilt. The slot does not — which is the', 'dg-n')
  )
  body.push(text(30, dots + 72, 'whole point of it. Call the slot, never the address you found the code at.', 'dg-n'))

  return svg({ width: W, height: dots + 90, title: 'How a Kernal call reaches the routine', body })
}

// ---------------------------------------------------------------------------
// Chaining an interrupt handler
// ---------------------------------------------------------------------------

/** Putting yourself in front of the Kernal's handler, not instead of it. */
function irqChain() {
  const map = facts('memory-map.json')
  const vars = map.ram.find((region) => region.name === 'Kernal variables')
  const irq = vars.symbols.find((s) => s.symbol === 'IRQ_PTR')
  if (!irq) throw new Error('irq-chain: the fact base has no IRQ_PTR in the Kernal variables')

  const W = 620
  const X = 130
  const BOX = 300
  const H = 56
  const GAP = 30
  const TOP = 46

  const steps = [
    { label: 'A card wants attention', sub: 'a key, a serial byte, the timer' },
    { label: `The processor reads ${irq.address}`, sub: 'whatever address is in there', cls: 'dg-r2' },
    { label: 'Your handler', sub: 'count it, flash something, whatever it is', cls: 'dg-solid' },
    { label: "The Kernal's handler", sub: 'drains the ports into the ring buffer' },
    { label: 'rti', sub: 'back to whatever was running' }
  ]

  let y = TOP
  const body = [text(X, 24, 'One interrupt, two handlers', 'dg-t')]

  steps.forEach((step, i) => {
    const inv = step.cls === 'dg-solid'
    body.push(rect(X, y, BOX, H, step.cls ?? 'dg-r'))
    body.push(text(X + 14, y + 24, step.label, inv ? 'dg-t dg-inv' : 'dg-t'))
    body.push(text(X + 14, y + 42, step.sub, inv ? 'dg-n dg-inv' : 'dg-n'))
    if (i < steps.length - 1) body.push(arrow(X + BOX / 2, y + H, X + BOX / 2, y + H + GAP))
    y += H + GAP
  })

  const mine = TOP + 2 * (H + GAP)
  body.push(path(`M${r(X - 14)} ${r(mine)} H${r(X - 24)} V${r(mine + H)} H${r(X - 14)}`, 'dg-l'))
  body.push(text(X - 34, mine + 24, 'yours,', 'dg-n', 'end'))
  body.push(text(X - 34, mine + 42, 'in front', 'dg-n', 'end'))

  body.push(text(X + BOX + 20, mine + 24, 'Push nothing here.', 'dg-n'))
  body.push(text(X + BOX + 20, mine + 42, "The handler below reads the", 'dg-n'))
  body.push(text(X + BOX + 20, mine + 60, 'stack at a fixed depth.', 'dg-n'))

  body.push(
    text(X, y + 12, 'Save the old address, install yours, jump to the old one when you are done.', 'dg-n')
  )

  return svg({ width: W, height: y + 30, title: 'Chaining your own interrupt handler in front of the Kernal’s', body })
}

// ---------------------------------------------------------------------------
// The keyboard
// ---------------------------------------------------------------------------

function keyboard() {
  const { svg: drawing } = keyboardSvg(join(ROOT, 'assets/keyboard/keyboard-layout.json'), {
    escape: esc,
    className: 'dg keyboard'
  })
  return drawing + '\n'
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

const DIAGRAMS = {
  'memory-map': memoryMap,
  'zero-page': zeroPage,
  'basic-memory': basicMemory,
  'joystick-bits': joystickBits,
  'io-slots': ioSlots,
  'cartridge-overlay': cartridgeOverlay,
  'cf-disks': cfDisks,
  'xmodem': xmodem,
  'toolchain': toolchain,
  'boot-flow': bootFlow,
  'print-zones': printZones,
  'status-flags': statusFlags,
  'kernal-table': kernalTable,
  'irq-chain': irqChain,
  'keyboard': keyboard
}

const check = process.argv.includes('--check')
mkdirSync(OUT, { recursive: true })

let stale = 0
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  const file = join(OUT, `${name}.svg`)
  const drawn = draw()
  const current = existsSync(file) ? readFileSync(file, 'utf-8') : null

  if (check) {
    if (current === drawn) {
      console.log(`ok   diagrams/${name}.svg`)
    } else {
      stale++
      console.log(`DRIFT diagrams/${name}.svg — ${current === null ? 'missing' : 'differs from what the data draws'}`)
    }
    continue
  }

  if (current !== drawn) writeFileSync(file, drawn)
  console.log(`ok   diagrams/${name}.svg`)
}

// A drawing nothing draws is a drawing that will rot.
for (const file of readdirSync(OUT)) {
  if (!file.endsWith('.svg')) continue
  const name = file.slice(0, -4)
  if (!(name in DIAGRAMS)) {
    stale++
    console.log(`EXTRA diagrams/${file} — no function draws this`)
  }
}

if (stale) {
  console.log(`\n${stale} diagram(s) out of date — run \`npm run diagrams\``)
  process.exit(1)
}

console.log(`\n${Object.keys(DIAGRAMS).length} diagrams ${check ? 'current' : 'drawn'}`)
