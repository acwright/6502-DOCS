# The ACE on a PicoCalc

The [PicoCalc](https://www.clockworkpi.com/picocalc) is a handheld: a keyboard,
a square screen, a speaker, a battery, and a Raspberry Pi Pico inside it that
you can put your own firmware on. Put this firmware on it and the handheld *is*
an ACE — the same ROM, the same BASIC, the same Monitor, the same
cards answering in the same slots.

It's a pocket machine rather than a program on a laptop. There's no operating
system underneath and nothing to launch: one file goes onto the Pico, and from
the moment you press the power button the 65C02 owns the screen, the keyboard
and the sound.

<Figure
  src="/images/photos/picocalc.jpg"
  alt="A PicoCalc handheld: a square LCD showing the BIOS splash and its two-line menu, above a QWERTY keyboard with a four-way pad."
  caption="A PicoCalc, a few seconds after the power button. That's the machine's own splash, on the handheld's screen."
/>

## What you need

- **A PicoCalc**, with the Pico module it came with. Both the Pico 1 and the
  Pico 2 work — the [difference](#the-two-picos) is how much banked RAM you get.
- **An SD card**, formatted FAT32. This is where programs, cartridges and the
  memory card live.
- **The firmware**, from the
  [6502-PICOCALC releases page](https://github.com/acwright/6502-PICOCALC/releases).
  There's one file per board; take the one that matches yours.

## Putting it on

1. Unplug the Pico, hold its **BOOTSEL** button, and plug it back in.
2. It appears on your computer as a USB drive.
3. Copy the firmware file onto it. The board reboots into it by itself.

That's the whole installation. It replaces whatever was on the Pico, and
putting the original firmware back is the same three steps with a different
file — nothing is burned in.

::: warning Take the file that matches the board
A Pico 1 and a Pico 2 need different builds and won't take each other's — the
file ending `-pico.uf2` is the first, `-pico2.uf2` the second. If you're not
sure which board is in front of you, look at the drive that appears in step 2:
`RPI-RP2` is a Pico 1, `RP2350` is a Pico 2.
:::

## The first time

Press the PicoCalc's power button. You get the splash, the two-line menu, and
then BASIC, exactly as on any other machine in this guide — with one difference
worth knowing about the first time: **it takes a while.** Where hardware is at
the `OK` prompt in about five seconds, a Pico 1 takes something like thirty.
It's emulating a whole computer on a microcontroller, and that is the price.

The machine also looks after the SD card for you. On the first boot it makes
the three folders it wants and the memory card image it works against:

```
/Programs     programs to load into memory
/Carts        cartridge images
/ROMs         replacement ROMs
/CF.IMG       the memory card
```

::: details If you power the Pico from its own USB port
The screen, the keyboard and the SD slot only come alive when the PicoCalc's
power button is pressed. Power the Pico module directly instead — for the
serial console, say — and it starts running several seconds before the rest of
the handheld exists. It waits for the keyboard to answer before it touches the
SD card, so this sorts itself out; if nothing ever answers it gives up after
five seconds and boots anyway, which is what lets a bare Pico with no PicoCalc
attached still run.
:::

## Typing on it

The PicoCalc's keyboard is the ACE's keyboard. Everything you type arrives in
capitals, because that is all the machine's own keyboard has ever sent, and
<kbd>Ctrl</kbd> makes the control codes it always did — <kbd>Ctrl</kbd>+<kbd>C</kbd>
stops a program, and the rest are in [The keyboard](/using/keyboard).

The arrow pad is the four cursor keys. <kbd>Del</kbd> and <kbd>Ins</kbd> are the
keys of those names. The keys an ACE has never had — the function row,
<kbd>CapsLk</kbd>, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>Tab</kbd>,
<kbd>Brk</kbd> — do nothing, apart from <kbd>F1</kbd>, which is the launcher
below.

There are no joystick ports on a handheld, so eight keys stand in for stick 1:

| Key | Stick |
|---|---|
| Arrow pad | Up, down, left, right |
| <kbd>Space</kbd> | Fire |
| <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> | The three other buttons |

`JOY(1)` reads them as it reads a real stick, so a game written for one plays
here — right hand on the pad, left hand on the buttons. Nothing drives stick 2,
which reads as untouched. [Sticks and keys](/basic/controls) is where the rest
of that is.

## The memory card

`CF.IMG` on the SD card is the machine's memory card. `DIR`, `LOAD`, `SAVE` and
`BLOAD`/`BSAVE` all work against it, and what you save is still there after the
battery runs out. [Storage](/using/storage) covers all of it; nothing about it
is particular to the handheld.

It starts one megabyte long and grows a megabyte at a time as you use higher
disk numbers, rather than sitting on the SD card as a quarter of a gigabyte of
mostly nothing. You can also build a card image on a computer with
[`cffs`](/crossdev/tools) and drop it in as `CF.IMG`.

One thing to expect: long file names are shortened, so `Space Invaders.bas` on
the SD card appears in the launcher as `SPACEI~1.BAS`. It loads perfectly well
under that name. Files *inside* the memory card image are unaffected — those
are the machine's own eight-character names.

## The launcher

<kbd>F1</kbd> opens the launcher, at any time. It runs outside the emulated
machine, so it opens even if a cartridge has locked the 6502 up solid — which
makes it the way out of anything.

| Item | What it does |
|---|---|
| **Load program** | Puts a `.bas` or `.prg` from `/Programs` into memory. Type `RUN`. |
| **Load cartridge** | Fits a cartridge image from `/Carts` and restarts the machine into it |
| **Load ROM** | Replaces the built-in ROM with one from `/ROMs` |
| **Eject cartridge** | Takes the cartridge back out |
| **Restore built-in BIOS** | Puts the machine's own ROM back |
| **Settings** | The screen below |
| **Reset machine** | The reset button. Memory survives, so a BASIC program can be `RUN` again. |
| **Power cycle** | The cold start. Memory is cleared and BASIC comes up fresh. |
| **Resume** | Back to whatever was running |

Arrows move, <kbd>Enter</kbd> selects, <kbd>Esc</kbd> goes back.

A program loads straight into memory and leaves everything else alone. A
cartridge or a ROM is a chip swap, so the machine restarts to pick it up — and
both stay put when the handheld is switched off, the way a chip in a socket
would.

## Settings

Also under <kbd>F1</kbd>, and remembered between sessions.
<kbd>Left</kbd>/<kbd>Right</kbd> change the highlighted line.

| Setting | What it does |
|---|---|
| **Clock speed** | Stock, or 200 MHz for a faster machine. Takes effect at the next power-on. |
| **Expansion RAM** | How many banks of [banked RAM](/assembly/banking) are fitted |
| **Backlight** | Brightness, applied as you turn it |
| **Sleep after** | Blanks the backlight after an idle spell; any key brings it back |

Sleep is a dark screen and nothing more — the 6502 carries on, a tune keeps
playing, and a serial terminal stays connected. It's a battery saver, not a
pause.

## The two Picos

Both boards boot the same machine. What differs is how much memory is left over
for the banked RAM cards after the machine itself has taken what it needs:

| | Pico 1 | Pico 2 |
|---|---|---|
| Banked RAM | 16 banks — 16 KB | 256 banks — 256 KB |

The ROM checks what's fitted when it starts, so both come up correctly and `MEM`
reports what it found. BASIC only ever uses bank 0, which is in the machine's
own 32 KB, so a BASIC program can't tell the two apart.

## The serial port

The machine's serial port comes out in two places at once: over USB from the
Pico, and on the pins of the PicoCalc's side header. Open either at
19200 8-N-1 and you have the same terminal described in
[Serial and a terminal](/using/serial) — a console when the machine has no
screen yet, XModem transfers, and a second window onto the Monitor.

::: details Two places it isn't the real thing
The 6502 isn't paced to a fixed clock here; it runs as fast as the board
manages, which is slower than a real machine and not exactly steady. Anything
that counts on instruction timing rather than on the clock will notice.

The video chip's fifth-sprite and collision flags always read as clear, because
the picture is drawn on the other processor core from the one running the
program. Sprites still show and still move; what you can't do is ask the chip
whether two of them touched. Nothing in BASIC, the Monitor or the ROM uses
either.
:::

## Where it comes from

The firmware, the source and the build instructions are in the
[6502-PICOCALC repository](https://github.com/acwright/6502-PICOCALC). It's the
same machine as [the emulator](/using/emulator) — the cards were written against
it — so a program that runs in one runs in the other.
