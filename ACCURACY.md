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
| confirmed | 9 |
| open | 4 |
| fixed | 0 |

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

### O1 — Sample programs on the ASSETS system cards

| | |
|---|---|
| **Claim** | The ACE / COB / DEV / KIM / VCS reference sheets each print sample programs. |
| **Suspected** | Most of the ACE sheet's programs do not run as printed. |
| **Plan** | Phase 7 opens by typing every listing on every card into the emulator. Each becomes a verified `samples/` case or gets fixed or dropped. This is expected to generate the bulk of this ledger. |
| **Check** | pending RUN |

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

### O4 — The migrated cards still carry their original v1.0-era content

| | |
|---|---|
| **Observation** | Phase 2 moved seventeen sheets onto the shared `cards/card.css`. That transform touched the `<head>` and the `<body>` tag only — every table, address, and listing is exactly the text that shipped in `6502-ASSETS`. So A2 (BASIC/Monitor ROM boundary) and A3 (`READY.`) are still printed on `docs/public/cards/ace.html` today, and the other four system cards have not been read against the fact base at all. |
| **Status** | Deliberate. Rebuilding card content is Phase 7, which opens by auditing every card against `data/`; doing it during the migration would have mixed a mechanical, diffable move with editorial work and made both harder to check. |
| **Mitigation** | Nothing on the site links to a card yet. The cards are reachable by URL but are not presented as current. |
| **Check** | pending GREP + RUN (Phase 7) |

---

## Not a discrepancy, but worth stating once

- **The Monitor has its own version.** Its banner is `6502 MONITOR v1.1`
  (`Monitor.asm:2537`), independent of the BIOS version and of the BASIC banner.
  Three version numbers ship in one ROM: BIOS v1.5, BASIC V2.0, Monitor v1.1.
  The docs should say so rather than let a reader assume one number covers all.
- **`HW=$7F` on a headless machine is correct.** `MEM` reports `HW_PRESENT`
  (`$030D`), and bit 7 is the video card. Booted headless the BIOS finds no
  video, clears that bit, and routes the console to serial — which is exactly
  the graceful degradation the docs are meant to teach.
- **`6502-ASSETS/README.md:132` does mention the sector buffer** ("of which
  `$0600-$07FF` doubles as the CompactFlash sector buffer"), so PLAN.md
  Appendix C #5 slightly overstates that finding. The real problem with that
  line is A8 above.
