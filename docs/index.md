# Welcome

This is your guide to the **ACE** — a whole 65C02 computer on one board, with
its own keyboard built in, plus sound, joysticks and a disk. It boots in about
five seconds, straight into BASIC, and it will still be doing exactly what you
tell it in thirty years.

<Figure
  src="/images/photos/ace.jpg"
  alt="An ACE from above: one black circuit board carrying every chip, with a 67-key keyboard along the front and connectors across the back."
  caption="This is the whole computer. Every chip, the keyboard, and every socket you will ever plug anything into, on one board."
/>

There is no operating system to log into and nothing to install. You switch it
on, you get this:

```
-- 6502 BIOS v1.5 --
ENTER=BASIC  ESC=MONITOR

6502 BASIC V2.0
30718 BYTES FREE

OK
```

`OK` means the machine is waiting for you. Type this and press <kbd>Enter</kbd>:

```
PRINT "HELLO"
```

```
HELLO

OK
```

That's it. That's the whole idea. Everything else in this guide is a bigger
version of that.

If you don't have an ACE in front of you, here is one. Start it, wait for the
`OK`, and type that line yourself.

<Emulator
  caption="An ACE, booting into BASIC. Click it once to give it the keyboard, then type."
/>

## What you can do with it

- **Write programs in BASIC** — games, tunes, drawings, calculators. Type them
  in, run them, save them to the memory card.
- **Make noise.** Three voices of SID sound, the same chip that gave the
  Commodore 64 its voice.
- **Draw on the screen.** 40 columns by 24 rows, 16 colors, out to any VGA
  monitor.
- **Plug in joysticks.** Two Atari-style ports, which is all a good game needs.
- **Go all the way down.** Underneath BASIC there's a machine-code Monitor, and
  underneath that there's the bare 65C02. You can get to both.

## Where to go next

| If you… | Start here |
|---|---|
| have an ACE in front of you and nothing plugged in | [Setting up](/getting-started/setup) |
| have it plugged in and want to see it boot | [First power-on](/getting-started/first-boot) |
| are at the `OK` prompt right now | [Your first ten minutes](/getting-started/first-ten-minutes) |
| don't have one yet | [The emulator](/using/emulator) — it's a complete ACE, in your browser |
| want one you can carry | [On a PicoCalc](/using/picocalc) — the same machine, as a handheld |
| want to know what's on the board | [The ACE](/the-ace) |

Everything in this guide works the same on real hardware and in the emulator.
If you don't have a machine yet, open the emulator in another tab and follow
along — nothing here needs anything you can't get for free.

## About the family

The ACE is the finished article, but it isn't the only machine that runs this
software. It's the last of five, and the other four are still around: the
**COB** backplane, the **DEV** rig, the **VCS** console, and the **KIM** keypad.
They're all open hardware, and they're all documented at the
[back of this guide](/family/) if you'd like to build one.

The KIM is the interesting one, because it isn't really a separate machine any
more — three small boards turn an ACE into a hex keypad, a two-line display and
nothing else, the way a KIM-1 was in 1976. That's
[its own chapter](/addons/kim).
