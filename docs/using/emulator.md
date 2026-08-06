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

## The KIM has its own

Fit the [KIM keypad](/addons/kim) and you aren't running an ACE any more: the
Keypad Card's ROM replaces BASIC and the Monitor, and the video and keyboard
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
| **Speaker** | Mute and unmute |
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

## Putting your program on the web

You've written a game. You want to show it to somebody.

Posting the `.prg` won't do it — nobody is going to download a file and then go
looking for an emulator to open it in. What you want is a link that just plays.
The emulator has a second page for exactly that, `embed.html`, meant to sit
inside a page of yours:

```html
<iframe
  src="https://acwright.github.io/6502-EMULATOR/embed.html?prg=https://your-site.example/game.prg&autostart=1&autotype=RUN%5Cr"
  width="640" height="520"
  allow="autoplay; gamepad; fullscreen"
  style="border: 0"
></iframe>
```

That's the whole integration. `prg` is your program; `autostart` boots the
machine as the page opens; `autotype` types `RUN` once BASIC is up, so a visitor
gets a game rather than an `OK` prompt and a puzzle. `%5Cr` is how a `\r` — the
Enter key — survives being written in a URL.

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
…/embed.html?prg64=AQgLCAoAmSJIRUxMTyIAAAA&autostart=1&autotype=RUN%5Cr
```

Now the link *is* the game. Nothing is fetched, so it works from anywhere —
a comment box, a gist, a file on your desktop. The limit is URL length:
a few tens of kilobytes is comfortable, a card image is not.

It's what every machine on this site uses, which is why the pages still run
with no network.

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
