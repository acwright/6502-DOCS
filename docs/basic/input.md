# Asking questions

`INPUT` stops the program, waits for someone to type something, and puts what
they typed into a variable.

## The shape of it

```
10 INPUT "HOW OLD ARE YOU"; A
20 PRINT "IN DOG YEARS:"; A * 7
```

```
RUN
HOW OLD ARE YOU? 9
IN DOG YEARS: 63

OK
```

BASIC prints your prompt, adds a `? ` of its own, and waits. Whatever gets typed
lands in `A` when <kbd>Enter</kbd> is pressed.

The prompt is optional — `INPUT A` on its own just prints `?` — but a program
that asks a bare question mark is a program nobody can use.

## Text answers need a `$`

```
10 INPUT "WHAT IS YOUR NAME"; N$
20 PRINT "HELLO, "; N$
```

Ask for `N$` and you get text. Ask for `A` and you get a number, and BASIC will
insist on one.

## Asking for several things at once

Put more than one variable after `INPUT` and the person can answer with commas:

```
10 INPUT A$, B$
20 PRINT A$; "/"; B$
```

```
RUN
? ONE,TWO
ONE/TWO

OK
```

Nice when you're the one typing. Unkind to anyone else. Two separate `INPUT`s
with two clear prompts is almost always the better program.

## When the answer is wrong

Two messages come from `INPUT`, and neither is an error that stops the program:

**`?REDO FROM START`** — you asked for a number and got something that isn't
one. BASIC throws the whole answer away and asks again:

```
RUN
? HELLO
?REDO FROM START
? 5

OK
```

**`?EXTRA IGNORED`** — you asked for one thing and got several. BASIC keeps the
first and drops the rest:

```
RUN
? 5,6
?EXTRA IGNORED
 5

OK
```

Both are BASIC being forgiving. Neither needs handling in your program.

## It only works inside a program

Type `INPUT A` straight at the `OK` prompt and you get:

```
?ILLEGAL DIRECT ERROR
```

`INPUT` needs a program to come back to, so it refuses to run in immediate mode.
The same goes for `GET`-style reading of single keys —
[`INKEY`](/basic/controls) is the one to reach for when you want a keypress
rather than a line.

## A worked example

<<< @/../samples/basic/name-quiz.bas{basic}

```
RUN
WHAT IS YOUR NAME? ADA
HOW OLD ARE YOU? 30

HELLO ADA, IN TEN YEARS
YOU WILL BE 40

OK
```

The `;` on the end of lines 10 and 30 is what keeps the `?` on the same line as
the question. Take it off and see what happens — that's the fastest way to
understand what it does.

## Try this

Add a line 45 that refuses to believe anyone is over 150, using `IF` — which is
[the next chapter](/basic/decisions).
