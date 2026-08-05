<script setup>
import { data as facts } from '../.vitepress/data/facts.data.mts'
</script>

# The Monitor

Underneath BASIC there's a second program in the ROM that lets you look at the
machine's memory directly, byte by byte, and run code that isn't BASIC at all.

You don't need it. You can write games for years without opening it. But it's
where you go when you want to know what's *really* happening, and it's the door
into machine code.

## Getting in

Three ways, all landing in the same place:

**From BASIC**, type `BRK`:

```
BRK
6502 MONITOR v1.1
BRK AT $E9D1
PC=E9D3 A=00 X=FF Y=68 SP=FA ---B-IZC
.
```

**At startup**, press <kbd>Esc</kbd> at the `ENTER=BASIC  ESC=MONITOR` line
instead of <kbd>Enter</kbd>.

**From your own machine code**, by executing a `BRK` instruction — which is how
you use it as a debugger.

That single `.` is the Monitor's prompt, the way `OK` is BASIC's. The line
above it is the state of the processor at the moment you arrived: where it was
(`PC`), what was in its three registers (`A`, `X`, `Y`), and its flags. Don't
worry about it yet.

Here's a machine to try all three doors on. Nothing you do to its memory can
hurt anything.

<Emulator
  caption="Type BRK to go down, X to come back. Everything below works here."
/>

`X` takes you back to BASIC, with your program intact:

```
X

OK
```

## Looking at memory

`M` for memory, with an address in hexadecimal:

```
M 0800
.:0800 00 00 00 00 00 00 00 00 ........
.:0808 00 00 00 00 00 00 00 00 ........
.:0810 00 00 00 00 00 00 00 00 ........
```

Address on the left, eight bytes in hex, then the same bytes as characters on
the right — which is how you spot text in among the numbers.

`D` disassembles instead, turning bytes back into 65C02 instructions:

```
D FF00
.,FF00  A9 1B     LDA #$1B
.,FF02  C9 08     CMP #$08
.,FF04  F0 18     BEQ $FF1E
```

<Figure
  src="/images/screens/monitor.png"
  alt="A screen showing the Monitor banner, a BRK message, the register line, a dump of memory at 0800 that is all zeroes, and the register line again."
  caption="A whole visit: in with BRK, a look at $0800, and R to see the registers again."
  screen
/>

## Everything it does

<table>
  <thead><tr><th>Command</th><th>Type</th><th>What it does</th></tr></thead>
  <tbody>
    <tr v-for="cmd in facts.monitorCommands.commands" :key="cmd.command">
      <td><code>{{ cmd.command }}</code></td>
      <td><code>{{ cmd.syntax ?? cmd.command }}</code></td>
      <td>{{ cmd.readmeDescription ?? cmd.summary }}</td>
    </tr>
  </tbody>
</table>

The two you'll reach for besides `M` and `D` are `R`, which reprints that
register line, and the two ways of running code:

- **`J addr`** calls the code at that address like a subroutine. When it
  finishes, you land back at the `.` prompt with the registers on show. This is
  the one to use.
- **`G addr`** jumps there and hands the machine over completely, interrupts
  and all. Nothing brings you back except a `BRK` in the code you jumped to —
  and because interrupts are off, the keyboard has stopped working, so if the
  code doesn't return you'll be reaching for the reset button.

::: tip Zeros disassemble as BRK
Point `D` at empty memory and you get page after page of `BRK`. Nothing is
broken — the byte `$00` *is* the `BRK` instruction, and unwritten memory is all
zeros.
:::

## The easter egg

Type `J FF00`:

```
J FF00
\
```

That backslash is the prompt of **Wozmon** — Steve Wozniak's monitor for the
Apple I, written in 1976, kept here byte for byte because it deserves to
survive. It's 256 bytes long and it does three things:

- `FF00.FF0F` — show a range of memory
- `0300: A9 01 60` — put bytes into memory
- `0300R` — run from an address

It predates this machine by nearly fifty years and shares none of its commands.
Press reset when you've had enough — your BASIC program will still be there.

::: warning Use `J`, not `G`
`G FF00` prints the backslash and then ignores everything you type. Wozmon
needs the keyboard, and `G` turns interrupts off on its way out — so the
keystrokes never arrive. `J` leaves them on.
:::

<Figure
  src="/images/screens/wozmon.png"
  alt="A screen showing the Monitor prompt, the command J FF00, a backslash on the next line, and a two-line hexadecimal dump of memory starting at FF00."
  caption="That backslash is Wozmon's prompt, and those sixteen bytes are Wozmon reading itself."
  screen
/>

<div class="card-link">

📄 **[Monitor Reference card](/cards/monitor-reference.html)** — all seventeen
commands, the register display and the `G`/`J` trap, on two printable pages.

</div>
