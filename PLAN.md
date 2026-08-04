6502-DOCS — Project Plan
========================

A multi-phase plan for building the documentation site for the **ACE** — the
flagship computer of the **AC6502** family — in the spirit of the Commodore 64
and VIC-20 manuals that came in the box: friendly, illustrated, fun to read,
and genuinely useful while you're sitting at the machine. It covers using the
computer, programming it in BASIC, setting up a cross-development environment,
programming it in assembly, and the reference cards you keep next to the
keyboard.

- **Stack:** VitePress → GitHub Pages, no landing page (land directly in the docs)
- **Theme:** black / white / grayscale, Bebas Neue display face
- **License:** MIT
- **Repo:** `acwright/6502-DOCS`, published at `https://acwright.github.io/6502-DOCS/`

---

## Table of Contents

- [Course Correction (post-Phase 3)](#course-correction-post-phase-3)
- [Who This Is For](#who-this-is-for)
- [Guiding Principles](#guiding-principles)
- [Voice & Style](#voice--style)
- [Sources of Truth](#sources-of-truth)
- [Verification Method](#verification-method)
- [Phase Overview](#phase-overview)
- [Phase 0 — Repository & Toolchain Foundation](#phase-0--repository--toolchain-foundation)
- [Phase 1 — Fact Base & Verification Harness](#phase-1--fact-base--verification-harness)
- [Phase 2 — ASSETS Migration](#phase-2--assets-migration)
- [Phase 3 — The User's Guide](#phase-3--the-users-guide) *(rewritten — see Course Correction)*
- [Phase 4 — The BASIC Guide](#phase-4--the-basic-guide)
- [Phase 5 — Cross-Development Environment](#phase-5--cross-development-environment)
- [Phase 6 — The Assembly Guide](#phase-6--the-assembly-guide)
- [Phase 7 — Quick Reference Cards](#phase-7--quick-reference-cards)
- [Phase 8 — Images & Diagrams](#phase-8--images--diagrams)
- [Phase 8.5 — F18A Mode](#phase-85--f18a-mode)
- [Phase 9 — Cross-Repo Accuracy Pass & Backlinks](#phase-9--cross-repo-accuracy-pass--backlinks)
- [Phase 10 — Launch & ASSETS Retirement](#phase-10--launch--assets-retirement)
- [Appendix A — Proposed Site Map](#appendix-a--proposed-site-map)
- [Appendix B — Image Inventory](#appendix-b--image-inventory)
- [Appendix C — Accuracy Findings Already Spotted](#appendix-c--accuracy-findings-already-spotted)
- [Appendix D — External Links to Include](#appendix-d--external-links-to-include)
- [Appendix E — Open Questions](#appendix-e--open-questions)

---

## Course Correction (post-Phase 3)

Phases 0–3 shipped on the original plan and the result went wrong in two ways that
this revision exists to fix. Recorded here so the correction doesn't quietly get
undone later.

**1. The site hedged across five machines instead of documenting one.** The AC6502
family was built in stages, each machine verifying a piece of the architecture:
COB (backplane + cards) proved the bus and the card model, DEV proved emulation
and single-stepping, VCS unified the boards, KIM reused the Main Board as a
KIM-1 homage — and then everything learned along the way was unified into the
**ACE**. The ACE is the product. It is the machine you'd hand a friend, the one
you'd ship if someone wanted to buy one, and it is fully specified: every
peripheral, fitted. The original plan treated all five as peers, so every chapter
qualified every sentence and the reader never got a straight answer about the
machine in front of them.

**2. The verification method leaked into the prose.** Accuracy is a process
requirement, not subject matter. Phase 3 shipped sentences written to convince a
reviewing agent that a claim was true — `RUN`-verified banners, `data/*.json`
citations, `Kernal.asm:793` line references, "what's GREP-only" sections, sample
programs whose payload was `PRINT "PASS"`. A user's guide has none of that. The
harness stays; its vocabulary never reaches the page.

**What changed:**

| Before | After |
|---|---|
| Five co-equal machines, every chapter hedged | The ACE is *the* machine; the guide says "your ACE" and means it |
| `/systems/{ace,cob,dev,kim,vcs}` as peers | Main guide is ACE-only; COB/DEV/VCS live in an appendix for DIY builders |
| KIM as a fifth machine | KIM as an **ACE add-on** (Keypad Card + Keypad Helper + Keypad LCD Helper), with standalone builds as a footnote |
| "Banked RAM and storage are optional" | The ACE ships with everything; those are builder's notes, not user-facing caveats |
| Verification vocabulary in the prose | Verification vocabulary confined to `samples/`, `scripts/`, `ACCURACY.md` |
| Samples that print `PASS` | Samples that do something a person would want to do |
| Written through the serial console the harness drives | Written from the seat: on-board keyboard, VGA monitor, no cable |

Phase 3's deliverables were rewritten against this revision before Phase 4 began.

---

## Who This Is For

The reader has an **ACE** on the desk, or the **emulator** on their laptop. They
did not build it. They may never have used a computer where you type a line and
press Enter and something happens. They want to make the thing do something fun,
and then they want to learn how it works.

Three audiences, in priority order:

1. **The person who was handed an ACE.** Wants to plug it in, see the prompt,
   type a program, hear a noise, save a file. Never needs to know what a Kernal is.
2. **The programmer.** Knows other languages, wants BASIC's shape, then wants the
   65C02 and the Kernal API. Arrives via the BASIC and assembly guides.
3. **The DIY builder.** Wants to build an ACE from the KiCad repo, or one of the
   earlier machines. Served by the repos themselves plus the family appendix — a
   pointer, not a parallel manual.

If a sentence doesn't serve one of those three, it doesn't ship.

---

## Guiding Principles

1. **The ACE is the machine.** The guide is written for someone sitting at an ACE
   (or the emulator, which is a complete ACE). It says "your ACE", not "your
   machine, depending on which one you have". Everything the ACE has, it has —
   video, sound, storage, serial, joysticks, RTC, banked RAM. No hedging.
2. **Friendly first.** This is the manual that came in the box. Short sentences,
   plain words, a joke where a joke fits, and a thing to type on nearly every
   page. If a paragraph reads like a datasheet, it belongs in a README.
3. **The docs teach; the READMEs specify.** Every repo README stays where it is and
   keeps its technical, build-oriented role. The docs site is the narrative,
   tutorial-first layer: what to type, why it works, what to build next. Where they
   overlap, the docs link to the README rather than forking the text.
4. **Accuracy is invisible.** Nothing is claimed that has not been checked — and
   the checking never appears on the page. See [Voice & Style](#voice--style),
   which is binding.
5. **Every code sample runs, and every code sample is worth running.** Not "looks
   right" — *runs*, headless, in CI, on the real emulator, with asserted output.
   And it does something a person would want to do: draw something, play
   something, save something. The assertion lives in the `.expect` file, never in
   the listing.
6. **The rest of the family is an appendix.** COB, DEV, and VCS are how the ACE got
   here, and they're excellent reference designs for anyone building their own
   6502. They get a short page each, aimed at builders, at the back. KIM is
   different: it's an **add-on** that turns an ACE into a KIM-1, so it gets a real
   chapter in the main guide.
7. **Print survives.** The quick reference cards remain first-class printable
   artefacts in this repo, and their content also lives in the prose docs so
   nothing is card-only.

---

## Voice & Style

Binding rules for every page under `docs/`. Violations are bugs.

### Write like this

- **Second person, present tense.** "Type `PRINT 2+2` and press Enter." Not "the
  user may enter an expression".
- **Lead with the thing to do**, then explain what happened. The C64 manual's whole
  trick: you're three keystrokes in before anyone defines a term.
- **One idea per paragraph, and keep paragraphs short.** Four lines is plenty.
- **Define a term the first time it's used, in half a sentence**, and don't use it
  before then. "The *prompt* — the `OK` and the blinking cursor — is the machine
  telling you it's your turn."
- **Every chapter has something to type**, and the reader can see the result
  without owning anything they don't already own.
- **Sidebars and callouts carry the depth.** A VitePress `::: tip` / `::: details`
  block is where "and here's what's really going on" goes, so the main line stays
  readable. Hardware trivia, other machines in the family, and "if you're curious"
  material all live in these.

### Never write this

| Banned | Why |
|---|---|
| "RUN-verified", "GREP-only", "SCHEM", "INSPECT", "verified against…" | Verification vocabulary. The reader did not ask for a chain of custody. |
| `data/systems.json`, `data/hardware.json`, "generated from the fact base" | Internal build machinery. The reader doesn't know this repo exists. |
| `Kernal.asm:793`, `BASIC.asm:8296`, `BIOS.inc:131` | Source citations belong in `ACCURACY.md` and in code comments. |
| "This chapter draws a real line, on purpose…" | Meta-commentary about the documentation. |
| `PRINT "PASS"` / `PRINT "FAIL"` in a shown listing | Test scaffolding masquerading as a program. |
| "Phase 7", "Phase 8", "once `scripts/capture-screens.mjs` exists" | Project management. Placeholders say what the picture *will show*, nothing else. |
| "on ACE and VCS's Main Board; the COB Backplane Pro adds…" | Five-machine hedging in a chapter about the ACE. |
| "What the machine is, according to the machine" | Written for a robot. |

### Write from the seat, not from the harness

A systemic failure worth naming, because it produced six separate errors in the
first pass (`ACCURACY.md` A14–A19). **The harness drives the serial console, so
the prose got written through the serial console** — and the reader is not
sitting there. A person at an ACE has the board's own 67-key keyboard and a VGA
monitor, and usually no serial cable at all.

Things that are true over serial and false at the machine:

| Over serial | At the ACE |
|---|---|
| Lower case can be typed | Upper case only; Caps Lock does nothing |
| A byte sent is a byte received | The screen drops every code above 126 and all but four control codes |
| "Attach a keyboard" | The keyboard is soldered on |
| "Attach a monitor" | Fair — but the machine is not headless by nature |

Before shipping a claim about input or output, ask which console it was checked
on, and whether that is the console the reader has. Where the two genuinely
differ, the ACE's behavior is the main line and serial goes in a
`::: details` block.

### Where the facts go instead

The fact base under `data/` stays, and stays generated — it is how a table gets to
be right without anyone retyping it. What changes is that the *page* never
mentions it. A generated table just looks like a table. A number that came out of
`BIOS.inc` just looks like a number.

If a fact genuinely cannot be verified, it does not ship as a caveat on the page;
it gets logged in `ACCURACY.md` and either resolved or cut. The reader never sees
a "not RUN-verified" warning box.

### Sample listings

Every listing under `samples/` that a chapter displays must read as a program
someone wrote on purpose:

```basic
10 CLS
20 FOR N = 1 TO 12
30 PRINT N; "X"; 7; "="; N * 7
40 NEXT N
```

not

```basic
10 A = 6 * 7
20 IF A = 42 THEN PRINT "PASS"
```

The harness asserts on the program's *real* output via `expect <regex>` in the
sibling `.expect` file. The `pass` shorthand remains available for internal
regression cases, which live under `samples/_checks/` and are never displayed.

---

## Sources of Truth

**Internal only.** Nothing in this section or the next appears on the site. This is
how the writing gets checked, not something the writing talks about.

Ranked. When two disagree, the higher one wins and the lower one gets fixed.

| Rank | Source | Location | Authoritative for |
|------|--------|----------|-------------------|
| 1 | **BIOS source** | `~/Developer/Assembly/6502-BIOS` (`BIOS.inc`, `Kernal.asm`, `BASIC.asm`, `Monitor.asm`) | Kernal jump table, memory map, BASIC dialect, Monitor commands, version number, `HW_PRESENT` bits |
| 1 | **KiCad schematics** | `~/Developer/Kicad/6502-{ACE,COB,DEV,KIM,VCS}/Schematics` | Pinouts, connectors, address decoding, part numbers, jumper/switch behavior |
| 2 | **Emulator** | `~/Developer/NodeJS/6502-EMULATOR` (v2.5.1, CLI installed at `/usr/local/bin/6502`) | Observable runtime behavior — boot text, prompts, error messages, timing, sample output |
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
- A **displayed** sample asserts on its own real output (`expect <regex>` in the
  sibling `.expect`). It never contains `PRINT "PASS"`. See
  [Voice & Style](#voice--style).
- Pure regression checks — the ones that exist only to turn CI red when the ROM
  moves — live under `samples/_checks/`, are never displayed in a chapter, and may
  use the `pass` shorthand freely.
- Runs pin the clock (`--rtc 2026-01-01T00:00:00`) and bound everything with
  `--timeout`; the harness waits on patterns, never sleeps.
- Video-dependent samples run with `--console video` and assert via `6502 dbg screen text`;
  the same call with `screen png` produces the screenshot the docs embed (Phase 8).
- **The output of this method never appears in the docs.** Which check proved a
  claim is recorded in `ACCURACY.md` and in `.expect` comments — not in a chapter.

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
| 8.5 | F18A mode | 6 | M (unplanned — see below) |
| 9 | Cross-repo accuracy pass & backlinks | 3–7 | M |
| 10 | Launch & ASSETS retirement | all | S |

Phases 3–6 are independently writable once Phase 1 lands and can be worked in any
order; 8 runs continuously beside them.

---

## Phase 0 — Repository & Toolchain Foundation

**Goal:** an empty-but-deployable site with the right shell, theme, and license.

### Tasks

1. `git init`; `.gitignore` for `node_modules/`, `.vitepress/cache/`, `.vitepress/dist/`,
   `samples/**/build/`, `*.state`.
2. `npm init` + VitePress; Node 22+ (matches BIOS test suite and emulator requirements).
3. **No landing page.** Configure so `/` lands directly on the guide's first page —
   `rewrites` mapping `guide/index.md` → `index.md`, or a root `index.md` that *is*
   the introduction (no `layout: home`). Sidebar visible from the first paint.
4. **Theme:** custom VitePress theme extension, grayscale-only palette.
   - Ink/paper inverted pair for light and dark, grays for chrome, no accent hue.
   - Self-host **Bebas Neue** (woff2 in `public/fonts/`) — no external font CDN, so
     the site works offline and on Pages without a third-party request. Bebas Neue for
     headings/nav/display; a legible body face for prose; a monospace face for code
     (Source Code Pro, to match the existing reference sheets).
   - Code blocks: grayscale syntax theme (VitePress `markdown.theme` override), plus a
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
- Pages deploy is green and the URL renders in Bebas Neue, grayscale, light and dark.

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
   - `data/systems.json` — the five machines. The ACE record describes the
     computer **as shipped** (banked RAM and storage included; build-time
     caveats in `builderNotes`); the other four carry what's onboard, optional,
     absent, and their board revisions (SCHEM + README, schematic wins).
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
   - Modeled directly on `6502-EMULATOR/examples/06-test-suite.sh` and
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

**Goal:** the manual that came in the box. Someone is handed an ACE (or opens the
emulator), plugs it in, and within ten minutes has written a program, made a
noise, and put something on the screen — without being told what a Kernal is.

### Chapters

1. **Welcome** — this is your ACE, here's what it can do, here's the first thing to
   type. One page, warm, no architecture lecture. A photograph, the `OK` prompt,
   and a two-line program that draws something. Links onward to Setting Up and to
   the emulator for anyone without hardware yet.
2. **Your ACE** — a friendly tour of the board: what each connector is, what each
   chip does in one sentence, what the reset button does, where the CPU speed
   jumper is. The spec table lives here, at the bottom, for people who want it.
   Written as "here's what you've got", not "here's what you might have".
3. **Setting up** — power (5 V barrel jack), the monitor (VGA), sound (RCA to
   powered speakers), the keyboard (PS/2 or matrix — both work, both at once),
   joysticks, the CompactFlash card, and the serial port if you want a terminal.
   Order of operations, and what to do if a step doesn't take.
4. **First power-on** — the splash, the `ENTER=BASIC  ESC=MONITOR` choice, the
   five-second countdown, the beep, and the `OK` prompt. Plain language, no boot
   sequence dump. What the machine is doing during that moment, in three
   sentences, in a `::: details` block for the curious.
5. **Your first ten minutes** — `PRINT`, arithmetic, `INPUT` and your name back at
   you, a `FOR` loop that fills the screen, `LIST`, `RUN`, `NEW`, and stopping a
   runaway program with **Esc**. Everything typed live; nothing loaded from disk.
6. **The keyboard** — the layout, the keys that do something special (Esc, Ctrl+C,
   the cursor keys, Ctrl codes), stopping a program, and the reset button.
   **Esc is taught as the way to stop a program**; Ctrl+C is mentioned as the
   equivalent that terminal users will reach for.
7. **Sound and video** — `SOUND` and `VOL` (a tune, not a beep), `CLS`,
   `LOCATE`, `COLOR`, the 40×24 screen and its 16 colors. Ends with a small
   program that does both at once. *(Was "Sound and pictures" until the voice
   audit: "pictures" reads British, and the docs are written in American
   English. The BASIC-guide chapter on the same statements was renamed with it,
   so both now carry this title — same words, different depth, different
   sections, distinct URLs.)*
8. **Storage** — the CompactFlash card, the 256 × 1 MB disk-bank model, `DIR`,
   `LOAD`, `SAVE`, `DEL`, `DISK`, `FORMAT`, `BLOAD`/`BSAVE`, and the 16-file / 8.3
   limits framed as "how much fits", not as a spec.
9. **Serial and a terminal** — 19200 8-N-1, hooking a laptop up, why you'd bother
   (a real keyboard, copy and paste, saving listings to a file), and moving files
   with `LOAD`/`SAVE` over XModem.
10. **The Monitor** — what it's for, the three ways in, the `.` prompt, `M`, `D`,
    `R`, `G`, `X` back to BASIC, and the Wozmon easter egg at `$FF00` as the fun
    payoff it is.
11. **The emulator** — the browser build, the desktop app, loading programs and CF
    images. Positioned as "an ACE you already own", so a reader with no hardware
    can do every chapter in this guide.
12. **Add-on: the KIM keypad** — the Keypad Card, Keypad Helper and Keypad LCD
    Helper turn an ACE into a KIM-1: 24 keys, a 16×2 LCD, and the KC Monitor ROM
    overlaying the top of the address space. Includes the two LED demos migrated
    from ASSETS as worked programs, and closes with a short note on building a
    KIM as a standalone machine.
13. **When something's wrong** — no picture, no sound, no beep, card not found,
    keys repeating, nothing at all. Symptom-first, one paragraph each. `MEM`'s
    `HW=$xx` is introduced here as the "what does the machine think it has"
    check, in a `::: details` block, not as the chapter's spine.

### The rest of the family (appendix, `/family/`)

Short pages, written for someone who wants to *build* one, not use one. Each is
roughly a page: what it is, why it exists in the family's history, what boards it
takes, and a prominent link to its KiCad repo and its reference card.

- **COB** — Computer On a Backplane. The modular original; the best reference
  design in the family if you're laying out your own 6502.
- **DEV** — Development Environment Vehicle. Teensy-hosted CPU emulation, single-
  stepping, clock control.
- **VCS** — Video Computer System. Main Board + Input Board + Output Board,
  cartridge-based.
- **KIM standalone** — a short section at the end of the KIM add-on chapter,
  covering the COB-based and Main-Board-based builds.

### Tasks

1. Rewrite every page shipped by the first pass of Phase 3 against
   [Voice & Style](#voice--style). Delete `docs/systems/` and rebuild as
   `docs/your-ace.md`, `docs/addons/kim.md`, and `docs/family/*`.
2. Restructure `data/systems.json` so the ACE record describes the machine as
   shipped — banked RAM and CompactFlash storage are part of the ACE, not
   "optional" — with the Rev 1.0 RAM patch and the separate CF Adapter board
   recorded as builder's notes rather than user-facing caveats.
3. Rewrite the displayed samples so each one is a program worth running, and move
   the `PASS`-style regression cases to `samples/_checks/`.
4. Rebuild the sidebar: Introduction → Getting Started → Using Your ACE →
   Add-ons → The Rest of the Family.

### Exit criteria

- A reader with no prior context can go from "here is a box" to "I wrote a program
  that made a noise" without meeting the word *Kernal*, a file path, or a source
  line number.
- Zero occurrences in `docs/` of the banned vocabulary in
  [Voice & Style](#voice--style). Enforced by a lint check in `npm run verify`.
- Every command shown still runs; every hardware claim still traces to the
  schematics or the BIOS — recorded in `ACCURACY.md`, visible nowhere on the site.

---

## Phase 4 — The BASIC Guide

**Goal:** a complete, teachable BASIC manual — tutorial front, reference back, like the
C64 *User's Guide* + *Programmer's Reference* in one.

Same voice as Phase 3: this is the part of the C64 manual people actually read for
fun. Every tutorial chapter ends with a program that does something, and the
reference half is the part you flip to at 1 a.m. with the machine still on.

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
    (`LOCATE`/`PAUSE`), a joystick sprite mover, a tune player, a CF file browser,
    an RTC clock display, and a small game that pulls several of them together.
    These are the pages people photocopy — they get titles, screenshots, and
    "now change this line and see what happens" prompts.

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

### What shipped

Eighteen tutorial chapters and three reference pages under `/basic/`, plus
seventeen new displayed samples and a worked example for each of the 85
keywords.

Two notes for later phases:

- **The keyword examples are not files.** 85 keywords would have meant 170 files
  under `samples/`, drowning the listings a reader is meant to type. They live in
  `data/basic-examples.json` — the one hand-authored file in `data/` — and the
  harness runs every one of them as `reference/<KEYWORD>`. The `example` and
  `output` arrays it asserts are the same two the reference page renders.
- **The BIOS README's BASIC tables are worse than rank 4 suggested.** Typing all
  85 keywords in turned up six confirmed errors (`ACCURACY.md` A21–A26),
  including one — `NEXT var, var` — that is documented syntax the ROM rejects at
  runtime. Corrected syntax now lives in `basic-examples.json`; the generated
  `basic-keywords.json` still carries the README's text, and the two disagreeing
  is the finding. Phase 9 fixes the README.

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
12. **Driving the emulator from an AI agent** — link and summarize
    `6502-EMULATOR/docs/AGENTS.md`; it's a genuine differentiator of this ecosystem.

### Exit criteria

A reader following the chapter from scratch on a clean machine reaches a running
program; the preflight script from Phase 1 backs every prerequisite claim.

### What shipped

Thirteen pages under `/crossdev/` — the twelve chapters above plus an index —
one new displayed sample (`samples/crossdev/countdown.asm`, the program the
build, debug and test chapters all work on), and the copyable `test.sh` those
chapters hand the reader.

Three notes for later phases:

- **The cc65 trap is smaller than this plan said.** Chapter 2 was written
  against a claim — "the ROM *and templates* use `.setcpu "W65C02"`" — that
  turned out to be wrong (`ACCURACY.md` A7). Phase 5 settled it by building the
  actual 2.19 release from source and running both toolchains over the same
  program: the output is **byte-identical** (A27). So the chapter tells readers
  to install whatever their package manager ships and only go hunting for a
  newer toolchain when they want to rebuild the ROM. Appendix C #4 overstates
  the finding and should be read alongside A7 and A27.
- **Two upstream emulator items came out of the debugging chapter.** A
  breakpoint condition naming a symbol that doesn't exist is treated as *true*
  and fires immediately (A31), and `dbg mem fill` refuses `0` and every hex
  notation (A32). Both are documented as traps on the page; both want a fix in
  `6502-EMULATOR` in Phase 9.
- **`test.sh` is the one sample the harness can't run**, being a shell script.
  It is verified by hand — both directions, including a deliberately broken
  expectation — and `samples/README.md` records how, so the check is repeatable
  rather than remembered.

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
   Front and center: *call the slot, not the implementation*.
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
19. **Optimization & idioms** — zero-page indirect, the Rockwell bit ops, `WAI` for IRQ
    sync, self-modifying code, timing with the VIA T1 via `SysDelay`.
20. **Worked projects** — port the `6502-ASM` samples (Hello World, KIM LED counter, KIM
    KITT scanner, the three TMS demos) into full annotated walk-throughs, each assembled
    and run by the harness.

### Exit criteria

Every jump-table entry documented and matching `Kernal.asm` byte for byte; every snippet
assembles with `cl65` and runs in the harness.

### What shipped

Twenty-two pages under `/assembly/` — the twenty chapters above plus an index,
with chapter 8 split into **The screen** (text mode, the character set, talking
to the card) and **The graphics modes** (the three TMS demos), because one page
carrying all four modes and three full listings was unreadable. The Kernal
chapter and the memory-map chapter are generated from the fact base, so all 53
published slots are documented with their registers and none of it was retyped.

Fourteen new samples: thirteen assembly programs, each the worked example of one
chapter, plus the BASIC program that pokes machine code into memory and `SYS`es
it. The suite is 129 cases, all green.

Four notes for later phases:

- **The three TMS demos are ported unchanged and do run in the harness, but a
  graphics screen cannot be asserted as text.** What each case checks is the
  part that can actually break: the demo runs to the end, restores text mode,
  and BASIC's prompt comes back. The pictures themselves are Phase 8's job —
  `IMAGES.md` carries a slot for Graphics I and Multicolor.
- **The two KIM LED demos are annotated inline in the projects chapter rather
  than shipped as samples.** They drive an LED latch on the keypad add-on's port
  and they never return, so there is nothing for the harness to assert and
  nothing for it to wait on. The KIM chapter's type-in cards remain their
  canonical home.
- **There is no cartridge sample.** The harness loads programs, not cartridges,
  and adding a cartridge link configuration and a `dbg load cart` path to it was
  more machinery than one chapter justified. `docs/assembly/cartridges.md` shows
  fragments from the `6502-CRT` template instead of a listing of its own. A
  cartridge case would be a genuine addition to the harness if a later phase
  wants one.
- **A35–A37 came out of writing the programs.** A35 is a stale jump-table
  address in a `6502-CRT` comment (one line, Phase 9). A36 is the real find: a
  chained interrupt handler must not push anything, because the Kernal's handler
  reads the saved status register off the stack at a fixed depth — true,
  undocumented anywhere upstream, and worth a sentence in the BIOS README. A37
  moves the "the screen drops codes above 126" rule to where it belongs, which
  is `Chrout`, not the screen.

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
| `ace.html` | **the card**, rebuilt from the existing sheet — the one that ships with the machine | GREP + SCHEM + RUN |
| `cob.html`, `dev.html`, `kim.html`, `vcs.html` | rebuilt from the existing sheets, linked from `/family/` | GREP + SCHEM + RUN |

### Tasks

1. **Audit every existing card against the fact base before rebuilding.** The system
   sheets in particular contain sample programs — the prompt flags the ACE sheet's
   programs as largely un-runnable, and the memory map on that sheet is already known
   wrong (Appendix C). Every listing on every card gets typed into the emulator and must
   produce the output the card claims, or it gets fixed or replaced.
2. Rebuild each card on the shared `cards/card.css` from Phase 2 — same visual language
   as today's sheets (black header bar, Bebas Neue, letter pages, print-exact colors),
   but grayscale-consistent with the site and with self-hosted fonts.
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

### What shipped

Ten current cards at `/cards/*.html`, indexed at `/reference/`, each linked from
the chapter it condenses and linking back. Five new pages under `/reference/` —
the card index, the character set, connectors, the keyboard matrix, the keypad
map and a glossary — because five of the cards had no chapter to condense yet
and "nothing lives only on a card" is the phase's own rule.

Four notes for later phases:

- **Six of the ten cards are generated.** `scripts/build-cards.mjs` writes the
  BASIC, Monitor, Kernal, memory-map, character-set and keyboard-layout cards
  from `data/`, and `npm run verify` fails if the checked-in copy has drifted.
  That is the structural answer to how the originals ended up documenting a
  v1.0 ROM on a v1.5 machine: for those six it can no longer happen quietly.
  The other four — the ACE, KIM, connectors and keyboard-matrix sheets — come
  from boards and firmware rather than from the ROM, so they are hand-written
  with their source cited in a comment at the top of the file.
- **The audit found twelve broken listings, not "most of them"** (`ACCURACY.md`
  O1, now resolved). Three bad programs appeared on four sheets each: `SOUND`
  with voice 0 (A38), `SYS $FF00` (A39), and a "random maze" that runs for ever
  and puts *nothing* on the screen (A40), because every character it asks for is
  above the range `Chrout` will pass. A41 is a `PRINT / ?` heading for a BASIC
  with no `?`. Everything else on those sheets ran exactly as printed.
- **`data/charset.json` is new**, extracted from `Chars.asm`: 256 glyphs, eight
  bytes each, with the name the ROM comment gives them. Both the character-set
  card and `/reference/character-set` draw every glyph as an SVG from those
  bytes, so what a reader sees is the pattern table itself rather than a font
  that resembles it. It also gives Phase 8 the character-set grid for free.
- **Two upstream items came out of the schematics.** A42 is nine shifted
  connector designators in `6502-ACE/README.md` — the same class as A20, and it
  means A11 named the wrong part for the barrel jack, which is `J17`. A43 is
  smaller but worth the note: the fact base still carried `G FF00` for Wozmon,
  which A18 had disproved three phases earlier, and nothing noticed until a card
  started generating itself from that field.

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
2. **Draw it.** Diagrams authored as hand-written **SVG** (grayscale, Bebas Neue labels,
   theme-aware): memory map, boot flow, I/O slot map, backplane/card layout, keyboard
   matrix, joystick bitmask, cartridge overlay, XModem handshake, CF disk-bank model,
   cross-dev toolchain flow. SVG so they stay crisp, diffable, and restyleable.
3. **Placeholder it.** Anything needing a camera or a human — board photos, build shots,
   cartridge labels in hand, the KIM keypad — gets a styled placeholder:
   `docs/public/images/placeholders/`, a grayscale frame with the caption and shot list
   printed on it, plus an entry in `IMAGES.md` (path, subject, framing, status). No blank
   spaces, no broken images, and a single checklist the owner can shoot against.
   **A placeholder's on-page caption describes the picture, and nothing else** — no
   phase numbers, no script names, no accuracy notes. The shot list, the tooling
   and the status live in `IMAGES.md`, which the reader never sees.

Existing renders in the KiCad repos' `Images/` directories (`6502-ACE.png` etc.) are
migrated first — those cover the hero shot for each system page immediately.

### Deliverables

`IMAGES.md` (the shot list and status ledger), `scripts/capture-screens.mjs`,
`docs/public/images/**`, placeholder generator.

### Exit criteria

Every chapter has at least one image or diagram; no chapter ships with an unlabeled gap;
`IMAGES.md` accounts for every placeholder with what would replace it.

### What shipped

Eleven screenshots, fifteen diagrams and nine photographs, across thirty pages,
plus the three scripts that make them and the `<Figure>` and `<Diagram>`
components that put them on a page. `IMAGES.md` is rewritten as the ledger of
all of it.

Five notes for later phases:

- **The KiCad repos' `Images/` are photographs, not renders.** The plan assumed
  board renders and treated a photograph of each machine as a shoot waiting to
  happen. In fact `6502-{ACE,COB,DEV,KIM,VCS}/Images/*.png` are exactly the
  photographs six of the placeholders were asking for — the COB one is even the
  side-on shot with every card visible that `IMAGES.md` had written a wish for.
  Six placeholders became real pictures by importing what already existed, and
  three of the ACE's became three by cropping: whole machine, board, keys.
- **Diagrams are generated, and drift-checked.** Nine of the fifteen come out of
  `data/` — the memory map, zero page, the I/O slots, the joystick byte, the
  jump table, the interrupt vectors, the keyboard, the BASIC memory strip — and
  `npm run verify` fails if a checked-in drawing no longer matches what the data
  draws, exactly as it does for the six generated cards. Hand-drawing the memory
  map would have been faster once and wrong from the next ROM release onwards.
  They carry no color at all: every shape is `currentColor` at a fixed opacity,
  which is what lets one file serve both themes, and is why `<Diagram>` inlines
  the SVG instead of linking it.
- **Screenshots are deliberately not drift-checked.** They are reproducible —
  pinned clock, cycle-counted waits, programs typed in from the same files under
  `samples/` the chapters display — but asserting a committed PNG in CI means
  asserting on an encoder. `npm run screens` after a ROM change is a step in the
  Phase 10 maintenance list rather than a gate.
- **One shot the plan wanted does not exist.** Appendix B asks for a picture of
  the palette from the BASIC color loop. That program paints one color at a
  time over the same two words, so no frame of it holds more than one, and the
  loop finishes between two debug commands, so a mid-run frame is not reliably
  reachable either. The chapter ships the frame it ends on, captioned for what
  it is; the site's picture of the palette is the Graphics I demo. A palette
  shot would need a different program, which is a Phase 4 decision, not a
  Phase 8 one.
- **"Every chapter has at least one image" is not met, on purpose.** Fifty-odd
  pages ship without one, and `IMAGES.md` groups them and says why: reference
  pages that are tables end to end, chapters whose subject is the listing they
  already show, and chapters where a diagram would restate the sentence above
  it. The criterion was written before the reference half of the site existed.
  What replaced it is a rule that can be applied to the next page as well as
  audited on this one — *a picture ships when it shows something the prose
  cannot say as quickly* — and four diagrams were added under it that no
  placeholder had asked for: `PRINT`'s zones, the status register, the Kernal
  jump table's indirection, and interrupt chaining.

Two accuracy items came out of it. **A9 is resolved** — the family photograph
with the two-major-versions-stale banner runs as a captioned historical shot on
the family index, the third of the three routes that entry offered. **A44 is
new**: the ACE photograph, now the first image on the site, has a hand-written
`BIOS V1.0` label on its EPROM. No caption reads a version off it, and the real
fix is a re-shoot in `6502-ACE`, which makes it a Phase 9 item.

---

## Phase 8.5 — F18A Mode

**Goal:** document the video card's hidden enhanced mode properly — because
almost nobody else has, and because a game written for an ACE will want it.

Unplanned. It exists because the Pico9918 carries a second personality that
appears in no README and no source in this ecosystem, so nothing in Phases 0–8
could have found it. Numbered 8.5 rather than 11 because it belongs with the
video chapters and has to land before Phase 9 goes and edits the sibling repos.

### Why it needed a section rather than a paragraph

Three of this plan's standing assumptions do not hold for this subject, and each
one had to be handled rather than waved at.

1. **There is no local source of truth.** Every other fact on this site traces
   to `BIOS.inc`, a schematic, or the emulator. F18A mode is defined by Matthew
   Hagerty's F18A and by the Pico9918 firmware, neither of which lives here.
2. **It cannot be run.** The emulator is a faithful TMS9918A and masks register
   writes to 0–7 (`6502-EMULATOR/src/core/IO/Video.ts:279`), which is correct
   behavior and makes almost every claim in the section unverifiable by the
   method the rest of the site is built on.
3. **The upstream documentation is thin and partly wrong.** Three documents
   exist, they disagree, and the most discoverable of the three is the least
   accurate.

### What shipped

Eight pages under `/f18a/` as their own sidebar section, `data/f18a.json`, a
generated register card, and two samples.

- **`data/f18a.json`** — every enhanced register with its bit fields, all
  sixteen status registers, the attribute bytes, the palette defaults, the
  color-mode and paging tables, the GPU's memory map and instruction set. The
  second hand-authored file in `data/` after `basic-examples.json`, and the
  first that cannot be regenerated from anything. Bit order is normalized to
  D7-first on the way in — Hagerty numbers the most significant bit as 0 — and
  that conversion lives in the JSON so the card and the chapter cannot disagree
  about which end a bit is.
- **`/f18a/registers` and `cards/f18a-registers.html`** both generate from it,
  drift-checked by `npm run verify` exactly like the other six generated cards.
- **`samples/assembly/f18a-detect.asm`** and **`samples/basic/f18a-detect.bas`**
  are the only two runnable cases the subject admits, and they are worth
  running: each asserts the *stock* branch, which is the branch that executes on
  every machine that is not an ACE with the enhanced firmware. Both restore the
  three registers the attempt clobbers, and both `.expect` files assert the
  prompt is still readable afterwards — which is the actual bug a careless
  detection routine ships.

### The four notes worth carrying forward

- **The three source documents disagree, and A46–A49 record how.** The forum
  documentation describes scroll-limit registers at VR50–53 and a fixed map at
  VR10; neither shipped, and both addresses have entirely different meanings in
  the register sheets (A46). The Pico9918 reference tabulates the enhanced color
  modes one step too high — 16 colors from 4 bitplanes where the hardware gives
  8 from 3 (A47). VR31's priority bit is described two ways by its own author in
  two consecutive firmware revisions (A49). A46, A47 and A49 are resolved on the
  evidence; **A48 is two claims that cannot be settled without hardware** and
  ships on the page as open questions rather than as facts.
- **"Accuracy is invisible" needed one exception, and it is a small one.** The
  reader is told, once, on the section index, that F18A mode runs on hardware
  only and the emulator does not have it. That is a fact about the machine, not
  about this repo's method — a reader who types the detector into the emulator
  and gets the plain answer needs to know why. Which document a claim came from
  stays where it belongs, in `ACCURACY.md`. Where two sources genuinely conflict
  the page says so, because the alternative is printing a coin flip as a fact.
- **The three upstream files are gone from the repo.** The register spreadsheet,
  the forum PDF and an agent-written summary of them sat in the root while this
  was written and were deleted once `data/f18a.json` and the chapters carried
  everything. The summary was the most dangerous of the three — it swapped the
  two tile layers' scroll registers and read VR29's pattern-plane spacing as
  page selects — which is the argument for not keeping derived documents around
  next to the thing derived from them.
- **No screenshots, and none possible.** Every other chapter's pictures come out
  of the emulator. This section ships with none, and `IMAGES.md` records that as
  deliberate rather than pending. A photograph of a real ACE running a
  two-layer scroll would be the single most valuable image on the site, and it
  needs hardware and a camera.

### Left undone

- **No worked graphics program.** The section teaches the registers and shows
  fragments; it does not ship an assembled two-layer scrolling demo, because
  nothing here could run it and an unrunnable listing is exactly what
  [Voice & Style](#voice--style) exists to keep out. The first one written on
  real hardware should become a sample with a hand-verified note, the way
  `test.sh` is.
- **A48 stays open** until somebody writes four palette entries on an ACE and
  looks at the screen.

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
/                          Welcome (the landing page IS the guide)
/your-ace                  a tour of the machine, and the spec table
/getting-started/          setup · first-boot · first-ten-minutes · troubleshooting
/using/                    keyboard · sound-and-video · storage · serial ·
                           monitor · emulator
/addons/                   kim (the keypad + LCD add-on, and standalone KIM builds)
/basic/                    tutorial (18 chapters) · reference · errors · samples
/crossdev/                 why · cc65 · tools · templates · makefile · linker ·
                           build-run-loop · debugging · testing · to-hardware · agents
/assembly/                 65c02 · memory-map · kernal · console · video · sound ·
                           input · storage · serial · rtc · interrupts · detection ·
                           cartridges · basic-interop · banking · idioms · projects
/f18a/                     the video card's hidden mode:
                           index · unlocking · color · sprites · scrolling ·
                           bitmap · gpu · registers
/reference/                cards index · memory map · kernal table · character set ·
                           connectors · keyboard matrix · keypad map · glossary
/family/                   the rest of the AC6502 family, for builders:
                           index · cob · dev · vcs
/resources/                links, community, further reading, credits
```

Sidebar order, which is the order a reader meets the site:

```
Introduction          Welcome · Your ACE
Getting Started       Setting up · First power-on · Your first ten minutes ·
                      When something's wrong
Using Your ACE        The keyboard · Sound and video · Storage ·
                      Serial and a terminal · The Monitor · The emulator
F18A Mode             What F18A mode is · Turning it on · Colors · Sprites ·
                      Scrolling and layers · The bitmap layer · The GPU ·
                      Every register
Add-ons               The KIM keypad
The Rest of the Family  Overview · COB · DEV · VCS
```

Cards are served from `/cards/*.html` (raw print pages, outside the VitePress chrome)
and indexed at `/reference/cards`.

---

## Appendix B — Image Inventory

Legend: **G** = generated by script · **D** = drawn SVG · **P** = placeholder pending a photo

| Image | Kind | Notes |
|---|---|---|
| **The ACE on a desk, powered on** | P | The site's single most important image — Welcome page |
| ACE board, populated, from above | P | KiCad render available as an interim; a photograph is better |
| Family line-up (all five machines) | P | Family appendix only. Existing `6502-ASSETS/Images/6502.png` may serve — see ACCURACY.md A9 |
| COB / DEV / VCS board renders | — | Migrate from each KiCad repo's `Images/` |
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

`ACCURACY.md` also carries **A10–A13**, which are errors the first pass of Phase 3
shipped in *this* repo — a sound-card claim contradicted by the machine, wrong
power inputs, three controller firmwares conflated into one, and the ACE's banked
RAM and storage marked optional. They are logged for the same reason as everything
above: a ledger that only records other people's mistakes is not a ledger.

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
- [Pico9918](https://github.com/visrealm/pico9918) — the TMS9918A replacement, and
  its [F18A Programmer's Reference](https://github.com/visrealm/pico9918/wiki/F18A-Programmers-Reference),
  which is the authority for F18A mode on an ACE
- [F18A](https://github.com/dnotq/f18a) — Matthew Hagerty's FPGA 9918A, whose
  enhanced feature set the Pico9918 implements
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
