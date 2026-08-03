<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# Setting up

What you plug in depends on which machine you have and which cards are
fitted — see [Choosing your machine](/systems/comparison) if you haven't
already, and your machine's own page under **Systems** for exactly what it
carries. This chapter is the general shape of it: what each connector is for
and what happens if you leave one out.

Nothing here is required to boot. The BIOS probes for every card at power-on
and routes around whatever's missing — a machine with no video card still
boots to a serial console, a machine with no CompactFlash just can't `LOAD`
or `SAVE`. See [First power-on](/getting-started/first-boot) for the probe
itself, and [Troubleshooting](/getting-started/troubleshooting) for reading
back what was found.

## Power

A 5 V DC supply, barrel jack on ACE and VCS's Main Board; the COB Backplane
Pro adds an onboard power switch (Rev 1.1) and its own barrel jack. Apply
power last, after everything else is seated — cards should never be
hot-plugged.

## Video — Pico9918 to VGA

Video comes from a [Pico9918](https://github.com/visrealm/pico9918) module — a
Raspberry Pi Pico programmed to be pin- and timing-compatible with a real
TMS9918A, but driving a standard VGA monitor at 640×480 instead of composite.
Plug the Pico9918's VGA output into any VGA-capable display; the BIOS talks to
the module exactly as it would to a real TMS9918A (`data/hardware.json`'s
video slot, `$9C00–$9FFF`), so from software's perspective there is no
difference. COB's Video Card carries a real TMS9918A instead, for composite
output, on the same slot.

No video card fitted is not an error: the Reset probe clears the video bit in
`HW_PRESENT` and the BIOS routes its console to serial instead. This is the
default state of every headless emulator run in this repo's own test harness.

## Audio — ARMSID

Audio is an [ARMSID](http://www.waitingforfriday.com/?p=661) — a modern,
pin-compatible reimplementation of the MOS 6581 SID — socketed into a DIP-28
position and wired exactly as a real 6581 would be (confirmed directly in the
schematics: every board's audio section names the socketed part `6581`, not
`ARMSID`, because electrically that's what it is). Output is RCA line-level,
into a powered speaker or amplifier. `SOUND` and `VOL` from BASIC, and the
SID register block at `$9800–$9BFF`, work identically whether the chip is a
real 6581, an ARMSID, or (on DEV) emulated in software.

## Keyboard — PS/2 and matrix, both live

Every machine with a keyboard controller accepts a **PS/2 keyboard and a
matrix keyboard at the same time** — there is no jumper to choose one or the
other, and both feed the same input path. ACE and VCS use an ATmega1284P
running the AB Controller firmware to scan the matrix and merge it with PS/2
input; KIM's Keypad Card is the exception; see
[its own page](/systems/kim) — its 24-key pad is a different input path
entirely, not a PS/2/matrix keyboard.

## Joysticks

Two Atari 2600-compatible joystick ports, read through a 65C22 VIA as an
active-low bitmask (`JOY(1)`, `JOY(2)` from BASIC — a held direction or button
reads as `0`, not `1`; the exact bit layout is in
[`data/hardware.json`](https://github.com/acwright/6502-DOCS/blob/main/data/hardware.json)'s
`joystick` object). On ACE the two ports are separate connectors (J6, J8); on
VCS the joysticks share the same VIA ports as the keyboard encoder rather than
having dedicated connectors of their own — see the
[VCS system page](/systems/vcs) for exactly which port is which.

## Serial terminal

A DB9 connector (confirmed in schematics: `DB9 MALE (DTE)`) carries RS-232 at
**19200 baud, 8-N-1** (`Kernal.asm:793` — `lda #$1F ; 8-N-1, 19200 baud`).
Connect a USB-to-serial adapter and any terminal program (screen, minicom,
PuTTY, CoolTerm) at that setting, or use the emulator's own headless serial
console, which every code sample in this site is actually run against — see
[Using the emulator instead of hardware](/using/emulator). Full detail,
including `LOAD`/`SAVE` over XModem, is in
[Serial & XModem](/using/serial).

## CompactFlash card

An 8-bit True IDE CompactFlash card, into a Storage Card (COB), ACE CF
Adapter, or built into VCS's absence-of-storage design (VCS has no CF slot at
all — cartridges are its storage). Format and layout are covered in
[Storage](/using/storage). No card fitted means every disk command reports
`NO DEVICE` rather than hanging or corrupting anything.

<PlaceholderImage
  label="Cable and card hookup"
  caption="A labelled shot of a fully cabled machine — video, audio, keyboard, joystick, serial, and CF card all connected — once a real unit is available to photograph."
/>
