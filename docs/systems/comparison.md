<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# Choosing your machine

Every AC6502 machine shares the same architecture — a 65C02 (or a
cycle-accurate emulation of one), 32 KB of RAM, 32 KB of ROM, and the same BIOS
providing the Kernal, Monitor, and BASIC. What differs is form factor: whether
that architecture shows up as one board, a backplane you build up, an
emulation rig, a minimal keypad machine, or a cartridge console.

The table below is generated from [`data/systems.json`](https://github.com/acwright/6502-DOCS/tree/main/data/systems.json)
— every part number, slot assignment, and revision note in it has been checked
directly against the KiCad schematics for each machine (SCHEM), not copied
from a README.

<table>
  <thead>
    <tr><th>System</th><th>Form factor</th><th>What it's for</th></tr>
  </thead>
  <tbody>
    <tr v-for="system in facts.systems.systems" :key="system.id">
      <td><a :href="`/systems/${system.id}`">{{ system.name }}</a> — {{ system.fullName }}</td>
      <td>{{ system.formFactor }}</td>
      <td>{{ system.tagline }}</td>
    </tr>
  </tbody>
</table>

## What's built in, what's optional

"Onboard" means it's part of the machine as shipped. "Optional" means it's a
card, adapter, or accessory you fit yourself. An empty "Onboard" column (COB)
means the machine *is* the backplane — everything is a card by design.

<table>
  <thead>
    <tr><th>System</th><th>Onboard</th><th>Optional</th></tr>
  </thead>
  <tbody>
    <tr v-for="system in facts.systems.systems" :key="system.id">
      <td><a :href="`/systems/${system.id}`">{{ system.name }}</a></td>
      <td>
        <span v-if="!system.onboard.length">—</span>
        <span v-for="(item, i) in system.onboard" :key="item.part">{{ item.role }} ({{ item.part }})<span v-if="i < system.onboard.length - 1">, </span></span>
      </td>
      <td>
        <span v-if="!system.optional.length">—</span>
        <span v-for="(item, i) in system.optional" :key="item.part">{{ item.role }} ({{ item.part }})<span v-if="i < system.optional.length - 1">, </span></span>
      </td>
    </tr>
  </tbody>
</table>

## Which one should you build (or already have)?

- **ACE** — you want everything on one board with no assembly required beyond
  populating sockets. The whole family's feature set, single PCB.
- **COB** — you want to build up a machine one card at a time, swap components
  as new card revisions appear, or you're not sure yet what you want and would
  rather decide slot by slot. This is also the system the BIOS's hardware
  probe exists for: every card announces itself, and the BIOS degrades
  gracefully around whatever's missing.
- **DEV** — you're doing firmware or BIOS development and want to single-step
  the CPU, not just run it. The Teensy 4.1 emulation trades "real silicon" for
  "you can stop time and look inside."
- **KIM** — you want the KIM-1 experience: 24 keys, a two-line LCD, and direct
  memory access with nothing in the way. Its Keypad Card overlays the top of
  the address space, so it's the one machine in the family that *isn't*
  emulated today (see [its own page](/systems/kim) for why).
- **VCS** — you want a cartridge-based console: swap ROM carts, plug in a
  joystick, no CompactFlash card or serial cable required.

Each machine gets its own page under **Systems** in the sidebar, with its
board list, quirks, and a link to its quick-reference card and its KiCad
repository.

::: warning Quick-reference cards are not yet accuracy-checked
Every system's card (`/cards/{{ facts.systems.systems[0].id }}.html` and
siblings) is linked from its system page, but the cards still carry their
original ASSETS-era content — [Phase 7](https://github.com/acwright/6502-DOCS/blob/main/PLAN.md#phase-7--quick-reference-cards)
audits and rebuilds them from this same fact base. The prose on each system
page here, and the data it's generated from, is already verified; the cards
are not yet.
:::
