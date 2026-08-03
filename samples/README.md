# samples/

Every code listing in the docs lives here as a real file, is included into the
Markdown by path, and is executed by `npm run verify` on the actual emulator
with its output asserted. The prose cannot drift from the tested file, because
it *is* the tested file.

A listing that cannot be verified does not go in.

## Layout

| Path | What it is |
|---|---|
| `basic/` | BASIC listings, typed into the machine as source and `RUN` |
| `assembly/` | ca65 sources, assembled with `cl65` and loaded as a `.prg` |
| `lib/` | `6502.cfg` (linker config) and `6502.inc` (**generated** — see below) |
| `_harness/` | Cases that test the harness itself, not the machine |
| `build/` | Assembler output and boot snapshots. Git-ignored, rebuilt every run. |

## Adding a sample

1. Drop the listing in as `name.bas`, `name.asm` or `name.prg`.
2. Add a sibling `name.expect` saying what must be true. The harness refuses to
   run a listing that has no `.expect`.
3. `npm run verify -- name` to run just that case, `-- --verbose` to see what
   the machine actually printed.
4. Include it in the prose with VitePress's snippet import:
   `<<< @/../samples/basic/name.bas`

## The `.expect` format

One directive per line; `#` starts a comment. A case must assert something.

| Directive | Effect |
|---|---|
| `expect <regex>` | Console output must match |
| `absent <regex>` | Console output must not match |
| `pass` | Shorthand for `expect ^PASS$` + `absent ^FAIL$` |
| `screen <regex>` | `dbg screen text` must match — implies `console video` |
| `console serial\|video` | Which machine to run on (default `serial`) |
| `wait <regex>` | What `RUN` waits for before asserting (default `OK`, serial only) |
| `cycles <n>` | Emulated cycles to advance after each send (video only, default 2,000,000) |
| `send <text>` | Extra input after `RUN`, before asserting (repeatable) |
| `timeout <duration>` | Per-assertion budget (default `20s`) |
| `expect-failure` | This case is *meant* to fail; the harness inverts the result |

Regexes are matched per line (`m` flag) against output with `\r` stripped — the
console sends CRLF, as a real serial terminal does.

### Video cases

`CLS`, `LOCATE` and `COLOR` silently do nothing on a machine with no video card
(their arguments are still consumed), so anything that draws has to be asserted
against the screen rather than the console. A `screen` directive puts the case on
its own machine booted with `--console video`.

Screen rows are padded to the full 40 columns, so anchor with `\s*$` rather than
`$`.

## How it runs

The method is the one in
[`6502-EMULATOR/docs/AGENTS.md`](https://github.com/acwright/6502-EMULATOR/blob/main/docs/AGENTS.md):

- **Boot once.** One emulator per console mode, clock pinned with
  `--rtc 2026-01-01T00:00:00`, snapshotted at the `OK` prompt.
- **Restore per case.** About a millisecond, against 5.36 million cycles to
  boot — and exact, so one case cannot leak into the next.
- **Wait, never sleep.** Serial cases block on a console pattern; video cases
  advance a fixed *emulated-cycle* budget, so the result does not depend on how
  fast the host is.
- **Bound everything.** Every send and wait carries a timeout; the harness exits
  non-zero on any failure.

`_harness/deliberate-failure` asserts something untrue on purpose. A suite that
cannot fail is not testing anything, so that case is reported `ok` when its
assertions do *not* hold — and goes red if they ever do.

## `lib/6502.inc` is generated

It is written by `npm run facts` from the BIOS source, so a sample can never
assemble against a stale address. Do not edit it; change the BIOS and
regenerate.

Reader-facing projects use the equivalent file shipped with the
[`6502-PRG`](https://github.com/acwright/6502-PRG) and
[`6502-CRT`](https://github.com/acwright/6502-CRT) templates, which Phase 5
documents. The two are derived from the same machine; diffing them is a
Phase 9 task tracked in [`ACCURACY.md`](../ACCURACY.md).
