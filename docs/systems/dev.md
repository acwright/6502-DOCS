<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
const system = facts.systems.systems.find(s => s.id === 'dev')
</script>

# {{ system.name }} — {{ system.fullName }}

{{ system.summary }}

<PlaceholderImage
  label="DEV board with Teensy"
  caption="6502-DEV.png from the KiCad repo's Images/ directory — migrated in Phase 8."
/>

**Form factor:** {{ system.formFactor }} · **Repository:**
[{{ system.repo }}]({{ system.repo }}) · **Quick reference:**
[/cards/dev.html](/cards/dev.html) (content pending its Phase 7 accuracy
audit — see [Choosing your machine](/systems/comparison))

## What makes it different

Every other machine in the family runs a real 65C02. DEV replaces it with a
**Teensy 4.1 running vrEmu6502**, a cycle-accurate software 65C02, driving a
real bus through five `SN74LVC4245A` level shifters (confirmed directly in
the schematics — five instances, matching the claim exactly) into a genuine
6502 bus connector and card slot. Real COB cards plug in and run against the
emulated CPU exactly as they would against silicon.

The point isn't emulation for its own sake — it's **control**. Hardware
Run/Stop, Step, Clock, and Reset switches (`SW1`–`SW4`, confirmed by name in
the schematics) let you stop the bus mid-instruction and inspect it in a way
real silicon simply doesn't allow.

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

## Optional

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

## Absent

<ul>
  <li v-for="item in system.absent" :key="item.role">
    <strong>{{ item.role }}</strong> — {{ item.reason }}
  </li>
</ul>

## The DEV Output Board

A second Teensy — a 4.0, not the 4.1 that hosts the CPU — paired with a
2.4″ TFT, emulating a TMS9918A and a 6581 SID in software, driven over
high-speed serial from the main board. The same AV data also goes out over
USB, so a browser can render the output in parallel with the physical
screen — useful for capturing what's on screen without pointing a camera at
it.

## Boards

<ul>
  <li v-for="board in system.boards" :key="board.name">
    <strong>{{ board.name }}</strong><span v-if="board.detail"> — {{ board.detail }}</span>
  </li>
</ul>

## The Teensy/vrEmu6502 workflow

Because the CPU is software, DEV is where BIOS and Kernal development
actually happens: single-step through boot, set a breakpoint on a jump
table slot, watch a register change instruction by instruction — the kind of
debugging [Using the emulator](/using/emulator)'s `dbg` commands give you on
the *emulator*, DEV gives you on **real hardware carrying real cards**, which
is a meaningfully different guarantee when you're chasing a bug that only
shows up with an actual card in an actual slot.

## Related

- [KiCad repository — 6502-DEV](https://github.com/acwright/6502-DEV)
- [vrEmu6502](https://github.com/visrealm/vrEmu6502) — the CPU core DEV runs
- [Choosing your machine](/systems/comparison) for how DEV compares to the rest
