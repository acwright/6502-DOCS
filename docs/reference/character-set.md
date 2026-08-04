---
outline: false
---

<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const charset = facts.charset

// Each glyph is drawn from its eight ROM bytes rather than from a font that
// looks like them, so what you see here is the pattern table itself.
const path = (rows) => {
  const rects = []
  rows.forEach((byte, y) => {
    for (let x = 0; x < 8; x++) {
      if (byte & (0x80 >> x)) rects.push(`M${x} ${y}h1v1h-1z`)
    }
  })
  return rects.join('')
}

const grid = Array.from({ length: 16 }, (_, hi) =>
  charset.chars.slice(hi * 16, hi * 16 + 16)
)

const hex = (n) => n.toString(16).toUpperCase()
</script>

# The character set

Two hundred and fifty-six characters, in ROM, eight bytes each. They are IBM
**Code Page 437** — the set the original PC shipped with, which is why it has
box-drawing lines, card suits, Greek letters and three densities of shading
alongside the alphabet.

Each glyph is an 8 × 8 cell with the drawing five pixels wide and pushed to the
left of the byte. The Kernal copies the whole lot into the video card at
power-on, so this table *is* what the screen has to work with.

Row is the high hex digit, column the low one. `A` is row `4`, column `1` —
`$41`, which is also 65, which is also what `ASC("A")` tells you.

<div class="charset">
  <table>
    <thead>
      <tr>
        <th></th>
        <th v-for="i in 16" :key="i">{{ hex(i - 1) }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, hi) in grid" :key="hi">
        <th>{{ hex(hi) }}x</th>
        <td v-for="ch in row" :key="ch.code" :title="ch.hex + '  ' + ch.name">
          <svg viewBox="0 0 8 8" role="img" :aria-label="ch.name">
            <path :d="path(ch.rows)" />
          </svg>
        </td>
      </tr>
    </tbody>
  </table>
</div>

## What `PRINT` can reach

Not all of it — and this is the thing that catches people.

`PRINT CHR$(n)` goes through the Kernal's `Chrout`, and `Chrout`'s video path
passes **`$20` to `$7E`** through to the screen, honours four control codes
(carriage return, line feed, backspace and bell), and **discards everything
else**. That includes every code from `$7F` up: all the box drawing, all the
shading, every accented letter.

So this does nothing at all:

```basic
PRINT CHR$(219)
```

The character is there in ROM. It is `Chrout` that will not pass it on.

::: tip Getting at the rest
From assembly there is a second routine, `VideoChroutRaw`, which puts any of
the 256 codes on the screen unfiltered. That is how a program draws a box or
fills an area with shading — see [The screen](/assembly/video).

From BASIC, the way to reach the upper half is to redefine the characters you
*can* print. The pattern table is writable, so you can point `A` at whatever
shape you like and then print `A`.
:::

## Which codes are which

| Range | What is in it |
|---|---|
| `$00`–`$1F` | Faces, card suits, arrows, musical notes. Historically the control codes; here they are pictures |
| `$20`–`$7E` | Space, punctuation, digits, capitals, lower case — plain ASCII, and the only part `PRINT` will pass |
| `$7F` | A house |
| `$80`–`$AF` | Accented letters, currency, fractions, Spanish punctuation |
| `$B0`–`$B2` | Light, medium and dark shading — the three densities |
| `$B3`–`$DA` | Box drawing, single and double lined |
| `$DB`–`$DF` | Solid blocks: full, half, quarters |
| `$E0`–`$FE` | Greek letters and maths symbols |
| `$FF` | A blank, distinct from space only in that it is a different code |

## Where it lives

The set sits at `$B800`–`$BFFF`, immediately above the Kernal and below BASIC.
It is 2 KB of the 32 KB ROM: 256 characters × 8 bytes each, exactly.

[The memory map](/assembly/memory-map) has the rest of the ROM;
[The screen](/assembly/video) covers writing to the pattern table and the
character-set tricks that make text-mode games work.

<div class="card-link">

📄 **[Character Set card](/cards/character-map.html)** — the whole grid plus
every glyph's name, on three printable pages.

</div>

<style scoped>
.charset table {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.charset th,
.charset td {
  text-align: center;
  padding: 0.2rem;
}

.charset thead th,
.charset tbody th {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  font-weight: 400;
}

.charset svg {
  width: 100%;
  max-width: 1.75rem;
  height: auto;
  display: block;
  margin: 0 auto;
  fill: var(--vp-c-text-1);
  shape-rendering: crispEdges;
}
</style>
