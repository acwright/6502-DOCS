// Minimal GitHub-flavoured markdown table reader.
//
// Used to lift the curated reference tables out of `6502-BIOS/README.md`. The
// README is a rank-4 source (PLAN.md "Sources of Truth") — a claim to verify,
// not a fact — so everything read through here is tagged `verified: false` and
// carries its provenance.

/**
 * Return the lines of a `## Heading` / `### Heading` section, stopping at the
 * next heading of the same or higher level.
 */
export function section(lines, heading) {
  const start = lines.findIndex((line) => line.trim() === heading)
  if (start === -1) return []

  const level = heading.match(/^#+/)[0].length
  const end = lines.findIndex(
    (line, i) =>
      i > start && /^#+\s/.test(line) && line.match(/^#+/)[0].length <= level
  )
  return lines.slice(start + 1, end === -1 ? lines.length : end)
}

/** Parse every pipe table in `lines` into `{ header, rows }` objects. */
export function tables(lines) {
  const found = []
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    const isRow = trimmed.startsWith('|') && trimmed.endsWith('|')

    if (!isRow) {
      if (current) found.push(current)
      current = null
      continue
    }

    const cells = splitRow(trimmed)
    if (!current) {
      current = { header: cells, rows: [] }
    } else if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) {
      // The `|---|---|` separator row.
      continue
    } else {
      current.rows.push(cells)
    }
  }

  if (current) found.push(current)
  return found
}

/** Find the first table whose header starts with `first`. */
export function tableStartingWith(lines, first) {
  return tables(lines).find((t) => t.header[0] === first) ?? null
}

function splitRow(line) {
  return line
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

/**
 * Pull the identifiers out of the backticked spans in a table's first cell.
 *
 * `` `LEFT$(s$,n)` / `RIGHT$(s$,n)` `` yields `['LEFT$', 'RIGHT$']`;
 * `` `DEF FN` `` yields `['DEF']`.
 */
export function identifiers(cell) {
  const names = []
  for (const [, span] of cell.matchAll(/`([^`]+)`/g)) {
    const name = span.trim().match(/^([A-Za-z]+\$?|[>@#;])/)
    if (name) names.push(name[1].toUpperCase())
  }
  return [...new Set(names)]
}

/** The literal text of the first backticked span, e.g. `` `SYS <addr>` `` -> `SYS <addr>`. */
export function firstSpan(cell) {
  const match = cell.match(/`([^`]+)`/)
  return match ? match[1].trim() : cell
}

/** Every backticked span in a cell, in order. */
export function spans(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)].map(([, span]) => span.trim())
}

/**
 * A cell's text with its backticks removed and its HTML entities decoded.
 *
 * The BIOS README writes a literal pipe inside a syntax line as `&#124;`, which
 * splits one logical span into two — `` `INPUT ["prompt"{;`&#124;`,}] var …` ``.
 * Reading the first span alone truncates the syntax at the pipe, so anything
 * that cannot pair spans to names has to fall back to the whole cell.
 */
export function cellText(cell) {
  return cell
    .replace(/`/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .trim()
}
