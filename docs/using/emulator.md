# The emulator

An ACE you already own. Same ROM, same BASIC, same everything — it just runs on
your laptop instead of your desk.

Use it to try the machine before you build one, to work on a program when the
real one's in another room, or to test something without hunting for a
CompactFlash card.

## In the browser

<https://acwright.github.io/6502-EMULATOR/>

Nothing to install. Open it, and you get the splash and the `OK` prompt in a
tab. Everything in this guide works there.

## On your desktop

There's a proper application for macOS, Windows and Linux, and it's the better
option if you're going to use it much: it can attach a CompactFlash image,
connect to a real serial port, keep a debug server running, and remember your
settings.

Grab it from the
[6502-EMULATOR releases page](https://github.com/acwright/6502-EMULATOR).

## The toolbar

Everything happens from the row of buttons across the top:

| Button | What it does |
|---|---|
| **CPU chip** | Load a ROM, in place of the built-in BIOS |
| **Document+** | Load a cartridge |
| **Document$** | Load a program (`.prg` / `.bas`) into memory |
| **▶ / ■** | Run or stop the machine |
| **↺** | Reset — exactly like the button on a real ACE. Memory survives. |
| **⏻** | Power cycle — the cold start. Memory is cleared. |
| **1 MHz / 2 MHz** | Switch CPU speed |
| **Clipboard** | Paste text in as keystrokes |
| **⚙** | Settings |

Settings has the same file rows, plus what's currently loaded and an **✕** to
unload it again.

::: tip Pasting a program in
Ordinary ⌘V / Ctrl+V won't work, because the emulator sends every keystroke
straight to the machine. Use the **Clipboard** button instead: paste your
listing into the box it opens, and the emulator types it in for you. It's the
quickest way to try anything longer than a couple of lines.
:::

## Attaching a card

**Settings → CF Card**. In the desktop app, **Select…** picks a `.img` file —
the sort [`cffs`](https://github.com/acwright/cffs) builds — and it stays
attached across restarts. In the browser, **Load** uploads one and **Export**
downloads the current card so you can keep it.

Once it's attached, `DIR`, `LOAD` and `SAVE` work exactly as they do on
hardware, and what you save is written back to the image. The **✕** goes back
to the emulator's own blank card.

The **NVRAM** row works the same way, for the 256 battery-backed bytes.

## Talking to real hardware

The desktop app can open one of your computer's serial ports. Pick the port,
set it to 19200 8-N-1, connect — and now the emulated ACE is on the other end
of a real serial cable. Which means you can use it as the terminal for a real
ACE, or move files between the two with XModem. See
[Serial and a terminal](/using/serial).

## Fullscreen

<kbd>F11</kbd>, or <kbd>⌘</kbd>+<kbd>Return</kbd> on a Mac. The picture keeps
its 4:3 shape whatever the window is doing.

## Running it from the command line

The desktop app installs a `6502` command (**Settings → Command Line →
Install**). It's how you'd fold the emulator into a build:

```
6502 run --headless mygame.prg
```

`--headless` runs with no window at all, wired to your terminal. Useful flags:

| Flag | What it does |
|---|---|
| `--cf disk.img` | Attach a card image |
| `--console video` | Use the video screen instead of the serial console |
| `--freq 2` | Run the CPU at 2 MHz |
| `--timeout 30s` | Stop after a while, whatever happens |

There's a debugger in there too — breakpoints, single-stepping, memory
watching, screenshots — which the assembly chapters of this guide use heavily.
