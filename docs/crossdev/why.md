# Why cross-develop

You can write a program at the ACE's own keyboard, and for a lot of programs
that is exactly the right thing to do. Type it, run it, fix the line that was
wrong, run it again. Nothing to install, nothing between you and the machine.

Then the program gets to sixty lines, and you want to rename a variable in
eleven places.

## What you get

**Your own editor.** Search and replace, multiple files, undo that goes back
further than the last line. The ACE's line editor is fine for four lines and
tiring for forty.

**Version control.** A program in a folder on your computer is a program you can
put in git, diff, branch, and get back after you break it. This matters more
than it sounds: on the machine, the only copy of your work is the one in memory
until you `SAVE` it.

**An assembler.** Machine code is where the ACE gets fast, and hand-assembling
it is miserable. `cl65` turns labels and mnemonics into bytes and tells you
which line was wrong.

**A machine that boots instantly.** The emulator starts in a few hundred
milliseconds and can run flat out — much faster than real time. You will run
your program more often, because running it costs nothing.

**A program that checks itself.** This is the one people don't expect. A
headless run prints what the machine printed and exits with a status, so a
script can decide whether the program still works. Ten cases run in about a
second, which means you can have a test suite for a 6502 program —
[Testing your program](/crossdev/testing).

## The loop

```
edit  →  make  →  run  →  edit …
```

The `run` step has two shapes, and you will use both.

**Watch it.** `make run` opens a window with the machine in it, your program
already loaded. This is the one for anything with pictures, sound, or a person
in the loop.

**Read it.** The same build, headless, wired to your terminal, stopping on a
pattern you name. No window, no waiting, output you can pipe into something
else.

Neither is a simulation of the ACE's behavior. It is the same ROM the hardware
runs, the same BASIC, the same Kernal, the same 65C02.

## What you still go to the machine for

Cross-development does not replace the ACE; it feeds it.

- **Feel.** Whether a game is fun, whether a key repeat rate is right, whether
  the sound is annoying after two minutes. No terminal tells you.
- **The real screen.** Color on a CRT or a VGA panel is not color in a
  screenshot.
- **Real peripherals.** Your joysticks, your card, your cable.
- **The last mile.** A program that works in the emulator and not on the ACE is
  rare, but when it happens, only the ACE can tell you.

The habit that works: build and test on your computer, and put it on the real
machine often enough that "often enough" never becomes "the day before you
show someone".

## Where this section goes

The next two chapters install things. After that you clone a template, and by
[Build, run, repeat](/crossdev/build-run-loop) you have a program of your own
running. If you would rather see that first and install afterwards, skip
ahead — nothing in this section is out of order except the tools.
