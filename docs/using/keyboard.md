# The keyboard

## Two keyboards, one input path

Every machine with a keyboard controller (ACE, VCS) reads a **PS/2 keyboard
and a matrix keyboard at the same time** — an ATmega1284P merges both into
one stream, so there's nothing to switch and no reason a PS/2 keyboard and a
membrane/mechanical matrix pad can't both be plugged in at once. KIM is the
exception: its Keypad Card is a 24-key pad on a completely different path (a
65C21 PIA, not a keyboard encoder) — see [its system page](/systems/kim).

<PlaceholderImage
  label="Keyboard layout"
  caption="The full key layout, from assets/keyboard/keyboard-layout.svg (KLE source, migrated in Phase 2). Wiring it into a servable page is cards/keyboard-layout.html, Phase 7 — this placeholder stays until that card exists."
/>

## Ctrl+C: breaking a running program

Every BASIC statement checks for two keys while a program runs:
<kbd>Ctrl</kbd>+<kbd>C</kbd> (byte `$03`) and <kbd>Esc</kbd> (byte `$1B`).
Either one stops the program and drops you back to `OK` — this is exactly how
you get your prompt back from the [two-line `GOTO` loop](/getting-started/first-ten-minutes)
in the previous chapter.

RUN-verified: booting to `OK`, typing that loop in, `RUN`ning it, then sending
byte `$03` produces —

```
RUN
HELLO
HELLO
HELLO
  ...
BREAK IN 20
OK
```

`BREAK IN 20` names the line it broke on — line 20 is the `GOTO`, which is
where control was when the check fired (`BasCheckBreak`, `BASIC.asm:6666`).
The break isn't destructive: BASIC saves exactly enough context (`OLDLIN`,
`OLDTEXT`, the statement-boundary stack pointer) that `CONT` can resume the
program from where it left off, the same mechanism `STOP` uses. Typing `NEW`
instead throws it all away, as always.

Note where the check happens: only while a program is actually running.
Typing at the `OK` prompt itself, `BasCheckBreak` skips the check entirely (it
looks at whether a program is currently executing) so Ctrl+C doesn't do
anything unexpected while you're just typing a line in.

## The reset button

A physical reset (`SW70` on ACE, confirmed in the schematics) resets the
keyboard controller, which in turn issues the 65C02's own reset — a cold
start, equivalent to power-cycling. Anything not saved to a CompactFlash card
is gone; there's no warm-reset option that preserves BASIC's program memory.

## Key repeat and troubleshooting

If a key seems to repeat unexpectedly or a keypress seems to be missed
entirely, see [Troubleshooting](/getting-started/troubleshooting) — most
keyboard issues trace back to whether the controller and the PS/2 device
negotiated correctly at power-on, which is visible the same way any other
missing-card condition is.
