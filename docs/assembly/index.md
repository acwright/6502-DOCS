# Where to start

BASIC is a good place to live. Assembly is where you go when you want the
machine to do something BASIC is too slow for, or too polite for: move a
hundred things on the screen at once, read a joystick between two scan lines,
take over the whole computer at power-on.

It is also, on this machine, not very far away. The processor has three
registers and a few dozen instructions. Everything the ACE can do — screen,
sound, keyboard, sticks, files, clock, serial port — is already written, sitting
in the ROM, waiting behind a table of addresses that never move. Your program
calls those the same way BASIC does.

## What you need

- **An assembler.** [cc65](/crossdev/cc65), which the
  [cross-development section](/crossdev/) sets up from scratch.
- **Somewhere to run it.** Your ACE, or the emulator on your laptop. Every
  program in this section runs on both.
- **BASIC.** Not to write in — to load and start your program with, which is
  the easiest way to get machine code into a running machine.

If none of that is in place yet, go and do
[Starting from a template](/crossdev/templates) first. It takes about ten
minutes and hands you a working build.

## The order these are in

The first four chapters are the processor and the map: what the registers are,
how instructions reach memory, and what lives where. Read them once, then come
back when something surprises you.

[The Kernal](/assembly/kernal) is the chapter everything else leans on. It is
the machine's API — 53 routines at fixed addresses that do the hard parts, and
the reason a twelve-line program can print on the screen.

After that the chapters are by job: putting characters on the screen, making a
noise, reading the sticks, saving a file. Each one has a program you can
assemble and run, and each program does something you would actually want.

The last few are the ones you reach for later — writing a cartridge, mixing
machine code into a BASIC program, using the banked memory, and the small habits
that make 65C02 code fast.

## The one rule

**Call the slot, not the implementation.** Every routine in the ROM has two
addresses: the one in the jump table at the bottom of the Kernal, and the one
the code actually sits at. The first never changes. The second moves whenever
the ROM is rebuilt. Use the names in `6502.inc` and this will never be your
problem.

Start with [the 65C02](/assembly/65c02).
