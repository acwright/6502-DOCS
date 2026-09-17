#!/usr/bin/env node
//
// Fact-base extractor (PLAN.md, Phase 1, task 1).
//
// Reads the BIOS source — the rank-1 source of truth — and writes the
// machine-readable fact base under `data/`, which the docs consume at build
// time so every table on the site is generated rather than hand-copied.
//
//   node scripts/extract-facts.mjs            # regenerate data/*.json
//   node scripts/extract-facts.mjs --check    # fail if data/ is stale
//
// Both modes also hold samples/lib/6502-VDP.inc, a verbatim copy of 6502-ASM's
// include, to the fact base (`checkInclude`).
//   node scripts/extract-facts.mjs --bios ../6502-BIOS
//
// The BIOS checkout is found via `--bios`, then `$BIOS_SRC`, then
// `~/Developer/Assembly/6502-BIOS`. The generated JSON is committed, so the
// docs build (and CI) never need the BIOS source — only regeneration does.
//
// Every record carries its provenance: `source` names the file and line it was
// read from, and `check` records which verification method backs it (see
// PLAN.md "Verification Method"). Anything read from a README is rank 4 and is
// marked `verified: false` until a RUN-backed sample proves it.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  commentBlockAbove,
  findLabel,
  hex,
  parseDocBlock,
  parseNumber,
  readSource,
  stringConstants
} from './lib/asm.mjs'
import { CP437_NAMES } from './lib/cp437-names.mjs'
import {
  cellText,
  identifiers,
  section,
  spans,
  tableStartingWith,
  tables
} from './lib/markdown.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(ROOT, 'data')

const DEFAULT_BIOS = join(homedir(), 'Developer', 'Assembly', '6502-BIOS')

// ---------------------------------------------------------------------------
// Spelling
// ---------------------------------------------------------------------------

// Most of the prose in the fact base is lifted verbatim from the BIOS source
// and its README, and those are written in British English — "initialised",
// "colours". The docs are written in American English, and a table that says
// "colours" three rows above a chapter that says "colors" reads as two
// different people. Rather than ask the reader to live with that, or ask the
// BIOS to change its house style, every string in the output goes through this
// on the way out.
//
// Whole words only, so identifiers are safe: `TMS_GRAY` and `BAS_WARM` have no
// word boundary where the pattern would need one, and no BIOS symbol is a bare
// British word.
const BRITISH = {
  behaviour: 'behavior',
  centre: 'center',
  centred: 'centered',
  colour: 'color',
  coloured: 'colored',
  colours: 'colors',
  grey: 'gray',
  initialise: 'initialize',
  initialised: 'initialized',
  initialises: 'initializes',
  initialising: 'initializing',
  initialisation: 'initialization',
  labelled: 'labeled',
  recognise: 'recognize',
  recognised: 'recognized',
  recognises: 'recognizes',
  uninitialised: 'uninitialized'
}

const BRITISH_RE = new RegExp(`\\b(${Object.keys(BRITISH).join('|')})\\b`, 'gi')

/** Match the replacement to the case of what it replaces: Colour → Color. */
function americanize(text) {
  return text.replace(BRITISH_RE, (word) => {
    const us = BRITISH[word.toLowerCase()]
    if (word === word.toUpperCase()) return us.toUpperCase()
    if (word[0] === word[0].toUpperCase()) return us[0].toUpperCase() + us.slice(1)
    return us
  })
}

/** Americanize every string in a tree of plain objects, arrays and scalars. */
function americanizeDeep(value) {
  if (typeof value === 'string') return americanize(value)
  if (Array.isArray(value)) return value.map(americanizeDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, americanizeDeep(v)]))
  }
  return value
}

// ---------------------------------------------------------------------------
// Kernal jump table  ($A000-$A0FF)
// ---------------------------------------------------------------------------

const JUMP_TABLE_BASE = 0xa000
const SLOT_SIZE = 3

function extractKernal(src) {
  const { lines } = src.kernal
  const slots = []
  let group = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const heading = line.match(/^;\s*---\s*(.+?)\s*---\s*$/)
    if (heading) {
      group = heading[1]
      continue
    }

    if (/^;\s*Reserved entries/.test(line)) break

    const slot = line.match(
      /^(\w+):\s+jmp\s+(\w+)\s*;\s*\$([0-9A-Fa-f]{4})\s*-\s*(.*)$/
    )
    if (!slot) continue

    const [, name, target, addrText, summary] = slot
    const declared = parseInt(addrText, 16)
    const computed = JUMP_TABLE_BASE + slots.length * SLOT_SIZE

    // Self-check: the comment and the slot's position must agree, or the
    // table has been edited without renumbering.
    if (declared !== computed) {
      throw new Error(
        `Kernal.asm:${i + 1}: slot ${name} documents ${hex(declared)} but sits at ${hex(computed)}`
      )
    }

    slots.push({
      name,
      address: hex(computed),
      addressDecimal: computed,
      slot: slots.length,
      group,
      summary: summary.trim(),
      target,
      ...describeTarget(lines, target),
      source: `Kernal.asm:${i + 1}`,
      check: 'GREP'
    })
  }

  const reserved = readReservedRange(lines)

  // Self-check: the reserved range starts where the published slots end, or the
  // header comment was not updated when entries were added.
  const firstReserved = JUMP_TABLE_BASE + slots.length * SLOT_SIZE
  if (reserved.start !== hex(firstReserved)) {
    throw new Error(
      `${reserved.source}: reserved range documents ${reserved.start} but the ${slots.length} published slots end at ${hex(firstReserved)}`
    )
  }

  return {
    $meta: meta(
      'Kernal jump table',
      'Every published entry point, in slot order, plus the reserved range.',
      [src.kernal]
    ),
    base: hex(JUMP_TABLE_BASE),
    slotSize: SLOT_SIZE,
    publishedSlots: slots.length,
    reserved,
    totalSlots: slots.length + reserved.count,
    groups: [...new Set(slots.map((s) => s.group))],
    slots
  }
}

function describeTarget(lines, target) {
  const at = findLabel(lines, target)
  if (at === -1) return {}

  const doc = parseDocBlock(commentBlockAbove(lines, at))
  return {
    description: doc.summary || undefined,
    input: doc.input.length ? doc.input : undefined,
    output: doc.output.length ? doc.output : undefined,
    modifies: doc.modifies.length ? doc.modifies : undefined,
    notes: doc.notes.length ? doc.notes : undefined
  }
}

function readReservedRange(lines) {
  const header = lines.findIndex((l) => /^;\s*Reserved entries/.test(l))
  const range = lines[header].match(/\$([0-9A-Fa-f]{4})-\$([0-9A-Fa-f]{4})/)
  const repeat = lines
    .slice(header, header + 4)
    .map((l) => l.match(/^\s*\.repeat\s+(\d+)/))
    .find(Boolean)

  return {
    count: repeat ? Number(repeat[1]) : 0,
    start: hex(parseInt(range[1], 16)),
    end: hex(parseInt(range[2], 16)),
    behavior: 'Each reserved slot jumps to UnimplementedStub, which is a bare RTS.',
    source: `Kernal.asm:${header + 1}`,
    check: 'GREP'
  }
}

// ---------------------------------------------------------------------------
// Memory map  (BIOS.cfg segments + BIOS.inc symbols)
// ---------------------------------------------------------------------------

// Regions the linker config cannot describe: it declares `$8000-$9FFF` as ROM
// so the image is padded to 32 KB, but the address decoder maps that window to
// the eight I/O slots and no segment ever loads there.
const RAM_REGIONS = [
  { start: 0x0000, end: 0x00ff, name: 'Zero page', purpose: 'Kernal, BASIC and XModem workspace; $003A-$00FF is unclaimed by the Kernal' },
  { start: 0x0100, end: 0x01ff, name: 'CPU stack', purpose: 'Hardware stack; BASIC keeps its FOR and GOSUB frames here' },
  { start: 0x0200, end: 0x02ff, name: 'Keyboard ring buffer', purpose: '256-byte input buffer filled by the encoders, drained by Chrin' },
  { start: 0x0300, end: 0x03ff, name: 'Kernal variables', purpose: 'Interrupt vectors, the registers saved at BRK, cursor, HW_PRESENT, CF_DISK, BOOT_VECTOR, RTC and filesystem state, BASIC runtime pointers, save-slot owner ID, video console and PICOVDP state' },
  { start: 0x0400, end: 0x05ff, name: 'BASIC line buffers', purpose: 'BAS_LINBUF raw input line ($0400) and BAS_TOKBUF tokenized scratch ($0500)' },
  { start: 0x0600, end: 0x07ff, name: 'CompactFlash sector buffer', purpose: '512-byte sector buffer; any filesystem call clobbers it' },
  { start: 0x0800, end: 0x7fff, name: 'Program RAM', purpose: 'BASIC program text grows up from $0800; variables, then arrays, then the string heap growing down from $8000' }
]

function extractMemoryMap(src) {
  const rom = parseLinkerMemory(src.cfg)
  const symbols = parseIncSymbols(src.inc)

  const inRange = (lo, hi) => (s) => s.isAddress && s.value >= lo && s.value <= hi

  return {
    $meta: meta(
      'Memory map',
      'RAM regions, ROM segments and the I/O window, with every named symbol in each.',
      [src.cfg, src.inc]
    ),
    ram: RAM_REGIONS.map((region) => ({
      ...formatRegion(region),
      symbols: symbols
        .filter(inRange(region.start, region.end))
        .map(publicSymbol),
      source: 'BIOS.inc',
      check: 'GREP'
    })),
    rom,
    io: {
      start: hex(0x8000),
      end: hex(0x9fff),
      note:
        'BIOS.cfg declares this window as a ROM region so the image pads to 32 KB, ' +
        'but no segment loads into it — the address decoder maps it to the eight ' +
        '1 KB I/O slots. See data/hardware.json for the slot assignments.',
      source: 'BIOS.cfg:2',
      check: 'GREP'
    },
    constants: {
      programStart: hex(0x0800),
      memoryTop: hex(0x8000),
      stringHeapTop: hex(0x8000),
      // PROGRAM_START's own line, whose comment gives the span up to $7FFF.
      source: `BIOS.inc:${symbols.find((s) => s.symbol === 'PROGRAM_START')?.line}`,
      check: 'GREP'
    }
  }
}

function parseLinkerMemory(cfg) {
  const regions = []
  let inMemory = false

  cfg.lines.forEach((line, i) => {
    if (/^MEMORY\s*\{/.test(line)) return void (inMemory = true)
    if (inMemory && /^\}/.test(line)) return void (inMemory = false)
    if (!inMemory) return

    const match = line.match(
      /^\s*(\w+):\s*start=\$([0-9A-Fa-f]+),\s*size=\$([0-9A-Fa-f]+)/
    )
    if (!match) return

    const start = parseInt(match[2], 16)
    const size = parseInt(match[3], 16)
    regions.push({
      segment: match[1],
      ...formatRegion({ start, end: start + size - 1, name: match[1] }),
      source: `BIOS.cfg:${i + 1}`,
      check: 'GREP'
    })
  })

  // The KERNAL region's first 256 bytes are the public jump table; the docs
  // need that split, and it is not something the linker config records. The
  // routines run to the region's own end, read from the config rather than
  // typed: 1.x kept the character set at $B800 and ended them at $B7FF, and a
  // hard-coded end outlived the character set's move onto the video card.
  const kernal = regions.find((r) => r.segment === 'KERNAL')
  if (kernal) {
    kernal.subregions = [
      { ...formatRegion({ start: 0xa000, end: 0xa0ff, name: 'Kernal jump table' }), note: 'Public API — call the slot, not the implementation' },
      { ...formatRegion({ start: 0xa100, end: parseInt(kernal.end.slice(1), 16), name: 'Kernal routines' }), note: 'Implementations; addresses are not stable across BIOS releases' }
    ]
  }

  return regions
}

/**
 * Every `SYMBOL := value` / `SYMBOL = value` equate in BIOS.inc.
 *
 * `assigned` records which operator was used. The BIOS uses `:=` for anything
 * that names an address and plain `=` for pure constants (bit masks, protocol
 * bytes, sizes, the version numbers), and that distinction is what separates
 * the memory map from the constants that happen to share its numeric range.
 */
function parseIncSymbols(inc) {
  // BIOS.inc runs the RAM/zero-page map first and the memory-mapped I/O
  // registers after, starting at the "RAM Card | IO 1" banner. Both halves
  // contain `:=` equates with small values — `ST_CMD_READ := $20` is an ATA
  // command, not an address — so the split matters as much as the operator.
  const ioBanner = inc.lines.findIndex((l) => /^; RAM Card \| IO 1/.test(l))
  if (ioBanner === -1) throw new Error('BIOS.inc: cannot find the I/O register section banner')

  const symbols = []

  inc.lines.forEach((line, i) => {
    const match = line.match(
      /^([A-Z][A-Z0-9_]*)\s*(:?=)\s*(\$[0-9A-Fa-f]+|%[01]+|\d+)\s*(?:;\s*(.*))?$/
    )
    if (!match) return

    const value = parseNumber(match[3])
    if (value == null) return

    // A comment too long for one line carries on in comment-only lines
    // indented under it (`VID_MODE` in BIOS 2.0). Read only the first and the
    // description stops mid-sentence.
    let comment = (match[4] ?? '').trim()
    for (let j = i + 1; j < inc.lines.length; j++) {
      const more = inc.lines[j].match(/^\s+;\s*(.*)$/)
      if (!more) break
      comment = `${comment} ${more[1].trim()}`.trim()
    }

    symbols.push({
      symbol: match[1],
      assigned: match[2],
      // Names an address only if it is a `:=` equate in the RAM half of the file.
      isAddress: match[2] === ':=' && i < ioBanner,
      isIoRegister: i > ioBanner,
      value,
      literal: match[3],
      comment,
      line: i + 1
    })
  })

  return symbols
}

function publicSymbol(s) {
  const digits = s.value <= 0xff ? 2 : 4
  // Comments are written `$02-$03 - String pointer (2 bytes)` or just
  // `$0300-$0301`; the leading span is redundant with the parsed address.
  // Only a span that starts at the symbol's own address is that: `VID_MODE`'s
  // comment opens with `$00 = console not set up`, which is a value.
  const lead = s.comment.match(/^\$([0-9A-Fa-f]{2,4})(?:-\$([0-9A-Fa-f]{2,4}))?\s*(?:-\s*)?/)
  const span = lead && parseInt(lead[1], 16) === s.value ? lead : null
  const end = span?.[2]

  return {
    symbol: s.symbol,
    address: hex(s.value, digits),
    end: end ? hex(parseInt(end, 16), digits) : undefined,
    description: (span ? s.comment.slice(span[0].length) : s.comment).trim() || undefined,
    source: `BIOS.inc:${s.line}`
  }
}

function formatRegion({ start, end, name, purpose }) {
  return {
    name,
    start: hex(start),
    end: hex(end),
    size: end - start + 1,
    purpose
  }
}

// ---------------------------------------------------------------------------
// Hardware  (HW_PRESENT bits + I/O slots)
// ---------------------------------------------------------------------------

const SLOT_CHIPS = {
  HW_RAM_L: { slot: 1, chip: 'AS6C4008 banked SRAM (low)', card: 'RAM Card' },
  HW_RAM_H: { slot: 2, chip: 'AS6C4008 banked SRAM (high)', card: 'RAM Card' },
  HW_RTC: { slot: 3, chip: 'DS1511Y', card: 'RTC Card' },
  HW_CF: { slot: 4, chip: 'CompactFlash (8-bit True IDE)', card: 'Storage Card' },
  HW_SC: { slot: 5, chip: 'R65C51 / W65C51 ACIA', card: 'Serial Card' },
  HW_GPIO: { slot: 6, chip: 'W65C22 VIA', card: 'GPIO Card / Input Board' },
  HW_SID: { slot: 7, chip: 'MOS 6581 SID / ARMSID', card: 'Sound Card' },
  HW_VID: { slot: 8, chip: '6502-PICOVDP', card: 'Video Card / VGA Card' }
}

// The sixteen colors a program names with the `TMS_*` symbols: index, the
// symbol (`6502-ASM/6502-VDP.inc`, which the samples include, keeps the
// TMS9918A's names), a name a reader can say out loud, and the RGB the
// PICOVDP shows for it. That is row 0 of the card's default palette (SPEC §11),
// which is 12-bit, so each is the TMS9918A's color to the nearest four bits a
// channel. Read from `6502-EMULATOR/src/core/IO/Video.ts`, `DEFAULT_PALETTE`,
// at the release `data/emulator.json` pins, and the same on the hardware since
// the firmware's palette is that table. The TMS9918A's own 24-bit values are
// the v1 edition's.
const PALETTE_ROW_0 = [
  ['TRANSPARENT', 'Transparent', '#000000'],
  ['BLACK', 'Black', '#000000'],
  ['MED_GREEN', 'Medium green', '#22CC44'],
  ['LT_GREEN', 'Light green', '#66DD77'],
  ['DK_BLUE', 'Dark blue', '#5555EE'],
  ['LT_BLUE', 'Light blue', '#7777FF'],
  ['DK_RED', 'Dark red', '#CC5555'],
  ['CYAN', 'Cyan', '#44EEEE'],
  ['MED_RED', 'Medium red', '#FF5555'],
  ['LT_RED', 'Light red', '#FF7777'],
  ['DK_YELLOW', 'Dark yellow', '#CCBB55'],
  ['LT_YELLOW', 'Light yellow', '#DDCC88'],
  ['DK_GREEN', 'Dark green', '#22AA44'],
  ['MAGENTA', 'Magenta', '#CC55BB'],
  ['GRAY', 'Gray', '#CCCCCC'],
  ['WHITE', 'White', '#FFFFFF']
]

function extractHardware(src) {
  const symbols = parseIncSymbols(src.inc)
  const byName = new Map(symbols.map((s) => [s.symbol, s]))

  const bits = Object.entries(SLOT_CHIPS).map(([symbol, info]) => {
    const s = byName.get(symbol)
    if (!s) throw new Error(`BIOS.inc no longer defines ${symbol}`)
    return {
      symbol,
      bit: Math.log2(s.value),
      mask: s.literal,
      maskHex: hex(s.value, 2),
      ...info,
      description: s.comment.replace(/^Bit \d+:\s*/, ''),
      source: `BIOS.inc:${s.line}`,
      check: 'GREP'
    }
  })

  return {
    $meta: meta(
      'Hardware detection and I/O slots',
      'The HW_PRESENT bitmask set by the Reset probe, and what lives in each 1 KB I/O slot.',
      [src.inc]
    ),
    hwPresent: {
      address: hex(byName.get('HW_PRESENT').value),
      description:
        'Bitmask written by the Reset probe. Bit order matches the I/O slot numbers. ' +
        'Guard your own code against a missing card the way the Kernal guards its own.',
      readFromBasic: 'PEEK(781)',
      readFromMem: 'MEM prints it as HW=$xx',
      source: `BIOS.inc:${byName.get('HW_PRESENT').line}`,
      check: 'GREP'
    },
    slots: bits.map((b) => ({
      ...b,
      ...slotWindow(b.slot),
      registers: registersInSlot(symbols, slotWindow(b.slot))
    })),
    joystick: {
      description:
        'ReadJoystick1 and ReadJoystick2 return the raw VIA port. The port is ' +
        'active low: a held direction or button reads 0, an untouched stick reads $FF.',
      bits: ['R', 'L', 'D', 'U', 'Y', 'X', 'B', 'A'].map((label, i) => ({
        bit: 7 - i,
        label,
        mask: hex(1 << (7 - i), 2)
      })),
      test: 'IF (JOY(1) AND 16) = 0',
      source: 'Kernal.asm ReadJoystick1Impl',
      check: 'GREP'
    },
    colors: {
      description:
        'The text console colors each cell on its own. VID_PEN holds ' +
        '(foreground << 4) | background, and every character printed after it is set ' +
        'takes that pair; what is already on the screen keeps its own.',
      entries: PALETTE_ROW_0.map(([symbol, name, hex], index) => ({
        index,
        symbol: `TMS_${symbol}`,
        name,
        hex
      })),
      source:
        '6502-ASM/6502-VDP.inc (names); 6502-EMULATOR/src/core/IO/Video.ts DEFAULT_PALETTE ' +
        'row 0 and 6502-PICOVDP SPEC.md §11 (RGB)',
      check: 'INSPECT'
    }
  }
}

function slotWindow(slot) {
  const start = 0x8000 + (slot - 1) * 0x400
  return { start: hex(start), end: hex(start + 0x3ff), size: 1024 }
}

function registersInSlot(symbols, window) {
  const lo = parseNumber(window.start)
  const hi = parseNumber(window.end)
  return symbols
    .filter((s) => s.isIoRegister && s.value >= lo && s.value <= hi)
    .map((s) => ({
      symbol: s.symbol,
      address: hex(s.value),
      description: s.comment,
      source: `BIOS.inc:${s.line}`
    }))
}

// ---------------------------------------------------------------------------
// BASIC keywords  (token table + dispatch table + README syntax)
// ---------------------------------------------------------------------------

function extractBasicKeywords(src) {
  const { lines } = src.basic

  const keywords = parseKeywordTable(lines)
  const dispatch = parseDispatchTable(lines)
  // DISK through NVERASE sit above the main dispatch table's range and are
  // routed through BasExtAddrTbl. They are statements despite their tokens
  // falling in the function range. 1.x kept that table in Kernal.asm; 2.0
  // moved it into BASIC.asm and grew it from four entries to fifteen.
  const extended = parseExtendedDispatchTable([src.basic, src.kernal])
  const token = (name) =>
    parseNumber(lines.find((l) => new RegExp(`^${name}\\s`).test(l))?.match(/=\s*(\$[0-9A-Fa-f]+)/)?.[1])
  const memToken = token('TOK_MEM')

  // Every token from TOK_DISK up to the last extended statement must have a
  // handler. A table read from the wrong file comes back empty, and without
  // this the statements quietly become "functions" (which is what happened
  // when BIOS 2.0 moved the table).
  const firstExtended = token('TOK_DISK')
  const lastExtended = token('TOK_NVERASE') ?? token('TOK_FORMAT')
  for (let t = firstExtended; t <= lastExtended; t++) {
    if (!extended.has(t)) {
      throw new Error(`BASIC.asm: extended statement token ${hex(t, 2)} has no handler in BasExtAddrTbl`)
    }
  }

  const readme = readmeBasicForms(src.biosReadme)

  const entries = keywords.map((kw) => {
    const handler = dispatch.get(kw.token) ?? extended.get(kw.token)
    const dispatchable = handler != null && handler !== 'SynErr'
    const isStatement = kw.token <= memToken || extended.has(kw.token)
    const forms = readme.get(kw.name) ?? []

    return {
      name: kw.name,
      token: hex(kw.token, 2),
      tokenDecimal: kw.token,
      kind: !isStatement
        ? 'function'
        : dispatchable
          ? 'statement'
          : 'keyword',
      handler,
      dispatch: !isStatement
        ? undefined
        : extended.has(kw.token)
          ? 'BasExtAddrTbl'
          : 'BasTokenAddrTbl',
      // A statement token whose dispatch slot is SynErr is a syntax particle
      // (TO, THEN, STEP) or an operator (AND, OR, NOT) — it tokenizes, but it
      // cannot start a statement.
      statementUsable: isStatement && dispatchable,
      forms,
      verified: false,
      source: `BASIC.asm:${kw.line}`,
      check: 'GREP'
    }
  })

  const counts = {
    total: entries.length,
    statements: entries.filter((e) => e.kind === 'statement').length,
    keywords: entries.filter((e) => e.kind === 'keyword').length,
    functions: entries.filter((e) => e.kind === 'function').length
  }

  // The counts a release is known to have. A new release has no entry and is
  // not checked; a known one that comes out different means the classification
  // above has drifted, not the ROM.
  const expected = EXPECTED_KEYWORD_COUNTS[BIOS_VERSION]
  if (expected && JSON.stringify(expected) !== JSON.stringify(counts)) {
    throw new Error(
      `basic-keywords: BIOS v${BIOS_VERSION} has ${JSON.stringify(expected)} but this run read ${JSON.stringify(counts)}`
    )
  }

  return {
    $meta: meta(
      'BASIC keywords',
      'Every keyword the tokenizer recognizes, with its token and dispatch. ' +
        'Token, name and dispatch are GREP-verified against BASIC.asm; syntax and ' +
        'description are lifted from the BIOS README (rank 4) and stay verified:false ' +
        'until a RUN-backed sample proves them in Phase 4.',
      [src.basic, src.biosReadme]
    ),
    tokenBase: hex(0x80, 2),
    lastStatementToken: hex(memToken, 2),
    counts,
    limits: readmeLimits(src.biosReadme),
    operatorPrecedence: readmePrecedence(src.biosReadme),
    keywords: entries
  }
}

function parseKeywordTable(lines) {
  const start = lines.findIndex((l) => /^KeywordTbl:/.test(l))
  const entries = []

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*\.byte\s+0\s*$/.test(line)) break

    // `.byte   "LEFT",'$'|$80            ; $C9 LEFT$`
    const match = line.match(
      /^\s*\.byte\s+"([^"]*)",'(.)'\|\$80\s*;\s*\$([0-9A-Fa-f]{2})\s+(\S+)/
    )
    if (!match) continue

    const [, head, tail, tokenText, documented] = match
    const name = head + tail
    const token = parseInt(tokenText, 16)

    // The table's own comment must agree with the spelling it encodes.
    if (documented.toUpperCase() !== name.toUpperCase()) {
      throw new Error(
        `BASIC.asm:${i + 1}: keyword bytes spell ${name} but the comment says ${documented}`
      )
    }

    // Tokens are the table index off TOK_BASE; drift here means a renumber.
    const expected = 0x80 + entries.length
    if (token !== expected) {
      throw new Error(
        `BASIC.asm:${i + 1}: ${name} is entry ${entries.length} (token ${hex(expected, 2)}) but is commented ${hex(token, 2)}`
      )
    }

    entries.push({ name: name.toUpperCase(), token, line: i + 1 })
  }

  return entries
}

function parseDispatchTable(lines) {
  const start = lines.findIndex((l) => /^BasTokenAddrTbl:/.test(l))
  const map = new Map()

  for (let i = start + 1; i < lines.length; i++) {
    const match = lines[i].match(/^\s*\.word\s+(\w+)-1\s*;\s*\$([0-9A-Fa-f]{2})/)
    if (!match) break
    map.set(parseInt(match[2], 16), match[1])
  }

  return map
}

/** Known keyword counts per BIOS release, for the self-check above. */
const EXPECTED_KEYWORD_COUNTS = {
  '2.0': { total: 100, statements: 60, keywords: 9, functions: 31 }
}

/**
 * `BasExtAddrTbl` — the extended statement tokens. Read from the first of
 * `sources` that defines it: `BASIC.asm` in 2.0, `Kernal.asm` in 1.x.
 */
function parseExtendedDispatchTable(sources) {
  const map = new Map()
  const source = sources.find((s) => s.lines.some((l) => /^BasExtAddrTbl:/.test(l)))
  if (!source) return map
  const lines = source.lines
  const start = lines.findIndex((l) => /^BasExtAddrTbl:/.test(l))

  for (let i = start + 1; i < lines.length; i++) {
    const match = lines[i].match(
      /^\s*\.word\s+(\w+)\s*-\s*1\s*;\s*\$([0-9A-Fa-f]{2})/
    )
    if (!match) break
    map.set(parseInt(match[2], 16), match[1])
  }

  return map
}

/**
 * Collect every documented form of every keyword from the BIOS README's BASIC
 * tables. A keyword can have several (`LOAD "name"` and bare `LOAD`), and each
 * keeps the table it came from so the docs can group them.
 */
function readmeBasicForms(readme) {
  const basic = section(readme.lines, '### BASIC')
  const forms = new Map()

  const add = (name, form) => {
    if (!forms.has(name)) forms.set(name, [])
    forms.get(name).push(form)
  }

  for (const table of tables(basic)) {
    const [first, ...rest] = table.header
    if (!['Command', 'Function'].includes(first)) continue

    const hasSyntax = rest[0] === 'Syntax'

    for (const row of table.rows) {
      const names = identifiers(row[0])
      const description = row[hasSyntax ? 2 : 1]
      // The README groups related keywords on one row — `SIN(x)` / `COS(x)` /
      // `TAN(x)`, `LOAD "name"` / `SAVE "name"`. Reading only the first span
      // gave every keyword in such a row the *first* one's syntax, so COS was
      // documented as `SIN(x)` and SAVE as `LOAD "name"`. When the spans line
      // up one-to-one with the names, pair them; otherwise take the whole cell,
      // which is also what rescues a syntax line split around an escaped pipe.
      const cell = hasSyntax ? row[1] : row[0]
      const forms = spans(cell)
      const syntaxFor = (index) =>
        forms.length === names.length ? forms[index] : cellText(cell)

      names.forEach((name, index) => {
        add(name, {
          syntax: syntaxFor(index),
          description,
          verified: false,
          source: '6502-BIOS/README.md',
          check: 'pending RUN (Phase 4)'
        })
      })
    }
  }

  return forms
}

function readmeLimits(readme) {
  const basic = section(readme.lines, '### BASIC')
  const quotes = basic
    .filter((l) => l.trim().startsWith('>'))
    .map((l) => l.replace(/^\s*>\s?/, '').trim())
    .filter(Boolean)

  // These were transcribed from the BIOS README and four of them were wrong,
  // which is what Phase 4 found by typing all 85 keywords in and Phase 9 fixed
  // upstream. They now carry the measured values, so the fact base and the
  // README agree — and `check` says which method settled each one rather than
  // claiming the README as the source for numbers the README got wrong.
  return {
    notes: quotes,
    // 14, not 8: a FOR frame is 18 bytes on the hardware stack, so 14 fill
    // page 1, and BasCmdFor has no depth guard — the 15th corrupts the stack
    // and its NEXT reports `?NEXT WITHOUT FOR ERROR`.
    forNestingLevels: 14,
    gosubLevelsGuaranteed: 20,
    variableNames:
      'Any length of letters and digits, first two characters significant; a $ suffix makes it a string. Each name may also be DIMed as a 1-D array.',
    // BIOS 2.0's sixteen new keywords are reserved words like the rest, so a
    // name that begins with one crunches into that token.
    keywordsInNames:
      'A name may not contain a keyword, and 2.0’s keywords count too: a 1.x listing whose names begin VREG, LAYER, SCROLL, SCREEN, SPRITE, PALETTE, VSYNC, VLOAD, VPOKE, VPEEK, VSTAT, NVSAVE, NVLOAD, NVERASE, NVSTAT or NVFIND crunches differently on 2.0.',
    floatBytes: 5,
    significantDigits: 9,
    printZoneWidth: 14,
    source: '6502-BIOS/README.md',
    check: 'RUN (Phase 4, re-measured Phase 9)',
    verified: true
  }
}

function readmePrecedence(readme) {
  const basic = section(readme.lines, '### BASIC')
  const table = tableStartingWith(basic, 'Level')
  if (!table) return []

  return table.rows.map((row, i) => ({
    rank: i + 1,
    level: row[0],
    operators: [...row[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    source: '6502-BIOS/README.md',
    verified: false
  }))
}

// ---------------------------------------------------------------------------
// Errors  (the BASIC error table and messages)
// ---------------------------------------------------------------------------

function extractErrors(src) {
  const basicErrors = parseBasicErrors(src.basic)
  const basicMessages = parseBasicMessages(src.basic)

  return {
    $meta: meta(
      'Error and status messages',
      'Verbatim strings from the ROM. Text is byte-for-byte what the machine prints.',
      [src.basic]
    ),
    basic: {
      format: '?<MESSAGE> ERROR[ IN nnnn]',
      note:
        'Errors print with a leading "?" and, inside a running program, " IN " ' +
        'and the line number.',
      errors: basicErrors
    },
    basicMessages
  }
}

function parseBasicErrors(basic) {
  const { lines } = basic
  const codes = new Map()

  lines.forEach((line, i) => {
    const match = line.match(/^(ERR_[A-Z]+)\s*=\s*(\d+)/)
    if (match && !codes.has(match[1])) {
      codes.set(match[1], { code: Number(match[2]), line: i + 1 })
    }
  })

  const start = lines.findIndex((l) => /^ErrorMessages:/.test(l))
  const errors = []

  for (let i = start + 1; i < lines.length; i++) {
    const match = lines[i].match(/^\s*\.byte\s+"([^"]*)",0\s*;\s*(ERR_\w+)/)
    if (!match) break

    const [, text, symbol] = match
    const known = codes.get(symbol)

    // The table is indexed by error code, so position and equate must agree.
    if (!known || known.code !== errors.length) {
      throw new Error(
        `BASIC.asm:${i + 1}: "${text}" is entry ${errors.length} but ${symbol} = ${known?.code}`
      )
    }

    errors.push({
      code: errors.length,
      symbol,
      text,
      printed: `?${text} ERROR`,
      source: `BASIC.asm:${i + 1}`,
      check: 'GREP'
    })
  }

  return errors
}

function parseBasicMessages(basic) {
  return stringConstants(basic.lines, /^Msg\w+$/, 'BASIC.asm')
}

// ---------------------------------------------------------------------------
// Character set  (PICOVDP font $00)
// ---------------------------------------------------------------------------

// The font's SHA-256 as 6502-PICOVDP SPEC.md §7 states it. "The hash is
// normative": a fixture that hashes differently is not the card's font.
const FONT_00_SHA256 = 'b2adc19efd10870196bad05d84eae51500599935c80f13d608a4f62278260577'

/**
 * All 256 glyphs of the font the video card holds.
 *
 * BIOS 1.x kept the character set in ROM at `$B800` (`Chars.asm`) and copied it
 * into the TMS9918A. In 2.0 the font lives on the PICOVDP as font `$00`, which
 * reset loads into VRAM `$0800`–`$0FFF`, and the BIOS keeps only the bytes it
 * tests against: `tests/fixtures/cp437-font.hex`, sixteen bytes a line. They are
 * the same bytes 1.6 held (SPEC §7), so the rows here do not change.
 *
 * The names came from `Chars.asm`'s comments, which 2.0 no longer has, so they
 * are read from `lib/cp437-names.mjs`, generated once from v1.6.
 */
function extractCharset(src) {
  const bytes = Buffer.from(src.font.text.replace(/\s+/g, ''), 'hex')

  if (bytes.length !== 2048) {
    throw new Error(`cp437-font.hex: ${bytes.length} bytes, expected 2048 (256 glyphs of 8 rows)`)
  }
  const sha = createHash('sha256').update(bytes).digest('hex')
  if (sha !== FONT_00_SHA256) {
    throw new Error(`cp437-font.hex: SHA-256 ${sha} is not font $00's (${FONT_00_SHA256})`)
  }
  if (CP437_NAMES.length !== 256) {
    throw new Error(`lib/cp437-names.mjs: ${CP437_NAMES.length} names, expected 256`)
  }

  const chars = CP437_NAMES.map(([glyph, name], code) => {
    const rows = [...bytes.subarray(code * 8, code * 8 + 8)]
    // SPEC §7: bits 7:2 are the six-pixel cell, and bits 1:0 are always 0.
    if (rows.some((row) => row & 0b11)) {
      throw new Error(`cp437-font.hex: glyph $${hex(code, 2).slice(1)} sets a pixel outside the 6-pixel cell`)
    }
    return { code, hex: hex(code, 2), glyph, name, rows }
  })

  return {
    $meta: meta(
      'Character set',
      'All 256 CP437 glyphs of PICOVDP font $00, eight pixel rows each, as the card loads them.',
      [src.font]
    ),
    font: '$00',
    sha256: FONT_00_SHA256,
    address: hex(0x0800),
    end: hex(0x0fff),
    where: 'VRAM, on the video card: reset loads font $00 there, and InitVideo points the text layer at it',
    bytesPerChar: 8,
    cell: '6 × 8 pixels, glyphs drawn 5 wide and left-aligned in the cell',
    // The boundary that decides what a reader can and cannot PRINT — see
    // ACCURACY.md A17 and A37. It belongs with the glyphs, not with the screen.
    printable: {
      viaChrout: '$20–$7E',
      note:
        'Chrout puts $20 to $7E on the screen and honours four control codes ' +
        '(CR, LF, backspace, bell). Everything else, including every glyph ' +
        'above $7E, it discards. VideoChroutRaw draws any of the 256.',
      rawRoutine: 'VideoChroutRaw',
      source: 'Kernal.asm VideoChroutImpl',
      check: 'GREP + RUN'
    },
    chars
  }
}

// ---------------------------------------------------------------------------
// Boot sequence  (the header, straight from the ROM)
// ---------------------------------------------------------------------------

/**
 * The two lines the machine prints when it starts, and the path it takes there.
 *
 * BIOS 2.0 has no splash and no menu: Reset probes the cards and jumps into
 * BASIC, whose banner prints `AC6502 BIOS v2.0` and `BASIC v2.0 nnnnn BYTES
 * FREE`. The first line is built with `.sprintf` from the version equates,
 * so the header and KernalVersion cannot disagree, and its text is interpolated
 * here the way ca65 interpolates it.
 */
function extractBoot(src) {
  const major = versionEquate(src.inc, 'BIOS_VERSION_MAJOR')
  const minor = versionEquate(src.inc, 'BIOS_VERSION_MINOR')
  const { lines } = src.basic

  const labelled = (label) => {
    const at = findLabel(lines, label)
    if (at === -1) throw new Error(`BASIC.asm: no ${label} — the header has moved`)
    // The label sits on its own line with the `.byte` directive under it.
    const i = /\.byte/.test(lines[at]) ? at : at + 1
    return { line: lines[i], source: `BASIC.asm:${i + 1}` }
  }

  const header = labelled('MsgHeader')
  const sprintf = header.line.match(
    /\.sprintf\("([^"]*)",\s*BIOS_VERSION_MAJOR,\s*BIOS_VERSION_MINOR\)/
  )
  const title = sprintf
    ? sprintf[1].replace('%d.%d', `${major}.${minor}`)
    : header.line.match(/"([^"]*)"/)?.[1]
  if (title == null) throw new Error(`${header.source}: cannot read the header text`)

  const basicLine = labelled('MsgBasicV2')
  const freeLine = labelled('MsgBytesFreeNL')
  const text = (l) => l.line.match(/"([^"]*)"/)?.[1]

  const strings = [
    {
      symbol: 'MsgHeader',
      text: title,
      ...(sprintf ? { derivedFrom: 'BIOS_VERSION_MAJOR/MINOR' } : {}),
      source: header.source,
      check: 'GREP'
    },
    { symbol: 'MsgBasicV2', text: text(basicLine), source: basicLine.source, check: 'GREP' },
    { symbol: 'MsgBytesFreeNL', text: text(freeLine), source: freeLine.source, check: 'GREP' }
  ]

  const versionInHeader = title.match(/v(\d+)\.(\d+)/)
  const versionLines = ['BIOS_VERSION_MAJOR', 'BIOS_VERSION_MINOR'].map(
    (symbol) => src.inc.lines.findIndex((l) => new RegExp(`^${symbol}\\s*=`).test(l)) + 1
  )

  return {
    $meta: meta('Boot sequence', 'Version, the header, and the path from reset to the BASIC prompt.', [
      src.inc,
      src.kernal,
      src.basic
    ]),
    version: {
      major,
      minor,
      string: `v${major}.${minor}`,
      source: `BIOS.inc:${versionLines.join('-')}`,
      check: 'GREP'
    },
    // The header is assembled from the version equates upstream, so it cannot
    // drift — but the check stays, because it is what would notice if that
    // ever got typed back into a literal.
    headerMatchesVersion:
      versionInHeader != null &&
      Number(versionInHeader[1]) === major &&
      Number(versionInHeader[2]) === minor,
    headerDerivedFromVersion: Boolean(sprintf),
    // What a reader sees, with the byte count left as a placeholder: it is
    // whatever memory is free, and that is not a fact about the ROM.
    header: [title, `${text(basicLine)}nnnnn${text(freeLine)}`],
    strings,
    sequence: resetSequence(src)
  }
}

/**
 * Reset's steps, each with the line it happens on, read from `Kernal.asm`.
 *
 * Each step is found by the instruction that does it rather than by position,
 * and a step that cannot be found fails the run: the list is prose, but every
 * line of it is anchored to code that has to still be there.
 */
function resetSequence(src) {
  const { lines } = src.kernal
  const start = findLabel(lines, 'Reset')
  if (start === -1) throw new Error('Kernal.asm: no Reset label')

  const find = (pattern, what) => {
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\w+:/.test(lines[i])) break // the next routine: Reset has ended
      if (pattern.test(lines[i])) return `Kernal.asm:${i + 1}`
    }
    throw new Error(`Kernal.asm Reset: cannot find the step "${what}"`)
  }

  const steps = [
    ['Reset the stack pointer to $FF', /^\s*txs\b/],
    ['KernalInit — probe and initialize every card, interrupts still disabled', /jsr\s+KernalInitImpl/],
    ['Beep — guarded, skipped when no SID is fitted', /jsr\s+Beep\b/],
    ['If BOOT_VECTOR ($035B) is non-zero, jmp through it (cartridge takeover)', /jmp\s+\(BOOT_VECTOR\)/],
    ['Halt if neither video nor serial is present — there is no console to boot into', /and\s+#\(HW_VID\s*\|\s*HW_SC\)/],
    ['Mark BASIC cold, so the header prints and the variables clear; the program at $0800 is kept', /stz\s+BAS_WARM/],
    ['cli, then into BASIC, which prints the header on whichever console this machine has', /jmp\s+BasEntry/]
  ]

  return steps.map(([step, pattern]) => ({ step, source: find(pattern, step) }))
}

function versionEquate(inc, symbol) {
  const line = inc.lines.find((l) => new RegExp(`^${symbol}\\s*=`).test(l))
  return Number(line.split('=')[1].trim())
}

// ---------------------------------------------------------------------------
// samples/lib/6502-VDP.inc — held to the fact base, not generated from it
// ---------------------------------------------------------------------------

// The samples assemble against 6502-ASM's `6502-VDP.inc`, copied here verbatim:
// it is the file a reader's `make VDP=1` project includes, so a listing on the
// site is written exactly as the reader's own program would be. It is not
// generated, so it can fall behind a BIOS release — and this is what notices.
// Every Kernal slot, every `HW_*` flag, every I/O register and every palette
// row 0 color the fact base holds must be in the include with the same value,
// and every RAM variable the include names must agree with the memory map.
// (The include leaves out BASIC's and the filesystem's internal variables on
// purpose; those are the BIOS's business.) A disagreement fails the extractor,
// in both modes, because the fix is a new copy of the include and no amount of
// re-extracting makes one.

const INCLUDE = join(ROOT, 'samples', 'lib', '6502-VDP.inc')

/** `name := value` and `name = value` lines whose value is a plain number. */
function includeEquates(text) {
  const values = new Map()
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_]\w*)\s*:?=\s*([$%]?[0-9A-Fa-f]+)\s*(?:;.*)?$/)
    if (!m) continue
    const value = parseNumber(m[2])
    if (value != null) values.set(m[1], value)
  }
  return values
}

function checkInclude(outputs) {
  if (!existsSync(INCLUDE)) return ['samples/lib/6502-VDP.inc is missing']

  const equates = includeEquates(readFileSync(INCLUDE, 'utf-8'))
  const problems = []
  let compared = 0

  const compare = (name, expected, required, what) => {
    const want = typeof expected === 'number' ? expected : parseNumber(expected)
    if (!equates.has(name)) {
      if (required) problems.push(`${what} ${name} is not defined`)
      return
    }
    compared++
    if (equates.get(name) !== want) {
      problems.push(`${what} ${name} is ${hex(equates.get(name))}, the BIOS says ${hex(want)}`)
    }
  }

  for (const slot of outputs['kernal.json'].slots) compare(slot.name, slot.address, true, 'Kernal entry')
  for (const slot of outputs['hardware.json'].slots) {
    compare(slot.symbol, slot.maskHex, true, 'hardware flag')
    for (const reg of slot.registers) compare(reg.symbol, reg.address, true, 'I/O register')
  }
  for (const color of outputs['hardware.json'].colors.entries) compare(color.symbol, color.index, true, 'color')
  for (const region of outputs['memory-map.json'].ram) {
    for (const s of region.symbols) compare(s.symbol, s.address, false, 'RAM variable')
  }
  const version = outputs['boot.json'].version
  compare('BIOS_VERSION_MAJOR', version.major, true, 'version')
  compare('BIOS_VERSION_MINOR', version.minor, true, 'version')

  return problems.length ? problems : compared
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

function meta(title, description, sources) {
  return {
    title,
    description,
    generator: 'scripts/extract-facts.mjs',
    biosVersion: BIOS_VERSION,
    sources: sources.map((s) => ({ file: s.name, sha256: s.sha256 })),
    warning: 'Generated file — edit the BIOS source and re-run the extractor, not this.'
  }
}

let BIOS_VERSION = 'unknown'

function main() {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const biosDir = resolve(
    args[args.indexOf('--bios') + 1] && args.includes('--bios')
      ? args[args.indexOf('--bios') + 1]
      : process.env.BIOS_SRC || DEFAULT_BIOS
  )

  if (!existsSync(join(biosDir, 'BIOS.inc'))) {
    console.error(`extract-facts: no BIOS source at ${biosDir}`)
    console.error('  pass --bios <path>, or set $BIOS_SRC')
    process.exit(1)
  }

  const src = {
    inc: readSource(biosDir, 'BIOS.inc'),
    cfg: readSource(biosDir, 'BIOS.cfg'),
    kernal: readSource(biosDir, 'Kernal.asm'),
    basic: readSource(biosDir, 'BASIC.asm'),
    font: readSource(biosDir, 'tests/fixtures/cp437-font.hex'),
    biosReadme: readSource(biosDir, 'README.md')
  }

  BIOS_VERSION = `${versionEquate(src.inc, 'BIOS_VERSION_MAJOR')}.${versionEquate(src.inc, 'BIOS_VERSION_MINOR')}`

  const outputs = americanizeDeep({
    'boot.json': extractBoot(src),
    'kernal.json': extractKernal(src),
    'memory-map.json': extractMemoryMap(src),
    'hardware.json': extractHardware(src),
    'basic-keywords.json': extractBasicKeywords(src),
    'errors.json': extractErrors(src),
    'charset.json': extractCharset(src)
  })

  mkdirSync(DATA_DIR, { recursive: true })

  const files = Object.entries(outputs).map(([name, value]) => ({
    label: `data/${name}`,
    path: join(DATA_DIR, name),
    content: JSON.stringify(value, null, 2) + '\n',
    note: summarize(name, value)
  }))


  let stale = 0
  for (const file of files) {
    if (check) {
      const current = existsSync(file.path) ? readFileSync(file.path, 'utf-8') : ''
      if (current !== file.content) {
        console.error(`FAIL ${file.label} is out of date`)
        stale++
      } else {
        console.log(`ok   ${file.label}`)
      }
      continue
    }

    mkdirSync(dirname(file.path), { recursive: true })
    writeFileSync(file.path, file.content)
    console.log(`wrote ${file.label}  (${file.note})`)
  }

  const include = checkInclude(outputs)
  if (typeof include === 'number') {
    console.log(`ok   samples/lib/6502-VDP.inc agrees with the fact base (${include} names)`)
  } else {
    for (const problem of include) console.error(`FAIL samples/lib/6502-VDP.inc: ${problem}`)
    console.error('\nthe include disagrees with this BIOS — copy 6502-ASM\'s current 6502-VDP.inc')
    process.exit(1)
  }

  if (check && stale) {
    console.error(`\n${stale} file(s) stale — run: npm run facts`)
    process.exit(1)
  }
  if (check) console.log(`\nfact base current against BIOS v${BIOS_VERSION}`)
}

function summarize(name, value) {
  if (name === 'kernal.json') return `${value.publishedSlots} published + ${value.reserved.count} reserved slots`
  if (name === 'basic-keywords.json') return `${value.counts.total} keywords`
  if (name === 'errors.json') return `${value.basic.errors.length} BASIC errors`
  if (name === 'memory-map.json') return `${value.ram.length} RAM regions, ${value.rom.length} ROM segments`
  if (name === 'hardware.json') return `${value.slots.length} I/O slots`
  if (name === 'boot.json') return `BIOS v${value.version.string.slice(1)}`
  if (name === 'charset.json') return `${value.chars.length} glyphs`
  return ''
}

main()
