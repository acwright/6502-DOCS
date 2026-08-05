# Making decisions

`IF` is how a program stops doing the same thing every time.

## The shape of it

```
10 A = 7
20 IF A > 5 THEN PRINT "BIG" ELSE PRINT "SMALL"
```

```
RUN
BIG

OK
```

`IF` a test holds, `THEN` do this, or `ELSE` do that. The `ELSE` half is
optional.

## Jumping instead of doing

`THEN` followed by a line number is short for "go there":

```
10 IF A > 5 THEN 100
```

That's the same as `THEN GOTO 100`, and you'll see it written both ways.

## What you can test

| | |
|---|---|
| `=` | equal to |
| `<>` | not equal to |
| `<` `>` | less than, greater than |
| `<=` `>=` | less than or equal, greater than or equal |

They work on text too, in alphabetical order:

```
PRINT "A" < "B"
```

```
-1

OK
```

Which brings us to the thing everybody trips over.

## True is −1

A comparison doesn't give you "true". It gives you **−1** for true and **0** for
false, and those are ordinary numbers you can print, store and add up:

```
PRINT 1 = 1
PRINT 1 = 2
```

```
-1
 0

OK
```

`IF` treats *any* non-zero value as true, which is why `IF A THEN …` works when
`A` is 5.

Being able to count truths is genuinely useful:

```
10 H = 140 : A = 11
20 PRINT "TESTS PASSED:"; -((H >= 130) + (A >= 10))
```

Each passing test contributes −1, so negating the total counts them.

## And, or, not — the trap {#and-or-not-the-trap}

`AND`, `OR` and `NOT` do their work **bit by bit on whole numbers**. On the
−1/0 values that comparisons produce, that behaves exactly like the words
suggest:

```
PRINT (5 > 3) AND (2 > 1)
```

```
-1

OK
```

On anything else, it does arithmetic you probably didn't order:

```
PRINT 12 AND 10
PRINT NOT 1
```

```
 8
-2

OK
```

`12 AND 10` is 8 because that's what those bits do. `NOT 1` is −2 for the same
reason — it flips every bit of 1, and the answer isn't 0.

**The rule that keeps you out of trouble:** use `AND`, `OR` and `NOT` on
comparisons, not on counts. Write `IF (N > 0) AND (N < 10)`, never `IF N AND 10`.

::: tip When you actually want the bits
Reading a joystick is exactly when you want them, because each direction is one
bit. `IF (JOY(1) AND 16) = 0` asks "is the up bit clear" and is the correct way
to write it. [Sticks and keys](/basic/controls) covers the whole layout.
:::

## Several things on the THEN

Everything after `THEN` on the line only happens when the test holds:

```
10 IF G < N THEN PRINT "TOO LOW" : GOTO 50
```

Both the `PRINT` and the `GOTO` are inside the `IF`. That's how a one-line
`IF` gets to do two things, and it's the most common way to write a guard.

## A worked example

<<< @/../samples/basic/ride-check.bas{basic}

```
RUN
YOU CAN RIDE
HEIGHT TEST GIVES-1
AGE TEST GIVES-1

OK
```

Lines 50 and 60 print the raw result of each comparison, so you can see the −1
that line 30 was really testing.

Next: [doing something more than once](/basic/loops).
