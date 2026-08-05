# Reference cards

Fourteen sheets, sized for letter paper, meant to be printed and kept next to
the keyboard. Each one condenses a chapter, so a card is a shortcut to something
this guide also explains at length — never the only copy.

They open as plain pages outside the guide. Use your browser's back button to
come back.

## How to print one

Open the card, print, and set:

- **Paper:** Letter
- **Scale:** 100% — not "fit to page", which will shrink the margins away
- **Margins:** None
- **Background graphics:** On — the black bars are part of the design

Every card repeats those settings in a strip along the top of the screen, and
that strip is not printed. The fonts are in the page, so a card printed from a
laptop with no internet looks the same as one printed online.

## The machine

| Card | What it covers | The chapter it condenses |
|---|---|---|
| 📄 **[6502-ACE](/cards/ace.html)** | The whole machine on two pages: what is on the board, the memory map, the first things to type, and enough BASIC and Monitor to get going. The one to print first | [The ACE](/the-ace) |
| 📄 **[Memory Map](/cards/memory-map.html)** | All 64 KB, then RAM and ROM in detail, then every I/O register on the board | [The memory map](/assembly/memory-map) |
| 📄 **[Connectors](/cards/connectors.html)** | Every socket and header, pin by pin, off the schematic | [Connectors](/reference/connectors) |
| 📄 **[Keyboard Layout](/cards/keyboard-layout.html)** | The 67 keys as they sit, and the ones that do something out of the ordinary | [The keyboard](/using/keyboard) |
| 📄 **[Keyboard Matrix](/cards/keyboard-matrix.html)** | The 8 × 8 grid behind those keys, with the code each one sends | [The keyboard matrix](/reference/keyboard-matrix) |

## The software

| Card | What it covers | The chapter it condenses |
|---|---|---|
| 📄 **[BASIC Reference](/cards/basic-reference.html)** | Every keyword with its syntax, the operator table, every error message, and the three traps that catch everyone | [Every keyword](/basic/reference) |
| 📄 **[Monitor Reference](/cards/monitor-reference.html)** | All seventeen commands, the register display, and `G` versus `J` | [The Monitor](/using/monitor) |
| 📄 **[Kernal Jump Table](/cards/kernal-jump-table.html)** | All 53 published entry points with their registers, grouped by job | [The Kernal](/assembly/kernal) |
| 📄 **[Character Set](/cards/character-map.html)** | All 256 glyphs drawn from the ROM's own bytes, with names, and what `PRINT` can actually reach | [The character set](/reference/character-set) |
| 📄 **[F18A Registers](/cards/f18a-registers.html)** | Every enhanced register on the video card, bit by bit, plus the status registers and the attribute bytes | [Every register](/f18a/registers) |

That last one is the sheet to have printed rather than open in a tab: F18A mode
runs on real hardware only, so the machine you are testing it on is not the
machine you would be reading it on.

## The KIM add-on

| Card | What it covers | The chapter it condenses |
|---|---|---|
| 📄 **[6502-KIM](/cards/kim.html)** | The three boards, what they overlay, the pad, and the serial monitor | [The KIM keypad](/addons/kim) |
| 📄 **[Keypad Mapping](/cards/keypad-mapping.html)** | All twenty-four keycodes and what the LCD shows for each | [The keypad map](/reference/keypad-map) |

Two more sheets have the LED demos laid out to key in, byte by byte:
📄 **[Binary counter](/cards/archive/kim-led-binary-counter.html)** and
📄 **[KITT scanner](/cards/archive/kim-led-kitt-scanner.html)**.

## The rest of the family

Written for someone building one, not using one.

| Card | Machine |
|---|---|
| 📄 **[6502-COB](/cards/cob.html)** | The modular original — a passive backplane and a stack of cards. [COB](/family/cob) |
| 📄 **[6502-DEV](/cards/dev.html)** | The development rig — an emulated CPU you can single-step. [DEV](/family/dev) |
| 📄 **[6502-VCS](/cards/vcs.html)** | The console — cartridges and joysticks. [VCS](/family/vcs) |

## Older BIOS versions

The BASIC and Monitor cards for **v1.0 through v1.4** are kept under
[`/cards/archive/`](/cards/archive/bios-v1.4-basic-reference.html). They
describe machines whose ROMs are no longer current and are there for anyone
running one, not as a second opinion about this one.

## Other reference pages

Not cards, but the same job:

- [The character set](/reference/character-set) — all 256 glyphs, and the
  boundary of what `PRINT` will pass
- [Connectors](/reference/connectors) — every pinout
- [The keyboard matrix](/reference/keyboard-matrix) — the 8 × 8 grid
- [The keypad map](/reference/keypad-map) — the KIM add-on's keycodes
- [Glossary](/reference/glossary) — the words this guide uses, and what they
  mean here
- [Every keyword](/basic/reference) and
  [every error message](/basic/errors) — the BASIC reference in full
- [The memory map](/assembly/memory-map) and [The Kernal](/assembly/kernal) —
  the programmer's reference in full
