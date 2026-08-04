# First power-on

Switch it on. You'll hear a short beep, and the screen says:

```
-- 6502 BIOS v1.5 --
ENTER=BASIC  ESC=MONITOR
```

You have about five seconds to choose.

- Press <kbd>Enter</kbd> — or just wait — and you get **BASIC**. This is what
  you want, nearly always.
- Press <kbd>Esc</kbd> and you get the **Monitor** instead: a much lower-level
  tool for looking at memory directly. It's [a whole chapter](/using/monitor) of
  its own, and nothing is lost by ignoring it for now.

Take the default, and a moment later:

```
6502 BASIC V2.0
30718 BYTES FREE

OK
```

<PlaceholderImage
  label="The boot screen"
  caption="A VGA monitor showing the BIOS splash line, the BASIC banner, and the OK prompt with the cursor blinking under it."
/>

## The `OK` prompt

`OK` is the machine saying *your turn*. Anything you type now gets read when
you press <kbd>Enter</kbd>. There's no shell, no file manager, no desktop —
this prompt is the computer.

**30718 bytes free** is how much room your programs have. It's about thirty
kilobytes, which in BASIC is a lot: a substantial game fits in half of it.

::: details Three version numbers, all different
The ROM contains three pieces of software and they don't share a version
number. The **BIOS** is v1.5 — that's the top line. **BASIC** is V2.0 — the
banner underneath. The **Monitor** is v1.1, and doesn't announce itself until
you go there. Don't be alarmed when they disagree; they're meant to.
:::

## What just happened

In the second or so before the splash appeared, the ACE checked itself over:
what video hardware is there, is a sound chip fitted, is there a memory card in
the slot, is the clock running. Then it set up whatever it found, drew the
splash on the screen it had just configured, and handed over to you.

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
