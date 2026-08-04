# Typing it in

There are two ways to give the ACE an instruction, and the difference between
them is one small thing: a number at the front.

## Do it now

Type this and press <kbd>Enter</kbd>:

```
PRINT "GOOD MORNING"
```

```
GOOD MORNING

OK
```

It happened right away. This is **immediate mode** — no number in front, so
BASIC does it and forgets it.

## Do it later

Now type the same thing with a number in front:

```
10 PRINT "GOOD MORNING"
```

Nothing happens. That's right. A line with a number in front gets *stored*
instead of run. You've written a program one line long. Type:

```
RUN
```

```
GOOD MORNING

OK
```

That's the whole distinction, and it never gets more complicated than that.

## The numbers are the running order

Line numbers say what order things happen in, not what order you typed them.
Type these three lines in this order:

```
30 PRINT "THIRD"
10 PRINT "FIRST"
20 PRINT "SECOND"
```

```
RUN
FIRST
SECOND
THIRD

OK
```

BASIC sorted them out. Count in tens, the way everyone does, and you leave
yourself room to slip a line in later at 15.

## Seeing what you've got

`LIST` shows the program:

```
LIST
10 PRINT "FIRST"
20 PRINT "SECOND"
30 PRINT "THIRD"

OK
```

`LIST` takes no arguments — it always shows the lot. (`LIST 20` is a syntax
error, which surprises people arriving from other BASICs.)

## Changing a line

To change a line, type it again with the same number. The new one replaces the
old:

```
20 PRINT "SECOND, BUT LOUDER"
```

To delete a line, type its number on its own and press <kbd>Enter</kbd>:

```
20
```

There is no line editor and no cursor to move around in a listing. Retyping a
line is the way you edit, and it's why short lines are worth writing.

::: tip Get a line back the easy way
`LIST`, then read the line you want to fix off the screen and type it again with
one word changed. On a terminal over [the serial port](/using/serial) you can
copy and paste it, which is a good reason to hook a laptop up when you're
writing something long.
:::

## Throwing it away

Three commands clear things out, and they're not the same:

| Command | What goes | What stays |
|---|---|---|
| `NEW` | The program **and** the variables | Nothing |
| `CLR` | The variables | The program |
| `RUN` | The variables | The program |

That last row catches people. `RUN` always starts with a clean slate of
variables, so a value you set in immediate mode is gone the moment you `RUN`.

```
A = 99
RUN
```

…and `A` is back to `0`.

## Starting somewhere else

`RUN` on its own starts at the top. Give it a line number and it starts there:

```
RUN 20
```

Useful when the first half of a program has already done its job and you only
want to see the rest.

## More than one thing on a line

A colon joins statements together on a single line:

```
10 PRINT "TIME FOR" : PRINT "TWO THINGS"
```

Both run, left to right. It saves memory and typing, and it costs you
readability, so use it where the two halves belong together.

## Try this

Type this in, `RUN` it, then change line 20 to your own name and `RUN` it again:

```
10 PRINT "THIS PROGRAM BELONGS TO"
20 PRINT "ADA"
30 PRINT "AND IT WORKS"
```

Next: [what a variable is, and what the machine can count
to](/basic/numbers-and-variables).
