# The keyboard matrix

The ACE's 67 keys are wired as an 8 × 8 grid. A microcontroller on the board —
an ATmega1284P running the **AB Controller** firmware — drives one row at a
time on `PA0`–`PA7`, reads the columns back on `PB0`–`PB7`, and hands the CPU
the ASCII code for whatever it found.

You never need this to *use* the machine. You need it if you are building a
keyboard for an enclosed ACE, chasing a key that has stopped working, or
writing code that reads the ports directly.

Row down the left, column across the top. The small code under each key is what
the controller sends when you press it.

| | `PB0` | `PB1` | `PB2` | `PB3` | `PB4` | `PB5` | `PB6` | `PB7` |
|---|---|---|---|---|---|---|---|---|
| **`PA0`** | `` ` ``<br/>`$60` | `1`<br/>`$31` | `2`<br/>`$32` | `3`<br/>`$33` | `4`<br/>`$34` | `5`<br/>`$35` | `6`<br/>`$36` | `7`<br/>`$37` |
| **`PA1`** | `8`<br/>`$38` | `9`<br/>`$39` | `0`<br/>`$30` | `-`<br/>`$2D` | `=`<br/>`$3D` | Bksp<br/>`$08` | Esc<br/>`$1B` | Tab<br/>`$09` |
| **`PA2`** | `Q`<br/>`$51` | `W`<br/>`$57` | `E`<br/>`$45` | `R`<br/>`$52` | `T`<br/>`$54` | `Y`<br/>`$59` | `U`<br/>`$55` | `I`<br/>`$49` |
| **`PA3`** | `O`<br/>`$4F` | `P`<br/>`$50` | `[`<br/>`$5B` | `]`<br/>`$5D` | Backslash<br/>`$5C` | Ins<br/>`$1A` | Caps<br/>*none* | `A`<br/>`$41` |
| **`PA4`** | `S`<br/>`$53` | `D`<br/>`$44` | `F`<br/>`$46` | `G`<br/>`$47` | `H`<br/>`$48` | `J`<br/>`$4A` | `K`<br/>`$4B` | `L`<br/>`$4C` |
| **`PA5`** | `;`<br/>`$3B` | `'`<br/>`$27` | Enter<br/>`$0D` | Del<br/>`$7F` | Shift<br/>*modifier* | `Z`<br/>`$5A` | `X`<br/>`$58` | `C`<br/>`$43` |
| **`PA6`** | `V`<br/>`$56` | `B`<br/>`$42` | `N`<br/>`$4E` | `M`<br/>`$4D` | `,`<br/>`$2C` | `.`<br/>`$2E` | `/`<br/>`$2F` | Up<br/>`$1E` |
| **`PA7`** | Ctrl<br/>*modifier* | Menu<br/>*none* | Alt<br/>*none* | Space<br/>`$20` | Fn<br/>*none* | Left<br/>`$1C` | Down<br/>`$1F` | Right<br/>`$1D` |

## What the controller does with a press

**Letters are always capitals.** Shift changes the symbols and the number row
and nothing else. There is no lower case at the machine — it exists over the
serial line, and only there.

**Four keys are dead.** Caps Lock, Menu, Alt and Fn are read and dropped: no
character, no state. Caps Lock in particular is not a lock, because there is
nothing for it to switch.

**Ctrl sends a control code.** <kbd>Ctrl</kbd>+<kbd>A</kbd> through
<kbd>Ctrl</kbd>+<kbd>Z</kbd> send 1 to 26, so <kbd>Ctrl</kbd>+<kbd>C</kbd> is
`$03` — the break — and <kbd>Ctrl</kbd>+<kbd>H</kbd> is `$08`, the same as
backspace. <kbd>Ctrl</kbd>+<kbd>[</kbd> sends `$1B`, which is
<kbd>Esc</kbd>.

**The arrow keys send `$1C` to `$1F`.** Nothing in BASIC listens for them.
They are there for programs you write.

## The header

The grid comes out of the board on a 1 × 16 pin header at 2 mm pitch: pins 1–8
are `PA0`–`PA7`, pins 9–16 are `PB0`–`PB7`. On a stock ACE the board's own 67
switches are soldered across it.

Anyone putting the board in a case leaves those switches unfitted and wires
their own 8 × 8 grid here instead. Same rows, same columns, same codes — the
firmware does not know the difference.

## Why reading a joystick is fiddly

Those two ports are the same sixteen VIA lines the joysticks use. The
controller is scanning them ten times a second, so a program that reads the
port directly will catch the scan mid-sweep and get nonsense.

That is why the Kernal's joystick routines disable the encoder, wait for it to
let go of the lines, read, and enable it again — and why doing it by hand needs
the same `KBDisable` → read → `KBEnable` dance, with about 200 µs of settling
in the middle. [The keyboard and the sticks](/assembly/input) has the code.

<div class="card-link">

📄 **[Keyboard Matrix card](/cards/keyboard-matrix.html)** — the grid on one
printable page. See also the
**[Keyboard Layout card](/cards/keyboard-layout.html)** for the physical
arrangement.

</div>
