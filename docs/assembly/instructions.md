# The instruction set

Grouped by what you are trying to do, rather than alphabetically, because that
is how you look for one. Cycle counts are for the plain form of each
instruction; add one for a page crossing on an indexed read, and one more for a
taken branch.

## Moving bytes about

| | |
|---|---|
| `LDA` `LDX` `LDY` | Load a register. 2–5 cycles. |
| `STA` `STX` `STY` | Store one. 3–6 cycles. |
| `STZ` | Store zero without loading anything first. 65C02. |
| `TAX` `TAY` `TXA` `TYA` | Copy between registers. 2 cycles. |
| `TSX` `TXS` | The stack pointer, in and out of X. |

## Arithmetic

| | |
|---|---|
| `ADC` | Add with carry — `CLC` first. |
| `SBC` | Subtract with borrow — `SEC` first. |
| `INC` `DEC` | Add or subtract one, in memory or (65C02) in A. |
| `INX` `INY` `DEX` `DEY` | The same for the index registers. |
| `CMP` `CPX` `CPY` | Compare. Sets the flags, keeps the register. |

`CMP` is a subtraction that throws the answer away. After it: **Z** means equal,
**C** means the register was greater or equal, and **N** is the sign of the
difference — which is why `bcs` and `bcc` are the right branches after
comparing unsigned numbers, and `bmi`/`bpl` are the wrong ones.

## Bits

| | |
|---|---|
| `AND` `ORA` `EOR` | The three you expect. |
| `ASL` `LSR` | Shift left or right, dropping a bit into the carry. |
| `ROL` `ROR` | Rotate through the carry — how you shift a 16-bit value. |
| `BIT` | Test bits without changing anything: **Z** from `A AND memory`, and **N** and **V** straight from bits 7 and 6 of the memory byte. |
| `TRB` `TSB` | Clear or set every bit in a mask, in one instruction. 65C02. |

::: tip `BIT` reads two flags for free
Bits 7 and 6 of the byte land in **N** and **V** without touching A. Hardware
status registers are often laid out with the two most urgent flags in exactly
those positions, and this is why.
:::

## Deciding and going

| | |
|---|---|
| `BEQ` `BNE` | Zero flag set / clear |
| `BCS` `BCC` | Carry set / clear |
| `BMI` `BPL` | Negative flag set / clear |
| `BVS` `BVC` | Overflow set / clear |
| `BRA` | Always. 65C02. |
| `JMP` | Anywhere — direct, indirect, or (65C02) through a table with `(abs,X)`. |
| `JSR` `RTS` | Call and return. |

## The stack

| | |
|---|---|
| `PHA` `PLA` | Push and pull A |
| `PHX` `PHY` `PLX` `PLY` | The same for X and Y. 65C02. |
| `PHP` `PLP` | The flags |

The stack is 256 bytes at `$0100`, and it wraps rather than overflows: push 257
things and you are back where you started, quietly writing over your own return
addresses. In practice this only ever bites recursive code.

## Flags, interrupts, and stopping

| | |
|---|---|
| `CLC` `SEC` | Carry |
| `CLD` `SED` | Decimal mode |
| `CLI` `SEI` | Interrupts on / off |
| `CLV` | Clear overflow |
| `BRK` | Software interrupt — on this machine, a breakpoint into the Monitor |
| `RTI` | Return from an interrupt |
| `NOP` | Nothing, for two cycles |
| `WAI` `STP` | Wait for an interrupt / stop until reset. W65C02S. |

::: details `BRK` is two bytes, not one
The processor pushes the address of `BRK` **plus two**, so a one-byte `BRK`
would return into the middle of whatever followed it. Assemblers know this;
what it means for you is that a `BRK` used as a breakpoint should have a spare
byte after it. On this machine `BRK` lands in the Monitor with every register
on display, which makes it the cheapest debugging tool there is —
see [Reaching the machine](/basic/machine).
:::

## Decimal mode

`SED` makes `ADC` and `SBC` work in packed decimal: `$09 + $01` gives `$10`
rather than `$0A`, and each costs a cycle more than it does in binary. It is
genuinely useful for a score you intend to print digit by digit, and genuinely
dangerous if you forget to `CLD` afterwards, because every `ADC` and `SBC` you
reach later is still doing arithmetic in the mode you left set.

An interrupt is the one thing that does not inherit it. The processor clears
**D** as it takes the vector, so a handler always starts in binary — and the
mode you were in was pushed first, so `RTI` gives it back. That is one of the
65C02's fixes: on the original 6502 a handler ran in whatever mode it
interrupted, which is why 6502 handlers open with `CLD`. Here that `CLD` is
redundant.

The Kernal clears it at power-on and never sets it. If you use it, bracket it
tightly.

## The full tables

For cycle counts down to the opcode, in every addressing mode:

- [masswerk's instruction set](https://www.masswerk.at/6502/6502_instruction_set.html)
  — every opcode, every mode, every cycle count
- [The W65C02S datasheet](https://www.westerndesigncenter.com/wdc/documentation/w65c02s.pdf)
  — including `WAI`, `STP` and the Rockwell bit operations
- [Easy 6502](https://skilldrick.github.io/easy6502/) — if you want to be walked
  through it with an assembler in the page

Next: [where everything lives](/assembly/memory-map).
