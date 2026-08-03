# Using the emulator instead of hardware

You don't need a physical board to use anything in this guide. The
[6502-EMULATOR](https://github.com/acwright/6502-EMULATOR) runs the exact
same BIOS, and every code sample on this entire site is `RUN`-verified
against it — not a simulation of the real thing, the thing this documentation
actually checks its claims against.

## Two ways to run it

**In the browser**, no install: <https://acwright.github.io/6502-EMULATOR/>.
Good for trying BASIC or the Monitor without installing anything.

**As a desktop app** (macOS, Windows, Linux), an Electron application with a
window, serial port picker, CompactFlash image loader, and a debug server.
This is also how you get the command-line tool used throughout this site:
**Settings → Command Line → Install**. After that, `6502` is on your `PATH`.

## Loading programs and CF images

- **A program**: drag a `.prg`/`.bin` build onto the window, or from the
  command line, `6502 run build/game.prg` opens the desktop app with it
  already loaded.
- **A CompactFlash image**: the Storage panel's file picker loads a `.img`
  built by [`cffs`](https://github.com/acwright/cffs) — the same tool this
  site's own test harness uses to build the fixture behind
  [Storage](/using/storage)'s samples. A selected image persists across
  restarts; an **✕** button reverts to the default.
- **A serial connection**: pick a host serial port and baud (`19200`,
  `8-N-1` — see [Serial & XModem](/using/serial)) and connect, in the app or
  the browser build alike.

## Headless — the mode this whole site runs on

`6502 run --headless` runs with no window at all, console wired to stdin and
stdout — scriptable, and exactly what `npm run verify` in this repo does for
every sample:

```
6502 run --headless build/game.prg
6502 run --headless --exit-on 'OK[^]*OK' --timeout 10s
```

Add `--cf disk.img` to attach storage, `--console video` to get a video
console instead of serial, `--rtc <iso8601>` to pin the clock so a run
produces byte-identical output every time — the same flag this repo's
harness uses (`--rtc 2026-01-01T00:00:00`) so a run on a laptop and a run in
CI land on the same machine.

## Debugging

`--debug` serves a JSON-RPC protocol (WebSocket and HTTP, loopback-only) that
`6502 dbg <command>` talks to: read/write registers and memory, set
breakpoints and watchpoints, step, disassemble, save and restore whole-machine
snapshots, and — the mechanism behind every screenshot this site will ever
publish — read the screen as text or a PNG. This is also how the storage
harness works: boot once, snapshot at the `OK` prompt, restore per test case
rather than rebooting, so [Storage](/using/storage)'s samples run in
milliseconds instead of reboot after reboot.

## Driving it from an AI agent

The emulator's own
[`docs/AGENTS.md`](https://github.com/acwright/6502-EMULATOR/blob/main/docs/AGENTS.md)
documents the exact method this repo's `scripts/verify-samples.mjs` follows:
boot once, snapshot, restore per case, wait on a pattern rather than sleeping,
bound everything with a timeout, and branch on exit codes. It's a genuine
differentiator of this ecosystem — every claim in this documentation was
checked by an agent driving this same interface, not eyeballed once and
written down.
