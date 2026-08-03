# Serial & XModem

## The connection

19200 baud, 8 data bits, no parity, 1 stop bit — `8-N-1` (`Kernal.asm:793`:
`lda #$1F ; 8-N-1, 19200 baud`). Connect a USB-to-serial adapter and any
terminal program at that setting: screen, minicom, PuTTY, CoolTerm, or the
emulator's own headless serial console — every code sample on this entire
site runs against exactly that console, not a simulation of it. See
[Using the emulator](/using/emulator).

With no video card fitted, the BIOS routes its whole console — splash,
`OK` prompt, everything — to this same serial connection. A serial terminal
is a complete way to use any machine in the family, not just a fallback.

## `LOAD`/`SAVE` with no filename

[Storage](/using/storage) covers `LOAD "name"` and `SAVE "name"` against a
CompactFlash card. Drop the filename entirely and the same statements switch
to **XModem over the serial line** instead — the file transfer protocol, not
the disk. RUN-verified: typing bare `LOAD` at the prompt —

```
LOAD
XMODEM RX READY
```

— prints that line immediately and then waits, ready for your terminal
program to start an XModem send. Bare `SAVE` is the mirror image and prints
`XMODEM TX READY`, waiting for your terminal to start a *receive*. Both
strings are literal ROM text (`Kernal.asm:3014` and `:3016`).

## The ~60-second window

The BIOS doesn't wait forever for a terminal to respond: `XMODEM_STARTRETRY`
is 60 (`BIOS.inc:131`, commented `Retries waiting for initial connect
(~60s)` in the source itself) — after that many unanswered retries with no
transfer started, it gives up. Once a transfer is underway, a shorter
per-block retry budget (`XMODEM_MAXRETRY`, 10) covers a single dropped or
garbled block before the whole transfer aborts.

## What's RUN-verified here and what's GREP-only

This chapter draws a real line, on purpose: `LOAD`/`SAVE` switching to XModem
mode is RUN-verified above — that's an observable console message, checked
against the real emulator. The **XModem wire protocol itself** — 128-byte
blocks, checksums, `ACK`/`NAK`/`CAN`, the retry counters — is read directly
from `Kernal.asm`'s `XModemLoadImpl`/`XModemSaveImpl` (GREP), not
re-implemented and re-tested here. It's already exercised by `6502-BIOS`'s
own test suite; this site borrows that source as its authority rather than
duplicating a protocol implementation just to test documentation.

<PlaceholderImage
  label="XModem handshake"
  caption="A sequence diagram of the RX READY / NAK / SOH-block / ACK / EOT handshake, once Phase 8 authors the family's hand-drawn SVGs."
/>
