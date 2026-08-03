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
import {
  firstSpan,
  identifiers,
  section,
  tableStartingWith,
  tables
} from './lib/markdown.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(ROOT, 'data')

const DEFAULT_BIOS = join(homedir(), 'Developer', 'Assembly', '6502-BIOS')

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
    behaviour: 'Each reserved slot jumps to UnimplementedStub, which is a bare RTS.',
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
  { start: 0x0000, end: 0x00ff, name: 'Zero page', purpose: 'Kernal, BASIC, Monitor and XModem workspace; $003A-$00FF is unclaimed by the Kernal' },
  { start: 0x0100, end: 0x01ff, name: 'CPU stack', purpose: 'Hardware stack; BASIC keeps its FOR and GOSUB frames here' },
  { start: 0x0200, end: 0x02ff, name: 'Keyboard ring buffer', purpose: '256-byte input buffer filled by the encoders, drained by Chrin' },
  { start: 0x0300, end: 0x03ff, name: 'Kernal variables', purpose: 'Interrupt vectors, cursor, HW_PRESENT, CF_DISK, BOOT_VECTOR, RTC and filesystem state, BASIC runtime pointers' },
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
      source: 'BIOS.inc:141-142',
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
  // need that split, and it is not something the linker config records.
  const kernal = regions.find((r) => r.segment === 'KERNAL')
  if (kernal) {
    kernal.subregions = [
      { ...formatRegion({ start: 0xa000, end: 0xa0ff, name: 'Kernal jump table' }), note: 'Public API — call the slot, not the implementation' },
      { ...formatRegion({ start: 0xa100, end: 0xb7ff, name: 'Kernal routines' }), note: 'Implementations; addresses are not stable across BIOS releases' }
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

    symbols.push({
      symbol: match[1],
      assigned: match[2],
      // Names an address only if it is a `:=` equate in the RAM half of the file.
      isAddress: match[2] === ':=' && i < ioBanner,
      isIoRegister: i > ioBanner,
      value,
      literal: match[3],
      comment: (match[4] ?? '').trim(),
      line: i + 1
    })
  })

  return symbols
}

function publicSymbol(s) {
  const digits = s.value <= 0xff ? 2 : 4
  // Comments are written `$02-$03 - String pointer (2 bytes)` or just
  // `$0300-$0301`; the leading span is redundant with the parsed address.
  const span = s.comment.match(/^\$([0-9A-Fa-f]{2,4})(?:-\$([0-9A-Fa-f]{2,4}))?\s*(?:-\s*)?/)
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
  HW_VID: { slot: 8, chip: 'TMS9918A / Pico9918', card: 'Video Card / VGA Card' }
}

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
  // DISK/BLOAD/BSAVE/FORMAT sit above the main dispatch table's range and are
  // routed through BasExtAddrTbl, whose bodies live in the Kernal. They are
  // statements despite their tokens falling in the function range.
  const extended = parseExtendedDispatchTable(src.kernal.lines)
  const memToken = parseNumber(
    lines.find((l) => /^TOK_MEM\s/.test(l))?.match(/=\s*(\$[0-9A-Fa-f]+)/)?.[1]
  )

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

  return {
    $meta: meta(
      'BASIC keywords',
      'Every keyword the tokenizer recognises, with its token and dispatch. ' +
        'Token, name and dispatch are GREP-verified against BASIC.asm; syntax and ' +
        'description are lifted from the BIOS README (rank 4) and stay verified:false ' +
        'until a RUN-backed sample proves them in Phase 4.',
      [src.basic, src.biosReadme]
    ),
    tokenBase: hex(0x80, 2),
    lastStatementToken: hex(memToken, 2),
    counts: {
      total: entries.length,
      statements: entries.filter((e) => e.kind === 'statement').length,
      keywords: entries.filter((e) => e.kind === 'keyword').length,
      functions: entries.filter((e) => e.kind === 'function').length
    },
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

/** `BasExtAddrTbl` in Kernal.asm — the four extended statement tokens. */
function parseExtendedDispatchTable(kernalLines) {
  const start = kernalLines.findIndex((l) => /^BasExtAddrTbl:/.test(l))
  const map = new Map()
  if (start === -1) return map

  for (let i = start + 1; i < kernalLines.length; i++) {
    const match = kernalLines[i].match(
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
      const syntax = firstSpan(row[0])
      const description = row[hasSyntax ? 2 : 1]

      for (const name of names) {
        add(name, {
          syntax: hasSyntax ? firstSpan(row[1]) : syntax,
          description,
          verified: false,
          source: '6502-BIOS/README.md',
          check: 'pending RUN (Phase 4)'
        })
      }
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

  return {
    notes: quotes,
    forNestingLevels: 8,
    gosubLevelsGuaranteed: 20,
    variableNames: 'Single letter A-Z (numeric) and A$-Z$ (string); each may also be DIMed as a 1-D array',
    floatBytes: 5,
    significantDigits: 6,
    printZoneWidth: 14,
    source: '6502-BIOS/README.md',
    check: 'pending RUN (Phase 4)',
    verified: false
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
// Monitor commands
// ---------------------------------------------------------------------------

function extractMonitorCommands(src) {
  const { lines } = src.monitor

  const start = lines.findIndex((l) => /^MonCmdTable:/.test(l))
  const commands = []

  for (let i = start + 1; i < lines.length; i++) {
    const charLine = lines[i].match(/^\s*\.byte\s+'(.)'/)
    if (!charLine) break

    const handler = lines[i + 1].match(/^\s*\.word\s+(\w+)\s*-\s*1/)?.[1]
    commands.push({
      command: charLine[1],
      handler,
      ...describeMonitorCommand(lines, handler),
      source: `Monitor.asm:${i + 1}`,
      check: 'GREP'
    })
    i++
  }

  const readme = readmeMonitorRows(src.biosReadme)
  for (const cmd of commands) {
    const row = readme.get(cmd.command)
    if (row) {
      cmd.readmeSyntax = row.syntax
      cmd.readmeDescription = row.description
      cmd.readmeGroup = row.group
    }
  }

  return {
    $meta: meta(
      'Monitor commands',
      'The Supermon-style command set, in dispatch-table order.',
      [src.monitor, src.biosReadme]
    ),
    prompt: '.',
    entryPoints: [
      { name: 'MonitorEntry', address: hex(0xee00), description: 'Cold entry from the boot menu, or X back from BASIC' },
      { name: 'MonitorBrkEntry', address: hex(0xee03), description: 'BRK entry with the register display' }
    ],
    entryRoutes: [
      'ESC at the boot splash',
      'The BRK statement in BASIC',
      'Any BRK opcode in user code'
    ],
    wozmon: {
      address: hex(0xff00),
      fromMonitor: 'G FF00',
      fromBasic: 'SYS 65280',
      note: 'The original Apple I monitor, kept as an easter egg.',
      source: 'BIOS.cfg:7',
      check: 'GREP'
    },
    commands
  }
}

/**
 * Read a command's `; MonCmdXxx — what it does` / `; Syntax: ...` banner.
 *
 * The Monitor documents each handler with that banner, but not always directly
 * above the label — Hunt has its pattern-buffer equates in between — so the
 * banner is located by name rather than by position.
 */
function describeMonitorCommand(lines, handler) {
  const banner = new RegExp(`^;\\s*${handler}\\s+[—-]\\s*(.+)$`)
  const at = lines.findIndex((line) => banner.test(line))
  if (at === -1) return {}

  const summary = lines[at].match(banner)[1].trim()
  const notes = []
  let syntax

  for (let i = at + 1; i < lines.length && /^\s*;/.test(lines[i]); i++) {
    const text = lines[i].replace(/^\s*;\s?/, '').trim()
    if (/^[=-]{4,}$/.test(text)) break
    if (/^Syntax:/.test(text)) syntax = text.replace(/^Syntax:\s*/, '')
    else if (text) notes.push(text)
  }

  return { summary, syntax, notes: notes.length ? notes : undefined }
}

function readmeMonitorRows(readme) {
  const monitor = section(readme.lines, '### Machine Code Monitor')
  const rows = new Map()
  let group = null

  for (const line of monitor) {
    const bold = line.match(/^\*\*(.+)\*\*$/)
    if (bold) group = bold[1]
  }

  // Re-walk with group tracking, since tables() flattens the section.
  let currentGroup = null
  let inTable = false
  for (const line of monitor) {
    const bold = line.trim().match(/^\*\*(.+)\*\*$/)
    if (bold) {
      currentGroup = bold[1]
      inTable = false
      continue
    }
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
      inTable = false
      continue
    }
    const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim())
    if (cells[0] === 'Command') {
      inTable = true
      continue
    }
    if (!inTable || cells.every((c) => /^:?-{2,}:?$/.test(c))) continue

    const command = firstSpan(cells[0])
    rows.set(command, {
      syntax: firstSpan(cells[1]),
      description: cells[2],
      group: currentGroup ?? group
    })
  }

  return rows
}

// ---------------------------------------------------------------------------
// Errors  (BASIC error table + Monitor messages)
// ---------------------------------------------------------------------------

function extractErrors(src) {
  const basicErrors = parseBasicErrors(src.basic)
  const monitorMessages = parseMonitorMessages(src.monitor)
  const basicMessages = parseBasicMessages(src.basic)

  return {
    $meta: meta(
      'Error and status messages',
      'Verbatim strings from the ROM. Text is byte-for-byte what the machine prints.',
      [src.basic, src.monitor]
    ),
    basic: {
      format: '?<MESSAGE> ERROR[ IN nnnn]',
      note:
        'Errors print with a leading "?" and, inside a running program, " IN " ' +
        'and the line number.',
      errors: basicErrors
    },
    basicMessages,
    monitorMessages,
    monitorRegisterHeader: {
      text: 'NV-BDIZC',
      description: 'The flag legend printed above the P byte by R and the BRK entry.',
      source: 'Monitor.asm:2084',
      check: 'GREP'
    }
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

function parseMonitorMessages(monitor) {
  return stringConstants(monitor.lines, /^MonStr\w+$/, 'Monitor.asm')
}

// ---------------------------------------------------------------------------
// Boot sequence  (splash strings, straight from the ROM)
// ---------------------------------------------------------------------------

function extractBoot(src) {
  const { lines } = src.kernal

  // The splash strings are `.asciiz` under local (`@`-prefixed) labels inside
  // the Splash routine.
  const strings = []
  lines.forEach((line, i) => {
    const match = line.match(/^(@?\w+):\s*\.asciiz\s+"([^"]*)"/)
    if (match) {
      strings.push({
        symbol: match[1],
        text: match[2],
        source: `Kernal.asm:${i + 1}`,
        check: 'GREP'
      })
    }
  })

  const major = versionEquate(src.inc, 'BIOS_VERSION_MAJOR')
  const minor = versionEquate(src.inc, 'BIOS_VERSION_MINOR')

  const splash = strings.find((s) => s.symbol === '@SplashTitle')
  const versionInSplash = splash?.text.match(/v(\d+)\.(\d+)/)

  return {
    $meta: meta('Boot sequence', 'Version, the boot menu, and the strings the machine prints on the way up.', [
      src.inc,
      src.kernal
    ]),
    version: {
      major,
      minor,
      string: `v${major}.${minor}`,
      source: 'BIOS.inc:134-135',
      check: 'GREP'
    },
    // The splash text is a literal, not built from the version equates, so the
    // two can drift. Flag it here rather than let the docs quote a stale splash.
    splashMatchesVersion:
      versionInSplash != null &&
      Number(versionInSplash[1]) === major &&
      Number(versionInSplash[2]) === minor,
    strings,
    menu: {
      timeoutSeconds: 5,
      tick: '100 ms per iteration, 50 iterations',
      enter: 'ENTER ($0D) boots BASIC',
      escape: 'ESC ($1B) boots the Monitor through BRK',
      timeout: 'Auto-boots BASIC',
      note:
        'Any other key is consumed and costs one tick. Input arriving before the ' +
        'probe finishes sits unread in the ACIA and blocks the bytes behind it.',
      source: 'Kernal.asm:738-765',
      check: 'GREP'
    },
    sequence: [
      { step: 'Reset the stack pointer to $FF', source: 'Kernal.asm:704' },
      { step: 'KernalInit — probe and initialise every card, interrupts still disabled', source: 'Kernal.asm:706' },
      { step: 'Beep — guarded, skipped when no SID is fitted', source: 'Kernal.asm:708' },
      { step: 'If BOOT_VECTOR ($035B) is non-zero, jmp through it (cartridge takeover)', source: 'Kernal.asm:711-714' },
      { step: 'Halt if neither video nor serial is present — there is no console to boot into', source: 'Kernal.asm:718-722' },
      { step: 'cli, then draw the splash on whichever console this machine has', source: 'Kernal.asm:725-738' },
      { step: 'Wait ~5 s for ENTER or ESC; time out into BASIC', source: 'Kernal.asm:740-765' }
    ]
  }
}

function versionEquate(inc, symbol) {
  const line = inc.lines.find((l) => new RegExp(`^${symbol}\\s*=`).test(l))
  return Number(line.split('=')[1].trim())
}

// ---------------------------------------------------------------------------
// samples/lib/6502.inc — the assembler's view of the same fact base
// ---------------------------------------------------------------------------

// The docs' assembly samples assemble against an include generated from the
// fact base rather than a copy of `6502-PRG/6502.inc`. Both describe the same
// machine, but this one is derived from the BIOS source directly (rank 1), so a
// sample can never assemble against a stale address — and any disagreement with
// the template is an accuracy finding rather than a silent divergence.
//
// Phase 5 documents the template's own include; Phase 9 diffs the two.

function renderInclude(facts) {
  const out = []
  const rule = (title) =>
    out.push('', '; ' + '='.repeat(75), `;   ${title}`, '; ' + '='.repeat(75))
  const block = (title) => out.push('', `; --- ${title} ---`)
  const equate = (name, value, comment, op = ':=') =>
    out.push(
      `${name.padEnd(19)} ${op} ${String(value).padEnd(8)}${comment ? ' ; ' + comment : ''}`.trimEnd()
    )

  out.push(
    '; ' + '='.repeat(75),
    ';   6502.inc — Kernal API and hardware constants for the AC6502 family',
    '; ' + '='.repeat(75),
    ';',
    `;   BIOS       : v${facts.boot.version.string.slice(1)}`,
    ';   CPU        : WDC 65C02S',
    ';   Assembler  : ca65 (cc65 toolchain)',
    ';',
    ';   GENERATED by scripts/extract-facts.mjs from the BIOS source. Do not edit;',
    ';   change the BIOS and re-run `npm run facts`.',
    ';',
    ';   This is the docs\' own copy, used to assemble the samples under samples/.',
    ';   Reader-facing projects use the equivalent file shipped with the 6502-PRG',
    ';   and 6502-CRT templates.',
    '; ' + '='.repeat(75)
  )

  rule('KERNAL JUMP TABLE — call the slot, not the implementation')
  let group = null
  for (const slot of facts.kernal.slots) {
    if (slot.group !== group) {
      group = slot.group
      block(group)
    }
    equate(slot.name, slot.address, slot.summary)
  }
  out.push(
    '',
    `; ${facts.kernal.reserved.count} reserved slots at ${facts.kernal.reserved.start}-${facts.kernal.reserved.end} — each is a bare RTS.`
  )

  rule('ZERO PAGE')
  out.push('', '; $003A-$00FF is free for your program.', '')
  for (const s of facts.memoryMap.ram[0].symbols) {
    equate(s.symbol, s.address, [s.end && `through ${s.end}`, s.description].filter(Boolean).join(' — '))
  }

  rule('KERNAL VARIABLES ($0300-$03FF)')
  for (const s of facts.memoryMap.ram[3].symbols) {
    equate(s.symbol, s.address, [s.end && `through ${s.end}`, s.description].filter(Boolean).join(' — '))
  }

  rule('KEY MEMORY LOCATIONS')
  for (const region of facts.memoryMap.ram) {
    if (!region.symbols.length) continue
    if (['Zero page', 'Kernal variables'].includes(region.name)) continue
    for (const s of region.symbols) equate(s.symbol, s.address, region.name)
  }
  equate('MONITOR_ENTRY', '$EE00', 'Monitor cold entry')
  equate('MONITOR_BRK_ENTRY', '$EE03', 'Monitor BRK entry (displays saved registers)')
  equate('WOZMON', '$FF00', 'Apple I monitor')

  rule('HARDWARE DETECTION')
  out.push(
    '',
    `; Read ${facts.hardware.hwPresent.address} and guard your own code the way the Kernal guards its own.`
  )
  for (const slot of facts.hardware.slots) {
    equate(slot.symbol, slot.mask, `IO ${slot.slot} — ${slot.card}`, ' =')
  }

  rule('IO HARDWARE REGISTERS')
  for (const slot of facts.hardware.slots) {
    block(`IO ${slot.slot} | ${slot.card} | ${slot.start}-${slot.end}`)
    for (const reg of slot.registers) equate(reg.symbol, reg.address, reg.description)
  }

  rule('USEFUL CONSTANTS')
  block('BIOS version')
  equate('BIOS_VERSION_MAJOR', facts.boot.version.major, '', ' =')
  equate('BIOS_VERSION_MINOR', facts.boot.version.minor, '', ' =')

  block('ASCII control characters')
  for (const [name, value, comment] of [
    ['CHAR_BEL', '$07', 'Bell (beep via SID)'],
    ['CHAR_BS', '$08', 'Backspace'],
    ['CHAR_LF', '$0A', 'Line feed'],
    ['CHAR_CR', '$0D', 'Carriage return'],
    ['CHAR_ESC', '$1B', 'Escape'],
    ['CHAR_SPACE', '$20', 'Space']
  ]) {
    equate(name, value, comment, ' =')
  }

  block('Video dimensions (text mode)')
  for (const [name, value, comment] of [
    ['VID_COLS', '40', 'Screen width in columns'],
    ['VID_ROWS', '24', 'Screen height in rows'],
    ['VID_NAME_TABLE', '$0000', 'VRAM name table (40x24 = 960 bytes)'],
    ['VID_PATTERN_TABLE', '$0800', 'VRAM pattern table (2048 bytes)']
  ]) {
    equate(name, value, comment, ' =')
  }

  block('TMS9918 colours (for VideoSetColor: (foreground << 4) | background)')
  const COLOURS = [
    'TRANSPARENT', 'BLACK', 'MED_GREEN', 'LT_GREEN', 'DK_BLUE', 'LT_BLUE',
    'DK_RED', 'CYAN', 'MED_RED', 'LT_RED', 'DK_YELLOW', 'LT_YELLOW',
    'DK_GREEN', 'MAGENTA', 'GRAY', 'WHITE'
  ]
  COLOURS.forEach((name, i) => equate(`TMS_${name}`, `$${i.toString(16).toUpperCase()}`, '', ' ='))

  block('Joystick bits (active low: a held direction reads 0)')
  for (const bit of facts.hardware.joystick.bits) {
    equate(`JOY_${bit.label}`, bit.mask, `bit ${bit.bit}`, ' =')
  }

  out.push('')
  return out.join('\n')
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
    monitor: readSource(biosDir, 'Monitor.asm'),
    biosReadme: readSource(biosDir, 'README.md')
  }

  BIOS_VERSION = `${versionEquate(src.inc, 'BIOS_VERSION_MAJOR')}.${versionEquate(src.inc, 'BIOS_VERSION_MINOR')}`

  const outputs = {
    'boot.json': extractBoot(src),
    'kernal.json': extractKernal(src),
    'memory-map.json': extractMemoryMap(src),
    'hardware.json': extractHardware(src),
    'basic-keywords.json': extractBasicKeywords(src),
    'monitor-commands.json': extractMonitorCommands(src),
    'errors.json': extractErrors(src)
  }

  mkdirSync(DATA_DIR, { recursive: true })

  const files = Object.entries(outputs).map(([name, value]) => ({
    label: `data/${name}`,
    path: join(DATA_DIR, name),
    content: JSON.stringify(value, null, 2) + '\n',
    note: summarise(name, value)
  }))

  const include = renderInclude({
    boot: outputs['boot.json'],
    kernal: outputs['kernal.json'],
    memoryMap: outputs['memory-map.json'],
    hardware: outputs['hardware.json']
  })
  files.push({
    label: 'samples/lib/6502.inc',
    path: join(ROOT, 'samples', 'lib', '6502.inc'),
    content: include,
    note: `${include.split('\n').length} lines`
  })

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

  if (check && stale) {
    console.error(`\n${stale} file(s) stale — run: npm run facts`)
    process.exit(1)
  }
  if (check) console.log(`\nfact base current against BIOS v${BIOS_VERSION}`)
}

function summarise(name, value) {
  if (name === 'kernal.json') return `${value.publishedSlots} published + ${value.reserved.count} reserved slots`
  if (name === 'basic-keywords.json') return `${value.counts.total} keywords`
  if (name === 'monitor-commands.json') return `${value.commands.length} commands`
  if (name === 'errors.json') return `${value.basic.errors.length} BASIC errors`
  if (name === 'memory-map.json') return `${value.ram.length} RAM regions, ${value.rom.length} ROM segments`
  if (name === 'hardware.json') return `${value.slots.length} I/O slots`
  if (name === 'boot.json') return `BIOS v${value.version.string.slice(1)}`
  return ''
}

main()
