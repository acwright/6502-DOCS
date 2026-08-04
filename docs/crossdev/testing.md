# Testing your program

A 6502 program can have a test suite. Not a simulation of one — the real ROM,
the real BASIC, the real Kernal, booted and driven and asserted on, ten cases in
about a second.

This is the chapter that pays for the whole section.

## The method

Five rules. The BIOS's own suite is built on them, and so is everything below.

**Boot once.** Booting to the `OK` prompt costs 5,359,120 emulated cycles.
Doing that per case is the difference between a suite you run constantly and one
you avoid.

**Restore per case.** Take a snapshot at the prompt and go back to it. About a
millisecond, and *exact* — memory, registers, video, the card's changed sectors
— so one case cannot leak into the next.

**Wait, don't sleep.** Every wait is a blocking call with a pattern and a
timeout. `sleep` is how a suite becomes flaky: it is either too short on a busy
machine or wasting your afternoon on a fast one.

**Bound everything.** Every send, every wait, and the machine itself get a
timeout. A hung program should fail the suite, not hold it open.

**Branch on exit codes.** `0` fine, `2` timed out, `4` hit a breakpoint. Parsing
console text for success is guesswork; the exit code is not.

## A suite

Here is one, whole. Drop it in your project as `test.sh`:

<<< @/../samples/crossdev/test.sh{bash}

## Using it

Put your cases in `tests/`. A case is either a built program or a BASIC listing,
with a sibling `.expect` saying what has to appear in its output:

```
tests/
  countdown.prg
  countdown.expect
  ticker.bas
  ticker.expect
```

```
expect ^10$
expect ^LIFT OFF$
```

```
$ ./test.sh
ok   tests/countdown.prg
ok   tests/ticker.bas
```

And when something breaks, it says so and shows you what the machine actually
printed:

```
$ ./test.sh
FAIL tests/countdown.prg
       expected /^BLAST OFF$/
     | RUN
     | 10
     | 9
     ⋮
     | LIFT OFF
     |
     | OK
ok   tests/ticker.bas
```

Non-zero exit, so a build server stops on it.

## Things the script is doing on purpose

**It waits for its own echo when typing a program.** BASIC answers `OK` to a
statement but says nothing back to a stored program line, so waiting for the
prompt after typing `10 PRINT "HI"` waits until the timeout. Waiting for the
line's own line number is the fix.

**It pins the clock** with `--rtc`. The clock chip is the only part of the
machine that reads your computer's clock, so with it fixed the same case
produces the same bytes on your laptop and on a build server.

**It sends the emulator's console to `/dev/null`.** The assertions read the
console through the debug server; the copy the emulator echoes on stdout would
just interleave itself with the results.

**It restores before every case, including the first.** Cheaper than reasoning
about which cases dirty what.

## Write a case that would fail

The most important case in any new suite is one that proves the suite can fail.
Break an expectation on purpose, watch it go red, put it back. A suite that has
never failed is not evidence of anything.

## Testing things that draw

`CLS`, `LOCATE` and `COLOR` do nothing at all on a machine with no video card —
they consume their arguments and return, which is what lets a program run
happily over a serial line. It also means a test for anything visual has to boot
a machine with the card fitted and read the screen instead of the console:

```sh
6502 run --headless --console video --debug --debug-port 6510 &
...
6502 dbg screen text --port 6510
```

Screen rows come back padded to the full forty columns, so anchor a pattern with
`\s*$` rather than `$`.

There is no console byte stream in video mode, so waiting works differently
too: advance the machine by a number of *emulated cycles* rather than waiting
for output. Emulated cycles, so the answer doesn't depend on how fast your
computer is:

```sh
6502 dbg wait --cycles 2000000 --run turbo --port 6510
```

## In continuous integration

Nothing here needs a display, an app, or a real machine, so the whole suite runs
on a build server. The emulator's CLI is Node rather than Electron, which means
a checkout and a build of the CLI is enough — no 100 MB browser binary needed
for a job that never opens a window.

Pin your versions. A suite that goes red on a morning nobody touched it is a
suite people stop believing.

Next: [getting the program onto a real ACE](/crossdev/to-hardware).
