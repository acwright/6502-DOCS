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

## The build line

```
cl65 -t none --asm-define VDP -C 6502.cfg -l Program-VDP.lst -o Program-VDP.prg Program.asm
```

| Flag | Meaning |
|---|---|
| `--asm-define VDP` | Defines the symbol `VDP`, so `.ifdef VDP` in the source is true. |
| `-t none` | No target machine. cc65 knows about the C64 and the Apple II; it does not know about this one, and we don't want its startup code or its memory assumptions. |
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
