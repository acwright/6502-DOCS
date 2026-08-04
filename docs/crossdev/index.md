# Cross-development

Everything up to here happens at the machine: you type a line, press
<kbd>Enter</kbd>, and something happens. That is the best way to learn a
computer and a fine way to write a short program.

This half is for when you want more room. Cross-development means writing your
program on your own computer — in your own editor, under version control — and
building it into something the ACE loads. It is how you write assembly. It is
how you write anything longer than a screenful. And it is how you get a program
to run and check itself while you are still typing.

## What you end up with

```
6502 run build/countdown.prg
```

A window opens, the machine boots, and your program runs. Take the window away
and the same build runs in your terminal, prints what it printed, and tells you
whether it worked:

```
$ printf '\rRUN\r' | 6502 run --headless --exit-on 'LIFT OFF' --timeout 20s build/countdown.prg
```

That second form is the interesting one. It turns "does my program work" into a
question a script can answer, which is what makes a test suite possible.

## What you need

Three things, and two of them are already on your computer:

| | |
|---|---|
| **A text editor** | Whichever one you already use |
| **cc65** | The assembler and linker — [installing it](/crossdev/cc65) has one trap in it |
| **The `6502` command** | The emulator, driven from a terminal |

There is no ACE in that list. You can do every chapter here with nothing but a
laptop, and move to hardware when you are ready — that is
[a chapter of its own](/crossdev/to-hardware).

Everything works the same on macOS, Linux and Windows.

## The chapters

| Chapter | What you get out of it |
|---|---|
| [Why cross-develop](/crossdev/why) | What the loop looks like, and when to stay at the machine instead |
| [Installing cc65](/crossdev/cc65) | The assembler, and the one version trap in this ecosystem |
| [The tool belt](/crossdev/tools) | Six tools, what each is for, and how to prove each one works |
| [Starting from a template](/crossdev/templates) | Clone a working project instead of building one |
| [The Makefile](/crossdev/makefile) | Every target, and how to add your own |
| [The linker config](/crossdev/linker) | Why a program starts at `$0800` and a cartridge at `$C000` |
| [Build, run, repeat](/crossdev/build-run-loop) | The loop itself, windowed and headless |
| [Debugging](/crossdev/debugging) | Breakpoints, registers, memory, and stepping through your own labels |
| [Testing your program](/crossdev/testing) | A suite that boots once and runs every case in a second |
| [Onto real hardware](/crossdev/to-hardware) | Memory card, serial cable, Wozmon paste, EEPROM |
| [BASIC from your editor](/crossdev/basic) | Write listings as text, keep them in version control |
| [Driving it from an agent](/crossdev/agents) | The machine as something a program can operate |

If you are here to write assembly, this section is the part that gets your
build working. What to write once it does — the 65C02 itself, and the Kernal
routines your program calls — is the assembly guide, and it comes next.
