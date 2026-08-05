<script setup>
import { withBase } from 'vitepress'
import { data as facts } from '../.vitepress/data/facts.data.mts'

const kernal = facts.kernal
const bySlot = Object.fromEntries(kernal.slots.map((s) => [s.name, s]))

// Grouped by the job you came here to do, and titled the way a person would
// describe it rather than the way the chip is named.
const groups = [
  ['Console', ['Chrout', 'Chrin', 'PrintStr', 'PrintCRLF', 'PrintDecU16', 'WriteBuffer', 'ReadBuffer', 'BufferSize', 'SetIOMode', 'GetIOMode'], '/assembly/console'],
  ['The screen', ['InitVideo', 'VideoClear', 'VideoPutChar', 'VideoChroutRaw', 'VideoSetCursor', 'VideoGetCursor', 'VideoScroll', 'VideoSetColor'], '/assembly/video'],
  ['Sound', ['InitSID', 'Beep', 'SidPlayNote', 'SidSilence', 'SidSetVolume'], '/assembly/sound'],
  ['Keyboard and sticks', ['InitKB', 'ReadJoystick1', 'ReadJoystick2', 'KBDisable', 'KBEnable'], '/assembly/input'],
  ['Files', ['FsLoadFileAddr', 'FsSaveFileAddr', 'FsLoadFile', 'FsSaveFile', 'FsDeleteFile', 'FsFormatDisk', 'FsSetDisk', 'FsGetDisk', 'FsPrintDisk'], '/assembly/storage'],
  ['The card itself', ['StReadSector', 'StWriteSector', 'StWaitReady'], '/assembly/storage'],
  ['Serial', ['InitSC', 'SerialChrout', 'XModemLoad', 'XModemSave'], '/assembly/serial'],
  ['Clock and lasting memory', ['RtcReadTime', 'RtcReadDate', 'RtcWriteTime', 'RtcWriteDate', 'RtcReadNVRAM', 'RtcWriteNVRAM'], '/assembly/clock'],
  ['The machine', ['SysDelay', 'KernalInit', 'KernalVersion'], '/assembly/detection']
].map(([title, names, link]) => ({ title, link, slots: names.map((n) => bySlot[n]) }))

const id = (name) => 'k-' + name.toLowerCase()
</script>

# The Kernal

The Kernal is the machine's API: {{ kernal.publishedSlots }} routines that
already know how to talk to every chip on the board. Printing a character,
reading a joystick, saving a file, setting the clock — all of it is written,
tested, and sitting in ROM.

It is also what BASIC is built on. `PRINT` ends up in the same routine your
program will call.

## How it works

The first 256 bytes of the Kernal are nothing but jumps:

```
$A000  JMP ChroutDispatch
$A003  JMP ChrinImpl
$A006  JMP WriteBufferImpl
...
```

Three bytes each, in a fixed order that has not changed and will not. So
`jsr $A000` prints a character *this* year and next year, even though
`ChroutDispatch` itself will have shuffled up or down the ROM in between.

**Call the slot, never the implementation.** That is the whole contract.

<Diagram
  name="kernal-table"
  caption="Two jumps instead of one, and the second one is free of your program. That is the price of never having to look an address up again."
/>

You will not type `$A000` either, because `6502.inc` gives every slot a name:

```asm
.include "6502.inc"

  lda #'!'
  jsr Chrout                    ; the slot at $A000, by name
```

::: details What's at the end of the table
{{ kernal.reserved.count }} slots from `{{ kernal.reserved.start }}` to
`{{ kernal.reserved.end }}` are reserved. Each is a real jump to a routine that
does nothing but return, so calling one is harmless today and will do something
useful in a later ROM. Do not put your own code there — that is what the 30 KB
of program RAM is for.
:::

## Calling one

Everything is passed in registers, and the pattern is always the same shape:
put the arguments in A, X and Y, `jsr`, read the answer back out of A, X, Y or
the carry flag.

```asm
  lda #<Message                 ; low byte of the address
  ldy #>Message                 ; high byte
  jsr PrintStr                  ; print until the zero byte

  jsr RtcReadTime               ; A = hours, X = minutes, Y = seconds

  jsr FsLoadFileAddr
  bcs Failed                    ; carry set means it didn't work
```

Three conventions cover nearly all of it:

- **Pointers go in A and Y** — low byte in A, high byte in Y.
- **The carry flag reports success** — clear means it worked. Anything that
  touches the memory card or the serial port answers this way.
- **A routine clobbers what it says it clobbers**, and nothing else. The tables
  below list it per routine; when in doubt, push what you care about.

::: warning Version numbers are cheap; check them
`KernalVersion` hands back the major version in A and the minor in X. If your
program depends on something a particular ROM added, check it and say something
polite rather than crashing on an older machine.
:::

## Every routine

Grouped by what it is for, with a link to the chapter that teaches each group.

<div v-for="g in groups" :key="g.title">
  <h3>{{ g.title }}</h3>
  <p><a :href="withBase(g.link)">The chapter →</a></p>
  <div v-for="s in g.slots" :key="s.name" class="kernal-entry">
    <h4 :id="id(s.name)"><code>{{ s.name }}</code> <span class="kernal-addr">{{ s.address }}</span></h4>
    <p>{{ s.summary }}</p>
    <table>
      <tbody>
        <tr v-if="s.input && s.input.length">
          <th>In</th>
          <td><div v-for="line in s.input" :key="line">{{ line }}</div></td>
        </tr>
        <tr v-if="s.output && s.output.length">
          <th>Out</th>
          <td><div v-for="line in s.output" :key="line">{{ line }}</div></td>
        </tr>
        <tr v-if="s.modifies && s.modifies.length">
          <th>Clobbers</th>
          <td>{{ s.modifies.join(', ') }}</td>
        </tr>
        <tr v-if="s.notes && s.notes.length">
          <th>Notes</th>
          <td><div v-for="line in s.notes" :key="line">{{ line }}</div></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<style scoped>
.kernal-entry { margin: 1.5rem 0 2rem; }
.kernal-entry h4 { margin-bottom: 0.4rem; }
.kernal-addr { float: right; font-family: var(--vp-font-family-mono); font-size: 0.85em; opacity: 0.7; }
.kernal-entry table { display: table; width: 100%; }
.kernal-entry th { text-align: left; white-space: nowrap; vertical-align: top; width: 6rem; }
</style>

<div class="card-link">

📄 **[Kernal Jump Table card](/cards/kernal-jump-table.html)** — every slot
with its registers, grouped the same way, on two printable pages.

</div>

Next: [hello world](/assembly/hello) — the smallest program that uses any of it.
