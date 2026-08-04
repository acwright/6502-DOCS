# DEV — Development Environment Vehicle

The machine with no processor in it.

<PlaceholderImage
  label="The DEV rig"
  caption="The DEV Board with its Teensy 4.1 fitted and the Run/Stop, Step, Reset and Frequency buttons visible, with the Output Board's small colour LCD alongside."
/>

Where the CPU socket would be, the DEV board has a **Teensy 4.1** running a
cycle-accurate 65C02 emulation, wired to a real bus through level shifters. From
the rest of the machine's point of view nothing is different — the same signals
appear on the same pins at the same times.

What you gain is control. Four buttons on the board:

- **Run/Stop** — halt the processor mid-program, with the bus frozen where it is
- **Step** — advance one instruction at a time and watch what changes
- **Reset**
- **Frequency** — slow the clock right down, or speed it up

Real silicon won't let you do any of that. This board was built to debug the
BIOS and the early cards, and it's still the fastest way to find out why
something isn't working.

## The machine in a browser

Plug the DEV into your network and it announces itself as `6502.local`, serving
its own web page: the video output, the controls, a debugger, and a keyboard
that types into the emulated machine. No cables to the desk at all — you sit at
your laptop and the 6502 is somewhere else in the house.

## What else is on it

An SD card slot for ROMs, cartridges and programs, USB host for keyboards and
Xbox controllers, and a battery-backed clock — all hanging off the Teensy rather
than the 6502 bus. There's also a bus connector and a card slot wired up for
driving genuine hardware, though nothing in the firmware uses them yet; they're
there for anyone who wants to take it further.

The **DEV Output Board** is a second Teensy driving a 2.4" colour LCD, emulating
the video and sound chips. The DEV board streams the same audio-visual data over
USB at the same time, so a browser can display the output in parallel — which is
where the [emulator](/using/emulator) started life.

## Where to get it

[6502-DEV repository](https://github.com/acwright/6502-DEV) — schematics, board
files, and the Teensy firmware. The printable reference sheet is
[here](/cards/dev.html).

The CPU core is [vrEmu6502](https://github.com/visrealm/vrEmu6502), which is
excellent and worth reading on its own account.
