# Banked RAM

The processor can only see 64 KB, and most of it is spoken for. The RAM card
gets round that with a window: a kilobyte of address space that can be pointed
at any one of 256 kilobyte-sized banks, one at a time.

There are two of these, side by side.

| Window | Latch | |
|---|---|---|
| `$8000–$83FE` | `RAM_BANK_L` at `$83FF` | The low window — what BASIC's `BANK` uses |
| `$8400–$87FE` | `RAM_BANK_H` at `$87FF` | The high window |

Write a bank number to the latch and the window is looking at a different
kilobyte. Everything else in memory is untouched, and nothing moves — only what
that one range of addresses is wired to.

## Using it

<<< @/../samples/assembly/bank-store.asm{asm}

```
RUN
BANK 3 SNOWDROPS AND MUD
BANK 9 APPLES AND WOODSMOKE

OK
```

Two messages at the same address, and which one you get depends entirely on
what was last written to the latch.

::: warning The latch cannot be read
`RAM_BANK_L` is write-only. Reading `$83FF` gives you whatever the memory chip
holds there, not the bank number — which is why the program keeps its own note
of where it is. Every routine that switches banks should either restore the
previous one or be documented as leaving the window somewhere new.
:::

## The one that catches everyone

The window is `$8000–$83FE` — **1023 bytes, not 1024**. The last byte of the
window is the latch, so writing 1024 bytes to `$8000` selects a new bank with
the final one and puts it in the wrong place.

A copy loop that runs `ldy #0` to `bne` covers 256 bytes at a time and never
goes near the top; a loop that walks the whole window has to stop at `$83FE`.

## What it is good for

Anything you have a lot of and only need a slice of at a time:

- **Level data.** One bank per level, loaded from the card at the start,
  switched to instantly afterwards.
- **Sprite and character sets.** Swap the whole set by writing one byte.
- **Text.** Every message in a game, a bank at a time, instead of 8 KB of
  strings in program RAM.
- **Recorded data.** Something that samples, logs or records can fill bank
  after bank without ever running out of address space.

What it is *not* good for is code. A routine in a bank stops existing the
moment something switches the window, including a routine that switches the
window itself. Keep code in program RAM and put data in the banks.

::: tip Two windows means copying between banks is easy
Point the low window at the source and the high window at the destination, then
copy from `$8000` to `$8400` without switching anything in between. With one
window you would need a buffer in program RAM and two passes.
:::

## From BASIC

`BANK n` sets the low window's latch and nothing else, so `PEEK` and `POKE` at
32768 upwards reach whichever bank is selected. That means a BASIC program can
prepare a bank and a machine-code routine can read it, or the other way around —
they are looking at the same hardware.

`BANK` also checks that the RAM card is actually fitted and stops with an error
if it is not. Your own code should check `HW_RAM_L` in `HW_PRESENT` for the
same reason.

Next: [idioms and speed](/assembly/idioms).
