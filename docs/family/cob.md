<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
const cob = facts.systems.systems.find(s => s.id === 'cob')
</script>

# COB — Computer On a Backplane

The first machine in the family, and still the best one to build if you want to
*see* how a 6502 computer works.

<PlaceholderImage
  label="A populated COB"
  caption="The Backplane Pro with CPU, memory, video, sound and storage cards fitted, seen from the side so all the cards are visible at once."
/>

There is no motherboard here. A passive backplane carries the bus across five
slots and nothing else; every function is a card you choose to fit. Want video?
Fit the VGA card. Don't need sound? Leave the slot empty. The machine boots
either way — the BIOS looks around at startup, notes what it found, and does
without whatever isn't there.

Five slots not enough? A Backplane Helper chains another backplane onto the
first, and you can keep chaining. Nothing in the design caps it — the limit is
how far the bus will carry before the signals give up.

Building it one card at a time is how the whole architecture got proved, and
it's why the rest of the family works the way it does. If you're laying out your
own 6502 board, this is the reference design to read.

## The backplanes

<ul>
  <li v-for="board in cob.boards" :key="board.name">
    <strong>{{ board.name }}</strong><span v-if="board.detail"> — {{ board.detail }}</span>
  </li>
</ul>

Power comes in on a DC barrel jack; the Backplane Pro Rev 1.1 adds an on-board
power switch and moves to all through-hole parts, which makes it a much
friendlier first build.

## The card catalogue

<table>
  <thead><tr><th>Card</th><th>What it adds</th></tr></thead>
  <tbody>
    <tr v-for="item in cob.optional" :key="item.part">
      <td>{{ item.part }}</td>
      <td>{{ item.role }}<span v-if="item.detail"> — {{ item.detail }}</span></td>
    </tr>
  </tbody>
</table>

Several come in a **Pro** variant, which is generally the later, better-behaved
revision. The **Blinkenlights Card** does nothing useful and is worth fitting
anyway.

## A minimum machine

CPU Card, Memory Card, and either a VGA Card or a Serial Card so there's
somewhere to put the prompt. That's a working computer with BASIC on it.
Everything else is an upgrade.

## Where to get it

Schematics, board files, bills of materials and the keyboard controller
firmware are all in the
[6502-COB repository](https://github.com/acwright/6502-COB). The printable
reference sheet is [here](/cards/cob.html).

The COB's cards are also what you'd use to build a
[standalone KIM](/addons/kim#building-a-kim-on-its-own).
