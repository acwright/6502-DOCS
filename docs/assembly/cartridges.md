# Writing a cartridge

A cartridge is a program in ROM that owns the machine. Plug one into the
cartridge slot and it boots instead of BASIC, with no loading, no waiting, and
no memory card required. It is how you ship a game.

The [`6502-CRT` template](https://github.com/acwright/6502-CRT) is a working
one; this chapter is what it is doing and why.

## What a cartridge replaces

The ROM in the cartridge overlays `$C000–$FFFF`:

| | |
|---|---|
| `$A000–$B7FF` | The Kernal — **still there**, still callable |
| `$B800–$BFFF` | The character set — still there |
| `$C000–$FFF9` | **Yours**, in place of BASIC, the Monitor and Wozmon |
| `$FFFA–$FFFF` | The processor's NMI, reset and interrupt vectors — now yours to supply |

So you lose BASIC and gain 16 KB of ROM, and you keep every Kernal routine in
this section. That is the trade, and for a finished program it is a good one.

<Diagram
  name="cartridge-overlay"
  caption="The top 16K becomes yours, including the vectors. Everything below it is untouched, which is why a cartridge can still call the Kernal."
/>

## Booting

Because the reset vector is inside your ROM, **your code is what the processor
runs first**. Nothing has been initialised. The stack pointer is undefined,
interrupts are off, no card has been probed, and there is no console.

The first four instructions are therefore always the same:

```asm
CartReset:
  ldx #$ff
  txs                           ; the stack pointer is yours to set
  jsr KernalInit                ; probe and start every card
  cli                           ; interrupts on
  ; ... and now the machine is as awake as BASIC would have found it
```

`KernalInit` does everything the normal power-on does **except** three things,
which it deliberately leaves to you: it does not reset the stack pointer, it
does not enable interrupts, and it does not draw a splash screen. The first two
are the two lines above. The third is the point of writing a cartridge.

A friendlier variant adds the noise the machine normally makes, so a player
knows it is alive:

```asm
CartReset:
  ldx #$ff
  txs
  jsr KernalInit
  jsr Beep                      ; silent if there is no sound card
  cli
  jmp Main
```

## The vectors

You own `$FFFA–$FFFF`, so you supply all three. The template's answer is to
bounce straight back through the RAM vectors that `KernalInit` has already
filled in:

```asm
IrqTrampoline:
  jmp (IRQ_PTR)
NmiTrampoline:
  jmp (NMI_PTR)

.segment "VECTORS"
.word NmiTrampoline
.word CartReset
.word IrqTrampoline
```

Four instructions, and your cartridge has a working keyboard, working serial
input and a working `BRK` without writing a single interrupt handler. Replace
either trampoline when you want the interrupt yourself —
[Interrupts](/assembly/interrupts) has the rules.

::: warning There is no going back
There is no BASIC underneath a cartridge and no `rts` that means anything: the
reset vector is where your program came from, not a subroutine call. A
cartridge's main loop runs for ever, and "quit" means resetting the machine.
:::

## The other way in: `BOOT_VECTOR`

Not every cartridge wants to replace the machine. `BOOT_VECTOR` at `$035B` is a
two-byte hook the normal power-on checks: if it is non-zero, the machine jumps
through it instead of going on to the boot menu.

That is the polite version of taking over — the machine has already probed
every card, and you are stepping in just before BASIC would have started.

::: warning `KernalInit` clears it
The boot sequence is: reset the stack, `KernalInit`, beep, *then* look at
`BOOT_VECTOR`. And `KernalInit` zeroes `BOOT_VECTOR` as part of setting up.

So a cartridge that sets the hook and then calls `KernalInit` has just wiped
it. Set it **after** the init call, or from a program that runs later — which
is what makes it useful for a loader on the memory card, rather than for a
cartridge that owns the reset vector anyway.
:::

## Building one

The template's linker configuration puts your code in a `CART` segment at
`$C000` and the vectors in a `VECTORS` segment at `$FFFA`, and produces a
16 KB image ready for an EEPROM. The differences from a program build are all
in that file — [The linker config](/crossdev/linker) walks through it.

To try it before you burn anything:

```sh
6502 run --cart Cart.crt
```

which boots the emulator with the cartridge in the slot, exactly as the real
machine will. [Onto real hardware](/crossdev/to-hardware) covers the burning.

::: tip Keep the ROM read-only in your head
Everything in `$C000–$FFFF` is ROM: your tables are readable, your variables
are not. Anything that changes lives in RAM — zero page from `$3A`, and the
whole of `$0800–$7FFF`, which no longer has a BASIC program in it.
:::

Next: [BASIC and machine code together](/assembly/basic-interop).
