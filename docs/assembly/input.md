# The keyboard and the sticks

Both plug into the same card — a VIA at `$9400` with a microcontroller on each
of its two ports. Port B carries the board's own keyboard and joystick 1; port A
carries a PS/2 keyboard and joystick 2.

## Keys

You have already met the input side: keys arrive as interrupts, land in the
ring buffer at `$0200`, and come out through
[`Chrin` and `BufferSize`](/assembly/console). Nothing else is needed for
typing.

Both keyboards work at once, and so does the serial port. All three feed the
same buffer, and your program cannot tell which one a character came from —
which is exactly what you want.

`InitKB` sets the ports up and enables the two interrupts. The Kernal has
already called it by the time your program runs.

## Sticks

```asm
  jsr ReadJoystick1             ; A = the state of stick 1
  jsr ReadJoystick2             ; A = the state of stick 2
```

One byte each, and **every bit is upside down**: a bit reads 1 while nothing is
happening and drops to 0 while that direction or button is held.

| Bit | Mask | |
|---|---|---|
| 7 | `JOY_R` | Right |
| 6 | `JOY_L` | Left |
| 5 | `JOY_D` | Down |
| 4 | `JOY_U` | Up |
| 3 | `JOY_Y` | Button Y |
| 2 | `JOY_X` | Button X |
| 1 | `JOY_B` | Button B |
| 0 | `JOY_A` | Button A |

So the test for "up is held" is that the bit came back **zero**:

```asm
  jsr ReadJoystick1
  and #JOY_U
  beq MovingUp                  ; zero means held
```

Get this backwards and your game runs in every direction at once until someone
touches the stick, which is at least an easy bug to recognize.

::: tip Diagonals are free
Two bits can be low at the same time, so testing them one at a time gets you
diagonals with no extra work. Test the pairs, not a switch statement.
:::

<Diagram
  name="joystick-bits"
  caption="Held reads 0. So AND with the mask followed by BEQ is the player pushing up, and BNE is the bug."
/>

## A program that reads both

<<< @/../samples/assembly/stick.asm{asm}

```
RUN
HOLD A STICK, THEN PRESS ENTER

STICK 1: NOTHING
STICK 2: NOTHING

OK
```

<Emulator
  sample="assembly/stick"
  caption="With no stick plugged in, both ports read NOTHING — which is the answer, not a failure."
/>

Hold a direction while you press Enter and it names it. Two things about the
structure are worth stealing: a mask table beside a table of names turns eight
`if`s into a loop, and the `Anything` counter is how you know to print
"nothing" without testing the byte twice.

## What reading a stick actually does

The two ports are normally being driven by the keyboard controllers. To read a
joystick they have to let go first, which is what these two do:

| | |
|---|---|
| `KBDisable` | Tell both encoders to release the ports, then wait for them to |
| `KBEnable` | Give the ports back |

`ReadJoystick1` and `ReadJoystick2` each do the whole dance — disable, read the
port, enable — which is why calling both costs two settling delays.

If you are polling both sticks every frame, do it in one window instead:

```asm
  jsr KBDisable                 ; one settle, not two
  lda GPIO_PORTB                ; stick 1, raw
  sta Stick1
  lda GPIO_PORTA                ; stick 2, raw
  sta Stick2
  jsr KBEnable
```

That is a genuine saving in a game loop, and it is safe: while the encoders are
released the ports are static, and nothing in the Kernal's interrupt handler
touches them.

::: warning Nothing arrives while the ports are released
Between `KBDisable` and `KBEnable` the controller cannot hand a character over.
A PS/2 keystroke is only delayed — it queues in the controller and lands when
you give the port back — but the board's own keys are not being scanned at all.
The window is short, a few hundred microseconds, and it should stay that way:
do not put anything slow inside it, and do not leave the encoders disabled
while you draw a frame.
:::

## Is that key held down?

Nothing above can tell you. The encoders hand over finished ASCII characters,
not scan codes, so `Chrin` says a key was *typed* and never says it is still
down — which is occasionally exactly what a game wants to know.

The cheap answer is to read the most recent key and let it decay:

```asm
  jsr Chrin
  bcc @NoKey                    ; nothing new, keep the old one
  sta LastKey
  lda #DECAY                    ; how long a key counts as "held"
  sta KeyTimer
@NoKey:
  lda KeyTimer
  beq @Idle
  dec KeyTimer                  ; still counts as held
```

The better answer for a game is a joystick — that is what they are for.

## Reading the matrix yourself

The real answer, when you want the keys themselves, is that the keyboard is an
8 × 8 grid hanging off the same sixteen lines, and `KBDisable` hands it to you
along with the joystick ports. Drive one row low on port A, read the columns
back on port B, and a `0` bit is a key held at that intersection:

```asm
  jsr KBDisable                 ; both encoders let go of the ports
  stz GPIO_PORTA                ; the level first, then the driver — the other
  lda #%10000000                ;   way puts stale bits on the lines
  sta GPIO_DDRA                 ; PA7 an output, the other seven left alone
  ldx #10                       ; let the lines follow, ~50 cycles
@Settle:
  dex
  bne @Settle
  lda GPIO_PORTB                ; the eight columns of row PA7
  stz GPIO_DDRA                 ; rows back to inputs before letting go
  pha
  jsr KBEnable
  pla
  and #%00001000                ; PB3 — the space bar
  beq @SpaceHeld                ; zero means held, same as a joystick
```

Eight passes gets you all 67 keys, and the four the firmware ignores —
<kbd>Caps Lock</kbd>, <kbd>Menu</kbd>, <kbd>Alt</kbd>, <kbd>Fn</kbd> — read like
any other switch. [The keyboard matrix](/reference/keyboard-matrix) says which
row and column each key sits on.

::: warning There are no diodes in the grid
Three keys held in a rectangle report a phantom fourth at the free corner. A
modifier or two alongside a key is fine; chords are not. Sweep the rows and
give the ports back, too: a PS/2 keyboard goes on filling the controller's
buffer while you hold them, and the controller's own scan of the board's keys
is suspended until you do.
:::

Next: [files on the memory card](/assembly/storage).
