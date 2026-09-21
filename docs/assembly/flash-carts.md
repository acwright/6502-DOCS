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

Here is the smallest banked cartridge there is. The code is in `FIXED`, the
string it prints is in `BANK01`, and nothing else is going on:

<<< @/../samples/assembly/flash-hello.asm{asm}

```
THIS LINE IS IN THE FIXED REGION
AND THIS ONE IS IN BANK $01
```

Two details in that listing are easy to misread.

The first is that `BankedMsg` assembles to a `$C0xx` address, and would do so
in any other bank as well. That address is the window rather than a position
in the file: every bank appears at `$C000` when it is the selected one. A
routine that reads a fixed set of addresses therefore works on whichever bank
happens to be selected, so if you give every bank the same internal layout you
only have to write that routine once.

The second is that `PrintStr` is called while bank `$01` is still selected,
which is safe because `PrintStr` lives in the Kernal at `$A090` — nowhere near
the window. Banking moves `$C000–$DFFF` and nothing else: the Kernal, the I/O
slots and the whole of RAM stay where they are.

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
rather than just storing a byte. Three things catch people, and all three are
in the listing below:

1. **The unlock addresses are chip addresses, and you reach them through the
   window.** The chip wants `$5555` and `$2AAA` in its own address space; the
   window is 8 KB, so those are offset `$1555` of bank `$02` and offset `$0AAA`
   of bank `$01`. There is no way to write both without switching banks in
   between — so **set the bank register before every command cycle**, not once
   at the start.
2. **A byte program can only turn bits off.** The chip computes `new = old AND
   data`. Writing `$5A` over `$00` leaves `$00`. So a sector erase — which
   writes `$FF` to a 4 KB block — comes first.
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

<<< @/../samples/assembly/flash-save.asm{asm}

```
FLASH CART SAVE
BEFORE $FF
AFTER  $5A
```

The two waiting loops are the standard polls. During a program, `DQ7` reads
back as the *complement* of the bit just written, so the read matches the value
only when the chip is done. During an erase, `DQ7` reads 0 until the sector is
`$FF` again.

::: tip The routine runs correctly wherever it is copied to
Every address in it is an absolute constant and every branch is relative, so
the same bytes work at any address. That is what lets it be copied into RAM
with no relocation step. Adding a single `jsr` to a label inside it would
break that quietly: the assembler would fix that call to the address the
routine has in ROM, so the copy in RAM would jump back into the cartridge and
run there, with the chip busy. If you extend the routine, keep it to branches.
:::

The sector is 4 KB and it erases as a unit, so a save area wants a sector of
its own. Erasing the sector your level data is in will do exactly what it says.

## What your file is called

A `.crt` is a byte-exact image of the chip on the cart. No header, no
container, no size field: what is in the file is what is on the chip. So the
size of the file is the size of the part, and the name carries it:

| File | What it is |
|---|---|
| `Game.crt` | 32,768 bytes — a ROM cart |
| `Game-512K.crt` | 524,288 bytes — a Flash Cart |
| `Game-VDP-512K.crt` | the same, built for the newer video card |

The `-VDP` comes before the size, always.

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

The [6502-CRT template](https://github.com/acwright/6502-CRT) builds both from
one source:

```sh
make                # Cart.crt, 32,768 bytes, a ROM cart
make FLASH=512K     # Cart-512K.crt, 524,288 bytes
```

[The linker config](/crossdev/linker) covers the banked configs and
[Makefiles](/crossdev/makefile) covers the `FLASH=` axis. To try it:

```sh
6502 run --cart Cart-512K.crt
```

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
from. It also covers what happens to a save already on the cart, which is
nothing: `program` reads the `.crt` and nothing else.

Next: [BASIC and machine code together](/assembly/basic-interop).
