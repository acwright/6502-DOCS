# The KIM keypad

Three small boards turn your ACE into a **KIM-1** — the 1976 single-board
computer that taught a generation what a microprocessor was. Twenty-four keys,
a two-line display, and nothing between you and the bytes.

<PlaceholderImage
  label="An ACE wearing its KIM boards"
  caption="The Keypad Card in the ACE's cartridge slot with the LCD Helper and the keypad stacked on it, the LCD showing an address and a byte."
/>

## What you need

| Board | What it does |
|---|---|
| **Keypad Card** | Plugs into the ACE's cartridge slot. Carries the ROM and the chip that talks to the other two. |
| **Keypad LCD Helper** | The 16×2 display. Sits on the Keypad Card. |
| **Keypad Helper** | The 24 keys. Sits on the LCD Helper, or straight on the Keypad Card if you'd rather have no display. |

They stack. All three are in the
[6502-KIM repository](https://github.com/acwright/6502-KIM) with schematics,
board files and a bill of materials.

## Plugging it in

Power off. Keypad Card into the cartridge slot, LCD Helper onto the Keypad
Card, keypad onto the LCD Helper. Power on.

You won't get BASIC. You'll get the **KC Monitor** — an address on the left of
the display, the byte at that address on the right, and a keypad that edits it.
That's the whole interface, and it's the point.

To go back to being an ACE, pull the card out.

::: details Why BASIC disappears
The Keypad Card doesn't sit politely in an I/O slot the way everything else in
the family does — it takes over the top of the memory map. Its own ROM replaces
BASIC, the Monitor and Wozmon, and it installs its own startup vectors, so the
machine boots into the KC Monitor rather than into BASIC.

What it *doesn't* replace is the BIOS Kernal underneath, which stays exactly
where it is and stays callable. Programs you write on the keypad can still ask
the Kernal to print a character, read the clock, or talk to the serial port.

This takeover is also why the KIM is the one machine in the family the
[emulator](/using/emulator) can't currently pretend to be.
:::

## Using the keypad

Sixteen of the keys are the hex digits `0`–`F`. The other eight move you around
and do things:

- **`◄` and `►`** step back and forward one address. **`PGUP`** and **`PGDN`**
  do the same thing in jumps of 256.
- **`INS`** switches between *reading* memory and *editing* it. In edit mode,
  keying two hex digits writes a byte and `►` moves on.
- **`DEL`** writes `$00` at the address you're on.
- **`▲`** runs the code at the address on the display.
- **`ESC`** stops a running program and comes back to the monitor.

The hex keys do double duty: while you're navigating, each one you press shifts
into the address a nibble at a time, KIM-1 style — key `0`, `8`, `0`, `0` and
you're looking at `$0800`.

So the loop is: key in an address, press `INS`, type your program two hex
digits at a time, key the start address back in, press `▲`. That's how
programming worked in 1976, and doing it once will change how you think about
the machine.

`▲` runs your code as a subroutine, so an `RTS` at the end lands you back at
the monitor with everything intact.

## Two programs to type in

Both of these want eight LEDs wired to `$9400` — a row on a breadboard is
perfect, and it's the traditional first thing to build.

**Binary counter** — counts 0 to 255 in binary on the LEDs, about twice a
second, then rolls over and starts again. Eighteen bytes.
[Type-in card →](/cards/archive/kim-led-binary-counter.html)

**KITT scanner** — one lit LED sweeps left and right across the row, like the
front of the car in *Knight Rider*. Thirty-eight bytes, fourteen of which are a
table of patterns rather than code. [Type-in card →](/cards/archive/kim-led-kitt-scanner.html)

Each card has the bytes laid out in a grid to key in, the assembly source they
came from, and the steps to run them.

## The serial monitor

Fit a serial cable ([Serial and a terminal](/using/serial)) and the KC Monitor
gives you a Wozmon-compatible monitor over it at the same time as the keypad —
so you can examine and change memory from a laptop and from the keys at once.
Handy when you're typing in something longer than a few bytes.

## Building a KIM on its own

You don't have to start from an ACE. The KIM predates it, and the original
recipe is a stack of COB cards:

- **Backplane** (or Backplane Pro) + **CPU Card** + **Memory Card**, or the
  **Main Board** from the VCS project in place of all three
- **Backplane Helper** and, usually, a **Serial Card**
- The same three keypad boards above

That build is a KIM and nothing else — no video, no sound, no BASIC. It's a
lovely object and a genuinely good way to learn the 65C02. The full parts list
and the wiring are in the
[6502-KIM repository](https://github.com/acwright/6502-KIM); the cards it needs
come from [COB](/family/cob).
