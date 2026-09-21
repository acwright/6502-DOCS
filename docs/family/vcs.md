# VCS — Video Computer System

A games console. Cartridge in the slot, joysticks plugged in, no disk and no
serial port — you switch it on and it plays.

<Figure
  src="/images/photos/vcs.jpg"
  alt="Three boards on a plate with a ROM cartridge standing upright in a slot at the front, its label reading EhBASIC."
  caption="A VCS with a cartridge in the slot. Push it in, switch on, and whatever is on the ROM is what the machine runs."
/>

The VCS is where the family first stopped being a stack of cards. Three boards
instead of nine:

- **Main Board** — 65C02, 32 KB of RAM, 32 KB of ROM, clock and reset. Powered
  over USB-C. It carries the bus for the other two.
- **Input Board** — matrix keyboard, PS/2 keyboard and both joysticks, through a
  65C22 VIA with an ATmega1284P doing the scanning.
- **Output Board** — VGA video and SID audio.

That consolidation is the direct ancestor of the ACE, which does the same job
with one board instead of three.

## Cartridges

Programs arrive on **ROM Carts** — a small board with an EEPROM on it that
overlays the top of the memory map and takes over at reset. The slot is a card
edge on the board itself, facing up, so a cartridge stands vertically in it
rather than sliding in from the front. There's no CompactFlash slot and no
serial port on a VCS: the cartridge is the storage.

Two cartridge revisions exist, differing in which memory parts they accept.
[6502-CRT](https://github.com/acwright/6502-CRT) is the template project for
writing one.

### The Flash Cart

There is a second kind of cartridge, for when 16 KB is not enough. The **Flash
Cart** is one board built in four sizes from 128 KB to 1 MB, and it holds all
of it in the same 16 KB of address space by switching an 8 KB window at
`$C000–$DFFF` between banks, with a fixed 8 KB at `$E000–$FFFF` that the
vectors live in.

It is all surface mount — the flash is soldered down, not socketed — so it is
programmed two ways, neither of which involves taking a chip out:

- **In circuit**, through the card edge, by the **Flash Helper**: an Arduino
  Mega 2560 with a shield on it carrying the same card-edge connector the Main
  Board uses. [Onto real hardware](/crossdev/to-hardware#programming-a-flash-cart)
  is the procedure.
- **By the 6502 itself.** The chip takes command sequences over the same bus
  the machine reads it with, so a game can erase a sector and program a byte
  while it runs. That is how a cartridge keeps a high score table with no
  memory card anywhere. [Bigger cartridges](/assembly/flash-carts#saving) has
  the details.

**The ROM Cart is not replaced.** Every 32 KB image that works today still
works, still builds the same way, and still goes in the same slot. A Flash
Cart is what you reach for when a game has outgrown one, and `6502-flash
layout` puts an existing 16 KB game onto one unchanged.

Both boards are in this repository rather than one of their own. The cart is
under [`Hardware/Flash Cart/`](https://github.com/acwright/6502-VCS/tree/main/Hardware/Flash%20Cart),
whose `DESIGN.md` covers the mapper and the programming sequences in full; the
Flash Helper is under
[`Hardware/Flash Helper/`](https://github.com/acwright/6502-VCS/tree/main/Hardware/Flash%20Helper),
and the sketch it runs together with the `6502-flash` command that drives it
are under
[`Firmware/FH Programmer/`](https://github.com/acwright/6502-VCS/tree/main/Firmware/FH%20Programmer).

::: tip The ACE takes the same cartridges
The ACE has a cartridge slot too, so anything built for the VCS runs there —
and the same slot is what the [KIM keypad](/addons/kim) plugs into.
:::

## Joysticks

The VCS reads its two sticks through the same VIA ports as the keyboard
encoder, rather than giving them connectors of their own — they come in on the
`J1` and `J2` port headers. `J1` reads as `JOY(1)` and `J2` as `JOY(2)`.

## Where to get it

[6502-VCS repository](https://github.com/acwright/6502-VCS) — the three
machine boards, both kinds of cartridge, the Flash Helper that programs one of
them, the input firmware and the bills of materials for all of it. The
printable reference sheet is [here](/cards/vcs.html).

The Main Board is also one of the two ways to build a
[standalone KIM](/addons/kim#building-a-kim-on-its-own).

<div class="card-link">

📄 **[6502-VCS card](/cards/vcs.html)** — the machine on two printable
pages. The [card index](/reference/) has the rest.

</div>
