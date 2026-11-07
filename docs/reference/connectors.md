# Connectors

Every socket, plug and header on the ACE, and what is on each pin — including
the headers where the silkscreen is too crowded to label.

## Round the outside

| What | Connector | Where it goes |
|---|---|---|
| **Power** | 5 V barrel jack | 5 V DC, 2–3 A. Center positive |
| **Video** | VGA | Any monitor that takes VGA. 640 × 480 |
| **Audio L / R** | Two RCA jacks | Powered speakers, or a hi-fi input |
| **Serial** | DB-9 male | A laptop, through a null-modem cable |
| **Joystick A / B** | Two DB-9 male | Atari 2600-compatible sticks |
| **PS/2** | 6-pin mini-DIN | A PS/2 keyboard, working alongside the board's own |
| **CompactFlash** | On the CF adapter board | Your files |
| **Cartridge** | 2 × 20 card edge, standing up behind the keyboard | Cartridges, and the [KIM keypad](/addons/kim) boards |
| **Bus** | 2 × 20 box header | The whole 65C02 bus, for anything you build |

There are small jumper headers as well — `CTS EN` and `DCD EN` for the serial
handshake lines. Those are build-time decisions, not things to plug into. A
Rev 1.0 board also has `PHI2 SELECT`, which must stay on 1 MHz; see
[The ACE](/the-ace#the-dip-switches-and-a-jumper-on-older-boards). A few more
headers are for building the ACE into a case; see
[Headers for a case](#headers-for-a-case).

::: tip `CTS EN` and `DCD EN` default to ground
Ground is how the boards are built, and it means the line is permanently
asserted: the ACIA can always send and always receive, and a three-wire cable
is enough.

Moved to the cable, they do real work. On a real R6551, `CTS` high stops the
transmitter and `DCD` high stops the receiver — and the byte that arrives while
the receiver is stopped is lost, where a byte waiting to go out is held until
the line comes back. A board jumpered to the cable, plugged into something that
does not assert those lines, shows **no banner and no echo at all**. It looks
broken. It isn't; it is waiting.

The [emulator](/using/emulator) has the same two jumpers: in
**Settings → SERIAL**, or `--cts` and `--dcd` on the command line, at ground
unless you move them. Both jumpers behave in the emulator exactly as they do
on the board, which includes producing the same silent machine when one is on
the cable and nothing at the far end asserts the line.
:::

## Joystick — DB-9

Both ports are wired the same way, port A to the VIA's port A and port B to
its port B.

| Pin | Port A | Port B | Direction |
|---|---|---|---|
| 1 | `PA4` | `PB4` | Up |
| 2 | `PA5` | `PB5` | Down |
| 3 | `PA6` | `PB6` | Left |
| 4 | `PA7` | `PB7` | Right |
| 5 | `PA3` | `PB3` | Y |
| 6 | `PA0` | `PB0` | A / fire |
| 7 | `PA1` | `PB1` | B |
| 8 | `GND` | `GND` | Ground |
| 9 | `PA2` | `PB2` | X |

::: warning It reads backwards
A direction being **held** pulls its line to `0`. An untouched stick reads
`255` — every bit high. So the test is

```basic
IF (JOY(1) AND 16) = 0 THEN PRINT "UP"
```

and not `<> 0`. This trips everyone once. [Sticks and keys](/basic/controls)
has the full bit table.
:::

## Serial — DB-9

The ACE is wired as **data terminal equipment**, the same as a PC. Two DTE
ends both transmit on pin 3 and listen on pin 2, which means they talk past
each other — so reaching a laptop needs a **null-modem** cable or adapter, not
a straight-through one.

| Pin | Signal | Direction |
|---|---|---|
| 1 | `DCD` | In — carrier detect |
| 2 | `RXD` | In — the ACE receives here |
| 3 | `TXD` | Out — the ACE transmits here |
| 4 | `DTR` | Out |
| 5 | `GND` | Ground |
| 6 | `DSR` | In |
| 7 | `RTS` | Out |
| 8 | `CTS` | In |
| 9 | — | Not connected |

19200 baud, 8 data bits, no parity, one stop bit.
[Serial and a terminal](/using/serial) covers what to do once it is plugged in.

## PS/2 — 6-pin mini-DIN

| Pin | Signal |
|---|---|
| 1 | `PS2DATA` |
| 2 | Not connected |
| 3 | `GND` |
| 4 | `VCC` |
| 5 | `PS2CLK` |
| 6 | Not connected |

A keyboard here works *alongside* the board's own keys rather than instead of
them — both end up in the same buffer, and you can type on either without
switching anything.

## The bus, and the cartridge edge

The bus header and the cartridge card edge carry exactly the same forty
signals in the same order: the whole 65C02 bus, brought out twice. Odd pins
down one side, even pins down the other.

| Pin | Signal | Pin | Signal |
|---|---|---|---|
| 1 | `GND` | 2 | `VCC` |
| 3 | `RESB` | 4 | `HRDB` (`EXP1`) |
| 5 | `IRQB` | 6 | `HRDB` (`EXP0`) |
| 7 | `NMIB` | 8 | `A15` |
| 9 | `RDY` | 10 | `A14` |
| 11 | `BE` | 12 | `A13` |
| 13 | `RWB` | 14 | `A12` |
| 15 | `SYNC` | 16 | `A11` |
| 17 | `PHI2` | 18 | `A10` |
| 19 | `EXP3` | 20 | `A9` |
| 21 | `EXP2` | 22 | `A8` |
| 23 | `D7` | 24 | `A7` |
| 25 | `D6` | 26 | `A6` |
| 27 | `D5` | 28 | `A5` |
| 29 | `D4` | 30 | `A4` |
| 31 | `D3` | 32 | `A3` |
| 33 | `D2` | 34 | `A2` |
| 35 | `D1` | 36 | `A1` |
| 37 | `D0` | 38 | `A0` |
| 39 | `VCC` | 40 | `GND` |

::: tip Two of the four extra pins are spoken for
The family bus has four extra pins for a builder's own use: pin 4 is `EXP1`,
pin 6 is `EXP0`, pin 19 is `EXP3` and pin 21 is `EXP2`. On the ACE, pins 4 and
6 are both joined to `HRDB`, High ROM disable bar. A cartridge grounds them,
which takes `$C000–$FFFF` from the ROM so that the cartridge answers there. So
a card built for a [COB](/family/cob) that uses `EXP0` or `EXP1` for its own
purpose will not behave here. `EXP2` and `EXP3` are free.
:::

## GPIO — port A and port B

Two 2 × 6 box headers bring the 65C22 VIA's ports out, ten signals each.

| Pin | Signal | Pin | Signal |
|---|---|---|---|
| 1 | `VCC` | 2 | `GND` |
| 3 | `PA7` | 4 | `PA0` |
| 5 | `PA6` | 6 | `PA1` |
| 7 | `PA5` | 8 | `PA2` |
| 9 | `PA4` | 10 | `PA3` |
| 11 | `CA1` | 12 | `CA2` |

Port B's header is the same with `PB0`–`PB7`, `CB1` and `CB2`.

These are the *same* sixteen lines the keyboard matrix and the two joysticks
use. Anything you hang here takes turns with them — see
[The keyboard and the sticks](/assembly/input) for the handshake.

## Two internal headers

**Keyboard** — a 1 × 16 header at 2 mm pitch: pins 1–8 are `PA0`–`PA7` (the
matrix rows), pins 9–16 are `PB0`–`PB7` (the columns). On a stock ACE the
board's own switches are soldered across it.
[The keyboard matrix](/reference/keyboard-matrix) has the grid.

**Storage** — a 2 × 10 socket carrying eight data lines, three address lines,
a read strobe, a write strobe and one chip select. That chip select is I/O slot
4, which is why the CompactFlash card appears at `$8C00`. The CF adapter board
is nothing more than this header wired to a CF socket.

## Headers for a case

Five headers are left empty on a standard build. They are for an ACE built
into a full enclosure, which AC6502 doesn't offer today. In such a build, the
parts a person handles are mounted on the case and wired to the board through
these headers, and the matching parts on the board are left off. For example,
the ACE Board can sit inside a case with its power jack, power switch and key
switches left off, and a Keyboard Helper as its keyboard. Each header is a
plain 2.54 mm pin header, except the keyboard's.

| Header | What goes on the case | What to leave off the board |
|---|---|---|
| `RESET SW` | A reset button. The header is wired across the board's own reset button | Nothing: both buttons reset the machine |
| `VCC` | The power jack and power switch: 5 V on pin 1, ground on pin 2 | The barrel jack and the power switch |
| `POWER LED` | A power LED: anode on pin 1, which is `VCC` | The board's power LED, which shares its resistor |
| `AUDIO` | An audio jack or an amplifier: the same signal as the RCA jacks, on pin 1 | The RCA jacks, if the case has its own |
| `KEYBOARD` | A keyboard matrix, such as a Keyboard Helper (see [Two internal headers](#two-internal-headers)) | The key switches |

The `VCC` header joins the supply after the power switch, and on a Rev 1.1
board after the reverse-polarity diode too, so nothing on the board protects
it. The supply on the case must be a regulated 5 V, wired the right way around.

The [6502-ACE repository](https://github.com/acwright/6502-ACE#off-board-headers)
gives each header's reference on the board, and the same headers on the other
AC6502 boards.

<div class="card-link">

📄 **[Connectors card](/cards/connectors.html)** — every pinout on two
printable pages, for the bench.

</div>
