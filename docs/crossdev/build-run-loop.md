# Build, run, repeat

Here is a program. It is the one the next three chapters build on, and it is
about as small as a useful assembly program gets.

<<< @/../samples/crossdev/countdown.asm{ca65}

Save that over the template's `Program.asm`, or drop it into a clone of
[`6502-PRG`](https://github.com/acwright/6502-PRG) as `countdown.asm`.

## Build it

```
cl65 -t none -C 6502.cfg -o build/countdown.prg countdown.asm
```

Forty-nine bytes. Have a look:

```
hexdump -C build/countdown.prg
```

```
00000000  0a 08 0a 00 a5 32 30 36  30 00 00 00 a9 0a 85 40  |.....2060......@|
00000010  a5 40 a2 00 20 96 a0 20  93 a0 c6 40 d0 f2 a9 26  |.@.. .. ...@...&|
00000020  a0 08 20 90 a0 60 4c 49  46 54 20 4f 46 46 0d 0a  |.. ..`LIFT OFF..|
00000030  00                                                |.|
```

The `2060` at the front is the BASIC stub — you can read it in the ASCII column.
The `LIFT OFF` at the back is the message. Everything between the two is your
countdown.

## Watch it run

```
6502 run build/countdown.prg
```

A window opens with the machine in it, the program already in memory. Type
`RUN`:

```
10
9
8
7
6
5
4
3
2
1
LIFT OFF

OK
```

The command doesn't come back until you close the window, which is exactly what
you want from a build step: assemble, look at it, close it, back to the shell.
`--detach` hands the terminal back right away if you'd rather.

That's the whole loop. Edit, `cl65`, `6502 run`, repeat.

## Run it without watching it

The same build, no window, wired to your terminal:

```
printf 'RUN\r' | 6502 run --headless --vdp picovdp --exit-on 'LIFT OFF' --timeout 20s build/countdown.prg
```

```
AC6502 BIOS v2.0
BASIC v2.0 30671 BYTES FREE
RAM RTC CF SER VIA SID

OK
RUN
10
9
8
7
6
5
4
3
2
1
LIFT OFF
```

Three things in that command earn their place:

**`--vdp picovdp`.** The video card, and with it the ROM: the PICOVDP boots the
BIOS this guide describes. Name it rather than relying on the emulator's
default, which is a different card.

**`--exit-on`.** Stop when the console prints something you named, rather than
after a duration you guessed. This is what makes the run take 53 milliseconds
instead of however long you would have waited.

**`--timeout`.** Always. A program that hangs should fail your build, not wedge
it. You get exit code `2` and can act on it.

## Exit codes

Branch on these rather than on the text:

| Code | Meaning |
|---|---|
| `0` | Ran to completion |
| `1` | Usage error, or the program couldn't be loaded |
| `2` | Timed out |
| `130` | You interrupted it |

And for a machine-readable summary, add `--json`, which prints one line to
stderr on exit:

```json
{"reason":"exit-on","cycles":338000,"wallMs":53,"output":"\r\nAC6502 BIOS v2.0\r\nBASIC v2.0 30671 BYTES FREE\r\nRAM RTC CF SER VIA SID\r\n\r\nOK\r\nRUN\r\n10\r\n9\r\n8\r\n7\r\n6\r\n5\r\n4\r\n3\r\n2\r\n1\r\nLIFT OFF\r"}
```

`reason` tells you *why* it stopped — `exit-on`, `timeout`, `max-cycles` — which
is more useful than the exit code alone when a run can end several ways. With
`--exit-on`, `output` carries everything the machine printed on the way, so a
script can check it without capturing the console separately.

## Useful ways to start a machine

| | |
|---|---|
| `6502 run build/game.prg` | A program at `$0800` |
| `6502 run --cart build/game.crt` | A cartridge |
| `6502 run --bin 0x7F00=data.bin` | Raw bytes at an address, written before boot |
| `6502 run --cf disk.img` | With a memory card attached |
| `6502 run --rom custom.bin` | With your own ROM in place of the BIOS |
| `6502 run --freq 2` | At 2 MHz |
| `6502 run --pause` | Stopped at the reset vector, for attaching a debugger |

`--headless` composes with all of them.

::: tip Making a run reproducible
`--rtc 2026-01-01T00:00:00` pins the clock chip, which is the only part of the
machine that reads your computer's clock. With it fixed, the same ROM and the
same input produce the same bytes on your laptop and on a build server. It is
worth putting in every scripted run you write.
:::

## When the machine won't take your input

One failure has caught everyone at least once: you pipe a command in, and the
machine never echoes it.

Input sent before the BIOS has finished probing its hardware arrives at a serial
port with nothing reading it. The byte sits in the receive register and blocks
everything queued behind it, so the console looks dead. The fix is to wait for a
prompt rather than firing and hoping:

```
6502 run --headless --vdp picovdp --input-after 'OK' --timeout 20s build/countdown.prg < commands.txt
```

Next: [when the program doesn't do what you meant](/crossdev/debugging).
