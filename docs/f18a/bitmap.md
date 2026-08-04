# The bitmap layer

Everything else on this card is made of tiles. The bitmap layer is not: it is a
rectangle of pixels at an address you choose, floating over the tile layers,
positioned and sized by five registers.

It is the layer for the things that are not made of characters — a line, a
graph, a lit-up piece of a maze, a title in a font you drew rather than one you
put in a pattern table.

## Setting one up

Six registers, and then it is on screen.

| Register | What it takes |
|---|---|
| 31 | Enable, priority, transparency, pixel size, palette |
| 32 | Base address in VRAM — the value is shifted up six bits, so a 64-byte boundary |
| 33 | X position |
| 34 | The first scan line it appears on |
| 35 | Width of one row, in bytes |
| 36 | How many rows |

::: warning Check the width register against your card
Hagerty's sheet calls register 35 a plain byte width. The Pico9918's reference
documents it as *0 means 64, otherwise the value shifted right two bits*, which
is a factor of four apart from the plain reading.

Set it, draw a row of solid pixels, and see how wide the row comes out. That
tells you which encoding your card wants in one look, and nothing else here
depends on the answer.
:::

```
lda #$80          ; $2000 >> 6 — the register holds the address, shifted
ldx #32
jsr SetVdpReg     ; bitmap data at VRAM $2000

lda #32
ldx #35
jsr SetVdpReg     ; a row of bitmap this many bytes wide

lda #64
ldx #36
jsr SetVdpReg     ; 64 rows

lda #$A0          ; enabled, transparent, four colors
ldx #31
jsr SetVdpReg
```

The size registers matter more than they look. A bitmap layer that covers the
whole screen at four colors per pixel costs 12 KB of your 16 KB of VRAM, and
your tiles and patterns still have to live somewhere. Most of the time you want
a small one — a panel, a window, a strip along the bottom — and the position and
size registers exist precisely so you can have one without paying for a screen.

## Pixels

One byte is always four pixels. What changes is how wide those pixels are.

| Bit 4 of register 31 | Bits per pixel | Colors | Pixel shape |
|---|---|---|---|
| 0 | 2 | 4 | 1 × 1 |
| 1 | 4 | 16 | 2 × 1 |

Four colors at normal width, or sixteen colors at double width. The card calls
the second one *fat pixels*, and it is the same bargain every chunky-graphics
mode has ever offered: half the horizontal resolution for four times the color.

The pixel value is not the color directly. Register 31's low four bits are a
palette select, shifted up and combined with the pixel — so the layer draws from
a group of the 64 palette registers, exactly the way tiles do.

Set bit 5 and pixel value 0 becomes transparent instead of a color. That is
what makes this an overlay rather than a curtain: three colors and a hole,
drawn over whatever the tiles are doing.

## Where it sits

Bit 6 of register 31 puts the bitmap layer above the tile layers instead of
below them. What it does **not** do is put it above sprites.

The bitmap layer is never drawn over a sprite. Not with the priority bit set,
not over a priority tile, not at all — a bitmap pixel gives up any claim to
priority the tile underneath it had. If you want something over a sprite, that
is a tile layer's job.

With the priority bit clear the layer sits under the tiles, and shows through
wherever a tile pixel is transparent. That is a useful arrangement in its own
right: a picture behind a window frame made of tiles.

## Plotting into it

From the 6502, a pixel is a read-modify-write: work out which byte holds it,
read the byte, mask in two bits, write it back. Four pixels per byte means
address arithmetic on every plot, and the read half means setting a VRAM read
address, reading, setting a write address and writing — which is slow enough
that a plotting loop is the thing you will optimize first.

Two things help.

**Register 48.** The VRAM address steps by whatever signed value you put there
after every access. Set it to your row width and consecutive writes walk *down*
the bitmap instead of across it — a vertical line becomes a tight loop with no
address arithmetic in it at all. Negative values walk backwards.

**The GPU.** It plots a pixel from an X and a Y in a single instruction,
including the conditional forms: write only where the pixel is already this
color, or only where it is not. That instruction exists because this layer
exists. [The GPU](/f18a/gpu) is the chapter.

::: tip It works on Graphics II too
The GPU's pixel instruction has a bit that says *give me the address in
Graphics II layout instead*. Which means the fast plotting hardware is
available in the stock high-resolution mode as well, not only in the bitmap
layer — you just have to do the final bit-masking yourself.
:::

## What it is good for

**A panel.** A minimap, a radar, a waveform, a health bar with a real gradient.
Small, positioned exactly, sixteen colors if you want them.

**Vector-ish drawing.** Lines and curves that do not sit on tile boundaries.

**A title screen.** One picture, drawn once at load, sitting over an otherwise
empty tile layer.

**Something the tiles cannot do.** That is the honest summary. Tiles are cheap
and this is expensive, so the layer earns its place when the thing you are
drawing is genuinely not made of repeated cells.
