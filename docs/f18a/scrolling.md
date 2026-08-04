<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const paging = facts.f18a.paging
const priority = facts.f18a.priority
</script>

# Scrolling and layers

Two registers move the screen. Write register 27 and the picture slides
sideways; write register 28 and it slides up. One pixel at a time, no redraw,
no cost.

That sentence is the whole reason to care about F18A mode if you are writing a
game.

## What you were doing before

On a stock 9918A, scrolling means rewriting the name table. To move the world
one tile left you shift 768 bytes and fill in a new column, every eight pixels
of travel, forever. It works — plenty of games did it — but it is the largest
thing in your frame budget and it only ever moves in whole tiles.

Here:

```
inc SCROLL_X
lda SCROLL_X
ldx #27
jsr SetVdpReg
```

Once per frame. The screen moves one pixel. Nothing else in your program has to
know.

The register splits into whole tiles and pixels within a tile — the top five
bits are a tile offset, the bottom three a pixel offset — but you can treat it
as a plain 0–255 pixel counter and let the card work it out. Vertical is a flat
pixel count.

## What is at the edge

Scroll right and something has to appear on the left. With one page, the card
wraps: column 31 is followed by column 0 again, and you are looking at a screen
that circles.

That is fine for a starfield and useless for a level. So each layer can be told
it has **two pages**, or four.

<table>
<thead><tr><th>Horizontal</th><th>Vertical</th><th>Pages</th><th>What happens</th></tr></thead>
<tbody>
<tr v-for="l in paging.layouts" :key="l.h + '-' + l.v">
  <td>{{ l.h }}</td><td>{{ l.v }}</td><td>{{ l.pages }}</td><td>{{ l.behavior }}</td>
</tr>
</tbody>
</table>

Turn on horizontal paging and the virtual screen is 64 tiles wide with a 32-tile
window onto it. Turn on both and it is 64 × 48.

The pages are not another base address. They are the *same* base address with a
bit flipped:

<table>
<thead><tr><th>Page</th><th>Address bit</th><th>Where it puts you</th></tr></thead>
<tbody>
<tr v-for="b in paging.bits" :key="b.kind">
  <td>{{ b.kind }}</td><td><code>{{ b.toggle }}</code></td><td>{{ b.effect }}</td>
</tr>
</tbody>
</table>

So a name table at `$1800` has its second horizontal page at `$1C00`, and you
never write another register to reach it. When the scroll offset runs off the
end of page 0 the card XORs the bit and carries on reading.

::: tip The color table follows by itself
Set the color table's base address once. Its page bits come from the name
table's address, so it tracks whichever page is being drawn without you doing
anything. The pattern table is shared across every page and both layers.
:::

## Endless scrolling, in practice

Two pages do not give you an infinite level. They give you somewhere to write
the next screenful where nobody can see it.

The loop:

1. Scroll one pixel per frame.
2. Every eight pixels, a new column of tiles has come into view.
3. Write that column into the page you are *not* looking at, 32 columns ahead.
4. When the scroll register wraps past the end of a page, the card swaps pages
   and the column you have been writing is the one now on screen.

Compare that with the single-page version, where you have to mask the edge
columns because a partially-drawn tile is visible while you write it. With two
pages you have half a screen of slack on either side and nothing to hide.

::: details Why pages sit on 1 KB boundaries
A 32 × 24 name table is 768 bytes, so a 1 KB page wastes 256 bytes.

Turn on 30-row mode and a name table is 960 bytes, wasting 64. The boundary was
chosen for that case — and for the hardware, which gets to select a page by
flipping one address bit rather than by adding anything.

The layout is borrowed from the NES, which does the same thing for the same
reason.
:::

## The second tile layer

Register 49 bit 7 turns on a whole second tile layer. It has its own name table
(register 10), its own color table (register 11), its own scroll registers (25
and 26) and its own page sizes. It shares the pattern table with layer 1.

The obvious use is the one you want:

**A status bar that does not move.** Put the score on layer 2. Never write its
scroll registers. Layer 1 scrolls the world underneath and the score sits still,
without a scan-line interrupt, without a split, without any per-frame work at
all.

**Parallax.** Scroll layer 2 at half the rate of layer 1 and you have two
planes of depth. Distant hills that drift, a foreground fence that races past.

**An overlay.** Layer 2 on top with most tiles transparent — a HUD, a dialogue
box, a fade-to-black made of solid tiles.

By default layer 2 draws over everything, sprites included. Register 50 bit 0
changes that, and it reads backwards from its name: leave `T2_PRI` **clear** and
layer 2 is unconditionally on top; **set** it and layer 2 obeys the same
per-tile priority rules layer 1 does.

## Priority, per pixel

Once both layers, the bitmap layer and sprites are all live, "which is in
front" stops being a property of the layers. It is worked out per pixel, so the
same tile layer can be in front of a sprite in one place and behind it in
another.

<ol><li v-for="s in priority.stages" :key="s">{{ s }}</li></ol>

The rules that fall out of that, which are all worth knowing before you spend an
afternoon on it:

<ul><li v-for="r in priority.rules" :key="r">{{ r }}</li></ul>

The practical version: a tile's attribute byte has a priority bit, so a
foreground tile can be marked *in front of sprites* and your character walks
behind a pillar with no code at all.

## Splitting the screen

Register 19 takes a scan line number. When the beam reaches it, you get an
interrupt.

That is the other half of parallax, and the way to get more than two scroll
speeds. Set the scroll register in the handler and everything below that line
moves at a different rate.

Two things to get right:

**There is only one interrupt line.** The frame interrupt and the scan-line
interrupt share it, so a handler has to read status register 1 to find out
which fired, and register 0 bit 4 has to be set as well as register 19 having a
value.

**Register 15 has to be left pointing at status register 0.** Reading the
scan-line flag means selecting status register 1. Leave the selection there and
every subsequent frame interrupt reads the wrong byte and is never acknowledged.
Set it back before you return.

::: warning A handler that runs every scan line is not free
At 60 frames a second, an interrupt on every line is 11,520 interrupts a second
on a 6502 doing 1 million cycles a second. Interrupt entry and exit alone would
eat you alive.

One split, or two, is what this is for. If you want something on every line,
that is what [the GPU](/f18a/gpu) is — it runs inside the card and costs the
6502 nothing.
:::

## Thirty rows

Register 49 bit 6 makes the display 30 rows instead of 24 — 240 lines rather
than 192, the same shape the NES used.

It is nearly free and it changes three things:

- A name table is 960 bytes, not 768.
- The sprite list terminator moves from `$D0` to `$F0`, because 208 is now a
  real place to be. Register 51 becomes the reliable way to stop sprite
  processing early.
- You have six more rows of screen, which is a status bar and a bit.
