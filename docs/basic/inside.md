<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'

const reserved = facts.basicKeywords.keywords.map((k) => k.name).sort()
</script>

# What BASIC does with your memory

Useful when a program gets big, when you want somewhere safe to `POKE`, or when
you're wondering where the 30,718 bytes went.

## The map

Everything BASIC owns sits between address 2048 and address 32768.

| From | To | What's there |
|---|---|---|
| 2048 | ↓ | **Your program**, growing upwards as you add lines |
| | ↓ | **Variables**, added as they're first used |
| | ↓ | **Arrays**, added as they're `DIM`med |
| | ↑ | **Strings**, growing *downwards* from the top |
| | 32768 | the ceiling |

Program, variables and arrays grow up from the bottom. Strings grow down from
the top. `?OUT OF MEMORY` is what you get when the two meet.

`PRINT FRE(0)` is the gap between them. On a machine with nothing typed in yet:

```
PRINT FRE(0)
```

```
 30718

OK
```

<PlaceholderImage
  label="Where BASIC keeps things"
  caption="A vertical strip of memory from 2048 to 32768: program, variables and arrays stacked upward from the bottom, strings growing downward from the top, and the free gap between them labelled FRE(0)."
/>

## What things cost

| | |
|---|---|
| A number, in a variable or an array element | 5 bytes |
| A string | 1 byte per character, plus a few for the bookkeeping |
| A line of program | roughly its typed length, minus a byte for every keyword |

That last one is why `DIM X(999)` costs 5,000 bytes and why long variable names
are free at runtime but not while you're typing them in.

::: details Why strings pause the machine
Every time you build a new string the old one is abandoned where it sat. When
the space runs low, BASIC stops and shuffles the live strings back together —
"garbage collection", and on a program juggling a lot of text you can watch it
happen as a pause of a second or so. It is not broken. It is tidying.
:::

## Somewhere safe to POKE

Address 2560 is above the bottom of the program area, which makes it fine as
scratch space for a *short* program and a bad idea for a long one — your own
program lines will grow up into it.

For something bigger and genuinely out of the way, use [banked
RAM](/basic/machine#the-extra-ram): the window at 32768 is not where BASIC keeps
anything, and `BANK` gives you a fresh one whenever you want.

## Reserved words

Your variable names can't contain any of these, anywhere in them — which is why
`SCORE` fails (it contains `OR`) and `TOTAL` doesn't:

<div class="reserved">
  <code v-for="w in reserved" :key="w">{{ w }}</code>
</div>

The two-letter ones are the dangerous ones: `TO`, `ON`, `IF`, `OR`, `FN`.

::: details Why a keyword can hide inside a name
When you press <kbd>Enter</kbd>, BASIC immediately replaces every keyword it can
find with a single byte — `PRINT` becomes one byte, `GOTO` becomes one byte.
That's what makes a 40-line program fit in a few hundred bytes, and it's what
`LIST` undoes to show you the text again.

The catch is that it does this by scanning for keywords before it has any idea
that the letters it's looking at are meant to be a variable name. `SCORE` gets
crunched into `SC`, the byte for `OR`, `E` — which isn't a name any more, so the
line won't parse.
:::

## Text files and program files

A program on the memory card can be either of two things.

**A tokenized program** is what `SAVE` writes: the crunched bytes exactly as they
sit in memory. `LOAD` reads it straight back. It's compact, it loads instantly,
and it isn't readable by anything else.

**A text file** is a listing as plain characters, one line after another. That's
what you get if you write your program on a laptop in an editor, and it's what
you send when you paste a listing into a terminal on [the serial
port](/using/serial). The ACE reads it by pretending you typed it.

Cross-development tools convert between the two. Two rules travel with them:

- **Load a tokenized program with `LOAD`**, not by pasting it. The bytes are not
  text and the machine will not enjoy them.
- **Don't edit the first line of a converted program.** A program built to be
  started with `RUN` from a machine-code stub carries a `SYS` on its first line
  pointing at an address. Retype that line and the address moves.

## Where the rest of it is

That's BASIC's half of the map. The other 32K — the ROM that BASIC itself lives
in, the character set, the Monitor and the eight slots where the cards appear —
belongs to the machine rather than to BASIC, and you reach it with
[`PEEK`](/basic/machine).

<style scoped>
.reserved {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.4rem;
  margin: 1rem 0;
  font-size: 0.85rem;
}
.reserved code {
  color: var(--vp-c-text-2);
}
</style>
