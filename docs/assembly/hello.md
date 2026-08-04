# Hello world

Twelve lines, of which four are the program.

<<< @/../samples/assembly/hello.asm{asm}

Assemble it, load it, run it:

```sh
cl65 -t none -C 6502.cfg -o hello.prg hello.asm
6502 run hello.prg
```

```
LOAD "HELLO.PRG"
RUN
```

```
HELLO FROM ASSEMBLY

OK
```

## What each part is

**`.setcpu "65C02"`** tells the assembler which processor it is writing for, so
that `bra` and `stz` are allowed.

**`.include "6502.inc"`** brings in every Kernal routine, hardware register and
useful constant by name. It comes with the
[program template](/crossdev/templates), and it is why the program says
`jsr PrintStr` instead of `jsr $A090`.

**`.segment "CODE"`** says where this goes. The linker configuration puts
`CODE` at `$0800`, which is where a program is loaded.

**The twelve mysterious bytes** are a tokenized BASIC line — `10 SYS 2060` —
sitting at the very front of the file. `LOAD` brings the whole thing into
memory at `$0800`; `RUN` runs the one BASIC line it finds there; `SYS 2060`
jumps to `$080C`, the byte immediately after the stub. That is your entry
point, and it is why a machine-code program is started with a BASIC command.

**`Start`** is the code. A pointer to some text, in A and Y, then a call.

**`rts`** returns to BASIC, which prints `OK` and waits for you again.

## The string

```asm
Message:
  .byte "HELLO FROM ASSEMBLY", CHAR_CR, CHAR_LF, $00
```

`PrintStr` prints until it hits a zero, so every string ends with one. `CHAR_CR`
and `CHAR_LF` are the carriage return and line feed that move the cursor down
and back — the same pair a terminal wants, and what BASIC's `PRINT` sends at
the end of a line. Leave them out and the next thing printed continues on the
same line, which is sometimes exactly what you want.

## Where it went

The machine was fully awake before your first instruction ran. The Kernal
probed and started every card, chose a console, turned interrupts on, and drew
the splash. You inherit all of it: the keyboard is live, the screen is in text
mode, the clock is ticking.

That is why this program is four lines and not four hundred.

::: tip It runs on both consoles
`Chrout`, and so `PrintStr`, sends output wherever this machine's console goes
— the screen if there is a video card, the serial port if there isn't. The same
file prints on an ACE with a monitor and on a machine running headless down a
cable, with nothing changed and nothing detected by you.
:::

## Now change it

Print your own name. Then print it twenty times, by wrapping the two lines in a
loop:

```asm
  ldx #20
Again:
  phx
  lda #<Message
  ldy #>Message
  jsr PrintStr
  plx
  dex
  bne Again
  rts
```

`PrintStr` keeps X for you, so the `phx`/`plx` pair here is belt and braces —
but getting into the habit of pushing what you care about is cheaper than
finding out the hard way which routine borrows which register.

Next: [console input and output](/assembly/console) properly.
