# samples/

Every code listing in the docs lives here as a real file, is included into the
Markdown by path, and is executed by `npm run verify` on the actual emulator
with its output asserted. The prose cannot drift from the tested file, because
it *is* the tested file.

A listing that cannot be verified does not go in.

## Layout

| Path | What it is |
|---|---|
| `basic/` | BASIC listings shown in a chapter, typed into the machine as source and `RUN` |
| `assembly/` | ca65 sources shown in a chapter, assembled with `cl65` and loaded as a `.prg` |
| `crossdev/` | The worked program of the cross-development chapters, plus the `test.sh` those chapters ship |
| `embed/` | The starter page the emulator chapter hands a reader who wants their program on the web |
| `_checks/` | Regression cases that are **never shown** in the docs |
| `_harness/` | Cases that test the harness itself, not the machine |
| `lib/` | `6502.cfg` (linker config) and `6502-VDP.inc` (**a copy of 6502-ASM's** — see below) |
| `build/` | Assembler output and boot snapshots. Git-ignored, rebuilt every run. |

### Shown versus not shown

A sample under `basic/` or `assembly/` appears on a page, so it has to read as a
program somebody wrote on purpose — it draws something, plays something, saves
something. It asserts on its own real output with `expect`. **It never contains
`PRINT "PASS"`.** See *Voice & style* in the top-level README, which is binding.

`_checks/` is where the pure regression cases live: memory-map spot checks, the
truth-value convention, the storage command surface. Those exist to turn CI red
when the ROM moves, nobody reads them, and they may use the `pass` shorthand
freely.

## The two things the harness does not run

The harness runs programs. Two of the files here are not programs, so each is
checked by hand and the check is written down rather than remembered.

**`crossdev/test.sh`** is the copyable regression script the cross-development
chapters hand the reader. The harness ignores it — it is not a `.bas`, `.asm` or
`.prg` — so it is checked by hand instead: run it against a directory holding a
`.prg` case and a `.bas` case, confirm both report `ok`, break one expectation
and confirm it reports `FAIL` and exits non-zero. Do that again whenever the
emulator's CLI moves.

**`embed/itch/`** is the page a reader zips and uploads. `index.html` is the
file the emulator chapter displays, so what a reader copies cannot drift from
what was checked; `game.prg` is written by `scripts/build-embeds.mjs` from
`basic/treasure.bas`, and `npm run verify` fails if it stops matching that
listing. What is left is whether the page works, which needs a browser:

1. **On itch.io.** Zip the folder, create a project, set the kind to HTML,
   upload with *play in the browser* ticked, viewport 640 x 520. Play it. A
   draft project is private, so this costs nothing to repeat.
2. **From `file://`.** Open `index.html` directly. The emulator must boot to a
   BASIC prompt and say why the program did not load — the frame fetches over
   `https:` only. That is the documented behavior, and the chapter warns about
   it; a *silent* failure here would be the bug.
3. **From `npm run docs:preview`.** The chapter's copy of the page must render
   with its parameters intact, and `npm run links` must pass, which is what
   checks those parameters against the release the site is pinned to.

Repeat 1 whenever the frame's contract moves — that is,
`6502-EMULATOR/docs/EMBEDDING.md`.

## Cases that are not files

The BASIC reference carries a worked example for every keyword, and 170 files
for 85 one-liners would bury the samples that a reader is actually meant to
type. Those live in [`../data/basic-examples.json`](../data/basic-examples.json)
instead, and the harness discovers them alongside everything here — they report
as `reference/<KEYWORD>`.

An entry gives `example` lines and `output` lines. The lines are typed into the
machine and the output is asserted verbatim, and both arrays are what the
reference page renders, so the page cannot show output the machine did not
produce. `console`, `sends`, `wait`, `timeout`, `absent` and `screen` mean what
they mean below; `run: false` suppresses the automatic `RUN`.

## Adding a sample

1. Drop the listing in as `name.bas`, `name.asm` or `name.prg`.
2. Add a sibling `name.expect` saying what must be true. The harness refuses to
   run a listing that has no `.expect`.
3. `npm run verify -- name` to run just that case, `-- --verbose` to see what
   the machine actually printed.
4. Include it in the prose with VitePress's snippet import:
   `<<< @/../samples/basic/name.bas`

If the case is a regression check rather than something a reader would enjoy
running, put it in `_checks/` and skip step 4.

## The `.expect` format

One directive per line; `#` starts a comment. A case must assert something.

| Directive | Effect |
|---|---|
| `expect <regex>` | Console output must match |
| `absent <regex>` | Console output must not match |
| `pass` | Shorthand for `expect ^PASS$` + `absent ^FAIL$` — `_checks/` only |
| `screen <regex>` | `dbg screen text` must match — implies `console video` |
| `picture <hash>` | `dbg screen hash` must be exactly these eight hex digits — implies `console video` |
| `console serial\|video\|storage\|video storage` | Which machine to run on (default `serial`) |
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

Screen rows are padded to the width of the screen — 40 columns of text, or 32
or 40 when a program has changed layout — so anchor with `\s*$` rather than
`$`. An example in `data/basic-examples.json` can carry a `picture` too, for
the keywords whose effect is a picture rather than text.

A program that draws tiles, sprites or colors rather than text asserts with
`picture`: the digest of the whole frame, taken once the last `send` has
settled. The machine is deterministic — pinned clock, fixed cycle budgets — so
the same program draws the same frame, and one wrong pixel changes the digest.
To take a new one, run the case with a placeholder digest and copy the one the
failure reports, after looking at the picture (`npm run screens` shows it).

### Storage cases

`console storage` boots with a prepared CompactFlash image attached
(`--cf`), built fresh before every run by `buildStorageFixture()` via the
already-installed `cffs` CLI — not checked into git, the same treatment as
assembled `.prg` output. The fixture carries one seed file, `HELLO.TXT`. A
case that `DEL`s or `FORMAT`s it doesn't affect the next case: every case
restores from the snapshot taken right after boot, and that restore reverts
the CF card's contents along with everything else — confirmed directly by
running `FORMAT` then restoring the snapshot and seeing `HELLO.TXT`
reappear in `DIR`.

`console video storage` is both at once: a video console with the same image
attached. It exists for `VLOAD`, which reads a file off the card into the video
card's memory, where only the screen can show the result — a serial console has
no video card for it to write to.

Watch for one thing writing a `.expect` for a storage case: typing a program
line that contains a bare filename (`DEL "HELLO.TXT"`) gets echoed back into
the console output verbatim, unpadded. A directory listing pads names to
their 8.3 field width (`HELLO   .TXT`), so an `absent` check meant to prove a
file is *gone* needs to require that padding (`HELLO\s+\.TXT`, not
`HELLO\s*\.TXT`) or it will trip on the echoed program text instead of the
real directory line.

## How it runs

The method is the one in
[`6502-EMULATOR/docs/AGENTS.md`](https://github.com/acwright/6502-EMULATOR/blob/main/docs/AGENTS.md):

- **The site's machine, or none.** Every emulator starts with `--vdp picovdp`
  and nothing said about flow control, which is on unless `--no-flow-control`
  takes it away. The harness refuses one whose `dbg info` doesn't show flow
  control on and the PICOVDP fitted (or, on a serial console, no card at all),
  or that didn't print `AC6502 BIOS v2.0` on the way to the prompt. Reading it
  back rather than asking for it is the point: without flow control a pasted
  listing loses lines, intermittently.
- **Boot once.** One emulator per console mode, clock pinned with
  `--rtc 2026-01-01T00:00:00`, snapshotted at the `OK` prompt.
- **Restore per case.** About a millisecond, against the 330,000 cycles it takes to
  boot — and exact, so one case cannot leak into the next.
- **Wait, never sleep.** Serial cases block on a console pattern; video cases
  advance a fixed *emulated-cycle* budget, so the result does not depend on how
  fast the host is.
- **Bound everything.** Every send and wait carries a timeout; the harness exits
  non-zero on any failure.

`_harness/deliberate-failure` asserts something untrue on purpose. A suite that
cannot fail is not testing anything, so that case is reported `ok` when its
assertions do *not* hold — and goes red if they ever do.

## `lib/6502-VDP.inc` is a copy

It is [`6502-ASM`](https://github.com/acwright/6502-ASM)'s `6502-VDP.inc`,
byte for byte — the include a reader's `make VDP=1` project uses, and the one
the [`6502-PRG`](https://github.com/acwright/6502-PRG) and
[`6502-CRT`](https://github.com/acwright/6502-CRT) templates ship. So every
listing on the site says `.include "6502-VDP.inc"` exactly as the reader's own
program would.

Do not edit it here. `npm run facts` and `npm run facts:check` hold it to the
fact base — every Kernal slot, `HW_*` flag, I/O register and palette row 0
color, and every RAM variable it names — and fail if the BIOS has moved on
without it. The fix is a fresh copy from `6502-ASM`, never a local change.
