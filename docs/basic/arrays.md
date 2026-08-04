# Arrays

An **array** is one name holding many numbers, picked out by number instead of
by name.

## Making one

```
10 DIM S(4)
```

That's five boxes, not four: `S(0)`, `S(1)`, `S(2)`, `S(3)` and `S(4)`. Counting
from zero is normal here, and `DIM S(4)` giving you five is the thing to
remember.

Use them like any other variable:

```
20 S(0) = 10
30 S(3) = 40
40 PRINT S(0); S(3)
```

```
 10 40

OK
```

Everything starts at zero, so you can read a box you haven't filled in.

## The point of them

The index can be a variable, which is what makes an array worth having:

<<< @/../samples/basic/scores.bas{basic}

```
RUN
ROUND 1 SCORED 12
ROUND 2 SCORED 30
ROUND 3 SCORED 7
ROUND 4 SCORED 41
ROUND 5 SCORED 20

TOTAL 110
AVERAGE 22

OK
```

Five scores, two loops, one name. Change `DIM S(4)` to `DIM S(99)` and the same
program handles a hundred rounds.

## Strings work too

```
10 DIM N$(3)
20 N$(0) = "ADA"
30 N$(1) = "GRACE"
40 PRINT N$(1)
```

An array of text, indexed exactly the same way.

## One dimension only

This BASIC does not do grids. `DIM G(3,3)` is an error:

```
?BAD SUBSCRIPT ERROR

OK
```

Which doesn't stop you having a grid — you flatten it. A 4 × 4 board is sixteen
boxes, and you work out which one you want:

```
10 DIM B(16)
20 REM SQUARE AT ROW R, COLUMN C:
30 P = (R - 1) * 4 + C
40 B(P) = 1
```

That line 30 is worth copying down. The [treasure grid
project](/basic/projects#treasure-grid) is built on exactly it.

## Two things that go wrong

**`?BAD SUBSCRIPT`** — you asked for a box outside the array. `DIM S(4)` then
`S(5)` is five past the end of a five-box array, counting from zero.

**`?REDIM'D ARRAY`** — you `DIM`med the same array twice. Usually it's a `DIM`
inside a loop, or a `DIM` in a subroutine that gets called more than once. `DIM`
each array exactly once, near the top.

## What they cost

Every element is five bytes whether you use it or not, so `DIM X(999)` takes
5,000 bytes out of the roughly 30,000 you started with. `PRINT FRE(0)` tells you
what's left:

```
DIM A(100)
PRINT FRE(0)
```

```
 30206

OK
```

`CLR` gives it all back, along with every other variable.

Next: [doing the same sort of thing with words](/basic/strings).
