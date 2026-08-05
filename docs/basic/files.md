# Saving your work

Your program lives in memory, and memory forgets when the power goes. The
CompactFlash card in the side of the ACE doesn't.

[Storage](/using/storage) covers the card itself — how it's divided into 256
disks of a megabyte each, and what `DISK` and `FORMAT` do. This chapter is about
using it from a program.

## Save and load

```
SAVE "GAME"
```

```
OK
```

```
NEW
LOAD "GAME"
RUN
```

`SAVE` writes whatever is in memory, `LOAD` reads it back — replacing whatever
was there, so `LOAD` is a `NEW` you didn't ask for. `DIR` lists what's on the
current disk:

```
DIR
DISK 0
HELLO   .TXT 6
GAME    .    24
```

Names are up to eight characters, with an optional three-character extension
after a dot, and the listing pads them out into those columns. The number on the
end is the size in bytes.

`DEL "GAME"` removes one.

## Saving from inside a program

All of these work in a program as well as at the prompt, which means a program
can manage its own files:

<<< @/../samples/basic/file-browser.bas{basic}

```
RUN
FILES ON THIS DISK

DISK 0
HELLO   .TXT 6

TYPE A NAME TO LOAD IT, OR JUST ENTER?
NOTHING LOADED

OK
```

Note what happens if you *do* type a name: `LOAD` replaces the running program
with the loaded one and starts it. That's a menu program in six lines — and it's
also why you can't do anything after the `LOAD`, because there is no "after" any
more.

## Saving data rather than programs

`SAVE` and `LOAD` deal in programs. For raw bytes — a high score, a level, a
screenful of something — use `BSAVE` and `BLOAD`:

| | |
|---|---|
| `BSAVE address, length, "name"` | write `length` bytes starting at `address` |
| `BLOAD address, "name"` | read a file back into memory at `address` |

<<< @/../samples/basic/high-score.bas{basic}

```
RUN
HIGH SCORE IS 42

OK
```

Line 10 puts a value somewhere safe, line 20 writes that one byte to the card,
line 30 wipes it from memory so you can tell the reload really worked, and line
40 brings it back.

Address 2560 is in the free space above where BASIC keeps programs, which makes
it a reasonable scratch address for a small program. For anything bigger, see
[what BASIC does with your memory](/basic/inside) before you pick an address —
writing over your own program is a memorable way to spend an evening.

## Over the serial port instead

`SAVE` and `LOAD` with **no filename** don't touch the card at all — they send
and receive over the serial port using XModem, which is how you get a program on
or off a laptop:

```
SAVE
```

[Serial and a terminal](/using/serial) has the settings and the terminal side of
it.

## Which disk

Files live on the current disk, and `DISK n` changes it:

```
DISK 3
DIR
```

A fresh disk has nothing on it and `DIR` shows nothing. `MEM` reminds you which
one you're on if you've lost track.

::: tip Save early
There's no autosave and no undo. `SAVE "WORK"` every so often while you're
typing something long costs three seconds. Retyping ninety lines costs an
evening.
:::

Next: [the clock, and the memory that survives being switched
off](/basic/clock).
