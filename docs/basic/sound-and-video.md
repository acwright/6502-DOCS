# Sound and video

The ACE has a screen 40 characters wide and 24 rows deep, 16 colors, and three
voices of SID sound. Five statements reach all of it.

## Clearing and placing

```
10 CLS
20 LOCATE 5, 10
30 PRINT "OVER HERE"
```

`CLS` clears the screen and puts the cursor top left. `LOCATE row, column` moves
it: rows `0` to `23` down the screen, columns `0` to `39` across.

**Row first, then column.** Get them the wrong way around and you'll get
`?ILLEGAL QUANTITY ERROR` as soon as the column number goes past 23, which is at
least a quick way to find out.

## Color

`COLOR foreground, background` sets the colors for everything on the screen,
each from 0 to 15:

<ColorChart />

<<< @/../samples/basic/screen-text.bas{basic}

There's only **one** foreground and one background for the whole screen, not
one per character. Change `COLOR` and everything already there changes with
it, the `OK` prompt included — it isn't a paint color, it's more like a pair
of colored lights the whole screen sits under. `CLS` fills the screen with
the current background.

## Sound

`SOUND voice, frequency, duration` plays a note:

- **voice** — 1, 2 or 3. Three notes can be playing at once.
- **frequency** — in hertz. Middle C is 262.
- **duration** — in hundredths of a second, so `SOUND 1, 262, 50` is half a
  second.

`VOL n` sets the overall volume, 0 to 15. It starts at zero, so **a program that
makes no noise is usually a program that forgot `VOL`.**

<<< @/../samples/basic/scale.bas{basic}

`SOUND` waits for the note to finish before the program carries on. That makes
tunes easy and means you can't play a note *while* something else happens from
BASIC — for that you need machine code.

## The notes

Multiply or divide by two to change octave:

| | | | | | | |
|---|---|---|---|---|---|---|
| C | D | E | F | G | A | B |
| 262 | 294 | 330 | 349 | 392 | 440 | 494 |

## Both at once

<<< @/../samples/basic/color-loop.bas{basic}

Fifteen colors and fifteen rising notes, in one loop. The `"  "` on the end of
line 50 is there to wipe the tail of the previous, longer number — a trick worth
remembering, because nothing erases itself.

<Figure
  src="/images/screens/colors.png"
  alt="A black screen with the words COLOR 15 in white in the middle, and OK below to the left."
  caption="Where the loop leaves you: the last of its fifteen colors, on the black background it set on the way past. Each of the other fourteen was on screen for a fifteenth of the time."
  screen
/>

## Animation

Nothing on this screen moves on its own. You draw the thing, wait, draw a space
over it, and draw it one column along:

<<< @/../samples/basic/bouncing-ball.bas{basic}

That's the whole of two-dimensional animation on a text screen. `PAUSE 3` is
what stops it being a blur — `PAUSE` counts in hundredths of a second, same as
`SOUND`.

::: tip Making it smoother
The `O` flickers a little because it's erased before it's redrawn. Draw the new
position first and erase the old one second and it steadies up considerably.
:::

## What you can't draw

`PRINT` on the ACE's screen shows the ordinary printable characters — letters,
digits, punctuation. Character codes above 126 don't appear, so the box-drawing
and block characters in the machine's character set aren't reachable this way.
Build pictures out of `*`, `#`, `.` and `O`, the way the arcade did for years
before anyone had a sprite.

Next: [reading the joysticks and the keyboard while a program
runs](/basic/controls).
