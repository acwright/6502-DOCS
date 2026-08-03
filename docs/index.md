<script setup>
import { data as facts } from './.vitepress/data/facts.data.mts'
</script>

# Welcome to the AC6502 Documentation

This is the user's and programmer's guide for the **AC6502** family of homebrew
computers — ACE, COB, DEV, KIM, and VCS — one shared BIOS across five machines.

This site is under construction. The chapters below will land as the
documentation project proceeds through its phases:

- **Getting started** — unboxing, setup, and your first ten minutes at the prompt
- **The BASIC guide** — a full tutorial and reference for the on-board BASIC
- **Cross-development** — building programs on a host machine with `cc65`
- **The assembly guide** — programming the 65C02 directly against the Kernal API
- **Quick reference cards** — printable, accurate reference sheets for every system

In the meantime, the technical specifics for each machine live in their own
repositories — see the links table below.

## The family

<table>
  <thead>
    <tr><th>System</th><th>What it is</th><th>Form factor</th></tr>
  </thead>
  <tbody>
    <tr v-for="system in facts.systems.systems" :key="system.id">
      <td><a :href="system.repo">{{ system.name }}</a></td>
      <td>{{ system.fullName }} — {{ system.tagline }}</td>
      <td>{{ system.formFactor }}</td>
    </tr>
  </tbody>
</table>

## What the machine is, according to the machine

Everything below is generated at build time from the fact base in
[`data/`](https://github.com/acwright/6502-DOCS/tree/main/data), which is
extracted from the BIOS source by `npm run facts`. No number on this site is
typed in by hand.

Baseline: **BIOS v{{ facts.biosVersion }}**, splash
`{{ facts.boot.strings.find(s => s.symbol === '@SplashTitle')?.text }}`.

| The fact base holds | |
|---|--:|
| Kernal jump-table slots (published) | {{ facts.kernal.publishedSlots }} |
| Kernal jump-table slots (reserved) | {{ facts.kernal.reserved.count }} |
| BASIC statements | {{ facts.basicKeywords.counts.statements }} |
| BASIC functions | {{ facts.basicKeywords.counts.functions }} |
| BASIC syntax keywords and operators | {{ facts.basicKeywords.counts.keywords }} |
| BASIC error messages | {{ facts.errors.basic.errors.length }} |
| Monitor commands | {{ facts.monitorCommands.commands.length }} |
| I/O slots | {{ facts.hardware.slots.length }} |

### The eight I/O slots

`HW_PRESENT` at {{ facts.hardware.hwPresent.address }} records which of these the
Reset probe found. `MEM` prints it as `HW=$xx`.

<table>
  <thead>
    <tr><th>Slot</th><th>Range</th><th>Bit</th><th>Card</th><th>Chip</th></tr>
  </thead>
  <tbody>
    <tr v-for="slot in facts.hardware.slots" :key="slot.symbol">
      <td>{{ slot.slot }}</td>
      <td><code>{{ slot.start }}–{{ slot.end }}</code></td>
      <td><code>{{ slot.mask }}</code></td>
      <td>{{ slot.card }}</td>
      <td>{{ slot.chip }}</td>
    </tr>
  </tbody>
</table>

## Sibling repositories

| Repo | Purpose |
|---|---|
| [6502-BIOS](https://github.com/acwright/6502-BIOS) | The shared BIOS — Kernal, BASIC, Monitor |
| [6502-EMULATOR](https://github.com/acwright/6502-EMULATOR) | Desktop and browser emulator |
| [6502-PRG](https://github.com/acwright/6502-PRG) | Cross-dev program template |
| [6502-CRT](https://github.com/acwright/6502-CRT) | Cross-dev cartridge template |
| [6502-ASM](https://github.com/acwright/6502-ASM) | Assembly sample code |
| [6502-BAS](https://github.com/acwright/6502-BAS) | BASIC sample code |
| [bastok](https://github.com/acwright/bastok) | BASIC tokenizer |
| [cffs](https://github.com/acwright/cffs) | CompactFlash image tool |
| [bin2woz](https://github.com/acwright/bin2woz) | Wozmon upload helper |
| [TMS9918-EDITOR](https://github.com/acwright/TMS9918-EDITOR) | Character/screen/sprite editor |
