# Time and memory that lasts

There's a clock chip in the ACE with a battery on it. It knows the date while
the machine is unplugged, and it has 256 bytes of memory that survive with it.

## Asking the time

`TIME` and `DATE` are statements, not functions. They print, on their own:

```
DATE
TIME
```

```
2026-08-03
09:30:17

OK
```

## Setting it

```
SETTIME 9, 30, 0
```

Hours, minutes, seconds, on a 24-hour clock.

```
SETDATE 20, 26, 8, 3
```

Century, year, month, day — so 2026 is `20, 26`. It reads oddly the first time
and it's how the clock chip itself thinks about it.

Set it once and it stays set, through power cuts and across months on a shelf.

<<< @/../samples/basic/clock.bas{basic}

## Memory that survives

`NVRAM` is 256 bytes of battery-backed memory, addressed `0` to `255`. It's a
statement to write and a function to read:

```
NVRAM 0, 123
PRINT NVRAM(0)
```

```
 123

OK
```

Switch the ACE off, come back tomorrow, and byte 0 is still 123.

## What it's good for

256 bytes isn't much, and that's the point — it's for the handful of things
that ought to outlive a power cycle without needing the memory card:

- a high score
- which level the player got to
- a difficulty setting
- how many times this thing has been switched on

```
10 P = NVRAM(0)
20 IF S > P THEN NVRAM 0, S : PRINT "NEW RECORD"
30 PRINT "BEST SO FAR:"; NVRAM(0)
```

A high score in three lines, with no card in the machine at all. Once a
second program wants to keep something too, move it into a save slot, below.

::: tip Scores over 255
One byte holds 0 to 255. For a bigger number use two bytes and put them back
together: `NVRAM 0, S - INT(S / 256) * 256` for the low half and
`NVRAM 1, INT(S / 256)` for the high half, then `NVRAM(0) + NVRAM(1) * 256` to
read it. That gets you to 65535.
:::

## Save slots

Byte 0 is a fine place for one program's high score. It is a bad place for two.
So the 256 bytes are also divided into **16 save slots** of 16 bytes each, and
programs that keep to them can share the clock card without trampling each
other. Slot `S` starts at byte `S * 16`:

| Byte | Holds |
|---|---|
| first | Who owns the slot: a number from 1 to 255 that your program picks. 0 means free |
| second | A check number, worked out from the other fifteen |
| the other 14 | Yours |

When the check number doesn't match, the slot is **damaged**: a byte got
changed without the check number being worked out again. Cartridges and
machine-code games use the same slots in the same way, so a BASIC program can
list a game's saves, and a save made from BASIC loads in the game.

### Saving and loading

Five keywords do the work, and they take care of the check number:

| | |
|---|---|
| `NVSAVE slot, id, address` | Save the 14 bytes of memory starting at `address` in `slot` (0 to 15), owned by `id` (1 to 255) |
| `NVLOAD slot, address` | Copy the slot's 14 bytes back into memory at `address`. A free or damaged slot stops with `?LOAD ERROR` and copies nothing |
| `NVERASE slot` | Make the slot free again |
| `NVSTAT(slot)` | 0 if the slot is free, 1 if it holds a good save, 2 if it's damaged |
| `NVFIND(id)` | The lowest slot `id` owns, or `-1` if it has none. `NVFIND(0)` finds the lowest free slot |

The 14 bytes are yours to arrange. Put them somewhere out of BASIC's way with
`POKE` — address 20000 is well clear of a program this size — and save from
there.

<<< @/../samples/basic/best-score.bas{basic}

<Emulator
  sample="basic/best-score"
  caption="Type a score and press Enter. Then type RUN and try to beat it."
/>

```
RUN
BEST SO FAR: 0
YOUR SCORE? 1500
A NEW BEST, IN SLOT 0

OK
RUN
BEST SO FAR: 1500
YOUR SCORE? 900
NOT THIS TIME

OK
```

Game number 42 is this program's `id`, and line 30 asks where its save is. The
first time there isn't one, so line 40 takes the lowest free slot instead. The
score goes into two of the 14 bytes, the high half and the low half, the same
way as [scores over 255](#memory-that-survives) above.

`NVFIND` finds a damaged save as well as a good one, which is what line 50 is
for: a save that `NVLOAD` would refuse is noticed, erased and started again,
rather than stopping the program with an error.

### How the format works

The keywords above don't do anything `NVRAM` can't. This program does all of it
by hand, which is the way to see what's in the 16 bytes:

<<< @/../samples/basic/savemgr.bas{basic}

```
RUN
 16 SLOTS FREE
SAVED SLOT 3 AS ID 42
SLOT 3: ID 42
 15 SLOTS FREE
LOADED SLOT 3, LAST BYTE 169
ERASED SLOT 3
 16 SLOTS FREE

OK
```

The lines from 1000 on are the working parts. To save, set `S`, `I` and
`D(0)` to `D(13)`, then `GOSUB 2000`. To load, set `S` and `GOSUB 3000`, then
look at `T`: 1 means `D()` now holds the save, 0 means the slot is free, and 2
means it is damaged. `GOSUB 4000` erases slot `S`.

The check number is the interesting part. For each byte, line 1510 rotates `C`
one bit to the left: doubling it and taking away 255 when it goes past 255
moves the top bit around to the bottom. Then line 1520 mixes the byte in with
an exclusive OR. BASIC has no `XOR`, so the line builds one: `OR` gives every
bit that is set in either number, `AND` gives the bits set in both, and taking
one from the other leaves the bits set in exactly one.

::: tip No clock card, no slots
The slots live on the clock card. Without one, `NVSAVE`, `NVLOAD` and
`NVERASE` stop with `?NO DEVICE ERROR`, `NVSTAT()` says every slot is free, and
`NVFIND()` says `-1`, nothing found. `NVRAM()` reads 0 for every byte.
:::

## Timing something

There's no stopwatch, but there is a clock. Read the time, do the thing, read
the time again:

```
10 PRINT "READY"
20 TIME
30 FOR I = 1 TO 1000 : NEXT I
40 TIME
```

For anything finer than a second, count loops instead — a `FOR` loop that counts
to a thousand takes about as long today as it did yesterday, because there's no
operating system to get in the way. That reliability is one of the quiet
pleasures of a machine like this.

Next: [reaching past BASIC to the machine
underneath](/basic/machine).
