# Going around again

A loop is how you get a lot done with a little typing.

## The shape of it

```
10 FOR N = 1 TO 4
20 PRINT N; " SQUARED IS"; N * N
30 NEXT N
```

```
RUN
 1 SQUARED IS 1
 2 SQUARED IS 4
 3 SQUARED IS 9
 4 SQUARED IS 16

OK
```

`FOR` sets `N` to 1. Everything down to `NEXT` runs. `NEXT` adds one to `N` and
sends it back round, until `N` passes 4.

## Counting by something else

`STEP` says how much to add each time. Negative counts down:

<<< @/../samples/basic/countdown.bas{basic}

```
RUN
COUNTING DOWN
 10 8 6 4 2 0
LIFT OFF

OK
```

`STEP` can be a fraction too — `STEP .5` counts in halves.

## The body always runs at least once

This is the one surprising thing about `FOR` on this machine, and it's shared
with every BASIC of this family:

```
10 FOR I = 5 TO 1
20 PRINT "BODY"; I
30 NEXT I
40 PRINT "AFTER"; I
```

```
RUN
BODY 5
AFTER 6

OK
```

`FOR I = 5 TO 1` looks like it should do nothing at all. It runs once. The limit
is checked at `NEXT`, not at `FOR`, so the body has always happened by the time
anyone asks whether it should have.

If a loop might legitimately have nothing to do, test before you enter it:

```
10 IF C = 0 THEN 60
20 FOR I = 1 TO C
```

And note where `I` ends up: one step past the limit, not on it.

## One variable per NEXT

Loops nest — a loop inside a loop, and a loop inside that:

```
10 FOR I = 1 TO 2
20 FOR J = 1 TO 2
30 PRINT I; J
40 NEXT J
50 NEXT I
```

```
RUN
 1 1
 1 2
 2 1
 2 2

OK
```

Each `FOR` gets its own `NEXT`, closed in the reverse order they were opened.
**`NEXT J, I` is not accepted here** — the comma form produces `?NEXT WITHOUT
FOR`, so give each loop its own line. It costs a line and saves an evening.

You can leave the variable off entirely — a bare `NEXT` closes the innermost
loop — but naming it is what makes a long program readable.

::: tip How deep can you go?
Fourteen. Every open `FOR` keeps eighteen bytes of bookkeeping — where the loop
started, what it counts to, what it steps by — on a stack that is exactly 256
bytes, and fourteen of those fill it.

Fourteen is far more than any program you'd want to read, so this is a limit you
will meet by accident or not at all. It's worth knowing what it looks like when
you do: the fifteenth `FOR` doesn't complain. The complaint arrives later, at
that loop's `NEXT`, as `?NEXT WITHOUT FOR` — pointing at a line that is perfectly
correct. If you ever see that on a `NEXT` you're sure of, count your open loops.
:::

## Getting out early

`GOTO` a line outside the loop and you're out:

```
10 FOR N = 1 TO 100
20 IF N * N > 50 THEN 50
30 NEXT N
50 PRINT "FIRST SQUARE OVER 50 IS"; N * N
```

Leaving a loop this way is normal and fine. Doing it thousands of times in one
program, without ever letting the loops finish, is what eventually earns you an
`?OUT OF MEMORY` — see [when it goes wrong](/basic/debugging).

## Stopping a loop that won't stop

Press <kbd>Esc</kbd>. The program stops, tells you which line it was on, and
gives you the prompt back:

```
BREAK IN 20

OK
```

Nothing is lost — `LIST` still shows the program, and `CONT` starts it going
again.

Next: [giving a piece of program a name](/basic/subroutines).
