# Interrupts

Three things can interrupt the processor, and each of them jumps through a
pointer in RAM that you are allowed to change.

| Vector | Address | Fires when |
|---|---|---|
| `IRQ_PTR` | `$0300` | A card asks for attention — a key, a serial byte, a timer |
| `BRK_PTR` | `$0302` | Your program executes `BRK` |
| `NMI_PTR` | `$0304` | The non-maskable interrupt line is pulled |

At power-on the Kernal points all three at its own handlers. `IRQ_PTR` goes to
the routine that empties the serial port and the keyboards into the ring
buffer; `BRK_PTR` goes to the break report; `NMI_PTR` goes to an `rti`.

## What the machine's own handler does

Every time a key is pressed, a serial byte arrives, or the timer that
`SysDelay` uses runs out, the processor stops what it is doing and runs the
Kernal's interrupt handler. It:

1. Checks whether this was a `BRK` rather than a hardware interrupt, and if so
   hands over to whatever `BRK_PTR` points at.
2. Asks the serial port whether it has a byte; if it has, puts it in the ring
   buffer, and raises RTS if the buffer is filling up.
3. Asks the keyboard card the same about each of its two ports.
4. Returns.

None of that is optional — take it out and typing stops working. So the way to
add your own is to put yourself *in front of* it.

## Chaining

<Diagram
  name="irq-chain"
  caption="Your handler runs first and then hands on. Replace the Kernal's instead of chaining to it and the keyboard stops working."
/>

<<< @/../samples/assembly/ticker.asm{asm}

```
RUN
TYPE SOMETHING AND PRESS ENTER

HELLO
THE PROCESSOR WAS INTERRUPTED 6 TIMES

OK
```

<Emulator
  sample="assembly/ticker"
  caption="Type something and press Enter. The count is how many times your handler ran."
/>

Five letters and an Enter: six characters, six interrupts.

Three things in there are the whole technique.

**Save the old vector, install yours, put it back when you are done.** A program
that returns to BASIC leaving `IRQ_PTR` pointing into its own code will work
perfectly until the next thing loads over it.

**`sei` while you swap.** Two bytes have to change, and an interrupt arriving
between them jumps through half of each address.

**Push nothing.** This one is specific to this machine, and it is the one that
bites:

::: warning Your link must leave the stack exactly as it found it
The Kernal's handler works out whether it was called by `BRK` by reading the
saved status register off the stack **at a fixed depth** — past the three
registers it has just pushed itself. If your handler pushes anything before
jumping to it, that arithmetic lands on the wrong byte and every hardware
interrupt looks like a `BRK`, which stops your program with a break report it
never asked for.

So a chained handler either uses only instructions that touch no register —
`inc`, `dec`, `stz` on absolute addresses are the useful ones — or it saves and
restores everything it used before the `jmp`. It does not leave anything on the
stack.
:::

If you want to do real work in an interrupt, the way around that is to
**replace** rather than chain: take the vector entirely, do your work, push and
pull as much as you like, and end with `rti`. You then own the serial port and
the keyboards too — everything the Kernal's handler was doing. That is a
reasonable thing for a game to do; it is not a reasonable thing to do by
accident.

::: tip A handler starts in binary, with interrupts off
The processor sets **I** and clears **D** as it takes the vector, and it does
that *after* pushing the flags — so decimal mode cannot leak into your handler,
nothing else can interrupt it until you say so, and `rti` hands both flags back
exactly as the interrupted code left them. The `cld` that 6502 handlers open
with is not needed here.
:::

## Where interrupts come from

The keyboard card's VIA is the busiest source: one interrupt per key, on either
port. The serial chip raises one per received byte. The same VIA's timer 1 is
what `SysDelay` counts on, and the clock card can be set to interrupt at a
chosen time.

The video card can interrupt too — at the end of every picture, at a chosen
line of the screen, or when sprites overflow or collide — though it never does
until a program asks it to.

All of them arrive on the same line and land in the same handler, which is why
a handler's first job is always to ask each chip "was it you?".

```asm
MyHandler:
  lda GPIO_IFR                  ; the card's interrupt flag register
  and #GPIO_INT_CB1
  beq NotMine
  ; ... it was, deal with it — reading the port clears the flag
NotMine:
  jmp (Chain)
```

::: tip A flag you do not clear fires for ever
Every source has to be told it has been dealt with, and how depends on the
chip: reading the port clears the keyboard flags, reading the data register
clears the serial one, writing the timer's latch clears the timer's. Miss one
and the processor spends the rest of its life in your handler.
:::

## The video card's interrupts

The card can interrupt at four moments: when it finishes drawing a picture —
sixty times a second — when it reaches a chosen line of the screen, when too many
sprites share a line, and when two sprites touch. It does none of them until a
program sets the matching bit of its `IRQEN` register.

Talking to the card from a handler has a trap the other chips don't. Every
command to the card is *two* writes, and the Kernal and BASIC are sending those
all the time, with interrupts on. A handler that used the same addresses could
arrive between the two halves of one, and both would be garbled. So the card
has a second set of addresses, **port B** at `$9C02`–`$9C03`, that the Kernal
never touches. A handler that uses port B can't collide with anything, and
there is no need to turn interrupts off around video work.

This program counts the pictures the card draws in one second:

<<< @/../samples/assembly/frames.asm{asm}

```
RUN
COUNTING PICTURES FOR ONE SECOND
60 PICTURES

OK
```

<Emulator
  sample="assembly/frames"
  caption="A second of the video card's interrupts, counted by a handler that never touches the Kernal's side of the card."
/>

Four details make it work.

**The handler reads `STAT1`.** Port B's status address is set to show status
register 1, which says which of the card's interrupts are waiting — bit 0 for
the end of a picture — and reading it is also how the handler tells the card it
has been dealt with. It clears nothing the foreground might be waiting for.

**It pushes A and pulls it again before chaining.** That is the rule from the
warning above, kept: the stack is as the processor left it when the `jmp`
happens.

**The interrupt is switched on after the first thing is printed.** Bringing the
text screen up — which happens on the first output — sets `IRQEN` to zero, and
so does anything else that calls `InitVideo`. A program that uses the card's
interrupts switches them on after the screen is up, and again after anything
that puts text mode back.

**`VBANK` and `VINC` belong to both ports.** This handler never changes them. A
handler that does must put them back before it returns, because the Kernal's
next command on port A depends on them.

## `BRK`

`BRK` is a software interrupt, and on this machine it stops the program and
reports it:

```
BREAK $07 AT $0A04
A=2A X=03 Y=00 P=30 S=FB
```

The address is the `BRK` itself, `$07` is the byte after it — yours to use as a
breakpoint number — and the second line is every register as the `BRK` found
it, with `S` the stack pointer from before the processor pushed anything. Then
BASIC's prompt comes back, with the program in memory still there. That makes
`BRK` a breakpoint you can leave in a program and a debugging tool that needs no
debugger. [Reaching the machine](/basic/machine#when-machine-code-stops) has one
to run.

The registers stay behind after the report, for a program or for `PEEK`:

| Name | Address | Holds |
|---|---|---|
| `BRK_A`, `BRK_X`, `BRK_Y` | `$0313`–`$0315` | A, X and Y |
| `BRK_P` | `$0310` | The flags |
| `BRK_SP` | `$0316` | The stack pointer |
| `BRK_PCL`, `BRK_PCH` | `$0311`–`$0312` | The address the processor pushed: the `BRK` **plus two** |

If a program had taken the video card out of text mode, the report puts the
console back first, so it is always readable.

Point `BRK_PTR` at your own routine and you have caught it instead. The
processor has already pushed the status register and the return address, and
your handler needs to know that the address is the `BRK` **plus two**. A
[cartridge](/assembly/cartridges) has to: the report ends by going back to
BASIC, and a cartridge has no BASIC to go back to.

## `WAI`, if your assembler will let you

The W65C02S has an instruction that stops the processor until an interrupt
arrives. As a way to wait it is both instant to wake from and dramatically
cheaper than a polling loop:

```asm
  cli
Wait:
  wai                           ; sleeps here until something happens
  lda Flag
  beq Wait
```

It needs `.setcpu "W65C02"` and an assembler new enough to accept that —
[Installing cc65](/crossdev/cc65) has the details.

Next: [what's fitted](/assembly/detection).
