# Sound and video

The ACE has three voices of SID sound and a 40×24 screen in 16 colors. Here
is how to reach both from BASIC.

## Making a noise

Two statements. `VOL` sets the volume, 0 to 15. `SOUND` plays a note:

```
VOL 15
SOUND 1, 440, 50
```

`SOUND voice, frequency, length` — the voice is 1, 2 or 3 (there are three, and
they're independent), the frequency is in hertz, and the length is in
hundredths of a second. So that line plays a concert A for half a second.
`SOUND` waits for the note to finish before the program moves on.

Here's a scale:

<<< @/../samples/basic/scale.bas{basic}

```
RUN
NOTE 1
NOTE 2
NOTE 3
NOTE 4
NOTE 5
NOTE 6
NOTE 7
NOTE 8

OK
```

`DATA` holds the eight frequencies; `READ` takes the next one each time through
the loop. Change the numbers and you change the tune.

::: tip Some useful frequencies
Middle C is 262. Each octave up doubles the number, so the C above is 523 and
the one below is 131. The notes in between, going up from middle C: 262, 294,
330, 349, 392, 440, 494, 523.
:::

::: details What's actually making the sound
An ARMSID — a modern, pin-compatible remake of the MOS 6581, the chip that gave
the Commodore 64 its distinctive voice. Three oscillators, four waveforms each,
proper envelopes and a filter. `SOUND` and `VOL` only scratch it; the whole
register set is available to assembly programs and to `POKE`.
:::

## Drawing on the screen

The screen is **40 columns by 24 rows** of characters, in any of **16
colors**. Three statements:

- **`CLS`** clears it.
- **`LOCATE row, column`** moves the cursor.
- **`COLOR foreground, background`** sets the colors for the whole screen —
  every character on it, not just what you type next — each number from 0 to
  15:

<ColorChart />

<<< @/../samples/basic/screen-text.bas{basic}

`RUN` that and you get a line of text in the middle of an empty screen, dark on
light instead of the usual light on dark.

<Figure
  src="/images/screens/screen-text.png"
  alt="A mostly empty screen with HELLO FROM YOUR ACE printed in the middle, and OK on the left below it."
  caption="Three lines of BASIC, and the words land where you put them."
  screen
/>

## Both at once

Sound and screen together, which is where things start to feel like a computer
from 1983:

<<< @/../samples/basic/color-loop.bas{basic}

Fifteen colors, fifteen notes, one loop. Line 40 puts the cursor back in the
same place every time through, so the word stays put and only its color changes.

::: details The character set
The ACE draws with CP437 — the character set from the original IBM PC. As well
as letters and numbers there are box-drawing characters, arrows, card suits and
shaded blocks in the upper half of the set, which between them are enough to
build a surprisingly good-looking game.

You can't reach them from `PRINT`, though. The screen takes ordinary printable
characters and a couple of control codes (a new line, a bell) and quietly drops
everything else, so `PRINT CHR$(219)` prints nothing at all. Drawing with the
box characters means going through the Kernal's raw output routine, which is an
assembly-language job rather than a BASIC one.
:::

## Next

- [Storage](/using/storage) — keep the programs you write.
- [Your first ten minutes](/getting-started/first-ten-minutes) — if you skipped
  ahead and want the basics.
