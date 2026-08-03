6502-DOCS — Project Plan
========================

A multi-phase plan for building the documentation site for the **AC6502** family of
homebrew computers: a friendly user's and programmer's guide in the spirit of the
Commodore 64 manuals, covering system usage, BASIC, cross-development, and assembly
language.

- **Stack:** VitePress → GitHub Pages, no landing page (land directly in the docs)
- **Theme:** black / white / greyscale, Bebas Neue display face
- **Licence:** MIT
- **Repo:** `acwright/6502-DOCS`, published at `https://acwright.github.io/6502-DOCS/`

---

## Table of Contents

- [Guiding Principles](#guiding-principles)
- [Sources of Truth](#sources-of-truth)
- [Verification Method](#verification-method)
- [Phase Overview](#phase-overview)
- [Phase 0 — Repository & Toolchain Foundation](#phase-0--repository--toolchain-foundation)
- [Phase 1 — Fact Base & Verification Harness](#phase-1--fact-base--verification-harness)
- [Phase 2 — ASSETS Migration](#phase-2--assets-migration)
- [Phase 3 — The User's Guide](#phase-3--the-users-guide)
- [Phase 4 — The BASIC Guide](#phase-4--the-basic-guide)
- [Phase 5 — Cross-Development Environment](#phase-5--cross-development-environment)
- [Phase 6 — The Assembly Guide](#phase-6--the-assembly-guide)
- [Phase 7 — Quick Reference Cards](#phase-7--quick-reference-cards)
- [Phase 8 — Images & Diagrams](#phase-8--images--diagrams)
- [Phase 9 — Cross-Repo Accuracy Pass & Backlinks](#phase-9--cross-repo-accuracy-pass--backlinks)
- [Phase 10 — Launch & ASSETS Retirement](#phase-10--launch--assets-retirement)
- [Appendix A — Proposed Site Map](#appendix-a--proposed-site-map)
- [Appendix B — Image Inventory](#appendix-b--image-inventory)
- [Appendix C — Accuracy Findings Already Spotted](#appendix-c--accuracy-findings-already-spotted)
- [Appendix D — External Links to Include](#appendix-d--external-links-to-include)
- [Appendix E — Open Questions](#appendix-e--open-questions)

---

## Guiding Principles

1. **The docs teach; the READMEs specify.** Every repo README stays where it is and keeps
   its technical, build-oriented role. The docs site is the narrative, tutorial-first
   layer: what to type, why it works, what to build next. Where they overlap, the docs
   link to the README rather than forking the text.
2. **Nothing is claimed that has not been checked.** Every address, opcode, keyword,
   pin, and sample program is verified against the BIOS source, the emulator, or the
   KiCad schematics before it ships. See [Verification Method](#verification-method).
3. **Every code sample runs.** Not "looks right" — *runs*, headless, in CI, on the real
   emulator, with asserted output. A listing that cannot be verified does not go in.
4. **One family, five machines.** The shared BIOS is the spine of the docs. Per-machine
   differences are called out in dedicated system pages and in inline notes, never by
   duplicating a chapter five times.
5. **Print survives.** The quick reference cards remain first-class printable artefacts
   in this repo, and their content also lives in the prose docs so nothing is
   card-only.

---

## Sources of Truth

Ranked. When two disagree, the higher one wins and the lower one gets fixed.

| Rank | Source | Location | Authoritative for |
|------|--------|----------|-------------------|
| 1 | **BIOS source** | `~/Developer/Assembly/6502-BIOS` (`BIOS.inc`, `Kernal.asm`, `BASIC.asm`, `Monitor.asm`) | Kernal jump table, memory map, BASIC dialect, Monitor commands, version number, `HW_PRESENT` bits |
| 1 | **KiCad schematics** | `~/Developer/Kicad/6502-{ACE,COB,DEV,KIM,VCS}/Schematics` | Pinouts, connectors, address decoding, part numbers, jumper/switch behaviour |
| 2 | **Emulator** | `~/Developer/NodeJS/6502-EMULATOR` (v2.5.1, CLI installed at `/usr/local/bin/6502`) | Observable runtime behaviour — boot text, prompts, error messages, timing, sample output |
| 3 | **Template projects** | `6502-PRG`, `6502-CRT` (`Makefile`, `6502.cfg`, `6502.inc`) | The canonical cross-dev build, link config, and include file |
| 3 | **Tooling repos** | `bastok`, `cffs`, `bin2woz`, `TMS9918-EDITOR` | Tool CLIs and file formats |
| 4 | **Existing READMEs / ASSETS docs** | everywhere | Starting drafts only — treated as *claims to verify*, not facts |

Current firmware baseline for the whole site: **BIOS v1.5** (`BIOS.inc`:
`BIOS_VERSION_MAJOR = 1`, `BIOS_VERSION_MINOR = 5`; splash string `-- 6502 BIOS v1.5 --`).

---

## Verification Method

The emulator CLI is installed and agent-drivable (`6502 --version` → `2.5.1`), and
`~/Developer/NodeJS/6502-EMULATOR/docs/AGENTS.md` documents the whole method. Every
phase that produces a factual claim uses one of these four checks, and records which
one it used:

| Check | How | Used for |
|-------|-----|----------|
| **RUN** | `6502 run --headless --exit-on … --timeout …`, or the boot-once/snapshot-restore loop from `AGENTS.md` | Every BASIC listing, every assembled program, every claimed output line |
| **INSPECT** | `6502 dbg mem`, `dbg regs`, `dbg disasm`, `dbg screen text|png` | Memory map claims, Kernal entry points, screen output, character set |
| **GREP** | Read the BIOS source / `6502.inc` / schematic netlist directly | Addresses, constants, jump-table slots, tokens, error strings |
| **SCHEM** | Open the KiCad schematic or its PDF | Pinouts, connectors, decoding, BOM parts |

Rules:

- Docs sample listings live as **real files** under `samples/` in this repo, are
  included into the Markdown by path (VitePress code snippet import), and are executed
  by the harness. The prose can never drift from the tested file, because it *is* the
  tested file.
- Each sample ends with a `PASS`/`FAIL` line (BASIC) or a known console signature
  (assembly), as in `6502-BIOS/tests/` and `6502-EMULATOR/examples/06-test-suite.sh`.
- Runs pin the clock (`--rtc 2026-01-01T00:00:00`) and bound everything with
  `--timeout`; the harness waits on patterns, never sleeps.
- Video-dependent samples run with `--console video` and assert via `6502 dbg screen text`;
  the same call with `screen png` produces the screenshot the docs embed (Phase 8).

---

## Phase Overview

| Phase | Title | Depends on | Rough size |
|-------|-------|-----------|------------|
| 0 | Repository & toolchain foundation | — | S |
| 1 | Fact base & verification harness | 0 | M |
| 2 | ASSETS migration | 0 | M |
| 3 | The User's Guide | 1, 2 | L |
| 4 | The BASIC Guide | 1 | L |
| 5 | Cross-development environment | 1 | M |
| 6 | The Assembly Guide | 1, 5 | L |
| 7 | Quick reference cards | 2, 3, 4, 6 | M |
| 8 | Images & diagrams | 2, 3 | M (runs alongside 3–7) |
| 9 | Cross-repo accuracy pass & backlinks | 3–7 | M |
| 10 | Launch & ASSETS retirement | all | S |

Phases 3–6 are independently writable once Phase 1 lands and can be worked in any
order; 8 runs continuously beside them.

---

## Phase 0 — Repository & Toolchain Foundation

**Goal:** an empty-but-deployable site with the right shell, theme, and licence.

### Tasks

1. `git init`; `.gitignore` for `node_modules/`, `.vitepress/cache/`, `.vitepress/dist/`,
   `samples/**/build/`, `*.state`.
2. `npm init` + VitePress; Node 22+ (matches BIOS test suite and emulator requirements).
3. **No landing page.** Configure so `/` lands directly on the guide's first page —
   `rewrites` mapping `guide/index.md` → `index.md`, or a root `index.md` that *is*
   the introduction (no `layout: home`). Sidebar visible from the first paint.
4. **Theme:** custom VitePress theme extension, greyscale-only palette.
   - Ink/paper inverted pair for light and dark, greys for chrome, no accent hue.
   - Self-host **Bebas Neue** (woff2 in `public/fonts/`) — no external font CDN, so
     the site works offline and on Pages without a third-party request. Bebas Neue for
     headings/nav/display; a legible body face for prose; a monospace face for code
     (Source Code Pro, to match the existing reference sheets).
   - Code blocks: greyscale syntax theme (VitePress `markdown.theme` override), plus a
     `basic` and `6502asm` language registration so listings highlight.
5. `LICENSE` — MIT.
6. `README.md` for this repo — what the site is, how to run it locally (`npm run docs:dev`),
   how to add and verify a sample, how to deploy, and the links table to every sibling repo.
7. GitHub Actions workflow `.github/workflows/deploy.yml` — build + deploy to Pages;
   set `base: '/6502-DOCS/'`.
8. Second workflow `.github/workflows/verify.yml` — runs the sample harness (Phase 1)
   on every push. Docs cannot merge a broken listing.

### Deliverables

`package.json`, `.vitepress/config.mts`, `.vitepress/theme/`, `LICENSE`, `README.md`,
two workflows, one placeholder page.

### Exit criteria

- `npm run docs:build` succeeds; `npm run docs:dev` serves at `/`, and `/` is the guide
  (no marketing hero).
- Pages deploy is green and the URL renders in Bebas Neue, greyscale, light and dark.

---

## Phase 1 — Fact Base & Verification Harness

**Goal:** extract the machine's truth once, mechanically, so every later phase writes
against it instead of re-deriving it — and make the samples executable in CI.

### Tasks

1. **Extract the fact base** into machine-readable data under `data/` (consumed by
   VitePress at build time so tables in the docs are *generated*, never hand-copied):
   - `data/kernal.json` — all 51 published jump-table slots + reserved range, from
     `Kernal.asm` (GREP).
   - `data/memory-map.json` — RAM/ROM/IO ranges, from `BIOS.inc` + `BIOS.cfg` (GREP),
     cross-checked with `6502 dbg mem` spot reads (INSPECT).
   - `data/basic-keywords.json` — every statement, function, and operator with syntax
     and errors, from `BASIC.asm`'s token table (GREP).
   - `data/monitor-commands.json` — from `Monitor.asm` (GREP).
   - `data/hardware.json` — `HW_PRESENT` bits, I/O slot base addresses, chip per slot.
   - `data/systems.json` — the five machines: what's onboard, what's optional, what's
     absent, board revisions (SCHEM + README, schematic wins).
   - `data/errors.json` — BASIC and Monitor error strings, verbatim (GREP + RUN).
2. **Diff the fact base against every existing doc** (READMEs, ASSETS HTML/PDF cards)
   and write `ACCURACY.md` — a living ledger of every discrepancy found, its source of
   truth, and its resolution status. Seeded with
   [Appendix C](#appendix-c--accuracy-findings-already-spotted).
3. **Build the sample harness** `scripts/verify-samples.mjs`:
   - Boots one emulator, `--rtc`-pinned, snapshots at the `OK` prompt, restores per case.
   - Discovers `samples/**/*.bas` (typed in as source), `samples/**/*.prg` (loaded),
     `samples/**/*.asm` (built with `cl65` first, then loaded), each with a sibling
     `.expect` file of asserted console lines or a `PASS` contract.
   - Video cases: `--console video`, asserted with `dbg screen text`.
   - Exits non-zero on any failure; prints an `ok`/`FAIL` line per case.
   - Modelled directly on `6502-EMULATOR/examples/06-test-suite.sh` and
     `6502-BIOS/tests/run.mjs`.
4. **Toolchain preflight** `scripts/preflight.mjs` — checks `6502`, `cl65` (and that it
   accepts `.setcpu "W65C02"`), `node >= 22`, and optionally `bastok`, `cffs`, `bin2woz`.
   Used by CI and documented in Phase 5.

### Deliverables

`data/*.json`, `ACCURACY.md`, `scripts/verify-samples.mjs`, `scripts/preflight.mjs`,
`samples/` skeleton with two proving cases (one BASIC, one assembly).

### Exit criteria

- `npm run verify` green locally and in CI, including one deliberately failing case
  proving the harness can fail.
- Every table the docs will need exists as data, with its extraction source noted.

---

## Phase 2 — ASSETS Migration

**Goal:** move everything worth keeping out of `6502-ASSETS` and into this repo, so
that repo can be dropped.

### Inventory to migrate

| From `6502-ASSETS/` | To `6502-DOCS/` | Treatment |
|---|---|---|
| `Branding/` (logos, favicon, `.afdesign`, `.aseprite`) | `assets/branding/` + `docs/public/` | PNG/ICO wired into the site; sources retained |
| `Images/6502.png` | `docs/public/images/` | Used in the intro |
| `Labels/` (cartridge label artwork, `.afdesign`) | `assets/labels/` | Retained as-is; documented in the cartridge chapter |
| `Documentation/ACE|COB|DEV|KIM|VCS/*.html` + `.pdf` | `cards/` | Rebuilt as HTML cards (Phase 7); PDFs regenerated from the HTML by print, not carried over |
| `Documentation/BIOS/v1.0–v1.4/*.html` | `cards/` | v1.5 BASIC + Monitor cards authored fresh from the fact base; older versions archived under `cards/archive/` |
| `Documentation/Memory Map/` (`.afdesign`, PDF, PNG) | `cards/memory-map.html` + `assets/affinity/` | **Recreate as HTML/SVG**; `.afdesign` parked in `assets/affinity/` |
| `Documentation/Characters/` (charset renders + `.numbers` map) | `cards/character-map.html`, `docs/public/images/charset/` | Recreate as HTML table; keep the 1x–16x PNG renders (they're useful for graphics work) |
| `Documentation/Connectors/` (`.afdesign`, PDF, PNG) | `cards/connectors.html` + `assets/affinity/` | **Recreate as HTML**, verified against schematics (SCHEM) |
| `Documentation/Keyboard Layout/` (JSON, SVG, PNG) | `cards/keyboard-layout.html`, `assets/keyboard/` | SVG embeds directly; KLE JSON retained and linked |
| `Documentation/Keyboard Matrix/` (`.numbers`, PDF, PNG) | `cards/keyboard-matrix.html` | Recreate as HTML table (SCHEM-verified) |
| `Documentation/Keypad Mapping/` (`.numbers`, PDF, PNG) | `cards/keypad-mapping.html` | Recreate as HTML table (SCHEM-verified) |
| `Documentation/KIM/KIM LED Demo - *.html/pdf` | `samples/kim/` + docs chapter | These are *tutorials*, not cards — their content moves into the docs; listings become verified samples |

### Tasks

1. Copy the tree in, preserving `.afdesign`/`.aseprite`/`.numbers` sources under
   `assets/` with a `README.md` noting they are legacy sources pending HTML recreation.
2. Establish `cards/` with a **shared print stylesheet** (`cards/card.css`) extracted
   from the existing sheets' inline CSS — letter page shell, black header bar, Bebas
   Neue, `@page { size: letter; margin: 0 }`, `print-color-adjust: exact`. All cards
   consume it instead of each carrying 200 lines of duplicate CSS.
   - Self-host the fonts here too; the current sheets pull Bebas Neue and Source Code Pro
     from Google Fonts and therefore fail to render correctly offline.
3. Serve `cards/` from `docs/public/cards/` so every card has a stable public URL, is
   linked from the relevant chapter, and prints correctly from the browser.
4. Record every migrated file in `ASSETS-MIGRATION.md` with a ✅ per item, so the
   decision to delete the ASSETS repo is evidence-based (Phase 10).

### Exit criteria

- Nothing in `6502-ASSETS` is unaccounted for: every path is either migrated, recreated,
  or explicitly marked "intentionally dropped" with a reason.
- All cards render from the shared stylesheet and print to correct letter pages offline.

---

## Phase 3 — The User's Guide

**Goal:** the C64-manual half — someone unboxes a machine, powers it on, and gets
somewhere without knowing what a Kernal is.

### Chapters

1. **Welcome / What is the AC6502?** — the family, the shared architecture, one BIOS,
   what each machine is for. Photos of all five.
2. **Choosing your machine** — comparison table generated from `data/systems.json`:
   ACE (all-in-one SBC), COB (backplane + cards), DEV (Teensy-emulated CPU dev vehicle),
   KIM (keypad/LCD minimal), VCS (cartridge console). What's built in, what's optional.
3. **Setting up** — power, video (Pico9918 → VGA), audio (ARMSID), keyboard (PS/2 *and*
   matrix, both live at once), joysticks, serial terminal, CompactFlash card.
4. **First power-on** — the probe-and-boot sequence in plain language, the splash
   (`-- 6502 BIOS v1.5 --` / `ENTER=BASIC ESC=MONITOR`), the ~5 s countdown, the beep,
   and what a missing card does *not* do (graceful degradation, nothing hangs).
5. **Your first ten minutes** — `PRINT`, arithmetic, a two-line `GOTO` loop, `LIST`,
   `RUN`, `NEW`. Every line RUN-verified; screenshots from `dbg screen png`.
6. **The keyboard** — layout, matrix, control keys, Ctrl+C to break, the reset button.
7. **Storage** — CF cards, the 256 × 1 MB disk-bank model, `DISK`, `DIR`, `LOAD`, `SAVE`,
   `DEL`, `FORMAT`, `BLOAD`/`BSAVE`, the 16-entry / 8.3 directory limit, and what to do
   when there is no card (`NO DEVICE`).
8. **Serial & XModem** — 19200 8-N-1, terminal setup, `LOAD`/`SAVE` with no filename,
   the `XMODEM RX/TX READY` handshake and its ~60 s window.
9. **The Monitor for users** — three ways in, what the `.` prompt is, `M`, `D`, `R`,
   `G`, `X` back to BASIC, and the Wozmon easter egg at `$FF00`.
10. **Sound & video basics** — `SOUND`, `VOL`, `CLS`, `LOCATE`, `COLOR`, the 40×24 text
    screen, the 16 colours.
11. **Using the emulator instead of hardware** — desktop app, the browser build at
    `acwright.github.io/6502-EMULATOR`, loading programs, CF images.
12. **Per-system pages** — one each for ACE, COB, DEV, KIM, VCS: what makes it different,
    its boards/cards, its quirks, its quick reference card, link to its hardware repo.
    KIM gets the keypad/LED chapters (including the two LED demos migrated from ASSETS);
    VCS gets cartridges and joysticks; COB gets the card catalogue and slot map; DEV gets
    the Teensy/vrEmu6502 workflow.
13. **Troubleshooting** — no video, no beep, key repeat, CF not detected, `HW=$xx` from
    `MEM` as the diagnostic, reading `HW_PRESENT` at `$030D`.

### Exit criteria

Every command shown is RUN-verified; every hardware claim is SCHEM- or GREP-sourced;
every system page cross-links to its KiCad repo and its card.

---

## Phase 4 — The BASIC Guide

**Goal:** a complete, teachable BASIC manual — tutorial front, reference back, like the
C64 *User's Guide* + *Programmer's Reference* in one.

### Part I — Tutorial

1. Immediate mode vs. program mode; line numbers; editing lines; `LIST`, `RUN`, `NEW`, `CLR`.
2. Numbers and variables — single-letter names `A`–`Z`, `A$`–`Z$`, 5-byte / 40-bit floats,
   ~±1.7 × 10³⁸, six significant digits, the leading-space sign convention.
3. `PRINT` in depth — `;` vs `,`, the 14-column print zones, `TAB`, `SPC`, `POS`, `HEX`.
4. `INPUT`, `?REDO FROM START`, `?EXTRA IGNORED`.
5. Decisions — `IF/THEN/ELSE`, comparison and the `-1`/`0` truth convention, `AND`/`OR`/`NOT`
   being *bitwise on integer parts* (a classic trap; gets its own worked example).
6. Loops — `FOR/NEXT`, `STEP`, the limit tested at `NEXT` (so the body always runs once),
   the 8-nest limit.
7. Subroutines — `GOSUB`/`RETURN`, `ON…GOTO`/`ON…GOSUB`, the ~20-level stack budget and
   the `OUT OF MEMORY` it raises.
8. Arrays and `DIM` — 1-D only, `0..size`, `REDIM'D ARRAY`.
9. Strings — `LEN`, `LEFT$`/`RIGHT$`/`MID$`, `CHR$`/`ASC`, `STR$`/`VAL`, concatenation,
   the heap growing down from `$8000`.
10. `DATA`/`READ`/`RESTORE`.
11. `DEF FN`.
12. Graphics & sound from BASIC — `CLS`, `LOCATE`, `COLOR`, `SOUND`, `VOL`, and the
    character-set tricks that make text-mode games work.
13. Input devices — `INKEY`, `JOY(1)`/`JOY(2)` and the **active-low** bitmask
    (`IF (JOY(1) AND 16) = 0`), `WAIT`, `PAUSE`.
14. Files — `LOAD`/`SAVE`/`DIR`/`DEL`/`DISK`/`FORMAT`, `BLOAD`/`BSAVE` for data and
    graphics, XModem over serial.
15. Time & NVRAM — `TIME`, `DATE`, `SETTIME`, `SETDATE`, `NVRAM`/`NVRAM()`.
16. Reaching the machine — `PEEK`, `POKE`, `SYS`, `BANK`, `MEM`, `FRE`, and `BRK` into
    the Monitor.
17. Debugging your program — `STOP`/`CONT`, Ctrl+C, `CAN'T CONTINUE` and why, and
    reading a `LIST` after a crash.
18. **Worked programs**, each a verified sample and each teaching one thing:
    guessing game (`INPUT`/`IF`), times table (`FOR`), a text-mode animation
    (`LOCATE`/`PAUSE`), a joystick sprite mover, a sound demo, a CF file browser,
    a KIM LED counter, an RTC clock display.

### Part II — Reference

- Full keyword reference generated from `data/basic-keywords.json`: syntax, arguments,
  ranges, errors, example, and a verified one-liner per entry.
- Operator precedence table.
- Complete error message list with cause and cure, verbatim from the ROM.
- Memory map from BASIC's point of view (program → variables → arrays → string heap).
- Reserved words / tokenizer notes (why `FOR` still crunches as `FOR`).
- The `.bas` vs `.prg` distinction and the two `.prg` rules (don't edit the BASIC line;
  load with `LOAD`).

### Exit criteria

Every keyword entry has a passing sample; the error list is diffed against `BASIC.asm`;
the `-1`/`0`, active-low joystick, and `FOR`-tests-at-`NEXT` traps each have an explicit
worked example because each of them is a place the docs could quietly be wrong.

---

## Phase 5 — Cross-Development Environment

**Goal:** get a reader from "empty directory" to "my program is running on the machine"
on macOS, Linux, and Windows.

### Chapters

1. **Why cross-develop** — edit in a real editor, assemble in a second, test headless,
   then burn/copy to hardware.
2. **Installing cc65 — and the 2.19 trap.** The ROM and templates use
   `.setcpu "W65C02"`, which cc65 only gained in **July 2025**; every package manager
   still ships the 2.19 release from 2020. `brew install --HEAD cc65` on macOS, or the
   from-source recipe (bin + `none` target library, needed for `.macpack longbranch`).
   Include the `ca65` one-liner that proves your install is new enough.
   *(This is exactly the point `6502-ASM/README.md` currently gets wrong — see
   [Appendix C](#appendix-c--accuracy-findings-already-spotted).)*
3. **The tool belt** — install and purpose of each:
   - `6502` emulator CLI (from the app: Settings → Command Line → Install)
   - `bastok` — tokenize `.bas` text → `.prg`
   - `cffs` — build CompactFlash disk images
   - `bin2woz` — binary → Wozmon paste-able upload
   - `TMS9918-EDITOR` — character / screen / sprite editor
   - `minipro` — optional, for burning AT28C256 EEPROMs
4. **Starting from a template** — clone `6502-PRG` (RAM program at `$0800`, `10 SYS 2060`
   stub, entry at `$080C`) or `6502-CRT` (cartridge overlaying `$C000–$FFFF`). What every
   file in the template is for: `Makefile`, `6502.cfg` (linker config), `6502.inc`
   (Kernal API + hardware constants), the source.
5. **Anatomy of the Makefile** — target by target: `all`, `view`, `woz`, `cf`, `run`,
   `clean`; how to add a target; how to build multiple sources.
6. **The linker config** — segments, load/run addresses, why a program starts at `$0800`
   and a cartridge at `$C000`, and how to add a segment for data.
7. **The edit → build → run loop** — `make && make run`, then the headless form:
   `6502 run --headless build/game.prg --exit-on … --timeout …`.
8. **Debugging** — the debug server, `dbg break`/`regs`/`mem`/`step`/`disasm`, symbol
   loading from `.dbg`/`.lbl`, conditional breakpoints, watchpoints, `screen text`,
   snapshot/restore, and the exit-code table.
9. **Testing your program** — write a regression suite the way the BIOS does: boot once,
   snapshot, restore per case, wait rather than sleep, bound everything, branch on exit
   codes. Ship a copyable `test.sh`.
10. **Getting it onto real hardware** — CF image via `cffs`, XModem over serial, Wozmon
    paste via `bin2woz`, EEPROM via `minipro`, cartridge burning.
11. **BASIC in a cross-dev workflow** — write the listing as text, `bastok` it, `cffs` it,
    run it; keep listings diffable in git.
12. **Driving the emulator from an AI agent** — link and summarise
    `6502-EMULATOR/docs/AGENTS.md`; it's a genuine differentiator of this ecosystem.

### Exit criteria

A reader following the chapter from scratch on a clean machine reaches a running
program; the preflight script from Phase 1 backs every prerequisite claim.

---

## Phase 6 — The Assembly Guide

**Goal:** the *Programmer's Reference Guide* half — write machine code for these
machines, with the Kernal as the platform API.

### Chapters

1. **The 65C02** — what it adds over the NMOS 6502; the WDC W65C02S specifically
   (Rockwell `RMB`/`SMB`/`BBR`/`BBS` plus `WAI`/`STP`), and why cc65 needs `W65C02`.
2. **Registers, flags, addressing modes** — with a table per mode and a worked example.
3. **Instruction reference** — grouped by function, with cycle counts; links out to the
   canonical opcode matrices rather than retyping them badly.
4. **The memory map in full** — from `data/memory-map.json`: zero page (which bytes the
   Kernal owns and which 198 are yours from `$003A`), stack, the `$0200` keyboard ring
   buffer, `$0300` Kernal variables, `$0400–$05FF` BASIC buffers, the `$0600–$07FF` CF
   sector buffer that any filesystem call clobbers, program RAM, the eight 1 KB I/O
   slots, Kernal, charset, BASIC, Monitor, Wozmon, vectors.
5. **The Kernal API** — the full 51-slot jump table from `data/kernal.json`, each with
   entry/exit registers, side effects, and a runnable snippet. Grouped: console, video,
   sound, storage/filesystem, serial/XModem, RTC/NVRAM, keyboard/joystick, system.
   Front and centre: *call the slot, not the implementation*.
6. **Hello world in assembly** — from the `6502-PRG` template, assembled, loaded, run,
   with the console output asserted.
7. **Console I/O** — `Chrout`, `Chrin` (non-blocking, carry-flagged), `PrintStr`,
   `PrintCRLF`, `PrintDecU16`, `IO_MODE` and routing to serial.
8. **Video / TMS9918** — the text mode the BIOS sets up, VRAM layout, `VideoPutChar`,
   cursor routines, `VideoSetColor`, the CP437 charset at `$B800`, and going beyond text
   mode: Graphics I, Graphics II, Multicolor (using the `6502-ASM` TMS demos as the
   worked examples), sprites, and the `TMS9918-EDITOR` workflow.
9. **Sound / SID** — `InitSID`, `SidPlayNote`, `SidSilence`, `SidSetVolume`, register-level
   access for envelopes and waveforms, and what ARMSID does and doesn't reproduce.
10. **Keyboard & joysticks** — the ring buffer, the dual PS/2 + matrix encoders, and the
    `KBDisable` → raw read → `KBEnable` dance with its ~200 µs settle; reading both
    sticks in one window.
11. **Storage** — `FsLoadFileAddr`/`FsSaveFileAddr`/`FsSetDisk`/`FsFormatDisk`,
    `StReadSector`/`StWriteSector`/`StWaitReady`, the directory format, and error handling
    when the card is missing or wedged.
12. **Serial & XModem** — `InitSC`, `SerialChrout`, `XModemLoad`/`XModemSave`,
    `XFER_PTR`/`XFER_REMAIN`.
13. **RTC & NVRAM** — read/write time and date, the 256 battery-backed bytes.
14. **Interrupts** — `IRQ_PTR` (`$0300`), `BRK_PTR` (`$0302`), `NMI_PTR` (`$0304`),
    installing a handler, what the BIOS's own IRQ does each tick, and how to chain rather
    than replace.
15. **Hardware detection & graceful degradation** — read `HW_PRESENT` (`$030D`), guard
    your own code the way the Kernal guards its own, and check `KernalVersion` (`$A07B`).
16. **Writing a cartridge** — the `$C000–$FFFF` overlay, what survives (Kernal + charset),
    Pattern A (`ldx #$ff / txs / jsr $A078 / cli / jmp Main`), Pattern B with `Beep`,
    `BOOT_VECTOR` (`$035B`) and its zeroing-by-`KernalInit` gotcha, and the `6502-CRT`
    template end to end.
17. **Mixing BASIC and assembly** — `SYS`, the `10 SYS 2060` stub, passing values through
    `POKE`/`PEEK`, and the "don't edit the BASIC line of a `.prg`" rule.
18. **Banked RAM** — `BANK n`, the `$8000–$83FE` window, and using it for data.
19. **Optimisation & idioms** — zero-page indirect, the Rockwell bit ops, `WAI` for IRQ
    sync, self-modifying code, timing with the VIA T1 via `SysDelay`.
20. **Worked projects** — port the `6502-ASM` samples (Hello World, KIM LED counter, KIM
    KITT scanner, the three TMS demos) into full annotated walk-throughs, each assembled
    and run by the harness.

### Exit criteria

Every jump-table entry documented and matching `Kernal.asm` byte for byte; every snippet
assembles with `cl65` and runs in the harness.

---

## Phase 7 — Quick Reference Cards

**Goal:** every card that existed in ASSETS exists here — accurate, HTML, printable —
and *nothing lives only on a card*.

### Card set

| Card | Source | Verification |
|---|---|---|
| `basic-reference.html` | v1.5, authored from `data/basic-keywords.json` | GREP + RUN |
| `monitor-reference.html` | v1.5, from `data/monitor-commands.json` | GREP + RUN |
| `kernal-jump-table.html` | from `data/kernal.json` | GREP |
| `memory-map.html` | from `data/memory-map.json` (replaces the `.afdesign`) | GREP + INSPECT |
| `character-map.html` | CP437 set at `$B800`, rendered as an HTML table | INSPECT (`dbg mem`) |
| `connectors.html` | recreated from `.afdesign` | SCHEM |
| `keyboard-layout.html` | existing SVG + KLE JSON | SCHEM |
| `keyboard-matrix.html` | recreated from `.numbers` | SCHEM |
| `keypad-mapping.html` | recreated from `.numbers` | SCHEM |
| `ace.html`, `cob.html`, `dev.html`, `kim.html`, `vcs.html` | rebuilt from the existing sheets | GREP + SCHEM + RUN |

### Tasks

1. **Audit every existing card against the fact base before rebuilding.** The system
   sheets in particular contain sample programs — the prompt flags the ACE sheet's
   programs as largely un-runnable, and the memory map on that sheet is already known
   wrong (Appendix C). Every listing on every card gets typed into the emulator and must
   produce the output the card claims, or it gets fixed or replaced.
2. Rebuild each card on the shared `cards/card.css` from Phase 2 — same visual language
   as today's sheets (black header bar, Bebas Neue, letter pages, print-exact colours),
   but greyscale-consistent with the site and with self-hosted fonts.
3. **Port every card's content into the prose docs**, per the prompt: the card becomes a
   condensed *summary* of a chapter that stands on its own, never the only home of a fact.
   Cross-link both directions.
4. Add a `docs/reference/cards.md` index page: thumbnail, what it covers, print
   instructions (letter, 100%, margins off, background graphics on), and a link to the
   chapter each card condenses.
5. Keep the `.afdesign` sources in `assets/affinity/` with a note that the HTML is now
   canonical.

### Exit criteria

- Every card renders and prints correctly offline in Chrome and Safari.
- `ACCURACY.md` shows every card-sourced discrepancy resolved.
- No fact exists on a card that does not also exist in a chapter.

---

## Phase 8 — Images & Diagrams

**Goal:** a visual book, not a wall of text. Runs alongside Phases 3–7.

### Approach

Three tiers, in preference order:

1. **Generate it.** Screenshots come from the emulator itself:
   `6502 run --console video …` + `6502 dbg screen png`, driven by
   `scripts/capture-screens.mjs` so every screenshot is reproducible and regenerable when
   the ROM changes. This covers boot splash, BASIC session, Monitor session, character
   set, TMS graphics demos, game screens.
2. **Draw it.** Diagrams authored as hand-written **SVG** (greyscale, Bebas Neue labels,
   theme-aware): memory map, boot flow, I/O slot map, backplane/card layout, keyboard
   matrix, joystick bitmask, cartridge overlay, XModem handshake, CF disk-bank model,
   cross-dev toolchain flow. SVG so they stay crisp, diffable, and restyleable.
3. **Placeholder it.** Anything needing a camera or a human — board photos, build shots,
   cartridge labels in hand, the DEV rig, the KIM keypad — gets a styled placeholder:
   `docs/public/images/placeholders/`, a greyscale frame with the caption and shot list
   printed on it, plus an entry in `IMAGES.md` (path, subject, framing, status). No blank
   spaces, no broken images, and a single checklist the owner can shoot against.

Existing renders in the KiCad repos' `Images/` directories (`6502-ACE.png` etc.) are
migrated first — those cover the hero shot for each system page immediately.

### Deliverables

`IMAGES.md` (the shot list and status ledger), `scripts/capture-screens.mjs`,
`docs/public/images/**`, placeholder generator.

### Exit criteria

Every chapter has at least one image or diagram; no chapter ships with an unlabelled gap;
`IMAGES.md` accounts for every placeholder with what would replace it.

---

## Phase 9 — Cross-Repo Accuracy Pass & Backlinks

**Goal:** leave every sibling repo more accurate than we found it, and pointing here.

### Tasks

1. **Fix the discrepancies logged in `ACCURACY.md`** in their home repos — the README or
   card that got it wrong, not just the docs. Each fix is a small, self-contained commit
   in the repo it belongs to, with the source-of-truth citation in the message.
   Known starting set in [Appendix C](#appendix-c--accuracy-findings-already-spotted).
2. **Re-audit each README against the fact base**, one at a time: `6502-BIOS`,
   `6502-EMULATOR`, `6502-ACE`, `6502-COB`, `6502-DEV`, `6502-KIM`, `6502-VCS`,
   `6502-PRG`, `6502-CRT`, `6502-ASM`, `6502-BAS`, `bastok`, `cffs`, `bin2woz`,
   `TMS9918-EDITOR`. Check version numbers, memory-map ranges, jump-table addresses,
   install instructions, and inter-repo links.
3. **Add a "Documentation" backlink** to every repo README, near the top:
   > 📖 **Guide:** [AC6502 Documentation](https://acwright.github.io/6502-DOCS/) — the
   > user's and programmer's guide for the whole family.
   Plus a deep link where one fits (e.g. `6502-PRG` → the cross-dev chapter; `6502-BAS` →
   the BASIC guide; each KiCad repo → its system page).
4. **Update the `Related` tables** in every repo to include `6502-DOCS` and to drop
   `6502-ASSETS` (which is going away).
5. Keep the READMEs technical. Where a README currently carries a tutorial that now lives
   in the docs, replace it with a two-line summary plus a link — don't delete detail that
   the docs don't yet cover.

### Exit criteria

- `ACCURACY.md` has no open items.
- Every sibling repo links to the docs site; no repo links to `6502-ASSETS` any more.

---

## Phase 10 — Launch & ASSETS Retirement

**Goal:** live site, retired ASSETS repo, no dead links anywhere.

### Tasks

1. Final full-site build with link checking (internal + external, including every
   `github.com/acwright/*` link and every card asset).
2. Run the full sample harness and the screenshot regeneration one more time against
   BIOS v1.5 and emulator 2.5.1; pin both versions in the site footer / `README.md`.
3. Enable GitHub Pages on `6502-DOCS`; confirm `https://acwright.github.io/6502-DOCS/`
   lands directly in the guide.
4. Verify `ASSETS-MIGRATION.md` is 100% ✅, then archive `6502-ASSETS`
   (archive first, delete later — an archived repo keeps old external links alive while
   the new ones propagate).
5. Search all repos for remaining `6502-ASSETS` references and repoint them.
6. Add a maintenance section to this repo's README: how to re-run the harness after a BIOS
   release, how to bump the documented BIOS version, how to regenerate screenshots and
   cards, and the rule that a new BIOS feature ships with a docs page and a passing sample.

### Exit criteria

Site live; zero broken links; ASSETS archived with every artefact accounted for.

---

## Appendix A — Proposed Site Map

```
/                          Introduction (the landing page IS the guide)
/getting-started/          setup, first boot, first ten minutes, troubleshooting
/systems/                  ace · cob · dev · kim · vcs · comparison
/using/                    keyboard · storage · serial · monitor · sound-and-video · emulator
/basic/                    tutorial (18 chapters) · reference · errors · samples
/crossdev/                 why · cc65 · tools · templates · makefile · linker ·
                           build-run-loop · debugging · testing · to-hardware · agents
/assembly/                 65c02 · memory-map · kernal · console · video · sound ·
                           input · storage · serial · rtc · interrupts · detection ·
                           cartridges · basic-interop · banking · idioms · projects
/reference/                cards index · memory map · kernal table · character set ·
                           connectors · keyboard matrix · keypad map · glossary
/resources/                links, community, further reading, credits
```

Cards are served from `/cards/*.html` (raw print pages, outside the VitePress chrome)
and indexed at `/reference/cards`.

---

## Appendix B — Image Inventory

Legend: **G** = generated by script · **D** = drawn SVG · **P** = placeholder pending a photo

| Image | Kind | Notes |
|---|---|---|
| Family hero shot (all five machines) | P | Existing `6502-ASSETS/Images/6502.png` may serve |
| ACE / COB / DEV / KIM / VCS board renders | — | Migrate from each KiCad repo's `Images/` |
| Boot splash on screen | G | `--console video` + `dbg screen png` |
| BASIC session (first ten minutes) | G | Scripted keystrokes |
| Monitor session (`M`, `D`, `R`) | G | |
| Wozmon screen | G | |
| Character set grid | G | Also have the 1x–16x renders from ASSETS |
| TMS Graphics I / II / Multicolor demos | G | From the `6502-ASM` demos |
| Each worked BASIC program's output | G | One per Phase 4 project |
| Memory map | D | Replaces the `.afdesign` |
| Boot / hardware-probe flow | D | |
| I/O slot map (8 × 1 KB) | D | |
| COB backplane + card layout | D | |
| Cartridge ROM overlay (`$C000–$FFFF`) | D | |
| Keyboard matrix | D | From `.numbers` + schematic |
| Keypad mapping (KIM) | D | |
| Joystick bitmask (active low) | D | |
| Connector pinouts | D | From `.afdesign` + schematic |
| XModem handshake | D | |
| CF disk-bank / directory model | D | |
| Cross-dev toolchain flow | D | |
| Zero-page ownership strip | D | |
| Assembling a machine / build steps | P | Photos needed |
| CF card insertion, serial hookup | P | Photos needed |
| Cartridge + label in hand | P | Artwork exists in `Labels/` |
| DEV rig with Teensy | P | Photo needed |
| KIM keypad + LCD close-up | P | Photo needed |
| EEPROM burning with TL866 | P | Photo needed |

---

## Appendix C — Accuracy Findings Already Spotted

Found during this survey; seeds `ACCURACY.md`. Each is stated with its source of truth.

| # | Where | Claim | Truth | Source |
|---|---|---|---|---|
| 1 | `6502-ASSETS/README.md` | "BIOS reference documentation for versions v1.0–v1.4 (**v1.4 is current**)" | BIOS is **v1.5** | `BIOS.inc:134-135`; `Kernal.asm:3059` splash `-- 6502 BIOS v1.5 --` |
| 2 | `6502-ASSETS/Documentation/ACE/ACE.html` memory map | BASIC `$C000–$E7FF`, Monitor `$E800–$FEFF` | BASIC `$C000–$EDFF`, Monitor `$EE00–$FEFF` | `6502-BIOS/README.md` ROM map, confirmed against `BIOS.cfg` |
| 3 | `ACE.html` boot description | "showing a banner and the `READY.` prompt" | The prompt is **`OK`** (banner is `6502 BASIC V2.1` / `nnnnn BYTES FREE`) | Emulator console output, `6502-EMULATOR/docs/AGENTS.md` |
| 4 | `6502-ASM/README.md` prerequisites | `brew install cc65` | Must be **newer than the 2.19 release** — the templates use `.setcpu "W65C02"`, which cc65 gained only in July 2025. `brew install --HEAD cc65` | `6502-BIOS/README.md` "Install cc65 Toolchain" |
| 5 | `6502-ASSETS/README.md` memory map summary | `$0400-$07FF User Variables`; `$A000-$BFFF LO System ROM (KERNAL, 8KB)` | `$0400–$05FF` BASIC line-input/GOSUB/FOR buffers, `$0600–$07FF` CF sector buffer; `$A000–$B7FF` Kernal, `$B800–$BFFF` character set | `6502-BIOS/README.md` memory map |
| 6 | ACE / COB / DEV / KIM / VCS cards | Sample programs printed on the sheets | Prompt reports most ACE sheet programs are **un-runnable**; every listing needs typing into the emulator and fixing | To be verified in Phase 7 (RUN) |

Findings 1–5 are confirmed. Finding 6 is the audit that Phase 7 opens with, and it is
expected to generate the bulk of the ledger.

---

## Appendix D — External Links to Include

Curated, in a `/resources/` page and inline where relevant.

**6502 / 65C02**
- [6502.org](http://6502.org/) — the reference community, tutorials, and forum
- [WDC W65C02S datasheet](https://www.westerndesigncenter.com/wdc/documentation/w65c02s.pdf)
- [masswerk 6502 instruction set](https://www.masswerk.at/6502/6502_instruction_set.html)
- [Easy 6502](https://skilldrick.github.io/easy6502/) — gentle assembly introduction
- [Codebase64](https://codebase64.org/) — C64-oriented but broadly applicable routines
- [Visual 6502](http://visual6502.org/)
- [Ben Eater's 6502 series](https://eater.net/6502) — the best "why does this wire go there" course

**Toolchain**
- [cc65](https://cc65.github.io/) and its [GitHub repo](https://github.com/cc65/cc65)
- [cc65 `ca65` assembler manual](https://cc65.github.io/doc/ca65.html) and [`ld65` linker manual](https://cc65.github.io/doc/ld65.html)
- [minipro / TL866](https://gitlab.com/DavidGriffith/minipro)

**Hardware in this family**
- [Pico9918](https://github.com/visrealm/pico9918) — the TMS9918A replacement
- [vrEmu6502](https://github.com/visrealm/vrEmu6502) — the CPU core the DEV board runs
- [TMS9918A datasheet](http://www.bitsavers.org/components/ti/TMS9900/TMS9918A_TMS9928A_TMS9929A_Video_Display_Processors_Data_Manual_Nov82.pdf)
- ARMSID / SID 6581 — [SID datasheet](http://www.waitingforfriday.com/?p=661) and register reference
- [W65C22 VIA datasheet](https://www.westerndesigncenter.com/wdc/documentation/w65c22.pdf)
- [R65C51 / W65C51 ACIA datasheet](https://www.westerndesigncenter.com/wdc/documentation/w65c51n.pdf)
- [DS1511Y RTC datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/DS1511.pdf)
- [Teensy 4.1](https://www.pjrc.com/store/teensy41.html)
- [keyboard-layout-editor.com](https://www.keyboard-layout-editor.com) — the layout JSON in `assets/keyboard/`

**This ecosystem**
- Every sibling repo, in a generated table
- [The web emulator](https://acwright.github.io/6502-EMULATOR/) — embedded/linked in the getting-started chapter

**Historical inspiration**
- C64 User's Guide & Programmer's Reference Guide, KIM-1 User Manual, Apple I / Wozmon
  (linked at archive.org) — the tone this site is aiming for

---

## Appendix E — Open Questions

Non-blocking; each has a working assumption so writing can proceed.

1. **Repo URL casing** — assumed `github.com/acwright/6502-DOCS` and Pages base
   `/6502-DOCS/`, matching the sibling repos' casing.
2. **Custom domain** — assumed none; if one is planned, only `base` and a `CNAME` change.
3. **Embedding the web emulator** — the browser build exists at
   `acwright.github.io/6502-EMULATOR`. Assumption: link to it from the getting-started
   chapter rather than iframe it, and revisit an embedded "try it" widget after launch.
4. **Search** — assumed VitePress local search (no external service, matches the
   self-hosted, offline-capable posture).
5. **Versioned docs** — assumed single-version tracking the current BIOS (v1.5), with old
   BIOS reference cards archived under `cards/archive/`. Multi-version docs only if BIOS
   versions start diverging in user-visible ways.
6. **Affinity sources** — the prompt says move them here "for now". Assumption: they live
   in `assets/affinity/` and are removed once their HTML replacements are signed off; the
   plan does not delete them.
