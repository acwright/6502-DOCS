# Bigger cartridges

A cartridge is 16 KB, and a game runs out. Not of code — 16 KB of 65C02 is a
lot of program — but of everything else. Levels, tile sets, tunes, text. You
cut the last three screens, then the music, and eventually you are cutting the
thing you were making.

The Flash Cart is the way out. Same slot, same machine, same reset vector, and
128 KB to 1 MB behind it instead of 16. This chapter is what changes.

[Writing a cartridge](/assembly/cartridges) is still where to start, and most
of it still applies: a Flash Cart boots the same way, calls the same Kernal,
and owns the same vectors. What is new is that half of the address space it
owns can be pointed at more than one thing.

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

The vectors could not be anywhere else, and it is worth seeing why rather than
taking it on trust. Reset clears the bank register to zero. So a reset vector
in a bank would be read out of bank 0 — not because anybody chose bank 0, but
because that is what the register happens to hold at the one moment the
processor reads it. The fixed region exists so that the machine always knows
where to look.

::: warning This is not the RAM card kind of banking
[Banked RAM](/assembly/banking) is a different mechanism with the same name:
kilobyte windows at `$8000` and `$8400`, latches at `$83FF` and `$87FF`, and
read-write memory behind them. It is still there on a machine with a Flash
Cart in the slot, and the two have nothing to do with each other.

Write to the wrong latch and there is no error. The machine does exactly what
you asked, to something you did not mean.
:::

## The bank register

Writing to **any address in `$E000–$FFFF`** latches the bank register. By
convention that address is called `BANK` and set to `$E000`:

```asm
BANK      = $E000

  lda #$07
  sta BANK                      ; bank $07 is now at $C000-$DFFF
```

Three things about it:

- **The write reaches no flash.** The register is a latch in front of the chip,
  and the chip's write line is not asserted in the fixed region. Writing the
  register is never also a write to the cartridge.
- **It cannot be read back.** There is no address that returns what is
  selected. A cartridge that loses track has no way to recover it.
- **Reset clears it to zero.** The register's own reset is on the machine's
  reset line, so after power-on or a reset button the window is bank 0.

Because it cannot be read back, every Flash Cart keeps a shadow copy in the
zero page — one byte, holding what was last written:

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

Four lines, and both of the interesting things about them are about placement
and order.

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

It does not fault. It does not stop. It executes data as instructions and
carries on until something else goes wrong, a long way from here. This is the
single easiest way to lose an afternoon on a Flash Cart, so:

**All the code goes in the fixed region. The banks hold data.**
:::

That is a real constraint and not a stylistic one, and it is the thing to
design around from the start. You have 8,186 bytes for the whole program —
half what a fixed cartridge gives you — and 120 KB to 1,016 KB for everything
the program reads.

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

Two things in that listing repay a second look.

`BankedMsg` is a `$C0xx` address, the same as it would be in any other bank.
That is the window, not a position in the file — every bank appears at
`$C000`, so a routine that reads one set of addresses works on whichever bank
is selected. Give every bank the same layout and you only write that routine
once.

And `PrintStr` is called with bank `$01` still selected. It can be, because
`PrintStr` is in the Kernal at `$A090`, which is nowhere near the window. The
Kernal, the I/O slots and all of RAM are untouched by banking; only
`$C000–$DFFF` moves.

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

Saving the shadow rather than the register is the whole reason the shadow
exists: there is nothing else to read.

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

::: tip The high bits simply are not connected
On a 128 KB or a 256 KB part, the address pins the top bank bits would drive do
not exist. Write `$10` to a 128 KB cart and you get bank `$00` — not an error,
not an empty bank, just bank `$00` again, because nothing is decoding that bit.

A cart that reads bank `$25` and finds bank `$05` is not broken. It is a 128 KB
part with a 512 KB program on it.
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

::: danger A programming routine in ROM will hang the machine
Point three is not a style rule. A routine that runs from the cartridge while
the cartridge is busy is fetching status bits and executing them, and an
interrupt during the same window fetches a vector that is also status bits.

Copy the routine into RAM and call it there, and `sei` before it starts.
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

::: tip The routine needs no relocating, and that is deliberate
Every address in it is an absolute constant and every branch is relative, so
the same bytes work wherever they land. One `jsr` to a label inside it would
break that silently — the jump would go back to the copy still sitting in ROM
and run it there, with the chip busy. If you extend the routine, keep it
branch-only.
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
and warns you about the name. A file named `Game.crt` that is 524,288 bytes
long loads as a 512 KB cart and warns about that. Believe the bytes.
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
does not: the chip is a surface-mount part soldered to the board, and it is
programmed **in circuit**, through the card edge, by the Flash Helper.

```sh
6502-flash program Cart-512K.crt
```

[Onto real hardware](/crossdev/to-hardware) is the whole procedure, including
what happens to a save that is already on the cart — which is nothing, because
`program` reads the `.crt` and nothing else.

Next: [BASIC and machine code together](/assembly/basic-interop).
