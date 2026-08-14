# Software

Games and other programs written for the ACE and the machines around it. Each
one lives in a repository of its own — follow the link for the source, for how
to build it, and for anything the author has changed since. Everything here is
listed alphabetically.

## Cartridges

A cartridge boots the instant the machine is switched on, in place of BASIC:
nothing to load, and no memory card needed. [Writing a
cartridge](/assembly/cartridges) is the chapter to read if you want to make one
yourself.

To play one, download its `.crt` and load it as a cartridge in
[the emulator](/using/emulator), or burn it to a 28C256 and plug it into the
cartridge slot on the board. The games all need a video card, and all of them
are better with a joystick.

**[LightCycles](https://github.com/jayrdeaton/6502-LightCycles)** by Jay Deaton.
Tron on a 32 × 24 grid. The bikes never stop and never slow down — all you do
is steer — and each one leaves a wall behind it, so the wall you have to worry
about most is your own. Each player picks a trail color on the title screen.

**[Pong](https://github.com/jayrdeaton/6502-Pong)** by Jay Deaton. One player
against the machine, or two people at one keyboard. First to eleven wins.
Player 1 is joystick 1 or WASD, player 2 is joystick 2 or the arrow keys, and
touching a joystick takes the paddle back from the keys.

**[Snake](https://github.com/jayrdeaton/6502-Snake)** by Jay Deaton. The grid
game: eat the food, grow longer, don't hit the walls or your own tail. Joystick
in either port, with WASD and the arrow keys to fall back on when there's no
stick. The title screen remembers the high score, and on a machine with the
clock card fitted it remembers it after the power goes off too.

**[VC83 BASIC](https://github.com/willisblackburn/vc83basic)** by Willis
Blackburn. A floating-point BASIC for the 6502, written from scratch and built
for several different machines out of one set of sources. The build for this
family is a cartridge, so the BASIC in the BIOS steps aside while it runs —
and the Kernal underneath is still the same Kernal. Nothing prebuilt is waiting
in the repository for this one: you build it yourself with cc65, and the steps
are there.

## Programs

A program loads into memory and runs there, leaving BASIC and the Monitor where
they are.

**[Bit Rally](https://github.com/acwright/6502-ASM/tree/main/Bit%20Rally)** by
A.C. Wright. A two-ended *Kill the Bit* for the keypad. One bit runs back and
forth across eight LEDs, and each end of the row belongs to a player: press `◄`
the instant the bit reaches the far left, `►` the instant it reaches the far
right, and nothing else counts. First side to fifteen takes it, and `ESC`
quits. It needs the pad and the eight-LED circuit from
[The KIM keypad](/addons/kim), schematic and all. The program loads at `$0800`.

## Adding to this list

Written something for the ACE, or for any machine in the family? It belongs
here. **[Open an issue](https://github.com/acwright/6502-DOCS/issues/new/choose)**
on this site's repository and say:

- **Where it lives** — a link to the repository, or wherever you keep it
- **What it is** — a sentence or two, the way you'd describe it to somebody
  deciding whether to try it
- **How to run it** — a cartridge, a program file, a BASIC listing to type in
- **What it needs** — video card, joystick, clock card, the keypad, F18A mode,
  anything that isn't on a bare board

It doesn't have to be finished, and it doesn't have to be a game. A tool, a
demo, a language, half a game with the controls working — all of it is worth
somebody else seeing.
