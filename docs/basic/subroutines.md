# Subroutines

When the same few lines need to happen in three different places, put them in
one place and call them.

## GOSUB and RETURN

```
10 GOSUB 100
20 PRINT "BACK"
30 END
100 PRINT "IN THE SUBROUTINE"
110 RETURN
```

```
RUN
IN THE SUBROUTINE
BACK

OK
```

`GOSUB` jumps like `GOTO`, but it remembers where it came from. `RETURN` goes
back to the line *after* the `GOSUB`.

## Where to put them

Subroutines go after the main program, and the main program ends with `END` so
it doesn't wander into them:

```
10 REM MAIN PROGRAM
20 GOSUB 1000
30 END
1000 REM DRAW THE BOARD
1010 RETURN
```

Without that `END` on line 30, the program falls straight into line 1000, prints
the board a second time, hits `RETURN` with nowhere to return to, and stops with
`?RETURN WITHOUT GOSUB`. It's the classic mistake, and now you know what the
message means.

## Passing values

There are no parameters. A subroutine works on ordinary variables, so you set
them before you call:

```
10 R = 5
20 GOSUB 500
30 PRINT "AREA IS"; A
40 END
500 A = 3.14159 * R * R
510 RETURN
```

Everything is shared with everything. Pick a couple of variables and use them
consistently as "the ones subroutines talk through", and write down which
they are in a `REM`.

## A menu with ON

`ON` picks a destination by number: `1` takes the first line in the list, `2`
the second:

<<< @/../samples/basic/menu.bas{basic}

```
RUN
1 - SAY HELLO
2 - TELL A JOKE
3 - ADD UP

CHOOSE? 2
WHY DID THE 6502 CROSS THE BUS

OK
```

`ON C GOSUB 100, 200, 300` replaces three `IF`s and stays readable when the menu
grows. `ON … GOTO` works exactly the same way without the coming back.

A number outside the list — `0`, or `4` when there are only three — quietly
falls through to the next line, which is why line 70 checks the range first. A
*negative* number is an error rather than a fall-through.

## How deep you can go

A subroutine can call a subroutine. Each `GOSUB` costs a little of the machine's
working space, and around two dozen levels deep you'll get `?OUT OF MEMORY`.

That's plenty for ordinary nesting and not enough for recursion. If you write a
subroutine that calls itself, expect to hit the ceiling almost immediately:

```
10 N = N + 1
20 GOSUB 10
```

```
RUN

?OUT OF MEMORY ERROR IN 20

OK
```

Next: [holding a hundred numbers without inventing a hundred
names](/basic/arrays).
