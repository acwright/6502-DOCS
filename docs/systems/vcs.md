<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
const system = facts.systems.systems.find(s => s.id === 'vcs')
</script>

# {{ system.name }} — {{ system.fullName }}

{{ system.summary }}

<PlaceholderImage
  label="VCS console and cartridge"
  caption="6502-VCS.png from the KiCad repo's Images/ directory — migrated in Phase 8."
/>

**Form factor:** {{ system.formFactor }} · **Repository:**
[{{ system.repo }}]({{ system.repo }}) · **Quick reference:**
[/cards/vcs.html](/cards/vcs.html) (content pending its Phase 7 accuracy
audit — see [Choosing your machine](/systems/comparison))

## What makes it different

A cartridge console: swap ROM carts instead of loading from a CompactFlash
card, plug in a joystick, and go. VCS has no storage card and no serial
port — programs arrive on cartridge, full stop.

## Onboard

<table>
  <thead><tr><th>Role</th><th>Part</th><th>Detail</th></tr></thead>
  <tbody>
    <tr v-for="item in system.onboard" :key="item.role + item.part">
      <td>{{ item.role }}</td>
      <td>{{ item.part }}</td>
      <td>{{ item.detail }}</td>
    </tr>
  </tbody>
</table>

## Optional (cartridges)

<table>
  <thead><tr><th>Role</th><th>Part</th><th>Detail</th></tr></thead>
  <tbody>
    <tr v-for="item in system.optional" :key="item.role + item.part">
      <td>{{ item.role }}</td>
      <td>{{ item.part }}</td>
      <td>{{ item.detail }}</td>
    </tr>
  </tbody>
</table>

Confirmed directly in the schematics: Rev 1.0a's cartridge uses a `28C256`
EEPROM (electrically erasable, no UV eraser needed); Rev 1.0b uses a
`27C256` EPROM (UV-erasable). Either fits the same cartridge slot.

## Absent

<ul>
  <li v-for="item in system.absent" :key="item.role">
    <strong>{{ item.role }}</strong> — {{ item.reason }}
  </li>
</ul>

## Joysticks — the highest-risk claim, checked pin by pin

The two joystick ports **share the VIA ports with the keyboard encoder**
rather than having dedicated connectors — J1 wired to VIA **PORT B**, reading
in BASIC as `JOY(1)`; J2 wired to VIA **PORT A**, reading as `JOY(2)`. This
was pin-traced directly in the schematics rather than taken on trust: J1's
own `Value` property reads `"PORT B"`, J2's reads `"PORT A"`, confirming the
mapping exactly (and it's easy to get backwards, which is exactly why this
one got the closer look).

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

Confirmed directly in the schematics: five resistors (`R10`–`R14`) read
1 kΩ in Rev 1.0 and 10 kΩ in Rev 1.1 — the same pull-up bump already
confirmed on the ACE board's Rev 1.1.

## Writing a cartridge

Cartridges overlay `$C000`–`$FFFF`, the same pattern as KIM's Keypad Card but
at a different address range and for a different purpose — running full
programs rather than replacing the Monitor. The assembly guide's cartridge
chapter (a later phase of this site) covers the two boot patterns and the
`6502-CRT` template end to end.

## Related

- [KiCad repository — 6502-VCS](https://github.com/acwright/6502-VCS)
- [Choosing your machine](/systems/comparison) for how VCS compares to the rest
- [Setting up](/getting-started/setup) for cabling and connectors
