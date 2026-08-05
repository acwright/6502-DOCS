# The clock, and memory that lasts

The clock card carries a DS1511Y: a real-time clock with its own battery, and
256 bytes of memory that survive being switched off. The battery is why your
ACE knows the date after two weeks in a closet, and the 256 bytes are the
best place to keep a high score.

## Reading the time

| | |
|---|---|
| `RtcReadTime` | A = hours, X = minutes, Y = seconds |
| `RtcReadDate` | A = day, X = month, Y = year — and the century lands in `RTC_BUF_CENT` |
| `RtcWriteTime` | The same three, going in |
| `RtcWriteDate` | The same, plus `RTC_BUF_CENT` set first |

Every one of those numbers is **ordinary binary**. The chip itself stores
packed decimal, and the Kernal converts in both directions so you never have to
think about it. Hours are 0 to 23; the year is 0 to 99 with the century kept
separately, which is how you get `20` and `26` rather than an argument about
what year `26` means.

## Setting it, reading it, and leaving a note

<<< @/../samples/assembly/clock.asm{asm}

```
RUN
THE TIME IS 09:30:00 ON 26/12/2026
AND THE CLOCK CARD REMEMBERS 30

OK
```

<Emulator
  sample="assembly/clock"
  caption="Whatever the clock card says, at the moment you start it."
/>

`PrintTwo` at the bottom is the routine you will keep: `PrintDecU16` prints 9 as
`9`, and a clock wants `09`. Repeated subtraction is the cheapest way to split a
number under 100 into two digits, and the `pha` around the first `Chrout` is
there because a routine that prints is allowed to use your registers.

::: tip Seconds move while you are reading
The three fields come back from one read, so they are consistent with each
other. But if you read the time, do some work, and read the date, midnight can
happen in between. Read the date first when it matters.
:::

## The 256 bytes

| | |
|---|---|
| `RtcReadNVRAM` | Address in X, byte back in A |
| `RtcWriteNVRAM` | Address in X, byte in A |

Addresses 0 to 255, no structure at all — the card gives you the bytes and what
they mean is up to you. A high score is two bytes. A settings block is a handful.
A "have they seen the tutorial" flag is one bit.

```asm
  ldx #HIGH_SCORE_LOW
  lda ScoreLow
  jsr RtcWriteNVRAM
  ldx #HIGH_SCORE_HIGH
  lda ScoreHigh
  jsr RtcWriteNVRAM
```

::: warning A fresh card holds garbage, not zero
Battery-backed memory that has never been written contains whatever it powered
up with. Do not trust byte 0 to be 0. The usual answer is a two-byte signature
of your own — write something recognizable alongside your data, and treat
everything as unset until you read it back.
:::

The same 256 bytes are what BASIC's `NVRAM` reaches, so a program in each
language can leave notes for the other.

## The registers underneath

`$8800` upwards, one per field, all in packed decimal — `$59` means 59, not 89.
Seconds, minutes, hours, day of week, date, month, year, century, then four
alarm registers and a watchdog.

The alarm is worth knowing about: set it and the card can pull the interrupt
line at a chosen time. Nothing in the Kernal uses it, so the whole thing is
free for you — see [Interrupts](/assembly/interrupts) for how to catch it.

```asm
  lda RTC_SEC                   ; packed decimal, straight from the chip
  and #$0F                      ; the units digit
```

Next: [interrupts](/assembly/interrupts).
