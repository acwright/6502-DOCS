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
the only cable you have is a serial one, or when the program means to take the
machine over. [It has a section below](#the-raw-binary-template).

## Clone it

```sh
git clone https://github.com/acwright/6502-PRG.git countdown
cd countdown
make
```

That's a build for the machine this guide describes, with its 6502-PICOVDP video
card. Several files came out; `Program-VDP.prg` is the one the machine loads,
and [the next chapter](/crossdev/makefile) explains the rest.

::: tip `make VDP=1`, every time
Written as plain `make`, the template builds for the older ACE with a TMS9918A
video card and BIOS 1.6 — the machine the
[BIOS 1.6 edition](https://acwright.github.io/6502-DOCS/v1/crossdev/templates)
of this guide describes. Everything in this guide wants `make VDP=1`, and
everything below assumes it.
:::

## What's in the box

| File | What it's for |
|---|---|
| `Program.asm` | The source. Yours to replace. |
| `6502-VDP.inc` | Every Kernal routine, hardware register and constant, by name, for BIOS 2.0 and the 6502-PICOVDP |
| `6502.inc` | The same for the older ACE with a TMS9918A and BIOS 1.6 |
| `6502.cfg` | The linker configuration — where things go in memory |
| `Makefile` | The build |

`6502-VDP.inc` is the one to open first. It's the reason your program can say

```asm
jsr PrintStr
```

instead of `jsr $A090`, and the reason it keeps working when the ROM's internals
move around. Everything in it is an address the BIOS publishes on purpose, or a
value the video card defines.

## Two builds from one source

`Program.asm` chooses its include with a symbol the Makefile sets:

```asm
.ifdef VDP
.include "6502-VDP.inc"
.else
.include "6502.inc"
.endif
```

`make VDP=1` passes `--asm-define VDP` to the assembler and names every output
with `-VDP` on the end, so both builds can sit side by side. Don't include both
files: every name they share would be defined twice.

A program written only for this machine can drop the choice and include
`6502-VDP.inc` on its own, which is what every listing in this guide does. What
it must not do is run on the older machine by accident. BIOS 1.6's jump table
stops just short of `$A0B1`, where the video card's calls begin, and every slot
from there on is a bare return — so a program that calls one there does nothing
and carries on as though it had. The
template's VDP build starts by checking:

```asm
Start:
  jsr KernalVersion             ; A = major, X = minor
  cmp #2
  bcs @Bios2
  lda #<NeedsBios2Msg
  ldy #>NeedsBios2Msg
  jsr PrintStr
  rts                           ; back to BASIC
@Bios2:
```

— with the message `NEEDS BIOS 2 AND A 6502-PICOVDP`. A program that needs the
video card itself adds `VdpInfo` to that, as
[What's fitted](/assembly/detection#which-video-card) shows.

### Names

The include follows one rule, and knowing it tells you what a name is before
you look it up:

- **`VC_` names come from the video card**: its registers (`VC_REG_L0CTRL`), their
  bits (`VC_LCTRL_4BPP`), its status registers, its addresses (`VC_DATA`,
  `VC_REG2`).
- **Every other name comes from the BIOS**, spelled the way the BIOS spells it:
  Kernal routines (`VdpLoadFont`), RAM variables (`VID_PEN`, `VDP_CAPS`), the
  `HW_*` bits, the `TMS_*` colors.

So `VDP_` at the start of a name always means one of the Kernal's own variables
in `$0391`–`$039C`, never a register.

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
| `$0000–$0039` | Zero page the system owns — pointers, BASIC's working space, card and transfer scratch |
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
| `$A000–$BFFF` | The Kernal — **still there**, still callable |
| `$C000–$FFF9` | Your cartridge, in place of BASIC and Wozmon |
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
interrupts, and put anything on the screen — those three are deliberately left
to you. From that point the whole jump table works exactly as it does for a RAM
program, and the text screen comes up the first time the cartridge prints.
[Writing a cartridge](/assembly/cartridges) has the rest, including the `BRK`
handler a cartridge needs of its own.

The template also supplies IRQ and NMI trampolines that jump through the RAM
vectors the Kernal set up, so a keyboard still works in a cartridge you haven't
written any interrupt code for.

### The same source builds a Flash Cart

`6502-CRT` builds both kinds of cartridge from one `Cart.asm`:

```sh
make                # Cart.crt, a 32 KB ROM cart
make FLASH=512K     # Cart-512K.crt, a 512 KB banked Flash Cart
```

Everything the banked build adds sits inside `.ifdef FLASH`, so a plain `make`
still produces exactly the bytes it always did. Building with `FLASH=` brings
in the bank register, the `SetBank` routine, the zero-page shadow that tracks
the selected bank, and a worked call that prints a string stored in bank
`$01`. That is enough to show how a banked cartridge is put together before
you write one of your own; the [Bigger cartridges](/assembly/flash-carts)
chapter explains every part of it.

## The raw binary template

`6502-BIN` drops the twelve-byte BASIC stub entirely. A `.bin` is machine code
from its very first byte, that first byte *is* the entry point, and BASIC is
never involved:

| | `.prg`, from `6502-PRG` | `.bin`, from `6502-BIN` |
|---|---|---|
| First bytes | The `10 SYS 2060` stub | Your code |
| Entry point | `$080C` | `$0800` |
| Started with | `LOAD`, then `RUN` | `SYS 2048`, or `800R` in Wozmon |
| Survives a Wozmon paste | No | **Yes** |

That last row is the reason the template exists. [The Wozmon
paste](/crossdev/to-hardware#the-wozmon-paste) is the one route to a real
machine that needs nothing but the cable, and it is the one route a `.prg`
cannot travel: Wozmon deposits bytes one at a time and never tells BASIC how
many arrived, so `RUN` walks the tokenized line chain, decides the program ends
at `$080C`, and puts its first variable there — on top of the machine code. A
`.bin` asks BASIC for nothing, so none of that applies. Paste it, type `800R`,
and it runs.

It is also the shape for a program that is taking the machine over rather than
borrowing it. The programs for [the KIM keypad](/addons/kim) are `.bin` files of
exactly this kind.

### Choose an ending that matches the start

A `.bin` cannot tell how it was reached, and the two ways of reaching it leave
the stack in different states:

| Launch | What it does | How to end |
|---|---|---|
| `SYS 2048` at BASIC's prompt | `JSR` — there is a return address waiting | `rts`, back to the `OK` prompt |
| `800R` in Wozmon | `JMP` — there is not | Loop forever, `BRK`, or `JMP ($FFFC)` to reboot |

The template ends in `rts`, with the alternatives sitting commented out beside
it. It also carries a commented-out block at the top of `Start:` that resets the
stack pointer, calls `KernalInit` to probe and initialize every card again, and
re-enables interrupts — for the program that means to own the machine. Running
that block throws away whatever return address `SYS` pushed, so it is a one-way
door.

::: warning Zero page is only yours if the program never returns
A `.bin` entered with `SYS` leaves BASIC live underneath it, still using zero
page `$3A`–`$FF` as it runs. The table above calls that range yours, and it is —
for a program that takes the machine over and never returns. For one that ends
in `rts`, treat it as occupied.
:::

## Renaming things

The `Makefile` names the target once:

```make
TARGET = Program
EIGHTTHREE = PROGRAM
```

Change both, rename `Program.asm` to match, and everything downstream follows —
`Program-VDP.prg` becomes `Countdown-VDP.prg`.
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
