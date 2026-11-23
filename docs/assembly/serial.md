# The serial port

A 6551 ACIA at `$9000`, running 19200 baud, eight data bits, no parity, one stop
bit. The Kernal sets it up at power-on and wires its receive interrupt into the
same ring buffer the keyboards use, so **incoming** serial needs nothing from
you: it arrives through [`Chrin`](/assembly/console) like any other typing.

Going out is where the choices are.

## Sending

| | |
|---|---|
| `Chrout` | Wherever the console is pointed |
| `SerialChrout` | Down the cable, whatever the console is doing |
| `SetIOMode` | Point the console at the cable, or back at the screen |

`SerialChrout` is the useful one on a machine with a monitor: your program keeps
printing to the screen, and sends a running commentary to a terminal on your
laptop at the same time.

```asm
  lda #<Trace
  ldy #>Trace
  jsr GetIOMode
  pha
  lda #1
  jsr SetIOMode                 ; console → serial
  jsr PrintStr                  ; ... so PrintStr goes down the cable
  pla
  jsr SetIOMode                 ; and back
```

There is no `SerialPrintStr`, which is why the mode gets flipped around
`PrintStr` like that. For a single character `SerialChrout` is simpler.

### Mirroring the screen

The third mode sends everything to both places. Bit 1 of `IO_MODE`,
`IO_MIRROR`, with bit 0 clear, keeps the console on the screen and sends every
character `Chrout` puts there down the cable as well:

```asm
  lda #IO_MIRROR                ; 2: the screen, copied to the serial port
  jsr SetIOMode
```

That is the serial mirror, which BASIC turns on with `POKE 774,2`;
[Serial and a terminal](/using/serial#the-serial-mirror) says what a terminal
sees with it on. Every boot, reset included, clears the bit. It does nothing
when bit 0 is set, since the serial port is the console already, or when
`HW_SC` says there is no serial card. Only `Chrout` is copied: `VideoChroutRaw`,
and anything else that writes to the video card directly, reaches the screen
alone.

The mirror never holds the screen up. It waits up to about 7.6 ms (at 1 MHz)
for the chip to take each byte; a byte the chip hasn't taken by then is dropped,
and bit 7 of `MIRROR_STALL` (`$0379`) is set. While that bit is set, each byte
gets one look at the chip and is dropped if the line is still stopped, and the
first byte the chip takes clears it. A terminal holding CTS high, or a card that
takes CTS from a cable with nothing on the end, therefore costs the terminal its
characters and costs the screen almost nothing. Over the input buffer's high mark the
mirror drops bytes as `SerialChrout` does, so a paste arriving at the same time
still lands. `XModemLoad` and `XModemSave` put `IO_MODE` back as they found it,
the mirror bit included.

With output that never pauses, the cable sets the pace: a byte takes about
520 µs at 19200 baud, so the console prints at most about 1,900 characters a
second with the mirror on.

## The registers, if you want them

| | |
|---|---|
| `SC_DATA` `$9000` | Read a received byte, write one to send |
| `SC_STATUS` `$9001` | Read: bit 7 set means this chip caused the interrupt |
| `SC_RESET` `$9001` | Write anything to reset the chip |
| `SC_CMD` `$9002` | Receive interrupts, and the RTS line — which carries the transmitter with it |
| `SC_CTRL` `$9003` | Baud rate and framing — `$1F` is 19200 8-N-1 |

The Kernal does the flow control for you: as the ring buffer fills, the
interrupt handler raises RTS to ask the other end to stop, and reading the
characters back out with `Chrin` drops it again once the buffer has drained.
Sending is tangled up in the same register — the bits that raise RTS switch the
transmitter off along with it — so the Kernal lowers the line again for as long
as each outgoing byte takes to leave. Talk to `SC_CMD` yourself and you are
taking all of that over, the transmitter included.

::: tip Changing the baud rate
Write a different framing byte to `SC_CTRL`. Both ends have to agree, and the
machine at the other end of the cable is usually the harder one to change —
which is why 19200 is the default and why nothing in these guides moves it.
:::

## Moving files: XModem

XModem is the protocol behind `LOAD` and `SAVE` when there is no card in the
machine, and it is available directly:

| | |
|---|---|
| `XModemLoad` | Receive. `XFER_PTR` = where to put it. On return `XFER_REMAIN` = how many bytes arrived |
| `XModemSave` | Send. `XFER_PTR` = the bytes, `XFER_REMAIN` = how many |

Both answer with the carry flag: clear worked, set failed.

```asm
  lda #<Incoming
  sta XFER_PTR
  lda #>Incoming
  sta XFER_PTR + 1
  jsr XModemLoad
  bcs TransferFailed
  ; XFER_REMAIN holds the byte count
```

Underneath it is the 1977 protocol, unchanged: 128-byte blocks, each with a
block number, its complement, and a one-byte checksum; the receiver starts the
conversation by sending `NAK` until a block arrives; every block is answered
`ACK` or `NAK`; the sender finishes with `EOT`. Because the receiver leads, the
order of operations at the two ends matters — start the receiving side first,
then the sending side, and the transfer begins on its own.

::: warning A transfer is not a background job
`XModemLoad` and `XModemSave` do not return until the transfer is over, one way
or the other. Nothing else in your program runs while a file is moving, and a
cable pulled halfway through is a retry loop followed by a set carry flag.
:::

Since blocks are 128 bytes and files rarely divide by 128, the last block is
padded. `XFER_REMAIN` counts the padding too — it is the number of bytes
*received*, not the length of the file that was sent. Anything that needs an
exact length carries its own header, which is what a `.prg` does with its first
two bytes.

## When there is no serial card

The Kernal checks. `HW_SC` in `HW_PRESENT` says whether the card is fitted, and
the console falls back to the screen when it is not. Guard your own transfers
the same way:

```asm
  lda HW_PRESENT
  and #HW_SC
  beq NoCable
```

Next: [the clock and the bytes that last](/assembly/clock).
