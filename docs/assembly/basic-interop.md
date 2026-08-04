# BASIC and machine code together

You do not have to choose. BASIC is a decent way to set things up, ask
questions and print results; machine code is how you do the part that has to be
fast. `SYS` is the door between them.

## Calling machine code from BASIC

`SYS address` jumps to that address as a subroutine. Your code ends with `rts`
and BASIC carries on with the next statement.

Getting values across is `POKE` on the way in and `PEEK` on the way out —
BASIC's variables live in its own storage in a format your program would have
to decode, so the usual answer is a handful of agreed addresses instead.

<<< @/../samples/assembly/from-basic.bas{basic}

```
RUN
30 + 12 = 42

OK
```

Those eleven numbers in the `DATA` lines are this:

```asm
  lda $07F0                     ; AD F0 07
  clc                           ; 18
  adc $07F1                     ; 6D F1 07
  sta $07F2                     ; 8D F2 07
  rts                           ; 60
```

`1536` is `$0600` and `2032` is `$07F0`, so line 20 pokes the routine into the
sector buffer and lines 60 and 70 leave it two numbers just above itself.
Assemble the source, read the bytes out of the listing, and type them in as
`DATA` — which is exactly how machine code got into home computers before
anyone had a cross-assembler.

::: warning `$0600` is on loan
The 512 bytes at `$0600` are the memory card's sector buffer, and any `LOAD`,
`SAVE` or `DIR` overwrites them. For a routine that has to survive a file
operation, put it somewhere BASIC is not using — the top of memory, with
`BAS_MEMSIZ` lowered to match — or load it from a `.prg` as below.
:::

## The other way round: a `.prg`

For anything longer than a few dozen bytes, assemble properly and let `LOAD` do
the work. That is what the twelve-byte stub at the front of every program in
this section is for:

```asm
BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00
```

which is the tokenized form of

```
10 SYS 2060
```

`LOAD "GAME.PRG"` brings the file in at `$0800`, where BASIC keeps programs.
`RUN` runs the one line it finds. `SYS 2060` — that is `$080C` — jumps to the
first byte after the stub. Your code runs; `rts` returns to BASIC.

::: warning Do not edit that BASIC line
`LIST` after loading a `.prg` shows `10 SYS 2060`, and it is very tempting to
tidy it up. Retyping it re-tokenizes the line, which moves everything after it,
and the machine code no longer starts where the `SYS` says it does. Load a
`.prg`, run it, and leave the listing alone.
:::

## Passing more than a couple of numbers

Three approaches, in increasing order of effort:

**Agreed addresses.** `POKE` before, `PEEK` after, as above. Fine for a few
values; anything above `$0800` and below the end of your program is safe from
BASIC's point of view.

**A block.** `BSAVE` and `BLOAD` move any run of memory to and from the card, so
BASIC can prepare a screen, a level or a lookup table and your code can read it
where it lies.

**Reading BASIC's own variables.** Possible — the variable table starts where
the program ends, and `BAS_VARTAB` at `$035F` points at it — and rarely worth
it. Numbers are five bytes in a floating-point format you would have to unpack,
and everything moves the moment a new variable is created.

::: tip A number that will not fit in a `POKE`
`POKE` writes one byte. For anything over 255, split it: `POKE A, N AND 255`
and `POKE A+1, INT(N / 256)`. Your program reads the two back as a low byte and
a high byte, which is how the processor thinks about 16-bit numbers anyway.
:::

## Which parts are worth moving

The honest answer is: fewer than you think, and you can measure it. A `FOR`
loop that draws a whole screen character by character is a good candidate — the
interpreter's overhead per statement dwarfs the work. Arithmetic on a handful
of numbers is not; BASIC's floating point is already machine code.

The usual shape of a mixed program is BASIC for the menu, the setup and the
score, and one `SYS` for the inner loop that has to happen sixty times a
second.

Next: [banked RAM](/assembly/banking).
