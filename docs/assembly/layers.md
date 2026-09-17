# Layers and sprites

The graphics modes put one grid of tiles on the screen. The card can draw two,
one in front of the other, and 64 sprites that go anywhere on top of them —
which is most of what a game's screen is made of.

## Two layers

Layer 0 is the one text mode uses and the one the last chapter drew on. Layer 1
is a second, complete set of the same things: its own name, pattern and
attribute tables, its own bits per pixel and palette row, its own scroll.
Registers `$10`–`$16` are layer 0's and `$18`–`$1E` are the same again for
layer 1, so `VC_REG_L1CTRL` is `L0CTRL`'s twin.

Layer 1 starts switched off. `VdpLayer` turns a layer on or off without
touching its other settings:

```asm
  ldx #1                        ; layer 1
  lda #1                        ; anything but 0: show it
  jsr VdpLayer
```

Wherever a layer 1 pixel is transparent — value 0, in a layer not set to draw
it — layer 0 shows through. So layer 1 is the place for anything that sits in
front of the scenery: a score, a frame, a line of text, the leaves in front of
the path.

## What's in front of what

Seven levels, from the back:

| Level | What |
|---|---|
| 0 | The backdrop — the `COLOR` register's low nibble |
| 1 | Layer 0 |
| 2 | Sprites |
| 3 | Layer 1 |
| 4 | Layer 0 cells with the priority bit set |
| 5 | Sprites with the priority bit set |
| 6 | Layer 1 cells with the priority bit set |

With no priority bits anywhere, that is backdrop, layer 0, sprites, layer 1:
sprites walk in front of the scenery and behind whatever is on layer 1. A cell
with its attribute's priority bit set jumps in front of ordinary sprites, which
is how a character walks behind a tree; a sprite with its priority bit set
jumps in front of layer 1, which is how a cursor stays on top of everything.
Only a layer with attribute bytes, at 2 bits per pixel or more, has priority
bits to set.

## Scrolling

`VdpSetScroll` moves a layer's picture by a number of pixels. The layer wraps
around: whatever scrolls off the left comes back on the right.

```asm
  lda #0
  sta VDP_P0                    ; bit 8 of the X scroll
  lda ScrollX                   ; bits 7-0
  ldy ScrollY
  ldx #0                        ; layer 0
  jsr VdpSetScroll
```

Bigger numbers move the picture left and up. Each layout wraps where its map
ends — at 256 pixels across in Compact and Graphics, 240 down in Graphics and
Full — and Full is 320 pixels wide, which is more than a byte can count, so it
takes the ninth bit in `VDP_P0`. Scrolling costs the 65C02 nothing but the call,
and it moves by the pixel in every layout, text included.

The map is only ever the size of the screen. To travel through a world bigger
than that, write the next column of tiles into the cells about to come into
view just before they do — a column is 30 bytes, which fits easily between two
pictures.

## Sprites

A sprite is a small picture the card draws at any position, over or under the
layers, without disturbing them. There are 64, and each one is four bytes in a
sprite table in the card's memory:

| Byte | Holds |
|---|---|
| 0 | Y — the top edge. 241–255 are just above the screen, for sliding in from the top |
| 1 | X, bits 7–0 — the left edge |
| 2 | Which shape, from the sprite pattern table |
| 3 | Attributes: palette row in bits 3–0, flips in 4 and 5, priority in 6, and X's ninth bit in 7 |

X runs to 383, and 384–511 count as −128 to −1, so a sprite can enter from the
left. `VdpSprite` writes all four bytes of one sprite: the sprite's number in X
and the four values in `VDP_P0`–`VDP_P3`. It expects the table at `$2000`
(`SPRATTR` = `$40`); a program that puts it elsewhere writes the bytes itself.

The rest is set by register:

| Register | Sets |
|---|---|
| `SPRCTRL` | Sprites on (`VC_SPRCTRL_ENABLE`), bits per pixel, collision checking |
| `SPRCOUNT` | How many of the 64 slots to draw |
| `SPRPAT` | Where the shapes are |
| `MODE1` | 8 × 8 or 16 × 16 (`VC_MODE1_SPRSIZE`), and doubled in size (`VC_MODE1_SPRMAG`) |
| `SPRLIMIT` | How many can share a line — 16 unless you say otherwise, up to 32 |

A sprite shape is a tile, one row at a time, at the bits per pixel `SPRCTRL`
chooses, and value 0 is always transparent. Where two sprites overlap, the one
with the lower number is in front.

## A layer, a layer, and four sprites

<<< @/../samples/assembly/sprites.asm{asm}

<Emulator
  sample="assembly/sprites"
  caption="Press a key and the sea scrolls while the words stay still and the four sprites cross. Press another for text."
/>

<Figure
  src="/images/screens/sprites.png"
  alt="A blue screen of zigzag waves with LAYERS AND SPRITES in white at the top, four shaded balls — red, yellow, green and magenta — scattered down it, and PRESS A KEY TO SET THEM MOVING in white along the bottom, passing in front of the magenta ball."
  caption="Full mode, the whole screen. The letters at the bottom are on layer 1, so they pass in front of the magenta sprite."
  screen
/>

Four things in there are worth pulling out.

**Layer 1's letters come from the card.** Writing `FONT` with
`VC_FONT_LAYER1` has the card copy its own character set into layer 1's pattern
table, at the next vertical blank — so the program waits for one before it
carries on. A name table of character codes is then a line of text, in any
layout.

**Transparent means color 0.** Layer 1 has no attribute bytes, so its colors
come from the `COLOR` register: letters in the high nibble, the rest in the low
one. That low nibble has to be 0, `TMS_TRANSPARENT`, for the sea to show
between the letters. Set it to black instead and layer 1 is a black sheet with
white letters on it, hiding the sea and the sprites behind it.

**Everything moves between pictures.** Each time through, `WaitVBlank` comes
first, then the scroll and the four sprites. That is all the time there is in
Full mode — a little over 1,400 cycles — and it is plenty for a register write
and sixteen bytes.

**Sprites wrap by hand.** X is nine bits, and past the right-hand edge the
program jumps a sprite to −16, so that it slides back in from the left rather
than appearing all at once.

## When sprites collide

Whenever two sprites' visible pixels touch, the card sets a flag, and it stays
set until a program reads it. `VdpStatus` with X = 0 reads status register 0
and clears it:

```asm
  ldx #0
  jsr VdpStatus                 ; A = STAT0, and the flags clear
  and #VC_STAT0_COL
  bne Crashed
```

The flag says *that* two sprites touched, not which. Setting
`VC_SPRCTRL_DETAIL` as well has the card keep a note of every sprite involved,
in status registers 8 to 15, one bit per sprite — read those before status
register 0, which clears them too. `VC_STAT0_OVF` is the other flag here: more
sprites wanted a line than `SPRLIMIT` allows, and some were left off it.

The same two events can interrupt instead, along with the end of every picture
and a chosen screen line — [Interrupts](/assembly/interrupts#the-video-card-s-interrupts)
has a handler.

Next: [making a noise](/assembly/sound).
