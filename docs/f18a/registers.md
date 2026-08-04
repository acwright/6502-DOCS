<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const f18a = facts.f18a
const standard = f18a.registers.filter((r) => r.standard)
const enhanced = f18a.registers.filter((r) => !r.standard)
const status = f18a.statusRegisters
const attrs = f18a.attributes
</script>

# Every register

All of them, with their bits. The [printable card](/reference/) is the same
thing folded onto two sides of a sheet.

Bits are written **D7 first**, D7 being the most significant — the same way the
rest of this site writes them, and the same way the Pico9918's own reference
does. Matthew Hagerty's F18A documents number bits the other way around,
with bit 0 as the most significant, so his tables read mirrored against these. The
values are identical; only the labels are reversed.

## How to write one

Two writes to `$9C01`: the value, then the register number with bit 7 set.

```
lda #$1C         ; the value
sta $9C01
lda #$B9         ; register 57, with bit 7 set
sta $9C01
```

The **control byte** column below is that second byte, worked out for you.

Registers 0–7 are always available. Everything else needs the card
[unlocked](/f18a/unlocking) first, and is ignored until then — writes to it land
in the register three bits down instead.

## Registers 0 to 7

These exist on every TMS9918A. Two of them grew extra bits.

<div v-for="r in standard" :key="r.reg" class="reg">
  <h3 :id="'vr' + r.reg">
    Register {{ r.reg }} <span class="hexes">{{ r.hex }} &middot; control byte {{ r.ctrl }}</span>
    <br><span class="regname">{{ r.name }}</span>
  </h3>
  <p>{{ r.summary }}</p>
  <table v-if="r.bits">
    <thead><tr><th>Bits</th><th>Name</th><th>What it does</th></tr></thead>
    <tbody>
      <tr v-for="b in r.bits" :key="b.bits">
        <td><code>{{ b.bits }}</code></td>
        <td>{{ b.name }}</td>
        <td>{{ b.description }}<em v-if="b.pico"> — Pico9918 only</em><em v-else-if="b.enhanced"> — needs unlocking</em></td>
      </tr>
    </tbody>
  </table>
  <ul v-if="r.notes"><li v-for="n in r.notes" :key="n">{{ n }}</li></ul>
</div>

### Choosing a display mode

The mode bits are spread across registers 0 and 1, which is a quirk of the
original chip that F18A mode keeps.

<table>
<thead><tr><th>Mode</th><th>M1</th><th>M2</th><th>M3</th><th>M4</th></tr></thead>
<tbody>
<tr v-for="m in f18a.modes" :key="m.name">
  <td>{{ m.name }}</td><td>{{ m.m1 }}</td><td>{{ m.m2 }}</td><td>{{ m.m3 }}</td><td>{{ m.m4 }}</td>
</tr>
</tbody>
</table>

## Registers 8 to 63

Everything below needs the card unlocked.

<div v-for="r in enhanced" :key="r.reg" class="reg">
  <h3 :id="'vr' + r.reg">
    Register {{ r.reg }} <span class="hexes">{{ r.hex }} &middot; control byte {{ r.ctrl }}</span>
    <span v-if="r.pico" class="tag">Pico9918</span>
    <br><span class="regname">{{ r.name }}</span>
  </h3>
  <p>{{ r.summary }}</p>
  <table v-if="r.bits">
    <thead><tr><th>Bits</th><th>Name</th><th>What it does</th></tr></thead>
    <tbody>
      <tr v-for="b in r.bits" :key="b.bits">
        <td><code>{{ b.bits }}</code></td>
        <td>{{ b.name }}</td>
        <td>{{ b.description }}<em v-if="b.pico"> — Pico9918 only</em></td>
      </tr>
    </tbody>
  </table>
  <ul v-if="r.notes"><li v-for="n in r.notes" :key="n">{{ n }}</li></ul>
  <p v-if="r.conflict" class="conflict"><strong>The sources disagree.</strong> {{ r.conflict }}</p>
</div>

## Status registers

The card has one status port and sixteen things to say through it. Register 15
picks which.

Reading status register 0 has side effects — it clears the frame interrupt, the
collision flag and the fifth-sprite flag, and it drops the data port out of
palette mode. Reading any of the others has none of them.

**Put register 15 back to 0 when you are done.** The machine's interrupt
handling reads this port, and anything but register 0 acknowledges nothing.

<table>
<thead><tr><th></th><th>Name</th><th>What it holds</th></tr></thead>
<tbody>
<tr v-for="s in status" :key="s.sr">
  <td><strong>SR{{ s.sr }}</strong></td>
  <td>{{ s.name }}<span v-if="s.pico" class="tag">Pico9918</span><span v-if="s.f18aOnly" class="tag">F18A only</span></td>
  <td>{{ s.summary }}</td>
</tr>
</tbody>
</table>

<div v-for="s in status.filter((x) => x.bits)" :key="'b' + s.sr" class="reg">
  <h4>SR{{ s.sr }} — {{ s.name }}</h4>
  <table>
    <thead><tr><th>Bits</th><th>Name</th><th>What it does</th></tr></thead>
    <tbody>
      <tr v-for="b in s.bits" :key="b.bits">
        <td><code>{{ b.bits }}</code></td><td>{{ b.name }}</td><td>{{ b.description }}</td>
      </tr>
    </tbody>
  </table>
  <ul v-if="s.notes"><li v-for="n in s.notes" :key="n">{{ n }}</li></ul>
</div>

## Attribute bytes

The fourth byte of a sprite, and the color table entry of a tile, both change
meaning once the card is unlocked.

<div v-for="a in [attrs.spriteLocked, attrs.spriteUnlocked, attrs.tile, attrs.textPosition]" :key="a.title" class="reg">
  <h4>{{ a.title }}</h4>
  <p v-if="a.note">{{ a.note }}</p>
  <table>
    <thead><tr><th>Bits</th><th>Name</th><th>What it does</th></tr></thead>
    <tbody>
      <tr v-for="b in a.bits" :key="b.bits">
        <td><code>{{ b.bits }}</code></td><td>{{ b.name }}</td><td>{{ b.description }}</td>
      </tr>
    </tbody>
  </table>
  <p v-if="a.conflict" class="conflict"><strong>The sources disagree.</strong> {{ a.conflict }}</p>
</div>

<style scoped>
.reg { margin-top: 1.6rem; }
.reg h3 { margin-bottom: 0.3rem; }
.reg h4 { margin-bottom: 0.4rem; }
.hexes {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72em;
  font-weight: 400;
  color: var(--vp-c-text-3);
  letter-spacing: 0;
}
.regname {
  font-size: 0.8em;
  color: var(--vp-c-text-2);
}
.tag {
  display: inline-block;
  margin-left: 0.5em;
  padding: 0.05em 0.45em;
  border: 1px solid var(--vp-c-divider);
  border-radius: 2px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  vertical-align: middle;
}
.conflict {
  border-left: 2px solid var(--vp-c-divider);
  padding-left: 0.9rem;
  color: var(--vp-c-text-2);
  font-size: 0.92em;
}
</style>
