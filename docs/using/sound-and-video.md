# Sound & video basics

## Sound — `SOUND` and `VOL`

<<< @/../samples/basic/sound-demo.bas{basic}

`VOL n` sets overall volume, `0`–`15`. `SOUND voice, freq, dur` plays one
note: `voice` is `1`–`3` (three independent SID voices), `freq` is in Hz,
`dur` is in centiseconds (hundredths of a second) — `SOUND 1, 440, 5` plays a
concert-A for 50 ms on voice 1. The statement blocks for the duration, then
silences the voice.

RUN-verified, and the interesting part is what happens with **no sound card
fitted at all**: this sample runs on the default headless machine, which has
no SID — and it reaches `PASS` anyway. `BasCmdSound`/`BasCmdVol` don't guard
on `HW_SID` the way storage commands guard on `HW_CF` (`BASIC.asm:8296`,
comment: "a game that beeps on a hit keeps playing on a machine with no
sound"). Silence, not an error — the same graceful-degradation shape as
video, described next.

## Video — `CLS`, `LOCATE`, `COLOR`

<<< @/../samples/basic/screen-text.bas{basic}

`CLS` clears the 40×24 text screen. `LOCATE row, col` moves the cursor.
`COLOR fg, bg` sets foreground/background from a 16-colour palette. RUN and
INSPECT-verified together — this sample runs on `console video` (a machine
with a video card fitted) and its `.expect` asserts the actual screen buffer
via `dbg screen text`, not just the console stream:

```
screen ^\s+SCREEN OK\s*$
```

The same statements behave differently with **no video card**: their
arguments are still parsed and consumed (so a program that uses them doesn't
get a syntax error), but they silently do nothing, exactly like `SOUND`/`VOL`
with no SID. A text-mode game that calls `CLS`/`LOCATE`/`COLOR` throughout
still runs correctly on a headless serial-only machine — it just doesn't draw
anything, because there's nowhere to draw it.

## The screen itself

40 columns by 24 rows, 16 colours, backed by the same Pico9918/TMS9918A
family covered in [Setting up](/getting-started/setup). The character set is
CP437, held in ROM at `$B800`–`$BFFF` (`data/memory-map.json`) — the full
character map and its rendering is [Phase 7](https://github.com/acwright/6502-DOCS/blob/main/PLAN.md#phase-7--quick-reference-cards)'s
`character-map.html` card.

<PlaceholderImage
  label="Text-mode screen"
  caption="A CLS/LOCATE/COLOR session captured with dbg screen png, once scripts/capture-screens.mjs exists (Phase 8). The screen content above is already RUN + INSPECT-verified; only the screenshot is pending."
/>
