# Programs worth typing

Eight finished programs. Type them in, run them, then change the line each one
suggests at the end and run it again — that last part is where the learning
actually happens.

All of them run on an ACE exactly as printed.

## A guessing game

The machine thinks of a number and you close in on it.

<<< @/../samples/basic/guessing-game.bas{basic}

```
RUN
I AM THINKING OF A NUMBER FROM 1 TO 100
GUESS 1? 50
TOO LOW
GUESS 2? 75
TOO HIGH
GUESS 3? 62
TOO HIGH
GUESS 4? 56
TOO HIGH
GUESS 5? 52
GOT IT IN 5 GUESSES

OK
```

Line 20 picks the number: `RND(1)` gives something between 0 and 1, multiplying
by 100 and taking `INT` gives 0 to 99, and the `+ 1` makes it 1 to 100.

::: tip It picks the same number every time
`RND` starts from the same place whenever the ACE is switched on, so the first
game after a cold start is always the same. Add a line that counts while it
waits for a keypress and use that as a seed — `RND(-S)` sets the starting point
— and no two games will be alike.
:::

**Now change this:** make it count down from 7 guesses and lose the game at
zero.

<Figure
  src="/images/screens/treasure.png"
  alt="A screen showing four-by-four grids of dots with Xs where digs have happened, questions asking for row and column, and TREASURE. FOUND IN 2 DIGS. at the bottom."
  caption="Two digs in. The grid is redrawn after each one, so you can see where you have been."
  screen
/>

## A times table

<<< @/../samples/basic/times-table.bas{basic}

```
RUN
THE SEVEN TIMES TABLE
 1 X 7 = 7
 2 X 7 = 14
 3 X 7 = 21
 4 X 7 = 28
 5 X 7 = 35
 6 X 7 = 42
 7 X 7 = 49
 8 X 7 = 56
 9 X 7 = 63
 10 X 7 = 70
 11 X 7 = 77
 12 X 7 = 84

OK
```

**Now change this:** ask which table with `INPUT` instead of fixing it at 7.

## A tune

A melody in `DATA`, played by four lines that don't know what tune it is.

<<< @/../samples/basic/tune.bas{basic}

Each pair in the `DATA` is a frequency and a duration. `0, 0` ends the tune, and
a frequency of `1` means a rest — line 60 turns it into a `PAUSE` instead of a
note.

**Now change this:** put a second verse in line 105 and watch how little of the
program you have to touch.

## A bouncing ball

<<< @/../samples/basic/bouncing-ball.bas{basic}

Draw, wait, erase, move, repeat. Lines 110 and 120 turn it round at the edges by
flipping `D` between `1` and `-1`.

**Now change this:** add a `Y` that moves as well, so it bounces around the
whole screen instead of along one line.

## What this machine has

<<< @/../samples/basic/whats-fitted.bas{basic}

One byte at address 781 holds a bit for every card the machine found at
switch-on. This asks it, and prints the answer in English.

**Now change this:** make it print `HW=` and the byte in hexadecimal with
`HEX()`, so it matches what `MEM` shows.

## A shopping list

<<< @/../samples/basic/shopping.bas{basic}

The `"END"` on line 100 is what stops it — a sentinel, so the program doesn't
need to know how long the list is.

**Now change this:** add prices as a second item in each `DATA` pair and total
them up.

## A file browser

<<< @/../samples/basic/file-browser.bas{basic}

Six lines that list the memory card and load whatever you name. `LOAD` replaces
the running program with the one it loaded, so this is a launcher — the last
thing it does is hand over.

**Now change this:** `SAVE "MENU"` it, and put it on every card you own.

## Treasure grid

The last one, and the biggest. It uses an array for the map, a subroutine to
draw it, `INPUT` for the digs, `IF` to decide, and `RND` to hide the treasure.

<<< @/../samples/basic/treasure.bas{basic}

```
RUN
TREASURE GRID
FOUR ROWS, FOUR COLUMNS, THREE DIGS.

. . . .
. . . .
. . . .
. . . .

DIG 1 - ROW? 1
DIG 1 - COLUMN? 1
NOTHING THERE

X . . .
. . . .
. . . .
. . . .

DIG 2 - ROW? 3
DIG 2 - COLUMN? 1
X . . .
. . . .
X . . .
. . . .

TREASURE. FOUND IN 2 DIGS.

OK
```

Line 130 is the one to study: `P = (R - 1) * 4 + C` turns a row and a column
into a single number from 1 to 16, because [arrays here have only one
dimension](/basic/arrays#one-dimension-only). The drawing subroutine at 500
turns it back the other way.

**Now change this:** make the grid 5 × 5. You'll need to change the `16`, the
`4`s and the loop limits — and if you do it right, nothing else.

## Where next

- [The reference](/basic/reference) — every keyword, with an example each.
- Cross-development — write these on a laptop, in a real editor.
- The assembly guide — for when BASIC isn't fast enough.
