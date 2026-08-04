# Sticks and keys

`INPUT` stops and waits for a whole line. A game can't do that. These are the
statements that read the controls without stopping.

## INKEY

`INKEY` gives you the code of a key being held right now, or `0` if none. It
does not wait:

```
10 K = INKEY
20 IF K = 0 THEN 10
30 PRINT "YOU PRESSED "; CHR$(K)
```

Those three lines are the "press any key" pattern, and line 20 is doing all the
waiting. Leave it out and the program blinks past before anyone's touched
anything.

The important part is what it lets you do *instead* of waiting:

```
10 K = INKEY
20 IF K = 65 THEN X = X - 1
30 IF K = 68 THEN X = X + 1
40 REM ... AND THE GAME CARRIES ON EITHER WAY
50 GOTO 10
```

<<< @/../samples/basic/keys.bas{basic}

```
RUN
PRESS FIVE KEYS
 1 YOU PRESSED A (CODE 65)
 2 YOU PRESSED B (CODE 66)
 3 YOU PRESSED C (CODE 67)
 4 YOU PRESSED D (CODE 68)
 5 YOU PRESSED E (CODE 69)
THAT IS FIVE

OK
```

`CHR$(K)` turns the code back into the character. `A` is 65, `Z` is 90, `0` is
48, and space is 32 — or just run the program above and press the key you're
curious about.

## Joysticks

`JOY(1)` and `JOY(2)` read the two joystick ports. Each gives you one number
whose bits are the directions and buttons:

| Bit | Value | |
|---|---|---|
| 7 | 128 | right |
| 6 | 64 | left |
| 5 | 32 | down |
| 4 | 16 | up |
| 3 | 8 | Y |
| 2 | 4 | X |
| 1 | 2 | B |
| 0 | 1 | A |

**The bits are active low.** A stick doing nothing reads `255` — every bit set.
Push it up and the *up* bit goes to zero. So the test is `= 0`:

```
10 J = JOY(1)
20 IF (J AND 16) = 0 THEN Y = Y - 1
30 IF (J AND 32) = 0 THEN Y = Y + 1
40 IF (J AND 64) = 0 THEN X = X - 1
50 IF (J AND 128) = 0 THEN X = X + 1
60 IF (J AND 1) = 0 THEN GOSUB 500
```

Write `IF (J AND 16) THEN` — without the `= 0` — and your program moves upwards
constantly except when the player pushes up. It is the single most common
joystick bug and now you'll recognise it on sight.

Read the whole stick into a variable once per frame, as line 10 does, rather
than calling `JOY(1)` five times. It's faster and it can't change its mind
halfway down the list.

::: tip Both sticks in one go
`J = JOY(1) : K = JOY(2)` on one line, at the top of your game loop. Everything
after that is arithmetic.
:::

<Diagram
  name="joystick-bits"
  caption="One byte, eight controls. Pushing the stick up turns bit 4 off, not on — which is why every test in this chapter ends in = 0."
/>

## PAUSE

`PAUSE n` does nothing for `n` hundredths of a second. It's how you slow a
program down to a speed a person can watch:

```
10 PAUSE 50
```

That's half a second. In a game loop, a `PAUSE 2` or `PAUSE 3` is usually the
difference between a smear and an animation.

## WAIT

`WAIT address, mask` stops the program until reading that address and ANDing it
with the mask gives something non-zero. Nothing else happens while it waits —
not even <kbd>Esc</kbd> — so it's the one statement here that can genuinely
wedge your machine if you point it at a bit that never arrives.

It's a hardware statement, and you want it about once a year. `INKEY` in a loop
is the answer to almost every question that looks like it needs `WAIT`.

Next: [keeping what you made](/basic/files).
