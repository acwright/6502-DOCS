# Driving it from an agent

Everything in this section is a command with a bounded runtime and a meaningful
exit code. That makes the machine unusually easy to hand to an AI coding agent:
it can write 6502 code, run it on a real emulated machine, read what happened,
and fix it — without you in the loop for each turn.

This is genuinely unusual. An agent asked to write 6502 code with no machine to
hand will write something that looks right, and looking right is not a property
6502 code has reliably. Give it a machine and the guessing stops.

## The short version

Point your agent at
[**AGENTS.md**](https://github.com/acwright/6502-EMULATOR/blob/main/docs/AGENTS.md)
in the emulator's repository. It's written to be copied into your own project's
agent instructions, and it covers the whole method with runnable examples.

What's below is the shape of it, so you know what you're handing over.

## One process in, one answer out

The smallest useful thing needs no server and no session:

```sh
printf '\rPRINT 6*7\r' | 6502 run --headless --exit-on 'OK[\s\S]*OK' --timeout 20s
```

```
6502 BASIC V2.0
30718 BYTES FREE

OK
PRINT 6*7
 42

OK
```

An agent can run that, read the output, and know whether it was right. Add
`--json` and it gets a structured reason for the stop as well.

## Why it suits an agent particularly

**The console is a byte stream.** Booted with no video card, the BIOS routes its
console to the serial port — so stdin and stdout *are* the machine's terminal.
There's no screen to scrape and no pixels to interpret; the machine's actual
`PRINT` output arrives in order, as text.

**It's deterministic.** Same ROM, same input, same cycle budget, same result —
provided the clock is pinned with `--rtc`. That's what makes a failure
reproducible rather than a story about something that happened once.

**It's fast, and it can skip its own boot.** Around 11 MHz unpaced, and a
snapshot turns a five-second boot into a millisecond restore. An agent can
afford to run the program after every edit, which is the behavior you want.

**There's no session to lose.** Each `6502 dbg` command connects, does one
thing, prints, and exits. An agent has nowhere to keep a port number between
shell calls, so the machine publishes where it's listening and every command
finds it.

## The debugging loop

```sh
6502 run --headless --debug --pause --bin 0x7F00=code.bin &

6502 dbg break 0x7F00
6502 dbg wait --serial 'OK' --run turbo
6502 dbg send 'SYS 32512\r'
6502 dbg wait --stopped

6502 dbg regs
6502 dbg disasm 0x7F00 3
6502 dbg mem 0x0300 16
6502 dbg step --over
6502 dbg mem write 0x7F01 59      # patch it, no rebuild
6502 dbg run
```

Every one of those is available to a person too — see
[Debugging](/crossdev/debugging). Nothing is agent-specific; it's just that
one-shot commands with exit codes happen to be exactly what an agent can use.

## The traps worth passing along

Each of these is real machine or firmware behavior rather than an emulator
quirk, and each has cost somebody an hour:

**Wait for a prompt before typing.** Input delivered before the BIOS has
finished probing sits unread in the serial port's receive register and blocks
everything behind it — the console appears to die. Wait for output first, or use
`--input-after`.

**The splash swallows keystrokes.** It takes <kbd>Enter</kbd> or <kbd>Esc</kbd>
and acts at once; anything else sent before that choice is discarded. Lead with
a carriage return.

**BASIC says `OK` to a statement, not to a stored program line.** Waiting for
`OK` after typing `10 PRINT "HI"` waits until the timeout. Wait for the line's
own echo.

**Editing a program clears BASIC's variables.** Set variables *after* entering
program lines, or the assignment silently disappears.

**Console output is CRLF**, as a real serial terminal sends. Strip the `\r`
before matching an anchored pattern.

**A machine with no video card is not the same machine.** `CLS`, `LOCATE` and
`COLOR` consume their arguments and do nothing. Test anything visual with
`--console video` and read the screen with `dbg screen text`.

## What to actually hand over

If you want an agent working on 6502 code in your project, three things:

1. **`AGENTS.md`** from the emulator, in your project's agent instructions.
2. **A test suite** it can run — [Testing your program](/crossdev/testing). An
   agent with a way to check its own work behaves very differently from one
   without.
3. **A `Makefile`** with obvious targets, so "build it" is one command and not a
   guess.

The rest is the same advice as for a human collaborator: small steps, run it
often, and don't believe code that hasn't been executed.
