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

::: tip The ACE takes the same cartridges
The ACE has a cartridge slot too, so anything built for the VCS runs there —
and the same slot is what the [KIM keypad](/addons/kim) plugs into.
:::

## Joysticks

The VCS reads its two sticks through the same VIA ports as the keyboard
encoder, rather than giving them connectors of their own — they come in on the
`J1` and `J2` port headers. `J1` reads as `JOY(1)` and `J2` as `JOY(2)`.

## Where to get it

[6502-VCS repository](https://github.com/acwright/6502-VCS) — three boards, the
cartridge, the input firmware and the bills of materials. The printable
reference sheet is [here](/cards/vcs.html).

The Main Board is also one of the two ways to build a
[standalone KIM](/addons/kim#building-a-kim-on-its-own).

<div class="card-link">

📄 **[6502-VCS card](/cards/vcs.html)** — the machine on two printable
pages. The [card index](/reference/) has the rest.

</div>
