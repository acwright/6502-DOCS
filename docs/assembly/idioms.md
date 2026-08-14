# Idioms and speed

A million cycles a second sounds like a lot until you try to move a hundred
things at once. Most of what follows is not clever — it is the handful of habits
that separate code that fits in a frame from code that doesn't.

## Put it in zero page

Every access to `$3A–$FF` is a byte shorter and a cycle faster than the same
access anywhere else, and indirect addressing only works through zero page at
all. There are 198 bytes; spend them on the variables your inner loop touches.

```asm
Count  := $40                   ; the loop counter, in the fast page
Screen := $41                   ; a two-byte pointer
```

`:=` rather than `=` matters if you use a debugger: only `:=` puts the name in
the label file, so `dbg mem Count` works —
see [Debugging](/crossdev/debugging).

## Count down, not up

`dex`/`bne` sets the zero flag for you. Counting up needs a `cpx` as well:

```asm
  ldx #40                       ; two instructions per iteration
Loop:
  ; ...
  dex
  bne Loop
```

When the loop body needs the index in the right order, count down and index
from the other end, or accept the `cpx`. It is one cycle, and clarity usually
wins — but in a loop that runs 960 times, one cycle is a millisecond.

## Look it up

There is no multiply and no divide. Anything that needs either, on any
regularly-used value, wants a table:

```asm
RowAddress_lo:  .lobytes 0, 40, 80, 120, 160, 200 ; ...
RowAddress_hi:  .hibytes 0, 40, 80, 120, 160, 200 ; ...

  ldx Row
  lda RowAddress_lo,x           ; row × 40, in three instructions
  sta Screen
  lda RowAddress_hi,x
  sta Screen + 1
```

Multiplying by a power of two is `asl`. Multiplying by 40 is
`(n × 32) + (n × 8)`, which is five shifts and an add — or a table, if you can
spare 48 bytes and want it in four cycles.

## Unroll the short ones

A loop that runs four times spends more time on the loop than the work. Write
it out. The classic case is clearing or copying a fixed small block:

```asm
  stz Score
  stz Score + 1
  stz Lives
  stz Level                     ; four instructions beats a loop over four bytes
```

## Keep hot tables inside a page

An indexed read costs an extra cycle when the index carries the address into
the next page — `lda Table,x` where `Table` is at `$08F0` and X is 20. If a
table is read in an inner loop, `.align 256` it and the extra cycle never
happens.

## The 65C02's own shortcuts

```asm
  stz Counter                   ; no register clobbered
  inc a                         ; the accumulator itself
  bra Loop                      ; one byte less than jmp
  lda (Pointer)                 ; no spare Y needed
  phx                           ; without going through A
```

And with `.setcpu "W65C02"` — [Installing cc65](/crossdev/cc65) — the Rockwell
bit operations, which are the best thing on the chip for flags:

```asm
  smb0 Flags                    ; set bit 0
  rmb3 Flags                    ; clear bit 3
  bbs0 Flags, PlayerIsDead      ; test and branch, one instruction
```

`smb` and `rmb` are five cycles and do what would otherwise be a load, an or,
a store. `bbs` and `bbr` are six — flat, whether the branch is taken or not —
against a load, an and, a branch.

## `WAI` beats a polling loop

If you are waiting for an interrupt — a timer, a key, a card — `wai` stops the
processor until one arrives:

```asm
Wait:
  wai
  lda Ready
  beq Wait
```

The wake-up is immediate, and nothing is burned in between. It also needs
`W65C02`.

## Timing

`SysDelay` waits a number of hundredths of a second: low byte in A, high byte
in X. It uses the VIA's timer rather than a counting loop, so it takes the same
time at 1 MHz and 2 MHz.

```asm
  lda #50                       ; half a second
  ldx #0
  jsr SysDelay
```

For anything shorter or more precise, the timer is right there in the I/O
window (`GPIO_T1CL` and friends), and it is yours between `SysDelay` calls.

::: warning A delay loop is not a clock
Counting cycles in a loop is a fine way to pause for a few microseconds and a
terrible way to time anything longer: it changes when the CPU jumper moves, and
an interrupt in the middle stretches it. Use the timer.
:::

## Self-modifying code

Program RAM is RAM, so an instruction can write to the instruction after it.
The honest use is patching an address into a loop that would otherwise need an
indirect:

```asm
  lda Bank
  sta Fetch + 1                 ; rewrite the low byte of the address below
Fetch:
  lda $8000                     ; ← that byte
```

It saves two cycles per iteration, it is genuinely how fast 6502 code was
written, and it makes the program unreadable and impossible to put in a
cartridge. Reach for it last, comment it heavily, and remember it does not work
from ROM.

## Measure, then optimize

The debugger will tell you where the time actually goes: break, run a known
number of frames, and compare the cycle counts —
[Debugging](/crossdev/debugging) has the mechanics. Guessing which loop is slow
is how afternoons disappear into code that was never the problem.

Next: [worked projects](/assembly/projects).
