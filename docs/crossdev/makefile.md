# The Makefile

The template's build is forty-odd lines and there is no magic in it. Worth
reading once, because you will want to change it.

```make
TARGET = Program
EIGHTTHREE = PROGRAM
CONFIG = 6502

VDP ?= 0
ifeq ($(VDP),1)
  OUT      = $(TARGET)-VDP
  ASFLAGS  = --asm-define VDP
  RUNFLAGS = --vdp picovdp
else
  OUT      = $(TARGET)
  ASFLAGS  =
  RUNFLAGS =
endif
RUNFLAGS += $(if $(ROM),--rom $(ROM))

.PHONY: all build view run woz cf clean

all: build woz cf

build: $(TARGET).asm
	cl65 -t none $(ASFLAGS) -C $(CONFIG).cfg -l $(OUT).lst -o $(OUT).prg $(TARGET).asm

view:
	hexdump -C $(OUT).prg

run:
	6502 run $(RUNFLAGS) $(OUT).prg

woz:
	bin2woz -a 0x0800 $(OUT).prg > $(OUT).woz

cf:
	cffs create $(OUT).img --size 1M
	mkdir -p .cf
	cp -f $(OUT).prg .cf/$(EIGHTTHREE).PRG
	cffs add $(OUT).img .cf/$(EIGHTTHREE).PRG
	rm -rf .cf

clean:
	rm -rf .cf
	rm -f $(TARGET).prg $(TARGET).woz $(TARGET).lst $(TARGET).img
	rm -f $(TARGET)-VDP.prg $(TARGET)-VDP.woz $(TARGET)-VDP.lst $(TARGET)-VDP.img
```

## `VDP=1`

The block at the top is what makes one source two programs. With `VDP=1` on the
command line, every output gets `-VDP` in its name, the assembler is told
`--asm-define VDP` — which is what makes `Program.asm` include `6502-VDP.inc` —
and `make run` starts the emulator with the 6502-PICOVDP card, `--vdp picovdp`.
Without it you get the build for the older machine with a TMS9918A.

This guide's machine is the `VDP=1` one, so that is the build to type:

```sh
make VDP=1
make VDP=1 run
```

Tired of typing it? Change `VDP ?= 0` to `VDP ?= 1` and plain `make` does the
same. `ROM=path/to/BIOS.bin` on the `run` line boots a ROM image of your own
instead of the one the emulator carries.

## `FLASH=`

A cartridge template has a second build option alongside `VDP=1`. Setting
`FLASH=` asks for a [Flash Cart](/assembly/flash-carts) instead of the 32 KB
ROM cart, which changes three things at once: the linker config the build
uses, the name of the output file, and how large that file is.

```sh
make                # Cart.crt, 32,768 bytes
make FLASH=128K     # Cart-128K.crt, 131,072 bytes
make FLASH=256K     # Cart-256K.crt, 262,144 bytes
make FLASH=512K     # Cart-512K.crt, 524,288 bytes
make FLASH=1M       # Cart-1M.crt, 1,048,576 bytes
```

```make
FLASH_TARGETS = 128K 256K 512K 1M
FLASH ?=
ifeq ($(FLASH),)
  CONFIG = 6502
else
  ifeq ($(filter $(FLASH),$(FLASH_TARGETS)),)
    $(error FLASH=$(FLASH) is not a cart target)
  endif
  SUFFIX  := $(SUFFIX)-$(FLASH)
  CONFIG   = 6502-$(FLASH)
  ASFLAGS += --asm-define FLASH
endif
```

Copy the `filter` line rather than leaving it out. Without that check, typing
`FLASH=512` instead of `FLASH=512K` asks for a linker config that does not
exist, and the error you get complains about a missing file rather than about
the typo that caused it.

Use both options together and **`-VDP` comes first, then the size**:
`make VDP=1 FLASH=1M` produces `Cart-VDP-1M.crt`. A Makefile is the only place
that ordering can actually be enforced, which is why the build assembles the
name itself instead of leaving it to whoever types the command.

::: tip Why `FLASH=` and not `ROM=`
`ROM=` already means something here: it names a BIOS image for `make run` to
boot instead of the emulator's own. Two different meanings for one variable,
and the collision would be silent — `make ROM=512K run` would try to boot a
BIOS called `512K`.
:::

::: warning `make eeprom` refuses a flash image
A 28C256 holds 32 KB. A 512 KB image sent to one is truncated at the first 32
KB with no complaint from the programmer, and what comes back is a cartridge
that boots into the middle of bank `$03`. The template checks and refuses:

```make
eeprom:
	@if [ -n "$(FLASH)" ]; then \
	  echo "make eeprom writes a 28C256, which holds 32K" >&2; \
	  exit 1; \
	fi
	minipro -p AT28C256 -w $(OUT).crt
```

A Flash Cart is burnt with `make flash`, in circuit — see
[Onto real hardware](/crossdev/to-hardware).
:::

**The size in the name is a label; the size in the bytes is what the machine
reads.** Everything that loads a `.crt` picks the mapper from the byte count
and only warns when the name disagrees, so the naming above is a convenience
for you rather than something the machine relies on.

## Target by target

| `make …` | What happens |
|---|---|
| *(nothing)* | `build`, `woz` and `cf` — every shippable form of the program |
| `VDP=1` | Added to any of these: the build for the 6502-PICOVDP, named `-VDP` |
| `build` | Assemble and link. This is the one you run all day. |
| `view` | Hexdump of the image, for when you want to see the actual bytes |
| `run` | Open the emulator with the program loaded |
| `woz` | The paste-over-serial form |
| `cf` | A one-megabyte card image with the program on it |
| `clean` | Delete the build output |
| `FLASH=…` | Added to a cartridge template's build: a Flash Cart image instead of a ROM cart |
| `all-flash` | *(cartridge templates)* every Flash Cart size, one after the other |
| `eeprom` | *(cartridge templates)* burn a 28C256 |
| `flash` | *(cartridge templates)* burn a Flash Cart in circuit, through the Flash Helper |

## The build line

```
cl65 -t none --asm-define VDP -C 6502.cfg -l Program-VDP.lst -o Program-VDP.prg Program.asm
```

| Flag | Meaning |
|---|---|
| `--asm-define VDP` | Defines the symbol `VDP`, so `.ifdef VDP` in the source is true. |
| `-t none` | No target machine. cc65 knows about the C64 and the Apple II; it does not know about this one, and its startup code and memory assumptions would both be wrong here. |
| `-C 6502.cfg` | Use [this memory layout](/crossdev/linker) instead. |
| `-l Program-VDP.lst` | Write a listing: your source, interleaved with the bytes each line produced. |
| `-o Program-VDP.prg` | The output image. |

The listing file is more useful than it looks. When you want to know how big a
routine got, or what an addressing mode actually assembled to, it's there in
plain text next to the source line.

## Adding a debug build

The one target worth adding on day one. It builds the same program, plus the
symbol file that lets the debugger talk about your code by name:

```make
debug:
	cl65 -t none $(ASFLAGS) -C $(CONFIG).cfg -g -Ln $(OUT).lbl \
	     -l $(OUT).lst -o $(OUT).prg $(TARGET).asm
```

`-Ln` writes a label file and **`-g` is not optional** — without it the label
file comes out empty, which is a confusing five minutes if you don't know.
[Debugging](/crossdev/debugging) is where this gets used.

## Building more than one source file

Two ways, and the first is usually right.

**Include them.** Add `.include "sprites.asm"` to your main source and carry on;
one assembler run, one object, nothing to change in the build.

**Or link them separately**, which keeps assembly times down on a big project
and lets each file have its own private labels:

```make
OBJS = main.o sprites.o sound.o

build: $(OBJS)
	ld65 -C $(CONFIG).cfg -o $(OUT).prg $(OBJS)

%.o: %.asm
	ca65 $(ASFLAGS) -o $@ $<
```

With separate objects, a label one file wants from another has to be `.export`ed
there and `.import`ed here. That is a feature — it is the difference between a
name you meant to share and one that leaked.

Two things to watch. The linker lays segments out in the order the object files
are given, so **the file holding the BASIC stub goes first** or your entry point
won't be at `$080C`. And `ld65` needs no target library for pure assembly, which
is why the rule above doesn't mention one.

## Housekeeping

**Declare the targets you add.** `view`, `run`, `woz`, `cf` and `clean` are
actions, not files, and the template's `.PHONY` line says so: if a file called
`run` ever appeared in the directory, `make run` would otherwise quietly decide
there was nothing to do. A `debug` target belongs on the same line:

```make
.PHONY: all build view run woz cf debug clean
```

**`make cf` names the file for the card.** The card wants eight characters and
an extension, so the recipe copies the program into a scratch `.cf` directory
under `EIGHTTHREE`'s name, adds it, and removes the directory again.

## A build directory

Once there's more than one output, keeping them out of the source tree is worth
the three lines:

```make
BUILD = build

$(BUILD):
	mkdir -p $(BUILD)

build: $(BUILD)
	cl65 -t none $(ASFLAGS) -C $(CONFIG).cfg -l $(BUILD)/$(OUT).lst \
	     -o $(BUILD)/$(OUT).prg $(TARGET).asm
```

Then `build/` goes in `.gitignore` and your repository only ever holds source.
The chapters after this one assume that layout — `build/countdown.prg` and so
on — but nothing depends on it.

Next: [the linker config](/crossdev/linker), which is the `-C` in every command
above.
