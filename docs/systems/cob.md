<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
const system = facts.systems.systems.find(s => s.id === 'cob')
</script>

# {{ system.name }} — {{ system.fullName }}

{{ system.summary }}

<PlaceholderImage
  label="COB backplane and cards"
  caption="6502-COB.png from the KiCad repo's Images/ directory — migrated in Phase 8."
/>

**Form factor:** {{ system.formFactor }} · **Repository:**
[{{ system.repo }}]({{ system.repo }}) · **Quick reference:**
[/cards/cob.html](/cards/cob.html) (content pending its Phase 7 accuracy
audit — see [Choosing your machine](/systems/comparison))

## What makes it different

COB *is* the backplane. There's no onboard feature list to speak of — every
function (CPU, memory, video, sound, storage, serial, GPIO, RTC) is a card you
choose to fit. This is the system the BIOS's hardware probe exists for: every
card announces itself at boot through `HW_PRESENT`, and the BIOS degrades
gracefully around whatever's missing — see
[First power-on](/getting-started/first-boot).

## The card catalogue

<table>
  <thead><tr><th>Role</th><th>Card</th><th>Detail</th></tr></thead>
  <tbody>
    <tr v-for="item in system.optional" :key="item.role + item.part">
      <td>{{ item.role }}</td>
      <td>{{ item.part }}<span v-if="item.status"> ({{ item.status }})</span></td>
      <td>{{ item.detail }}<span v-if="item.slot"> (slot {{ Array.isArray(item.slot) ? item.slot.join('/') : item.slot }})</span></td>
    </tr>
  </tbody>
</table>

Cards marked **untested** exist as designs but haven't been exercised against
the BIOS the way the rest of this fact base has — treat their behavior as
unconfirmed until proven otherwise.

## Boards

<ul>
  <li v-for="board in system.boards" :key="board.name">
    <strong>{{ board.name }}</strong><span v-if="board.detail"> — {{ board.detail }}</span>
  </li>
</ul>

## Revisions

<ul>
  <li v-for="rev in system.revisions" :key="rev.board + rev.revision">
    <strong>{{ rev.board }} Rev {{ rev.revision }}</strong> — {{ rev.notes }}
  </li>
</ul>

Confirmed directly in the schematics: Backplane Pro Rev 1.1 adds a barrel
jack and power switch absent from Rev 1.0, and nearly every passive on the
board switches from surface-mount to through-hole footprints, matching
"entirely through-hole."

## Building up a machine

A minimal running COB needs a Backplane (or Backplane Pro), a CPU Card, and a
Memory Card — that's a complete machine, no different from ACE's onboard
CPU/RAM/ROM. Everything past that is what you add: a Serial Card to get a
console without video, a Video or VGA Card for a screen, a GPIO Card for a
keyboard and joysticks, an RTC Card for the clock, a Storage Card for
CompactFlash. The **Backplane Helper** extends a single 5-slot backplane to
as many as 12 slots if you want everything at once.

## Related

- [KiCad repository — 6502-COB](https://github.com/acwright/6502-COB)
- [Choosing your machine](/systems/comparison) for how COB compares to the rest
- [Setting up](/getting-started/setup) for cabling and connectors
