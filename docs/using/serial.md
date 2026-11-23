# Serial and a terminal

The DB9 socket turns any laptop into a second way in to the ACE. You don't
need it — the machine has its own keyboard and its own screen — but there are a
few things it makes much easier.

## Why you'd bother

- **Copy and paste.** Paste a program listing straight in instead of typing it.
- **Scrollback.** Look at what went past.
- **Saving to a real file** on your computer, so listings can live in a folder
  or in version control.
- **Mixed case.** The ACE's own keyboard types capitals only; text arriving
  over the serial line keeps whatever case it was written in.
- **No video card needed.** With no video card fitted, the whole console —
  header, prompt, everything — comes out here instead.

## Setting it up

A USB-to-serial adapter into the DB9 socket, and a terminal program on the
other end set to:

**19200 baud, 8 data bits, no parity, 1 stop bit** — usually written `8-N-1`.

Any terminal program will do: `screen` or `minicom` on Linux and macOS, PuTTY
or CoolTerm on Windows. On a Mac, `screen /dev/tty.usbserial-XXXX 19200` and
you're in.

What happens next depends on whether the ACE has a screen. With no video card
fitted, press reset and the header appears in your terminal, and the whole
session happens there. With one, the console stays on the screen: what you type
in the terminal still reaches BASIC, but the answers appear on the ACE's own
display. Type `PRINT 2+2` in the terminal and watch it land. To have the
answers in the terminal as well, turn on [the serial mirror](#the-serial-mirror).

::: tip Esc versus your terminal
Some terminal programs swallow <kbd>Esc</kbd> for their own menus. If pressing
it doesn't stop a running program, use <kbd>Ctrl</kbd>+<kbd>C</kbd> instead —
it does the same job. See [The keyboard](/using/keyboard).
:::

Note that this is a *second* way in, not a replacement: the ACE's own keyboard
stays live the whole time, and both feed the same BASIC.

## The serial mirror

With a video card fitted, BASIC answers on the screen, so a terminal can type
to the ACE but can't see what it says back. One `POKE` changes that:

```
POKE 774,2
```

From then on, everything the console prints on the screen goes down the serial
line as well, and the `OK` after the `POKE` is the first thing to arrive in the
terminal. `POKE 774,0` turns it off again, and so does every boot: reset and
power-on both leave it off. A program that should always report to a terminal
turns it on in its first lines:

<<< @/../samples/basic/mirror.bas{basic}

The table appears on the screen, and the terminal shows the same lines, with
the `OK` after them:

```
SEVEN TIMES TABLE
 1 X 7 = 7
 2 X 7 = 14
 3 X 7 = 21
 4 X 7 = 28
 5 X 7 = 35

OK
```

The terminal gets a copy of everything the console prints: what `PRINT` and
`LIST` print, error messages, the `OK` prompt, the echo of every line typed at
either keyboard or in the terminal, Wozmon, and the report a `BRK` prints. It
does not get what is drawn without printing: `CLS`, `LOCATE`, `COLOR`, `VPOKE`
and the graphics statements reach the screen and nothing else. So the terminal
holds a record of what was printed, not a picture of the screen. Text that
`LOCATE` placed in the middle of the screen arrives in the terminal straight
after whatever was printed before it.

The `POKE` does nothing on a machine with no video card, where the terminal is
the console already, or on one with no serial card. The mirror is new in BIOS
2.2, and in 1.8 on the machines with the older video card; an older BIOS
ignores the `POKE`.

**It slows a program that does nothing but print.** At 19200 baud each
character takes about half a millisecond to go down the cable, so with the
mirror on the console prints at most about 1,900 characters a second. BASIC
printing whole lines to the screen alone manages about 3,300 a second, so a
loop that only prints runs about 1.7 times slower. A program that prints a line
now and then between other work hardly notices.

**A terminal that stops the line never stops the screen.** A terminal holding
the ACE off with flow control, or a serial card wired to take its CTS from a
cable with nothing at the other end, stops the serial chip sending. If the chip
hasn't taken a character after about 7.6 milliseconds, the mirror drops that
character and carries on with the screen. While the line stays stopped, each
character after it gets one try and is dropped if the line is still stopped,
so the screen keeps its speed. The terminal misses those characters; the screen
has all of them. The mirror also drops characters while a paste is filling
BASIC's input buffer, so the paste still arrives whole.

**A file transfer keeps it.** `LOAD`, `SAVE`, `BLOAD` and `BSAVE` over the
cable use the serial line for the transfer, and put the mirror back as it was
when the transfer ends.

## Moving files over the cable

`LOAD` and `SAVE` with no filename don't touch the memory card at all. They
transfer over the serial line instead, using **XModem** — the file transfer
protocol every terminal program has had since the 1980s.

To send a program **to** the ACE, type:

```
LOAD
XMODEM RX READY
```

The machine is now waiting. In your terminal program, start an XModem send and
pick the file. It arrives, and you're back at `OK` with the program loaded.

To pull one **off** the ACE, type `SAVE` with no filename instead. You'll get
`XMODEM TX READY`, and you start an XModem *receive* in your terminal.

Either way you've got about a minute to get the transfer started before the
ACE gives up and hands you the prompt back. If that happens, nothing is
harmed — just type the command again.

<Figure
  src="/images/photos/serial-terminal.jpg"
  alt="A CoolTerm window connected over serial, showing the BIOS banner, BASIC's own banner, and PRINT 2*2 answered with 4."
  caption="A terminal on the other end of the cable: the same banners and the same OK prompt the ACE's own screen shows."
/>

<Diagram
  name="xmodem"
  caption="The receiver starts it, and every block is answered. That is why nothing happens until both ends are ready — and why a bad cable shows up as a transfer that never begins rather than a file that arrives wrong."
/>

## Writing listings on your computer

Once you've got a terminal, the comfortable way to work on anything longer than
a screenful is to write it in a text editor on your computer and paste it in.
Type it as plain text with the line numbers in place, select all, paste. BASIC
reads it exactly as if you'd typed it — and it's a good deal faster than
typing forty lines by hand.

::: warning Turn on hardware flow control
A paste arrives faster than BASIC can store the lines, so the ACE tells the
other end to wait: when the characters it hasn't read yet fill most of its
buffer, it raises the serial port's RTS line, and lowers it again once it has
caught up. A terminal set to **RTS/CTS** (hardware) flow control pauses on that
signal, and a long paste arrives whole. With flow control off, a long paste
quietly loses lines. The [emulator](/using/emulator) can't be that terminal:
a serial port it opens is wired to the *emulated* ACE, so a real board on the
other end is talking to a second ACE, not to you.
:::

The [emulator](/using/emulator) has a paste button that does the same job
without any cable at all.

For anything bigger, [`bastok`](https://github.com/acwright/bastok) converts a
text listing into the compact form `LOAD` expects, so it transfers in a moment
rather than a line at a time.
