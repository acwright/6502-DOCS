# BASIC from your editor

Cross-development isn't only for assembly. A BASIC program can live in a text
file on your computer, in version control, edited in a real editor — and land on
the machine as a proper program file.

That matters for one specific reason: **a `.prg` is a binary and a diff can't
read it.** Keep the text, generate the binary, and your program's history stays
readable.

## The loop

```
edit game.txt  →  bastok  →  cffs  →  run
```

Start with a listing in a text file, line numbers and all:

```
10 PRINT "THE SEVEN TIMES TABLE"
20 FOR N = 1 TO 12
30 PRINT N; " X 7 ="; N * 7
40 NEXT N
```

Tokenize it:

```
bastok -o TABLE.PRG TABLE.txt
```

```
bastok: wrote 82 bytes to TABLE.PRG
```

That's the same form BASIC's own `SAVE` writes: keywords replaced by one-byte
tokens, lines chained together. It's smaller than the text, and it's what `LOAD`
expects.

Put it on a card image and run it:

```
cffs create disk.img --size 1M
cffs add disk.img TABLE.PRG
6502 run --headless --cf disk.img
```

```
DIR
DISK 0
TABLE   .PRG 82

LOAD "TABLE.PRG"
RUN
THE SEVEN TIMES TABLE
 1 X 7 = 7
 2 X 7 = 14
 3 X 7 = 21
⋮
 12 X 7 = 84
```

## Going back the other way

`bastok` runs in reverse too, which is what keeps the text and the binary from
drifting apart:

```
bastok -o - TABLE.PRG
```

Point it at a program file and you get the listing back on standard output. So
a program somebody typed at the machine and `SAVE`d can be pulled off the card,
detokenized, and committed as text — and a `.prg` you're not sure about can be
read without loading it into anything.

It works out which direction you meant from the extension: `.txt`, `.asc` and
`.bs` get tokenized, `.prg` and `.bas` get detokenized. `-t` and `-d` decide for
yourself when the name is ambiguous.

## Why not just paste it in?

You can, and for a short program you should — the emulator has a paste button
and a terminal will paste into a real ACE. Typing a listing in as text is
exactly equivalent to typing it by hand.

Tokenizing wins when:

- **The listing is long.** Pasting sends every character and BASIC parses each
  line as it arrives. `LOAD` reads a compact image in one go.
- **You're sending it over a serial cable**, where the difference is seconds
  versus a minute.
- **You want it on a card** with everything else.
- **You want it in git**, which is really the point of this chapter.

## Keeping it diffable

The arrangement that works:

```
listings/          the text — this is what you edit and commit
build/             the .prg files and the card image — .gitignore this
```

and a rule in your `Makefile`:

```make
build/%.PRG: listings/%.txt
	@mkdir -p build
	bastok -o $@ $<
```

Now `make build/TABLE.PRG` rebuilds only what changed, and `git diff` on a
listing shows you the lines you edited rather than "binary files differ".

## Testing BASIC listings too

The suite in [Testing your program](/crossdev/testing) takes `.bas` cases
directly — it types the listing into the machine and asserts on what comes back.
No tokenizing needed for that, since typing is what a person would do anyway.
Test the text, ship the binary.

## Mixing the two

A BASIC program can call machine code with `SYS`, which is how most real
programs on this machine end up shaped: BASIC for the parts where clarity
matters, assembly for the parts where speed does. Both halves fit in this
workflow — the listing in `listings/`, the assembly in `src/`, both built by the
same `make`.

Next: [handing the whole thing to an agent](/crossdev/agents).
