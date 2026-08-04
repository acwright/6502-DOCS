<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const locked = facts.f18a.attributes.spriteLocked
const unlocked = facts.f18a.attributes.spriteUnlocked
</script>

# Sprites

Four sprites per scan line. That is the limit that shaped every game written for
this chip, and it is the first thing to turn off.

```
lda #31
ldx #30
jsr SetVdpReg     ; as many sprites per line as there are sprites
```

One write, at startup. Nothing flickers again.

Write it even though a Pico9918 already holds 31 there. The default on a real
F18A is whatever its jumper says, so the write is what makes your program mean
the same thing on both cards — and it is one byte.

## What the limit was doing

The 9918A draws four sprites on a line and abandons the rest. The fifth one
does not get clipped or dimmed — it is simply not there, and its number goes
into the status register so your program can find out.

The standard workaround is multiplexing: keep every sprite's priority moving so
that a different set of four vanishes each frame, and let persistence of vision
average them into whole objects. It works, it costs you a table shuffle every
frame, and it is why the shots in a shoot-em-up strobe.

Register 30 sets the limit directly, up to 31. Register 51 is a separate limit
on how many sprites get processed *per frame* at all, and defaults to 32.

::: tip Two limits, two jobs
Register 30 is per line and is about flicker. Register 51 is per frame and is
about time — stop at sprite 12 and the card does no work at all on the other
twenty.

Register 51 is also the only way to stop sprite processing early in 30-row
mode, where `$D0` is a legal Y coordinate rather than the end-of-list marker.
:::

::: warning What the status register reports
By default the card still reports the fifth sprite the old way, so a program
watching for that flag sees it at four even though 31 are being drawn. Register
50 bit 3 switches the report over to register 30's limit instead. Either is
fine; knowing which one you are on is what matters.
:::

## The fourth attribute byte

A sprite is four bytes: Y, X, pattern, and one more. On a locked card that last
byte is a color and one flag:

<table>
<thead><tr><th>Bits</th><th>Name</th><th>What it does</th></tr></thead>
<tbody>
<tr v-for="b in locked.bits" :key="b.bits"><td><code>{{ b.bits }}</code></td><td>{{ b.name }}</td><td>{{ b.description }}</td></tr>
</tbody>
</table>

Unlock the card and the three bits that were doing nothing wake up:

<table>
<thead><tr><th>Bits</th><th>Name</th><th>What it does</th></tr></thead>
<tbody>
<tr v-for="b in unlocked.bits" :key="b.bits"><td><code>{{ b.bits }}</code></td><td>{{ b.name }}</td><td>{{ b.description }}</td></tr>
</tbody>
</table>

**Flipping is the one you will use immediately.** A character walking left is
the same patterns as one walking right, mirrored. On a stock chip that is a
second set of patterns, hand-drawn or generated at load time, eating VRAM you
do not have. Here it is one bit, and it costs nothing at all.

Flip both and you have four orientations from one 16×16 pattern. That is the
difference between fitting your artwork in 2 KB and not.

::: warning What bit 4 does
The two references disagree here. Hagerty's register sheet calls it a per-sprite
size override — clear takes register 1's global 8×8 or 16×16 setting, set forces
this one sprite to 16×16. The Pico9918's reference calls it an opaque-sprite
flag that applies in 16×16 mode.

They agree the bit is new and that it concerns 16×16 sprites, and no further.
Assume nothing about it in code you want to run on both cards.
:::

## Y, and the off-by-one

The 9918A's sprite Y coordinate is one less than where the sprite appears. Y of
`0` puts the top row on scan line 1, and Y of `255` is a sprite one line above
the screen — which is genuinely useful for sliding something in from the top,
and genuinely annoying every other time.

Register 49's `Y_REAL` bit turns it off. Y then means Y.

Turn it on at startup, before you write any coordinates, and never think about
it again. Turn it on halfway through and everything on screen jumps a pixel.

::: details The other special Y value
`$D0` in a sprite's Y byte does not place a sprite at line 208 — it ends the
list. The card stops there and ignores every sprite after it, which is how you
hide sprites you are not using.

In 30-row mode the display is 240 lines tall and 208 is a legal place to be, so
the terminator moves to `$F0`. If you are turning on 30-row mode, go and look at
whatever your code writes to hide a sprite.
:::

## Sprite color

In the original color mode a sprite has one color, from the low nibble of the
fourth byte, and register 24 chooses which sixteen of the 64 palette registers
that nibble indexes. Set register 24 once and all your sprites shift palette
together — a cheap way to tint everything for a night level.

In the enhanced color modes those same four bits stop being a color and become
a **palette select**, and the pattern data supplies the color:

| Sprite color mode | The attribute nibble means | Colors you see |
|---|---|---|
| Original | One of 16 colors | 1 |
| One-bit | One of 32 two-color palettes | 1 |
| Two-bit | One of 16 four-color palettes | 3 |
| Three-bit | One of 8 eight-color palettes | 7 |

One fewer than you would expect each time, because index 0 in a sprite is
always transparent. [Colors](/f18a/color) has the bitplane scheme those extra
bits come from.

One-bit color is worth a note: it gives a sprite the same single visible color
it already had, so it buys you nothing on its own. What it does is put sprites
into the enhanced pipeline, which is where the other features live.

## Putting it together

A sensible sprite setup, once, after unlocking:

```
lda #31          ; no per-line limit
ldx #30
jsr SetVdpReg

lda #$08         ; Y_REAL on, sprite color mode still original
ldx #49
jsr SetVdpReg

lda #$08         ; report against register 30, not the fifth sprite
ldx #50
jsr SetVdpReg
```

Three writes, and the two most recognizable limits of the chip are gone: nothing
flickers, and Y is where you put it.

Add two-bit sprite color to that and you are writing something the original chip
could not do at all — 31 sprites on a line, four colors each, flipped in either
direction, out of a palette of 4096.
