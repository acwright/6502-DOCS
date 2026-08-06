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
| `lib/` | `6502.cfg` (linker config) and `6502.inc` (**generated** — see below) |
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

## The two cases that assert the branch you are not writing for

`assembly/f18a-detect` and `basic/f18a-detect` are the F18A section's detection
routines. F18A mode exists on hardware only — the emulator masks video register
writes to 0-7 exactly as the real TMS9918A does — so the enhanced branches of
both programs are unreachable here and always will be.

What runs is the other branch, and it is the one worth pinning down. It is what
executes on every machine that is not an ACE with the enhanced firmware, and its
job is to notice that, say so, and put back the three registers the attempt
clobbered on the way past. Both `.expect` files assert the report **and** that
the prompt is still on the screen afterwards, because the failure mode of a
careless detector is not a wrong answer — it is a blank screen.

Neither case can be extended to cover the rest of the section. A worked F18A
graphics program would have to be verified on hardware and recorded here the way
`crossdev/test.sh` is.

## The three cases that assert less than they look like they do

`assembly/graphics-1`, `assembly/graphics-2` and `assembly/multicolor` are the
TMS demos, ported from `6502-ASM`. Each takes the screen off the machine, draws
into a mode where the name table holds pixels rather than characters, waits for
a key, restores text mode and returns.

`dbg screen text` reads that name table as characters, so in a graphics mode it
produces deterministic gibberish. Asserting on it would be asserting on the
random-number generator. What these three cases check instead is the part that
can genuinely break: the demo runs to the end, `InitVideo` puts text mode back,
and BASIC's prompt reappears. A crash, a hang, or a mode left broken all fail.

The pictures themselves are a screenshot problem, not a harness problem —
`npm run screens` re-takes them.

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
| `console serial\|video\|storage` | Which machine to run on (default `serial`) |
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
[`6502-CRT`](https://github.com/acwright/6502-CRT) templates. The two are
derived from the same machine; diffing them is tracked in
[`ACCURACY.md`](../ACCURACY.md).
