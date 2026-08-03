<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# Troubleshooting

Most "something's wrong" questions about this family have the same first
step: read `HW_PRESENT` and see what the Reset probe actually found. The
probe runs before the splash even prints (see
[First power-on](/getting-started/first-boot)), and it is the single source
of truth for what's fitted — trust it over guessing from symptoms.

## Start here: `MEM`

Type `MEM` at the `OK` prompt:

```
MEM
 30718 BYTES FREE  HW=$7F

OK
```

`HW=$xx` is {{ facts.hardware.hwPresent.description }} From BASIC, the same
byte is `{{ facts.hardware.hwPresent.readFromBasic }}` — RUN-verified
identical: a machine with every card except video reports `HW=$7F` from
`MEM` and `127` from `PRINT PEEK(781)`, the same number in hex and decimal.

## Reading the bits

<table>
  <thead><tr><th>Bit</th><th>Mask</th><th>Card</th></tr></thead>
  <tbody>
    <tr v-for="slot in facts.hardware.slots" :key="slot.symbol">
      <td>{{ slot.bit }}</td>
      <td><code>{{ slot.maskHex }}</code></td>
      <td>{{ slot.card }}</td>
    </tr>
  </tbody>
</table>

A `0` bit means the probe didn't find that card — not that it's broken,
necessarily, just absent as far as the BIOS can tell. Work through the table
against what you expect to be fitted.

## No video

Bit 7 clear (`HW=$7F` or lower, video bit missing from the mask). This is
the *default* condition of a headless serial connection — not a fault.
Confirm the Pico9918/VGA cable and monitor before assuming a hardware
problem; if you expect video and the bit is clear, the BIOS never saw the
card. See [Setting up](/getting-started/setup)'s video section.

## No beep at boot

The startup beep is skipped — not failed — when no sound card is fitted
(bit 6, `$40`). Check `HW=$xx` for that bit before assuming the ARMSID or
its socket is bad.

## CF card not detected

Bit 3 (`$08`) clear means every storage command will raise `?NO DEVICE
ERROR` rather than hang — see [Storage](/using/storage). Reseat the card and
check the adapter/Storage Card is in the slot the family's hardware probe
expects (`data/hardware.json`'s slot table, generated straight from the BIOS
source).

## Key repeat or missed keys

Both a PS/2 keyboard and a matrix keyboard feed the same input path at
once ([The keyboard](/using/keyboard)) — most repeat or drop issues trace
back to the controller's negotiation with the PS/2 device at power-on rather
than the matrix side. A reset (see that same chapter) re-runs the whole
probe and negotiation from scratch.

## Nothing at all — no console, no response

The one condition the BIOS can't route around: if neither a video card nor a
serial connection is present, there's no console to boot into, and the BIOS
halts before the splash rather than running blind
(`data/boot.json`'s boot sequence, step 5). If you're seeing genuinely
nothing — no splash, no beep, no serial output — confirm at least one of
those two paths is actually connected before suspecting the board itself.

## Still stuck?

Every hardware claim in this guide is sourced from either the BIOS itself
(`GREP`) or the KiCad schematics (`SCHEM`) — see each system's own page under
**Systems** for what's on your specific board, and
[data/hardware.json](https://github.com/acwright/6502-DOCS/blob/main/data/hardware.json)
for the full I/O slot table this page is generated from.
