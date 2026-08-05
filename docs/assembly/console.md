# Console input and output

The console is wherever this machine's text goes and comes from. On your ACE
that is the screen and the keyboard. On a machine with no video card it is the
serial port. Your program does not need to know which.

## Out

| | |
|---|---|
| `Chrout` | Print the character in A |
| `PrintStr` | Print until the zero byte. Address in A (low) and Y (high) |
| `PrintCRLF` | Move to the start of the next line |
| `PrintDecU16` | Print a 16-bit number in decimal, no leading zeros. Low byte in A, high in X |

```asm
  lda #'?'
  jsr Chrout

  lda #<Prompt
  ldy #>Prompt
  jsr PrintStr

  lda #<1024                    ; the assembler splits the number for you
  ldx #>1024
  jsr PrintDecU16               ; prints 1024
  jsr PrintCRLF
```

`Chrout` handles the control codes: a carriage return returns the cursor, a
line feed moves it down, a backspace rubs out. If you want the raw character
put on the screen with no interpretation at all — a box-drawing character, say
— that is [`VideoChroutRaw`](/assembly/video).

## In

`Chrin` is the whole input side, and the important thing about it is that **it
never waits**:

```asm
  jsr Chrin
  bcc NothingYet                ; carry clear: no key had arrived
  ; carry set: A holds the character
```

Carry set means a character was waiting and is now in A. Carry clear means
there wasn't one, and your program carries on with whatever else it was doing.
That is what makes a game possible: you check for input once per frame instead
of stopping dead until someone types.

It also **echoes** what it hands you. The character is on the screen before
your program sees it, which is why the program below never prints the name it
just read.

### Reading a whole line

<<< @/../samples/assembly/greeting.asm{asm}

```
RUN
WHAT IS YOUR NAME? ADA
PLEASED TO MEET YOU, ADA!

OK
```

<Emulator
  sample="assembly/greeting"
  caption="Type a name and press Enter. Every character in that answer came back through Chrin."
/>

The loop is the shape you will write over and over: ask, poll, stop at the
carriage return, store everything else. The length check keeps a long answer
from running off the end of the buffer, and `stz Name,x` puts the zero on the
end that makes it a string.

## Where the keys actually come from

Every key — from the board's own keyboard, from a PS/2 keyboard, or down the
serial cable — arrives as an interrupt and is dropped into a 256-byte ring
buffer at `$0200`. `Chrin` takes one out. Nothing is lost while your program is
busy, up to a full buffer's worth.

Three routines let you at the buffer directly:

| | |
|---|---|
| `BufferSize` | How many characters are waiting |
| `ReadBuffer` | Take one, without the echo `Chrin` does |
| `WriteBuffer` | Put one *in* — which is how you fake typing |

```asm
  jsr BufferSize
  beq Idle                      ; nothing waiting, go and do something else
```

::: tip Draining the buffer
After a long pause your program may find a dozen keystrokes queued that the
player pressed while nothing was listening. A game loop usually wants the most
recent one, so read until `BufferSize` returns zero and keep the last.
:::

## Which console, and changing it

One byte at `$0306` decides where output goes: bit 0 clear means the screen,
set means the serial port. The Kernal sets it at power-on to whatever the
machine has, and `SetIOMode` and `GetIOMode` read and write it.

```asm
  jsr GetIOMode
  pha                           ; remember where output was going
  lda #1
  jsr SetIOMode                 ; force the serial port
  lda #<Report
  ldy #>Report
  jsr PrintStr
  pla
  jsr SetIOMode                 ; and put it back
```

That is how you send something down the cable on a machine that has a screen —
a debugging log, say, on the monitor you are not looking at. There is also
`SerialChrout`, which writes to the serial port directly without touching the
mode at all ([Serial](/assembly/serial)).

::: warning `Chrout` is fussier than the screen is
On its way to the screen, `Chrout` throws away every code from `$7F` upwards
and every control code except carriage return, line feed, backspace and bell.
The screen itself can show all 256 characters perfectly well — the box-drawing
ones, the accented ones, the blocks — you just have to put them there with
`VideoChroutRaw` instead. Down the serial port there is no such filtering:
every byte goes out as it is.
:::

Next: [drawing on the screen](/assembly/video).
