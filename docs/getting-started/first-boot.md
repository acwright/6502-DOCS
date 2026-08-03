<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# First power-on

Apply power (see [Setting up](/getting-started/setup) if you haven't wired
everything up yet) and this is what happens, in order — straight from
[`data/boot.json`](https://github.com/acwright/6502-DOCS/blob/main/data/boot.json),
which is extracted from the BIOS source rather than described from memory:

<ol>
  <li v-for="step in facts.boot.sequence" :key="step.step">{{ step.step }}</li>
</ol>

RUN-verified: booting the emulator headless with nothing but a carriage
return waiting at the splash produces exactly this transcript —

```
-- 6502 BIOS v1.5 --
ENTER=BASIC  ESC=MONITOR

6502 BASIC V2.0
30718 BYTES FREE

OK
```

Three version numbers ship in that one ROM, and none of them are the same
number: the **BIOS** is v1.5 (the splash line), **BASIC** is V2.0 (the banner
after it), and the **Monitor** — which you reach with `ESC` instead of
`ENTER` — is its own v1.1, not shown until you go there. Don't assume one
number covers all three.

## The splash and the countdown

<table>
  <thead><tr><th>What you see</th><th>What it means</th></tr></thead>
  <tbody>
    <tr>
      <td><code>{{ facts.boot.strings[0].text }}</code></td>
      <td>The BIOS version. Matches <code>{{ facts.biosVersion }}</code> in
        this fact base, checked against the BIOS source on every build.</td>
    </tr>
    <tr>
      <td><code>{{ facts.boot.strings[1].text }}</code></td>
      <td>Your choice. Press <kbd>Enter</kbd> for BASIC, <kbd>Esc</kbd> for
        the Monitor.</td>
    </tr>
  </tbody>
</table>

You have about **{{ facts.boot.menu.timeoutSeconds }} seconds** to choose
before it auto-boots BASIC for you — {{ facts.boot.menu.tick }}. A beep
sounds at boot if a sound card is fitted (silently skipped if not — see
below). {{ facts.boot.menu.note }}

That last point matters more than it looks: if you're driving the machine
over a serial terminal and you start typing before the splash finishes
printing, those keystrokes get eaten one tick at a time rather than queued up
for BASIC. Wait for the prompt.

## What a missing card does *not* do

Nothing hangs. The Reset probe (step 2 above) checks every I/O slot before
the splash ever prints, and the BIOS routes around whatever it doesn't find:
no sound card means the beep is skipped, no video card means the console goes
to serial instead, no CompactFlash means storage commands report `NO DEVICE`
instead of freezing. This isn't a special case written for the docs — it's
the *default* condition of every headless run in this repo's own
`samples/` test harness, which boots with no video card at all and still
reaches `OK` over serial every single time `npm run verify` runs.

The one thing that *does* stop the machine cold: if neither a video card nor
a serial connection is present, there's no console to boot into at all, and
the BIOS halts rather than run blind. See
[Troubleshooting](/getting-started/troubleshooting) for reading `HW_PRESENT`
to see exactly what the probe found.

<PlaceholderImage
  label="Boot splash, on screen"
  caption="`6502 run --console video` + `dbg screen png`, once scripts/capture-screens.mjs exists (Phase 8). Text is already RUN-verified above; only the screenshot itself is pending."
/>
