# The rest of the family

The ACE didn't arrive fully formed. It's the fifth machine in the AC6502 family
and it's made of everything the first four taught.

They all still exist, and they're all open hardware. If you want to *build* a
6502 rather than use one, this is where the interesting reading is.

<Figure
  src="/images/photos/family-desk.jpg"
  alt="An older machine on a desk: a board and a separate keyboard in front of a monitor showing a BASIC banner and an OK prompt."
  caption="One of the earlier machines, driving a monitor from a stack of boards with the keyboard on a cable — photographed some years ago, when BASIC still announced itself as version 1.0. The ACE is all of this on one board."
/>

## How it went

**[COB](/family/cob) — Computer On a Backplane.** The first one. A passive
backplane and a card per function: CPU, memory, video, sound, serial, storage,
GPIO, clock. Building it a card at a time is how each piece of the architecture
got proved, and it's still the clearest way to see how the machine is put
together.

**[DEV](/family/dev) — Development Environment Vehicle.** A Teensy 4.1
pretending to be a 65C02, so the CPU could be stopped, stepped, and slowed
right down. This is where the emulator came from.

**[VCS](/family/vcs) — Video Computer System.** The first unification: a Main
Board carrying CPU, RAM and ROM, an Input Board for keyboards and joysticks, an
Output Board for video and sound. A cartridge console: games drop into a slot
standing up on the board, the same way they do on an ACE.

**[KIM](/addons/kim) — Keypad Input Monitor.** A KIM-1 homage built for fun out
of parts that already existed. These days it's better thought of as an add-on
that turns an ACE into a KIM, which is why it has
[a chapter in the main guide](/addons/kim).

**ACE — All-in-one Computer Experience.** Everything above, on one board. The
machine [this guide is about](/the-ace).

## What they share

The same memory map, the same eight hardware slots and the same Kernal jump
table, which is what let the ACE be built by absorbing the others rather than
starting over. A program that calls the Kernal and checks what's fitted runs
on any of them — the BIOS looks at startup, so nothing crashes when a card
isn't there.

What they don't all share any more is the video card. The COB, the DEV and the
VCS were built around the TMS9918A, and they run BIOS 1.6, which drives that
chip, has a machine-code Monitor, and boots through a splash screen and a menu.
This guide describes BIOS 2.0 and the ACE's newer video card, so for
programming one of those three, the reference is the
[BIOS 1.6 edition](https://acwright.github.io/6502-DOCS/v1/) of this guide.

The KIM is the exception in a different way. Its Keypad Card brings its own ROM
and takes the top of the memory map, so there's no BASIC while it's fitted — but
the Kernal underneath is still there, and the programs you key in on the pad
call it exactly as an ACE program would.
