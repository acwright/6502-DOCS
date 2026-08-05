# What F18A mode is

There is a second video chip inside every ACE, and it has been switched off
since the day the machine was built.

The card in the video slot is a [Pico9918](/the-ace). It spends its life
pretending to be a TMS9918A, and it is very good at it — 40 columns of text,
three graphics modes, 32 sprites, 16 colors, all exactly as the 1979 chip did
them. But the Pico9918 also carries a second personality called **F18A mode**,
and when you turn that on the same card gains a second tile layer, hardware
scrolling, 64 programmable colors out of 4096, sprites that flip and never
flicker, a bitmap layer, and a small processor of its own.

None of it is available until you ask. That is deliberate, and the reason it
was built that way is [Turning it on](/f18a/unlocking).

::: warning This one needs the real thing
F18A mode exists on hardware and nowhere else. The emulator is a faithful
TMS9918A, and a faithful TMS9918A has eight registers, so every instruction in
this section either does nothing there or does something you did not intend.

That is survivable, and every program here survives it: the first thing each
one does is ask the card what it is, and the plain answer is a perfectly good
answer. Write it that way and one program runs on both machines.
:::

## What you actually get

The TMS9918A is a chip you program around. Almost every limit below is one that
shaped how games looked on it, and F18A mode lifts it.

| The chip you have | What unlocking gives you |
|---|---|
| Four sprites per scan line, and the fifth vanishes | Up to 31, so nothing flickers |
| One color per sprite | Up to seven, out of a palette chosen per sprite |
| One color pair per group of eight patterns | One palette per tile, four flags per tile |
| 16 fixed colors | 64 registers, any of 4096 colors, changed at any time |
| One tile layer | Two, each with its own name table and scroll |
| Scrolling means redrawing the screen | Two registers, one pixel at a time, no redraw |
| 24 rows | 24 or 30 |
| Sprites face one way | Flip horizontally, vertically, or both, for free |
| A frame interrupt | A frame interrupt *and* one at any scan line you name |
| The 6502 does all the work | A processor inside the card that does some of it |

## What that means if you are writing a game

Concretely, in the order you would probably want them.

**Scrolling stops being the hard part.** On a stock 9918A a side-scroller means
rewriting a column of the name table every few frames and living with 8-pixel
steps. Here you write one register per frame and the screen moves one pixel.
Set the horizontal page size and the card scrolls onto a second name table, so
you are writing new tiles into a column that is off-screen and nobody sees the
seam. [Scrolling and layers](/f18a/scrolling) does this properly.

**Your sprites stop disappearing.** The four-per-line limit is the single most
recognizable artifact of this chip — it is why the shots in a shoot-em-up
strobe. Register 30 turns it off. Set it once, at startup, and forget about
sprite multiplexing forever.

**Sprites get colors.** Not one color each: up to seven, from a palette you
chose per sprite. And that choice is one byte, so recoloring an enemy for a
second level costs nothing. [Colors](/f18a/color) has the whole scheme.

**A status bar stops costing you a layer.** Tile layer 2 sits over the top of
tile layer 1 with its own scroll registers, which you simply never write. The
score, the lives and the mini-map stay still while the world moves under them.

**Palette animation comes back.** 64 color registers you can write mid-frame
means cycling water, flashing a hit, fading a screen to black, and doing it in a
handful of writes rather than by rewriting patterns.

**A scan-line interrupt splits the screen.** Name a line, get an interrupt
there, change the scroll register in the handler, and the bottom half of the
screen scrolls at a different speed to the top. That is parallax, on a machine
from 1979.

**Something else can do the work.** The card contains a TMS9900 that can be
told to run once a frame, or once a scan line, with direct access to VRAM, the
palette and every register. Anything you would have burned 6502 cycles on —
clearing a buffer, plotting into the bitmap layer, moving a sprite table — can
happen inside the card instead. [The GPU](/f18a/gpu).

## The trade you are making

A program that uses any of this only runs on a machine that has it. That is a
smaller problem than it sounds, because detection is six bytes of code and the
answer arrives before you have drawn anything, but it is a decision to make on
purpose:

- **Detect and degrade.** Run in plain mode everywhere, and light up the extras
  where they exist. More work, and the way to write something you can hand to
  anybody.
- **Detect and refuse.** Say so and stop. Fair for something built around 30-row
  mode and a bitmap layer, where there is no lesser version.
- **Detect and lie to yourself.** Skip the check, write the registers, and hope.
  On a stock card the unlock attempt alone blanks the screen. Don't.

## Find out what you have

Type this in. It is the whole detection procedure, in BASIC, and it will tell
you which kind of machine you are sitting at.

<<< @/../samples/basic/f18a-detect.bas{basic}

On a plain machine, or in the emulator:

```
PLAIN TMS9918A. NO HIDDEN MODE HERE.
```

On an ACE whose card has the enhanced firmware:

```
F18A MODE IS IN THERE.
AND IT IS A PICO9918.
```

What every line of that is doing is [the next chapter](/f18a/unlocking).

## Where this comes from

The F18A is Matthew Hagerty's FPGA replacement for the TMS9918A, designed for
the TI-99/4A and adopted by most of the machines that used the original chip.
The Pico9918 is Troy Schrapel's re-creation of a 9918A on a Raspberry Pi Pico,
and it implements the F18A's enhanced feature set as well.

Two things follow from that, and both matter the moment you read a register
table from anywhere else.

**The Pico9918 is not an F18A.** It reports itself differently on purpose, it
adds registers and about 40 KB of memory the F18A never had, and it leaves out
the F18A's serial flash chip entirely. Where the two differ, these chapters say
so, and describe the card an ACE actually has.

**The documentation for this is genuinely thin.** What exists is a register
spreadsheet, a set of forum posts from the years the F18A was being designed,
and the Pico9918's own reference. They do not entirely agree — several registers
moved late in the F18A's development, and the forum posts describe a few
features that never shipped. Where the sources conflict, these chapters say so,
and say which one they followed.

## The chapters

| | |
|---|---|
| [Turning it on](/f18a/unlocking) | The unlock, the detection probe, and the damage both do to a card that turns out to be ordinary |
| [Colors](/f18a/color) | 64 palette registers, and the bitplane scheme that gets more than two colors into a tile |
| [Sprites](/f18a/sprites) | Flipping, sizing, coloring, and the end of the four-sprite limit |
| [Scrolling and layers](/f18a/scrolling) | Two tile layers, pixel scrolling, pages, and how a split screen is done |
| [The bitmap layer](/f18a/bitmap) | A pixel-addressed layer that floats over the tiles |
| [The GPU](/f18a/gpu) | The TMS9900 in the video card |
| [Every register](/f18a/registers) | All of them, with their bits |
