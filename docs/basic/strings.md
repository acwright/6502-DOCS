# Working with words

A **string** is a piece of text. Its name ends in `$`, it can be up to 255
characters long, and BASIC gives you five functions for cutting it up.

## Gluing and measuring

`+` joins two strings. `LEN` counts the characters:

```
A$ = "HELLO"
PRINT A$ + " THERE"
PRINT LEN(A$)
```

```
HELLO THERE
 5

OK
```

Go over 255 characters and you get `?STRING TOO LONG ERROR`. It takes some
doing.

## Cutting it up

| | |
|---|---|
| `LEFT$(A$, 2)` | the first 2 characters |
| `RIGHT$(A$, 3)` | the last 3 |
| `MID$(A$, 2, 3)` | 3 characters starting at the 2nd |
| `MID$(A$, 3)` | everything from the 3rd character on |

```
PRINT LEFT$("HELLO", 2)
PRINT RIGHT$("HELLO", 3)
PRINT MID$("HELLO", 2, 3)
```

```
HE
LLO
ELL

OK
```

**`MID$` counts from 1**, not from 0. Arrays count from zero and strings count
from one, and no, nobody knows why.

Asking for more than there is doesn't hurt: `LEFT$("ABC", 10)` gives you `ABC`,
and `MID$("ABC", 4)` gives you an empty string.

## Letters and their numbers

Every character has a code. `ASC` gives you the code of a character and `CHR$`
gives you the character for a code:

```
PRINT ASC("A")
PRINT CHR$(65)
```

```
 65
A

OK
```

`CHR$` is how you print a character you can't type — `CHR$(34)` is a double
quote, which is otherwise impossible to get inside a string.

## Numbers into text and back

`STR$` turns a number into a string. `VAL` turns a string into a number:

```
PRINT "[" + STR$(42) + "]"
PRINT VAL("3.5"); VAL("12ABC"); VAL("ABC")
```

```
[ 42]
 3.5 12 0

OK
```

Two details in there. `STR$(42)` keeps the [leading
space](/basic/numbers-and-variables#that-leading-space) that `PRINT` would have
put in front of the number, so trim it with `MID$(S$, 2)` when you're building
neat output. And `VAL` reads as far as it can and gives `0` when it can't read
anything — it never errors, which makes it the safe way to accept a number from
somebody.

## Comparing them

The comparisons work in alphabetical order, and they're how you sort things:

```
PRINT "APPLE" < "BANANA"
PRINT "ABC" = "ABC"
```

```
-1
-1

OK
```

## A worked example

<<< @/../samples/basic/initials.bas{basic}

```
RUN
NAME:   ADA LOVELACE
LETTERS: 11
INITIALS: A.L.
BACKWARDS: ECALEVOL

OK
```

Lines 70 to 90 are the pattern to remember: a `FOR` loop counting *down* through
a string, pulling out one character at a time with `MID$(L$, N, 1)`. Reversing,
searching and counting are all that loop with a different line 80.

::: details Where the text goes
Strings live at the top of memory and grow downwards, while your program and
variables grow up from the bottom. Every time you build a new string the old one
is left behind as litter, and when the two meet, BASIC stops to sweep up. On a
long string-heavy program you'll occasionally notice it pause for a moment: that
is what's happening. [What BASIC does with your memory](/basic/inside) has the
map.
:::

Next: [keeping a list inside the program itself](/basic/data).
