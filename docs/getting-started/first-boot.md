# First power-on

Switch it on. You'll hear a short beep, the AC6502 logo appears at the top of
the screen, and under it:

```
AC6502 BIOS v2.0
BASIC v2.0 30718 BYTES FREE
RAM RTC CF SER VIA SID VDP

OK
```

That's BASIC, ready for you. The third line names the cards the machine found.

<Figure
  src="/images/screens/boot-header.png"
  alt="A screen showing the AC6502 logo, then AC6502 BIOS v2.0, BASIC v2.0 30718 BYTES FREE, the list of cards, and OK."
  caption="The first thing the machine shows you: the logo, the header, and the prompt."
  screen
/>

The machine below starts cold, exactly as if you'd reached for the switch.
Click it before you type, or your keys go to this page instead.

<Emulator
  label="Switch it on"
  caption="Cold from the switch: the logo, the header, and then the prompt."
/>

## What it does before the prompt

<Diagram
  name="boot-flow"
  caption="Switch on, and the machine sets the screen up, looks around to see which cards are fitted, and hands over to BASIC — or to a cartridge, if one is in the slot."
/>

## The `OK` prompt

`OK` is the machine saying *your turn*. Anything you type now gets read when
you press <kbd>Enter</kbd>. There's no shell, no file manager, no desktop —
this prompt is the computer.

**30718 bytes free** is how much room your programs have. It's about thirty
kilobytes, which in BASIC is a lot: a substantial game fits in half of it.

::: details Two lines, one version
The top line is the ROM's version: the **BIOS** is v2.0. The `BASIC v2.0` at the
start of the second line is a nod to the BASIC V2 of the classic 8-bit
machines rather than a second release number, so it will stay put when the
BIOS moves on.
:::

## What just happened

In the moment before the header appeared, the ACE checked itself over: what
video hardware is there, is a sound chip fitted, is there a memory card in the
slot, is the clock running. Then it set up whatever it found, drew the logo and
the header on the screen it had just configured, and handed over to you.

That check is why the machine doesn't sulk when something's missing. No sound
chip and the beep is simply skipped. No memory card and the disk commands say
so politely instead of hanging. No monitor at all and the whole console moves
over to the serial port, so a laptop and a USB-to-serial cable is a complete
way to use the machine.

The one thing it can't work around: with *neither* a screen nor a serial
connection there's nowhere to put the prompt, so it stops rather than running
blind. If you're seeing nothing at all, that's the first thing to check — see
[When something's wrong](/getting-started/troubleshooting).

## Try it

You're at the prompt. Type this:

```
PRINT 12 * 12
```

```
 144

OK
```

The machine is a calculator, among other things. Now go on to
[Your first ten minutes](/getting-started/first-ten-minutes) and make it do
something bigger.
