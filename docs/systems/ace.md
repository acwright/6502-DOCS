<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
const system = facts.systems.systems.find(s => s.id === 'ace')
</script>

# {{ system.name }} — {{ system.fullName }}

{{ system.summary }}

<PlaceholderImage
  label="ACE board"
  caption="6502-ACE.png from the KiCad repo's Images/ directory — migrated in Phase 8."
/>

**Form factor:** {{ system.formFactor }} · **Repository:**
[{{ system.repo }}]({{ system.repo }}) · **Quick reference:**
[/cards/ace.html](/cards/ace.html) (content pending its Phase 7 accuracy
audit — see [Choosing your machine](/systems/comparison))

## What makes it different

The whole family's feature set on one PCB — no backplane, no card slots to
populate. Everything COB offers as separate cards ships built in.

## Onboard

<table>
  <thead><tr><th>Role</th><th>Part</th><th>Detail</th></tr></thead>
  <tbody>
    <tr v-for="item in system.onboard" :key="item.role + item.part">
      <td>{{ item.role }}</td>
      <td>{{ item.part }}</td>
      <td>{{ item.detail }}<span v-if="item.slot"> (slot {{ item.slot }})</span></td>
    </tr>
  </tbody>
</table>

## Optional

<table>
  <thead><tr><th>Role</th><th>Part</th><th>Detail</th></tr></thead>
  <tbody>
    <tr v-for="item in system.optional" :key="item.role + item.part">
      <td>{{ item.role }}</td>
      <td>{{ item.part }}</td>
      <td>{{ item.detail }}<span v-if="item.slot"> (slot {{ Array.isArray(item.slot) ? item.slot.join('/') : item.slot }})</span></td>
    </tr>
  </tbody>
</table>

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

## Quirks worth knowing

- **The banked RAM patch.** Rev 1.0 ACE Boards don't latch the banked SRAM
  reliably — the ACE RAM Patch piggybacks onto the U13 socket to fix it. Rev
  1.1 fixes this on the board itself (a NAND→NOR change on the latch-enable
  gating, plus pull-up resistors bumped from 1 kΩ to 10 kΩ) — confirmed
  directly in the schematics: Rev 1.1 adds a 74HC02 (U23) absent from Rev 1.0,
  and R1–R4/R25 read 10 kΩ where Rev 1.0 reads 1 kΩ.
- **Two joystick ports, wired to opposite VIA ports.** J6 (JOYSTICK A) reads
  as `JOY(2)`; J8 (JOYSTICK B) reads as `JOY(1)`. Easy to swap by accident if
  you're expecting them in port order.
- **CPU speed is jumper-selectable** (J1 PHI2 SELECT) — 1 or 2 MHz.

## Related

- [KiCad repository — 6502-ACE](https://github.com/acwright/6502-ACE)
- [Choosing your machine](/systems/comparison) for how ACE compares to the rest
- [Setting up](/getting-started/setup) for cabling and connectors
