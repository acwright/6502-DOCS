<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const unlock = facts.f18a.unlock
const identity = facts.f18a.identity
</script>

# Turning it on

Write `$1C` to register 57. Then write `$1C` to register 57 again. That is the
whole unlock.

```
lda #$1C
sta $9C01        ; the value
lda #$B9         ; 57 | $80
sta $9C01        ; the register number
lda #$1C
sta $9C01
lda #$B9
sta $9C01
```

Nothing may come between the two. Any other register write cancels the sequence
and you start over.

## Why it looks like that

The TMS9918A has eight registers. When you hand it a register number it looks at
the low three bits and throws the rest away, so writing register 57 on a stock
chip writes **register 1** — the mode register, the one that holds the display
enable, the interrupt enable and half the mode bits.

That is the trick. Register 57 is the one register number that is guaranteed to
be visible on both chips, and `$1C` is a value chosen so that no working program
would ever put it there. In register 1, `$1C` means 4 KB of VRAM on a card with
16 KB, display blanked, interrupts off, and both mode bits set at once — an
illegal combination. It makes a real 9918A useless. Writing it twice in a row,
by accident, is not something that happens.

::: details Why there is a lock at all
The 9918A's datasheet says registers above 7 are reserved, and some software
wrote to them anyway. It never mattered, because the numbers were masked down
to 0–7 and landed harmlessly.

Then the F18A gave those numbers meanings. Software that had been scribbling
into nowhere for thirty years started scribbling into a bitmap layer. So the
card powers up locked, behaving exactly like the chip it replaces, and the only
way past that is a sequence no legacy program could produce.
:::

## The damage

Those two writes went into register 1 on a card without F18A mode. **The screen
is now blank.** Put register 1 back immediately, whether or not the unlock
worked:

```
lda #$D0         ; 16K, display on, interrupt off, text mode
sta $9C01
lda #$81         ; 1 | $80
sta $9C01
```

`$D0` is what the machine's own text mode uses. Restore it and a stock card
never knew anything happened.

This pattern — do the enhanced thing, then repair what it did to a card that
did not understand it — runs through the whole detection procedure. Two more
registers need the same treatment in a moment.

## Asking whether it worked

You cannot tell from the unlock itself. It writes and returns; there is nothing
to read back. The test everybody uses instead is to ask the card to run a
program, because only one of the two cards has anything to run it with.

Six bytes of TMS9900 machine code:

```
$3F00   04E0 3F00    CLR  @>3F00     ; erase this instruction
$3F04   0340         IDLE            ; and stop
```

Put those six bytes in VRAM at `$3F00`. Point the card's GPU at `$3F00`. Read
`$3F00` back.

If a GPU ran, the first byte is `$00` — the program deleted its own opcode. If
nothing ran, it is still `$04`, the top half of the `CLR` instruction, exactly
as you wrote it.

It is a lovely test: self-modifying code whose only output is its own absence,
and it works because a stock card has no way to fake it.

::: tip Where $3F00 came from
It is 256 bytes below the top of VRAM, which no display mode uses and no
Kernal routine touches. Any spare address does; this is the one everybody's
code uses, so it is the one to recognize.
:::

## Starting the GPU

Two registers hold the address to run from. Register 54 is the high byte,
register 55 the low byte — and **writing register 55 starts it**. There is no
separate go button. Set the high byte first, always.

```
lda #$3F
ldx #54
jsr SetVdpReg     ; high byte

lda #$00
ldx #55
jsr SetVdpReg     ; low byte — and away it goes
```

On a stock card those two are registers 6 and 7: the sprite pattern table
address and the screen colors. So a failed probe has now also moved your sprite
patterns and changed the colors of the screen. Put those back too.

## Which card is it

The probe tells you a GPU exists. Status register 1 tells you whose.

Reading it is a two-step, because a 9918A has one status port and the F18A has
sixteen status registers behind it. Write the number you want into register 15,
read the port, then **write 0 back into register 15**.

That last step is not optional. The machine's interrupt handling reads the
status port to find out what happened; leave the selection pointing at register
1 and it reads the wrong byte every frame.

<table>
<thead><tr><th>Value</th><th>What it is</th></tr></thead>
<tbody>
<tr v-for="v in identity.values" :key="v.value"><td><code>{{ v.value }}</code></td><td>{{ v.means }}</td></tr>
</tbody>
</table>

Bits 7–5 are the identity field, and `111` means F18A. Bit 3 is set when the
F18A behavior is coming from something that is not F18A silicon — which on an
ACE it is, because an ACE has a Pico9918. Both are F18A mode. The difference
matters for a handful of features, and each chapter says which.

## All of it together

<<< @/../samples/assembly/f18a-detect.asm{asm}

Run it and the machine tells you what it has:

```
VIDEO: TMS9918A, NO F18A MODE
```

or, on a card with the enhanced firmware:

```
VIDEO: F18A MODE ON A PICO9918
```

Four things in that program are worth pulling out.

**It checks for a card at all first.** `HW_PRESENT` says what the machine found
at power-on. Probing a slot with nothing in it wastes a hundred cycles and
prints nonsense. [What's fitted](/assembly/detection) is the chapter on this.

**Interrupts are off for the whole thing.** Every access to this card is a
*pair* of writes to one address — value then register, low byte then high byte.
Anything that gets between the two halves leaves the card holding one of them
and waiting for the wrong thing. `sei` around the block removes the entire
class of problem for the cost of one byte.

**The repair happens before the report, not after the success.** Registers 1, 6
and 7 go back whichever way the test came out. Written the other way around —
restore only on failure — the code is one branch shorter and leaves a stock
machine with a blank screen every time the branch is missed.

**It reads the identity only after the probe passed.** Register 15 is an
enhanced register. On a card that failed the probe there is nothing there to
select, and asking would just clobber register 7 again.

## Locking it again

<ul><li v-for="how in unlock.relock">{{ how }}</li></ul>

The middle one is the useful one. Writing a value with bit 7 set to register 50
puts every register back to its power-on default and relocks the card, which is
the quickest way to hand a clean machine back to BASIC when your program exits.
Your palette survives it — see [Colors](/f18a/color), where that turns out to
matter more than you would expect.
