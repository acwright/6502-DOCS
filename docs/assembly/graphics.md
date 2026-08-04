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
The demos below `sei` before touching the registers and `cli` afterwards — and
they have to `cli` again before waiting for a key, because keys arrive by
interrupt.
:::

## Graphics I

The plain one. 256 patterns of 8 × 8, and a 32-byte color table: one entry per
eight patterns, foreground in the high nibble, background in the low. That is
exactly 32 color combinations on screen, which this demo shows off by giving
every pattern the same checkerboard and letting only the color vary.

<<< @/../samples/assembly/graphics-1.asm{asm}

<Figure
  src="/images/screens/graphics-1.png"
  alt="A screen filled with a grid of checkered cells in many different two-color combinations."
  caption="Every cell is the same checkerboard pattern. All that varies is the color pair — thirty-two of them, which is the whole of what this mode gives you."
  screen
/>

Worth noticing in that listing:

- **`InitMode`** writes the eight registers from a table. The values are the
  whole of "which mode is this" — there is no mode number.
- **`HideSprites`** writes `$D0` as the first sprite's vertical position, which
  is the card's way of saying "the sprite list ends here". Skip it and you get
  whatever was in memory, drawn as sprites.
- **The random number generator** is a sixteen-bit shift-and-xor, seeded with a
  constant so the screen comes out the same every run. Seed it from the clock
  instead and it never does.
- **`SetVramWrite` and `SetVdpReg`** are four instructions each and get used
  everywhere. They are worth copying into anything you write.

## Graphics II

The same shape with the tables grown to 6144 bytes each, split into three
horizontal thirds of eight rows, each third indexing its own 2 KB slice. Every
one of the 768 cells can have its own pattern *and* a color pair per pixel
row, which is what makes proper pictures possible.

The catch is in registers 3 and 4: in this mode their low bits are an AND mask
over the table rather than more address, so they have to be all ones — `$FF`
and `$03` — to expose the full 6144 bytes. Getting that wrong is the classic
Graphics II bug, and the symptom is a screen that repeats every third.

::: details The full listing
<<< @/../samples/assembly/graphics-2.asm{asm}
:::

<Figure
  src="/images/screens/graphics-2.png"
  alt="A screen densely filled with small colored checkered blocks, finer and more varied than the Graphics I screen."
  caption="Graphics II, filled with random patterns. Each cell has its own pattern and its own color for every pixel row, which is what makes a real picture possible."
  screen
/>

## Multicolor

No patterns and no color table: the pattern table *is* the picture, one nibble
per 4 × 4 block. 64 × 48 blocks, sixteen colors, and you paint by writing
bytes.

There is one trick to it. Each name-table cell covers 2 × 2 blocks and so uses
only two of its pattern's eight bytes — which two depends on the cell's row
within a group of four. Give all four rows of a group the same name and one
eight-byte pattern covers the lot, at which point the pattern table becomes a
plain 1536-byte framebuffer that you can fill from top to bottom.

::: details The full listing
<<< @/../samples/assembly/multicolor.asm{asm}
:::

<Figure
  src="/images/screens/multicolor.png"
  alt="A screen of small square blocks of color arranged in a fine random grid, sixteen colors in play."
  caption="64 × 48 fat pixels, any color anywhere. Nothing here is a character."
  screen
/>

## Drawing something you meant to draw

Random screens prove the mode works. For an actual picture you want a tool, and
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

## There is more in that card than this

Everything above is the TMS9918A, and the TMS9918A is what the card is
pretending to be. The Pico9918 in an ACE also carries the **F18A** feature set —
a second tile layer, hardware scrolling, 64 programmable colors out of 4096,
sprites that flip and do not flicker, a bitmap layer, and a processor of its own
— all of it switched off until a program asks for it.

It runs on hardware only; the emulator is a faithful 9918A and does not have it.
[F18A mode](/f18a/) is the section on the whole of it.

Next: [making a noise](/assembly/sound).
