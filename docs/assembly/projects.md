# Worked projects

Everything in this section is a program you can assemble and run. Here they are
in one place, with what each one is worth reading for — and then two more that
are not about the ACE at all.

## The ones in this section

| Program | Where | Worth reading for |
|---|---|---|
| Hello world | [Hello world](/assembly/hello) | The startup stub, and how four lines print |
| Reading a line | [Console](/assembly/console) | Polling for keys without blocking |
| A framed sign | [The screen](/assembly/video) | Positioning characters, and the colour byte |
| The graphics demos | [The graphics modes](/assembly/graphics) | Setting the card's registers yourself |
| A little fanfare | [Sound](/assembly/sound) | Parallel tables, and frequency at build time |
| Reading the sticks | [The keyboard and the sticks](/assembly/input) | Active-low bits, and a mask table |
| Files both ways | [Files](/assembly/storage) | The three pointers, and the carry flag |
| The clock | [The clock](/assembly/clock) | Two-digit printing, and battery-backed bytes |
| Counting interrupts | [Interrupts](/assembly/interrupts) | Chaining a handler without disturbing the stack |
| What's fitted | [What's fitted](/assembly/detection) | Reading the hardware byte and degrading politely |
| Two banks | [Banked RAM](/assembly/banking) | A window, a latch, and keeping your own note |
| Machine code from BASIC | [BASIC and machine code](/assembly/basic-interop) | `POKE`, `SYS`, `PEEK` |

And the [countdown](/crossdev/build-run-loop) from the cross-development
section, which is the one the debugger and the test script work on.

## A blinking light

These two are from the [KIM add-on](/addons/kim), and they are the smallest
complete programs in this whole guide: eight LEDs wired to a port, and enough
code to make them do something.

They matter here because they are the shape of *every* hardware program.
Nothing is initialised, nothing is printed, nothing is checked. A value is
written to an address and a wire changes.

### A binary counter

Eighteen bytes.

```asm
LED         = $9400             ; the latch the LEDs hang off
DELAY_CS    = 50                ; half a second
CNT         = $36               ; one byte of zero page

Start:
  stz CNT
Loop:
  lda CNT
  sta LED                       ; the whole output stage of the program
  lda #DELAY_CS
  ldx #0
  jsr SysDelay
  inc CNT                       ; wraps $FF → $00 on its own
  bra Loop
```

The counter is one byte, so it needs no wrap check. `SysDelay` is doing the
timing on the VIA's timer, so the rate does not change if the machine is
running at 2 MHz. And there is no exit — a program for a machine with no
operating system runs until you reset it.

### A KITT scanner

Thirty-eight bytes, fourteen of which are the pattern table.

```asm
LED         = $9400
DELAY_CS    = 10                ; a tenth of a second per step

Start:
  ldy #0
Loop:
  lda Table,y
  sta LED
  phy                           ; SysDelay does not promise to keep Y
  lda #DELAY_CS
  ldx #0
  jsr SysDelay
  ply
  iny
  cpy #14                       ; fourteen steps, then round again
  bne Loop
  bra Start

Table:
  .byte $01,$02,$04,$08,$10,$20,$40,$80  ; left to right
  .byte $40,$20,$10,$08,$04,$02          ; and back, without repeating the ends
```

The whole animation is a table. Fourteen entries rather than sixteen because
the two ends should not be lit twice in a row, which is the difference between
a sweep and a stutter — and is the sort of thing you only notice with the LEDs
in front of you.

Both want eight LEDs on `$9400`; a row on a breadboard is the traditional
answer. The [KIM chapter](/addons/kim) has cards with the bytes laid out for
keying in by hand, which is worth doing once.

## Where to go next

**Take something apart.** The ROM's own source is the best-commented 65C02 on
this machine, and everything in this section is a call into it —
[6502-BIOS](https://github.com/acwright/6502-BIOS).

**Write a game.** The pieces are all in this section now: a screen you can draw
on, sticks you can read, sound, a clock to time with, and a card to save the
score on. Start from [the program template](/crossdev/templates) and steal from
these.

**Put it on a cartridge.** [Writing a cartridge](/assembly/cartridges), then
[Onto real hardware](/crossdev/to-hardware). A game that boots when you switch
the machine on is a genuinely different feeling from one you load.
