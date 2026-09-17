# The graphics modes

Text mode is one of four things the video card can do. The other three draw
pixels, and getting into them means setting the card's eight mode registers
yourself — the Kernal has no calls for it, because there is no one right way to
lay out a screen.

All three are 256 × 192 pixels. What differs is how much color you can afford
and how much memory it costs.

| Mode | Cells | What you get |
|---|---|---|
| **Graphics I** | 32 × 24 of 8 × 8 | 256 patterns, and one color pair per *group of eight* patterns |
| **Graphics II** | 32 × 24 of 8 × 8 | Every cell its own pattern, and a color pair for every pixel row |
| **Multicolor** | 64 × 48 blocks of 4 × 4 | Straight color, no patterns to think about, chunky pixels |

Sprites work in all three: 32 of them, 8 × 8 or 16 × 16, one color each, moved
by writing a coordinate.

## Getting into one

The recipe is the same every time:

1. **Blank the display** by clearing bit 6 of register 1. Nothing on screen
   while you load, so nothing flickers.
2. **Write the eight mode registers** — screen mode, and where in the card's
   16 KB each table lives.
3. **Fill the tables**: patterns, colors, names, and a sprite list that is at
   least terminated.
4. **Un-blank.**

And to get out again, `InitVideo` followed by `VideoClear` puts text mode and
the character set back exactly as they were.

::: warning Interrupts and the card do not mix
Every register write is a *pair* of bytes to the same address. An interrupt in
between, whose handler also talks to the card, leaves both of you out of step.
So `sei` before touching the registers and `cli` afterwards — and `cli` again
before waiting for a key, because keys arrive by interrupt.
:::

## Worked demos

A demo for each of the three modes, with its listing, a picture of its screen
and a machine to run it on, is in
[the BIOS 1.6 edition](https://acwright.github.io/6502-DOCS/v1/assembly/graphics)
of this guide.

## Drawing something you meant to draw

A demo proves the mode works. For an actual picture you want a tool, and
[TMS9918-EDITOR](https://github.com/acwright/TMS9918-EDITOR) is the one: draw
characters, screens and sprites, and export the tables as assembler source you
`.include` straight into your program.

The workflow that goes with it:

1. Draw in the editor, export the pattern and color tables.
2. `.include` them, or `.incbin` the raw bytes into their own segment.
3. Copy them into the card at start-up, table by table.

::: tip 16 KB is the ceiling
The card has 16 KB of its own memory and your program never sees it directly —
everything goes through those two addresses, a byte at a time. Graphics II uses
12 KB of it for pattern and color tables alone, so plan the layout before you
start rather than after.
:::

Next: [making a noise](/assembly/sound).
