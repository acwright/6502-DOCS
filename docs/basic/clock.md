# Time and memory that lasts

There's a clock chip in your ACE with a battery on it. It knows the date while
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

A high score in three lines, with no card in the machine at all.

::: tip Scores over 255
One byte holds 0 to 255. For a bigger number use two bytes and put them back
together: `NVRAM 0, S - INT(S / 256) * 256` for the low half and
`NVRAM 1, INT(S / 256)` for the high half, then `NVRAM(0) + NVRAM(1) * 256` to
read it. That gets you to 65535.
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
