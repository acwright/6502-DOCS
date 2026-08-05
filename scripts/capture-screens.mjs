#!/usr/bin/env node
/**
 * capture-screens.mjs — photograph the machine's screen, reproducibly.
 *
 *   npm run screens                 # every shot
 *   npm run screens -- treasure     # shots whose name contains this
 *   npm run screens -- --keep       # leave the 320×240 originals in place
 *   npm run screens:verify          # re-take and compare; writes nothing
 *
 * Phase 8 of PLAN.md, tier 1: a screenshot in this guide is never a photograph
 * of somebody's monitor. Each one is a real machine, booted from the same ROM
 * the samples run against, driven through the same keystrokes a reader would
 * type, and read straight out of the video card with `dbg screen png`. When the
 * ROM moves, they are re-taken by running this again.
 *
 * Every shot that shows a program shows a program the harness already runs —
 * the manifest points at the file under `samples/`, so a picture cannot drift
 * from the listing printed beside it.
 *
 * The method is the one in 6502-EMULATOR/docs/AGENTS.md, with one difference
 * from the sample harness: a shot gets its own machine rather than a restore
 * from a shared snapshot. Some of these want the screen *mid-run* — the splash
 * before it clears, a graphics demo before it hands text mode back — and that is
 * cleaner to hit from a cold, paused start than from a snapshot taken at the
 * prompt.
 *
 * The video card puts out 320×240. That is scaled up by an exact factor with
 * nearest-neighbor sampling, because a character cell is eight hard pixels and
 * smoothing it into gray porridge is the one thing a screenshot of this machine
 * must not do.
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emulatorCommand } from './preflight.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAMPLES = join(ROOT, 'samples')
const BUILD = join(SAMPLES, 'build')
const OUT = join(ROOT, 'docs/public/images/screens')

// Pinned, as the sample harness pins it: same clock, same screen.
const RTC = '2026-01-01T00:00:00'
const PORT = Number(process.env.SCREENS_PORT ?? 6540)
// Two seconds of emulated time at 1 MHz — long enough for anything typed at
// the prompt to finish and draw.
const SETTLE = 2_000_000
const SCALE = 2

/**
 * Every picture the site takes off a real machine.
 *
 *   boot      'prompt' (default) waits for BASIC; 'splash' stops the machine
 *             mid-countdown, `cycles` from a cold start
 *   program   a file under samples/ — .bas is typed in, .asm is built and loaded
 *   lines     typed at the prompt instead of, or as well as, a program
 *   run       type RUN afterwards (default: yes, if there is a program)
 *   sends     what to type once it is running
 *   settle    emulated cycles to let pass before the shutter
 */
const SHOTS = [
  {
    name: 'boot-splash',
    subject: 'The splash and the five-second choice, caught before BASIC starts.',
    where: 'docs/getting-started/first-boot.md',
    boot: 'splash',
    // Two and a half million cycles in: the probe is done, the countdown is
    // running, and BASIC has not cleared the screen yet.
    cycles: 2_650_000
  },
  {
    name: 'first-program',
    subject: 'A first session: a sum, a variable, and the four-line program that asks your name.',
    where: 'docs/getting-started/first-ten-minutes.md',
    lines: ['PRINT 12 * 12', 'A = 5', 'PRINT A * A'],
    program: 'samples/basic/hello-name.bas',
    sends: ['ADA\\r']
  },
  {
    name: 'screen-text',
    subject: 'CLS, COLOR and LOCATE putting one line in the middle of the screen.',
    where: 'docs/using/sound-and-video.md',
    program: 'samples/basic/screen-text.bas'
  },
  {
    name: 'colors',
    subject: 'The color loop as it leaves the screen: the last of its fifteen colors, on the black it set.',
    where: 'docs/basic/sound-and-video.md',
    program: 'samples/basic/color-loop.bas',
    // The loop paints one color at a time over the same two words, so no
    // frame of it ever holds the whole palette. What a shot can show is where
    // it finishes. The picture of the palette is the Graphics I demo.
    settle: 4_000_000
  },
  {
    name: 'treasure',
    subject: 'The treasure grid, at the dig that finds it.',
    where: 'docs/basic/projects.md',
    program: 'samples/basic/treasure.bas',
    // Row 1 column 1 is empty; row 3 column 1 is where it is on a machine
    // booted with the clock pinned.
    sends: ['1\\r', '1\\r', '3\\r', '1\\r']
  },
  {
    name: 'monitor',
    subject: "The Monitor's dot prompt, a memory dump and the register display.",
    where: 'docs/using/monitor.md',
    lines: ['BRK'],
    sends: ['M 0800\\r', 'R\\r']
  },
  {
    name: 'wozmon',
    subject: "Wozmon's backslash, reached with J, and a dump of its own first bytes.",
    where: 'docs/using/monitor.md',
    lines: ['BRK'],
    // `J`, not `G`: `G` turns interrupts off on the way out and the keyboard
    // never reaches Wozmon's polling loop.
    sends: ['J FF00\\r', 'FF00.FF0F\\r']
  },
  {
    name: 'framed-sign',
    subject: 'A framed sign drawn character by character, in the box-drawing glyphs PRINT cannot reach.',
    where: 'docs/assembly/video.md',
    program: 'samples/assembly/screen.asm'
  },
  {
    name: 'graphics-1',
    subject: 'Graphics Mode I: thirty-two color pairs, one per row of the pattern table.',
    where: 'docs/assembly/graphics.md',
    program: 'samples/assembly/graphics-1.asm',
    // Caught while it waits for a key. Press one and it puts text mode back,
    // which is the one thing a picture of it must not show.
    settle: 8_000_000
  },
  {
    name: 'graphics-2',
    subject: 'Graphics Mode II, with a color for every eight pixels.',
    where: 'docs/assembly/graphics.md',
    program: 'samples/assembly/graphics-2.asm',
    settle: 8_000_000
  },
  {
    name: 'multicolor',
    subject: 'Multicolor mode: 64×48 fat pixels, fifteen colors, no attribute clash.',
    where: 'docs/assembly/graphics.md',
    program: 'samples/assembly/multicolor.asm',
    settle: 8_000_000
  }
]

// ---------------------------------------------------------------------------
// One machine, for one shot
// ---------------------------------------------------------------------------

class Machine {
  constructor(port, { paused = false } = {}) {
    this.port = port
    this.paused = paused
    this.emulator = emulatorCommand()
  }

  async start() {
    const args = [
      ...this.emulator.prefix,
      'run',
      '--headless',
      '--quiet',
      '--console',
      'video',
      '--debug',
      '--debug-port',
      String(this.port),
      '--rtc',
      RTC,
      '--timeout',
      '300s'
    ]
    // A cold start that runs the moment it is spawned has already passed the
    // splash by the time the debug server answers. `--pause` is what makes the
    // first two million cycles observable at all.
    if (this.paused) args.push('--pause')

    this.process = spawn(this.emulator.command, args, { stdio: 'ignore' })
    this.process.on('error', (error) => {
      throw new Error(`could not start the emulator: ${error.message}`)
    })

    await this.waitForServer()
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

  /** Advance by an emulated-cycle budget — the same picture on any host. */
  advance(cycles) {
    this.dbg(['wait', '--cycles', String(cycles), '--run', 'turbo', '--timeout', '120s'], {
      required: true
    })
  }

  screen() {
    return this.dbg(['screen', 'text'], { required: true }).out
  }

  /** Run until BASIC's prompt is on the screen. */
  waitForPrompt() {
    for (let i = 0; i < 20; i++) {
      this.advance(500_000)
      if (/^OK\s*$/m.test(this.screen())) return
    }
    throw new Error('the machine never reached the OK prompt')
  }

  send(text, settle = SETTLE) {
    this.dbg(['send', text, '--timeout', '20s'], { required: true })
    this.advance(settle)
  }

  capture(file) {
    this.dbg(['screen', 'png', file], { required: true })
  }

  dbg(args, { required = false } = {}) {
    const result = spawnSync(
      this.emulator.command,
      [...this.emulator.prefix, 'dbg', ...args, '--port', String(this.port)],
      { encoding: 'utf-8', timeout: 180_000 }
    )
    if (required && result.status !== 0) {
      throw new Error(`6502 dbg ${args.join(' ')} failed (${result.status}): ${(result.stderr || '').trim()}`)
    }
    return { ...result, out: (result.stdout ?? '').replace(/\r/g, '') }
  }

  stop() {
    this.process?.kill()
  }
}

function buildAssembly(source) {
  mkdirSync(BUILD, { recursive: true })
  const prg = join(BUILD, 'screens-' + source.replace(/[\/\\]/g, '-').replace(/\.asm$/, '.prg'))
  const result = spawnSync(
    'cl65',
    [
      '-t', 'none',
      '-C', join(SAMPLES, 'lib', '6502.cfg'),
      '--asm-include-dir', join(SAMPLES, 'lib'),
      '-o', prg,
      join(ROOT, source)
    ],
    { encoding: 'utf-8' }
  )
  if (result.status !== 0) {
    throw new Error(`cl65 failed:\n${(result.stderr || result.stdout || '').trim()}`)
  }
  return prg
}

/**
 * Scale up without smoothing: a character cell is eight hard pixels.
 *
 * The two `-define`s and the `-strip` are what make a shot reproducible. The
 * machine is deterministic and so is the encoder, but ImageMagick stamps three
 * `date:` text chunks and a `tIME` into every file it writes, so re-taking an
 * unchanged screen produced a 38-byte diff and eleven of them looked like the
 * ROM had moved. Without the timestamps the bytes are identical, which is what
 * lets `--check` below mean anything.
 */
function scale(file) {
  const result = spawnSync(
    'magick',
    [
      file,
      '-filter', 'point',
      '-resize', `${SCALE * 100}%`,
      '-strip',
      '-define', 'png:exclude-chunk=date,time',
      file
    ],
    { encoding: 'utf-8' }
  )
  if (result.error) throw new Error('ImageMagick is not installed — `brew install imagemagick`')
  if (result.status !== 0) throw new Error(`magick failed:\n${(result.stderr || '').trim()}`)
}

// ---------------------------------------------------------------------------

async function takeShot(shot, port, dest = OUT) {
  const machine = new Machine(port, { paused: shot.boot === 'splash' })
  const file = join(dest, `${shot.name}.png`)

  try {
    await machine.start()

    if (shot.boot === 'splash') {
      machine.advance(shot.cycles)
      machine.capture(file)
      return file
    }

    machine.waitForPrompt()

    for (const line of shot.lines ?? []) machine.send(`${line}\\r`)

    let runs = shot.run
    if (shot.program) {
      const ext = shot.program.slice(shot.program.lastIndexOf('.'))
      if (ext === '.bas') {
        // Typed in the way a reader types it, from the file the chapter shows.
        for (const line of readFileSync(join(ROOT, shot.program), 'utf-8').split('\n')) {
          if (line.trim()) machine.send(`${line.trim()}\\r`, 400_000)
        }
      } else {
        machine.dbg(['load', 'program', ext === '.asm' ? buildAssembly(shot.program) : join(ROOT, shot.program)], {
          required: true
        })
      }
      runs = runs ?? true
    }

    if (runs) machine.send('RUN\\r', shot.settle ?? SETTLE)

    for (const send of shot.sends ?? []) machine.send(send)
    if (!runs && !shot.sends?.length) machine.advance(shot.settle ?? SETTLE)

    machine.capture(file)
    return file
  } finally {
    machine.stop()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const keep = args.includes('--keep')
  // Re-take every shot into a scratch directory and compare, writing nothing.
  // A red run here means the machine draws something different than it did —
  // a new ROM, a new emulator, or a changed sample — and the fix is to look at
  // the picture and then run without --check.
  const check = args.includes('--check')
  const filters = args.filter((a) => !a.startsWith('--'))

  const shots = filters.length ? SHOTS.filter((s) => filters.some((f) => s.name.includes(f))) : SHOTS
  if (!shots.length) {
    console.error('screens: no shots matched')
    process.exit(1)
  }

  if (shots.some((s) => s.program?.endsWith('.asm')) && spawnSync('cl65', ['--version']).error) {
    console.error('screens: cl65 is not installed — run `npm run preflight`')
    process.exit(1)
  }

  const dest = check ? mkdtempSync(join(tmpdir(), 'screens-')) : OUT
  mkdirSync(dest, { recursive: true })
  let failed = 0
  let drifted = 0

  for (const [i, shot] of shots.entries()) {
    try {
      const file = await takeShot(shot, PORT + i, dest)
      if (!existsSync(file)) throw new Error('the emulator wrote no file')
      if (!keep) scale(file)

      if (check) {
        const committed = join(OUT, `${shot.name}.png`)
        if (!existsSync(committed)) {
          drifted++
          console.log(`DRIFT ${shot.name} — no committed screenshot`)
        } else if (!readFileSync(committed).equals(readFileSync(file))) {
          drifted++
          console.log(`DRIFT ${shot.name} — the machine draws something else now`)
        } else {
          console.log(`ok   images/screens/${shot.name}.png`)
        }
      } else {
        console.log(`ok   images/screens/${shot.name}.png  (${Math.round(statSync(file).size / 1024)} KB)`)
      }
    } catch (error) {
      failed++
      console.log(`FAIL ${shot.name}`)
      console.log(`       ${error.message}`)
    }
  }

  if (check) {
    rmSync(dest, { recursive: true, force: true })
    console.log(`\n${shots.length - failed - drifted}/${shots.length} shots current`)
    if (drifted) console.log('Run `npm run screens` and look at what changed before committing.')
    if (failed || drifted) process.exit(1)
    return
  }

  console.log(`\n${shots.length - failed}/${shots.length} shots taken`)
  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error(`screens: ${error.message}`)
  process.exit(1)
})
