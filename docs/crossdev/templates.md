# Starting from a template

Don't build a project from an empty directory. Three templates exist, all of
them working programs you can assemble in the next thirty seconds, and all of
them carrying the file you would otherwise spend an evening writing by hand.

| Template | What it makes | Runs |
|---|---|---|
| [`6502-PRG`](https://github.com/acwright/6502-PRG) | A program in RAM, loaded from BASIC | Alongside BASIC, the Kernal, everything |
| [`6502-CRT`](https://github.com/acwright/6502-CRT) | A cartridge ROM, or a banked Flash Cart | Instead of BASIC — it owns the machine |
| [`6502-BIN`](https://github.com/acwright/6502-BIN) | Raw machine code, with no BASIC stub in front of it | Alongside BASIC, but started by hand |

Start with `6502-PRG`. A cartridge is the right answer for a finished game you
want to plug in, and the wrong answer for anything you are still writing. A raw
binary is the answer when BASIC is in the way rather than in the picture — when
the only cable you have is a serial one, when you are working from the Monitor,
or when the program means to take the machine over.
[It has a section below](#the-raw-binary-template).

## Clone it

```sh
git clone https://github.com/acwright/6502-PRG.git countdown
cd countdown
make
```

That's a build. Several files came out; `Program.prg` is the one the machine
loads, and [the next chapter](/crossdev/makefile) explains the rest.

## What's in the box

| File | What it's for |
|---|---|
| `Program.asm` | The source. Yours to replace. |
| `6502.inc` | Every Kernal routine, hardware register and constant, by name |
| `6502.cfg` | The linker configuration — where things go in memory |
| `Makefile` | The build |

`6502.inc` is the one to open first. It's the reason your program can say

```asm
jsr PrintStr
```

instead of `jsr $A090`, and the reason it keeps working when the ROM's internals
move around. Everything in it is an address the BIOS publishes on purpose.

## How a program gets run

A `.prg` for this machine is loaded at `$0800` and started with BASIC's `RUN`,
which is a slightly strange thing for a machine-code program to do. The trick
is at the very front of the file:

```asm
BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00
```

Those twelve bytes are a tokenized BASIC line. They say:

```
10 SYS 2060
```

So `LOAD` brings the whole file into memory, `RUN` runs the one BASIC line it
finds, and `SYS 2060` jumps to address 2060 — `$080C`, the first byte after the
stub. That is your entry point. Leave those twelve bytes exactly where they
are; everything after them is yours.

Your program ends with `rts`, and control goes back to BASIC with the `OK`
prompt still there.

## The memory you're working in

| Range | What's there |
|---|---|
| `$0000–$0039` | Zero page the system owns — pointers, Monitor and transfer scratch |
| `$003A–$00FF` | **Zero page, yours.** 198 bytes, and the fastest memory on the machine |
| `$0100–$01FF` | The CPU stack, which is also where BASIC keeps `FOR` and `GOSUB` frames |
| `$0200–$02FF` | Keyboard ring buffer, filled by the encoders and drained by `Chrin` |
| `$0300–$03FF` | Kernal variables — interrupt vectors, cursor, hardware flags |
| `$0400–$05FF` | BASIC's raw input line and its tokenizing scratch |
| `$0600–$07FF` | The card sector buffer — **any filesystem call overwrites this** |
| `$0800–$080B` | The BASIC stub above |
| `$080C–$7FFF` | **Your code and data.** About 30 KB |
| `$8000–$9FFF` | Hardware registers |
| `$A000–$A0FF` | The Kernal jump table |

The machine is fully awake by the time you get control: hardware probed,
interrupts on, console chosen, keyboard live. You do not initialize anything.

::: tip Zero page is not a formality
`lda $40` is a byte shorter and a cycle faster than `lda $0440`, and indirect
addressing only works through zero page. Put your hot variables in `$3A`–`$FF`
and your loops get measurably quicker.
:::

## The cartridge template

`6502-CRT` is a different shape, because a cartridge replaces the top of the
address space:

| Range | What's there |
|---|---|
| `$A000–$BFFF` | Kernal and character set — **still there**, still callable |
| `$C000–$FFF9` | Your cartridge, in place of BASIC, the Monitor and Wozmon |
| `$FFFA–$FFFF` | The CPU's NMI, RESET and IRQ vectors — now yours to supply |

Because the reset vector is yours, the cartridge is what boots. Nothing has
initialized the machine yet, so the first thing it does is:

```asm
CartReset:
  ldx #$ff
  txs                    ; you own the stack pointer
  jsr KernalInit         ; probe and set up every card
  cli                    ; interrupts on
```

`KernalInit` does everything the normal boot does except reset the stack, enable
interrupts, and draw the splash — those three are deliberately left to you. From
that point the whole jump table works exactly as it does for a RAM program.

The template also supplies IRQ and NMI trampolines that jump through the RAM
vectors the Kernal set up, so a keyboard still works in a cartridge you haven't
written any interrupt code for.

## The raw binary template

`6502-BIN` drops the twelve-byte BASIC stub entirely. A `.bin` is machine code
from its very first byte, that first byte *is* the entry point, and BASIC is
never involved:

| | `.prg`, from `6502-PRG` | `.bin`, from `6502-BIN` |
|---|---|---|
| First bytes | The `10 SYS 2060` stub | Your code |
| Entry point | `$080C` | `$0800` |
| Started with | `LOAD`, then `RUN` | `SYS 2048`, the Monitor's `J 0800`, or `800R` in Wozmon |
| Survives a Wozmon paste | No | **Yes** |

That last row is the reason the template exists. [The Wozmon
paste](/crossdev/to-hardware#the-wozmon-paste) is the one route to a real
machine that needs nothing but the cable, and it is the one route a `.prg`
cannot travel: Wozmon deposits bytes one at a time and never tells BASIC how
many arrived, so `RUN` walks the tokenized line chain, decides the program ends
at `$080C`, and puts its first variable there — on top of the machine code. A
`.bin` asks BASIC for nothing, so none of that applies. Paste it, type `800R`,
and it runs.

It is also the natural shape for anything you drive from
[the Monitor](/using/monitor), which loads to `$0800` by default and has two
ways of starting code sitting there, and for a program that is taking the
machine over rather than borrowing it. The programs for
[the KIM keypad](/addons/kim) are `.bin` files of exactly this kind.

### Choose an ending that matches the start

A `.bin` cannot tell how it was reached, and the four ways of reaching it do not
leave the stack in the same state:

| Launch | What it does | How to end |
|---|---|---|
| `SYS 2048` at BASIC's prompt | `JSR` — there is a return address waiting | `rts`, back to the `OK` prompt |
| `J 0800` in the Monitor | `JSR` — the same | `rts`, back to the `.` prompt |
| `G 0800` in the Monitor | `JMP` via `RTI`, machine handed over, interrupts and all | `BRK`, which lands back in the Monitor |
| `800R` in Wozmon | `JMP` — no return address anywhere | Loop forever, `BRK`, or `JMP ($FFFC)` to reboot |

The template ends in `rts`, which makes `J` the command to launch it with and
`G` the one to save for a program that means to keep the machine. The
alternative endings sit commented out beside it, and so does a block at the top
of `Start:` that resets the stack pointer, calls `KernalInit` to probe and
initialize every card again, and re-enables interrupts — for exactly that
program. Running that block throws away whatever return address `J` or `SYS`
pushed, so it is a one-way door.

::: warning Zero page is only yours if the program never returns
A `.bin` entered with `SYS` or `J` leaves BASIC or the Monitor live underneath
it, still using zero page `$3A`–`$FF` as it runs. The table above calls that
range yours, and it is — for a program that takes the machine over and never
comes back. For one that ends in `rts`, treat it as occupied.
:::

### Getting it there

The Monitor loads a `.bin` and starts it in two lines:

```
L "BINARY.BIN"
J 0800
```

`L` loads to `$0800` unless you tell it otherwise, and `L` with no filename
receives the file over XMODEM instead — which is the answer when there is no
card in the slot. From BASIC, `BLOAD 2048,"BINARY.BIN"` does the same job and
`SYS 2048` starts it.

## Renaming things

The `Makefile` names the target once:

```make
TARGET = Program
EIGHTTHREE = PROGRAM
```

Change both, rename `Program.asm` to match, and everything downstream follows.
`EIGHTTHREE` is the name the file gets on the memory card, where names are
eight characters plus a three-character extension.

## Where a program goes when it works

A template is where a project starts, not where a finished one lives. Three
repositories collect the small things — a demo, a test, one screen of something
that works — a directory each, with its own build and its own README:

| | |
|---|---|
| [`6502-ASM`](https://github.com/acwright/6502-ASM) | Assembly programs, including worked examples of all three templates |
| [`6502-BAS`](https://github.com/acwright/6502-BAS) | BASIC listings, kept as text the way [BASIC from your editor](/crossdev/basic) describes |
| [`6502-C`](https://github.com/acwright/6502-C) | C programs, compiled with the cc65 you already installed |

Each of those says what a new directory needs. Anything with a life of its own
— a game, an application, something with releases and issues of its own — wants
a repository of its own instead, and then a place on the
[software list](/software/), which is how anybody else finds it.

Next: [what each Makefile target actually does](/crossdev/makefile).
