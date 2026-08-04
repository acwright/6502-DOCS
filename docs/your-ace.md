<script setup>
import { data as facts } from './.vitepress/data/facts.data.mts'
const ace = facts.systems.systems.find(s => s.id === 'ace')
</script>

# Your ACE

One board, one computer, everything on it — **including the keyboard**. The ACE
is a big board, about as tall as a Commodore 128 and a little narrower, and the
front two-thirds of it is a full mechanical keyboard soldered straight to the
PCB. No cards to fit, no expansion decisions to make.

<Figure
  src="/images/photos/ace-board.jpg"
  alt="The ACE board from above, without the keyboard: connectors along the back edge, the processor and ROM in the middle, and the CompactFlash adapter at the right."
  caption="The board, front to back. Power and the connectors run along the top edge, the processor and the ROM sit in the middle, and the CompactFlash adapter is the small board on the right."
/>

## The tour

**The big chip in the middle** is a **W65C02S** — the processor. It's a 1970s
design still in production today, running here at 1 or 2 MHz. That sounds slow.
It is slow. It's also completely comprehensible, which is the point: there is
nothing happening inside your ACE that you can't eventually understand.

**Next to it, two 32 KB chips.** One is RAM (what your programs live in while
they run); one is ROM, holding the BIOS — BASIC, the Monitor, and the routines
that drive everything else. There's another half a megabyte of RAM on board as
well, reached a slice at a time when a program needs more room than BASIC's
32 KB.

**The little black module** near the video connector is a **Pico9918**. It
pretends to be a TMS9918A, the video chip from the ColecoVision and the MSX,
and drives a plain VGA monitor. That's where your 40×24 text screen and its 16
colours come from.

**The socketed 28-pin chip** is an **ARMSID** — a drop-in replacement for the
MOS 6581, the sound chip from the Commodore 64. Three voices, real filters, RCA
output to any powered speaker.

**The keys** are 67 Cherry MX switches in a proper typing layout, wired as a
matrix straight into the board. This is your keyboard; nothing needs plugging
in. See [The keyboard](/using/keyboard) for the handful of keys that do
something out of the ordinary.

**The card edge behind the keyboard**, standing up rather than facing out, is
the **cartridge slot**. Cartridges drop into it from above. It's also where the
[KIM keypad](/addons/kim) boards go.

**Round the edges:** a VGA connector, RCA audio, two joystick ports, a DB9
serial port, a CompactFlash slot on its own little adapter board, a PS/2 socket,
and a 5 V barrel jack.

**Two switches worth knowing.** The **power switch** does what it says. The
**reset button** sits just above the <kbd>Esc</kbd> key, where you can reach it
without looking — and it is *not* the same as switching off:

- **Reset** restarts the machine but leaves the memory alone. Your program and
  your variables are still there afterwards; type `LIST` and see. Use it to get
  out of anything.
- **Power off, then on** is the clean slate. Memory is cleared and BASIC starts
  from scratch.

::: details What the other chips do
A **65C22 VIA** handles the joysticks and general-purpose I/O. A **65C51 ACIA**
with a MAX238 next to it drives the serial port. A **DS1511Y** keeps the time
and date when the power's off, and hangs on to 256 bytes of memory for you.
An **ATmega1284P** scans the keyboard and hands keystrokes to the 65C02 — it
also holds the CPU in reset for a quarter of a second at power-on, which is why
the machine comes up cleanly instead of mid-thought.
:::

## The jumper and the DIP switches

`J1 PHI2 SELECT` picks the CPU speed: **1 MHz or 2 MHz**. 1 MHz is the safe
default and the speed everything in this guide assumes. 2 MHz is free
performance if your particular set of chips is happy with it — try it, and move
the jumper back if anything gets flaky.

The eight-way DIP switch marked **IO ENABLE** has one position for each of the
machine's eight I/O sections — banked RAM, clock, storage, serial, joysticks,
sound, video. Leave them all on. They're there for fault-finding: switch a
section off and the ACE boots without it, which is a quick way to work out
which part is misbehaving.

## What's on the board

<table>
  <thead><tr><th>Part of the machine</th><th>Chip</th><th>Notes</th></tr></thead>
  <tbody>
    <tr v-for="item in ace.onboard" :key="item.role + item.part">
      <td>{{ item.role }}</td>
      <td>{{ item.part }}</td>
      <td>{{ item.detail }}</td>
    </tr>
  </tbody>
</table>

::: details Building one yourself
The ACE is open hardware — the KiCad project, the bill of materials and the
production files are all in the
[6502-ACE repository](https://github.com/acwright/6502-ACE). Two things worth
knowing before you order boards:

<ul>
  <li v-for="note in ace.builderNotes" :key="note">{{ note }}</li>
</ul>

Board revisions to date:

<ul>
  <li v-for="rev in ace.revisions" :key="rev.board + rev.revision">
    <strong>{{ rev.board }} Rev {{ rev.revision }}</strong> — {{ rev.notes }}
  </li>
</ul>
:::

<div class="card-link">

📄 **[6502-ACE card](/cards/ace.html)** — this chapter, the memory map and
the first things to type, on two printable pages. The
[card index](/reference/) has the rest.

</div>

## Next

[Setting up](/getting-started/setup) — what to plug in, and in what order.
