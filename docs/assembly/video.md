# The screen

The video card is a **6502-PICOVDP**, and the machine uses it first as a text
screen: 40 columns by 24 rows of 6 × 8 cells, each character with a color pair
of its own, drawn in a character set the card carries itself. The screen comes
up the first time anything is printed — BASIC's header, on a normal start — so
by the time your program runs it is already there.

That is the part of the card this chapter covers. Underneath the text it has
three more screen layouts, 256 colors, two layers and 64 sprites, and
[the graphics modes](/assembly/graphics) is where those start.

## Text mode, as the machine leaves it

| | |
|---|---|
| `VideoClear` | Fill the screen with spaces in the current pen, cursor to the top left |
| `VideoSetCursor` | X = column 0–39, Y = row 0–23 |
| `VideoGetCursor` | The same two, back out |
| `VideoPutChar` | Put the character in A **at** the cursor, without moving it |
| `VideoChroutRaw` | Put it there and advance, wrapping and scrolling as needed |
| `VideoScroll` | Everything up one line |
| `VideoSetColor` | The pen: letters and background, one nibble each — and the border |
| `InitVideo` | Put the whole thing back to text mode, character set and colors included |

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

<Emulator
  sample="assembly/screen"
  caption="A box drawn from the half of the character set PRINT cannot reach."
/>

Three things in there are worth pulling out.

**The check at the top.** `HW_PRESENT` says what the machine found at power-on.
Guarding a screenful of drawing with `and #HW_VID` costs four bytes and means
the program says something sensible instead of drawing into a card that is not
there. [What's fitted](/assembly/detection) is the whole chapter on this.

**The pen.** `VideoSetColor` takes the letter color in the high nibble and the
background in the low one, so light yellow on dark blue is
`(TMS_LT_YELLOW * 16) | TMS_DK_BLUE`. The names are all in `6502-VDP.inc`.
Setting the pen changes nothing already on the screen; it colors what is drawn
next, and `VideoClear` fills the whole screen with it — which is why the program
sets the pen first and clears second.

**Leaving the cursor somewhere sensible.** Whatever prints next carries on from
wherever you left the cursor, including BASIC's own `OK`. Setting it to a
sensible row before returning is the difference between a tidy screen and a
prompt in the middle of your artwork.

<Figure
  src="/images/screens/framed-sign.png"
  alt="A blue screen with a double-lined box drawn in pale yellow, THE ACE centered inside it, and OK below."
  caption="Every character of that frame is above 126, so PRINT cannot reach a single one of them."
  screen
/>

## A color for every character

Every cell on the screen keeps two things: the character, and the color pair it
was drawn in. So a program can change the pen between one character and the
next, and the screen fills up with as many colors as it likes:

<<< @/../samples/assembly/rainbow.asm{asm}

<Emulator
  sample="assembly/rainbow"
  caption="Fourteen lines in fourteen pens. Press a key, and every character drawn in color 13 changes at once."
/>

<Figure
  src="/images/screens/rainbow.png"
  alt="A black screen listing the colors 2 to 15 by name, each line in its own color, with line 13 shown in orange, and two lines asking for a key."
  caption="After the first key: nothing on the screen was redrawn, and line 13 is orange anyway."
  screen
/>

**The border follows the pen.** The strip around the text takes the background
nibble of the last `VideoSetColor`, so a program that sets white on black gets a
black frame to go with it.

**A color number is a palette entry.** The card doesn't store "magenta" in a
cell; it stores 13, and looks 13 up in its palette every time it draws a line.
`VdpSetPalette` rewrites an entry — X is the entry, A and Y the red, then the
green and blue, four bits each — and everything drawn with that number changes
on the next line the card draws. That is what the program does to line 13.

**`InitVideo` puts the colors back.** It restores the first sixteen palette
entries along with everything else about text mode, but it doesn't clear the
screen, so the program's last instruction returns the orange line to magenta
without losing a character.

## The colors

These are the first sixteen of the card's 256, the ones text mode uses and the
ones the `TMS_*` names in the include refer to. Color 0 is the one to be careful
with: text mode draws it as black, but in a graphics layer it is usually
*transparent*, letting whatever is behind show through.

<ColorChart constants />

## The character set

The 256 glyphs are the IBM code page 437 set: letters, digits, punctuation, box
drawing, blocks, arrows, card suits, a handful of Greek. They are not in the
ROM. The card carries them in its firmware and copies them into its own memory,
at `$0800` of the card's 64 KB, and text mode draws from that copy: eight bytes
per character, one byte per row, most significant bit on the left, and the top
six bits of each byte inside the 6 × 8 cell.

Which means you can change the character set — the classic text-mode trick.
Rewrite the eight bytes of a character you never use, and every place that
character appears on screen becomes your shape. `VdpPoke` writes one byte of the
card's memory, X and Y the address:

```asm
PATTERNS = $0800                ; where text mode keeps the glyphs, in the card

  ldy #0
Copy:
  phy
  tya
  clc
  adc #<(PATTERNS + '*' * 8)    ; the eight bytes that draw a '*'
  tax
  lda MyShape,y
  ldy #>(PATTERNS + '*' * 8)
  jsr VdpPoke
  ply
  iny
  cpy #8
  bne Copy

MyShape:
  .byte %01111000
  .byte %11111100
  .byte %10110100
  .byte %11111100
  .byte %10000100
  .byte %11001100
  .byte %01111000
  .byte %00000000
```

Draw the shape in the source and you can see it while you type it — six pixels
wide, with the two low bits of every byte left clear.

::: tip Put it back when you're done
`InitVideo` has the card copy its own set in again and restores text mode, which
makes it the one-line undo for any amount of character-set vandalism. BASIC
doesn't call it for you when your program returns, so call it before you do, or
the `OK` prompt will be written in your shapes.
:::

## How the screen scrolls

When the cursor runs off the bottom row, nothing is copied. The card can scroll
its picture in hardware, so the Kernal moves the whole text layer up by eight
pixels — one register write — and clears the row that comes into view at the
bottom. That makes a scroll a few hundred cycles instead of the tens of
thousands a copy would cost.

The catch is only for a program that writes the card's memory directly. The top
row of the screen is not always the top row of the table behind it: `VID_TOP`
(`$0392`) says which table row is showing at the top, so the cell at a screen
position is at

```
((row + VID_TOP) mod 24) × 40 + column
```

The Kernal's own calls already account for it — `VideoSetCursor` and
`VideoGetCursor` speak screen rows — so a program that draws through them never
needs to know.

## Talking to the card directly

The card has **two** complete pairs of addresses:

| | Data | Command and status |
|---|---|---|
| **Port A** | `VC_DATA` `$9C00` | `VC_REG` / `VC_STATUS` `$9C01` |
| **Port B** | `VC_DATA2` `$9C02` | `VC_REG2` / `VC_STATUS2` `$9C03` |

Each pair has its own pointer into the card's memory, and the Kernal and BASIC
only ever use port A. Everything is two writes to the command address — a byte,
then a command:

| Second write | Does |
|---|---|
| `%1rrrrrrr` — `VC_REG_WRITE` + register | Writes the first byte into register `r`, 0–127 |
| `%01aaaaaa` — `VC_ADDR_WRITE` + address high bits | Points the port at an address, for writing |
| `%00aaaaaa` | Points it at an address, for reading |

```asm
SetReg:                         ; A = value, X = register (VC_REG_*)
  sta VC_REG
  txa
  ora #VC_REG_WRITE
  sta VC_REG
  rts
```

After an address, every read or write of the data port moves on by one. The
command carries only fourteen bits of address, so the top two — for anything at
`$4000` or above — come from the `VBANK` register, which you set first.

::: warning Two registers belong to both ports
`VBANK` and `VINC` (the step the pointer moves by) are shared between the ports,
and every Kernal routine expects them at 0 and +1. A program that changes either
puts it back before it prints anything, or calls `InitVideo`, which does.
:::

The two pairs exist so that an interrupt handler never has to fight the
foreground. A handler that uses port B cannot land between the two writes of a
command on port A, so no `sei` and `cli` are needed around video work.
[Interrupts](/assembly/interrupts#the-video-card-s-interrupts) has a handler
that does it.

Reading a status address returns one of sixteen status registers, chosen by
`STATSEL_A` or `STATSEL_B`; the Kernal's `VdpStatus` reads one for you. A read
also resets that port's first-write-or-second flag, which is the way to get back
in step if you are ever unsure.

Next: [the graphics modes](/assembly/graphics).
