// Small parsing helpers shared by the fact-base extractors.
//
// Everything here works on ca65 source as plain text. The BIOS is the rank-1
// source of truth (see PLAN.md), so these parsers deliberately read the source
// rather than the assembled binary or any prose about it.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Read a BIOS source file, returning its text, its lines, and a content hash. */
export function readSource(biosDir, name) {
  const path = join(biosDir, name)
  const text = readFileSync(path, 'utf-8')
  return {
    name,
    path,
    text,
    lines: text.split('\n'),
    sha256: createHash('sha256').update(text).digest('hex')
  }
}

/** `$A0FF` / `$1800` / `%10000000` / `42` -> Number. Returns null if unparseable. */
export function parseNumber(token) {
  if (token == null) return null
  const t = String(token).trim()
  if (/^\$[0-9A-Fa-f]+$/.test(t)) return parseInt(t.slice(1), 16)
  if (/^%[01]+$/.test(t)) return parseInt(t.slice(1), 2)
  if (/^\d+$/.test(t)) return parseInt(t, 10)
  return null
}

/** Format a number as a 4-digit (or 2-digit for zero page) `$xxxx` address. */
export function hex(value, digits = 4) {
  return '$' + value.toString(16).toUpperCase().padStart(digits, '0')
}

/**
 * Collect the run of `;` comment lines above `index`, with the leading `; `
 * stripped and `; ====` rules dropped.
 *
 * Blank lines between the block and the label are skipped — the Monitor puts
 * one there, the Kernal does not — but a blank line inside the run ends it, so
 * a routine never picks up the comment belonging to the one above it.
 */
export function commentBlockAbove(lines, index) {
  const block = []
  let i = index - 1

  while (i >= 0 && lines[i].trim() === '') i--

  for (; i >= 0; i--) {
    if (!/^\s*;/.test(lines[i])) break
    const text = lines[i].replace(/^\s*;\s?/, '').trimEnd()
    if (/^[=-]{4,}$/.test(text.trim())) continue
    block.unshift(text)
  }

  return block
}

/** Find the line index of a `Label:` definition. Returns -1 if absent. */
export function findLabel(lines, label) {
  const re = new RegExp(`^${label}:`)
  return lines.findIndex((line) => re.test(line))
}

/**
 * Split a routine's comment block into its documented fields.
 *
 * The BIOS documents routines as free prose with `Input:` / `Output:` /
 * `Modifies:` lines mixed in; anything that is not one of those becomes a note.
 * Continuation lines (indented under a field) append to that field.
 */
export function parseDocBlock(block) {
  const doc = { summary: '', input: [], output: [], modifies: [], notes: [] }
  let current = null

  for (const raw of block) {
    const line = raw.trim()
    if (!line) {
      current = null
      continue
    }

    const field = line.match(/^(Input|Output|Modifies|Uses|Returns)\s*:\s*(.*)$/i)
    if (field) {
      const key = field[1].toLowerCase()
      current =
        key === 'returns' ? 'output' : key === 'uses' ? 'modifies' : key
      if (field[2]) doc[current].push(field[2].trim())
      continue
    }

    // A continuation of the field we are already inside.
    if (current && /^\s{2,}/.test(raw)) {
      doc[current].push(line)
      continue
    }

    current = null
    if (!doc.summary) {
      // The first prose line is usually `Name — what it does`.
      doc.summary = line.replace(/^\S+\s+[—-]\s+/, '')
    } else {
      doc.notes.push(line)
    }
  }

  return doc
}

/**
 * Render a `.byte` string directive as the text the machine prints.
 *
 * `.byte "LOADED ", 0`        -> `LOADED `
 * `.byte "BREAK",$0D,$0A,0`   -> `BREAK\r\n`
 *
 * The NUL terminator is dropped; CR and LF become their escapes so the value
 * stays readable in JSON while remaining byte-exact.
 */
function renderByteString(line) {
  if (!line || !/\.byte/.test(line)) return null

  const args = line.slice(line.indexOf('.byte') + 5)
  let text = ''

  for (const [, quoted, literal] of args.matchAll(/"([^"]*)"|(\$[0-9A-Fa-f]+|\d+)/g)) {
    if (quoted != null) {
      text += quoted
      continue
    }
    const code = parseNumber(literal)
    if (code === 0) continue
    text += code === 0x0d ? '\\r' : code === 0x0a ? '\\n' : String.fromCharCode(code)
  }

  return text
}

/**
 * Collect `Label:` / `.byte "..."` string constants, either on one line or
 * with the label on the line above.
 */
export function stringConstants(lines, labelPattern, file) {
  const found = []

  lines.forEach((line, i) => {
    if (!/^\s*\.byte\s+"/.test(line) && !/^\w+:\s*\.byte\s+"/.test(line)) return

    const inline = line.match(/^(\w+):\s*\.byte/)
    const above = lines[i - 1]?.match(/^(\w+):\s*$/)
    const symbol = inline?.[1] ?? above?.[1]
    if (!symbol || !labelPattern.test(symbol)) return

    const text = renderByteString(line)
    if (text != null) {
      found.push({ symbol, text, source: `${file}:${i + 1}`, check: 'GREP' })
    }
  })

  return found
}
