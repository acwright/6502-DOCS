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

::: warning Keys are deaf while the ports are released
Between `KBDisable` and `KBEnable` the keyboards cannot report anything. The
window is short — a few hundred microseconds — but do not put anything slow
inside it, and do not leave the encoders disabled while you draw a frame.
:::

## Reading the keyboard as a keyboard

There is no key-down/key-up interface: the encoders hand over finished ASCII
characters, not scan codes. That means you cannot ask "is the space bar held
right now", which is occasionally what a game wants.

The usual answer is a joystick — that is what they are for. The other is to
read the most recent key and let it decay:

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

Next: [files on the memory card](/assembly/storage).
