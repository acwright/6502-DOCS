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
buffer; `BRK_PTR` goes to the Monitor; `NMI_PTR` goes to an `rti`.

## What the machine's own handler does

Every time a key is pressed, a serial byte arrives, or the timer that
`SysDelay` uses runs out, the processor stops what it is doing and runs the
Kernal's interrupt handler. It:

1. Checks whether this was a `BRK` rather than a hardware interrupt, and if so
   hands over to the Monitor.
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

Five letters and an Enter: six characters, six interrupts.

Three things in there are the whole technique.

**Save the old vector, install yours, put it back when you are done.** A program
that returns to BASIC leaving `IRQ_PTR` pointing into its own code will work
perfectly until the next thing loads over it.

**`sei` while you swap.** Two bytes have to change, and an interrupt arriving
between them jumps through half of each address.

**Push nothing.** This is the one that is specific to this machine, and it is
worth reading twice.

::: warning Your link must leave the stack exactly as it found it
The Kernal's handler works out whether it was called by `BRK` by reading the
saved status register off the stack **at a fixed depth** — past the three
registers it has just pushed itself. If your handler pushes anything before
jumping to it, that arithmetic lands on the wrong byte and every hardware
interrupt looks like a `BRK`, which sends the machine into the Monitor.

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

## Where interrupts come from

The keyboard card's VIA is the busiest source: one interrupt per key, on either
port. The serial chip raises one per received byte. The same VIA's timer 1 is
what `SysDelay` counts on, and the clock card can be set to interrupt at a
chosen time.

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

## `BRK`

`BRK` is a software interrupt, and on this machine it lands in the Monitor with
every register on display. That makes it a breakpoint you can leave in a
program and a debugging tool that needs no debugger — `X` at the Monitor's dot
prompt gets you back to BASIC.

Point `BRK_PTR` at your own routine and you have caught it instead. The
processor has already pushed the status register and the return address, and
your handler needs to know that the address is the `BRK` **plus two**.

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
