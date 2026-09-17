# The graphics modes

Text mode is one of four screen layouts the video card can draw. The other
three are grids of 8 × 8 tiles, and in all four the card works the same way:
tables of bytes in its own memory say what goes where, and the card draws the
picture from them sixty times a second. Your program writes the tables; it never
draws a pixel.

## The four layouts

| Layout | `VMODE` | Cells | Pixels | On the screen |
|---|---|---|---|---|
| **Text** | `VC_VMODE_TEXT` | 40 × 24 of 6 × 8 | 240 × 192 | A border on all four sides |
| **Compact** | `VC_VMODE_COMPACT` | 32 × 24 of 8 × 8 | 256 × 192 | A border on all four sides |
| **Graphics** | `VC_VMODE_GRAPHICS` | 32 × 30 of 8 × 8 | 256 × 240 | A border left and right |
| **Full** | `VC_VMODE_FULL` | 40 × 30 of 8 × 8 | 320 × 240 | The whole screen, no border |

`VdpSetMode` picks one. Graphics is the one to reach for first; Full is
Graphics widened to the edges of the screen, at the price of a name table that
needs 1,200 bytes instead of 960 and a horizontal scroll that needs nine bits.

The layout says nothing about color. That is set per layer, and any layout can
have any of the choices below.

::: details Programs written for the TMS9918A
The card comes out of reset pretending to be a TMS9918A, with `VMODE` at 0, and
while it stays at 0 the old chip's own mode bits choose the picture: its text
mode and Graphics I, sprites and all. That is how a cartridge written for the
old chip still runs, since it programs the card before anything is printed.
Once the text screen is up, `VMODE` is 1, and a program that wants the old
modes writes 0 there first. Graphics II and Multicolor aren't there at all — a
program that uses either draws the wrong picture — and the old chip is
documented in the
[BIOS 1.6 edition](https://acwright.github.io/6502-DOCS/v1/assembly/graphics) of
this guide.
:::

## Three tables make a picture

**The name table** has a byte for each cell, left to right and top to bottom,
saying which tile goes there.

**The pattern table** holds the tiles themselves: what each one looks like,
pixel by pixel.

**The attribute table**, if the layer has one, holds a byte for each cell
saying how to color it.

Each table lives wherever a register says it does. The name and attribute
table registers count in steps of 1 KB, the pattern table's in steps of 2 KB,
so `L0PAT` = 4 puts layer 0's tiles at `$2000`.

### Bits per pixel

Every pixel of a tile is a number, and the layer's control register, `L0CTRL`,
says how many bits it has:

| Bits | Colors in a tile | Bytes for an 8 × 8 tile | Tiles |
|---|---|---|---|
| 1 | 2 | 8 | 256 |
| 2 | 4 | 16 | 512 |
| 4 | 16 | 32 | 512 |
| 8 | 256 | 64 | 256 |

More bits look better and cost more to send: the card's memory is not the
limit on this machine, the 65C02's time is. A set of 256 one-bit tiles is 2 KB
and goes across in a blink; the same set at 4 bits is four times as long.

### Attributes

The same register chooses where a cell's color comes from:

| `L0CTRL` bits 3–2 | Where | Size |
|---|---|---|
| `VC_LCTRL_ATTR_CELL` | A byte for every cell | Same as the name table |
| `VC_LCTRL_ATTR_GROUP` | A byte for every eight tiles | 32 bytes |
| `VC_LCTRL_ATTR_ROW` | A byte for every pixel row of every tile | 2 KB |
| `VC_LCTRL_ATTR_NONE` | Nothing: the whole layer uses one set of colors | — |

At one bit per pixel an attribute is a color pair, foreground in the high
nibble and background in the low one, the way text mode's pen is. At 2, 4 and
8 bits it is a set of fields:

| Bits | Holds |
|---|---|
| 3–0 | Which palette row the cell's colors come from (not at 8 bits) |
| 4 | Flip the tile left to right |
| 5 | Flip it upside down |
| 6 | Priority: draw this cell in front of sprites |
| 7 | A ninth bit for the tile number, which is how 2 and 4 bits reach 512 tiles |

## The palette

The card shows 256 colors at once, each one of 4,096. They live in its own
memory, 512 bytes at `$FC00`: two bytes an entry, `%0000RRRR` then `%GGGGBBBB`.
`VdpSetPalette` writes one, and anything drawn with it changes on the next line
the card draws.

Out of reset, the 256 are laid out as sixteen rows of sixteen, so that a 4-bit
tile which picks a row gets a whole set of shades:

| Row | Colors |
|---|---|
| 0 | The sixteen text-mode colors |
| 1 | Grays, black to white |
| 2–13 | Twelve hues — red, orange, yellow, chartreuse, green, spring green, cyan, azure, blue, violet, magenta, rose — each dark at 0, pure at 7, nearly white at 15 |
| 14 | Browns |
| 15 | Blue-grays |

Entry 0 of a row is special: a pixel with the value 0 is *transparent*, and
whatever is behind it shows through, unless the layer is set to draw it
(`VC_LCTRL_OPAQUE`). Behind everything is the backdrop, a single color set by
the low nibble of the `COLOR` register, which also fills the border.

## A screen of tiles

This program builds a Graphics-mode screen from four 4-bit tiles, giving every
cell a palette row of its own:

<<< @/../samples/assembly/tiles.asm{asm}

<Emulator
  sample="assembly/tiles"
  caption="Four tiles and a palette row per cell. Press a key to go back to text."
/>

<Figure
  src="/images/screens/tiles.png"
  alt="A screen filled with small square tiles — beveled blocks, stripes, checkers and white diamonds — colored in diagonal bands of red, orange, yellow, green, cyan, blue, violet and magenta, with black strips at the left and right."
  caption="Four tiles. Every color change is an attribute byte, not a different tile."
  screen
/>

The recipe is the same for any mode:

1. **Display off**, by writing `MODE1` without `VC_MODE1_DISP`. The tables go
   in without anything half-built on the screen.
2. **The layout**, with `VdpSetMode`.
3. **The layer**: `L0CTRL` for bits and attributes, then the table bases, the
   palette row, the scroll.
4. **The tables**, straight down the data port: point port A at an address
   once, and every byte written after that lands in the next place.
5. **Display on.**

And to get back to text, `InitVideo` and then `VideoClear`. `InitVideo` resets
every register text mode depends on and has the card copy its character set in
again; `VideoClear` is needed because the name table still holds tile numbers.

::: tip Use the Kernal for registers
`VdpWriteReg` writes a register and keeps track of what it wrote. The card's
registers can't be read back, so the Kernal keeps its own copy of the two layer
control registers, and `VdpLayer` and `VdpSetScroll` change one bit of them
without disturbing the rest. A register written straight to the port bypasses
that record.
:::

## Above `$3FFF`

The command that points a port at an address carries fourteen bits, which
reaches `$3FFF`. For the top three quarters of the card's 64 KB, write the top
two bits of the address to `VBANK` first. Put it back to 0 when you're done:
the Kernal counts on it. `VdpPoke` and `VdpPeek` do both for you, a byte at a
time.

## The vertical blank

The card draws a picture from the top down, and changing a table while it is
drawing tears the picture across the middle. The moment to change things is
between pictures, and `WaitVBlank` returns at the start of that gap.

The gap is shorter than it sounds. In Text and Compact the picture has borders
above and below, and there are about 4,500 cycles before drawing starts again;
in Graphics and Full there are no borders, and there are about 1,400. That is
enough to move sprites and scroll a layer, and not enough to rewrite a name
table — which is why a full screen is built with the display off.

## Loading from the card

`VdpLoadFile` reads a file from the memory card straight into the card's
memory, at any address: a pattern table drawn on your computer, a screen, a
palette. From BASIC the same job is one statement.

`VdpLoadFont` has the card copy its own character set into layer 0's pattern
table, wherever that is. The font is one bit per pixel and six pixels wide, so
it works in any layout: in the 8 × 8 ones the letters sit at the left of their
cells.

## The Kernal's calls for the card

| Call | Does |
|---|---|
| `VdpInfo` | Whether there is a card, its firmware version and what it can do — see [What's fitted](/assembly/detection) |
| `VdpWriteReg` | Write a register: A the value, X the register |
| `VdpSetMode` | Choose a layout: A = 1 Text, 2 Compact, 3 Graphics, 4 Full |
| `VdpPoke`, `VdpPeek` | One byte of the card's memory, anywhere in the 64 KB |
| `VdpSetPalette` | One palette entry: X the entry, A red, Y green and blue |
| `WaitVBlank` | Return when the card finishes a picture |
| `VdpLoadFile` | A file from the memory card, into the card's memory |
| `VdpLoadFont` | The card's character set, into layer 0's pattern table |
| `VdpSprite` | One sprite's position, shape and colors |
| `VdpSetScroll` | Scroll a layer |
| `VdpLayer` | Show or hide a layer |
| `VdpStatus` | Read a status register |

All of them return with the carry set, having done nothing, on a machine with
no card, so a program can call them and check the carry rather than detecting
the card first. [The Kernal](/assembly/kernal) has every one in detail.

## Drawing something you meant to draw

The tables in the program above were typed by hand, which is fine for four
tiles and no way to make a game. Draw them in a tool on your computer, export
the bytes, and either `.incbin` them into your program or put them on the
memory card and load them with `VdpLoadFile`.

Next: [layers and sprites](/assembly/layers).
