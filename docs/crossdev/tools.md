# The tool belt

Six tools. One is required, one you will want within the hour, and the rest
solve a specific problem each — install those when you hit the problem.

| Tool | For | Needed |
|---|---|---|
| [cc65](/crossdev/cc65) | Assembling and linking | Always |
| `6502` | Running your build without hardware | Nearly always |
| `bastok` | BASIC text ⇄ the tokenized form the machine loads | Writing BASIC in an editor |
| `cffs` | Building CompactFlash images | Getting files onto a card |
| `bin2woz` | Turning a binary into something you can paste over serial | No card, no cable adapter |
| `minipro` | Burning EEPROMs | Making cartridges |

## The `6502` command

The emulator's desktop app installs it: **Settings → Command Line → Install**.
That is the whole installation — the CLI lives inside the app, so the two can
never drift apart in version.

```
6502 --version
```

```
2.6.4
```

If you don't have the app yet, it's on the
[releases page](https://github.com/acwright/6502-EMULATOR/releases), and
[The emulator](/using/emulator) covers what it does with a window open. Here it
is a build tool: it boots your program, prints what the program printed, and
exits with a status.

```
6502 run --help
6502 dbg --help
```

Those two are worth reading once, early. Everything in the next six chapters is
in them.

## bastok

Converts a BASIC listing you typed in a text editor into the compact tokenized
image the machine's `LOAD` expects — and back again, which is what makes
listings diffable.

```sh
npm install -g bastok
```

```
bastok game.txt          # text → game.prg
bastok game.prg          # program → game.txt
bastok --tokens          # print the token table
```

It works out the direction from the file extension. [BASIC from your
editor](/crossdev/basic) is the chapter that uses it.

## cffs

Builds the disk images the ACE's CompactFlash card holds — up to 256 disk banks
of a megabyte each, matching what `DISK n` selects on the machine.

```sh
npm install -g cffs-image-tool
```

```
cffs create disk.img --size 1M
cffs add disk.img GAME.PRG
cffs list disk.img
cffs extract disk.img GAME.PRG recovered.prg
```

The package is called `cffs-image-tool`; the command it installs is `cffs`.
Write the image to a real card with your operating system's usual disk writer,
and the ACE reads it. See [Onto real hardware](/crossdev/to-hardware).

## bin2woz

Turns a binary into `ADDR: XX XX XX` deposit lines — the format Wozmon
understands. Paste them into a terminal and the bytes land in memory, with no
card and no file transfer protocol involved.

```sh
npm install -g bin2woz
```

```
bin2woz -a 0x0800 build/countdown.prg > countdown.woz
```

```
0800: 0A 08 0A 00 A5 32 30 36 30 00 00 00 A9 0A 85 40
0810: A5 40 A2 00 20 96 A0 20 93 A0 C6 40 D0 F2 A9 26
0820: A0 08 20 90 A0 60 4C 49 46 54 20 4F 46 46 0D 0A
0830: 00
```

It is the crudest way to move code and the one that needs the least. There is
[a catch](/crossdev/to-hardware#the-wozmon-paste) if you then want BASIC's `RUN`
to work.

## minipro

Drives a TL866-family programmer, for burning cartridge ROMs onto an AT28C256.

```sh
brew install minipro          # or your distribution's package
```

```
minipro -p AT28C256 -w Cart.crt
```

Only needed if you are making real cartridges. The emulator takes a `.crt` file
directly with `--cart`, so you can develop the whole thing without ever burning
a chip.

## The character editor

[TMS9918-EDITOR](https://acwright.github.io/TMS9918-EDITOR/) runs in a browser —
nothing to install. Draw 8×8 character patterns, lay out screens, animate
sprites, and export the result as `ca65` assembly, BASIC `DATA` statements, raw
binary, or a PNG. It knows all five of the video chip's modes and their color
rules, which is a great deal easier than working them out from a datasheet with
graph paper.

## Checking the lot

Paste this in and you have your answer for all six:

```sh
cl65 --version
6502 --version
bastok --version
cffs --version
bin2woz --version
minipro --version
```

Missing tools print "command not found", which is the point. For cc65 there is a
second question the version string can't answer — see
[Don't trust the version string](/crossdev/cc65#don-t-trust-the-version-string).

Next: [clone a project that already works](/crossdev/templates).
