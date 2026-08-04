# Starting from a template

Don't build a project from an empty directory. Two templates exist, both of
them working programs you can assemble in the next thirty seconds, and both
carry the file you would otherwise spend an evening writing by hand.

| Template | What it makes | Runs |
|---|---|---|
| [`6502-PRG`](https://github.com/acwright/6502-PRG) | A program in RAM, loaded from BASIC | Alongside BASIC, the Kernal, everything |
| [`6502-CRT`](https://github.com/acwright/6502-CRT) | A cartridge ROM | Instead of BASIC — it owns the machine |

Start with `6502-PRG`. A cartridge is the right answer for a finished game you
want to plug in, and the wrong answer for anything you are still writing.

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
interrupts on, console chosen, keyboard live. You do not initialise anything.

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
initialised the machine yet, so the first thing it does is:

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

## Renaming things

The `Makefile` names the target once:

```make
TARGET = Program
EIGHTTHREE = PROGRAM
```

Change both, rename `Program.asm` to match, and everything downstream follows.
`EIGHTTHREE` is the name the file gets on the memory card, where names are
eight characters plus a three-character extension.

Next: [what each Makefile target actually does](/crossdev/makefile).
