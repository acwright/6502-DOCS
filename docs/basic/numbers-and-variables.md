# Numbers and variables

A **variable** is a name that remembers a value. Type this:

```
A = 5
PRINT A * A
```

```
 25

OK
```

`A` held the 5 until you asked for it. It will hold it until you change it,
`RUN` something, or switch the machine off.

## Two kinds of variable

A plain name holds a number. A name with a `$` on the end holds text — a
**string**:

```
N$ = "ADA"
PRINT "HELLO, "; N$
```

```
HELLO, ADA

OK
```

`A` and `A$` are two different variables and can both exist at once.

## Naming them

A name starts with a letter and can carry on with letters and digits: `A`, `X2`,
`HITS`, `TOTAL`. There's one rule to actually remember and one trap.

**The rule: only the first two characters count.** `COUNT` and `COURSE` are both
`CO` as far as BASIC is concerned, so they're the same variable:

```
COUNT = 7
COURSE = 9
PRINT COUNT
```

```
 9

OK
```

Writing them out in full is fine — helpful, even — as long as no two names in
your program start with the same two letters.

**The trap: a name can't contain a keyword.** `SCORE` has `OR` inside it, so:

```
SCORE = 5
```

```
?SYNTAX ERROR

OK
```

BASIC spotted `OR` in the middle of your name and gave up. The usual keywords to
watch for are `OR`, `AND`, `TO`, `IF`, `ON` and `FN`. Call it `SC` and move on.

::: details Why it does that
BASIC squashes every keyword down to a single byte the moment you press Enter,
before it has any idea you meant a variable name. `SCORE` becomes `SC`, the byte
for `OR`, `E` — which is not something it can assign to.
:::

## What it can count to

Numbers are held in five bytes, which buys you a range of about ±1.7 × 10³⁸ and
nine digits of precision:

```
PRINT 1 / 3
```

```
 .333333333

OK
```

Very large and very small numbers switch to scientific notation on their own:

```
PRINT 1234567890123
PRINT .000123
```

```
 1.23456789E+12
 1.23E-04

OK
```

There is one kind of number, not two — no separate integers. `7 / 2` is `3.5`,
and if you want `3` you ask for it with `INT`:

```
PRINT 7 / 2; INT(7 / 2)
```

```
 3.5 3

OK
```

## That leading space

Every number prints with a space in front of it. That space is where a minus
sign goes:

```
PRINT 1; -1; 2
```

```
 1-1 2

OK
```

Positive numbers look indented and negative ones don't, so columns of figures
line up. It's deliberate, and it means that when you glue a number to a word you
usually want to write the space yourself:

```
PRINT "SCORE:"; 100
```

```
SCORE: 100

OK
```

## Doing math

The usual five, in the usual order — powers first, then multiply and divide,
then add and subtract:

| | |
|---|---|
| `+` | add |
| `-` | subtract |
| `*` | multiply |
| `/` | divide |
| `^` | to the power of |

```
PRINT 2 + 3 * 4
PRINT (2 + 3) * 4
PRINT 2 ^ 10
```

```
 14
 20
 1024

OK
```

Parentheses work the way you'd hope. When in doubt, put them in.

## Try this

A program that turns Celsius into Fahrenheit:

<<< @/../samples/basic/converter.bas{basic}

```
RUN
C             F
 0             32
 25            77
 50            122
 75            167
 100           212

OK
```

Three things in there you haven't met yet: `DEF FN` makes a formula into your own
function, `FOR` counts from one number to another, and the comma lines the
results up in columns. All three get their own chapter. The columns are
[next](/basic/print).
