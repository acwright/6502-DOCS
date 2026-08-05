<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const f18a = facts.f18a
const modes = f18a.colorModes
const address = f18a.paletteAddress
const palette0 = f18a.palette.defaults[0]
const palette2 = f18a.palette.defaults[2]

const css = (rgb) => '#' + rgb.split('').map((c) => c + c).join('')
</script>

# Colors

The TMS9918A has sixteen colors and you may not have any others. They are cast
into the silicon, and every machine that used the chip — the MSX, the
ColecoVision, the TI-99/4A — looks a particular shade of green because of it.

F18A mode replaces the lot with 64 registers, each holding any of 4096 colors.

## The palette

64 entries, twelve bits each: four bits of red, four of green, four of blue.
Every one is writable at any time, including while the screen is drawing.

They are grouped into four palettes of sixteen, and at power-on they hold:

| Palette | What is in it |
|---|---|
| 0 | {{ f18a.palette.defaults[0].name }} |
| 1 | {{ f18a.palette.defaults[1].name }} — {{ f18a.palette.defaults[1].description }} |
| 2 | {{ f18a.palette.defaults[2].name }} |
| 3 | {{ f18a.palette.defaults[3].name }} — {{ f18a.palette.defaults[3].description }} |

Palette 0 is the reason a locked card looks right: it is the 9918A's own
sixteen colors, in the 9918A's own order, so every program written for the
original chip gets exactly what it asked for.

<div class="palette-grid">
  <div v-for="c in palette0.colors" :key="c.index" class="swatch">
    <span class="chip" :style="{ background: css(c.rgb) }"></span>
    <span class="idx">{{ c.index }}</span>
    <span class="nm">{{ c.name }}</span>
    <code>${{ c.rgb }}</code>
  </div>
</div>

And palette 2, which is there because somebody wanted CGA and it costs nothing
to include:

<div class="palette-grid">
  <div v-for="c in palette2.colors" :key="c.index" class="swatch">
    <span class="chip" :style="{ background: css(c.rgb) }"></span>
    <span class="idx">{{ c.index }}</span>
    <span class="nm">{{ c.name }}</span>
    <code>${{ c.rgb }}</code>
  </div>
</div>

## Writing one

The card has one data port, and normally everything you send it lands in VRAM.
Register 47 redirects that port at the palette instead.

```
lda #$84         ; bit 7 = palette mode, entry 4
ldx #47
jsr SetVdpReg

lda #$00         ; red nibble
sta $9C00
lda #$0F         ; green and blue nibbles
sta $9C00
```

Two bytes make one entry. After the second, the port goes back to writing VRAM
by itself, which is exactly what you want when you are changing one color.

Set bit 6 as well and it does not: the entry number steps on after each pair and
you can pour in a whole palette without touching register 47 again. It stays in
palette mode until you clear it, or until the entry number rolls past 63, or
until anything reads a status register. That last one is a fail-safe, and it is
also a trap — a frame interrupt that reads status will quietly drop you back
into VRAM mode partway through a palette load. Do palette loads with interrupts
off.

::: warning Which byte goes first
The two references disagree here. Hagerty's own worked example sends the red
byte first; the Pico9918's reference describes the green-and-blue byte first.

Only the card itself can settle it. Write four entries you will recognize, look
at the screen, and swap the order if the colors come out wrong. It is a one-line
fix and you will know within a second which way your card wants them.
:::

::: tip Palettes outlive a reset
Changed colors survive a soft reset. Reset the machine and the palette you left
behind is still there, which is a real surprise the first time BASIC comes back
up in the wrong colors. Only a power cycle, or writing `$C0` to register 50,
restores the defaults.
:::

## Getting more than two colors into a tile

The palette is only half of it. The other half is how a pattern picks an entry.

On a stock 9918A the pattern bits are not colors. A `1` bit means *ink here* and
a `0` bit means *paper here*, and the two actual colors come from somewhere
else — the color table, one entry per group of eight patterns, which is why
9918A graphics have that particular blocky, two-tone look.

The **enhanced color modes** change what a pattern bit means. It stops saying
where the ink goes and starts being part of a color number.

<table>
<thead>
<tr><th>Mode</th><th>Bits per pixel</th><th>Planes</th><th>Colors per tile</th><th>In a sprite</th><th>Pattern table</th><th>Palette becomes</th></tr>
</thead>
<tbody>
<tr v-for="m in modes" :key="m.ecm">
  <td><strong>{{ m.ecm === 0 ? 'Original' : 'ECM' + m.ecm }}</strong></td>
  <td>{{ m.bpp || '—' }}</td>
  <td>{{ m.planes }}</td>
  <td>{{ m.colors }}</td>
  <td>{{ m.spriteColors }}</td>
  <td>{{ m.patternTable }}</td>
  <td>{{ m.palettes }}</td>
</tr>
</tbody>
</table>

Tiles and sprites choose independently — register 49 has a field for each — so
you can leave your tiles alone and give only the sprites more colors.

::: details Why a sprite shows one color fewer
Color 0 in a sprite is always transparent. It is not an option and there is no
bit to change it. So a three-bit sprite has eight values available and seven of
them are colors.

Tiles get to choose. Each tile's attribute byte has a transparency bit that says
whether index 0 is a real color or a hole.
:::

## Bitplanes

Where do the extra pattern bits come from? Not from packing more bits into a
byte — from **more copies of the pattern table**.

The original 2 KB pattern table stays exactly where it is and keeps meaning
exactly what it meant. A second one sits 2 KB further along, a third 2 KB after
that. To get a pixel's color you take one bit from the same position in each
table and stack them:

```
plane 3    0 0 0 0 1 1 1 1        the most significant bit
plane 2    0 0 1 1 0 0 1 1
plane 1    0 1 0 1 0 1 0 1        the original pattern table
           ─────────────────
color      0 1 2 3 4 5 6 7
```

Two consequences, and they are the reason it was built this way.

**Your existing patterns still work.** Plane 1 is the pattern table you already
had. Add a second plane and every tile that used to be two colors is now four,
with the shapes unchanged. You can convert artwork one tile at a time.

**Three bits per pixel does not fit in a byte.** Eight pixels at three bits
each is three bytes, and a pixel would straddle a byte boundary. As planes it
stays one byte per eight pixels per plane, which is simple in hardware and
simple in your drawing code.

The cost is that authoring is harder — you are drawing in separated bit layers
rather than in colors — and you will want a tool. The
[TMS9918 editor](/crossdev/tools) understands the original pattern format,
which gets you plane 1.

::: tip The gap is adjustable
2 KB between planes is the default, not a rule. Register 29 sets it to 2 KB,
1 KB, 512 or 256 bytes, separately for tiles and sprites. If you are only using
64 patterns, 512-byte spacing packs three planes into the space one used to
take.
:::

## Which of the 64 a pixel lands on

Six bits address a palette register. They come from three places, and the split
shifts as the color mode changes:

<table>
<thead><tr><th>Mode</th><th>Bit 5</th><th>Bit 4</th><th>Bit 3</th><th>Bit 2</th><th>Bit 1</th><th>Bit 0</th></tr></thead>
<tbody>
<tr v-for="row in address" :key="row.mode">
  <td><strong>{{ row.mode }}</strong></td>
  <td v-for="(b, i) in row.bits" :key="i">{{ b }}</td>
</tr>
</tbody>
</table>

Read down the table and the trade is obvious. The more color a pattern carries,
the less of the address is left for choosing *which* palette — so the 64
registers behave as four palettes of sixteen at one end and eight palettes of
eight at the other.

- **attr** is the tile's or sprite's attribute byte: four bits that belong to
  that one tile or that one sprite.
- **pattern** is the bitplane data for that pixel.
- **VR24** is a global two-bit palette select per layer, and it drops out
  entirely once the pattern supplies two bits or more.

The practical read: in two-bit color, a tile's attribute byte *is* a palette
number, 0 to 15, and the tile's four colors are that group of four. Change one
byte in the attribute table and the whole tile recolors. That is the mechanism
behind recolored enemies, damage flashes and level palettes, and it costs one
write.

## What to do with it

**Recolor by writing one byte.** Same patterns, different attribute byte,
different palette group. An enemy sprite turns from green to red without a
single pattern byte moving.

**Flash a hit.** Write white into the palette register that sprite is using,
then write it back three frames later. Two writes, no artwork, and it affects
exactly the thing you meant.

**Fade the screen.** Walk all 64 registers down toward zero over eight frames.
Nothing else on the machine changes.

**Cycle a color.** Rotate a few entries and water moves, a portal swirls, a
power-up pulses — the classic 8-bit effect, and here it is nearly free because
the palette is registers rather than pixels.

**Use palette 1 on purpose.** In one-bit color every tile picks a pair of
colors out of 64, and the default palette 1 is arranged as black-and-something.
Point a layer at it and every tile is one color on black without you setting up
anything at all.

<style scoped>
.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.4rem 1rem;
  margin: 1.2rem 0;
}
.swatch {
  display: grid;
  grid-template-columns: 1.1rem 1.4rem 1fr auto;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  line-height: 1.9;
}
.swatch .chip {
  width: 1.05rem;
  height: 1.05rem;
  border: 1px solid var(--vp-c-divider);
}
.swatch .idx {
  color: var(--vp-c-text-3);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.swatch .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.swatch code { font-size: 0.75rem; color: var(--vp-c-text-2); }
</style>
