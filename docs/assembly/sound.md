# Sound

The sound chip is an **ARMSID**, a drop-in replacement for the MOS 6581 that
the Commodore 64 made famous. Three voices, each with its own oscillator,
waveform and envelope, plus filters they all share.

There are two ways to use it: five Kernal calls that handle the common case, or
the 29 registers underneath when you want more.

## The easy way

| | |
|---|---|
| `InitSID` | Set the chip up from cold — the Kernal has already done this |
| `SidSetVolume` | Master volume in A, 0 to 15 |
| `SidPlayNote` | Voice in A (0–2), frequency low byte in X, high in Y |
| `SidSilence` | Gate every voice off |
| `Beep` | The one the machine makes at power-on |

`SidPlayNote` starts a note and returns immediately. It does not wait, which is
the point: the note goes on sounding while your program does something else.
`SysDelay` is how you hold it, and `SidSilence` is how you stop it.

What you get is a triangle wave with one fixed envelope — no attack, a quick
decay, and a short release. It is a clean, slightly flutey note, and it is the
right thing for game noises and for anything where you would rather write the
tune than the synthesizer. When you want a different sound, the registers are
[further down this page](#the-registers-underneath).

## Frequency

The chip counts in steps of about one-sixteenth of a hertz, so the number it
wants is not the number you want. The conversion is:

```
register value = hertz × 16.75
```

which is exactly what `SOUND` does in BASIC, and which the assembler can do for
you at build time so the machine never divides anything:

```asm
.define NOTE(hz) (hz * 67 / 4)

  lda #0                        ; voice 0
  ldx #<NOTE(440)               ; concert A
  ldy #>NOTE(440)
  jsr SidPlayNote
```

A short table of the useful ones:

| Note | Hz | | Note | Hz |
|---|---|---|---|---|
| C  | 262 | | G  | 392 |
| D  | 294 | | A  | 440 |
| E  | 330 | | B  | 494 |
| F  | 349 | | C′ | 523 |

Double the frequency to go up an octave, halve it to go down.

## A tune

<<< @/../samples/assembly/fanfare.asm{asm}

```
RUN
A LITTLE FANFARE
C E G C G C

OK
```

Three parallel tables — low bytes, high bytes, lengths — indexed by one
counter, is the shape almost every tune player has. Adding a fourth table of
voice numbers is how you get chords.

::: tip Why the frequencies are split into two tables
`SidPlayNote` wants the low byte in X and the high byte in Y, and the index has
to live somewhere while both are being loaded. Splitting the table means one
`ldx Index` covers both fetches; keeping it as words would mean doubling the
index every time through.
:::

## The registers underneath

`$9800` upwards, and worth knowing when the envelope matters.

| Per voice | What it does |
|---|---|
| `SID_Vn_FREQ_LO` / `_HI` | The frequency, as above |
| `SID_Vn_PW_LO` / `_HI` | Pulse width, for the pulse waveform only |
| `SID_Vn_CTRL` | Waveform and gate — see below |
| `SID_Vn_AD` | Attack in the high nibble, decay in the low |
| `SID_Vn_SR` | Sustain in the high nibble, release in the low |

The control register is where the character comes from:

| Bit | |
|---|---|
| 7 | Noise |
| 6 | Pulse |
| 5 | Sawtooth |
| 4 | Triangle |
| 3 | Test — resets the oscillator |
| 2 | Ring modulation with the voice below |
| 1 | Sync with the voice below |
| 0 | **Gate** — the note starts when this goes high and releases when it goes low |

So a plucked sawtooth on voice 1 is:

```asm
  lda #$00                      ; attack 0, decay 0 — instant
  sta SID_V1_AD
  lda #$F8                      ; sustain 15, release 8 — rings out
  sta SID_V1_SR
  lda #<NOTE(330)
  sta SID_V1_FREQ_LO
  lda #>NOTE(330)
  sta SID_V1_FREQ_HI
  lda #%00100001                ; sawtooth, gate on
  sta SID_V1_CTRL
```

and letting go is `lda #%00100000` — the same byte with the gate bit cleared.
The release phase then plays out on its own, which is why `SidSilence` clears
gates rather than frequencies: zeroing an oscillator mid-note freezes the
waveform at whatever level it had reached and you hear a thump.

`SID_MODE_VOL` at `$9818` holds the master volume in its low nibble; the high
nibble selects the filters, which is a rabbit hole with a
[good map](http://www.waitingforfriday.com/?p=661) already drawn.

::: details What ARMSID does and does not reproduce
It is a microcontroller with a DAC, and it emulates both the 6581 and the later
8580. Waveforms, envelopes and ring modulation come out right. The filters are
the part where any 6581 is unpredictable — the real chips varied
chip-to-chip — so a filter sweep that sounded a particular way on one
Commodore 64 will not sound identical here, or on another Commodore 64.
:::

::: warning Nothing complains if there is no sound chip
The sound routines check `HW_PRESENT` and quietly do nothing when there is no
card fitted. A game that beeps on a hit keeps playing on a machine with no
sound. That is deliberate — but it does mean silence is not evidence of a bug
in your note table.
:::

Next: [the keyboard and the sticks](/assembly/input).
