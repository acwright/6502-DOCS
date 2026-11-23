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
happening and drops to 0 while that direction or button is held. The include
doesn't name the bits, so the names below are the ones the program further down
gives them itself.

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

## Once a frame, and twice to be sure

Read a stick at most once a frame: after `WaitVBlank`, or on a timer tick.
Never read one back to back. Every `ReadJoystick1` or `ReadJoystick2` takes
both ports away from the keyboard controllers for about a quarter of a
millisecond, and while a controller has let go it can neither scan the keyboard
nor hand a key over. A loop that calls `ReadJoystick1` as fast as it can leaves
the keyboard dead.

Once a frame also needs a debounce. A switch bounces for a moment as it closes
and opens, and a reading taken in that moment is wrong, so a game that acts on
every change takes one push as two. Act on a press or a release only when two
reads in a row agree:

```asm
  jsr WaitVBlank                ; once a frame
  jsr ReadJoystick1
  cmp LastRead                  ; the same as last frame?
  sta LastRead                  ;   (sta leaves the flags alone)
  bne @Bouncing                 ; no: wait a frame and look again
  sta Stick                     ; two frames agree, so this is the stick
@Bouncing:
```

Test `Stick`, not `LastRead`, for the rest of the frame. A press then takes
effect one frame later than it would without the check.

## Three ways to read the controls

The sticks, the board's keyboard and a PS/2 keyboard all share the same sixteen
lines, so a program chooses how to share them.

**Sticks only.** A game that never needs the keyboard can call `KBDisable` once
and keep the ports. From then on it reads `GPIO_PORTB` (joystick 1) and
`GPIO_PORTA` (joystick 2) directly, once a frame, with no settling delay per
read:

```asm
  jsr KBDisable                 ; once: the ports are the game's now
Frame:
  jsr WaitVBlank
  lda GPIO_PORTB                ; stick 1, as it stands
  sta Stick1
  lda GPIO_PORTA                ; stick 2
  sta Stick2
  ; ... debounce, move, draw ...
  bra Frame
```

Don't use `ReadJoystick1` or `ReadJoystick2` here: each gives the ports back to
the controllers on its way out. Nothing is typed while the ports are the
game's, <kbd>Esc</kbd> included, so give the player a way out on the stick, and
call `KBEnable` before going back to BASIC.

**The keyboard only, as switches.** A game that wants to know which keys are
down, rather than which were typed, calls `KBDisable` and scans the board's
grid itself, as [Reading the matrix yourself](#reading-the-matrix-yourself)
shows. That works for the board's own 67 keys and not for a PS/2 keyboard,
which has its own controller and no grid on these lines.

**Both, through the controllers.** Keys through `Chrin` and the sticks through
`ReadJoystick1` and `ReadJoystick2`, once a frame. That is how BASIC reads
`INKEY` and `JOY`, and how a game such as
[Wizards Lab](https://github.com/acwright/WIZARDSLAB) plays. It is the easiest
of the three, and it comes with the rules in the next section.

## Keys typed while a stick is held

A controller sends a key by pulling the code's 0 bits low on its port and
leaving the 1 bits high. A held stick holds its lines low, so while it is held
a key whose code needs one of those lines high can't be sent. The controller
keeps the key and sends it when the stick lets go, and keys typed after it
wait behind it, so they arrive in the order they were typed. **A key typed
while a stick is held arrives late, never wrong.**

Joystick 1 shares port B with the board's own keyboard, and joystick 2 shares
port A with a PS/2 keyboard, so each stick holds back the keys of the keyboard
on its own port. Which keys wait depends on which line is held:

| Held | Bit | Keys that wait |
|---|---|---|
| Right | 7 | None: no key code sets bit 7 |
| Left | 6 | Every letter, and `` ` `` `[` `\` `]` and Delete |
| Down | 5 | Space, the digits, most punctuation, and Delete |
| Up | 4 | The digits, `P` to `Z`, the four cursor keys, Esc and Insert |
| Y, X, B or A | 3 to 0 | About half the keys each |

Two more effects come from the board's keyboard being wired to the same lines.

**A held stick hides part of the grid.** Joystick 1's lines are the grid's
columns and joystick 2's are its rows, and every key in a column or row a stick
holds low reads as pressed. The controller ignores those keys while the stick is
held. A key there that is still down when the stick lets go is typed; one
pressed and released while the stick was held is lost. Joystick 1's four
directions sit on columns 4 to 7:

| Joystick 1 held | Keys the controller can't see |
|---|---|
| Up | `4` `=` `T` `\` `H` Shift `,` Fn |
| Down | `5` Backspace `Y` Insert `J` `Z` `.` Left |
| Left | `6` Esc `U` Caps Lock `K` `X` `/` Down |
| Right | `7` Tab `I` `A` `L` `C` Up Right |

**Two held keys can hold back a third.** Two keys held down in the same row join
their columns through their switches. `:` is Shift and `;`, both in row 5. The
code for `:` pulls column 0 low, and `;` is in column 0, so through the two held
switches Shift's column, column 4, goes low as well, where the code needs it
high. So `:` waits, and arrives when one of the two keys is released.

A joystick with electronics in it, such as an autofire circuit or an adapter,
can pull the lines about in ways a switch never does, and with one plugged in
a key can arrive late or wrong. Plain switch joysticks are what the ACE is built
for.

## Polling for keys instead of taking the interrupt

The Kernal takes each key on the keyboard interrupt, within a tenth of a
millisecond of the controller announcing it. A program that turns that off and
polls the VIA's interrupt flag instead must read each key within 20 ms. Each key
code stays on its port for 20 ms, about one frame, and then the port
reads idle again, and the VIA does not keep a copy. Poll at least once a frame,
or keys go missing. The same 20 ms is why a controller sends at
most about fifty keys a second.

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
