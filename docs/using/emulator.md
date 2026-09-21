# The emulator

The whole machine, in software. Same ROM, same BASIC, same everything — it just
runs on a laptop instead of on a board.

Use it to try the machine before you build one, to work on a program when the
real one's in another room, or to test something without hunting for a
CompactFlash card.

<Emulator
  caption="Here's one now, running in this page. Click it once to give it the keyboard, then type."
/>

## In the browser

<https://acwright.github.io/6502-EMULATOR/?vdp=picovdp>

Nothing to install. Open it, and you get the AC6502 logo, the header and the
`OK` prompt in a tab. Everything in this guide works there. That address opens
it with [the video card](#the-video-card) this guide is written for; the app
remembers whichever card you last chose, and the address overrides it for that
visit.

It works on a phone too. The picture keeps its 4:3 shape whichever way you turn
the phone, the controls rearrange themselves to fit, and the **⌨** button puts
[the ACE's keyboard](#the-keyboard-on-the-screen) on the screen. Turned sideways,
the keyboard moves to sit beside the picture instead of under it.

::: tip On a phone, tap **⌨** before you try to type
The app starts with the keyboard down whatever you opened it on, so on a phone
there is nothing to type into BASIC with until you tap that button. The machines
running inside these pages are the other way around: they check what they are
being read on, and a touch screen with no mouse gets the board without asking,
because a frame you can't type into is a picture rather than an emulator.
:::

## On your desktop

There's a proper application for macOS, Windows and Linux, and it's the better
option if you're going to use it much: it can attach a CompactFlash image,
connect to a real serial port, keep a debug server running, and remember your
settings.

Grab it from the
[6502-EMULATOR releases page](https://github.com/acwright/6502-EMULATOR/releases).
The first time it opens, check **Settings → VIDEO CARD** says
**6502-PICOVDP**.

## The video card

The emulator can fit either of two video cards in the machine, and the one it
fits decides which BIOS it boots:

| Settings → VIDEO CARD | Boots | Documented in |
|---|---|---|
| **6502-PICOVDP (BIOS 2.x)** | `AC6502 BIOS v2.0`, straight to BASIC | This guide |
| **TMS9918A (BIOS 1.6)** | The older ACE, with its splash and Monitor | [The BIOS 1.6 edition](https://acwright.github.io/6502-DOCS/v1/using/emulator) |

An ACE in this guide is always the 6502-PICOVDP. If the machine greets you with
a splash and a countdown instead of the logo and `AC6502 BIOS v2.0`, it has the
other card fitted, and half of what these pages say won't work on it.

Changing the card is a power cycle with the other card in the slot: memory is
cleared and the machine boots again, while the CompactFlash card and the clock
card's memory are kept. The choice is saved, in the desktop app's settings or
in the browser. A ROM you loaded yourself stays loaded whichever card you pick;
only the built-in BIOS follows the card.

## On a handheld

There's a third place this machine runs, and it isn't a window on a computer at
all: a [ClockworkPi PicoCalc](/using/picocalc) — a pocket-sized keyboard and
screen — will run the whole ACE as its firmware. It's the ACE with the older
video card and BIOS 1.6, which its chapter explains. One file onto the Pico inside
it and the handheld boots to the `OK` prompt with nothing else involved: no host
computer, no application, and a battery.

It has a launcher and an SD card of its own, so it gets
[its own chapter](/using/picocalc).

## The KIM has its own

Fit the [KIM keypad](/addons/kim) and you aren't running an ACE any more: the
Keypad Card's ROM replaces BASIC, and the video and keyboard
give way to a two-line display and twenty-four keys. That's a different machine,
so it gets a different emulator — the **KIMulator**, at
<https://acwright.github.io/6502-KIMULATOR/>, with desktop builds on
[its releases page](https://github.com/acwright/6502-KIMULATOR).

Everything below is about this one. The KIMulator has the same shape — a
browser build, a desktop app, a command line, and the same trick for putting a
machine on a page of your own — with its own set of controls, because the
hardware it stands for is different. The [KIM chapter](/addons/kim) has one
running on the page.

## The toolbar

Everything happens from the row of buttons under the picture:

| Button | What it does |
|---|---|
| **CPU chip** | Load a ROM, in place of the built-in BIOS |
| **Document+** | Load a cartridge — a 32 KB ROM cart or a [Flash Cart](/assembly/flash-carts) |
| **Document$** | Load a program (`.prg` / `.bas`) into memory |
| **▶ / ■** | Run or stop the machine |
| **↺** | Reset — exactly like the button on a real ACE. Memory survives. |
| **⏻** | Power cycle — the cold start. Memory is cleared. |
| **1 MHz / 2 MHz** | Switch CPU speed |
| **Speaker** | Mute and unmute |
| **⌨** | Put the ACE's keyboard on the screen |
| **Clipboard** | Paste text in as keystrokes |
| **⚙** | Settings |

The speaker button tells you whether there is sound *right now*, not what the
setting says — so it shows muted, dimmed, until you click it. Browsers won't
let a page make noise until you've interacted with it, and that click is the
interaction.

Settings has the same file rows, plus what's currently loaded and an **✕** to
unload it again.

::: tip Pasting a program in
Ordinary ⌘V / Ctrl+V won't work, because the emulator sends every keystroke
straight to the machine. Use the **Clipboard** button instead: paste your
listing into the box it opens, and the emulator types it in for you. It's the
quickest way to try anything longer than a couple of lines.
:::

## The keyboard on the screen

The **⌨** button raises the ACE's own keyboard under the picture: the same 67
keys, in the same places, at the same widths as the ones soldered to the board.

It is the way in on a phone or a tablet, which have no keyboard to type on. It
is also the quickest way to reach <kbd>Fn</kbd>, <kbd>Ins</kbd> or the arrows on
a laptop that has put them somewhere else, so it is there at every size.

Every machine on this site has the same button. In a page like this one it opens
itself on a device with no keyboard of its own; in the app it waits to be asked.

What it is not is a phone keyboard. There is no autocorrect and there are no
symbol layers, because the board has neither, and it types
[in capitals](/using/keyboard#everything-is-in-capitals) like the board does —
<kbd>Shift</kbd> gives you the symbol on a number key and leaves letters alone.
The four keys that [send nothing](/using/keyboard#ctrl-and-the-keys-nothing-listens-for)
on the hardware send nothing here either, and like the hardware's they are still
switches in the grid, so a program reading the matrix itself sees them held.

::: tip One finger, two keys
<kbd>Shift</kbd>, <kbd>Ctrl</kbd>, <kbd>Alt</kbd> and <kbd>Fn</kbd> latch rather
than needing to be held: tap one to arm it for the next key you press, tap again
to lock it down for a run of them, and a third time to let go.
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

## Flash carts and their saves

**Document+** takes a [Flash Cart](/assembly/flash-carts) image as happily as a
32 KB one — 128 KB, 256 KB, 512 KB or 1 MB. There is no setting to change and
nothing to declare beforehand: the emulator reads how many bytes the file
holds and fits the cartridge that byte count belongs to.

::: warning The size in the name is a label; the size in the bytes is what the machine reads
Name a 131,072-byte file `Game-512K.crt` and the emulator still loads it as a
128 KB cart, and warns that the name disagrees with the contents. Whenever the
name and the byte count conflict, the byte count is what the machine acts
on.
:::

A Flash Cart can write to itself, which is how a game on one saves a high score
table with no memory card in the machine. Those writes have to be kept
somewhere between runs, and where the emulator keeps them is the part worth
reading carefully:

**No emulator ever writes to a `.crt`.** Not on save, not when you eject the
cart, not on quit. The image you loaded is the image you still have, down to
the byte and the timestamp.

What a cart programs goes into a **`.sav` file beside the image** —
`Game-512K.sav` next to `Game-512K.crt` — written when you eject the cart, load
another, or quit. Load the cart again and the save comes back with it. A run
that programmed nothing writes no file at all.

A cart opened through a file picker, or one running on a web page, has no path
to sit beside, so its saves go into the browser's own storage under the image's
checksum instead.

::: tip Deleting the `.sav` is how you start over
There is no in-game "erase save" you have to hope the author wrote. Throw the
file away and the cart boots as it came off the programmer.
:::

Each save records the size and checksum of the image it was written against.
Rebuild the cart and the old save refuses to apply rather than landing on top
of new code: the cart starts without the save, says so, and leaves the stale
file exactly where it was. That refusal is deliberate. A save written against
last week's level layout, applied to this week's, produces a cartridge that
misbehaves for reasons nothing on screen explains.

On the command line:

```
6502 run --cart Game-512K.crt                     # Game-512K.sav beside it
6502 run --cart Game-512K.crt --cart-save my.sav  # somewhere else
6502 run --cart Game-512K.crt --no-cart-save      # throw the writes away
```

[Onto real hardware](/crossdev/to-hardware#saves-never-travel-with-the-image)
covers what happens to a save when the cart is programmed, which is nothing.

## Playing without a joystick

A gamepad plugged into the computer needs no setting at all: the first one is
[`JOY(1)`](/basic/controls#joysticks), the second is `JOY(2)`. With no gamepad,
the keyboard stands in for one, which is how most people end up playing a
cartridge on a machine that lives in a window.

The first stick always has a keyboard behind it, and **Settings → Joystick**
decides which:

| **Keyboard for `JOY(1)`** | Up | Down | Left | Right | A | B | X | Y |
|---|---|---|---|---|---|---|---|---|
| **Numpad** | <kbd>8</kbd> | <kbd>2</kbd> | <kbd>4</kbd> | <kbd>6</kbd> | <kbd>0</kbd> | <kbd>.</kbd> | <kbd>5</kbd> | <kbd>Enter</kbd> |
| **Arrows + Space** | <kbd>↑</kbd> | <kbd>↓</kbd> | <kbd>←</kbd> | <kbd>→</kbd> | <kbd>Space</kbd> | <kbd>/</kbd> | <kbd>.</kbd> | <kbd>,</kbd> |

The numeric keypad is the default, and it's the one that stays out of your way:
the ACE has no keypad of its own, so nothing you press there can arrive at the
`OK` prompt as a typed character. You can leave a program listed on the screen
and play with the keypad without disturbing a line of it.

**Arrows + Space** is for a laptop, where there is no keypad to press. It is not
free: while it's selected the cursor keys drive the stick, so they stop moving
around the line you're editing in BASIC. Set it back to
**Numpad** — or to **Off**, which unbinds the keyboard entirely and leaves the
stick to a gamepad — when you want to go back to typing.

The second stick is off until you ask for it. **WASD keyboard for `JOY(2)`**
arms it: <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to move,
<kbd>Space</kbd> for A, <kbd>E</kbd> for B, <kbd>Q</kbd> for X, <kbd>R</kbd> for
Y. Every one of those is a letter you would otherwise be typing, which is why it
isn't on by default — arm it for a two-player game, turn it off to write one.

The toolbar keeps a small readout of what is driving each stick right now —
`JOY1: NUM`, `JOY1: ARROW`, `JOY1: PAD`, or `off` — so a stick that isn't
answering is a glance rather than a guess.

::: tip Nothing changes for the program
The keyboard is standing in for a joystick, not pretending to be one somewhere
else: `JOY(1)` reads the same port and returns the same bits either way. A game
written against a real stick plays on the keypad, and a game written at the
keypad plays on a real stick, with nothing to change in the listing.
:::

## Talking to real hardware

The desktop app can open one of your computer's serial ports. Pick the port,
set it to 19200 8-N-1, connect, and the emulated ACE's serial port is now on a
real cable. Whatever you plug into the other end talks to the emulated ACE: a
terminal, or a real ACE to move files to and from with XModem. The emulator is
not a terminal itself, so it can't stand in for one in front of a real board.
See [Serial and a terminal](/using/serial).

The emulated ACE does its own handshaking on that cable, the way the real chip
does. It raises and lowers the port's real RTS line, and reads the port's CTS,
DCD and DSR. There is nothing to set on the port itself.

**Settings → SERIAL** also has the rest of the serial card:

- **Serial card**: the ACE's own, the Serial Card or the Serial Card Pro, for
  the machines that take a card.
- **The card's jumpers**, `CTS EN` and `DCD EN` on the ACE, at *Ground* or
  *Cable*, as on the [board](/reference/connectors). Leave them at ground,
  which is how the boards are built, unless you are testing the handshake. At
  *Cable*, a far end that doesn't assert CTS makes the machine look dead: no
  banner, no echo, until it does.
- **Terminal honours RTS**: whether the emulator's own console and paste hold
  their input while the machine raises RTS. It is on, and it is what lets a
  long paste arrive whole while BASIC stores each line. Turn it off and a long
  paste loses lines.

## Fullscreen

<kbd>F11</kbd>, or <kbd>⌘</kbd>+<kbd>Return</kbd> on a Mac. The picture keeps
its 4:3 shape whatever the window is doing.

## Putting your program on the web

You've written a game. You want to show it to somebody.

Posting the `.prg` won't do it — nobody is going to download a file and then go
looking for an emulator to open it in. What you want is a link that just plays.
The emulator has a second page for exactly that, `embed.html`, meant to sit
inside a page of yours:

```html
<iframe
  src="https://acwright.github.io/6502-EMULATOR/embed.html?vdp=picovdp&prg=https://your-site.example/game.prg&autostart=1&autotype=RUN%5Cr"
  width="640" height="520"
  allow="autoplay; gamepad; fullscreen"
  style="border: 0"
></iframe>
```

That's the whole integration. `vdp=picovdp` fits the video card, and with it
BIOS 2.0; `prg` is your program; `autostart` boots the machine as the page
opens; `autotype` types `RUN` once BASIC is up, so a visitor gets a game rather
than an `OK` prompt and a puzzle. `%5Cr` is how a `\r` — the Enter key —
survives being written in a URL.

Always name the card. A frame never reads the card a visitor chose in their own
copy of the emulator, so without `vdp=` it boots whichever card the emulator
currently starts with, and a program written for this machine needs this one.

640 × 520 is the video output doubled, plus the emulator's control bar. Add
`&controls=none` and 640 × 480 fits the picture exactly.

::: warning `prg` needs the program's full address
It's tempting to write `prg=game.prg` and drop the file next to your page. That
doesn't work, and the way it fails is confusing: the emulator is what fetches
the file, and the emulator is on *its* site, not yours — so `game.prg` means
`game.prg` next to the emulator, which isn't there, and you get a working BASIC
prompt and a 404 in a corner.

Give it the whole `https://…` address. The next section shows how to work that
out when you don't know it yet.
:::

### On itch.io

[itch.io](https://itch.io/) will host a page like that for you, free. What it
wants is a zip containing an `index.html`, uploaded as an **HTML** project,
with the viewport set to **640 × 520**.

The `index.html` is where the warning above bites. Itch decides your address
when you upload, so you can't type it into the page beforehand — but the page
can ask the browser for its own address and work the rest out from there. That's
all the script below does:

<<< @/../samples/embed/itch/index.html{html}

Put your `.prg` in the zip beside it, name it `game.prg` or change the line that
names it, and you're done. This works on itch because its CDN sends the
`Access-Control-Allow-Origin` header, which is what lets the emulator fetch a
file from a site that isn't its own. Not every host does — if the machine boots
but your program never appears, that header is the first thing to check.

::: warning Test it on itch, not by double-clicking
Opening `index.html` from your own disk will boot the emulator but won't load
your program: the frame fetches over `https:` only, so a `file://` address is
refused. It isn't broken. Upload it as a draft project — drafts are private —
and play it there, or carry the program in the URL as below.
:::

### On a blog, a forum, or anywhere you can't upload a file

Put the program *in the link*. Every parameter that names a file has a twin
ending in `64` that takes the bytes themselves, base64-encoded:

```sh
base64 < game.prg | tr '+/' '-_' | tr -d '=\n'
```

Paste the result in place of the whole `prg=…`:

```
…/embed.html?vdp=picovdp&prg64=AQgLCAoAmSJIRUxMTyIAAAA&autostart=1&autotype=RUN%5Cr
```

Now the link *is* the game. Nothing is fetched, so it works from anywhere —
a comment box, a gist, a file on your desktop. The limit is URL length:
a few tens of kilobytes is comfortable, a card image is not.

It's what every machine on this site uses, which is why the pages still run
with no network.

### On a phone

Somebody will open your link on a phone, and a phone has no keyboard to give the
machine. The frame works that out for itself: a touch screen with no mouse gets
the board's keyboard drawn under the picture, a laptop gets the picture and
nothing else, and a **⌨** in the control bar changes its mind either way.

`keyboard=1` opens it whatever the device, `keyboard=0` never opens it, and the
default is `keyboard=auto`, which is the checking above. `controls=none` has no
bar to put the toggle in, so there `keyboard=1` is the only way to have one.

Leave it room. The keyboard takes about a third of the frame's height, so a page
that will be read on a phone wants at least 320 × 380 — give the frame the width
of the column it sits in and let the height follow the 640 × 520 shape. Turned
sideways the keys move beside the picture rather than under it, where a short
wide frame has the room to spare.

### Sound

Embeds start silent, and there's nothing you can pass to change that. Browsers
refuse to let a framed page make noise until somebody has clicked inside it —
`muted=0` only means "unmute at the first opportunity", and the first
opportunity is that click.

So if your game opens on a tune, the tune starts when the player clicks, not
when the page loads. Worth a line of "click to start" on the page around it.

### A game that loads or saves

`cf=` attaches a CompactFlash image — the kind [`cffs`](/crossdev/tools) builds
— so `DIR`, `LOAD` and `SAVE` work inside the frame. It's a fetched file like
`prg`, so it wants the same full `https://…` address, for the same reason.

Anything saved is thrown away when the page closes, unless you add `persist=1`,
which keeps the card and the clock card's memory in the browser's storage
between visits. That's what you want for a game with a high-score table.

Be deliberate about it, though: that storage is one record per *site*, shared
with everything else on the same address — including the full emulator. This
guide never uses it for exactly that reason. On your own page, where yours is
the only machine, it's the right switch.

### Fullscreen

`allow="fullscreen"` on the frame. Leave it off and the button is still there,
the browser refuses it, and the emulator tells the player why — which is a
worse first impression than not offering it.

### Where the `.prg` comes from

Whichever way you got here:

- `SAVE "GAME"` on the machine, then copy it off the card.
- [`bastok`](/crossdev/basic) turns a BASIC listing into one.
- `make` in either project template does it for
  [assembly](/crossdev/build-run-loop).

::: tip Driving the machine from the page around it
Everything above happens as the frame loads. It can also be driven afterwards —
a **Run this** button next to a listing, a reset button, keystrokes sent on
demand — over `postMessage`. That's a web developer's job rather than a
BASIC programmer's, and it's documented in
[EMBEDDING.md](https://github.com/acwright/6502-EMULATOR/blob/main/docs/EMBEDDING.md)
along with every parameter above.
:::

## Running it from the command line

The desktop app installs a `6502` command (**Settings → Command Line →
Install**). It's how you'd fold the emulator into a build:

```
6502 run --headless --vdp picovdp mygame.prg
```

`--headless` runs with no window at all, wired to your terminal. Useful flags:

| Flag | What it does |
|---|---|
| `--vdp picovdp` | Fit the 6502-PICOVDP, and boot BIOS 2.0 — give it every time |
| `--peer-rts ignore` | Stop holding typed or piped input back while the machine asks it to wait. Input waits unless you say this, which is how a long listing arrives whole. `--no-flow-control` is the older spelling, deprecated |
| `--cts cable` | Move the ACE's `CTS EN` jumper to the cable (`--dcd cable` for `DCD EN`). Ground is the default and how the boards are built |
| `--cf disk.img` | Attach a card image |
| `--cart Game.crt` | Put a cartridge in the slot — 32 KB ROM, or a 128 KB to 1 MB [Flash Cart](/assembly/flash-carts) |
| `--cart-save Game.sav` | Where a flash cart's writes go. The default is the image's name with `.sav` |
| `--no-cart-save` | Discard a flash cart's writes when it stops |
| `--console video` | Use the video screen instead of the serial console |
| `--screenshot shot.png` | Save the last picture on the screen when it stops (with `--console video`) |
| `--freq 2` | Run the CPU at 2 MHz |
| `--timeout 30s` | Stop after a while, whatever happens |

`--vdp` picks the BIOS even when there's no screen: a serial console has no
video card fitted, but the machine still boots the BIOS that goes with the card
you named.

There's a debugger in there too — breakpoints, single-stepping, memory
watching, screenshots — which the [cross-development
chapters](/crossdev/debugging) of this guide use heavily. A snapshot of a
machine remembers which video card it had, and loads only on that card.
