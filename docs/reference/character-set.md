---
outline: false
---

<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const charset = facts.charset

// Each glyph is drawn from the eight bytes the video card holds rather than from
// a font that looks like them, so what you see here is the pattern table itself.
// A text cell is six pixels wide: the top six bits of each byte.
const path = (rows) => {
  const rects = []
  rows.forEach((byte, y) => {
    for (let x = 0; x < 6; x++) {
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

Two hundred and fifty-six characters, eight bytes each. They are IBM
**Code Page 437** — the set the original PC shipped with, which is why it has
box-drawing lines, card suits, Greek letters and three densities of shading
alongside the alphabet.

Each glyph is a 6 × 8 cell with the drawing five pixels wide, leaving a column
of space to its right so that letters don't touch. The set belongs to the video
card, which carries it in its own firmware, so this table *is* what the screen
has to work with.

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
          <svg viewBox="0 0 6 8" role="img" :aria-label="ch.name">
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

The character is there on the card. It is `Chrout` that will not pass it on.

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
| `$E0`–`$FE` | Greek letters and math symbols |
| `$FF` | A blank, distinct from space only in that it is a different code |

## Where it lives

Not in the ROM. The video card keeps the set in its firmware and copies it into
its own memory, at `$0800`–`$0FFF` of the card's 64 KB: 2 KB, 256 characters ×
8 bytes each, exactly. That copy is the pattern table text mode draws from, and
nothing in the computer's own address space holds another.

Because it is a copy, it can be changed and put back. Rewrite a character's
eight bytes and every place it appears on the screen changes shape; the Kernal's
`InitVideo` has the card copy its set in again, and `VdpLoadFont` copies it
into any pattern table a program has set up. [The screen](/assembly/video)
covers both, and the character-set tricks that make text-mode games work.

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
