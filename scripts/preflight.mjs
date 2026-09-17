#!/usr/bin/env node
//
// Toolchain preflight (PLAN.md, Phase 1, task 4).
//
// Checks that everything the sample harness needs is installed and new enough,
// and reports on the optional tools the cross-development chapter (Phase 5)
// will tell readers to install. Every claim the docs make about a prerequisite
// is backed by a check in here.
//
//   npm run preflight            # report, exit non-zero if a required tool is missing
//   npm run preflight -- --json  # machine-readable
//
// cc65 gets two checks, because two different things are being asked:
//
//   cl65         can it assemble a program at all? The docs' samples and both
//                project templates set `.setcpu "65C02"`, which the 2.19
//                release from 2020 supports. Required.
//   cl65-w65c02  does it also accept `.setcpu "W65C02"`? Only the BIOS needs
//                that, and cc65 gained it in July 2025 — after 2.19, which is
//                still what every package manager ships. Optional here.
//
// See ACCURACY.md A7: the version string cannot answer either question, since a
// HEAD build still reports `V2.19 - Git <sha>`. Both checks assemble a probe.

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REQUIRED_NODE_MAJOR = 22

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The emulator release the whole site is written against.
 *
 * Every sample's output, every screenshot's pixels and every embedded program's
 * bytes came off one release, and a run on a different one is not the check it
 * looks like. So this is a gate rather than a line of information: the version
 * lives in the fact base, and a machine running something else fails here
 * instead of quietly producing a different answer three scripts later.
 */
const EMULATOR = JSON.parse(readFileSync(join(ROOT, 'data/emulator.json'), 'utf-8'))

export const EMULATOR_VERSION = EMULATOR.version

/**
 * The video card, and with it the BIOS, that every machine the site drives
 * runs. The emulator picks the bundled BIOS by card, so this is also what makes
 * a headless run boot 2.0 rather than 1.6 — even on a serial console, where no
 * video card is fitted at all.
 */
export const EMULATOR_CARD = EMULATOR.card

/**
 * The flags every harness machine starts with: the site's card, and serial
 * flow control. BIOS 2.0 crunches a line more slowly than 1.x did, and a pasted
 * listing loses lines without RTS/CTS — intermittently, which is the worst way
 * for a check to fail.
 */
export const MACHINE_FLAGS = ['--vdp', EMULATOR_CARD, '--flow-control']

/**
 * Refuse a machine that is not the one the site is written against.
 *
 * `info` is `dbg info --json`. The flags above ask for the card and for flow
 * control, and this is what checks that they were honored: a wrapper that drops
 * an argument, or an emulator that spells one differently, would otherwise boot
 * the default card and BIOS 1.6 and fail forty cases later for a reason nobody
 * would guess. With a serial console the video slot is empty whichever card was
 * named, so `vdp` is null there and the card is known only by the flag.
 */
/**
 * The first line the site's BIOS prints, read from the fact base.
 *
 * With a serial console `dbg info` cannot say which card was asked for, and the
 * card is what picks the BIOS. What BASIC printed on the way up can: a machine
 * that booted 1.6 prints a splash, not this.
 */
export const BIOS_HEADER = JSON.parse(readFileSync(join(ROOT, 'data/boot.json'), 'utf-8')).header[0]

export function assertBooted(consoleMode, text) {
  if (!text.split(/\r?\n/).some((line) => line.trim() === BIOS_HEADER)) {
    throw new Error(
      `refusing a ${consoleMode} machine: it did not print "${BIOS_HEADER}" on the way to the prompt, ` +
        'so it is not running the BIOS this site is written against.'
    )
  }
}

export function assertMachine(info, consoleMode) {
  const problems = []
  if (info.flowControl !== true) problems.push(`flow control is ${info.flowControl ? 'on' : 'off'}`)
  const wanted = consoleMode === 'video' ? [EMULATOR_CARD] : [EMULATOR_CARD, null]
  if (!wanted.includes(info.vdp)) problems.push(`the video card is ${info.vdp ?? 'none'}`)
  if (problems.length) {
    throw new Error(
      `refusing a ${consoleMode} machine: ${problems.join(' and ')}. This site runs --vdp ${EMULATOR_CARD} ` +
        'with --flow-control on, and a machine without them is not the check it looks like.'
    )
  }
}

const checks = [
  { name: 'node', required: true, run: checkNode },
  { name: '6502', required: true, run: checkEmulator },
  { name: 'cl65', required: true, run: checkCc65 },
  { name: 'cl65-w65c02', required: false, run: checkCc65W65C02 },
  { name: 'bastok', required: false, run: () => checkOptional('bastok', ['--version'], 'Tokenize .bas text into a .prg') },
  { name: 'cffs', required: false, run: () => checkOptional('cffs', ['--version'], 'Build CompactFlash disk images') },
  { name: 'bin2woz', required: false, run: () => checkOptional('bin2woz', ['--version'], 'Turn a binary into a Wozmon paste-able upload') },
  { name: 'minipro', required: false, run: () => checkOptional('minipro', ['--version'], 'Burn AT28C256 EEPROMs with a TL866') }
]

// ---------------------------------------------------------------------------

function checkNode() {
  const major = Number(process.versions.node.split('.')[0])
  return {
    ok: major >= REQUIRED_NODE_MAJOR,
    version: process.version,
    detail: `need >= ${REQUIRED_NODE_MAJOR}`
  }
}

/**
 * Locate the emulator CLI.
 *
 * `$SIXFIVEOHTWO` wins if set (that is how CI points at a checkout it built),
 * then the `6502` shim the desktop app installs.
 */
export function emulatorCommand() {
  const override = process.env.SIXFIVEOHTWO
  if (override) {
    const parts = override.split(' ').filter(Boolean)
    return { command: parts[0], prefix: parts.slice(1) }
  }
  return { command: '6502', prefix: [] }
}

function checkEmulator() {
  const { command, prefix } = emulatorCommand()
  const result = run(command, [...prefix, '--version'])
  if (!result.ok) {
    return {
      ok: false,
      detail:
        'Install it from the desktop app (Settings -> Command Line -> Install), ' +
        'or point $SIXFIVEOHTWO at "node <checkout>/out/cli/index.js".'
    }
  }

  const version = result.stdout.trim()
  const via = `via ${[command, ...prefix].join(' ')}`

  if (version !== EMULATOR_VERSION) {
    return {
      ok: false,
      version,
      detail:
        `${via} — the site is written against ${EMULATOR_VERSION}. Install that release, ` +
        'or bump data/emulator.json and re-run the samples, the screenshots and the ' +
        'embedded payloads against the new one.'
    }
  }

  return { ok: true, version, detail: via }
}

/** cc65 is installed and can assemble what the samples and templates use. */
function checkCc65() {
  const version = run('cl65', ['--version'])
  if (!version.ok) {
    return { ok: false, detail: 'Not installed. macOS: brew install cc65' }
  }

  // `--version` prints to stderr on some builds.
  const banner = (version.stdout + version.stderr).trim().split('\n')[0]
  const probe = assembles('.setcpu "65C02"\n  lda #$00\n  bra *\n')

  return probe.ok
    ? { ok: true, version: banner, detail: 'assembles .setcpu "65C02"' }
    : { ok: false, version: banner, detail: `ca65 could not assemble a 65C02 probe: ${probe.error}` }
}

/** …and, separately, whether it is new enough to build the BIOS itself. */
function checkCc65W65C02() {
  const probe = assembles('.setcpu "W65C02"\n.macpack longbranch\n  wai\n  stp\n  rmb0 $10\n')

  return probe.ok
    ? { ok: true, detail: 'accepts .setcpu "W65C02" — new enough to build the BIOS' }
    : {
        ok: false,
        detail:
          'rejects .setcpu "W65C02" (this is 2.19, from 2020). Only needed to build ' +
          'the BIOS from source; the samples and templates use "65C02" and are fine. ' +
          'macOS: brew install --HEAD cc65.'
      }
}

function assembles(source) {
  const dir = mkdtempSync(join(tmpdir(), '6502-preflight-'))
  try {
    const src = join(dir, 'probe.s')
    writeFileSync(src, source)
    const result = run('ca65', ['-o', join(dir, 'probe.o'), src])
    return { ok: result.ok, error: (result.stderr || result.stdout).trim().split('\n')[0] }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function checkOptional(command, args, purpose) {
  const result = run(command, args)
  return {
    ok: result.ok,
    version: result.ok ? (result.stdout + result.stderr).trim().split('\n')[0] : undefined,
    detail: purpose
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf-8', timeout: 30_000 })
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  }
}

// ---------------------------------------------------------------------------

export function preflight() {
  return checks.map((check) => ({ ...check, ...check.run() }))
}

function main() {
  const results = preflight()
  const json = process.argv.includes('--json')

  if (json) {
    console.log(JSON.stringify(results.map(({ run: _, ...rest }) => rest), null, 2))
  } else {
    for (const r of results) {
      const status = r.ok ? 'ok  ' : r.required ? 'FAIL' : 'skip'
      const version = r.version ? ` ${r.version}` : ''
      console.log(`${status} ${r.name.padEnd(8)}${version}${r.detail ? `  — ${r.detail}` : ''}`)
    }
  }

  const missing = results.filter((r) => r.required && !r.ok)
  if (missing.length) {
    console.error(`\npreflight: ${missing.map((r) => r.name).join(', ')} unavailable`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
