# The Makefile

The template's build is thirty lines and there is no magic in it. Worth reading
once, because you will want to change it.

```make
TARGET = Program
EIGHTTHREE = PROGRAM
CONFIG = 6502

all: build woz cf

build: $(TARGET).asm
	cl65 -t none -C $(CONFIG).cfg -l $(TARGET).lst -o $(TARGET).prg $(TARGET).asm

view:
	hexdump -C $(TARGET).prg

run:
	6502 run $(TARGET).prg

woz:
	bin2woz -a 0x0800 $(TARGET).prg > $(TARGET).woz

cf:
	cffs create $(TARGET).img --size 1M
	cp -f $(TARGET).prg $(EIGHTTHREE).PRG || true
	cffs add $(TARGET).img $(EIGHTTHREE).PRG

clean:
	rm $(TARGET).prg $(TARGET).woz $(TARGET).lst $(TARGET).img
```

## Target by target

| `make …` | What happens |
|---|---|
| *(nothing)* | `build`, `woz` and `cf` — every shippable form of the program |
| `build` | Assemble and link. This is the one you run all day. |
| `view` | Hexdump of the image, for when you want to see the actual bytes |
| `run` | Open the emulator with the program loaded |
| `woz` | The paste-over-serial form |
| `cf` | A one-megabyte card image with the program on it |
| `clean` | Delete the build output |

## The build line

```
cl65 -t none -C 6502.cfg -l Program.lst -o Program.prg Program.asm
```

| Flag | Meaning |
|---|---|
| `-t none` | No target machine. cc65 knows about the C64 and the Apple II; it does not know about this one, and we don't want its startup code or its memory assumptions. |
| `-C 6502.cfg` | Use [this memory layout](/crossdev/linker) instead. |
| `-l Program.lst` | Write a listing: your source, interleaved with the bytes each line produced. |
| `-o Program.prg` | The output image. |

The listing file is more useful than it looks. When you want to know how big a
routine got, or what an addressing mode actually assembled to, it's there in
plain text next to the source line.

## Adding a debug build

The one target worth adding on day one. It builds the same program, plus the
symbol file that lets the debugger talk about your code by name:

```make
debug:
	cl65 -t none -C $(CONFIG).cfg -g -Ln $(TARGET).lbl \
	     -l $(TARGET).lst -o $(TARGET).prg $(TARGET).asm
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
	ld65 -C $(CONFIG).cfg -o $(TARGET).prg $(OBJS)

%.o: %.asm
	ca65 -o $@ $<
```

With separate objects, a label one file wants from another has to be `.export`ed
there and `.import`ed here. That is a feature — it is the difference between a
name you meant to share and one that leaked.

Two things to watch. The linker lays segments out in the order the object files
are given, so **the file holding the BASIC stub goes first** or your entry point
won't be at `$080C`. And `ld65` needs no target library for pure assembly, which
is why the rule above doesn't mention one.

## Housekeeping

Two small things the template leaves to you:

**`make cf` leaves an uppercase copy behind.** The card wants `PROGRAM.PRG`, so
the recipe copies the file to that name before adding it, and `clean` doesn't
remove the copy. Add it:

```make
clean:
	rm -f $(TARGET).prg $(TARGET).woz $(TARGET).lst $(TARGET).img $(EIGHTTHREE).PRG
```

**`rm` without `-f` fails on a clean tree.** `make clean` twice in a row stops
with an error the second time. The `-f` above fixes that too.

**Declare your phony targets.** `view`, `run`, `woz`, `cf` and `debug` are
actions, not files. If a file called `run` ever appears in the directory, `make
run` will quietly decide there is nothing to do:

```make
.PHONY: all build view run woz cf debug clean
```

## A build directory

Once there's more than one output, keeping them out of the source tree is worth
the three lines:

```make
BUILD = build

$(BUILD):
	mkdir -p $(BUILD)

build: $(BUILD)
	cl65 -t none -C $(CONFIG).cfg -l $(BUILD)/$(TARGET).lst \
	     -o $(BUILD)/$(TARGET).prg $(TARGET).asm
```

Then `build/` goes in `.gitignore` and your repository only ever holds source.
The chapters after this one assume that layout — `build/countdown.prg` and so
on — but nothing depends on it.

Next: [the linker config](/crossdev/linker), which is the `-C` in every command
above.
