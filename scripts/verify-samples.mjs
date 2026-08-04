#!/usr/bin/env node
//
// Sample harness (PLAN.md, Phase 1, task 3).
//
// Every listing in the docs is a real file under `samples/`, included into the
// Markdown by path, and executed here on the actual emulator with its output
// asserted. The prose cannot drift from the tested file, because it *is* the
// tested file.
//
//   npm run verify                    # every case
//   npm run verify -- basic/hello     # cases whose path contains this
//   npm run verify -- --verbose       # print console output for passing cases too
//
// The method is the one in 6502-EMULATOR/docs/AGENTS.md: boot once, snapshot at
// the prompt, restore per case, wait rather than sleep, bound everything, and
// branch on exit codes.

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emulatorCommand } from './preflight.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAMPLES = join(ROOT, 'samples')
const BUILD = join(SAMPLES, 'build')
// The keyword reference's worked examples. Hand-authored rather than extracted,
// because "what is this keyword for" is a writing job — but every one of them is
// typed into the machine here, and the output the reference prints is the output
// the machine gave.
const EXAMPLES = join(ROOT, 'data', 'basic-examples.json')
// A prepared CompactFlash image for `console storage` cases, built fresh by
// `buildStorageFixture()` before any machine boots — not checked into git,
// same treatment as the assembled .prg files below.
const STORAGE_FIXTURE = join(BUILD, 'storage-fixture.img')

// Pinned so a run on a laptop and a run on a CI box land in the same machine.
const RTC = '2026-01-01T00:00:00'
// Off the emulator's default so a harness run cannot collide with the app the
// author has open.
const BASE_PORT = Number(process.env.VERIFY_PORT ?? 6512)

const DEFAULT_TIMEOUT = '20s'
// How far a video case advances the machine after each send, in emulated
// cycles — about two seconds at 1 MHz. Cycles rather than wall time, so the
// result does not depend on how fast the host is.
const DEFAULT_SETTLE_CYCLES = 2_000_000

// ---------------------------------------------------------------------------
// Case discovery and .expect parsing
// ---------------------------------------------------------------------------

const RUNNABLE = new Set(['.bas', '.asm', '.prg'])

function discover(dir = SAMPLES) {
  const cases = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'build' || entry.name === 'lib') continue
      cases.push(...discover(path))
      continue
    }

    const ext = extname(entry.name)
    if (!RUNNABLE.has(ext)) continue

    const expect = path.slice(0, -ext.length) + '.expect'
    if (!existsSync(expect)) {
      throw new Error(
        `${relative(ROOT, path)} has no sibling .expect — a listing that cannot be verified does not go in`
      )
    }

    cases.push({
      name: relative(SAMPLES, path).slice(0, -ext.length),
      path,
      kind: ext.slice(1),
      spec: parseExpect(expect)
    })
  }

  return cases.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Turn every entry in the keyword-examples manifest into a case.
 *
 * The manifest is what the reference page renders: an entry's `example` lines
 * are the listing a reader sees and `output` is the result printed under it.
 * Both are asserted here, line for line, so the reference cannot claim output
 * the machine does not produce.
 *
 * A block whose first line starts with a digit is a stored program — typed in,
 * then `RUN`. Anything else is typed at the prompt and runs as it is entered.
 */
function discoverExamples() {
  if (!existsSync(EXAMPLES)) return []

  const manifest = JSON.parse(readFileSync(EXAMPLES, 'utf-8'))
  const cases = []

  for (const [keyword, entry] of Object.entries(manifest.keywords ?? {})) {
    const lines = entry.example ?? []
    if (!lines.length) continue

    const where = `data/basic-examples.json (${keyword})`
    const spec = {
      console: entry.console ?? 'serial',
      timeout: entry.timeout ?? DEFAULT_TIMEOUT,
      wait: entry.wait ?? 'OK',
      cycles: entry.cycles ?? DEFAULT_SETTLE_CYCLES,
      sends: entry.sends ?? [],
      // Every printed line the reference shows is asserted verbatim.
      expect: (entry.output ?? []).map((line) => ({
        pattern: `^${escapeRegExp(line)}\\s*$`,
        where
      })),
      absent: (entry.absent ?? []).map((pattern) => ({ pattern, where })),
      screen: (entry.screen ?? []).map((pattern) => ({ pattern, where })),
      expectFailure: false,
      file: where
    }

    for (const pattern of entry.expect ?? []) spec.expect.push({ pattern, where })
    if (spec.screen.length) spec.console = 'video'

    if (!spec.expect.length && !spec.absent.length && !spec.screen.length) {
      throw new Error(`${where}: asserts nothing — give it an "output" or an "expect"`)
    }

    cases.push({
      name: `reference/${keyword}`,
      kind: 'example',
      lines,
      // A stored program has to be RUN; a line typed at the prompt already ran.
      // `run: false` covers the entries that type a program in only to do
      // something else with it — LIST it, NEW it, load it back off a card.
      runs: entry.run ?? /^\s*\d/.test(lines[0]),
      spec
    })
  }

  return cases.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Parse a `.expect` file.
 *
 * One directive per line; `#` starts a comment. Everything is optional except
 * that a case must assert *something*.
 *
 *   console video        run on a machine with a video card fitted
 *   console storage      run on a machine with a prepared CompactFlash image attached
 *   timeout 30s          per-assertion budget (default 20s)
 *   wait <pattern>       what RUN waits for before asserting (default OK, serial only)
 *   cycles <n>           emulated cycles to advance after each send (video only)
 *   send <text>          extra input after RUN, before asserting (repeatable)
 *   expect <pattern>     console output must match this regex
 *   absent <pattern>     console output must not match this regex
 *   screen <pattern>     `dbg screen text` must match — implies console video
 *   pass                 shorthand for: expect ^PASS$ / absent ^FAIL$
 *   expect-failure       this case is meant to fail; the harness inverts it
 */
function parseExpect(path) {
  const spec = {
    console: 'serial',
    timeout: DEFAULT_TIMEOUT,
    wait: 'OK',
    cycles: DEFAULT_SETTLE_CYCLES,
    sends: [],
    expect: [],
    absent: [],
    screen: [],
    expectFailure: false,
    file: relative(ROOT, path)
  }

  for (const [n, raw] of readFileSync(path, 'utf-8').split('\n').entries()) {
    const line = raw.replace(/(^|\s)#.*$/, '').trim()
    if (!line) continue

    const [, key, value = ''] = line.match(/^(\S+)\s*(.*)$/)
    const where = `${spec.file}:${n + 1}`

    switch (key) {
      case 'console':
        if (!['serial', 'video', 'storage'].includes(value)) {
          throw new Error(`${where}: console must be serial, video, or storage`)
        }
        spec.console = value
        break
      case 'timeout':
        spec.timeout = value
        break
      case 'wait':
        spec.wait = value
        break
      case 'cycles':
        spec.cycles = Number(value)
        if (!Number.isFinite(spec.cycles) || spec.cycles <= 0) {
          throw new Error(`${where}: cycles must be a positive number`)
        }
        break
      case 'send':
        spec.sends.push(value)
        break
      case 'expect':
        spec.expect.push({ pattern: value, where })
        break
      case 'absent':
        spec.absent.push({ pattern: value, where })
        break
      case 'screen':
        spec.screen.push({ pattern: value, where })
        spec.console = 'video'
        break
      case 'pass':
        spec.expect.push({ pattern: '^PASS$', where })
        spec.absent.push({ pattern: '^FAIL$', where })
        break
      case 'expect-failure':
        spec.expectFailure = true
        break
      default:
        throw new Error(`${where}: unknown directive "${key}"`)
    }
  }

  if (!spec.expect.length && !spec.absent.length && !spec.screen.length) {
    throw new Error(`${spec.file}: asserts nothing`)
  }

  return spec
}

// ---------------------------------------------------------------------------
// Driving one emulator
// ---------------------------------------------------------------------------

class Machine {
  constructor(consoleMode, port) {
    this.consoleMode = consoleMode
    this.port = port
    this.state = join(BUILD, `ready-${consoleMode}.state`)
    this.emulator = emulatorCommand()
  }

  async start() {
    const args = [
      ...this.emulator.prefix,
      'run',
      '--headless',
      '--quiet',
      '--debug',
      '--debug-port',
      String(this.port),
      '--rtc',
      RTC,
      // A ceiling on the whole session, so a wedged machine fails the run
      // instead of holding CI open.
      '--timeout',
      '600s'
    ]
    if (this.consoleMode === 'video') args.push('--console', 'video')
    if (this.consoleMode === 'storage') args.push('--cf', STORAGE_FIXTURE)

    this.process = spawn(this.emulator.command, args, { stdio: 'ignore' })
    this.process.on('error', (error) => {
      throw new Error(`could not start the emulator: ${error.message}`)
    })

    await this.waitForServer()

    // Boot to the BASIC prompt once, then snapshot: a restore is about a
    // millisecond against 5.36 million cycles to boot, and it is exact, so one
    // case cannot leak into the next.
    this.waitForPrompt()
    this.dbg(['state', 'save', this.state], { required: true })
  }

  /**
   * Block until BASIC's `OK` prompt is up.
   *
   * With a serial console the prompt is in the console byte stream, so this is
   * one blocking wait. With a video console it is *on the screen* and nothing
   * reaches the stream, so the machine is advanced in emulated-cycle steps and
   * the screen is read between them — still waiting rather than sleeping, and
   * still independent of how fast the host is.
   */
  waitForPrompt() {
    // A storage machine is still a serial console — the only difference is
    // the --cf attached at boot — so it waits the same way.
    if (this.consoleMode !== 'video') {
      this.dbg(['wait', '--serial', 'OK', '--run', 'turbo', '--timeout', '60s'], { required: true })
      return
    }

    // Booting to the prompt costs about 5.4M cycles, most of it the splash's
    // five-second countdown. Twenty steps of 500k is ample headroom.
    for (let i = 0; i < 20; i++) {
      this.dbg(['wait', '--cycles', '500000', '--run', 'turbo', '--timeout', '60s'], { required: true })
      // Screen rows are padded to the full 40 columns, so the prompt is `OK`
      // followed by 38 spaces.
      if (/^OK\s*$/m.test(this.screen())) return
    }
    throw new Error('video machine never reached the OK prompt')
  }

  screen() {
    return this.dbg(['screen', 'text'], { required: true }).out
  }

  /** Advance the machine by a fixed emulated-cycle budget. */
  settle(cycles) {
    this.dbg(['wait', '--cycles', String(cycles), '--run', 'turbo', '--timeout', '60s'], {
      required: true
    })
  }

  async waitForServer() {
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      if (this.dbg(['info']).status === 0) return
      if (this.process.exitCode !== null) {
        throw new Error(`emulator exited with ${this.process.exitCode} before the debug server came up`)
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    throw new Error(`emulator debug server did not come up on port ${this.port}`)
  }

  /** Back to the saved prompt, running. */
  reset() {
    this.dbg(['state', 'load', this.state], { required: true })
    this.dbg(['run'], { required: true })
  }

  dbg(args, { required = false } = {}) {
    // Connection flags go after the subcommand, not before it.
    const result = spawnSync(
      this.emulator.command,
      [...this.emulator.prefix, 'dbg', ...args, '--port', String(this.port)],
      { encoding: 'utf-8', timeout: 120_000 }
    )

    if (required && result.status !== 0) {
      throw new Error(
        `6502 dbg ${args.join(' ')} failed (${result.status}): ${(result.stderr || '').trim()}`
      )
    }

    // The console sends CRLF, as a real serial terminal does.
    return { ...result, out: (result.stdout ?? '').replace(/\r/g, '') }
  }

  stop() {
    this.process?.kill()
  }
}

// ---------------------------------------------------------------------------
// Running a case
// ---------------------------------------------------------------------------

function buildAssembly(caseFile) {
  mkdirSync(BUILD, { recursive: true })
  const prg = join(BUILD, caseFile.name.replace(/[\/\\]/g, '-') + '.prg')

  const result = spawnSync(
    'cl65',
    [
      '-t', 'none',
      '-C', join(SAMPLES, 'lib', '6502.cfg'),
      // The generated 6502.inc lives in samples/lib, next to the config.
      '--asm-include-dir', join(SAMPLES, 'lib'),
      '-o', prg,
      caseFile.path
    ],
    { encoding: 'utf-8' }
  )

  if (result.status !== 0) {
    throw new Error(`cl65 failed:\n${(result.stderr || result.stdout || '').trim()}`)
  }

  return prg
}

function runCase(machine, caseFile) {
  const { spec } = caseFile
  const video = spec.console === 'video'
  machine.reset()

  let output = ''

  /**
   * Send a line and get back to a quiescent machine.
   *
   * Over serial that means waiting for a pattern in the console stream. On a
   * video machine there is no stream to wait on, so the machine is advanced by
   * a fixed emulated-cycle budget instead — deterministic, because the clock is
   * pinned and turbo is not paced against the host.
   */
  const send = (text, waitFor) => {
    if (video) {
      const sent = machine.dbg(['send', text, '--timeout', spec.timeout], { required: true })
      machine.settle(spec.cycles)
      return { status: 0, out: sent.out }
    }
    return machine.dbg(['send', text, '--wait', waitFor, '--timeout', spec.timeout])
  }

  if (caseFile.kind === 'bas' || caseFile.kind === 'example') {
    const source = caseFile.lines ?? readFileSync(caseFile.path, 'utf-8').split('\n')

    for (const line of source) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // A stored program line prints nothing back, so it waits for its own echo.
      // A line typed at the prompt runs there and then, so it waits for the
      // prompt to come back.
      const waitFor = /^\d/.test(trimmed)
        ? '^' + escapeRegExp(trimmed.split(/\s+/)[0])
        : spec.wait
      output += send(`${trimmed}\\r`, waitFor).out
    }
  } else {
    const prg = caseFile.kind === 'asm' ? buildAssembly(caseFile) : caseFile.path
    machine.dbg(['load', 'program', prg], { required: true })
  }

  // An example typed at the prompt has already run by the time it is entered.
  if (caseFile.runs !== false) {
    const run = send('RUN\\r', spec.wait)
    output += run.out
    if (run.status !== 0) {
      return { ok: false, output, reason: `RUN never matched /${spec.wait}/ within ${spec.timeout}` }
    }
  }

  for (const text of spec.sends) {
    const extra = send(text, spec.wait)
    output += extra.out
    if (extra.status !== 0) {
      return { ok: false, output, reason: `send "${text}" never matched /${spec.wait}/` }
    }
  }

  const failures = []

  for (const { pattern, where } of spec.expect) {
    if (!new RegExp(pattern, 'm').test(output)) failures.push(`${where}: expected /${pattern}/`)
  }
  for (const { pattern, where } of spec.absent) {
    if (new RegExp(pattern, 'm').test(output)) failures.push(`${where}: unexpected /${pattern}/`)
  }

  if (spec.screen.length) {
    const screen = machine.screen()
    output += `\n--- screen ---\n${screen}`
    for (const { pattern, where } of spec.screen) {
      if (!new RegExp(pattern, 'm').test(screen)) failures.push(`${where}: screen expected /${pattern}/`)
    }
  }

  return failures.length
    ? { ok: false, output, reason: failures.join('\n       ') }
    : { ok: true, output }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build the CompactFlash image `console storage` cases boot with — one file,
 * HELLO.TXT, so a DIR/LOAD case has something to find. Cases that DEL, BSAVE,
 * or FORMAT never affect each other: every case restores from the snapshot
 * taken right after boot, and a storage restore reverts the CF card's
 * contents along with everything else (confirmed directly: FORMAT-then-restore
 * brings HELLO.TXT back).
 */
function buildStorageFixture() {
  mkdirSync(BUILD, { recursive: true })
  rmSync(STORAGE_FIXTURE, { force: true })

  const seed = join(BUILD, 'hello.txt')
  writeFileSync(seed, 'HELLO\n')

  const create = spawnSync('cffs', ['create', STORAGE_FIXTURE, '--disks', '1'], { encoding: 'utf-8' })
  if (create.status !== 0) {
    throw new Error(`cffs create failed:\n${(create.stderr || create.stdout || '').trim()}`)
  }

  const add = spawnSync('cffs', ['add', STORAGE_FIXTURE, seed, '--name', 'HELLO.TXT'], {
    encoding: 'utf-8'
  })
  if (add.status !== 0) {
    throw new Error(`cffs add failed:\n${(add.stderr || add.stdout || '').trim()}`)
  }
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const filters = args.filter((a) => !a.startsWith('--'))

  if (!existsSync(SAMPLES)) {
    console.log('verify: no samples/ directory')
    return
  }

  let cases = [...discover(), ...discoverExamples()]
  if (filters.length) {
    cases = cases.filter((c) => filters.some((f) => c.name.includes(f)))
  }

  if (!cases.length) {
    console.error('verify: no cases matched')
    process.exit(1)
  }

  const needsAssembler = cases.some((c) => c.kind === 'asm')
  if (needsAssembler && spawnSync('cl65', ['--version']).error) {
    console.error('verify: cl65 is not installed — run `npm run preflight`')
    process.exit(1)
  }

  const needsStorage = cases.some((c) => c.spec.console === 'storage')
  if (needsStorage && spawnSync('cffs', ['--version']).error) {
    console.error('verify: cffs is not installed — run `npm run preflight`')
    process.exit(1)
  }

  rmSync(BUILD, { recursive: true, force: true })
  mkdirSync(BUILD, { recursive: true })
  if (needsStorage) buildStorageFixture()

  const modes = [...new Set(cases.map((c) => c.spec.console))]
  const machines = new Map()
  let failed = 0

  try {
    for (const [i, mode] of modes.entries()) {
      const machine = new Machine(mode, BASE_PORT + i)
      await machine.start()
      machines.set(mode, machine)
    }

    for (const caseFile of cases) {
      const machine = machines.get(caseFile.spec.console)
      let result

      try {
        result = runCase(machine, caseFile)
      } catch (error) {
        result = { ok: false, output: '', reason: error.message }
      }

      // A case marked `expect-failure` exists to prove the harness can fail.
      const passed = caseFile.spec.expectFailure ? !result.ok : result.ok
      const note = caseFile.spec.expectFailure ? '  (expected to fail)' : ''

      if (passed) {
        console.log(`ok   ${caseFile.name}${note}`)
        if (verbose) console.log(indent(result.output))
      } else {
        failed++
        console.log(`FAIL ${caseFile.name}${note}`)
        if (caseFile.spec.expectFailure) {
          console.log('       this case is meant to fail, but it passed — the harness is not asserting')
        } else {
          console.log(`       ${result.reason}`)
        }
        console.log(indent(result.output))
      }
    }
  } finally {
    for (const machine of machines.values()) machine.stop()
  }

  const total = cases.length
  console.log(`\n${total - failed}/${total} cases ok`)
  if (failed) process.exit(1)
}

function indent(text) {
  return (text || '(no output)')
    .split('\n')
    .map((line) => `       | ${line}`)
    .join('\n')
}

main().catch((error) => {
  console.error(`verify: ${error.message}`)
  process.exit(1)
})
