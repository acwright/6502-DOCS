# Connectors

Every socket, plug and header on the ACE, and what is on each pin. Read off the
schematic rather than off the board, so it is right even where the silkscreen
is crowded.

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

There are four small jumper headers as well — `PHI2 SELECT` for the CPU speed,
`CTS EN` and `DCD EN` for the serial handshake lines, and one that brings the
reset switch out to a panel-mounted button. Those are build-time decisions,
not things to plug into.

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
| 3 | `RESB` | 4 | `EXP0` |
| 5 | `IRQB` | 6 | `EXP1` |
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

::: tip Two of the four expansion pins are spoken for
The family bus reserves `EXP0` to `EXP3`. On the ACE, `EXP0` and `EXP1` are
both tied to the hard-reset line — so a card designed against a
[COB](/family/cob) backplane, expecting all four to be free, will not behave
here.
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

<div class="card-link">

📄 **[Connectors card](/cards/connectors.html)** — every pinout on two
printable pages, for the bench.

</div>
