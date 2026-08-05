# IMAGES.md — the shot list and status ledger

Every image the docs want, whether it exists yet or not.
[Phase 8](PLAN.md#phase-8--images--diagrams) built the three pipelines that
produce them and this ledger records what came out, what is still a placeholder,
and what would replace it.

**This file is a working note.** A placeholder's on-page caption describes the
picture and nothing else — no phase numbers, no script names, no accuracy
findings. All of that lives here, where the reader never sees it. See
[PLAN.md's *Voice & Style*](PLAN.md#voice--style).

## The three pipelines

| Kind | Made by | Re-made with |
|---|---|---|
| **G** — a screenshot off the machine | `scripts/capture-screens.mjs` → `docs/public/images/screens/` | `npm run screens` |
| **D** — a drawn diagram | `scripts/build-diagrams.mjs` → `docs/.vitepress/diagrams/` | `npm run diagrams` |
| **P** — a photograph | `scripts/import-photos.mjs` → `docs/public/images/photos/` | `npm run photos` |

Three things follow from that split, and they are the point of it:

- **A screenshot is a real machine.** Every one boots the same ROM the samples
  run against, is driven through the same keystrokes a reader would type, and is
  read out of the video card with `dbg screen png`. Where a shot shows a
  program, the manifest points at the file under `samples/` that the chapter
  displays, so the picture cannot drift from the listing beside it.
- **A diagram is data.** Nine of the fifteen are drawn from `data/*.json` — the
  memory map, zero page, the I/O slots, the joystick byte, the jump table, the
  interrupt vectors, the BASIC memory strip, the keyboard. `npm run verify`
  fails if a checked-in drawing no longer matches what the data draws, the same
  guard the generated cards have.
- **A photograph is imported, not committed by hand.** The sources are the
  `Images/` directory of each KiCad repo, at 2–14 MB apiece; the manifest
  records the crop and the resize, so the same command produces the same
  picture. CI checks that every declared file is present, which needs nothing
  but this repo.

**Screenshots are not drift-checked**, unlike diagrams and cards. Re-taking them
is a deliberate act after a ROM change — `npm run screens` — not something CI
can assert, because it would mean asserting on a PNG encoder.

## Ledger

**Status** — `done` (real asset on the page) · `placeholder` (styled box on the
page today, via `<PlaceholderImage>`) · `pending` (not placed on any page).

| Image | Kind | Where it's used | Status | Notes |
|---|---|---|---|---|
| The ACE, from above | P | `docs/index.md` — Welcome | **done** | `photos/ace.jpg`. The whole machine in one frame, which is what the Welcome page needed to say "this is a real object". The ROM's hand-written label reads `BIOS V1.0` — the board was photographed before v1.5 ([ACCURACY.md A44](ACCURACY.md)) — so nothing on the page reads a version off it. |
| The board, without the keyboard | P | `docs/your-ace.md` | **done** | `photos/ace-board.jpg`, the top 1430 px of the same photograph. The tour chapter wants the parts filling the frame. |
| The keys | P | `docs/using/keyboard.md` | **done** | `photos/ace-keyboard.jpg`, the bottom of the same photograph. |
| The ACE keyboard layout | D | `docs/using/keyboard.md` | **done** | `keyboard.svg`, drawn from `assets/keyboard/keyboard-layout.json` by the shared drawing in `scripts/lib/keyboard.mjs` — the same one the printable card uses. Do not reach for `assets/keyboard/keyboard-layout.svg`: KLE's export draws the caps and omits every legend. |
| Everything connected | P | `docs/getting-started/setup.md` | **done** | `photos/everything-connected.jpg`, from `assets/photos/cables.png`. Shot as the kit laid out rather than a cabled machine — the caption says so ("before any of it is plugged in") rather than claiming a connection the picture doesn't show. |
| The boot screen | G | `docs/getting-started/first-boot.md` | **done** | `screens/boot-splash.png`, caught 2.65 M cycles into a cold start — the probe finished, the countdown running, BASIC not started. That needs `--pause`: a machine that runs from the moment it is spawned is past the splash before the debug server answers. |
| What happens in those five seconds | D | `docs/getting-started/first-boot.md` | **done** | `boot-flow.svg`. |
| A first session | G | `docs/getting-started/first-ten-minutes.md` | **done** | `screens/first-program.png` — the chapter's own sums, then `hello-name.bas` typed in and answered. |
| Text on screen | G | `docs/using/sound-and-video.md` | **done** | `screens/screen-text.png`, from `samples/basic/screen-text.bas`. |
| The Monitor | G | `docs/using/monitor.md` | **done** | `screens/monitor.png` — in with `BRK`, `M 0800`, `R`. |
| Wozmon | G | `docs/using/monitor.md` | **done** | `screens/wozmon.png` — the dot prompt, `J FF00`, the backslash, `FF00.FF0F`. `G FF00` hangs the machine — [A18](ACCURACY.md). |
| A laptop driving an ACE | P | `docs/using/serial.md` | placeholder | **Wants a camera.** Both screens in one frame, showing the same prompt. |
| The XModem handshake | D | `docs/using/serial.md` | **done** | `xmodem.svg`. |
| A card, its disks, its files | D | `docs/using/storage.md` | **done** | `cf-disks.svg`. |
| An ACE wearing its KIM boards | P | `docs/addons/kim.md` | **done** | `photos/kim.jpg`. |
| The keypad, close up | P | `docs/reference/keypad-map.md` | **done** | `photos/kim-keypad.jpg`, a crop of the same photograph. |
| An earlier machine, on a desk | P | `docs/family/index.md` | **done** | `photos/family-desk.jpg`, from `docs/public/images/6502.png`. Its monitor reads `6502 BASIC v1.0`, two major versions stale — [A9](ACCURACY.md#a9--the-family-hero-photo-shows-a-two-major-versions-stale-banner) offered three ways out and this is the third: it runs as a captioned historical shot, on the family page, where "this is not the machine you have" is the subject rather than a caveat. |
| Fifteen colors | G | `docs/basic/sound-and-video.md` | **done, with a caveat** | `screens/colors.png`. **It is not the palette shot the plan wanted.** `color-loop.bas` paints one color at a time over the same two words, so no frame of it ever holds more than one, and the machine finishes the loop in the time it takes to issue the next debug command — a mid-run frame is not reliably reachable. What ships is where it ends. The site's picture of the palette is the Graphics I demo. |
| The joystick bits | D | `docs/basic/controls.md`, `docs/assembly/input.md` | **done** | `joystick-bits.svg`, drawn from `data/hardware.json` — including the test line, so the diagram cannot disagree with the chapter about active low. |
| Treasure grid | G | `docs/basic/projects.md` | **done** | `screens/treasure.png`, played to the winning dig with the same four answers the harness sends. |
| Where BASIC keeps things | D | `docs/basic/inside.md` | **done** | `basic-memory.svg`. |
| PRINT's zones | D | `docs/basic/print.md` | **done** | `print-zones.svg`. |
| A populated COB | P | `docs/family/cob.md` | **done** | `photos/cob.jpg` — side on, every card visible, which is exactly what that page needed. |
| The DEV rig | P | `docs/family/dev.md` | **done** | `photos/dev.jpg`. |
| The VCS | P | `docs/family/vcs.md` | **done** | `photos/vcs.jpg`, with a cartridge standing in the slot. |
| The memory map | D | `docs/assembly/memory-map.md` | **done** | `memory-map.svg`, drawn from `data/memory-map.json`. Band heights go by the square root of the region size: at 64 KB in a page-height strip, a linear scale makes zero page two pixels. |
| Zero page | D | `docs/assembly/memory-map.md` | **done** | `zero-page.svg`. The `$3A` boundary is read out of the fact base's own description, and the drawing fails rather than guesses if that sentence stops naming an address. |
| The I/O window | D | `docs/assembly/memory-map.md` | **done** | `io-slots.svg`, drawn from `data/hardware.json`. |
| The jump table | D | `docs/assembly/kernal.md` | **done** | `kernal-table.svg`, drawn from `data/kernal.json`. |
| The status register | D | `docs/assembly/registers.md` | **done** | `status-flags.svg`. |
| Chaining an interrupt | D | `docs/assembly/interrupts.md` | **done** | `irq-chain.svg`. Carries [A36](ACCURACY.md) — push nothing — where it happens. |
| The cartridge overlay | D | `docs/assembly/cartridges.md` | **done** | `cartridge-overlay.svg`. |
| A framed sign | G | `docs/assembly/video.md` | **done** | `screens/framed-sign.png`, from `samples/assembly/screen.asm`. The one picture on the site of the character set doing something `PRINT` cannot. |
| Graphics Mode I | G | `docs/assembly/graphics.md` | **done** | `screens/graphics-1.png`, caught while the demo waits for a key. This is the site's palette shot. |
| Graphics Mode II | G | `docs/assembly/graphics.md` | **done** | `screens/graphics-2.png`. Not in the original plan; the chapter described the mode and showed nothing. |
| Multicolor mode | G | `docs/assembly/graphics.md` | **done** | `screens/multicolor.png`. |
| The cross-development toolchain | D | `docs/crossdev/index.md` | **done** | `toolchain.svg`. |
| Burning a cartridge ROM | P | `docs/crossdev/to-hardware.md` | **done** | `photos/cartridge-burn.jpg`, from `assets/photos/cartridge-burn.png`. The chip in the programmer, the cartridge board and its VC83 BASIC label waiting beside it. |
| The character set | D | `docs/reference/character-set.md` | **done** | Phase 7's, drawn from `data/charset.json` — every glyph is an SVG built from its eight ROM bytes, so the picture is the pattern table rather than a font resembling it. |

## The placeholder that's left

One needs a camera and a machine on a desk, and nothing in any repo
substitutes for it:

1. **A laptop and an ACE showing the same prompt** (`using/serial.md`).

A second would be worth having and no page reserves a slot for it: **the whole
family lined up**, oldest to newest. `photos/family-desk.jpg` is a single older
machine, not a line-up.

## Chapters that ship without a picture

Fifty-odd pages carry no image, and that is a decision rather than an
oversight — PLAN.md's exit criterion ("every chapter has at least one image")
was written before the reference half existed. They fall into three groups:

- **Reference pages that are already visual** — `basic/reference.md`,
  `basic/errors.md`, `assembly/instructions.md`, `reference/connectors.md`,
  `reference/keyboard-matrix.md`, `reference/glossary.md`. These are tables from
  end to end. A picture on top of a table is decoration.
- **Chapters whose subject is a listing** — most of `basic/` and `crossdev/`.
  The thing to look at is the program, and every one of them has one.
- **Chapters where a diagram would be a restatement** — `assembly/console.md`,
  `assembly/detection.md`, `basic/loops.md` and their neighbors. A box saying
  "call the routine" teaches nothing the sentence above it did not.

- **The eight `/f18a/` chapters, for a different reason.** Every screenshot on
  this site comes out of the emulator, and the emulator is a stock TMS9918A —
  there is no F18A mode in it to photograph. Nothing here is pending a script.

  What would actually fill these pages is a camera pointed at an ACE with the
  enhanced firmware: a two-layer scroll with the status bar sitting still, a row
  of 31 sprites not flickering, an eight-color sprite next to its one-color
  self, and the palette as it really renders. That is the highest-value unshot
  list on the site and it needs hardware, so it is recorded here rather than
  left as eight empty frames. A placeholder would be worse than nothing: it
  would imply a script is coming.

The rule this leaves behind, which is the useful part: **a picture ships when it
shows something the prose cannot say as quickly** — a shape, a layout, a piece
of hardware, or what the screen actually looks like. Fifteen diagrams, eleven
screenshots and nine photographs cleared that bar. Nothing was added to fill a
gap in a checklist.
