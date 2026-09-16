<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const slots = facts.kernal.slots.filter((s) => s.name.startsWith('Nv'))
if (slots.length !== 6) throw new Error(`assembly/clock.md: expected six save-slot entries, found ${slots.length}`)
</script>

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
up with. Do not trust byte 0 to be 0. If you use the raw bytes, keep a
signature of your own alongside your data and treat everything as unset until
you read it back. The save slots below do that job for you, with a checksum.
:::

The same 256 bytes are what BASIC's `NVRAM` reaches, so a program in each
language can leave notes for the other.

## Save slots

Two programs that both use byte 0 will ruin each other's high score. So the
Kernal also divides the 256 bytes into **16 save slots** of 16 bytes each, and
every program that uses them shares the card safely.

| Byte | Holds |
|---|---|
| 0 | The owner ID: one byte your program picks. `$00` means the slot is free |
| 1 | A checksum the Kernal works out |
| 2–15 | 14 bytes that are yours |

Slot *n* starts at byte *n* × 16. The checksum covers the owner ID and the 14
bytes: start at `$A6`, then for each byte rotate left one bit and exclusive-OR
the byte in. A slot is **free**, **valid** (the checksum agrees) or
**damaged** (it does not). Each slot is checked on its own, so one damaged slot
never costs you the others.

<table>
  <thead><tr><th>Entry</th><th>In</th><th>Out</th></tr></thead>
  <tbody>
    <tr v-for="s in slots" :key="s.name">
      <td><code>{{ s.name }}</code></td>
      <td><div v-for="line in (s.input || ['nothing'])" :key="line">{{ line }}</div></td>
      <td><div v-for="line in s.output" :key="line">{{ line }}</div></td>
    </tr>
  </tbody>
</table>

<<< @/../samples/assembly/save-slots.asm{asm}

```
RUN
NO SAVE YET - USING FREE SLOT 0
LOADED LEVEL 3, SCORE 1250, ADA
SLOT 0 IS DAMAGED - OWNER 90

OK
```

<Emulator
  sample="assembly/save-slots"
  caption="This clock card forgets when you leave the page. Run it twice and the second run finds its own save, damaged by the first."
/>

The rules are the same for all six:

- **Carry set means nothing happened.** No clock card, a slot number of 16 or
  more, `NvWrite` with `NV_ID` at 0 (use `NvErase` for that), `NvFind` with no
  match, or `NvRead` on a slot that is not valid.
- **A failed `NvRead` still answers.** A holds the slot's status and Y its owner
  ID, so a game can tell "no save yet" from "your save is damaged". Your buffer
  is left alone.
- **`NvFind` matches damaged slots too**, lowest slot first. A game that finds
  its ID and then gets carry from `NvRead` knows its save was damaged, rather
  than starting over as if it never had one.
- **`NV_ID` is an input to `NvWrite` and nothing else.** Nothing writes it back;
  `NvStat` and `NvRead` give you the owner in Y.
- **X survives** `NvStat`, `NvRead`, `NvWrite` and `NvErase`, so a loop over the
  slots needs no reload. `NvFind` and `NvFormat` change it.
- **`NvRead` and `NvWrite` use `STR_PTR`** (`$02`–`$03`), just as `PrintStr`
  does.
- **Decimal mode and the interrupt flag come back as you left them.** A score
  kept in decimal mode saves safely. Interrupts are held off for the moment a
  copy takes, because the copy streams bytes through the chip and nothing else
  may touch it in between. For the same reason an NMI handler must never
  touch the clock card's memory.

::: warning Check the version first
On a ROM older than v1.6 these six addresses are reserved slots: a bare `RTS`
that leaves carry however you had it, which can look like success. Ask
`KernalVersion` for 1.6 or later before trusting an answer, as the listing does.
See [which ROM am I on?](/assembly/detection#which-rom-am-i-on)
:::

::: tip No clock card, no slots
The slots live on the clock card, so a machine without one, a KIM for example,
gets carry set from every one of the six. `NvFormat` empties all 16 at once.
:::

BASIC can read and write the same slots, so a save manager written in BASIC can
list your game's saves. See [save slots from BASIC](/basic/clock#save-slots).

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
