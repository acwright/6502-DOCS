# The screen

The video card is a TMS9918A — the chip from the MSX, the ColecoVision and the
TI-99/4A — or a Pico9918 pretending to be one, which is what an ACE ships with.
Either way it behaves identically, and it comes up in text mode with the
character set already loaded.

## Text mode, as the machine leaves it

40 columns by 24 rows, one color for the letters and one for the background,
and 256 characters to choose from.

| | |
|---|---|
| `VideoClear` | Blank the screen, cursor to the top left |
| `VideoSetCursor` | X = column 0–39, Y = row 0–23 |
| `VideoGetCursor` | The same two, back out |
| `VideoPutChar` | Put the character in A **at** the cursor, without moving it |
| `VideoChroutRaw` | Put it there and advance, wrapping and scrolling as needed |
| `VideoScroll` | Everything up one line |
| `VideoSetColor` | Letters and background, one nibble each |
| `InitVideo` | Put the whole thing back to text mode, character set included |

The difference between `VideoPutChar` and `VideoChroutRaw` is the one to keep
straight. `VideoPutChar` stamps. `VideoChroutRaw` stamps and moves along —
and unlike `Chrout` it does not interpret anything, so all 256 characters are
available to it.

## Drawing something

<<< @/../samples/assembly/screen.asm{asm}

```
╔══════════════════════╗
║                      ║
║       THE ACE        ║
║                      ║
╚══════════════════════╝
```

Three things in there are worth pulling out.

**The check at the top.** `HW_PRESENT` says what the machine found at power-on.
Guarding a screenful of drawing with `and #HW_VID` costs four bytes and means
the program says something sensible instead of drawing into a card that is not
there. [What's fitted](/assembly/detection) is the whole chapter on this.

**The color byte.** `VideoSetColor` takes the letter color in the high nibble
and the background in the low one, so light yellow on dark blue is
`(TMS_LT_YELLOW * 16) | TMS_DK_BLUE`. Sixteen colors, and the names are all in
`6502.inc`.

**Leaving the cursor somewhere sensible.** Whatever prints next carries on from
wherever you left the cursor, including BASIC's own `OK`. Setting it to a
sensible row before returning is the difference between a tidy screen and a
prompt in the middle of your artwork.

## The colors

<ColorChart constants />

In text mode there is one pair for the whole screen. The graphics modes are
where color gets interesting — [that chapter](/assembly/graphics) is next.

## The character set

The 256 glyphs are the IBM code page 437 set: letters, digits, punctuation, box
drawing, blocks, arrows, card suits, a handful of Greek. A copy lives in ROM
from `$B800`, eight bytes per character, one byte per row, most significant bit
on the left.

That copy is the source. `InitVideo` loads it into the card's own memory at
power-on, and can reload it any time to put things back.

Which means you can change the character set — the classic text-mode trick.
Rewrite the eight bytes of a character you never use, and every place that
character appears on screen becomes your shape:

```asm
PATTERNS = $0800                ; where text mode keeps the glyphs, in the card

  lda #<(PATTERNS + '*' * 8)    ; the eight bytes that draw a '*'
  ldx #>(PATTERNS + '*' * 8)
  jsr SetVramWrite              ; your own helper — see below
  ldy #0
Copy:
  lda MyShape,y
  sta VC_DATA
  iny
  cpy #8
  bne Copy

MyShape:
  .byte %00111100
  .byte %01111110
  .byte %11011011
  .byte %11111111
  .byte %10111101
  .byte %11000011
  .byte %01111110
  .byte %00111100
```

Draw the shape in the source and you can see it while you type it. The
[TMS9918 editor](https://github.com/acwright/TMS9918-EDITOR) does the same job
with a mouse, and exports the bytes.

::: tip Put it back when you're done
`InitVideo` reloads every glyph from ROM and restores text mode, which makes it
the one-line undo for any amount of character-set vandalism. Call it before you
return to BASIC or the `OK` prompt will be written in your shapes.
:::

## Talking to the card directly

Two addresses. `VC_DATA` at `$9C00` reads and writes the card's memory;
`VC_REG` at `$9C01` sets up what happens next.

**To write to video memory**, send the address as two bytes — low first, then
high with bit 6 set — and then send data bytes, which auto-increment:

```asm
SetVramWrite:                   ; A = address low, X = address high
  sta VC_REG
  txa
  ora #$40                      ; bit 6 = write
  sta VC_REG
  rts
```

**To read**, the same with bit 6 clear.

**To set one of the eight mode registers**, send the value, then the register
number with bit 7 set:

```asm
SetVdpReg:                      ; A = value, X = register number
  sta VC_REG
  txa
  ora #$80
  sta VC_REG
  rts
```

::: warning Two writes have to arrive together
Every one of those is a pair of writes to the same address, and the card is
counting them. If an interrupt lands between the two and its handler also talks
to the card, both get confused. The Kernal's own interrupt handler does not
touch the video card, but anything of yours might — so `sei` around direct
register work and `cli` afterwards, which is exactly what the graphics demos
do.
:::

Reading `VC_STATUS` (the same address as `VC_REG`) resets the card's
first-byte-or-second-byte flip-flop, which is the standard way to get back in
step if you are unsure.

<Figure
  src="/images/screens/framed-sign.png"
  alt="A blue screen with a double-lined box drawn in pale yellow, THE ACE centered inside it, and OK below."
  caption="Every character of that frame is above 126, so PRINT cannot reach a single one of them."
  screen
/>

Next: [the graphics modes](/assembly/graphics).
