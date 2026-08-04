<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const map = facts.memoryMap
const kernalVars = map.ram.find((r) => r.name === 'Kernal variables')
const zeroPage = map.ram.find((r) => r.name === 'Zero page')
const slots = facts.hardware.slots

// The linker calls these KERNAL, CHARS, MONITOR and so on. A reader wants to
// know what they are.
const romNames = {
  KERNAL: 'The Kernal — jump table, then the routines behind it',
  CHARS: 'The character set',
  BASIC: 'BASIC',
  MONITOR: 'The Monitor',
  WOZMON: 'Wozmon',
  VECTORS: "The processor's NMI, reset and interrupt vectors"
}
const rom = map.rom.filter((r) => r.name !== 'ROM').map((r) => ({ ...r, label: romNames[r.name] ?? r.name }))
</script>

# The memory map in full

Sixty-four kilobytes of address space, and every one of them is already spoken
for. Here is who owns what.

## The whole thing at a glance

<table>
  <thead><tr><th>From</th><th>To</th><th>What's there</th></tr></thead>
  <tbody>
    <tr v-for="r in map.ram" :key="r.start">
      <td><code>{{ r.start }}</code></td><td><code>{{ r.end }}</code></td><td>{{ r.name }}</td>
    </tr>
    <tr>
      <td><code>{{ map.io.start }}</code></td><td><code>{{ map.io.end }}</code></td>
      <td>The eight hardware slots</td>
    </tr>
    <tr v-for="r in rom" :key="r.start">
      <td><code>{{ r.start }}</code></td><td><code>{{ r.end }}</code></td><td>{{ r.label }}</td>
    </tr>
  </tbody>
</table>

The bottom 32 KB is RAM, the top 24 KB is ROM, and the eight kilobytes between
them are where the cards live — one kilobyte each.

::: warning `$8000` is not memory
Reading or writing an address in the hardware window talks to a *chip*, not to
storage. A stray write there can change the screen mode, retune a voice, or
select a different bank of RAM. Everything in this range is described in
[What's fitted](/assembly/detection).
:::

## Zero page

The first 256 bytes, where every access is a byte shorter and a cycle faster.

| From | To | Whose |
|---|---|---|
| `$00` | `$39` | The Kernal's — pointers, filesystem and transfer state, Monitor scratch |
| `$3A` | `$FF` | **Yours.** 198 bytes. |

Which means it is yours *once your program is the thing running*. Underneath a
running BASIC the interpreter is using that space as it goes, so a BASIC
program that poked a value into zero page would find it gone a moment later.
Machine code loaded and started from BASIC is fine: BASIC is sitting still
while you run.

::: details What the Kernal keeps down there
<table>
  <thead><tr><th>Address</th><th>Name</th><th>What it's for</th></tr></thead>
  <tbody>
    <tr v-for="s in zeroPage.symbols" :key="s.symbol">
      <td><code>{{ s.address }}</code></td>
      <td><code>{{ s.symbol }}</code></td>
      <td>{{ s.description || '' }}</td>
    </tr>
  </tbody>
</table>
:::

<Diagram
  name="zero-page"
  caption="The Kernal has the first fifty-eight bytes. The other 198 are yours, and they are the fastest memory on the machine."
/>

## The rest of the low RAM

**`$0100–$01FF` — the stack.** 256 bytes, growing down from `$01FF`. BASIC
keeps its `FOR` and `GOSUB` frames here too, which is why deep nesting runs out
of memory rather than slowing down.

**`$0200–$02FF` — the keyboard ring buffer.** Keys and serial bytes land here
the moment they arrive, put there by the interrupt handler.
[`Chrin`](/assembly/console) takes them out again.

**`$0300–$03FF` — the Kernal's variables.** Interrupt vectors, the cursor, what
hardware was found, the current disk, the cartridge boot vector. The named ones
you are most likely to want are below.

**`$0400–$05FF` — BASIC's line buffers.** The raw line you typed and the
tokenized version of it.

**`$0600–$07FF` — the card sector buffer.** 512 bytes, and **any filesystem
call overwrites it**. It is tempting free memory when BASIC is not doing
anything, and it is a trap the first time your program saves a file.

**`$0800–$7FFF` — yours.** About 30 KB. A `.prg` loads at `$0800`; a BASIC
program lives there too, which is why the two cannot be resident at once.

## The Kernal's variables

<table>
  <thead><tr><th>Address</th><th>Name</th><th>What it's for</th></tr></thead>
  <tbody>
    <tr v-for="s in kernalVars.symbols" :key="s.symbol">
      <td><code>{{ s.address }}</code></td>
      <td><code>{{ s.symbol }}</code></td>
      <td>{{ s.description || '' }}</td>
    </tr>
  </tbody>
</table>

## The hardware window

Eight slots of one kilobyte each, from `$8000` to `$9FFF`, one per card.

<table>
  <thead><tr><th>Slot</th><th>From</th><th>To</th><th>What's there</th></tr></thead>
  <tbody>
    <tr v-for="s in slots" :key="s.symbol">
      <td>{{ s.slot }}</td>
      <td><code>{{ s.start }}</code></td>
      <td><code>{{ s.end }}</code></td>
      <td>{{ s.chip }}</td>
    </tr>
  </tbody>
</table>

<Diagram
  name="io-slots"
  caption="One kilobyte per slot, in the order the detection bits come in. A card that is not fitted leaves its slot reading nothing in particular — which is what HW_PRESENT is for."
/>

## The ROM

The first 256 bytes of the Kernal are the jump table — the only addresses in
the whole ROM you should ever write down. `$B800` upwards is the character set,
which is worth knowing about because you can read it, copy it, and change it
([The screen](/assembly/video)).

`$FF00` is Wozmon, Steve Wozniak's 256-byte monitor from the Apple I, kept
because it fits and because it is a lovely thing to have.

<Diagram
  name="memory-map"
  caption="The whole 64K, bottom to top. The bands are not to scale — at 64K in a page-height strip, zero page would be two pixels."
/>

<div class="card-link">

📄 **[Memory Map card](/cards/memory-map.html)** — the whole address space and
every I/O register on the board, on three printable pages.

</div>

Next: [the Kernal](/assembly/kernal) — the routines that live in that ROM.
