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

## The registers, if you want them

| | |
|---|---|
| `SC_DATA` `$9000` | Read a received byte, write one to send |
| `SC_STATUS` `$9001` | Read: bit 7 set means this chip caused the interrupt |
| `SC_RESET` `$9001` | Write anything to reset the chip |
| `SC_CMD` `$9002` | Receive interrupts, and the RTS line |
| `SC_CTRL` `$9003` | Baud rate and framing — `$1F` is 19200 8-N-1 |

The Kernal's interrupt handler does the flow control for you: when the ring
buffer gets close to full it raises RTS to ask the other end to stop, and drops
it again once `Chrin` has drained things. Talk to `SC_CMD` yourself and you are
taking that over.

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
