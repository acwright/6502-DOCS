# The linker config

The assembler turns your source into bytes. The linker decides *where those
bytes go*, and `6502.cfg` is how you tell it. It is the shortest file in the
template and the one that repays reading.

## A program

```
MEMORY {
  RAM: start=$0800, size=$7800, file="%O";
}

SEGMENTS {
  CODE: load=RAM, type=rw;
}
```

Five facts, in order:

- **`MEMORY`** describes regions of the machine's address space. There is one
  here, called `RAM`.
- **`start=$0800`** — the first byte of the image belongs at `$0800`, because
  that is where BASIC's `LOAD` puts a program and where `SYS 2060` expects to
  find your stub.
- **`size=$7800`** — 30 KB, from `$0800` up to `$7FFF`. Above that is hardware,
  not memory. If your program outgrows this the linker tells you so instead of
  quietly running off the end.
- **`file="%O"`** — everything in this region goes into the output file named on
  the command line. `%O` is the linker's placeholder for `-o`.
- **`SEGMENTS`** maps the named chunks your source produces onto regions.
  `.segment "CODE"` in the source, `CODE:` here. `type=rw` means "this is
  writable memory", which is true: it's RAM.

That's the whole thing. One region, one segment, nothing clever — and the same
file for both builds, since program memory didn't move when the video card
changed.

## A cartridge

```
MEMORY {
  PAD:      start=$8000, size=$4000, file="%O", fill=yes, fillval=$00;
  CART:     start=$C000, size=$3FFA, file="%O", fill=yes, fillval=$00;
  VECTORS:  start=$FFFA, size=$0006, file="%O", fill=yes, fillval=$00;
}

SEGMENTS {
  CART:     load=CART,    type=ro;
  VECTORS:  load=VECTORS, type=ro;
}
```

Three regions instead of one, for reasons that are all physical.

**`PAD` exists because of the chip.** A 28C256 EEPROM holds 32 KB and gets
addressed from `$8000` upward, but the cartridge only *appears* from `$C000`.
The first 16 KB of the chip is never read by the machine — and a ROM burner
still needs a file that size, so the config fills it with zeroes.

**`CART` is `$3FFA`, not `$4000`.** Six bytes short, because the last six bytes
of the address space are the CPU's vectors and they get a region of their own.

**`VECTORS` is those six bytes**: NMI, RESET and IRQ, two bytes each, in that
order. The template's source ends by filling them in:

```asm
.segment "VECTORS"

.word   NmiTrampoline
.word   CartReset          ; power-on lands here
.word   IrqTrampoline
```

Get that segment wrong and the machine doesn't boot at all — the CPU reads
`$FFFC` for its start address before anything else happens.

**`type=ro`** this time, because it genuinely is read-only memory. The linker
uses that to decide what can be initialized at load time and what can't.

**`fill=yes, fillval=$00`** pads unused space with zeroes so the image is always
exactly the size of the chip. Without it you'd get a short file and a burner
that complains.

## A banked cartridge

The [Flash Cart](/assembly/flash-carts) puts a switchable 8 KB window at
`$C000–$DFFF` and pins the fixed region at `$E000–$FFF9`. The linker config is
where that arrangement stops being a description of the hardware and becomes
the actual layout of the file you program onto the chip. Here is the config
for a 512 KB cart, with most of the banks left out:

```
MEMORY {
  BANK00:  start=$C000, size=$2000, file="%O", fill=yes, fillval=$FF;
  BANK01:  start=$C000, size=$2000, file="%O", fill=yes, fillval=$FF;
  ...
  BANK3E:  start=$C000, size=$2000, file="%O", fill=yes, fillval=$FF;
  FIXED:   start=$E000, size=$1FFA, file="%O", fill=yes, fillval=$FF;
  VECTORS: start=$FFFA, size=$0006, file="%O", fill=yes, fillval=$FF;
}

SEGMENTS {
  BANK00:  load=BANK00,  type=ro, optional=yes;
  BANK01:  load=BANK01,  type=ro, optional=yes;
  ...
  FIXED:   load=FIXED,   type=ro;
  VECTORS: load=VECTORS, type=ro;
}
```

Every one of the sixty-three banks starts at `$C000`, which looks like a
mistake the first time you read it and is not. Each bank appears at `$C000`
when that bank is the selected one, and only one bank is ever selected, so
they are not competing for the address: the window is the same 8 KB of address
space no matter which bank is behind it.

Three details in that config matter, and none of them is obvious from reading
it:

**The declaration order *is* the layout on the chip.** `ld65` writes each
region that names a file into that file in the order the regions are
declared. So the file is bank `$00`, then bank `$01`, and so on, then the
fixed region, then the vectors — which is exactly how the chip is addressed.
Reorder the blocks and you have reordered the cartridge.

**`fillval=$FF`, not `$00`.** An erased flash chip holds `$FF` everywhere.
Filling the gaps with `$FF` means every unused byte of the image already
matches an erased chip, so the programmer can skip whole sectors instead of
writing them — a small cart in a big part goes on in seconds rather than a
minute and a half. The ROM cart config keeps `$00`, because an EEPROM has no
erased state to take advantage of.

**`optional=yes` on the bank segments.** A cart that uses four banks should not
have to declare fifty-nine empty ones. Without it, every `BANKnn` segment the
config names has to exist in the source or the link fails.

::: tip The four configs are generated rather than typed
Depending on the size, a config holds between fifteen and a hundred and
twenty-seven near-identical stanzas, and a set that large is one nobody keeps
consistent by hand. The templates generate all four and commit the results, so
you can read them and compare them like any other file in the project — but
change the generator rather than the config, or the next build will undo you.
:::

## Adding a segment

Say you want your level data kept apart from your code. Add a segment, and give
it the same region:

```
SEGMENTS {
  CODE: load=RAM, type=rw;
  DATA: load=RAM, type=rw;
}
```

```asm
.segment "DATA"
LevelOne:
  .byte 1, 1, 1, 1, 0, 0, 2, 2
```

Segments are laid into their region in the order the config lists them, so
`DATA` lands immediately after `CODE`, wherever `CODE` happens to end. That is
the useful, ordinary case: separate concerns, one image, nothing to think about.

::: warning A program image has no holes in it
It is tempting to give the data its own region at a fixed address —
`LEVEL: start=$6000` — so a tool can write straight into it. Don't, if both
regions write to `%O`. The output file is a *concatenation* of the regions, and
`LOAD` drops the file into memory as one contiguous block starting at `$0800`.
Your `lda LevelOne` would assemble as `lda $6000` while the bytes it wants sat
at `$0810`, and nothing would tell you.

If data really must live at a fixed address, give its region a file of its own:

```
MEMORY {
  RAM:   start=$0800, size=$5800, file="%O";
  LEVEL: start=$6000, size=$2000, file="level.bin";
}
```

Now you get two files. Load the second one separately — `BLOAD 24576, "LEVEL"`
from BASIC, or `--bin 0x6000=level.bin` in the emulator — and both halves are
where they claim to be.
:::

::: tip Uninitialized space costs nothing
A segment declared `type=bss` occupies addresses but contributes no bytes to the
file — the right home for a big buffer you fill at runtime. A program with a
4 KB `bss` buffer in it comes out sixteen bytes long.
:::

## When the linker complains

| Message | What it means |
|---|---|
| `Segment 'CODE' overflows memory area 'RAM' by n bytes` | Your program outgrew its region. Shrink it, or grow the region if there's room above. |
| `Missing memory area assignment for segment 'X'` | You used a `.segment` name the config doesn't mention. |
| `Unresolved external 'X'` | You `.import`ed something nobody `.export`ed — usually a typo. |
| `Duplicate external identifier` | The same label is defined in two object files. |

The full grammar is in the [`ld65` manual](https://cc65.github.io/doc/ld65.html),
and it does a great deal more than this. For a 6502 program on this machine,
what's above is nearly all of it you'll ever need.

Next: [the loop this all exists for](/crossdev/build-run-loop).
