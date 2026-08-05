<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const slots = facts.hardware.slots
</script>

# What's fitted

An ACE has everything. That is what the machine is: a complete computer on
one board, video, sound, storage, serial, clock, sticks and banked RAM all
present.

Your program will also run on a COB with three cards in it, or on an emulator
someone started headless, or on a machine whose owner has pulled the sound card
to fix something. One byte tells you which of those you are on, and checking it
costs four instructions.

## The byte

At power-on the Kernal walks the eight hardware slots, works out what answers,
and writes the result to `HW_PRESENT` at `$030D`. One bit per slot, set means
fitted.

<table>
  <thead><tr><th>Bit</th><th>Mask</th><th>Slot</th><th>What's there</th></tr></thead>
  <tbody>
    <tr v-for="s in slots" :key="s.symbol">
      <td>{{ s.bit }}</td>
      <td><code>{{ s.symbol }}</code></td>
      <td>{{ s.slot }}</td>
      <td>{{ s.chip }}</td>
    </tr>
  </tbody>
</table>

```asm
  lda HW_PRESENT
  and #HW_SID
  beq NoSound                   ; play it silent, then
```

The same byte is what `MEM` prints as `HW=$xx` from BASIC, and what
`PEEK(781)` reads.

## The program that lists them

<<< @/../samples/assembly/inventory.asm{asm}

On a complete ACE:

```
WHAT THIS MACHINE HAS
BANKED RAM, LOW     YES
BANKED RAM, HIGH    YES
CLOCK               YES
MEMORY CARD         YES
SERIAL PORT         YES
KEYBOARD AND STICKS YES
SOUND               YES
VIDEO               YES
```

<Emulator
  sample="assembly/inventory"
  caption="The same eight questions, asked of a machine with every card fitted."
/>

A mask table and a name table indexed by the same counter is all it takes, and
the padding in the names is what makes the column line up without any
formatting code.

## Degrade like the Kernal does

The ROM's own habit is worth copying, because it is what makes the same ROM
work across the whole family:

- **Sound** — no card, no noise, no error. A game that beeps on a hit keeps
  playing.
- **Video** — no card, and the console goes to the serial port instead. The
  drawing routines return without doing anything.
- **Storage** — no card, and the load and save calls come back with the carry
  set. Nothing hangs.
- **Console** — no video *and* no serial is the one case the machine cannot
  survive, because there is nothing to talk to. It stops at power-on.

The pattern in your own code: **check once at the start for what you must have,
and check per-call for what you can do without.**

```asm
Start:
  lda HW_PRESENT
  and #HW_VID
  bne HaveScreen
  lda #<NeedsAScreen            ; say so, on whatever console exists
  ldy #>NeedsAScreen
  jsr PrintStr
  rts
HaveScreen:
```

## Which ROM am I on?

`KernalVersion` gives the major version in A and the minor in X. If your program
uses something a particular release added, ask:

```asm
  jsr KernalVersion             ; A = major, X = minor
  cmp #1
  bcc TooOld
  bne NewEnough
  cpx #5
  bcc TooOld
NewEnough:
```

There are three version numbers in the one ROM, and they move independently:
the BIOS as a whole, BASIC, and the Monitor. `KernalVersion` reports the first.

::: tip The DIP switches turn cards off
The ACE has an eight-way switch bank that enables and disables each I/O
section, meant for fault-finding. A switched-off card is invisible to the
power-on probe, so it reads exactly like a card that is not there. That makes
your detection code testable on real hardware without unplugging anything —
see [The ACE](/the-ace).
:::

Next: [writing a cartridge](/assembly/cartridges).
