#!/usr/bin/env node
/**
 * migrate-assets.mjs — move 6502-ASSETS into this repo, and prove nothing was
 * left behind.
 *
 * Phase 2 of PLAN.md. The point is not just to copy files: it is to produce the
 * evidence that lets Phase 10 archive the ASSETS repo without wondering what was
 * in it. So the manifest below has to account for *every* path in the source
 * repo. If a file exists there that this manifest does not name, the run fails.
 *
 *   node scripts/migrate-assets.mjs            copy + convert (won't clobber cards)
 *   node scripts/migrate-assets.mjs --check    coverage + drift check only, no writes
 *   node scripts/migrate-assets.mjs --force    also re-convert cards that already exist
 *   node scripts/migrate-assets.mjs --source … point at a different ASSETS checkout
 *
 * It walks the *working tree* it is pointed at, so a local checkout with
 * uncommitted deletions will under-report. CI runs it against a fresh clone,
 * which is the authoritative answer — and is how `Documentation/ACE/ACE.pdf`
 * turned up, tracked upstream but missing from the working copy this migration
 * was first run against.
 *
 * Dispositions:
 *   copy      byte-for-byte into this repo. Always refreshed; these are binaries
 *             nobody hand-edits here.
 *   convert   an HTML sheet, rewritten onto the shared cards/card.css. Written
 *             once and then left alone — Phase 7 re-authors these by hand, and a
 *             re-run must not undo that work. `--force` overrides.
 *   drop      deliberately not migrated. Every one carries its reason, because
 *             "we decided not to" is the answer Phase 10 needs, not silence.
 */

import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_SOURCE = resolve(process.env.HOME ?? '', 'Developer/Assets/6502-ASSETS')

// ── Card conversion profiles ───────────────────────────────────────────────
// Column widths and size regime per sheet, replacing the per-file CSS that each
// sheet used to carry. See the header of docs/public/cards/card.css.
const SYSTEM_CARD = { classes: 'card placard' }
const DEMO_CARD = { classes: 'card placard va-middle', vars: { '--w-label': '30%', '--w-addr': '16%' } }
const BASIC_CARD = { classes: 'card', vars: { '--w-cmd': '36%', '--w-syn': '40%' } }
const MONITOR_CARD = { classes: 'card' }

/** Every path in 6502-ASSETS, and what became of it. */
const MANIFEST = [
  // ── Repo mechanics ──────────────────────────────────────────────────────
  { from: '.gitignore', drop: 'Repo mechanics. This repo has its own.' },
  { from: 'LICENSE', drop: 'This repo carries its own identical MIT LICENSE.' },
  {
    from: 'README.md',
    drop:
      "Superseded. Its folder guide is obsolete once the tree moves; its memory-map summary is wrong in two places (ACCURACY.md A4, A8) and is replaced by data/memory-map.json; its Related table is rebuilt in this repo's README."
  },

  // ── Branding ────────────────────────────────────────────────────────────
  { from: 'Branding/6502.afdesign', to: 'assets/branding/6502.afdesign' },
  { from: 'Branding/Logo.afdesign', to: 'assets/branding/logo.afdesign' },
  { from: 'Branding/Favicon.aseprite', to: 'assets/branding/favicon.aseprite' },
  { from: 'Branding/6502.png', to: ['assets/branding/6502.png', 'docs/public/images/mark.png'] },
  { from: 'Branding/Logo.png', to: ['assets/branding/logo.png', 'docs/public/images/logo.png'] },
  { from: 'Branding/Logo BOW.png', to: ['assets/branding/logo-bow.png', 'docs/public/images/logo-bow.png'] },
  { from: 'Branding/Logo WOB.png', to: ['assets/branding/logo-wob.png', 'docs/public/images/logo-wob.png'] },
  { from: 'Branding/Favicon.ico', to: ['assets/branding/favicon.ico', 'docs/public/favicon.ico'] },

  // ── Images ──────────────────────────────────────────────────────────────
  { from: 'Images/6502.png', to: 'docs/public/images/6502.png' },

  // ── Cartridge label artwork ─────────────────────────────────────────────
  { from: 'Labels/Cartridge Template.afdesign', to: 'assets/labels/cartridge-template.afdesign' },
  { from: 'Labels/Cartridges.afdesign', to: 'assets/labels/cartridges.afdesign' },
  { from: 'Labels/EhBASIC Cartridge Label.afdesign', to: 'assets/labels/ehbasic-cartridge-label.afdesign' },
  { from: 'Labels/Template Cartridge Label.afdesign', to: 'assets/labels/template-cartridge-label.afdesign' },
  { from: 'Labels/VC83 BASIC Cartridge Label.afdesign', to: 'assets/labels/vc83-basic-cartridge-label.afdesign' },
  { from: 'Labels/VC83.png', to: 'assets/labels/vc83.png' },

  // ── System reference sheets ─────────────────────────────────────────────
  { from: 'Documentation/ACE/ACE.html', to: 'docs/public/cards/ace.html', card: SYSTEM_CARD },
  { from: 'Documentation/COB/COB.html', to: 'docs/public/cards/cob.html', card: SYSTEM_CARD },
  { from: 'Documentation/DEV/DEV.html', to: 'docs/public/cards/dev.html', card: SYSTEM_CARD },
  { from: 'Documentation/KIM/KIM.html', to: 'docs/public/cards/kim.html', card: SYSTEM_CARD },
  { from: 'Documentation/VCS/VCS.html', to: 'docs/public/cards/vcs.html', card: SYSTEM_CARD },

  { from: 'Documentation/ACE/ACE.pdf', drop: PDF_REASON() },
  { from: 'Documentation/COB/COB.pdf', drop: PDF_REASON() },
  { from: 'Documentation/DEV/DEV.pdf', drop: PDF_REASON() },
  { from: 'Documentation/KIM/KIM.pdf', drop: PDF_REASON() },
  { from: 'Documentation/VCS/VCS.pdf', drop: PDF_REASON() },

  // ── KIM LED walk-throughs ───────────────────────────────────────────────
  // Tutorials rather than cards. Archived verbatim so nothing is lost now; the
  // prose moves into the KIM chapter and the listings become verified samples in
  // Phase 6, after which these become historical.
  {
    from: 'Documentation/KIM/KIM LED Demo - Binary Counter.html',
    to: 'docs/public/cards/archive/kim-led-binary-counter.html',
    card: DEMO_CARD
  },
  {
    from: 'Documentation/KIM/KIM LED Demo - KITT Scanner.html',
    to: 'docs/public/cards/archive/kim-led-kitt-scanner.html',
    card: DEMO_CARD
  },
  { from: 'Documentation/KIM/KIM LED Demo - Binary Counter.pdf', drop: PDF_REASON() },
  { from: 'Documentation/KIM/KIM LED Demo - KITT Scanner.pdf', drop: PDF_REASON() },

  // ── BIOS reference sheets, v1.0 – v1.4 ──────────────────────────────────
  // Archived, not deleted: they are the reference record of what each firmware
  // release documented. The v1.5 pair is authored fresh from the fact base in
  // Phase 7 and becomes the current card.
  ...['1.0', '1.1', '1.2', '1.3', '1.4'].flatMap((v) => [
    {
      from: `Documentation/BIOS/v${v}/6502 BIOS - BASIC Reference.html`,
      to: `docs/public/cards/archive/bios-v${v}-basic-reference.html`,
      card: BASIC_CARD
    },
    {
      from: `Documentation/BIOS/v${v}/6502 BIOS - Monitor Reference.html`,
      to: `docs/public/cards/archive/bios-v${v}-monitor-reference.html`,
      card: MONITOR_CARD
    }
  ]),

  // ── Memory map ──────────────────────────────────────────────────────────
  { from: 'Documentation/Memory Map/Memory Map.afdesign', to: 'assets/affinity/memory-map.afdesign' },
  { from: 'Documentation/Memory Map/Memory Map.png', to: 'assets/legacy/renders/memory-map.png' },
  { from: 'Documentation/Memory Map/Memory Map.pdf', to: 'assets/legacy/renders/memory-map.pdf' },

  // ── Connectors ──────────────────────────────────────────────────────────
  { from: 'Documentation/Connectors/Connectors.afdesign', to: 'assets/affinity/connectors.afdesign' },
  { from: 'Documentation/Connectors/Connectors.png', to: 'assets/legacy/renders/connectors.png' },
  { from: 'Documentation/Connectors/Connectors.pdf', to: 'assets/legacy/renders/connectors.pdf' },

  // ── Character set and map ───────────────────────────────────────────────
  { from: 'Documentation/Characters/Character Set.afdesign', to: 'assets/affinity/character-set.afdesign' },
  { from: 'Documentation/Characters/Character Map.numbers', to: 'assets/numbers/character-map.numbers' },
  { from: 'Documentation/Characters/Character Map.png', to: 'assets/legacy/renders/character-map.png' },
  { from: 'Documentation/Characters/Character Map.pdf', to: 'assets/legacy/renders/character-map.pdf' },
  { from: 'Documentation/Characters/Character Set.png', to: 'docs/public/images/charset/charset-1x.png' },
  { from: 'Documentation/Characters/Character Set 2x.png', to: 'docs/public/images/charset/charset-2x.png' },
  { from: 'Documentation/Characters/Character Set 4x.png', to: 'docs/public/images/charset/charset-4x.png' },
  { from: 'Documentation/Characters/Character Set 8x.png', to: 'docs/public/images/charset/charset-8x.png' },
  { from: 'Documentation/Characters/Character Set 16x.png', to: 'docs/public/images/charset/charset-16x.png' },

  // ── Keyboard ────────────────────────────────────────────────────────────
  { from: 'Documentation/Keyboard Layout/Keyboard Layout.json', to: 'assets/keyboard/keyboard-layout.json' },
  { from: 'Documentation/Keyboard Layout/Keyboard Layout.svg', to: 'assets/keyboard/keyboard-layout.svg' },
  { from: 'Documentation/Keyboard Layout/Keyboard Layout.png', to: 'assets/keyboard/keyboard-layout.png' },
  { from: 'Documentation/Keyboard Matrix/Keyboard Matrix.numbers', to: 'assets/numbers/keyboard-matrix.numbers' },
  { from: 'Documentation/Keyboard Matrix/Keyboard Matrix.png', to: 'assets/legacy/renders/keyboard-matrix.png' },
  { from: 'Documentation/Keyboard Matrix/Keyboard Matrix.pdf', to: 'assets/legacy/renders/keyboard-matrix.pdf' },
  { from: 'Documentation/Keypad Mapping/Keypad Mapping.numbers', to: 'assets/numbers/keypad-mapping.numbers' },
  { from: 'Documentation/Keypad Mapping/Keypad Mapping.png', to: 'assets/legacy/renders/keypad-mapping.png' },
  { from: 'Documentation/Keypad Mapping/Keypad Mapping.pdf', to: 'assets/legacy/renders/keypad-mapping.pdf' }
]

function PDF_REASON() {
  return 'Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on).'
}

// ── HTML conversion ────────────────────────────────────────────────────────

/**
 * Rewrite one legacy sheet onto the shared stylesheet.
 *
 * The transform is deliberately narrow — it touches the <head> and the <body>
 * tag and nothing else. The markup of the sheet is left exactly as it was, so a
 * converted card is diffable against its original and any visual change is
 * attributable to card.css alone.
 */
function convertCard(html, { classes, vars }, cssHref) {
  const before = html

  // 1. Drop the Google Fonts requests. The originals rendered in a fallback
  //    face on any machine that was offline, which is most machines doing
  //    printing at a table with a stack of boards on it.
  html = html.replace(/^[ \t]*<link rel="preconnect"[^>]*>\n/gm, '')
  html = html.replace(/^[ \t]*<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n/gm, '')

  // 2. Replace the inline stylesheet with a link to the shared one.
  const style = /^[ \t]*<style>[\s\S]*?<\/style>\n/m
  if (!style.test(html)) throw new Error('no inline <style> block found')
  html = html.replace(style, `<link rel="stylesheet" href="${cssHref}">\n`)

  // 3. Class the body into its size regime, and set the card's column widths.
  const styleAttr = vars
    ? ` style="${Object.entries(vars)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')}"`
    : ''
  if (!/<body>/.test(html)) throw new Error('no bare <body> tag found')
  html = html.replace('<body>', `<body class="${classes}"${styleAttr}>`)

  // 4. A screen-only banner. Cards get opened in a browser far more often than
  //    they get printed, and the print settings are not guessable.
  html = html.replace(
    /<body([^>]*)>\n/,
    `<body$1>\n\n<div class="print-hint">To print: letter &middot; 100% scale &middot; margins off &middot; background graphics ON</div>\n`
  )

  if (html === before) throw new Error('conversion made no changes')
  return html
}

// ── The ledger ─────────────────────────────────────────────────────────────

const LEDGER = join(REPO, 'ASSETS-MIGRATION.md')
const BEGIN = '<!-- BEGIN GENERATED INVENTORY -->'
const END = '<!-- END GENERATED INVENTORY -->'

/**
 * Rewrite the inventory table in ASSETS-MIGRATION.md from the manifest.
 *
 * Generated rather than hand-kept, because the whole value of that file is that
 * Phase 10 can trust it. A hand-maintained ✅ column is worth nothing the moment
 * it falls one row behind the manifest.
 */
function writeLedger(check, problems) {
  if (!existsSync(LEDGER)) return
  const doc = readFileSync(LEDGER, 'utf-8')
  const i = doc.indexOf(BEGIN)
  const j = doc.indexOf(END)
  if (i === -1 || j === -1) return

  const rows = []
  for (const entry of MANIFEST) {
    const from = `\`${entry.from}\``
    if (entry.drop) {
      rows.push(`| ${from} | — | ⬜ dropped | ${entry.drop} |`)
      continue
    }
    const targets = (Array.isArray(entry.to) ? entry.to : [entry.to]).map((t) => `\`${t}\``).join('<br>')
    const landed = (Array.isArray(entry.to) ? entry.to : [entry.to]).every((t) => existsSync(join(REPO, t)))
    const how = entry.card ? 'converted' : 'copied'
    const note = entry.card
      ? 'Rewritten onto `cards/card.css`; markup untouched.'
      : 'Byte-for-byte.'
    rows.push(`| ${from} | ${targets} | ${landed ? '✅' : '❌'} ${how} | ${note} |`)
  }

  const table = [
    BEGIN,
    '',
    `<!-- Generated by scripts/migrate-assets.mjs — do not edit by hand. -->`,
    '',
    '| In `6502-ASSETS` | In this repo | Status | Notes |',
    '|---|---|---|---|',
    ...rows,
    '',
    END
  ].join('\n')

  const next = doc.slice(0, i) + table + doc.slice(j + END.length)
  if (next === doc) return
  if (check) {
    problems.push('ASSETS-MIGRATION.md inventory is stale — re-run without --check')
    return
  }
  writeFileSync(LEDGER, next)
  console.log(`  wrote ${relative(REPO, LEDGER)} inventory (${rows.length} rows)`)
}

// ── Runner ─────────────────────────────────────────────────────────────────

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.DS_Store') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, base, out)
    else out.push(relative(base, full))
  }
  return out
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12)

function main() {
  const argv = process.argv.slice(2)
  const check = argv.includes('--check')
  const force = argv.includes('--force')
  const sourceArg = argv.indexOf('--source')
  const SOURCE = sourceArg !== -1 ? resolve(argv[sourceArg + 1]) : DEFAULT_SOURCE

  if (!existsSync(SOURCE)) {
    console.error(`✗ source repo not found: ${SOURCE}`)
    console.error('  Pass --source <path> if 6502-ASSETS lives somewhere else.')
    process.exit(2)
  }

  const present = new Set(walk(SOURCE))
  const named = new Set(MANIFEST.map((e) => e.from))
  const problems = []

  // Coverage, both ways. Unaccounted-for source files are the Phase 2 exit
  // criterion; stale manifest entries mean the manifest is lying about what the
  // source repo holds.
  for (const path of present) if (!named.has(path)) problems.push(`unaccounted for in ASSETS: ${path}`)
  for (const path of named) if (!present.has(path)) problems.push(`manifest names a path that no longer exists: ${path}`)

  const tally = { copied: 0, converted: 0, skipped: 0, dropped: 0, unchanged: 0 }

  for (const entry of MANIFEST) {
    if (entry.drop) {
      tally.dropped++
      continue
    }
    const src = join(SOURCE, entry.from)
    if (!existsSync(src)) continue // already reported above

    const targets = Array.isArray(entry.to) ? entry.to : [entry.to]

    for (const target of targets) {
      const dest = join(REPO, target)

      if (entry.card) {
        const cssHref = target.includes('/cards/archive/') ? '../card.css' : 'card.css'
        let out
        try {
          out = convertCard(readFileSync(src, 'utf-8'), entry.card, cssHref)
        } catch (err) {
          problems.push(`${entry.from}: ${err.message}`)
          continue
        }
        if (existsSync(dest) && !force) {
          const same = readFileSync(dest, 'utf-8') === out
          tally[same ? 'unchanged' : 'skipped']++
          if (!same && !check) console.log(`  skip  ${target}  (hand-edited since migration; --force to overwrite)`)
          continue
        }
        if (!check) {
          mkdirSync(dirname(dest), { recursive: true })
          writeFileSync(dest, out)
        }
        tally.converted++
        continue
      }

      const srcBuf = readFileSync(src)
      if (existsSync(dest) && sha(srcBuf) === sha(readFileSync(dest))) {
        tally.unchanged++
        continue
      }
      if (!check) {
        mkdirSync(dirname(dest), { recursive: true })
        copyFileSync(src, dest)
      } else {
        problems.push(`${existsSync(dest) ? 'out of date' : 'missing'}: ${target}`)
      }
      tally.copied++
    }
  }

  const dests = MANIFEST.flatMap((e) => (e.to ? (Array.isArray(e.to) ? e.to : [e.to]) : []))
  for (const target of dests) {
    if (!existsSync(join(REPO, target)) && !check) problems.push(`expected output missing: ${target}`)
  }

  if (!problems.length) writeLedger(check, problems)

  console.log(
    `${check ? 'checked' : 'migrated'}: ${present.size} source paths · ` +
      `${tally.copied} copied, ${tally.converted} converted, ${tally.unchanged} already current, ` +
      `${tally.skipped} preserved, ${tally.dropped} intentionally dropped`
  )

  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log('✓ every path in 6502-ASSETS is accounted for')
}

main()
