# Serial and a terminal

The DB9 socket turns any laptop into a second way in to your ACE. You don't
need it — the machine has its own keyboard and its own screen — but there are a
few things it makes much easier.

## Why you'd bother

- **Copy and paste.** Paste a program listing straight in instead of typing it.
- **Scrollback.** Look at what went past.
- **Saving to a real file** on your computer, so listings can live in a folder
  or in version control.
- **Mixed case.** The ACE's own keyboard types capitals only; text arriving
  over the serial line keeps whatever case it was written in.
- **No monitor needed.** With no VGA cable connected, the whole console —
  splash, prompt, everything — comes out here instead.

## Setting it up

A USB-to-serial adapter into the DB9 socket, and a terminal program on the
other end set to:

**19200 baud, 8 data bits, no parity, 1 stop bit** — usually written `8-N-1`.

Any terminal program will do: `screen` or `minicom` on Linux and macOS, PuTTY
or CoolTerm on Windows. On a Mac, `screen /dev/tty.usbserial-XXXX 19200` and
you're in.

Press reset on the ACE and you should see the splash appear in your terminal.

::: tip Esc versus your terminal
Some terminal programs swallow <kbd>Esc</kbd> for their own menus. If pressing
it doesn't stop a running program, use <kbd>Ctrl</kbd>+<kbd>C</kbd> instead —
it does the same job. See [The keyboard](/using/keyboard).
:::

Note that this is a *second* way in, not a replacement: the ACE's own keyboard
stays live the whole time, and both feed the same BASIC.

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

The [emulator](/using/emulator) has a paste button that does the same job
without any cable at all.

For anything bigger, [`bastok`](https://github.com/acwright/bastok) converts a
text listing into the compact form `LOAD` expects, so it transfers in a moment
rather than a line at a time.
