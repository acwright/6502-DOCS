# Bigger cartridges

A cartridge holds 16 KB, and that is usually enough room for the program but
not for everything the program needs. 16 KB of 65C02 is a great deal of code.
The trouble is that the same 16 KB has to hold the levels, the tile sets, the
tunes and the text as well, so a game that keeps growing starts losing the
last few screens, then the music, and eventually something it was actually
about.

A **Flash Cart** is a cartridge that holds between 128 KB and 1 MB. A Flash
Cart plugs into the same slot as a 16 KB cart, boots the same way, and takes
over the machine at the same reset vector. What is different is that the
machine can only see 8 KB of the cartridge at a time, and the program on the
cartridge chooses which 8 KB that is. This chapter covers how a program
selects one of those 8 KB banks, where the code that does the selecting has to
be stored, and how that requirement shapes the way you lay a cartridge out.

Read [Writing a cartridge](/assembly/cartridges) first. Nearly all of it still
holds — a Flash Cart boots the same way, calls the same Kernal, and owns the
same vectors — and everything below assumes you have written a 16 KB cart or
at least read how one works.

::: info A Flash Cart works the same on a BIOS 1.6 machine
The Flash Cart is hardware. The bank register, the fixed region and the flash
chip behave the same whichever firmware is in the machine's ROM socket, so
everything on this page applies to a VCS or an ACE running BIOS 1.6, and the
cartridge you build will run on one.

Two things live in the
[current edition](https://acwright.github.io/6502-DOCS/assembly/flash-carts)
of this guide rather than here, because both were written against a newer
emulator than this edition describes: the two complete worked programs — one
that prints a string stored in a bank, one that erases a sector and programs a
byte — and the account of what the emulator does with a banked image and its
save file. Everything those programs demonstrate is explained below.
:::

## The window and the fixed bank

The cartridge still overlays `$C000–$FFFF`. That 16 KB is now two halves that
behave completely differently.

<Diagram
  name="cartridge-banking"
  caption="The lower half is a window onto one bank at a time. The upper half is always the same 8 KB, and the vectors are in it."
/>

| | |
|---|---|
| `$C000–$DFFF` | **The window.** 8 KB, showing whichever bank the bank register last named |
| `$E000–$FFF9` | **The fixed region.** The chip's last bank, always, whatever the register holds |
| `$FFFA–$FFFF` | The vectors, which are therefore in the half that never moves |

The vectors could not be anywhere else, and the reason is worth following
through rather than taking on trust. Reset clears the bank register to zero,
and reading the reset vector is the first thing the processor does afterwards.
A reset vector stored in a bank would therefore always be read out of bank 0 —
not because the program chose bank 0, but because zero is what the register
happens to hold at that one moment. Putting the vectors in a region that does
not move means the machine always knows where to look for them.

::: warning This is not the RAM card kind of banking
[Banked RAM](/assembly/banking) is a different mechanism that goes by the same
name: kilobyte windows at `$8000` and `$8400`, latches at `$83FF` and `$87FF`,
and read-write memory behind them. Banked RAM is still present on a machine
with a Flash Cart in the slot, and the two mechanisms have nothing to do with
each other.

Neither one reports a mistake. Write a bank number to a RAM card latch instead
of to the cartridge's bank register and nothing complains: the machine does
exactly what the store asked for, to memory you did not intend to touch.
:::

## The bank register

Writing to **any address in `$E000–$FFFF`** latches the bank register. By
convention that address is called `BANK` and set to `$E000`:

```asm
BANK      = $E000

  lda #$07
  sta BANK                      ; bank $07 is now at $C000-$DFFF
```

Three properties of that register shape everything else in this chapter:

- **The write reaches no flash.** The register is a latch sitting in front of
  the chip, and the chip's own write line is never asserted in the fixed
  region. Writing the register cannot also write to the cartridge by accident.
- **It cannot be read back.** No address returns the bank that is currently
  selected, so a program that loses track of which bank it chose has no way to
  ask the hardware.
- **Reset clears it to zero.** The register's reset input is on the machine's
  reset line, so after a power-on or a press of the reset button the window is
  showing bank 0.

Since the register cannot be read back, a program has to remember what it last
wrote there. Every Flash Cart keeps that in one byte of zero page, called the
shadow:

```asm
BANKSHDW  = $3A                 ; the first byte free for a program that has
                                ;   taken the machine over
```

## `SetBank`, and where it has to live

```asm
SetBank:
  sta BANKSHDW                  ; the shadow first
  sta BANK                      ; then the register
  rts
```

Four lines, and two things about them need explaining: why the stores are in
that order, and why the routine cannot live anywhere but the fixed region.

**The shadow is written first.** If an interrupt lands between the two stores,
a handler that reads the shadow sees it one instruction *ahead* of the
hardware. Putting the hardware back from the shadow on the way out then makes
the two agree. Write the register first and the handler sees the shadow one
instruction *behind*, and restoring from it leaves the two permanently
disagreed — which will show up an hour later as a graphic drawn out of the
wrong bank.

**It must live in the fixed region, and you must call it from there.**

::: danger You cannot switch banks from inside a bank
`jsr SetBank` from code at `$C000–$DFFF` pushes a return address that is about
to mean something else. The `rts` returns to the same address in a *different*
bank, and the processor runs whatever is there.

Nothing about this produces an error. The processor does not fault and does
not stop; the processor simply treats whatever bytes are now at that address
as instructions and carries on executing them, and the crash that eventually
follows happens somewhere else entirely. A bug that shows up nowhere near its
cause is a hard one to find, so the safe rule is a blunt one:

**All the code goes in the fixed region. The banks hold data.**
:::

That rule decides the shape of the whole cartridge, so design around the rule
from the start rather than discovering it later. Keeping all the code in the
fixed region leaves 8,186 bytes for the entire program — half of what a 16 KB
cart gives you — and between 120 KB and 1,016 KB of banks for everything that
program reads.

## Laying a cartridge out

The linker config declares a memory area per bank, and the segment name is the
value you write to the register. `.segment "BANK07"` is reached with
`lda #$07`.

A bank's contents assemble to `$C0xx` addresses, and would do so in any other
bank as well. Those addresses are the window rather than a position in the
file: every bank appears at `$C000` when that bank is the selected one. A
routine that reads a fixed set of addresses therefore works on whichever bank
happens to be selected, so if you give every bank the same internal layout you
only have to write that routine once.

Calling into the Kernal while a bank is selected is safe. Banking moves
`$C000–$DFFF` and nothing else, so `PrintStr` at `$A090`, the I/O slots and
the whole of RAM all stay exactly where they are no matter what the bank
register holds.

## Interrupts

A handler in the fixed region is safe, and the trampolines from
[Writing a cartridge](/assembly/cartridges) are in the fixed region, so a
cartridge that does not write its own handler needs to do nothing here.

A handler that reads banked data has to put the bank back:

```asm
MyIrqHandler:                   ; in FIXED, like every handler on a flash cart
  pha
  lda BANKSHDW                  ; what the interrupted code was using
  pha
  lda #$04
  jsr SetBank                   ; the handler's own bank
  ; ... read whatever is in bank $04 ...
  pla
  jsr SetBank                   ; put it back, shadow and all
  pla
  rti
```

The handler saves the shadow rather than the register because there is no way
to read the register. Keeping a shadow at all is what makes an interrupt
handler able to leave the window as it found it.

## The sizes

| Target | Part | Bytes | Banks you can select |
|---|---|--:|---|
| 128K | SST39SF010A | 131,072 | `$00–$0E` — 15 banks, 120 KB |
| 256K | SST39SF020A | 262,144 | `$00–$1E` — 31 banks, 248 KB |
| 512K | SST39SF040 | 524,288 | `$00–$3E` — 63 banks, 504 KB |
| 1M | two SST39SF040 | 1,048,576 | `$00–$3E` and `$40–$7F` — 127 banks, 1,016 KB |

The last bank of the first chip is always the fixed region, which is why every
count is one short of a round number. On a 1 MB cart, bit 6 of the register
picks the second chip.

::: tip On a smaller part the high bank bits go nowhere
A 128 KB or 256 KB chip has fewer address pins than a 512 KB one, so the top
bits of the bank register are not connected to anything. Writing `$10` to a
128 KB cart selects bank `$00`: not an error and not an empty bank, just bank
`$00` a second time, because no hardware is decoding that bit.

So a cart that asks for bank `$25` and gets the contents of bank `$05` is
working correctly. It is a 128 KB part running a program that was built for a
512 KB one.
:::

## Saving

A Flash Cart can write to itself. That is how a game on one keeps a high score
table or a saved position without a memory card.

The chip is an SST39SF0x0, and writing to it means sending command sequences
rather than just storing a byte. A **sector erase** is six writes:

```
$5555 <- $AA    $2AAA <- $55    $5555 <- $80
$5555 <- $AA    $2AAA <- $55    the sector <- $30
```

and a **byte program** is four:

```
$5555 <- $AA    $2AAA <- $55    $5555 <- $A0    the address <- the data
```

Three things about carrying those out catch people, and none of them is
apparent from the sequences above.

1. **The unlock addresses are addresses on the chip, and a program reaches
   them through the window.** The chip wants `$5555` and `$2AAA` in its own
   address space. The window is only 8 KB, so chip address `$5555` is offset
   `$1555` of bank `$02` — written at `$D555` — and chip address `$2AAA` is
   offset `$0AAA` of bank `$01`, written at `$CAAA`. No program can write both
   without changing banks in between, so **set the bank register before every
   write in the sequence**, not once at the start.
2. **A byte program can only turn bits off.** The chip computes
   `new = old AND data`, so writing `$5A` over a byte holding `$00` leaves
   `$00`. A sector erase, which restores a 4 KB block to `$FF`, has to come
   first.
3. **The routine has to run from RAM, with interrupts off.** While the chip is
   erasing or programming, *every* read of it returns status bits instead of
   data. That includes the fixed region, where the code is, and the vectors.

::: danger A programming routine left in ROM will hang the machine
The third point above is not advice about tidiness. A routine that runs from
the cartridge while the cartridge is busy is fetching status bits and
executing them as instructions, and an interrupt taken during the same period
fetches a vector that is also status bits.

Copy the routine into RAM, `sei` before it starts, and call it there.
:::

Waiting for the chip is done by reading it, and what to look for differs
between the two operations. During a byte program, `DQ7` reads back as the
*complement* of the bit just written, so the value read matches the value
written only once the chip has finished. During a sector erase, `DQ7` reads 0
for the whole of the erase — about 25 ms — and 1 once the sector is `$FF`
again.

Write the RAM routine so that it can be copied without being relocated: keep
every address in it an absolute constant and every branch relative, and the
same bytes then work at whatever address they are copied to. A single `jsr` to
a label inside the routine would break that quietly, because the assembler
fixes that call to the address the routine has in ROM — so the copy running in
RAM would jump back into the cartridge and run there, with the chip busy.

The complete routine, short enough to read in one go, is in the
[current edition's chapter](https://acwright.github.io/6502-DOCS/assembly/flash-carts#saving).

The sector is 4 KB and it erases as a unit, so a save area wants a sector of
its own. Erasing the sector your level data is in will do exactly what it
says.

## What your file is called

A `.crt` is a byte-exact image of the chip on the cart. No header, no
container, no size field: what is in the file is what is on the chip. So the
size of the file is the size of the part, and the name carries it:

| File | What it is |
|---|---|
| `Game.crt` | 32,768 bytes — a ROM cart |
| `Game-512K.crt` | 524,288 bytes — a Flash Cart |

::: warning The size in the name is a label; the size in the bytes is what the machine reads
Everything that loads a `.crt` — the emulator, the programmer, the machine
itself — picks the mapper from the **byte count**. The name is a convenience
for you.

A file named `Game-512K.crt` that is 131,072 bytes long loads as a 128 KB cart
and warns you that the name disagrees. A file named `Game.crt` that is 524,288
bytes long loads as a 512 KB cart and warns about that instead. When the two
disagree, the byte count is the one to trust.
:::

## Building one

The [6502-CRT template](https://github.com/acwright/6502-CRT) builds both
kinds of cartridge from one source:

```sh
make                # Cart.crt, 32,768 bytes, a ROM cart
make FLASH=512K     # Cart-512K.crt, 524,288 bytes
```

[The linker config](/crossdev/linker#a-banked-cartridge) covers the memory
areas a banked build declares, and why the order they are declared in is the
order the banks end up in on the chip.

Trying a banked image before programming a cart needs a newer emulator than
this edition describes. The
[current edition's emulator chapter](https://acwright.github.io/6502-DOCS/using/emulator#flash-carts-and-their-saves)
covers loading one and where its saves are written.

## Getting it onto a cart

A ROM cart comes out of its socket and goes into a programmer. A Flash Cart
cannot, because its chip is a surface-mount part soldered to the board. It is
programmed **in circuit** instead, through the card edge, by a small board
called the Flash Helper:

```sh
6502-flash program Cart-512K.crt
```

[Onto real hardware](/crossdev/to-hardware#programming-a-flash-cart) is the
whole procedure, and says where the Helper and the `6502-flash` command come
from.

Next: [BASIC and machine code together](/assembly/basic-interop).
