<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const gpu = facts.f18a.gpu
</script>

# The GPU

There is a second processor in an ACE, and it is inside the video card.

It is a TMS9900 — a 16-bit chip from 1976, the one in the TI-99/4A — with its
own RAM, direct access to VRAM and the palette and every VDP register, a
pixel-plotting instruction the original never had, and no interrupts to worry
about. You give it an address and it runs.

You have already used it. The detection probe in
[Turning it on](/f18a/unlocking) is a GPU program: six bytes that erase
themselves, which is how you find out the GPU is there.

## Why you would

The 6502 in an ACE runs at a few million cycles a second and has to do
everything: game logic, input, sound, and every byte that goes into the video
card, two writes at a time through one port.

The GPU is on the other side of that port. It reads and writes VRAM directly,
as memory, with 16-bit instructions. Anything that is *moving bytes around
inside the video card* is work it can take off you entirely:

- Clearing or filling a name table between levels.
- Plotting into the bitmap layer.
- Updating a sprite table from a list you handed it.
- Animating a palette.
- Anything you would have wanted on every scan line, which the 6502 cannot
  afford and this can.

And it can be told to do it **once per frame** or **once per scan line**,
automatically, without the 6502 being involved at all.

## Starting it

Two registers hold the address, and writing the low byte starts it running:

```
lda #$40
ldx #54
jsr SetVdpReg     ; high byte

lda #$00
ldx #55
jsr SetVdpReg     ; low byte — and it goes
```

<ul><li v-for="t in gpu.triggers" :key="t">{{ t }}</li></ul>

Status register 2 says whether it is still running, in bit 7. The other seven
bits of that register are yours: the GPU can put anything it likes there and
the 6502 can read it, which is the channel for *I finished*, *here is what I
found*, or a frame counter.

## What it can see

The GPU's address space is not the 6502's, and it is not quite VRAM either:

<table>
<thead><tr><th>Range</th><th>Size</th><th>What is there</th></tr></thead>
<tbody>
<tr v-for="r in gpu.memoryMap" :key="r.range">
  <td><code>{{ r.range }}</code></td><td>{{ r.size }}</td><td>{{ r.what }}</td>
</tr>
</tbody>
</table>

The first 16 KB is the same VRAM your 6502 code writes through the data port —
same bytes, reached directly. Above that is the interesting part: the palette
as memory, the VDP registers as memory, and the current scan line as a byte you
can read.

That last one is what makes a scan-line program possible. Wait for the beam to
reach a line, change a scroll register, wait again — inside the card, with no
interrupt and no 6502 cycles spent.

::: tip A Pico9918 has far more room
{{ gpu.picoMemoryNote }}

<table>
<thead><tr><th>Range</th><th>Size</th><th>What is there</th></tr></thead>
<tbody>
<tr v-for="r in gpu.picoMemoryMap" :key="r.range">
  <td><code>{{ r.range }}</code></td><td>{{ r.size }}</td><td>{{ r.what }}</td>
</tr>
</tbody>
</table>

Handy, and not portable. A program that assumes it will not run on a real F18A.
:::

## The instruction set

It is a 9900, so any 9900 assembler will assemble for it. Five instructions are
new:

<table>
<thead><tr><th>Instruction</th><th>Opcode</th><th>What it does</th></tr></thead>
<tbody>
<tr v-for="i in gpu.newInstructions" :key="i.name">
  <td><strong>{{ i.name }}</strong></td><td><code>{{ i.opcode }}</code></td><td>{{ i.what }}</td>
</tr>
</tbody>
</table>

Your assembler will not know their names. Emit them as data words inline —
`DATA >0C00` is `RET` — which is exactly as unpleasant as it sounds and exactly
what everyone does.

`CALL`, `RET`, `PUSH` and `POP` need a stack, and the GPU uses R15 as the stack
pointer. Set it up before the first one:

```
LI  R15,>47FE     * top of the GPU's own RAM
```

The stack grows down and is always 16-bit words on even addresses.

Several existing instructions mean something different here:

<table>
<thead><tr><th>Was</th><th>Is now</th><th>What it does</th></tr></thead>
<tbody>
<tr v-for="i in gpu.changedInstructions" :key="i.name">
  <td><code>{{ i.name }}</code></td>
  <td><strong>{{ i.becomes }}</strong></td>
  <td>{{ i.what }}</td>
</tr>
</tbody>
</table>

And a set of them is simply gone: <span v-for="(u, i) in gpu.unimplemented" :key="u"><code>{{ u }}</code>{{ i < gpu.unimplemented.length - 1 ? ', ' : '' }}</span>.

{{ gpu.unimplementedWhy }}

::: details IDLE is safe here
`IDLE` on a real 9900 in a real computer stops the processor until an
interrupt arrives, which on a machine with no interrupt to send is a way to
hang it.

The GPU has no interrupts, and `IDLE` means *stop and wait for the next
trigger*. It is how a GPU program ends. Every one of them finishes with it.
:::

## PIX

The interesting instruction. It reads, writes, conditionally writes, or merely
locates a pixel — given an X and a Y, in one instruction.

It uses the `XOP` opcode, which the GPU had no use for, so any 9900 assembler
will emit it. The source operand is the coordinate, X in the high byte; the
destination register is a command:

<pre class="pix-format"><code>{{ gpu.pix.destinationFormat }}</code></pre>

<table>
<thead><tr><th>Field</th><th>What it means</th></tr></thead>
<tbody>
<tr v-for="f in gpu.pix.fields" :key="f.field">
  <td><code>{{ f.field }}</code></td><td>{{ f.what }}</td>
</tr>
</tbody>
</table>

Which gives you, in one instruction each:

```
LI   R0,>2020        * x=32, y=32
LI   R1,>0001        * plot color 1
XOP  R0,R1

LI   R1,>0801        * plot 1, and hand back what was there
XOP  @XY,R1

LI   R1,>0302        * plot 2, but only where the pixel is 0
XOP  @XY,R1

LI   R1,>0213        * plot 3, but only where the pixel is not 1
XOP  @XY,R1

LI   R1,>8000        * don't plot — just tell me the address, Graphics II layout
XOP  @XY,R1
```

The conditional forms are the ones worth staring at. *Write only where the
pixel is background* is a sprite mask. *Write only where it is not* is a
flood-fill boundary test. Both are one instruction where a 6502 needs a read,
a mask, a compare, a branch and a write.

{{ gpu.pix.why }}

## Block copying

The Pico9918 adds something the F18A does not have: a block copier, driven by a
command block at `$8000` and triggered by touching that address.

<table>
<thead><tr><th>Offset</th><th>Bytes</th><th>Field</th><th>What it is</th></tr></thead>
<tbody>
<tr v-for="f in gpu.dma.fields" :key="f.offset">
  <td><code>{{ f.offset }}</code></td><td>{{ f.size }}</td><td>{{ f.field }}</td><td>{{ f.what }}</td>
</tr>
</tbody>
</table>

Rectangular copies with a stride, so it moves a region of a name table rather
than a run of bytes — which is the shape almost every VRAM copy actually has.
The status byte goes to zero when it is done.

On a real F18A, `$8000` is a free-running 32-bit counter instead. This is the
sharpest difference between the two cards, and code that uses either will not
run on the other.

## What a real F18A has that yours does not

<ul><li v-for="f in gpu.f18aOnlyFeatures" :key="f">{{ f }}</li></ul>

The flash chip is the one to know about, because a large part of the F18A's own
documentation is about reading and writing it, and none of that applies here.
The Pico9918 updates its firmware through a different mechanism entirely, and
there is no serial flash for a GPU program to reach.

## Getting a program in

There is no toolchain for this in the ACE's world, and that is the honest state
of it. What you have:

- **Any 9900 assembler**, which will handle everything except the five new
  instructions and `PIX`'s operand format.
- **The instructions above as `DATA` words** for the rest.
- **A blob in your 6502 program**, written into VRAM the same way the six-byte
  detection probe is written, and started with two register writes.

For a program of any size, assemble the 9900 code separately, include the bytes
in your source, and copy them in at startup. It is not comfortable. It is also
the only processor in this machine that can run a routine on every scan line
without costing you anything, so for the right effect it is worth the
discomfort.

<style scoped>
.pix-format {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  letter-spacing: 0.08em;
  background: var(--vp-code-block-bg);
  padding: 0.9rem 1.25rem;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
