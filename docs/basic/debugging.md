# When it goes wrong

Every program you write will be wrong at least once. This is the chapter that
makes that a five-minute problem instead of an evening.

## Stopping it

<kbd>Esc</kbd> stops a running program, wherever it is:

```
BREAK IN 20

OK
```

That's the line it was on. Nothing is lost — `LIST` shows the program, the
variables still hold whatever they held, and `CONT` sets it going again from
where it stopped.

::: tip Ctrl+C does the same
Handy when you're driving the ACE from a terminal over the serial port, where
<kbd>Esc</kbd> may mean something to the terminal program itself.
:::

## Stopping it on purpose

`STOP` is <kbd>Esc</kbd> written into the program:

```
10 PRINT "FIRST"
20 STOP
30 PRINT "SECOND"
```

```
RUN
FIRST

BREAK IN 20

OK
```

Now you're at the prompt with the program halfway through, and everything is
readable:

```
PRINT X
PRINT A$; " "; N
```

Then `CONT` carries on at line 30. Put a `STOP` where you think the trouble
starts, look at the variables, `CONT`, and repeat. That is the whole of
debugging on this machine, and it's usually enough.

## CAN'T CONTINUE

```
?CAN'T CONTINUE ERROR
```

Means there's nothing to go back to. Two ways to get it: `CONT` when nothing has
stopped, or `CONT` after you've **edited a line**. Any change to the program
throws away the resume point.

So the order matters. Look at the variables first, then edit, then `RUN` from
the top. If you edit first, you lose the state you were trying to inspect.

## Reading an error

```
?SYNTAX ERROR IN 60
```

Three pieces: the `?`, the problem, and where. Type `LIST` and look at line 60.
No line number means it happened at the prompt rather than in a program.

The four you'll actually meet:

| | |
|---|---|
| `?SYNTAX ERROR` | BASIC can't read the line. Usually a bracket, a quote, or a variable name with a keyword hiding in it |
| `?UNDEF'D STATEMENT ERROR` | `GOTO` or `GOSUB` to a line that isn't there. Check for a deleted line |
| `?TYPE MISMATCH ERROR` | A string where a number goes, or the other way. Look for a missing `$` |
| `?OUT OF MEMORY ERROR` | Usually `GOSUB`s that never `RETURN`, or loops left half-finished |

[Every error message](/basic/errors) has the full list with causes and cures.

## The bugs that don't produce an error

Those are the interesting ones. Four that come up again and again:

**A variable name that isn't the one you meant.** Only the first two characters
count, so `TOTAL` and `TOP` are the same variable. If a number keeps changing
when nothing touched it, look for a second name starting with the same two
letters.

**A loop that ran once when it should have run none.** `FOR I = 1 TO N` with `N`
at zero still runs the body once, because the limit is tested at `NEXT`. Guard
it with an `IF` in front.

**A joystick test written the natural way round.** `IF (J AND 16) THEN` is true
when the player *isn't* pushing up. It wants `= 0` on the end.

**`AND` and `OR` used on counts instead of comparisons.** `IF N AND 10` is doing
bit arithmetic, and it will be true for values you never intended. See [making
decisions](/basic/decisions#and-or-not-the-trap).

## Printing your way out

When `STOP` isn't enough, add lines that tell you what's happening:

```
25 PRINT "AT LINE 25, X="; X; " J="; J
```

Number them at 5s or 25s so they stand out from your real lines, and delete them
by typing their numbers when you're done. It is unfashionable, it is what
everybody actually does, and on a machine that boots in five seconds it's
faster than anything cleverer.

::: details When the whole machine locks up
`WAIT` on a bit that never arrives, or `SYS` to an address with no code at it,
will take the machine with it — <kbd>Esc</kbd> won't answer. Press reset. Your
program is gone, which is the argument for `SAVE`ing before you try either.
:::

Next: [eight programs worth typing in](/basic/projects).
