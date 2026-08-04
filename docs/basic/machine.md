# Reaching the machine

BASIC is a program running on a 65C02, and it doesn't hide the fact. Six
keywords let you reach past it.

## Looking at memory

`PEEK(address)` reads one byte, 0 to 255. `POKE address, value` writes one:

```
POKE 2560, 42
PRINT PEEK(2560)
```

```
 42

OK
```

Addresses run from 0 to 65535. That's the whole map — RAM, the ROM that BASIC
itself lives in, and the hardware.

::: warning Poking at random
Some of that memory is BASIC's own working space, and writing to it will stop
the machine mid-sentence. It can't damage anything: press reset, or switch off
and on, and you're back. But whatever you'd typed is gone, so `SAVE` first.
:::

## Finding out what's fitted

At switch-on the machine looks for every card it knows about and records what it
found in one byte, at address 781. Each bit is one card:

| Bit | Value | Card |
|---|---|---|
| 7 | 128 | video |
| 6 | 64 | sound |
| 5 | 32 | keyboard and joysticks |
| 4 | 16 | serial |
| 3 | 8 | storage |
| 2 | 4 | clock |
| 1 | 2 | banked RAM, upper half |
| 0 | 1 | banked RAM, lower half |

<<< @/../samples/basic/whats-fitted.bas{basic}

On an ACE, that program prints everything on the list — an ACE has the lot.
It earns its keep on a machine you built yourself, and as the polite way for a
program to check before it uses something:

```
10 IF (PEEK(781) AND 64) = 0 THEN PRINT "NO SOUND CARD - PLAYING QUIETLY"
```

`MEM` prints the same byte in hex, along with the free memory and the current
disk, which is quicker to type when you just want a look:

```
MEM
```

```
 30718 BYTES FREE  HW=$FF
DISK 0

OK
```

## How much room is left

`FRE(0)` gives you the bytes available for variables, arrays and strings:

```
PRINT FRE(0)
```

```
 30718

OK
```

That's a freshly-started machine. Every program line, variable and array comes
out of it. The argument to `FRE` is ignored — `FRE(0)` is just how it's written.

## The extra RAM

Above the ordinary memory there's a window at address 32768 backed by banked
RAM, and `BANK n` chooses which bank shows through it:

```
BANK 1
POKE 32768, 42
BANK 0
PRINT PEEK(32768)
BANK 1
PRINT PEEK(32768)
```

```
 0
 42

OK
```

Same address, different bank, different byte. It's how you keep more data than
fits in one go — a map, a screen, a level — and swap between them.

## Calling machine code

`SYS address` calls machine code and comes back when it returns:

```
POKE 2560, 96
SYS 2560
```

96 is the byte for `RTS`, "return from subroutine", so that program calls one
instruction that does nothing but come straight back. It's not useful; it's the
smallest possible demonstration that the door is there.

What's on the other side of it is machine code you wrote yourself, and `SYS`
is how BASIC hands over to it.

## Straight into the Monitor

`BRK` drops you out of BASIC and into the machine-code Monitor:

```
BRK
```

```
6502 MONITOR v1.1
BRK AT $E9D1
PC=E9D3 A=00 X=FF Y=68 SP=FA ---B-IZC
.
```

The `.` is the Monitor's prompt. `X` there brings you back to BASIC with your
program still in memory. [The Monitor](/using/monitor) is the tour.

Next: [what to do when none of this works](/basic/debugging).
