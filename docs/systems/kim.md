<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
const system = facts.systems.systems.find(s => s.id === 'kim')
</script>

# {{ system.name }} — {{ system.fullName }}

{{ system.summary }}

<PlaceholderImage
  label="KIM keypad and LCD"
  caption="6502-KIM.png from the KiCad repo's Images/ directory — migrated in Phase 8."
/>

**Form factor:** {{ system.formFactor }} · **Repository:**
[{{ system.repo }}]({{ system.repo }}) · **Quick reference:**
[/cards/kim.html](/cards/kim.html) (content pending its Phase 7 accuracy
audit — see [Choosing your machine](/systems/comparison))

::: warning Not emulated
{{ system.emulationNote }} KIM is the one machine in this family you can't
try in the emulator or on DEV — everything else on this site that says
"RUN-verified" was checked against real hardware documentation and the
schematics for this system, not the emulator.
:::

## What makes it different

Everything else in this family adds capability. KIM's Keypad Card does the
opposite: it **overlays the top of the address space**, replacing BASIC, the
Monitor, Wozmon, and the CPU vectors with its own cartridge ROM — a
KIM-1-style hex monitor, not a BASIC machine. 24 keys, a two-line LCD, direct
memory access, nothing else in the way.

## The memory overlay

<table>
  <thead><tr><th>Range</th><th>Contents</th></tr></thead>
  <tbody>
    <tr v-for="r in system.memoryOverlay.ranges" :key="r.start">
      <td><code>{{ r.start }}–{{ r.end }}</code></td>
      <td>{{ r.contents }}</td>
    </tr>
  </tbody>
</table>

The Kernal at `$A000`–`$BFFF` stays reachable and the cartridge calls into
it — pin-traced directly in the schematics: the Keypad Card's `74HC138`
address decoder splits on `A13`–`A15`, and its ROM chip-select gates only
`$E000`–`$FFF9`, leaving the vectors at `$FFFA`–`$FFFF` to the cartridge's
own.

## Optional (the preferred build)

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

## The keypad, pin by pin

Confirmed by tracing actual connector geometry through the schematics, not
just reading labels: the Keypad Card's 65C21 PIA carries the keypad code on
`PA0`–`PA4` and the LCD control lines on `PA5` (`RS`), `PA6` (`R/W̄`), `PA7`
(`E`); `CA1` is the keypad's data-available interrupt, `CA2` the encoder's
output-enable. The Keypad Helper does all scanning, debounce, and encoding
**in hardware** — an `MM74C922` 16-key encoder extended to 24 keys with a
`74HC00`, no microcontroller and no firmware involved in reading a keypress.

## Firmware

<ul>
  <li v-for="fw in system.firmware" :key="fw.name">
    <strong>{{ fw.name }}</strong> — {{ fw.detail }}
  </li>
</ul>

## Boards

<ul>
  <li v-for="board in system.boards" :key="board.name">
    <strong>{{ board.name }}</strong>
  </li>
</ul>

## LED demos

The two KIM LED walk-throughs migrated from `6502-ASSETS` are tutorials, not
reference cards — their content is destined for the BASIC and assembly
guides' worked-program sections as verified `samples/` cases, not this page.
Until then they're archived at `docs/public/cards/archive/`.

## Related

- [KiCad repository — 6502-KIM](https://github.com/acwright/6502-KIM)
- [Choosing your machine](/systems/comparison) for how KIM compares to the rest
