<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# The Monitor for users

Underneath BASIC, every machine has a machine-code monitor — a much lower-level
tool, closer to the metal than anything BASIC exposes. You don't need it for
BASIC programming, but it's how you look at what BASIC (or anything else)
actually did to memory, and it's the entry point into machine code — the
assembly guide, a later phase of this site, lives on the other side of it.

## Getting there

Two real ways in, both RUN-verified, and both land on the same register
dump:

**`BRK` from BASIC** — type `BRK` at the `OK` prompt:

```
BRK
6502 MONITOR v1.1
BRK AT $E9D1
PC=E9D3 A=00 X=FF Y=68 SP=FA ---B-IZC
.
```

**`ESC` at the boot splash** — before BASIC starts, at the
`ENTER=BASIC  ESC=MONITOR` line (see [First power-on](/getting-started/first-boot)):

```
6502 MONITOR v1.1
BRK AT $A490
PC=A492 A=1B X=00 Y=18 SP=FC ---B-IZC
.
```

Either way you land at the Monitor's prompt: a single `.`. The register line
is the CPU's state at the moment of entry — `PC`, `A`, `X`, `Y`, `SP`, and the
processor flags spelled out letter by letter (`N V - B D I Z C`, with a `-`
where the flag reads clear). A `BRK` opcode encountered in *your own* running
machine code lands here exactly the same way — this is the mechanism the
Kernal's `Break` handler (`Kernal.asm:3069`) uses for all three.

`X` goes back to BASIC:

```
X

OK
```

## Commands

Every command below is generated from
[`data/monitor-commands.json`](https://github.com/acwright/6502-DOCS/blob/main/data/monitor-commands.json),
extracted from `Monitor.asm`'s own dispatch table — not retyped from a
README.

<table>
  <thead><tr><th>Command</th><th>Syntax</th><th>What it does</th></tr></thead>
  <tbody>
    <tr v-for="cmd in facts.monitorCommands.commands" :key="cmd.command">
      <td><code>{{ cmd.command }}</code></td>
      <td><code>{{ cmd.syntax ?? cmd.command }}</code></td>
      <td>{{ cmd.readmeDescription ?? cmd.summary }}</td>
    </tr>
  </tbody>
</table>

Three worth calling out by name, all RUN-verified above and below:

- **`M [addr] [addr]`** — hex + ASCII memory dump, 8 bytes a row:
  ```
  M 1000
  .:1000 00 00 00 00 00 00 00 00 ........
  .:1008 00 00 00 00 00 00 00 00 ........
  ```
- **`D [addr] [addr]`** — disassembles the full WDC 65C02 + Rockwell
  instruction set:
  ```
  D 1000
  .,1000  00        BRK
  .,1001  00        BRK
  ```
  (Zero page RAM disassembles as a string of `BRK`s because it's all zero
  bytes at boot — `$00` is the `BRK` opcode. Nothing broken; that's what
  unwritten memory looks like.)
- **`R`** — reprints the register line above without re-entering.
- **`G [addr]`** — jump to an address, restoring `A`/`X`/`Y`/flags/`SP` via
  `RTI` first. With no address, resumes wherever the saved `PC` points.

## The Wozmon easter egg

`G FF00` (or, from BASIC, `SYS 65280` — the same address, decimal) jumps into
the **original Apple I monitor**, kept byte-for-byte as an easter egg at
`$FF00` (`BIOS.cfg:7`). RUN-verified — its prompt is a literal backslash,
distinct from this Monitor's `.`:

```
G FF00
\
```

From there it's Woz's own monitor: `<addr>.<addr>` to examine a range,
`<addr>:<byte> <byte>...` to deposit, `<addr>R` to run. It predates this
machine by 45 years and none of its own commands overlap with the ones
above.

<PlaceholderImage
  label="Monitor session"
  caption="M, D, R and the Wozmon easter egg, captured with dbg screen png once scripts/capture-screens.mjs exists (Phase 8). The transcripts above are already RUN-verified; only the screenshots are pending."
/>
