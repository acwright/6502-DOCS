# Storage

The CompactFlash card is your disk. Programs you save there are still there
next week; everything in memory disappears the moment the power does.

## Disks on a card

One card holds **256 disks**. Each disk is a megabyte and holds up to **16
files**. You work on one disk at a time, and `DISK n` moves you to another:

```
DISK 1

OK
```

Think of them as 256 floppies in a box, not as folders — there's no nesting,
and a file lives on exactly one of them. Disk 0 is where you start, and one
disk is plenty until you've got more than sixteen things worth keeping.

Filenames are **eight characters, a dot, and three more**: `INVADERS.BAS`,
`SCORE.DAT`, `TITLE.SCR`. Upper case, and always in quotes when you type them.

## Looking at what's there

`DIR` lists the current disk:

```
DIR
DISK 0
HELLO   .TXT 6
GREET   .BAS 13

OK
```

Name, extension, and size in bytes. The gap in the middle is just the name
being padded out to eight characters.

## Saving and loading

`SAVE "name"` writes the program you've got; `LOAD "name"` reads one back.

```
10 PRINT "HI"
SAVE "GREET.BAS"

OK
```

```
NEW
LOAD "GREET.BAS"

OK
LIST
10 PRINT "HI"

OK
```

`NEW` there wasn't ceremony — it proves the point. The program really did come
back off the card.

::: tip Save early
There's no autosave and no undo. If you've been typing for twenty minutes,
`SAVE` it now. `SAVE "WORK.BAS"` over the same name each time is fine.
:::

## Getting rid of a file

`DEL "name"`:

```
DEL "GREET.BAS"

OK
DIR
DISK 0
HELLO   .TXT 6

OK
```

## Formatting

A new card needs formatting before you can save to it, and `FORMAT` also
empties a disk you want to reuse. It clears the **current** disk only — not the
whole card — and it asks first:

```
FORMAT
ERASE DISK 0? (Y/N) Y

OK
```

Anything other than `Y` and nothing happens.

## Saving things that aren't programs

`SAVE` and `LOAD` deal in BASIC programs. To read and write raw memory —
a screen you've drawn, a set of characters you've designed, a saved game —
there's `BSAVE` and `BLOAD`:

- `BSAVE address, length, "name"` writes `length` bytes starting at `address`.
- `BLOAD address, "name"` reads a file back into memory at `address`.

<<< @/../samples/basic/high-score.bas{basic}

```
RUN
HIGH SCORE IS 42

OK
```

Line 10 puts 42 in memory. Line 20 writes that one byte to the card. Line 30
wipes it. Line 40 reads it back, and line 50 proves it survived. That's the
whole shape of a save-game file.

## When there's no card

Every disk command checks for the card first and says so rather than hanging:

```
DIR

?NO DEVICE ERROR
OK
```

Reseat the card, or see [When something's
wrong](/getting-started/troubleshooting).

::: details Making cards on your computer
[`cffs`](https://github.com/acwright/cffs) builds and edits CompactFlash images
from a Mac, PC or Linux box — create a card image, drop files into it, then
write it to a real card or hand it straight to the
[emulator](/using/emulator). It's the easiest way to move a big pile of
programs onto a machine at once.
:::
