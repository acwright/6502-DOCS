# Showing things

`PRINT` is the statement you'll type more than any other. It's worth ten minutes.

## Semicolon or comma

Those two separators are the whole of it. A **semicolon** joins things up tight:

```
PRINT "TOTAL:"; 42
```

```
TOTAL: 42

OK
```

A **comma** jumps to the next column:

```
PRINT 1, 2, 3
```

```
 1             2             3

OK
```

Columns are 14 characters wide. Three of them fit across the ACE's 40-column
screen, and a fourth wraps onto the next line — which looks like a bug the first
time it happens and isn't.

## Holding the cursor

End a `PRINT` with a semicolon and the next one carries on where it left off:

```
10 PRINT "WORKING";
20 PRINT ".";
30 PRINT ".";
40 PRINT " DONE"
```

```
RUN
WORKING.. DONE

OK
```

`PRINT` on its own prints nothing and moves down a line — which is how you get a
blank line.

## Putting things exactly where you want them

`TAB(n)` moves to column `n`, counting from the left edge of the line. `SPC(n)`
prints `n` spaces from wherever the cursor happens to be:

```
PRINT "NAME"; TAB(12); "SCORE"
PRINT "A"; SPC(5); "B"
```

```
NAME        SCORE
A     B

OK
```

`TAB` is absolute, `SPC` is relative. When you're laying out a table you almost
always want `TAB`.

`POS(0)` tells you which column you're on, which is occasionally the only way to
work out why something is landing in the wrong place.

## A worked example

<<< @/../samples/basic/receipt.bas{basic}

```
RUN
ITEM          PRICE
BREAD          1.2
MILK           .85

TOTAL          2.05

OK
```

Look at line 30. `.85` prints as `.85`, with no `0` in front — BASIC doesn't add
one. And every number is a space further right than the words above it, because
of the [sign space](/basic/numbers-and-variables#that-leading-space) in front of
every number.

## Printing numbers as hex

`HEX(n)` gives you a number in hexadecimal, always four digits with a `$`:

```
PRINT HEX(255); " "; HEX(4096)
```

```
$00FF $1000

OK
```

It takes 0 to 65535 and complains outside that. It's the fastest way to make
sense of anything you've read with [`PEEK`](/basic/machine).

## On the screen versus down the wire

Everything above is the same whether you're looking at the ACE's own screen or a
terminal on the serial port, with one difference worth knowing: the screen is 40
columns wide and shows the 95 ordinary printable characters. Character codes
above 126 don't appear on it at all, so `PRINT CHR$(219)` puts nothing on the
screen even though the character exists in the machine's character set.

::: details Drawing with characters
If you want block graphics on the ACE's screen, build them out of the ordinary
printable characters — `*`, `#`, `.`, `O` and friends. The full character set is
reachable from assembly, where you talk to the video chip directly rather than
through `PRINT`.
:::

Next: [getting an answer back out of the person at the
keyboard](/basic/input).
