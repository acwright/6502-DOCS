# Your own functions

`DEF FN` names a formula. Write it once, use it everywhere.

## The shape of it

```
10 DEF FN F(C) = C * 9 / 5 + 32
20 PRINT FN F(100)
```

```
RUN
 212

OK
```

`DEF FN F(C) = …` defines a function called `F` whose argument is called `C`.
`FN F(100)` calls it with 100. The `FN` is part of the call and you can't leave
it out.

## The rules

- **One expression.** No loops, no `IF`, no multiple lines. If you need those,
  use a [subroutine](/basic/subroutines).
- **One argument.**
- **Define it before you use it.** `DEF` lines usually sit at the top of the
  program, and a `FN` called before its `DEF` has run gives you
  `?UNDEF'D STATEMENT ERROR`.
- **The name follows variable rules** — first two characters significant, and no
  keyword hiding inside it. `FN BILL` and `FN BIKE` are both `BI`, so the second
  definition quietly replaces the first. `FN COST` won't define at all, because
  `COS` is a keyword.

## Why bother

Because the formula ends up in one place. This:

```
10 DEF FN R(X) = INT(X * 100 + .5) / 100
```

rounds to two decimal places, and now every price in your program can be
`FN R(P)` instead of that expression written out eight times with a typo in the
sixth one.

Some that earn their keep:

| Definition | What it gives you |
|---|---|
| `DEF FN R(X) = INT(X * 100 + .5) / 100` | round to 2 decimals |
| `DEF FN M(X) = X - INT(X / 7) * 7` | remainder after dividing by 7 |
| `DEF FN D(X) = INT(RND(1) * X) + 1` | a dice roll from 1 to X |
| `DEF FN C(X) = X * 3.14159 * 2` | circumference from a radius |

That third one is the useful one. `FN D(6)` rolls a six-sided die, `FN D(52)`
picks a card, and the awkward `INT(RND(1) * n) + 1` only has to be got right
once.

## The argument is only borrowed

The name inside the parentheses is private to the function. This works fine even
though there's already a `C` in the program:

```
10 C = 999
20 DEF FN F(C) = C * 9 / 5 + 32
30 PRINT FN F(100); C
```

```
RUN
 212 999

OK
```

`C` inside the definition means "whatever gets passed in". `C` outside it is
still 999.

## A worked example

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

One definition, five uses, and a table you can widen by changing one number in
line 30.

Next: [making it look and sound like something](/basic/sound-and-video).
