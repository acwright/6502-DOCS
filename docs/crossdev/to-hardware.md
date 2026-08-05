# Onto real hardware

Your program runs in the emulator. Here are the four ways to get it onto an ACE,
in the order most people reach for them.

| Way | You need | Good for |
|---|---|---|
| [Memory card](#the-memory-card) | A CompactFlash card and a reader | Everything, most of the time |
| [Serial cable](#over-the-serial-cable) | A USB-to-serial adapter | Iterating without moving a card |
| [Wozmon paste](#the-wozmon-paste) | Just the cable | Small machine-code experiments |
| [EEPROM](#burning-a-cartridge) | A TL866-family programmer | Cartridges |

## The memory card

Build an image with `cffs`, write it to the card, put the card in the ACE.

```
cffs create disk.img --size 1M
cffs add disk.img COUNT.PRG
cffs list disk.img
```

```
Created disk.img (1,048,576 bytes, 2,048 sectors, 1 disk)
Added COUNT.PRG to disk 0 of disk.img
Disk 0
Name          Size     Start  Sectors
────────────  ───────  ─────  ───────
COUNT.PRG          49      1        1
```

The card's directory holds eight characters plus a three-character extension,
and a longer name is refused rather than quietly shortened:

```
Error: Invalid filename: name part must be 1-8 characters, got "COUNTDOWN"
```

`--name` renames a file on the way in, so your source tree can call things
whatever you like:

```
cffs add disk.img build/countdown.prg --name COUNT.PRG
```

Try the image before you write it to anything:

```
6502 run --cf disk.img
```

```
DIR
DISK 0
COUNT   .PRG 49

LOAD "COUNT.PRG"
RUN
```

Then write `disk.img` to the card with whatever your operating system uses for
disk images (`dd`, Raspberry Pi Imager, balenaEtcher — it is a raw image, not a
filesystem your computer knows). Card in the ACE, and `DIR` shows the same
listing.

A card holds up to 256 of these one-megabyte disks; `--disks 32` builds a bigger
image, `--disk 3` puts a file on a particular one, and `DISK 3` on the machine
selects it. [Storage](/using/storage) covers the model from the machine's side.

::: tip Keep the image in the build, not in the repository
`make cf` rebuilds the image from the current program every time. A disk image
checked into version control is a 1 MB binary that goes stale immediately.
:::

## Over the serial cable

With a terminal already connected — [Serial and a terminal](/using/serial) sets
that up — you can push a program down the wire without touching the card.

On the ACE:

```
LOAD
XMODEM RX READY
```

Then start an XModem *send* in your terminal program and pick your `.prg`. The
machine takes it, and `RUN` runs it.

Going the other way, `SAVE` with no filename gives you `XMODEM TX READY` and you
start an XModem receive. That is how you get a listing you wrote at the machine
back onto your computer.

You have about a minute to start the transfer before the ACE gives up and
returns to the prompt — harmless, just type the command again.

This is the fastest loop for hardware work: edit on your computer, `make`, send,
run, repeat, with the card never leaving the slot.

## The Wozmon paste

The crudest path, and the one that needs the least. `bin2woz` turns your binary
into deposit lines:

```
bin2woz -a 0x0800 build/countdown.prg > countdown.woz
```

```
0800: 0A 08 0A 00 A5 32 30 36 30 00 00 00 A9 0A 85 40
0810: A5 40 A2 00 20 96 A0 20 93 A0 C6 40 D0 F2 A9 26
0820: A0 08 20 90 A0 60 4C 49 46 54 20 4F 46 46 0D 0A
0830: 00
```

Get to Wozmon — `J FF00` from the Monitor's dot prompt, not `G`, which lands you
in a Wozmon that ignores everything you type ([The Monitor](/using/monitor)
explains why). Paste the text into your terminal and the bytes go into memory a
line at a time. No protocol, no card, nothing to install on the ACE's side.

::: warning Don't paste a program you then want to RUN
Wozmon deposits bytes one at a time and has no idea how many arrived. BASIC
needs that count: it puts its variables immediately after the program image, and
without a length it walks the tokenized line chain instead — which ends at
`$080C`, right on top of your machine code. The first variable your program sets
overwrites itself.

`LOAD` and the Monitor's `L` both hand BASIC the byte count properly. Use
Wozmon for code you'll enter from the Monitor, not for programs you intend to
`RUN`.
:::

## Burning a cartridge

A cartridge is a 32 KB image for an AT28C256 EEPROM, and `make` in the
[`6502-CRT`](https://github.com/acwright/6502-CRT) template produces one:

```
cl65 -t none -C 6502.cfg -l Cart.lst -o Cart.crt Cart.asm
```

Try it first — this costs nothing and catches everything except a bad chip:

```
6502 run --cart Cart.crt
```

Then burn it:

```
minipro -p AT28C256 -w Cart.crt
```

Chip into the cartridge board, cartridge into the ACE, power on. The cartridge
supplies the reset vector, so it boots straight into your program with no splash
and no BASIC.

<Figure
  src="/images/photos/cartridge-burn.jpg"
  alt="A chip programmer with an EEPROM seated in its ZIF socket and a red LED lit, next to a finished cartridge board and its printed VC83 BASIC label."
  caption="Chip in the programmer, cartridge board waiting beside it. Once it's burned, the chip moves from one to the other."
/>

::: details Why the image is 32 KB when the cartridge is 16 KB
The chip is 32 KB and the machine only reads its top half — the cartridge
appears at `$C000–$FFFF`. The build pads the unused lower half with zeroes so
the file matches the chip, which is what the programmer expects.
[The linker config](/crossdev/linker#a-cartridge) is where that padding is set
up.
:::

## Onto somebody else's screen

There's a fifth destination, and it isn't hardware at all: a web page, where
anyone with a browser can play your program without owning a machine or a card
reader. It takes about six lines of HTML, and it lives with the rest of the
emulator in
[Putting your program on the web](/using/emulator#putting-your-program-on-the-web).

## Which to use

If you have a card reader, use the card: it's the least fiddly and it's how a
finished program gets distributed anyway. Add a serial cable when you find
yourself walking a card between two rooms. Keep `bin2woz` for the day you want
to poke sixteen bytes into a machine that has nothing else attached.

Next: [BASIC listings in the same workflow](/crossdev/basic).
