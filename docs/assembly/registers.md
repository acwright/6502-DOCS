# Registers, flags, and addressing

The whole processor fits on a postcard. Three registers you compute with, a
stack pointer, a program counter, and eight flags.

## The three you use

| | Width | What it's for |
|---|---|---|
| **A** — the accumulator | 8 bits | Arithmetic and logic. Everything that adds, subtracts, shifts or compares goes through here. |
| **X** | 8 bits | An index, a counter, and the only register that can reach the stack pointer. |
| **Y** | 8 bits | An index, and the second half of `(zp),Y` — the pointer-plus-offset mode. |

X and Y are nearly interchangeable, with two differences worth remembering:
`(zp,X)` and `(zp),Y` each work with only one of them, and `TXS`/`TSX` — which
move the stack pointer about — are X only.

## The other two

**SP**, the stack pointer, is 8 bits and always points somewhere in
`$0100–$01FF`. It starts at `$FF` and counts *down* as things are pushed. You
almost never touch it; the exception is a cartridge, which sets it up itself
before anything else ([Writing a cartridge](/assembly/cartridges)).

**PC**, the program counter, is 16 bits and holds the address of the next
instruction. Every jump and branch is a way of writing to it.

## The flags

One byte, called P. `PHP` and `PLP` push and pull it.

| Flag | Set when |
|---|---|
| **N** — negative | The result's top bit is 1 |
| **V** — overflow | A signed addition or subtraction went out of range |
| **B** — break | A `BRK` caused this interrupt, not the hardware |
| **D** — decimal | Set by `SED`: arithmetic works in packed decimal until `CLD` |
| **I** — interrupt disable | Set by `SEI`: hardware interrupts are ignored until `CLI` |
| **Z** — zero | The result was zero |
| **C** — carry | An addition carried out, a subtraction did not borrow, or a shift pushed a bit out |

<Diagram
  name="status-flags"
  caption="Bit 5 is not a flag and always reads 1. The Monitor prints the other seven in this order, left to right."
/>

Four of them do the work. **Z** and **N** are set by almost every instruction
that produces a value, so `lda Count` followed by `beq Empty` needs no test in
between. **C** carries between bytes when you do 16-bit arithmetic, and it is
also how a lot of the ROM reports success: carry clear means it worked, carry
set means it didn't.

::: tip The two rules people get wrong
`CLC` before `ADC`, every time — the carry is *added in*. And `SEC` before
`SBC`, because on a 6502 the carry is a **borrow, inverted**: set means "no
borrow yet".
:::

## Addressing modes

An instruction's addressing mode is how it finds the byte it works on. There
are eleven, and they are the actual grammar of the language.

| Mode | Looks like | Where the byte comes from |
|---|---|---|
| Immediate | `lda #42` | The number is in the instruction |
| Zero page | `lda $40` | Address `$0040` — one byte of address, one cycle saved |
| Zero page,X | `lda $40,x` | `$0040` plus X, wrapping inside page zero |
| Absolute | `lda $1234` | Any address |
| Absolute,X / ,Y | `lda $1234,x` | That address plus the index |
| Indirect | `jmp ($0300)` | The address stored at `$0300` — `JMP` only |
| Zero page indirect | `lda ($40)` | The address stored at `$0040` — a 65C02 addition |
| Indexed indirect | `lda ($40,x)` | The address stored at `$0040 + X` |
| Indirect indexed | `lda ($40),y` | The address stored at `$0040`, plus Y |
| Relative | `bne Loop` | A branch, ±127 bytes from here |
| Implied | `inx`, `rts` | No operand at all |

### The two that matter most

**Zero page** is the first 256 bytes, and instructions that use it are a byte
shorter and a cycle faster than the same instruction reaching anywhere else.
The Kernal uses `$00–$39`. **The 198 bytes from `$3A` to `$FF` are yours** while
your program is in charge, and putting your hot variables there is the cheapest
speed-up available.

**Indirect indexed** — `(zp),Y` — is how you walk through memory:

```asm
Source := $40                   ; two zero-page bytes hold the address

  lda #<Message                 ; low byte of where the text starts
  sta Source
  lda #>Message                 ; high byte
  sta Source + 1

  ldy #0
Copy:
  lda (Source),y                ; the Y'th byte of the message
  beq Done                      ; strings end with a zero
  jsr Chrout
  iny
  bra Copy
Done:
  rts
```

`#<` and `#>` are the assembler's way of saying "low half of that address" and
"high half". You will type them constantly: every ROM routine that takes a
pointer takes it as a low byte and a high byte.

## Doing 16-bit arithmetic

The processor is 8 bits wide, so anything bigger is done a byte at a time with
the carry passing between them:

```asm
  clc
  lda ScoreLow
  adc #10
  sta ScoreLow
  lda ScoreHigh
  adc #0                        ; adds only the carry
  sta ScoreHigh
```

Subtraction is the same shape with `sec` and `sbc`. Comparing a 16-bit value
is `cmp` on the high byte, then on the low byte if the high bytes matched.

## Jumping and branching

`JMP` goes anywhere. `JSR` goes anywhere and remembers where it came from;
`RTS` comes back. Branches — `BEQ`, `BNE`, `BCC`, `BCS`, `BMI`, `BPL`, `BVC`,
`BVS`, and the 65C02's `BRA` — are relative and reach 127 bytes each way.

When a branch cannot reach, the fix is to invert it and jump:

```asm
  beq Near                      ; too far? then:
  bne Skip
  jmp Near
Skip:
```

cc65 will do that rewriting for you if the source says `.macpack longbranch`
and you write `jeq` instead of `beq`.

Next: [the instruction set](/assembly/instructions).
