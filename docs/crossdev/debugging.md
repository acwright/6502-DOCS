# Debugging

The emulator has a debugger in it: breakpoints, watchpoints, registers, memory,
single-stepping, and your own labels. It is driven from the command line, one
command at a time, which makes it as easy to script as it is to use by hand.

## Build with symbols first

```
cl65 -t none -C 6502.cfg -g -Ln build/countdown.lbl -o build/countdown.prg countdown.asm
```

`-Ln` writes a label file. **`-g` is not optional** — without it the label file
comes out zero bytes long and the debugger has nothing to work with. With both,
you get a couple of hundred lines: every label in your program, plus every
Kernal routine and hardware register the include file names.

::: warning A constant your debugger can't see
ca65 has two ways to give a name a value, and they are not the same here:

```asm
Counter  = $40      ; a constant. Not in the label file.
Counter := $40      ; an address. Exported, and the debugger knows it.
```

Use `:=` for anything you'll want to look at while the program runs.
:::

There's a richer format too, if you want source line numbers rather than just
labels:

```
cl65 ... -g -Wl --dbgfile,build/countdown.dbg ...
```

Both work; the debugger takes either.

## Start a machine you can talk to

```
6502 run --headless --quiet --debug --debug-port 6510 build/countdown.prg &
```

`--debug` serves a debug protocol; every `6502 dbg` command connects to it, does
one thing, prints the answer and exits. There is no session to keep alive, which
is what makes it scriptable.

Add `--symbols build/countdown.lbl` to load your labels at boot, or do it later
with `6502 dbg sym load`.

```
6502 dbg info --port 6510
```

```
headless 2.6.1 — serial console, 1 MHz, turbo, 1722240 cycles
```

::: tip Ports
With one emulator running you can leave `--port` off entirely — the machine
publishes where it is listening and every `dbg` command finds it. Give a port
explicitly when you have two machines up, which mostly means "when a test run is
going on in another window".
:::

## Stop somewhere interesting

Get to the prompt first — breaking on your program before BASIC exists is not
useful:

```
6502 dbg wait --serial 'OK' --run turbo --timeout 30s
```

Then set the breakpoint and start the program:

```
6502 dbg break CountLoop
6502 dbg send 'RUN\r'
6502 dbg wait --stopped --timeout 10s
```

```
#1  exec  $0810  hits=0
sent 4 byte(s)
breakpoint #1 at $0810
```

The machine is now halted on the first instruction of the loop, and the
countdown has printed nothing yet.

## Look around

```
6502 dbg regs
```

```
A=$0A  X=$00  Y=$00  SP=$FD  PC=$0810  P=$21 [nvbdizC]
```

Lower-case flags are clear, upper-case set: carry is set here, zero is not.

```
6502 dbg disasm
```

```
 0810  A5 40     LDA Counter
 0812  A2 00     LDX #$00
 0814  20 96 A0  JSR PrintDecU16
 0817  20 93 A0  JSR PrintCRLF
 081A  C6 40     DEC Counter
 081C  D0 F2     BNE CountLoop
```

Your labels come back out, which is the whole reason for building with `-g`.
`PrintDecU16` is named too, because the include file's addresses are in the same
label file.

```
6502 dbg mem Counter 1
```

```
0040  0A                                               .
```

Ten, as it should be at the top of the loop. `mem` takes a symbol anywhere it
takes an address.

## Step

| | |
|---|---|
| `6502 dbg step` | One instruction |
| `6502 dbg step --over` | Over a `jsr` — run the subroutine, stop after it |
| `6502 dbg step --out` | Run until this subroutine returns |
| `6502 dbg step --count 5` | Five at a time |
| `6502 dbg runto $081A` | Run until an address, no breakpoint needed |
| `6502 dbg runcycles 100000` | Run an exact number of cycles |

```
6502 dbg step --over
```

```
stepped
A=$0A  X=$00  Y=$00  SP=$FD  PC=$0814  P=$23 [nvbdiZC]
```

Every stepping command prints the registers afterwards, so you rarely need to
ask separately.

## Stop only when it matters

A breakpoint in a loop that runs ten times is a breakpoint you hit ten times.
Give it a condition:

```
6502 dbg break CountLoop --condition '[Counter] == 3'
```

```
#1  exec  $0810  hits=0  if [Counter] == 3
```

Now `RUN` prints 10 down to 4 and stops with three still to go. The condition
language is small and readable:

| | |
|---|---|
| `A == $FF` | A register |
| `[Counter]` | The byte at an address — square brackets read one byte |
| `{$0300}` | The word at an address — a 16-bit little-endian read, for pointers |
| `X != 0 && [$0400] > 10` | The usual operators, combined |

Bare names resolve as symbols, `$` and `0x` are hex, bare digits are decimal.

::: warning A typo'd symbol makes the condition always true
Name something the debugger has never heard of — `[Countr] == 3` — and the
breakpoint is still accepted, and it fires on the first hit, every time. It does
tell you why it stopped:

```
breakpoint #1 at $A000 (condition could not be evaluated: unknown name "Countr")
```

So if a conditional breakpoint goes off immediately, read the stop line before
you go looking at your program. Combined with the `=` and `:=` distinction
above, this is easy to walk into: a constant defined with `=` looks like a
symbol and isn't one.
:::

## Watchpoints

Stop when memory changes rather than when the program reaches somewhere:

```
6502 dbg break $0307 --watch write
```

```
#1  write  $0307  hits=0
```

`--watch read`, `--watch write` or `--watch access`, and `--end` covers a whole
range. This is the tool for "something is scribbling on my variable and I don't
know what" — arguably the single most valuable thing in the debugger, because it
answers a question that is otherwise almost unanswerable.

## Managing them

```
6502 dbg break list
6502 dbg break disable 2
6502 dbg break clear 2         # or clear everything, with no id
```

```
#1  write  $0307  hits=0
#2  exec  $A090  hits=1  if Y == 0x08
```

`hits` counts how many times each one has fired, which is often the answer on
its own.

## Change the machine without rebuilding

```
6502 dbg mem write $40 5        # the countdown now starts from five
6502 dbg mem write $0400 DEADBEEF
6502 dbg regs --set A=0x42
6502 dbg mem fill $0400 16 $EA      # or 0, or 0x00
```

Patching memory and resuming is much faster than an edit-and-rebuild cycle when
you're testing a guess. Just remember the patch lives in that machine only, and
goes away when it does.

One argument difference worth knowing: `mem write` takes a run of bytes as a
hex string, so `DEADBEEF` is four of them, while `mem fill` takes a single byte
— `0`, `$EA` and `0x00` all work, and anything outside `$00-$FF` is refused.

## Snapshots

```
6502 dbg state save ready.state
6502 dbg state load ready.state
```

A snapshot is the whole machine — RAM, registers, video memory, the clock chip,
the card's changed sectors — in about 52 KB. Restoring is roughly a millisecond,
against the five million cycles a cold boot costs, and it is exact, so it is the
cheapest way to get back to a known-good starting point twenty times in a row.
[Testing your program](/crossdev/testing) is built on this.

A snapshot is refused rather than half-applied if the machine doesn't match —
different ROM, different cards. Keep it next to the ROM it was taken against.

## Exit codes

Every `dbg` command tells a script what happened:

| Code | Meaning |
|---|---|
| `0` | Fine |
| `1` | Usage error, or the machine rejected the request |
| `2` | A `wait` timed out |
| `3` | No emulator found |
| `4` | Stopped on a breakpoint or watchpoint |

Add `--json` to any of them for the raw result instead of the formatted text.

## By hand instead

```
6502 attach
```

The same commands as an interactive session, with console output and stop
events streaming as they happen. Better for a person; useless in a script, which
is why everything above is one-shot.

## The screen

When a machine has a video card fitted (`--console video`), you can read the
screen as text and assert on it — the ordinary console stream carries nothing in
that mode:

```
6502 dbg screen text
6502 dbg screen png shot.png
```

`screen hash` is the cheap version, for "has anything changed".

Next: [turning all of this into a test suite](/crossdev/testing).
