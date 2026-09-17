# Glossary

Terms this guide uses, in the sense this guide uses them. Where a word means
something slightly different in the wider world, that is noted.

**ACIA** — the serial chip, a 65C51. Turns bytes into the stream of pulses that
goes down the [serial cable](/using/serial), and back again.

**ACE** — All-in-one Computer Experience. The machine this guide is about: one
board carrying the processor, memory, video, sound, storage, serial, clock,
joystick ports and a full keyboard. See [The ACE](/the-ace).

**ARMSID** — the sound chip. A modern part that behaves like the MOS 6581
"SID" from the Commodore 64: three voices, real filters, RCA out.

**bank** — one 1 KB slice of the 512 KB of extra RAM. Only one is visible at a
time, through a window at `$8000`. `BANK n` picks which.
See [Banked RAM](/assembly/banking).

**BASIC** — the language the machine boots into, and the program in ROM that
runs it. Version 2.0 here. See [Programming in BASIC](/basic/).

**BIOS** — the whole 32 KB of ROM: Kernal, BASIC and Wozmon together. This
guide describes BIOS v2.0. Not the same sense as a PC's
BIOS, which is only a boot loader.

**CompactFlash** — the storage card. Behaves as an 8-bit IDE drive; the BIOS
divides it into 256 **disks** of 1 MB each. See [Storage](/using/storage).

**cartridge** — a ROM on a small board that drops into the slot behind the
keyboard and takes over `$C000`–`$FFFF`, replacing BASIC and Wozmon. See
[Writing a cartridge](/assembly/cartridges).

**CP437** — the character set, from the original IBM PC, carried by the video
card rather than the ROM. Box drawing, card suits, Greek letters, three
densities of shading.
See [The character set](/reference/character-set).

**break report** — what the machine prints when a program reaches a `BRK`: the
address, the break number and every register, then the `OK` prompt.
See [Reaching the machine](/basic/machine#when-machine-code-stops).

**cold start** — power off and on again. Memory is cleared, BASIC starts from
nothing. Compare *warm start*.

**disk** — one of the 256 1 MB partitions on the CompactFlash card, each
holding up to sixteen files. `DISK n` selects one. Nothing to do with a
spinning disk.

**GPIO** — general-purpose input and output, the sixteen pins of the 65C22
VIA. The joysticks and the keyboard use them; so can you.

**immediate mode** — typing a line without a number in front, so it runs
right away. Compare *program mode*.
See [Typing it in](/basic/typing-it-in).

**jump table** — the first 256 bytes of the Kernal, a fixed list of three-byte
jumps. Calling one of those addresses is how a program asks the machine to do
something, and the addresses do not change between ROM versions.
See [The Kernal](/assembly/kernal).

**Kernal** — the ROM routines that drive the hardware: printing, reading keys,
files, sound, the clock. Spelled with an `a`, following Commodore's original
typo. See [The Kernal](/assembly/kernal).

**layer** — one of the video card's two grids of tiles, drawn one over the other
and scrolled separately. Text is layer 0.
See [The graphics modes](/assembly/graphics).

**KIM** — a 1976 single-board computer, and here the three-board
[add-on](/addons/kim) built in its likeness: a hex keypad, a two-line display,
and a monitor ROM of its own. It works the way the original worked; it does not
run the original's software.

**null modem** — a serial cable or adapter that crosses transmit and receive.
The ACE and a PC are both wired as terminals, so reaching one from the other
needs one. See [Connectors](/reference/connectors).

**NVRAM** — 256 bytes inside the clock chip, kept alive by its battery. The
one place a program can leave something behind with the power off.

**palette** — the 256 colors the video card can show at once, each picked from
4,096. The first sixteen are the colors `COLOR` numbers.
See [The graphics modes](/assembly/graphics).

**pen** — the pair of colors, letters and background, that the next character
printed is drawn in. `COLOR` sets it; what is already on the screen keeps its
own. See [The screen](/assembly/video).

**PICO9918 PRO** — the board the video card is built on: a Raspberry Pi RP2354
with a VGA socket, running the *PICOVDP* firmware. The earlier Pico9918 boards,
built on the RP2040, behave as a TMS9918A and belong to the
[BIOS 1.6 edition](https://acwright.github.io/6502-DOCS/v1/) of this guide.

**PICOVDP** — the video chip: firmware written for this family, giving text with
a color per character, four screen layouts up to 320 × 240, two layers, 256
colors and 64 sprites. See [The screen](/assembly/video).

**port B** — the video card's second pair of addresses, `$9C02`–`$9C03`. The
Kernal and BASIC use the first pair, so an interrupt handler that uses port B
never trips over them. See [Interrupts](/assembly/interrupts).

**program mode** — typing a line *with* a number in front, so it is stored
rather than run. `RUN` runs what is stored. Compare *immediate mode*.

**prompt** — the `OK` and the blinking cursor: the machine telling you it is
your turn.

**PRG** — a program file with a two-byte load address on the front. What `SAVE`
writes and `LOAD` reads.

**save slot** — one of 16 slices of the NVRAM, 16 bytes each: an owner ID, a
checksum and 14 bytes of save. Programs that keep to the slots can share the
clock card. Not the same as a *slot*. See [The clock](/assembly/clock#save-slots) and
[Time and memory that lasts](/basic/clock#save-slots).

**sprite** — a small picture the video card draws over the layers at any
position, without disturbing what is underneath. There are 64.
See [The graphics modes](/assembly/graphics).

**slot** — one of the eight 1 KB windows between `$8000` and `$9FFF`, one per
piece of hardware. The machine works out at power-on which ones answer.
See [What's fitted](/assembly/detection).

**token** — the single byte BASIC stores in place of a keyword. `FOR` is one
byte in memory and three characters on the screen, which is why `LIST` has to
translate. See [What BASIC does with your memory](/basic/inside).

**VIA** — Versatile Interface Adapter, the 65C22. Two 8-bit ports and two
timers. Runs the keyboard and the joysticks here.

**warm start** — pressing the reset button. BASIC starts again from the top, but
memory isn't cleared, so your program survives and only its variables start
over. This is the safe way out of a program that has run away. Compare
*cold start*.

**Wozmon** — Steve Wozniak's monitor from the Apple I, 250 bytes long, kept at
`$FF00` as an easter egg. `SYS 65280` from BASIC gets you there and `C000R`
brings you back.

**XModem** — the file-transfer protocol the serial port speaks. `LOAD` and
`SAVE` with no filename use it. See [Serial and a terminal](/using/serial).

**zero page** — the first 256 bytes of memory. The processor reaches them with
shorter, faster instructions, so they are valuable. The Kernal owns the first
58; the rest are yours, though not while BASIC is running.
See [The memory map](/assembly/memory-map).
