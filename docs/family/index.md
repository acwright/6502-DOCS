# The rest of the family

The ACE didn't arrive fully formed. It's the fifth machine in the AC6502 family
and it's made of everything the first four taught.

They all still exist, they all still run the same BIOS, and they're all open
hardware. If you want to *build* a 6502 rather than use one, this is where the
interesting reading is.

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
machine [this guide is about](/your-ace).

## What they share

Every one of them runs the same BIOS, with the same BASIC, the same Monitor and
the same memory map. A program written on any of them runs on all of them, as
long as the hardware it wants is fitted — and the BIOS checks that at startup so
nothing crashes when it isn't.

That's the whole reason the family holds together, and it's why the ACE could be
built by absorbing the others rather than starting over.
