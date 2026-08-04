# ACCURACY.md — the discrepancy ledger

Every place where a document in this ecosystem disagrees with the machine, what
the machine actually does, how that was established, and whether it has been
fixed.

This file is the working record for [Phase 9](PLAN.md#phase-9--cross-repo-accuracy-pass--backlinks),
where each open item is fixed **in the repo that got it wrong**, not just worked
around in the docs. It opens seeded with
[PLAN.md Appendix C](PLAN.md#appendix-c--accuracy-findings-already-spotted) and
grows as later phases audit more material.

## How to read an entry

**Check** is the verification method from
[PLAN.md](PLAN.md#verification-method): `GREP` (read the source), `RUN` (execute
it on the emulator), `INSPECT` (`6502 dbg mem` / `disasm` / `screen`), `SCHEM`
(read the KiCad schematic).

**Status** is one of:

| Status | Meaning |
|---|---|
| `confirmed` | The discrepancy is real and verified. Awaiting a fix in its home repo. |
| `fixed` | Corrected upstream. Records the commit. |
| `open` | Suspected, not yet verified. |
| `wontfix` | Deliberate; the reason is recorded. |

**Baseline for every entry below:** BIOS v1.5, emulator 2.5.1, cc65 built from
HEAD (`cl65 V2.19 - Git 547d92358`).

---

## Summary

| Status | Count |
|---|---|
| confirmed | 40 |
| open | 3 |
| fixed | 2 |
| wontfix | 3 |

Entries **A10–A13** were found while rewriting Phase 3 against PLAN.md's
[Course Correction](PLAN.md#course-correction-post-phase-3), and **A14–A19** in
the review pass that followed. Most are errors this project's **own first pass**
shipped, not inherited ones; A20 is an upstream README bug the review turned up.
All are corrected in the current pages. They are recorded here because a ledger
that only tracks other people's mistakes is not a ledger.

**A21–A26** come from Phase 4, which typed all 85 BASIC keywords into the
machine. Five are errors in the BIOS README's BASIC tables — the rank-4 source
`data/basic-keywords.json` is generated from — and A24 is documented syntax the
ROM rejects at runtime.

**A27–A34** come from Phase 5, which built the templates with two different
cc65 toolchains and drove the debugger through a real program. A27 finally
settles A7 with a measurement — a 2.19 build and a current build of the same
program are byte-identical — and A31 and A32 are upstream emulator items rather
than documentation errors.

**A35–A37** come from Phase 6, which wrote fourteen assembly programs against
the jump table. A35 is a stale address in a template comment; A36 is a real
constraint on interrupt chaining that no README states; A37 corrects where the
screen's character filtering actually happens.

**A38–A43** come from Phase 7, which opened by typing every listing on every
migrated card into the emulator — the audit O1 was raised for. Four of the five
system sheets carried the same four broken listings; one of them, the "random
maze", runs for ever and puts *nothing at all* on the screen. A42 is the
schematic disagreeing with the ACE README about nine connector designators, and
A43 is this repo's own fact base contradicting A18.

A common root cause runs through A14–A18, worth naming: **the guide was written
through the serial console, because that is the interface the harness drives.**
A person sitting at an ACE has the on-board keyboard and a VGA monitor, usually
with no serial cable attached at all — and several claims that are true over
serial are false at the machine itself.

---

## Confirmed

### A1 — `6502-ASSETS/README.md`: BIOS v1.4 described as current

| | |
|---|---|
| **Claim** | "BIOS reference documentation for versions v1.0–v1.4 (**v1.4 is current**)" — `README.md:55` |
| **Truth** | The BIOS is **v1.5**. |
| **Source** | `BIOS.inc:134-135` (`BIOS_VERSION_MAJOR = 1`, `BIOS_VERSION_MINOR = 5`); splash literal `-- 6502 BIOS v1.5 --` at `Kernal.asm:3059` |
| **Check** | GREP + RUN (the emulator prints the splash on boot) |
| **Fix** | Moot once ASSETS is retired (Phase 10), but the v1.5 cards have to exist first (Phase 7). |

### A2 — `6502-ASSETS/Documentation/ACE/ACE.html`: ROM boundary wrong

| | |
|---|---|
| **Claim** | BASIC `$C000–$E7FF`, Monitor `$E800–$FEFF` |
| **Truth** | BASIC `$C000–$EDFF` (11,776 bytes), Monitor `$EE00–$FEFF` (4,352 bytes) |
| **Source** | `BIOS.cfg` `MEMORY` block. Confirmed by INSPECT: `$EDFC–$EDFF` is `00 00 00 00` fill and `$EE00` disassembles as `JMP $EE06`, the Monitor's cold entry. |
| **Check** | GREP + INSPECT |
| **Fix** | The card is rebuilt from `data/memory-map.json` in Phase 7. |

### A3 — `ACE.html`: wrong BASIC prompt

| | |
|---|---|
| **Claim** | "showing a banner and the `READY.` prompt" |
| **Truth** | The prompt is **`OK`**. |
| **Source** | `MsgOK` at `BASIC.asm:8832` is `"OK",$0D,$0A,0`. RUN-confirmed on every boot. |
| **Check** | GREP + RUN |
| **Fix** | Phase 7. |

### A4 — `6502-ASSETS/README.md`: `$A000–$BFFF` called "KERNAL, 8KB"

| | |
|---|---|
| **Claim** | `$A000-$BFFF: LO System ROM (KERNAL, 8KB)` — `README.md:142` |
| **Truth** | `$A000–$B7FF` is the Kernal (6,144 bytes); `$B800–$BFFF` is the **CP437 character set** (2,048 bytes), which is a separate segment and separate content. |
| **Source** | `BIOS.cfg`: `KERNAL: start=$A000, size=$1800`, `CHARS: start=$B800, size=$0800`. INSPECT: `$B800` reads as character-pattern data, not code. |
| **Check** | GREP + INSPECT |
| **Also affects** | `6502-KIM/README.md#keypad-card` repeats the conflation in its overlay table: "`$A000–$BFFF` BIOS Kernal (unchanged, still callable)". Both halves *are* still readable under the overlay, so the row is not wrong about reachability — only about the name. Worth a wording fix in Phase 9. |

### A5 — PLAN.md: "51 published jump-table slots"

| | |
|---|---|
| **Claim** | PLAN.md Phase 1 task 1 and Phase 6 chapter 5 both say the Kernal publishes **51** slots. |
| **Truth** | **53** published slots (`$A000`–`$A09C`), plus **32** reserved (`$A09F`–`$A0FE`) and one pad byte at `$A0FF` — **85** in all. |
| **Source** | `Kernal.asm:30-94` (the table), `Kernal.asm:11` (the file header already says "85-slot JMP table"), `Kernal.asm:97` (`.repeat 32`). `scripts/extract-facts.mjs` asserts every slot's commented address against its position, so this cannot drift again. INSPECT: `$A09F` disassembles as `JMP $A100`, the `UnimplementedStub` RTS. |
| **Check** | GREP + INSPECT |
| **Fix** | This repo's own plan. Phases 6 and 7 must be written against `data/kernal.json`, not against the number in the plan. |

### A6 — PLAN.md and `6502-EMULATOR/docs/AGENTS.md`: BASIC banner version

| | |
|---|---|
| **Claim** | PLAN.md Appendix C #3 and `AGENTS.md`'s worked examples both show the banner as `6502 BASIC V2.1`. |
| **Truth** | The banner is **`6502 BASIC V2.0`**. |
| **Source** | `MsgBanner` at `BASIC.asm:8827`: `.byte $0D,$0A,"6502 BASIC V2.0",$0D,$0A,0`. RUN-confirmed. |
| **Check** | GREP + RUN |
| **Note** | The *substance* of Appendix C #3 — that the prompt is `OK` and not `READY.` — is correct; only the version number in the quoted banner is wrong. `AGENTS.md` shows it in illustrative output rather than as a claim, so the fix there is cosmetic. |

### A7 — PLAN.md and `6502-ASM/README.md`: which things need a post-2.19 cc65

| | |
|---|---|
| **Claim** | PLAN.md Appendix C #4 and Phase 5 chapter 2: "The ROM **and templates** use `.setcpu "W65C02"`, which cc65 only gained in July 2025." |
| **Truth** | Only the **BIOS** does. `BIOS.asm:22` sets `.setcpu "W65C02"` and `BIOS.asm:28` raises an explicit `.error` if it is not in force. Every reader-facing source uses plain `.setcpu "65C02"`, which cc65 2.19 supports: `6502-PRG/Program.asm:1`, `6502-CRT/Cart.asm:1`, and all six `6502-ASM` samples. |
| **Source** | GREP across `6502-BIOS`, `6502-PRG`, `6502-CRT`, `6502-ASM` |
| **Check** | GREP |
| **Consequence** | The 2.19 trap blocks **building the BIOS**, not **building a program from a template**. Phase 5 chapter 2 has to say which is which, or it will send every reader off to build cc65 from source for no reason. `6502-BIOS/README.md#install-cc65-toolchain` already states it correctly and is the text to follow. |
| **Aside** | A HEAD build still reports `cl65 V2.19 - Git <sha>`, so the version string cannot answer the question. `scripts/preflight.mjs` assembles a probe using `.setcpu "W65C02"`, `wai`, `stp` and `rmb0` instead. |

### A8 — `BIOS.inc`: `USER_VARS` names a range that is not user memory

| | |
|---|---|
| **Claim** | `BIOS.inc:138`: `USER_VARS := $0400 ; $0400-$07FF`. Repeated as "User Variables" in `6502-ASSETS/README.md:132` and as "User Variables / BASIC workspace" in `6502-PRG/6502.inc`. |
| **Truth** | None of `$0400–$07FF` is free for a user program. `$0400` is `BAS_LINBUF` (raw input line), `$0500` is `BAS_TOKBUF` (tokenized scratch), and `$0600–$07FF` is `FS_SECTOR_BUF`, which **any** filesystem call clobbers. |
| **Source** | `BASIC.asm:209-210`, `BIOS.inc:120` |
| **Check** | GREP |
| **Consequence** | A reader who trusts the name will POKE into BASIC's line buffer. `data/memory-map.json` names these regions for what they are; the docs must too, and the `6502-PRG` include's comment should be reworded in Phase 9. The genuinely free RAM is `$003A–$00FF` in zero page and everything above the program in `$0800–$7FFF`. |

### A9 — The family hero photo shows a two-major-versions-stale banner

| | |
|---|---|
| **Claim** | `6502-ASSETS/Images/6502.png` — now `docs/public/images/6502.png` — is the one photograph of a real machine in the whole asset set, and PLAN.md Phase 3 chapter 1 and Appendix B both earmark it for the introduction. Its monitor reads `6502 BASIC v1.0` / `30719 BYTES FREE` / `OK`. |
| **Truth** | The banner is **`6502 BASIC V2.0`** (uppercase `V`, major version 2) and the machine reports **`30718 BYTES FREE`**. |
| **Source** | RUN: `6502 run --headless --exit-on 'OK'` prints `-- 6502 BIOS v1.5 --` / `6502 BASIC V2.0` / `30718 BYTES FREE` / `OK`. |
| **Check** | RUN |
| **Consequence** | Putting it on the intro page unedited teaches the wrong banner on the first screen a reader sees, and it is the kind of error a reader would reasonably take as authoritative — it is a photograph. |
| **Fix** | Phase 8, one of three ways: reshoot against v1.5, crop below the text, or run it as a captioned historical shot. `IMAGES.md` carries the decision. Until then the file is migrated but **not referenced by any page**. |
| **Aside** | The photo independently corroborates A3: even on that firmware the prompt was `OK`, never `READY.`. |

---

## Open

### O1 — Sample programs on the ASSETS system cards — **resolved**

| | |
|---|---|
| **Claim** | The ACE / COB / DEV / KIM / VCS reference sheets each print sample programs. |
| **Suspected** | Most of the ACE sheet's programs do not run as printed. |
| **Found** | Overstated in one direction and understated in the other. Three of the ACE sheet's five "fun to try" listings were broken, not most — but the same three appear on the COB, DEV and VCS sheets too, so the count across the set was twelve. They are **A38** (`SOUND` voice 0), **A39** (`SYS $FF00`) and **A40** (the maze that draws nothing), plus **A41** on the reference tables. The rest — the scroll loop, `PRINT JOY(1)`, `COLOR 1,6`, `PRINT 2^16`, `TIME`, `LIST`/`RUN`/`NEW`/`MEM`, and every Monitor command printed — all run exactly as the sheets claim. |
| **Status** | `fixed` — every listing on every card was typed in, and the corrected forms were typed in again. |
| **Check** | RUN |
| **Note** | None of them became a `samples/` case. A card listing is two or three lines meant to be typed at a display table, not a program a chapter walks through, and the chapters they condense already carry verified samples that do the same job properly. What the harness would have gained is a regression test on `SOUND`, `RND` and `CHR$` — and `data/basic-examples.json` already runs one for each of those. |

### O2 — The splash string is a literal, not derived from the version equates

| | |
|---|---|
| **Observation** | `Kernal.asm:3059` hard-codes `-- 6502 BIOS v1.5 --`. `BIOS.inc:134-135` separately defines `BIOS_VERSION_MAJOR`/`MINOR`, which `KernalVersion` (`$A07B`) returns. Nothing ties the two together. |
| **Status** | They agree at v1.5. This is a maintenance hazard rather than a current error: a version bump that misses `Kernal.asm` would ship a machine whose splash and whose API disagree. |
| **Mitigation here** | `data/boot.json` carries `splashMatchesVersion`, computed by the extractor, so the docs cannot quote a stale splash without the fact base saying so. |
| **Suggested upstream fix** | Build the splash from the equates, or add a `.assert` in `Kernal.asm`. Phase 9. |
| **Check** | GREP |

### O3 — `samples/lib/6502.inc` has not been diffed against the templates'

| | |
|---|---|
| **Observation** | This repo generates its own `samples/lib/6502.inc` from the BIOS source (rank 1). The `6502-PRG` and `6502-CRT` templates ship a hand-maintained `6502.inc` (rank 3) that readers actually use. Both describe the same machine and should agree. |
| **Status** | Not yet compared. Any disagreement is by definition a template bug, since the generated file is derived from the ROM. |
| **Plan** | Diff them in Phase 9 and fix the template. |
| **Check** | pending GREP |

### O4 — The migrated cards still carry their original v1.0-era content — **resolved**

| | |
|---|---|
| **Observation** | Phase 2 moved seventeen sheets onto the shared `cards/card.css` without touching a word of their content, so A2 (BASIC/Monitor ROM boundary) and A3 (`READY.`) were still printed on `docs/public/cards/ace.html`, and the other four system cards had never been read against the fact base. |
| **Status** | `fixed`. Phase 7 rebuilt the ACE and KIM sheets from scratch and corrected the COB, DEV and VCS sheets in place. A2, A3, A38, A39, A40, A41 and A4's `$A000–$BFFF` conflation are all gone from every current card. |
| **Note** | Six of the ten current cards are now **generated** from `data/` by `scripts/build-cards.mjs`, and `npm run verify` fails if the checked-in copy has drifted from the fact base. The class of problem O4 describes — a card quietly documenting a ROM two versions old — cannot recur for those six without CI going red. |
| **Not covered** | The archived v1.0–v1.4 cards under `cards/archive/` are untouched by design. They describe the ROMs they were written for, which is the only thing they are for. |
| **Check** | GREP + RUN |

### O5 — `?NO DEVICE` cannot currently be produced with the emulator CLI

| | |
|---|---|
| **Observation** | The BASIC error `?NO DEVICE ERROR` (`BASIC.asm:7976-7981`, `ReqHw`) fires when a statement needs a card whose `HW_PRESENT` bit is clear. Storage statements (`DIR`, `LOAD "name"`, `SAVE "name"`, `DEL`, `BLOAD`, `BSAVE`, `FORMAT`) all guard on `HW_CF`. Confirmed empirically: `6502 run --headless` with **no** `--cf` flag still reports `HW=$7F` (every bit set except video) and `DIR` prints an empty `DISK 0` rather than erroring — the emulator's default headless machine profile always includes a Storage card object (`src/tests/IO/Storage.test.ts` instantiates one unconditionally), and `--cf` only attaches a backing image to it; there is no CLI flag to remove the card itself. |
| **Consequence for these docs** | [Storage](https://github.com/acwright/6502-DOCS/blob/main/docs/using/storage.md)'s `NO DEVICE` claim is GREP-sourced (the error text and the `ReqHw` guard are real and read directly from the ROM) but is **not** RUN-verified, unlike every other command in that chapter — the current tooling cannot reach the condition that would trigger it. |
| **Status** | Open. Not a documentation error — a gap in what the emulator CLI can currently simulate. |
| **Suggested upstream fix** | A `6502-EMULATOR` flag to omit the Storage card entirely (mirroring how `--console video` is the only currently-togglable card) would close this. Tracked here rather than filed upstream directly, since this repo doesn't own that one. |
| **Check** | GREP (the error path); RUN attempted and found not reproducible |

### A10 — This repo's own `docs/using/sound-and-video.md`: "no SID fitted"

| | |
|---|---|
| **Claim** | The first pass of the sound chapter said `SOUND`/`VOL` "runs on the default headless machine, which has no SID". |
| **Truth** | The default headless machine **does** have a SID. `MEM` reports `HW=$7F`: every bit set except video (bit 7, `$40` is `HW_SID` and it is set). With `--console video` it reports `HW=$FF`. |
| **Source** | RUN: `MEM` on a default headless boot prints ` 30718 BYTES FREE  HW=$7F`; the same on `--console video` prints `HW=$FF`. |
| **Check** | RUN |
| **Consequence** | The paragraph drew a graceful-degradation lesson from a condition that was not occurring. The underlying ROM behaviour — `BasCmdSound`/`BasCmdVol` do not guard on `HW_SID` — is real, but it was not what the sample demonstrated. |
| **Fix** | Removed. The rewritten chapter teaches `SOUND` and `VOL` by playing a scale on a machine that has a sound chip, which is the machine the guide is about. |

### A11 — This repo's own `docs/getting-started/setup.md`: power inputs

| | |
|---|---|
| **Claim** | "A 5 V DC supply, barrel jack on ACE and VCS's Main Board; the COB Backplane Pro adds an onboard power switch (Rev 1.1) and its own barrel jack." |
| **Truth** | The VCS Main Board is powered over **USB-C** (`J3`, USB 2.0 Type-C receptacle), not a barrel jack — and the KIM inherits that when it is built on a Main Board. The DEV board is powered through the **Teensy's USB connector**. Only the ACE (`J16`) and the COB Backplane Pro Rev 1.1 (`J1`) take a 5 V barrel jack. |
| **Source** | SCHEM/BOM: `6502-VCS/README.md` connector table `J3 | USB-C`; `6502-ACE/README.md` `J16 | 5V DC | DC Barrel Jack`; `6502-COB/README.md` Backplane Pro `J1 | 5V DC | DC Barrel Jack` and `SW1 | POWER`. |
| **Check** | SCHEM |
| **Fix** | Corrected. The rewritten Setting Up chapter documents the ACE's barrel jack only; the family pages carry each machine's own arrangement. |

### A12 — This repo's own `docs/getting-started/setup.md`: controller firmware

| | |
|---|---|
| **Claim** | "ACE and VCS use an ATmega1284P running the AB Controller firmware". |
| **Truth** | Three different firmwares, one per machine. The **ACE** runs **AB Controller**; the **VCS** Input Board runs **IB Controller**; the **COB** keyboard/encoder card runs **KEH Controller**. They do similar jobs and are not the same code. |
| **Source** | `6502-ACE/README.md#ab-controller`, `6502-VCS/README.md#ib-controller`, `6502-COB/README.md#keh-controller`. |
| **Check** | GREP |
| **Fix** | Corrected. The ACE chapters name AB Controller only, and no page now claims a shared firmware across machines. |

### A13 — `data/systems.json`: the ACE's banked RAM and storage marked optional

| | |
|---|---|
| **Claim** | The ACE record listed **Banked RAM (AS6C4008)** and **Storage (ACE CF Adapter)** under `optional`, so the generated comparison table told a reader their ACE might not have either. |
| **Truth** | The ACE is the family's finished, fully-specified machine and ships with both. The CF Adapter being a separate small PCB, and Rev 1.0 needing the RAM Patch to latch banked SRAM reliably, are facts about *building* one — not about what a reader's machine can do. |
| **Source** | `6502-ACE/README.md` (ACE Board: "32KB SRAM (62256) + Optional 512K banked SRAM (AS6C4008)"; ACE CF Adapter; ACE RAM Patch) read against the intended product definition. |
| **Check** | SCHEM + editorial |
| **Fix** | Both moved into `onboard`; the two build-time caveats moved to a new `builderNotes` array, which `docs/your-ace.md` renders inside a collapsed "Building one yourself" block. |

### A14 — This repo's own docs: reset described as a cold start

| | |
|---|---|
| **Claim** | "The button is reset. It's a cold start — same as switching the machine off and on. Anything you haven't saved is gone." (`your-ace.md`, echoed in `using/keyboard.md`) |
| **Truth** | Reset is a **warm** start. It pulses the CPU's RESET line; RAM is untouched, so BASIC's warm-start magic (`BAS_WARM`, `$036F` = `$A5`) still stands and `BasEntry` takes the `@Warm` path — banner skipped, program and variables intact. A cold start needs the power switch. |
| **Source** | `BASIC.asm:374-383` (`BAS_WARM` compare, `@Warm` branch); `KernalInitImpl` does not clear `$036F`. RUN: type a program, `6502 dbg reset --warm`, then `LIST` — the program is still there and `PRINT A` returns the pre-reset value. A cold reset clears it. Corroborated by `6502-EMULATOR/README.md`, which documents its **↺** button as "pulses the CPU RESET line only; RAM is preserved, mirroring the hardware reset button (a BASIC session survives)" against **⏻** "Power Cycle — cold boot that zeroes RAM". |
| **Check** | GREP + RUN |
| **Consequence** | Backwards advice: readers were told to expect to lose work on reset, when reset is in fact the safe way out of a wedged program. |
| **Fix** | Both chapters now teach reset as memory-preserving and name the power switch as the cold start. |

### A15 — This repo's own docs: the ACE's keyboard treated as an accessory

| | |
|---|---|
| **Claim** | Setting Up offered "two sockets" — PS/2 or an 8×8 matrix header — as the way to get a keyboard, and the keyboard chapter opened on "two keyboards, one input path". |
| **Truth** | The ACE **has a keyboard**. 67 Cherry MX switches are soldered to the board in a full typing layout, and that is the shipped configuration. The PS/2 socket and the matrix header are alternatives a builder uses when enclosing the board — in which case the on-board switches simply aren't fitted. |
| **Source** | SCHEM/BOM: `6502-ACE/README.md` switch rows total 67 Cherry MX switches (54 × 1.00u, 5 × 1.25u, 2 × 1.50u, 1 × 1.75u CAPS LOCK, 1 × 2.00u BACKSPACE, 3 × 2.25u, 1 × 6.25u SPACE); the Rev 1.0 and Rev 1.1 schematics both carry 70 `Switch:` symbols. |
| **Check** | SCHEM |
| **Fix** | Setting Up's keyboard step is now "nothing to do", with the two builder routes in a collapsed block. The keyboard chapter opens on the board's own keys. |

### A16 — This repo's own `docs/using/keyboard.md`: "leave Caps Lock on"

| | |
|---|---|
| **Claim** | "BASIC works in upper case… Leave Caps Lock on and stop thinking about it", followed by an example contrasting `print` with `PRINT`. |
| **Truth** | The AB Controller emits **upper case unconditionally** — Shift affects symbols and numbers only, never letters — and Caps Lock is explicitly an ignored key that "produces no output and tracks no state". There is nothing to leave on, and lower case cannot be typed at the machine at all, which makes the `print` example unreachable. Lower case only enters over the serial line. |
| **Source** | `6502-ACE/Firmware/AB Controller/README.md`: "Always Uppercase Letters: Letters are always output as uppercase ASCII regardless of modifiers"; "Ignored Keys: Caps Lock, Menu/GUI, Alt, Fn — produce no output and track no state"; modifier precedence at §"Ctrl / Shift". |
| **Check** | GREP |
| **Fix** | Rewritten: the ACE types capitals, full stop; Caps Lock does nothing; mixed case is a serial-only capability, noted in a collapsed block. |

### A17 — This repo's own docs: `PRINT CHR$(219)` for a solid block

| | |
|---|---|
| **Claim** | "`PRINT CHR$(n)` puts character number `n` on the screen; try `PRINT CHR$(219)` for a solid block" (`sound-and-video.md`), plus "codes you can send yourself from a program with `PRINT CHR$(n)` to move the cursor around" (`keyboard.md`). |
| **Truth** | Neither works. `VideoChrout` passes `$20–$7E` through to the screen, honours exactly four control codes (CR, LF, backspace, bell), and **discards everything else** — including every code `>= $7F`, which is the entire upper half of CP437. There is no cursor movement by control code. Reaching the box-drawing glyphs needs `VideoChroutRaw` (`$A02A`), which is an assembly-level call. |
| **Source** | `Kernal.asm:345-370` (`VideoChroutImpl`: `cmp #$7F / bcc @PrintChar`, then "`>= $7F` (DEL and above) — discard", with the source comment "User programs wanting raw glyph output should use VideoChroutRaw"). RUN: `PRINT CHR$(219); CHR$(176); CHR$(1); CHR$(3); "END"` on a video console puts only `END` on the screen. |
| **Check** | GREP + RUN |
| **Fix** | Both passages rewritten to say what `PRINT` can and cannot reach, and to point at the raw routine for the upper half of the set. |

### A18 — This repo's own `docs/using/monitor.md`: `G FF00` for Wozmon

| | |
|---|---|
| **Claim** | The Wozmon easter egg is reached with `G FF00`. |
| **Truth** | `G FF00` prints Wozmon's `\` prompt and then accepts no input — the machine is effectively hung. `MonCmdGo` executes `sei` before its `RTI`, so interrupts are off, so the keyboard and serial receive interrupts never deliver a character to Wozmon's polling loop. **`J FF00`** works: `MonCmdJsr` uses the RTS trick with no `sei`, leaves interrupts alone, and returns to the Monitor on `RTS`. |
| **Source** | `Monitor.asm` `MonCmdGo` (`sei` … `rti`) versus `MonCmdJsr` (push return address … `jmp (BRK_PCL)`). RUN: after `G FF00` the prompt appears and `FF00.FF07` produces nothing; after `J FF00` the same input returns `FF00: A9 1B C9 08 F0 18 C9 1B`. |
| **Check** | GREP + RUN |
| **Fix** | The chapter now uses `J`, explains `G` versus `J` where the commands are introduced, and carries a warning box about the `G FF00` trap. |

### A19 — This repo's own `docs/using/emulator.md`: drag-and-drop loading

| | |
|---|---|
| **Claim** | "Drag a `.prg` or `.bas` file onto the window", and the desktop app "remembers your settings" as a differentiator. |
| **Truth** | There is no drag-and-drop. Loading is done from the primary toolbar (Load ROM / Load Cartridge / Load Program buttons) or from the Settings panel's file rows, each with a **✕** to unload. The chapter also missed the **Clipboard** paste button, which is the app's answer to ⌘V being captured as emulated keystrokes — directly relevant to the "paste a listing in" advice in the serial chapter. |
| **Source** | `6502-EMULATOR/README.md` §"Controls → Primary Toolbar" and §"Settings Panel". |
| **Check** | GREP |
| **Fix** | The chapter now documents the real toolbar, the paste button, the Settings file rows, and fullscreen. |

### A20 — `6502-ACE/README.md`: switch reference designators disagree with the schematic

| | |
|---|---|
| **Claim** | The ACE README names the reset button **SW70** (§Hardware, "Manual reset button (SW70)"), and its BOM lists `SW68 = POWER`, `SW69 = IO ENABLE`, `SW70 = RESET`. |
| **Truth** | Both the Rev 1.0 and Rev 1.1 schematics give `SW17 = RESET` (a push switch inside the keyboard's numbering, sitting above <kbd>Esc</kbd>), `SW68 = ALT`, `SW69 = POWER` (SPDT), `SW70 = IO ENABLE` (`Switch:SW_DIP_x08`). The README's three designators are each shifted, and `SW70` names a different part entirely. |
| **Source** | SCHEM: `Hardware/ACE Board/Rev 1.0/ACE Board.kicad_sch` and `Rev 1.1/*.kicad_sch`, symbol Reference/Value pairs. The DIP switch's eight positions carry the labels `$8000`, `$8400`, `$8800`, `$8C00`, `$9000`, `$9400`, `$9800`, `$9C00` — one per I/O slot. |
| **Check** | SCHEM |
| **Consequence** | Anyone cross-referencing the README against the board or the schematic is sent to the wrong part. Schematics outrank READMEs, so the README is the thing to fix. |
| **Fix** | Upstream, in `6502-ACE`. These docs sidestep it by naming no designator for the reset button — "just above the Esc key" is more use to a reader anyway. |

### A21 — `6502-BIOS/README.md`: BASIC numbers documented as six significant digits

| | |
|---|---|
| **Claim** | The BASIC section of the BIOS README describes numbers as "5-byte / 40-bit floats, ~±1.7 × 10³⁸, **six significant digits**". |
| **Truth** | Nine. `PRINT 1 / 3` gives ` .333333333`, `PRINT SQR(2)` gives ` 1.41421356`, `PRINT 1 / 7` gives ` .142857143`. The range is right; the precision is not. |
| **Source** | RUN, at the `OK` prompt on a v1.5 machine. |
| **Check** | RUN |
| **Consequence** | A programmer trusting six digits would round away three digits of real precision. |
| **Fix** | Upstream, in `6502-BIOS/README.md`. These docs say nine, and `data/basic-keywords.json` carries the README's figure until the extractor is re-run against a corrected README. |

### A22 — `6502-BIOS/README.md`: variable names documented as single-letter

| | |
|---|---|
| **Claim** | "Single letter A-Z (numeric) and A$-Z$ (string); each may also be DIMed as a 1-D array". |
| **Truth** | Names may be any length, of letters and digits, and **the first two characters are significant** — the ordinary Microsoft BASIC rule. `AB = 3` leaves `A` at 0 and `AB` at 3. `COUNT = 7 : COURSE = 9 : PRINT COUNT` prints ` 9`, because both are `CO`. |
| **Source** | RUN. |
| **Check** | RUN |
| **Consequence** | Understated by a long way: the README describes 26 numeric variables where the machine offers hundreds, and it gives no warning about the collision rule that comes with them — or about names containing a keyword (`SCORE` contains `OR` and will not parse). |
| **Fix** | Upstream. [Numbers and variables](docs/basic/numbers-and-variables.md) documents the real rule, the two-character collision and the buried-keyword trap. |

### A23 — `6502-BIOS/README.md`: FOR/NEXT nesting documented as 8 levels

| | |
|---|---|
| **Claim** | "FOR/NEXT supports up to 8 nested loops." |
| **Truth** | At least 16. Sixteen nested `FOR` loops, each closed by its own `NEXT`, run to completion; nine nested loops around a counter produce 2⁹ = 512 iterations with no error. |
| **Source** | RUN. |
| **Check** | RUN |
| **Consequence** | Understates the machine. Harmless in that nobody was told they could do less than they can — but the number is wrong, and the guide would have repeated it. |
| **Fix** | Upstream. The guide says loops nest "as deep as you like in practice" and does not quote a figure, since the real ceiling is stack space shared with `GOSUB` rather than a fixed count. |

### A24 — `6502-BIOS/README.md`: `NEXT` documented with a comma list it does not accept

| | |
|---|---|
| **Claim** | Syntax given as `NEXT [var [, var ...]]`. |
| **Truth** | One variable only. `NEXT J, I` runs the inner loop's first iteration and then fails with `?NEXT WITHOUT FOR ERROR`, at the comma. Bare `NEXT` and `NEXT J` both work. |
| **Source** | RUN: a two-deep nest closed with `NEXT J, I` prints ` 1 1 1 2` then `?NEXT WITHOUT FOR ERROR IN 40`. |
| **Check** | RUN |
| **Consequence** | The most consequential of this batch: it is documented syntax that fails at runtime, in the middle of a loop, with an error naming a cause that isn't the real one. |
| **Fix** | Upstream — either the README or `BasCmdNext`. The guide teaches one `NEXT` per loop and says the comma form is not accepted. `data/basic-examples.json` pins it with a running case. |

### A25 — `6502-BIOS/README.md`: seven keyword syntax lines copied from the wrong entry

| | |
|---|---|
| **Claim** | The README's BASIC keyword tables give: `COS` → `SIN(x)`, `TAN` → `SIN(x)`, `RIGHT$` → `LEFT$(s$,n)`, `MAX` → `MIN(a,b)`, `BSAVE` → `BLOAD <addr>,"name"`, `SAVE` → `LOAD "name"`, and `INPUT` → `INPUT ["prompt"{;` (truncated). |
| **Truth** | Each is the neighbouring entry's line, pasted and not edited — `COS(x)`, `TAN(x)`, `RIGHT$(s$,n)`, `MAX(a,b)`, `BSAVE addr,len,"name"`, `SAVE "name"`. All seven keywords themselves work correctly; only their documentation is wrong. |
| **Source** | GREP (the README tables) + RUN (each keyword exercised). |
| **Check** | GREP + RUN |
| **Consequence** | `BSAVE` is the dangerous one: a reader following the README would call it with two arguments and lose the length. |
| **Fix** | Upstream. Corrected syntax for all 85 keywords now lives in `data/basic-examples.json`, hand-authored and machine-checked, and is what [the reference](docs/basic/reference.md) prints. The generated `data/basic-keywords.json` still carries the README's text — the two disagreeing is exactly this entry. |

### A26 — Zero page `$003A` is not free while BASIC is running

| | |
|---|---|
| **Observation** | The memory map describes 198 bytes of zero page from `$003A` as available to user code. From BASIC that is not true of `$003A` itself: `POKE 58, 96` does not stick — `PEEK(58)` still reads 58 immediately afterwards — and `SYS 58` lands somewhere unintended. |
| **Truth** | The range is free for a machine-code program that has taken the machine over, which is the context the map is written for. It is *not* free underneath a running BASIC, which uses that space as it interprets. |
| **Status** | Not a contradiction, but a claim that reads as more general than it is. |
| **Consequence for these docs** | The BASIC guide never points `POKE`, `SYS` or `WAIT` at zero page; it uses 2560 (`$0A00`) for scratch and says plainly that it is only safe for a short program. Phase 6 should state the qualifier where it documents the zero-page map. |
| **Check** | RUN |

### A27 — A 2.19 build of the templates is byte-identical to a HEAD build

| | |
|---|---|
| **Observation** | A7 established that only the BIOS needs a post-2.19 cc65. Phase 5 settled the remaining question — what a reader on 2.19 gives up — by building the actual 2.19 release from its source tarball into a throwaway prefix and running both toolchains over the same program. |
| **Truth** | Nothing, until the program uses an instruction the plain 65C02 lacks. `samples/crossdev/countdown.asm` assembled with the 2.19 release and with `cl65 V2.19 - Git 547d92358` produces **byte-identical** output (49 bytes, `cmp` clean). The same 2.19 toolchain fails on the ROM at `BIOS.asm(22): Error: CPU not supported`. |
| **Source** | Built `cc65-2.19` from `github.com/cc65/cc65` tag `V2.19` (`make bin`, `mkdir -p lib`, `make none`, install to a scratch prefix — the recipe in `6502-BIOS/README.md`, which this exercise also confirms works as written). |
| **Check** | RUN |
| **Status** | `confirmed` — refines A7 with the measurement it was missing. |
| **Consequence** | `docs/crossdev/cc65.md` tells a reader to install whatever their package manager has, and to go and get a newer toolchain only when they want to build the ROM. |

### A28 — `cl65 --version` cannot identify a cc65 build, in either direction

| | |
|---|---|
| **Observation** | A7's aside recorded that a HEAD build reports `V2.19`. The 2.19 release is worse: built from its own tarball it reports **`ca65 V2.18 - N/A`**. |
| **Truth** | The version string is derived at build time and identifies neither release nor capability. The only reliable test is to assemble a probe: `printf '.setcpu "W65C02"\n wai\n' \| ca65 -o /dev/null /dev/stdin`. |
| **Check** | RUN |
| **Status** | `confirmed` |
| **Consequence** | Documented on the page as "don't trust the version string", with both observed strings in a table. `scripts/preflight.mjs` already probes rather than parsing. |

### A29 — `cl65 -Ln` silently writes an empty label file without `-g`

| | |
|---|---|
| **Observation** | `cl65 -t none -C 6502.cfg -Ln out.lbl -o out.prg src.asm` exits 0 and produces a **zero-line** `out.lbl`. Adding `-g` to the same command produces 218 lines. Nothing warns. |
| **Truth** | Upstream cc65 behaviour, not a bug in this ecosystem — but a reader following the templates has no reason to expect it, and the symptom is a debugger that claims every symbol is missing. |
| **Check** | RUN |
| **Status** | `wontfix` — upstream cc65 behaviour, documented rather than worked around. |
| **Consequence** | Both `docs/crossdev/makefile.md` and `docs/crossdev/debugging.md` state that `-g` is required for `-Ln`. |

### A30 — A `=` constant never reaches the label file; `:=` does

| | |
|---|---|
| **Observation** | `Counter = $40` in a source built with `-g -Ln` does not appear in the label file, and `6502 dbg sym resolve Counter` answers `no symbol named "Counter"`. `Counter := $40` appears as `al 000040 .Counter`, and `dbg mem Counter` and `dbg disasm` then both name it. |
| **Truth** | ca65 treats the two assignments differently — `:=` defines an address-typed symbol, which is what the VICE label format carries. |
| **Check** | RUN |
| **Status** | `wontfix` — ca65 semantics, documented rather than worked around. |
| **Consequence** | `samples/crossdev/countdown.asm` uses `:=` and says why in a comment; `docs/crossdev/debugging.md` carries it as a warning block. |

### A31 — A breakpoint condition naming an unknown symbol is always true

| | |
|---|---|
| **Observation** | `6502 dbg break CountLoop --condition '[NOSUCHSYMBOL] == 99'` is accepted without complaint and fires on the **first** hit. Compare `--condition 'A == $FF'`, which correctly never fires, and `'[Counter] == 3'`, which correctly fires on the eighth iteration. |
| **Truth** | An unresolved identifier makes the expression evaluate true rather than raising an error at `bp.set` time or when it is evaluated. `DEBUG-PROTOCOL.md` documents that "bare identifiers resolve as symbols" but not what happens when one doesn't. |
| **Source** | Emulator 2.5.1, `6502 dbg break … --condition` |
| **Check** | RUN |
| **Status** | `confirmed` — an upstream item for `6502-EMULATOR`. Failing closed (or refusing the breakpoint) would be the safer behaviour, since the symptom of a typo is a breakpoint that appears to ignore its condition. |
| **Consequence** | `docs/crossdev/debugging.md` warns about it next to the conditional-breakpoint section, because combined with A30 it is easy to hit: a `=` constant looks like a symbol, isn't one, and the condition then always matches. |

### A32 — `6502 dbg mem fill` refuses `0` and every hex form

| | |
|---|---|
| **Observation** | `mem fill $0400 16 0` → `value: expected a positive number, got "0"`. Same for `0x00` and `$EA`. `mem fill $0400 8 255` works. The sibling command `mem write` accepts a hex byte string (`DEADBEEF`) happily. |
| **Truth** | The argument is validated as a *positive* number and parsed as decimal only, which rules out the most common fill value of all — zero — and every notation the rest of the CLI accepts for a byte. |
| **Source** | Emulator 2.5.1 |
| **Check** | RUN |
| **Status** | `confirmed` — an upstream item for `6502-EMULATOR`. |
| **Consequence** | The debugging chapter zeroes memory with `mem write` and notes the quirk in one sentence rather than teaching around it silently. |

### A33 — `6502-PRG/Makefile`: `clean` fails on a clean tree and misses one artefact

| | |
|---|---|
| **Observation** | `make cf` copies the program to its 8.3 name (`PROGRAM.PRG`) before adding it to the image, and `clean` does not remove that copy. Separately, `clean` uses `rm` without `-f`, so running it twice stops with an error the second time. |
| **Truth** | Both are small template warts rather than wrong documentation. |
| **Status** | `confirmed` — an upstream item for `6502-PRG`, worth one commit in Phase 9. |
| **Consequence** | `docs/crossdev/makefile.md` shows the corrected `clean` line and a `.PHONY` list, framed as housekeeping the reader adds. |

### A34 — `6502-PRG/README.md` and `6502-CRT/README.md` still say `brew install cc65`

| | |
|---|---|
| **Claim** | Both templates' prerequisites read `brew install cc65` with no version qualification; `6502-ASM/README.md` is the instance PLAN.md Appendix C #4 already records. |
| **Truth** | For these two repos the plain install is **correct** — A27 shows 2.19 builds both templates byte-identically. The line is not wrong; it is merely silent about the one case (building the ROM) where it isn't enough. |
| **Status** | `wontfix` for the templates, other than an optional pointer to the BIOS README's fuller explanation. Recorded so Phase 9 does not "fix" three READMEs into telling every reader to build cc65 from source. |

### A35 — `6502-CRT/Cart.asm`: `KernalInit` documented at the wrong address

| | |
|---|---|
| **Claim** | The template's header comment reads `KernalInit ($A072) initializes all hardware`. |
| **Truth** | `KernalInit` is slot 40, at **`$A078`**. `$A072` is `StWaitReady`. The same repo gets it right everywhere else — `6502.inc:416`, `README.md:14` and `README.md:34` all say `$A078` — so this is one stale comment, not a wrong build. |
| **Source** | `Kernal.asm` jump table; `6502-CRT/6502.inc` |
| **Check** | GREP |
| **Status** | `confirmed` — a one-line upstream fix for `6502-CRT` in Phase 9. |
| **Consequence** | Harmless in practice: the code calls the symbol, not the number. But a reader copying the comment into their own cartridge would call the CompactFlash wait routine at power-on and wonder why the machine hangs on a machine with no card. `docs/assembly/cartridges.md` never prints a jump-table address. |

### A36 — A chained IRQ handler must not push anything

| | |
|---|---|
| **Observation** | The Kernal's IRQ handler decides whether it was entered by `BRK` or by hardware by reading the saved processor status off the stack at a **fixed depth** (`tsx` then `lda $104,x`, past the A/Y/X it has just pushed). A handler installed in front of it via `IRQ_PTR` that pushes anything before its `jmp (Chain)` shifts that read onto the wrong byte. |
| **Truth** | Chaining works only if the new front of the chain leaves the stack exactly as the processor left it — so it either uses instructions that touch no register (`inc`, `dec`, `stz` on absolute addresses) or restores everything it used before handing over. Nothing in the BIOS README says so. |
| **Source** | `Kernal.asm` IRQ handler; confirmed by a chained counting handler that reports six interrupts for six typed characters |
| **Check** | RUN |
| **Status** | `confirmed` — not a bug, an undocumented constraint. Phase 9 should add a sentence to the BIOS README next to the interrupt vectors. |
| **Consequence** | `docs/assembly/interrupts.md` states it as a warning and the chapter's program is one `inc` long on purpose. The alternative — replacing the vector outright and ending in `rti` — is documented alongside it. |

### A37 — "The screen drops codes above 126" is a property of `Chrout`, not of the screen

| | |
|---|---|
| **Claim** | [PLAN.md's *Write from the seat*](PLAN.md#write-from-the-seat-not-from-the-harness) table says that, at the ACE, "the screen drops every code above 126 and all but four control codes". |
| **Truth** | The filtering is in `Chrout`'s video path, which discards `$7F` and above and every control code except CR, LF, backspace and bell. The screen itself displays all 256 characters perfectly well — `VideoChroutRaw` puts any code on it, which is how a program draws with the box-drawing set. |
| **Source** | `Kernal.asm` video Chrout implementation; confirmed by a program that draws a double-line box and centred title on a video machine |
| **Check** | RUN |
| **Status** | `confirmed` — the shorthand is right about what a reader sees from `PRINT` and wrong about why, which matters as soon as anyone writes to the screen directly. |
| **Consequence** | `docs/assembly/console.md` states the boundary precisely and `docs/assembly/video.md` draws with `VideoChroutRaw`. The user's guide's phrasing stands: from BASIC, the effect is exactly as described. |

### A38 — Every system card plays a note on voice 0, which is not a voice

| | |
|---|---|
| **Claim** | `SOUND 0,440,50` "plays a 440 Hz tone" — printed on the ACE, COB, DEV and VCS sheets. |
| **Truth** | `?ILLEGAL QUANTITY ERROR`. `SOUND` takes **voice 1 to 3**; there is no voice 0. `SOUND 1,440,50` works. |
| **Source** | RUN, at the `OK` prompt. `data/basic-examples.json` gives the syntax as `SOUND voice, freq, dur` with voice 1–3. |
| **Check** | RUN |
| **Consequence** | The one listing on those sheets a reader is most likely to try first — "make some noise" — errors out. It is also the only one whose failure gives no clue what to change. |
| **Fix** | Corrected on all four cards. The Kernal's own `SidPlayNote` numbers voices 0–2, which is where the off-by-one presumably came from; BASIC adds one. |

### A39 — `SYS $FF00` is a syntax error

| | |
|---|---|
| **Claim** | The ACE and COB sheets reach the Wozmon easter egg with `SYS $FF00`. |
| **Truth** | `?SYNTAX ERROR`. This BASIC has no `$` hex literal — `HEX()` formats hex for *output* only. **`SYS 65280`** works, and lands in an interactive Wozmon: `FF00.FF07` then answers `FF00: A9 1B C9 08 F0 18 C9 1B`. |
| **Source** | RUN: `PRINT $FF00` and `SYS $FF00` both fail; `PRINT HEX(65280)` prints `$FF00`. |
| **Check** | RUN |
| **Fix** | Corrected on both cards. Note this is the *opposite* of A18: from BASIC, `SYS` reaches Wozmon and it works, because `SYS` does not turn interrupts off the way the Monitor's `G` does. |

### A40 — The "random maze" one-liner draws nothing at all

| | |
|---|---|
| **Claim** | The ACE and COB sheets offer `10 PRINT CHR$(INT(RND(1)*2)+177);` / `20 GOTO 10` as "fills the screen with a maze pattern". |
| **Truth** | It fills the screen with nothing. `CHR$(177)` and `CHR$(178)` are `$B1` and `$B2`, and `Chrout`'s video path discards everything from `$7F` up (A17, A37). The program runs for ever on a blank screen. |
| **Source** | RUN on `--console video`: after 8 M cycles the screen still shows only the three typed lines. Confirmed against `PRINT CHR$(177); CHR$(178); "END"`, which prints `END`. |
| **Check** | RUN |
| **Consequence** | The worst of this batch. It does not error, so there is nothing to look up; the machine simply appears to have hung. On a card handed to someone at a display table, that reads as a broken computer. |
| **Fix** | Replaced with `10 PRINT CHR$(47 + 45 * INT(RND(1) * 2));` — `/` and `\`, both inside the printable range, which is the C64 maze trick done with characters this machine will actually pass. RUN-verified: it fills the screen. |

### A41 — `?` is not a `PRINT` abbreviation here

| | |
|---|---|
| **Claim** | Four system sheets head their BASIC table with `PRINT / ?`. |
| **Truth** | `? "SHORTHAND"` gives `?SYNTAX ERROR`. The tokenizer has no `?` entry: `data/basic-keywords.json` lists 85 keywords and `?` is not among them. |
| **Source** | GREP (the token table) + RUN |
| **Check** | GREP + RUN |
| **Consequence** | Inherited Commodore muscle memory. Mild, but it teaches a keystroke that fails, and `?` is what the machine puts in *front of* an error — so a reader who tries it sees `?SYNTAX ERROR` and may not realise the first character is the machine's, not theirs. |
| **Fix** | The cards say `PRINT`. |

### A42 — `6502-ACE/README.md`: nine connector designators are shifted

| | |
|---|---|
| **Claim** | The ACE README's connector table gives `J14 = AUDIO R`, `J15 = AUDIO`, `J16 = 5V DC`, `J17 = CART`, `J18 = BUS`, `J19 = VCC`, `J20 = POWER LED`, `J21 = STORAGE`, `J22 = KEYBOARD`. |
| **Truth** | Both the Rev 1.0 and Rev 1.1 schematics give `J14 = KEYBOARD`, `J15 = AUDIO R`, `J16 = AUDIO`, `J17 = 5V DC`, `J18 = CART`, `J19 = BUS`, `J20 = VCC`, `J21 = POWER LED`, `J22 = STORAGE`. `J1`–`J13` agree. |
| **Source** | SCHEM: `Hardware/ACE Board/Rev 1.0/ACE Board.kicad_sch` and `Rev 1.1/*.kicad_sch`, Reference/Value pairs on every connector symbol. |
| **Check** | SCHEM |
| **Consequence** | The same class of error as A20, which found the switch designators shifted — and it means A11's citation of "`J16` `5V DC`" from the README named the wrong part. The barrel jack is **`J17`**. Anyone cross-referencing the README against the board from `J14` up is sent one connector out. |
| **Fix** | Upstream, in `6502-ACE`. [Connectors](docs/reference/connectors.md) and `docs/public/cards/connectors.html` are built from the schematic, and every pin on that card was read off the netlist rather than off the README. |

### A43 — `data/monitor-commands.json` reached Wozmon with `G`, which A18 had already disproved

| | |
|---|---|
| **Claim** | The extractor wrote `wozmon.fromMonitor: "G FF00"`. |
| **Truth** | A18 established in Phase 3 that `G FF00` hangs and `J FF00` works. The fact base was never corrected, so it still held the disproved form. |
| **Source** | `scripts/extract-facts.mjs`, `extractMonitorCommands` |
| **Check** | GREP |
| **Consequence** | Nothing shipped it — the Monitor chapter was written by hand and got it right. But Phase 7 generates the Monitor card *from this file*, so it would have reprinted the trap on a card meant to be trusted at the keyboard. Worth recording as the case for generating cards: the error surfaced the moment something started reading the field. |
| **Fix** | Corrected in the extractor, with the reason in a comment, and re-extracted. |

---

## Not a discrepancy, but worth stating once

- **The Monitor has its own version.** Its banner is `6502 MONITOR v1.1`
  (`Monitor.asm:2537`), independent of the BIOS version and of the BASIC banner.
  Three version numbers ship in one ROM: BIOS v1.5, BASIC V2.0, Monitor v1.1.
  The docs should say so rather than let a reader assume one number covers all.
- **`HW=$7F` on a headless machine is correct.** `MEM` reports `HW_PRESENT`
  (`$030D`), and bit 7 is the video card. Booted headless the BIOS finds no
  video, clears that bit, and routes the console to serial. A machine booted
  `--console video` reports `HW=$FF` — a fully-fitted ACE, which is the machine
  the guide describes. See A10 for the error this distinction caused.
- **The ACE has a power switch and an IO ENABLE DIP bank**, neither of which
  the first pass of Phase 3 mentioned. The DIP switch's eight positions map to
  the eight I/O slot base addresses, so it disables sections of the machine for
  fault-finding. Both are now in `your-ace.md`.
- **`BREAK IN n` names whichever line was executing.** Breaking the two-line
  `GOTO` loop lands on line 10 or line 20 depending on where the check fired;
  the number is not fixed and the docs should not imply it is.
- **`6502-ASSETS/README.md:132` does mention the sector buffer** ("of which
  `$0600-$07FF` doubles as the CompactFlash sector buffer"), so PLAN.md
  Appendix C #5 slightly overstates that finding. The real problem with that
  line is A8 above.
