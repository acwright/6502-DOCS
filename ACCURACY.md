# ACCURACY.md — the discrepancy ledger

Every place where a document in this ecosystem disagrees with the machine, what
the machine actually does, how that was established, and whether it has been
fixed.

Each open item is fixed **in the repo that got it wrong**, not just worked
around in the docs.

## How to read an entry

**Check** is the verification method: `GREP` (read the source), `RUN` (execute
it on the emulator), `INSPECT` (`6502 dbg mem` / `disasm` / `screen`), `SCHEM`
(read the KiCad schematic).

**Status** is one of:

| Status | Meaning |
|---|---|
| `confirmed` | The discrepancy is real and verified. Awaiting a fix in its home repo. |
| `fixed` | Corrected upstream. Records the commit. |
| `open` | Suspected, not yet verified. |
| `wontfix` | Deliberate; the reason is recorded. |

**Baseline for every entry below:** BIOS v1.5, emulator 2.6.2, cc65 built from
HEAD (`cl65 V2.19 - Git 547d92358`). Entries recorded before Phase 11 name the
release they were found on; where that matters — A31 and A32 — the entry says so.

---

## Summary

| Status | Count |
|---|---|
| fixed | 46 |
| confirmed | 4 |
| open | 4 |
| wontfix | 4 |

**Phase 9 closed the ledger's upstream backlog.** Every confirmed item that
named a sibling repo has been fixed in that repo, one commit each, with the
source-of-truth citation in the message: `6502-BIOS` (A8, A21, A22, A23, A24,
A36, O2), `6502-ACE` (A20, A42), `6502-KIM` (A4), `6502-PRG` (A8, A33),
`6502-CRT` (A8, A35), `6502-EMULATOR` (A6, A31, A32, O5), `6502-DEV` (a new
one). What remains open is **A44** and **A48**, which need a camera and an ACE
respectively, plus **A26** and **O5's** documentation notes, which are
observations rather than defects.

**Phase 11 closed A31 and A32**, whose consequence lines had been waiting for
the release that carries the fix, and added two of its own from putting a live
machine on the page: **A52**, a frame that reported its own normal startup as a
permanent error, and **A53**, the reason the site sends the frame a single
keystroke instead of relying on URL parameters alone. **A54** came out of
writing the chapter rather than the site — a relative `prg=` resolves against
the emulator and not against the page framing it, which is what the plan and
`EMBEDDING.md` both implied it did.

**Phase 10 closed A1**, the oldest entry here, in the only way it could be
closed: `6502-ASSETS` is archived, and the README that called v1.4 current was
replaced with a notice pointing at this site before the repo went read-only.
The ledger opened on that claim and now outlives the document that made it.

Three of the phase's findings are worth reading before the entries:

- **A25 was misdiagnosed.** The BIOS README's keyword tables were never wrong.
  This repo's extractor took the *first* backticked span of a grouped row and
  gave it to every keyword on that row, so `SIN(x) / COS(x) / TAN(x)` made COS
  and TAN both read `SIN(x)`. The bug was here. See A25 below.
- **A23 was wrong about the number.** `FOR` nests **14** deep, not "at least
  16". Measured at every depth from 8 to 24, and explained by the source: a
  frame is 18 bytes on a 256-byte stack, and `BasCmdFor` has no depth guard.
- **A50 is new**, and is the RAM map in the BIOS README putting BASIC's `GOSUB`
  and `FOR` stacks at `$0400–$05FF` when `BASIC.asm` says outright that they
  live on the CPU stack.

Entries **A10–A13** were found while rewriting Phase 3 against the course
correction that followed it, and **A14–A19** in the review pass after that. Most are errors this project's **own first pass**
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

**A44** comes from Phase 8, which put the first photographs of real hardware on
the site. It is A9's problem in a second photograph — a version number visible
in a picture — and A9 itself is resolved there, as a captioned historical shot
rather than a reshoot.

**A45** comes from building a color chart for the BASIC guide, which meant
checking what `COLOR` actually does before drawing swatches for it. It turned
up a claim the chapter had backwards since the first pass of Phase 3 — one that
`docs/assembly/video.md` had already stated correctly, which is what made the
disagreement visible.

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
| **Status** | `fixed` |
| **Fix** | Phase 10 retired the repo. `6502-ASSETS` 7519e25 replaces that README wholesale with a notice pointing at this site, so the claim is gone rather than corrected — the v1.5 cards Phase 7 generated are the replacement it points to. The same commit removes the memory-map summary that carried **A4** and **A8**. |

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
| **Also affects** | `6502-KIM/README.md#keypad-card` repeated the conflation in its overlay table: "`$A000–$BFFF` BIOS Kernal (unchanged, still callable)". Both halves *are* still readable under the overlay, so the row was not wrong about reachability — only about the name. |
| **Fix** | `fixed` — `6502-KIM` d88eb9a splits the row into `$A000–$B7FF` Kernal and `$B800–$BFFF` character set. The BIOS README's own ROM map already had it right. |

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
| **Note** | The *substance* of Appendix C #3 — that the prompt is `OK` and not `READY.` — is correct; only the version number in the quoted banner is wrong. |
| **Fix** | `fixed` — `6502-EMULATOR` 19e3a95 corrects both transcripts (`docs/AGENTS.md` and `README.md`). |

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
| **Consequence** | A reader who trusts the name will POKE into BASIC's line buffer. The genuinely free RAM is `$003A–$00FF` in zero page and everything above the program in `$0800–$7FFF`. |
| **Fix** | `fixed` in three repos. `6502-BIOS` bbca238 documents `USER_VARS` in `BIOS.inc` for what it is — a legacy name kept only because Wozmon builds its input buffer there — and the README's RAM map now names `BAS_LINBUF` and `BAS_TOKBUF` separately with a note that none of `$0400–$07FF` is free. `6502-PRG` 25869c5 and `6502-CRT` 672e813 reword the same line in their `6502.inc`, and qualify the zero-page line as well: `$003A–$00FF` is free for a program that has taken the machine over, which is A26's point. |

### A9 — The family hero photo shows a two-major-versions-stale banner

| | |
|---|---|
| **Claim** | `6502-ASSETS/Images/6502.png` — now `docs/public/images/6502.png` — is the one photograph of a real machine in the whole asset set, and PLAN.md Phase 3 chapter 1 and Appendix B both earmark it for the introduction. Its monitor reads `6502 BASIC v1.0` / `30719 BYTES FREE` / `OK`. |
| **Truth** | The banner is **`6502 BASIC V2.0`** (uppercase `V`, major version 2) and the machine reports **`30718 BYTES FREE`**. |
| **Source** | RUN: `6502 run --headless --exit-on 'OK'` prints `-- 6502 BIOS v1.5 --` / `6502 BASIC V2.0` / `30718 BYTES FREE` / `OK`. |
| **Check** | RUN |
| **Consequence** | Putting it on the intro page unedited teaches the wrong banner on the first screen a reader sees, and it is the kind of error a reader would reasonably take as authoritative — it is a photograph. |
| **Fix** | **Resolved in Phase 8**, by the third route: it runs as a captioned historical shot on `docs/family/index.md`, where "an earlier machine, before the ACE brought all of this onto one board" is the page's subject rather than a caveat on it. The caption dates the banner explicitly, so nothing about it is presented as current. Imported as `photos/family-desk.jpg`; `IMAGES.md` carries the entry. |
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
| **Status** | `fixed` — compared in Phase 9, and **they agree**. 204 symbols appear in both files and **not one disagrees on its value**. The template additionally carries 142 symbols the extractor does not emit (hardware constants and bit masks), and the generated file carries 53 the template does not (BASIC's own internals — `BAS_TXTTAB`, `BAS_WARM` and the like, which are not part of the published API). `6502-PRG/6502.inc` and `6502-CRT/6502.inc` are byte-identical to each other. |
| **Note** | No template bug to fix, which is the outcome worth recording: the hand-maintained include has kept up with the ROM. What the templates *did* need was a wording fix, in A8. |
| **Check** | GREP — symbol/value pairs parsed out of all three files and compared, rather than a text diff, since the files are laid out differently. |

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
| **Status** | `fixed`. Was not a documentation error — a gap in what the emulator CLI could simulate. |
| **Fix** | `fixed` — `6502-EMULATOR` 19e3a95 adds `--empty <cards>`, which leaves any I/O slot unpopulated: `ram1`, `ram2`, `rtc`, `storage`, `serial`, `via`, `sound`, `video`, or `io1`..`io8`. `6502 run --headless --empty storage` reports `HW=$77` and answers `DIR` with **`?NO DEVICE ERROR`**, so [Storage](docs/using/storage.md)'s claim is now RUN-verifiable like everything else in that chapter. The flag generalises past this one case — `--empty sound` reaches the silent `SOUND`/`VOL` returns that A10 mistook for the default machine. |
| **Check** | GREP (the error path); RUN attempted and found not reproducible |

### A10 — This repo's own `docs/using/sound-and-video.md`: "no SID fitted"

| | |
|---|---|
| **Claim** | The first pass of the sound chapter said `SOUND`/`VOL` "runs on the default headless machine, which has no SID". |
| **Truth** | The default headless machine **does** have a SID. `MEM` reports `HW=$7F`: every bit set except video (bit 7, `$40` is `HW_SID` and it is set). With `--console video` it reports `HW=$FF`. |
| **Source** | RUN: `MEM` on a default headless boot prints ` 30718 BYTES FREE  HW=$7F`; the same on `--console video` prints `HW=$FF`. |
| **Check** | RUN |
| **Consequence** | The paragraph drew a graceful-degradation lesson from a condition that was not occurring. The underlying ROM behavior — `BasCmdSound`/`BasCmdVol` do not guard on `HW_SID` — is real, but it was not what the sample demonstrated. |
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
| **Fix** | Rewritten: the ACE types capitals, period; Caps Lock does nothing; mixed case is a serial-only capability, noted in a collapsed block. |

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
| **Fix** | `fixed` — `6502-ACE` 2b8d717. The audit went further than this entry: the schematic numbers RESET as **SW17**, a push button inside the keyboard's own numbering, which shifts *every* designator from SW15 up by one, so the BOM's size groupings were wrong too (CAPS LOCK is SW32 not SW31, SPACE is SW62 not SW61, the 2.25u group is SW42/SW45/SW50). All of it was re-derived from the schematic's Footprint properties rather than transcribed. These docs continue to name no designator — "just above the Esc key" is more use to a reader anyway. |

### A21 — `6502-BIOS/README.md`: BASIC numbers documented as six significant digits

| | |
|---|---|
| **Claim** | The BASIC section of the BIOS README describes numbers as "5-byte / 40-bit floats, ~±1.7 × 10³⁸, **six significant digits**". |
| **Truth** | Nine. `PRINT 1 / 3` gives ` .333333333`, `PRINT SQR(2)` gives ` 1.41421356`, `PRINT 1 / 7` gives ` .142857143`. The range is right; the precision is not. |
| **Source** | RUN, at the `OK` prompt on a v1.5 machine. |
| **Check** | RUN |
| **Consequence** | A programmer trusting six digits would round away three digits of real precision. |
| **Fix** | `fixed` — `6502-BIOS` bbca238 says nine and shows the two examples. `data/basic-keywords.json` now carries nine as well. |

### A22 — `6502-BIOS/README.md`: variable names documented as single-letter

| | |
|---|---|
| **Claim** | "Single letter A-Z (numeric) and A$-Z$ (string); each may also be DIMed as a 1-D array". |
| **Truth** | Names may be any length, of letters and digits, and **the first two characters are significant** — the ordinary Microsoft BASIC rule. `AB = 3` leaves `A` at 0 and `AB` at 3. `COUNT = 7 : COURSE = 9 : PRINT COUNT` prints ` 9`, because both are `CO`. |
| **Source** | RUN. |
| **Check** | RUN |
| **Consequence** | Understated by a long way: the README describes 26 numeric variables where the machine offers hundreds, and it gives no warning about the collision rule that comes with them — or about names containing a keyword (`SCORE` contains `OR` and will not parse). |
| **Fix** | `fixed` — `6502-BIOS` bbca238 states the real rule, the two-character collision and the buried-keyword trap in a callout of its own. [Numbers and variables](docs/basic/numbers-and-variables.md) already had all three. |

### A23 — `6502-BIOS/README.md`: FOR/NEXT nesting documented as 8 levels

| | |
|---|---|
| **Claim** | "FOR/NEXT supports up to 8 nested loops." |
| **Truth** | **14.** Nine nested loops around a counter produce 2⁹ = 512 iterations with no error; fourteen run to completion; fifteen and beyond do not. |
| **Source** | RUN, at every depth from 8 to 24 — a program of *n* nested `FOR`s each closed by its own `NEXT`. Depths 8–14 print their end marker; 15, 16, 17, 20 and 24 all fail, and they fail at the **fifteenth** `NEXT` whatever the depth, which is what pins the ceiling at 14. |
| **Check** | RUN + GREP |
| **Correction** | **This entry was wrong when it was written**, and in the more dangerous direction: it said "at least 16" on the strength of a single sixteen-deep program that appeared to pass. Re-running it under Phase 9 with a counter variable outside the loop set showed it had never been printing anything — the original test's counter was `N`, which was also one of its sixteen loop variables. |
| **Why 14** | `BASIC.asm:7650-7678` pushes an 18-byte frame per `FOR` — `TXTPTR`, `CURLIN`, the 5-byte limit, the step sign, the 5-byte step, the variable address, and the `$81` tag. Fourteen of those is 252 bytes, and page 1 is 256. |
| **The real finding** | Not the number — the failure mode. `BasCmdGosub` guards its push against `GOSUB_STACK_MIN` and raises `OUT OF MEMORY` when it would overflow; **`BasCmdFor` has no such guard**. The fifteenth frame silently overwrites the bottom of the stack, and the error surfaces later, at that loop's `NEXT`, as `?NEXT WITHOUT FOR ERROR` — naming a line that is correct. |
| **Fix** | `fixed` — `6502-BIOS` bbca238 documents 14, the frame size, the missing guard and the misleading error. [Loops](docs/basic/loops.md) carries the same in a `::: tip`, framed as something you meet by accident or not at all. |

### A24 — `6502-BIOS/README.md`: `NEXT` documented with a comma list it does not accept

| | |
|---|---|
| **Claim** | Syntax given as `NEXT [var [, var ...]]`. |
| **Truth** | One variable only. `NEXT J, I` runs the inner loop's first iteration and then fails with `?NEXT WITHOUT FOR ERROR`, at the comma. Bare `NEXT` and `NEXT J` both work. |
| **Source** | RUN: a two-deep nest closed with `NEXT J, I` prints ` 1 1 1 2` then `?NEXT WITHOUT FOR ERROR IN 40`. |
| **Check** | RUN |
| **Consequence** | The most consequential of this batch: it is documented syntax that fails at runtime, in the middle of a loop, with an error naming a cause that isn't the real one. |
| **Fix** | `fixed` — `6502-BIOS` bbca238 gives the syntax as `NEXT [var]` and says in the same row that the comma form fails at runtime, and where. The guide already taught one `NEXT` per loop; `data/basic-examples.json` pins it with a running case. |

### A25 — `6502-BIOS/README.md`: seven keyword syntax lines copied from the wrong entry

| | |
|---|---|
| **Claim** | `data/basic-keywords.json` gave: `COS` → `SIN(x)`, `TAN` → `SIN(x)`, `RIGHT$` → `LEFT$(s$,n)`, `MAX` → `MIN(a,b)`, `BSAVE` → `BLOAD <addr>,"name"`, `SAVE` → `LOAD "name"`, and `INPUT` → `INPUT ["prompt"{;` (truncated). Phase 4 read this as seven syntax lines copied from the neighbouring entry and not edited, and recorded it as a bug in the BIOS README. |
| **Truth** | **The README was never wrong. This repo's extractor was.** The README groups related keywords on one row — ``​`SIN(x)` / `COS(x)` / `TAN(x)`​`` in one cell, ``​`LOAD "name"` / `SAVE "name"`​`` in another — and `readmeBasicForms` took `firstSpan()` of the syntax cell and gave it to *every* keyword the row named. Six of the seven are that. The seventh, `INPUT`, is the same function truncating at an escaped pipe: the README writes the literal `|` in `INPUT ["prompt"{;`&#124;`,}] var [, var ...]` as `&#124;`, which splits one logical span into two, and the first of them ends at the semicolon. |
| **Source** | GREP. `6502-BIOS/README.md` has not been touched since 2026-07-31, before Phase 4 ran, so the text Phase 4 read is the text there now — and it gives `SIN(x) / COS(x) / TAN(x)`, `MIN(a,b) / MAX(a,b)`, `BLOAD <addr>,"name" / BSAVE <addr>,<len>,"name"` and the full `INPUT` line, all correct. |
| **Check** | GREP + RUN |
| **Consequence** | The ledger accused the wrong repo, and would have had Phase 9 "fix" a README that was right. It is also the one class of error the fact base is supposed to prevent: a generated file was wrong, the hand-authored `data/basic-examples.json` was right, and the disagreement was read as the *source* being wrong rather than the *extraction*. |
| **Fix** | `fixed` in this repo. `scripts/lib/markdown.mjs` gains `spans()` and `cellText()`; `readmeBasicForms` pairs spans to names positionally when the counts line up and falls back to the whole decoded cell when they do not, which also reassembles `INPUT`. All seven now extract correctly. `data/basic-examples.json` remains the hand-authored, machine-checked source [the reference](docs/basic/reference.md) prints. |

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
| **Truth** | Upstream cc65 behavior, not a bug in this ecosystem — but a reader following the templates has no reason to expect it, and the symptom is a debugger that claims every symbol is missing. |
| **Check** | RUN |
| **Status** | `wontfix` — upstream cc65 behavior, documented rather than worked around. |
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
| **Status** | `fixed` — `6502-EMULATOR` 19e3a95. The breakpoint still fires, which is deliberate; what it no longer does is fire *silently*. The evaluation error is carried on `BreakpointHit` and `StopReason`, so the stop now reads `breakpoint #1 at $A000 (condition could not be evaluated: unknown name "NOSUCHSYMBOL")` and the debug protocol reports it too. Verified against this entry's exact reproduction. |
| **Consequence** | Closed in Phase 11. The warning in `docs/crossdev/debugging.md` stays — the breakpoint still fires on the first hit, which is deliberate — but it now shows the stop line that says why, rather than telling the reader they will get no explanation. 2.5.1 was the release a reader could actually get when this was written; 2.6.0 is the first one carrying the fix. |

### A32 — `6502 dbg mem fill` refuses `0` and every hex form

| | |
|---|---|
| **Observation** | `mem fill $0400 16 0` → `value: expected a positive number, got "0"`. Same for `0x00` and `$EA`. `mem fill $0400 8 255` works. The sibling command `mem write` accepts a hex byte string (`DEADBEEF`) happily. |
| **Truth** | The argument is validated as a *positive* number and parsed as decimal only, which rules out the most common fill value of all — zero — and every notation the rest of the CLI accepts for a byte. |
| **Source** | Emulator 2.5.1 |
| **Check** | RUN |
| **Status** | `fixed` — `6502-EMULATOR` 19e3a95 adds a `parseByte` that takes `$EA`, `0xEA` and decimal across `$00-$FF`, zero included, and `mem fill` uses it. Verified: `mem fill $0400 16 0`, `$EA` and `0x00` all work, and `256` and `ZZ` are refused with the range in the message. |
| **Consequence** | Closed in Phase 11. The workaround is gone from `docs/crossdev/debugging.md`: `mem fill` now takes `0`, `$EA` and `0x00`, and the chapter says so and shows one. Verified again on 2.6.0, which is the release this site is written against and the first one a reader can get the fix in. |

### A33 — `6502-PRG/Makefile`: `clean` fails on a clean tree and misses one artefact

| | |
|---|---|
| **Observation** | `make cf` copies the program to its 8.3 name (`PROGRAM.PRG`) before adding it to the image, and `clean` does not remove that copy. Separately, `clean` uses `rm` without `-f`, so running it twice stops with an error the second time. |
| **Truth** | Both are small template warts rather than wrong documentation. |
| **Status** | `fixed` — `6502-PRG` 25869c5. `clean` is one `rm -f` line covering the 8.3 copy as well, and `.PHONY` lists every target rather than two. `6502-CRT` 672e813 got the same treatment. |
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
| **Status** | `fixed` — `6502-CRT` 672e813. Cart.crt rebuilds byte-identically, the comment being the only change. |
| **Consequence** | Harmless in practice: the code calls the symbol, not the number. But a reader copying the comment into their own cartridge would call the CompactFlash wait routine at power-on and wonder why the machine hangs on a machine with no card. `docs/assembly/cartridges.md` never prints a jump-table address. |

### A36 — A chained IRQ handler must not push anything

| | |
|---|---|
| **Observation** | The Kernal's IRQ handler decides whether it was entered by `BRK` or by hardware by reading the saved processor status off the stack at a **fixed depth** (`tsx` then `lda $104,x`, past the A/Y/X it has just pushed). A handler installed in front of it via `IRQ_PTR` that pushes anything before its `jmp (Chain)` shifts that read onto the wrong byte. |
| **Truth** | Chaining works only if the new front of the chain leaves the stack exactly as the processor left it — so it either uses instructions that touch no register (`inc`, `dec`, `stz` on absolute addresses) or restores everything it used before handing over. Nothing in the BIOS README says so. |
| **Source** | `Kernal.asm` IRQ handler; confirmed by a chained counting handler that reports six interrupts for six typed characters |
| **Check** | RUN |
| **Status** | `fixed` — `6502-BIOS` bbca238 adds a *Chaining an IRQ Handler* section next to the cartridge vectors, quoting the `tsx` / `lda $104,x` that makes the constraint real and giving both ways out: touch no register, or replace the vector and end in `rti`. |
| **Consequence** | `docs/assembly/interrupts.md` states it as a warning and the chapter's program is one `inc` long on purpose. The alternative — replacing the vector outright and ending in `rti` — is documented alongside it. |

### A37 — "The screen drops codes above 126" is a property of `Chrout`, not of the screen

| | |
|---|---|
| **Claim** | This project's own *Write from the seat* table said that, at the ACE, "the screen drops every code above 126 and all but four control codes". |
| **Truth** | The filtering is in `Chrout`'s video path, which discards `$7F` and above and every control code except CR, LF, backspace and bell. The screen itself displays all 256 characters perfectly well — `VideoChroutRaw` puts any code on it, which is how a program draws with the box-drawing set. |
| **Source** | `Kernal.asm` video Chrout implementation; confirmed by a program that draws a double-line box and centered title on a video machine |
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
| **Consequence** | Inherited Commodore muscle memory. Mild, but it teaches a keystroke that fails, and `?` is what the machine puts in *front of* an error — so a reader who tries it sees `?SYNTAX ERROR` and may not realize the first character is the machine's, not theirs. |
| **Fix** | The cards say `PRINT`. |

### A42 — `6502-ACE/README.md`: nine connector designators are shifted

| | |
|---|---|
| **Claim** | The ACE README's connector table gives `J14 = AUDIO R`, `J15 = AUDIO`, `J16 = 5V DC`, `J17 = CART`, `J18 = BUS`, `J19 = VCC`, `J20 = POWER LED`, `J21 = STORAGE`, `J22 = KEYBOARD`. |
| **Truth** | Both the Rev 1.0 and Rev 1.1 schematics give `J14 = KEYBOARD`, `J15 = AUDIO R`, `J16 = AUDIO`, `J17 = 5V DC`, `J18 = CART`, `J19 = BUS`, `J20 = VCC`, `J21 = POWER LED`, `J22 = STORAGE`. `J1`–`J13` agree. |
| **Source** | SCHEM: `Hardware/ACE Board/Rev 1.0/ACE Board.kicad_sch` and `Rev 1.1/*.kicad_sch`, Reference/Value pairs on every connector symbol. |
| **Check** | SCHEM |
| **Consequence** | The same class of error as A20, which found the switch designators shifted — and it means A11's citation of "`J16` `5V DC`" from the README named the wrong part. The barrel jack is **`J17`**. Anyone cross-referencing the README against the board from `J14` up is sent one connector out. |
| **Fix** | `fixed` — `6502-ACE` 2b8d717 renumbers all nine. [Connectors](docs/reference/connectors.md) and `docs/public/cards/connectors.html` were already built from the schematic, so nothing on the site changes. |

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

### A44 — The ACE's photograph shows a `BIOS V1.0` label on a v1.5 machine

| | |
|---|---|
| **Claim** | `6502-ACE/Images/6502-ACE.png` — imported here as `photos/ace.jpg` and `photos/ace-board.jpg`, and used as the site's first and most prominent image — is a photograph of a complete ACE. |
| **Truth** | It is, and the board is right in every respect the chapters point at. But the EPROM in the ZIF socket carries a hand-written label reading `BIOS V1.0`, legible at the size the Welcome page shows it, on a site whose every other statement is about **v1.5**. |
| **Source** | The photograph itself, at full size; `BIOS.inc` for the version the site documents. |
| **Check** | INSPECT |
| **Consequence** | Small but real, and the same class as A9: a reader who looks closely gets a version number the rest of the site contradicts. It is a sticker on a socketed chip rather than anything about the design, so no claim in the guide depends on it. |
| **Fix** | No caption on any page reads a version off the photograph, and none refers to the ROM label. Resolving it properly means re-shooting the board with a v1.5 chip in the socket — a Phase 9 item for `6502-ACE`, because the photograph lives in that repo and fixing it there fixes it everywhere. |

### A45 — `docs/basic/sound-and-video.md`: "colors don't apply retrospectively"

| | |
|---|---|
| **Claim** | "Colors don't apply retrospectively — text already on the screen keeps the colors it was printed in." |
| **Truth** | The opposite. The TMS9918's text mode has **one** foreground/background pair for the entire screen (`VideoSetColor` writes a single register), not one per character. Changing `COLOR` repaints everything already on the screen instantly — the `OK` prompt and every earlier line included — not just what gets printed next. |
| **Source** | `Kernal.asm` `VideoSetColorImpl` (GREP); confirmed by RUN: `COLOR 1,15` then `PRINT "AAAAAAAA"`, then `COLOR 15,4` with no `CLS` — the existing `AAAAAAAA` and every prior line turn white-on-blue along with the new text. `docs/assembly/video.md` already had this right ("In text mode there is one pair for the whole screen"), which is what exposed the contradiction. |
| **Check** | GREP + RUN |
| **Consequence** | A reader who trusted this would print status text in one color expecting it to stay put, then watch every line on the screen change color together the next time `COLOR` runs — the opposite of what the chapter promised. |
| **Fix** | Phase 8's color-chart pass rewrote the paragraph: one pair for the whole screen, described as "a pair of colored lights the whole screen sits under" rather than paint. `docs/using/sound-and-video.md`'s shorter `COLOR` bullet had the same gap (it didn't say retrospective either way) and was tightened at the same time. |

### A46 — The F18A forum documentation describes registers that never shipped

| | |
|---|---|
| **Claim** | `F18A documentation.pdf` (Matthew Hagerty's collected forum posts) documents four scroll-limit registers at VR50–VR53, a "fixed map" bitmap of per-tile scroll exemptions based at VR10, page-size bits in VR30 alongside a horizontal banner size, and page-start bits in VR29. Its VR49 bit map names bit 7 `FIXED_EN`. |
| **Truth** | None of that is the shipped register map. In the v1.8 and v1.9 register sheets — the same author, later — VR10 is tile layer 2's name table base, VR11 is its color table base, VR29 carries both layers' page sizes plus the pattern-plane spacing, VR30 is the per-line sprite maximum and nothing else, VR50 is general control and GPU triggers, VR51 is the per-frame sprite maximum, and VR49 bit 7 is `TILE2_EN`. The scroll-limit registers and the fixed map do not exist in either sheet. |
| **Source** | `F18A Registers.xlsx`, sheets `V1.9` and `V1.8`, cross-checked against the Pico9918's F18A Programmer's Reference, which agrees with the sheets on every one of these. |
| **Check** | Read all three sources against each other. Nothing here can be run: F18A mode is hardware-only and the emulator masks register writes to 0–7 (`6502-EMULATOR/src/core/IO/Video.ts:279`). |
| **Consequence** | Severe for anyone writing F18A code from the forum posts, which are the most discoverable F18A document on the web and read as a specification. Following them puts a scroll window into general control and the GPU trigger bits, which is not a subtle failure. |
| **Fix** | `data/f18a.json` is built from the v1.9 sheet, and every register the posts disagree about carries a `conflict` field that the reference page prints under the register as *"The sources disagree."* The posts are still the best explanation of *why* the parts work as they do — the unlock rationale, the bitplane scheme, the paging model, `PIX` — and that material is what the chapters draw on. |

### A47 — The Pico9918 reference tabulates the enhanced color modes one step too high

| | |
|---|---|
| **Claim** | The Pico9918's F18A Programmer's Reference gives the ECM levels as 2, 4, 8 and 16 colors from 1, 2, 3 and 4 bitplanes. |
| **Truth** | 2, 4 and 8 colors from 1, 2 and 3 planes. Every other source says so and they are mutually consistent: the F18A HDL's index expression takes one, two and three pattern bits for ECM1–3; both register sheets label VR49's fields "1-bit / 2-bit / 3-bit color mode"; the pattern table grows 2 KB → 4 KB → 6 KB, which is one, two and three planes; and Hagerty's sprite discussion states the visible counts as 1, 3 and 7 "vs 2, 4, or 8" precisely because sprite index 0 is always transparent. A fourth plane has nowhere to come from — ECM is a two-bit field whose top value is 3. |
| **Source** | `F18A documentation.pdf` (HDL excerpt, ECM sections, sprite section); `F18A Registers.xlsx` VR49 notes on both sheets. |
| **Check** | Read the sources against each other; arithmetic on the pattern-table sizes. |
| **Consequence** | A reader sizing a pattern table from the higher figures allocates 8 KB where 6 KB is needed, and expects sixteen colors in a tile that can hold eight. |
| **Fix** | `data/f18a.json` carries the lower set, and `colorModeConflict` records why. The chapter prints the lower set without qualification — this is the one conflict resolved rather than left open, because the evidence is one-sided. |

### A48 — Two F18A claims that cannot be settled from here

| | |
|---|---|
| **Claim** | Two conflicts between the F18A sheets and the Pico9918 reference where the evidence is genuinely balanced. **(a)** Palette byte order: Hagerty's worked example sends the red byte first, the Pico9918 reference documents the green-and-blue byte first. **(b)** Sprite attribute bit 4: the v1.9 sheet calls it a per-sprite 16×16 size override, the Pico9918 reference calls it an opaque-sprite flag in 16×16 mode. |
| **Truth** | Unknown. Both are observable in about a second on real hardware and not at all without it. |
| **Status** | `open` — and open in a way that only an ACE with the enhanced firmware can close. |
| **Check** | None available. F18A mode does not exist in the emulator. |
| **Consequence** | (a) is self-announcing: get it backwards and the colors are visibly wrong on the first entry you write. (b) is quieter — code that relies on either reading may work on one card and not the other. |
| **Fix** | Both are printed on the page as open questions rather than resolved: `docs/f18a/color.md` tells the reader to write four entries and swap the order if the colors come out wrong, and `docs/f18a/sprites.md` says to assume nothing about bit 4 in code meant to run on both cards. Also carried in `data/f18a.json` as `palette.writeOrderConflict` and `attributes.spriteUnlocked.conflict`. Close them by testing on hardware. |

### A49 — The bitmap layer's priority bit is described two ways by its own author

| | |
|---|---|
| **Claim** | VR31 bit 6. The v1.8 register sheet calls it priority over **sprites**; the v1.9 sheet calls it priority over **tiles**. |
| **Truth** | Over tiles. The Pico9918 reference's layer-priority rules settle it independently: a bitmap-layer pixel clears the priority flag it inherited, so a sprite wins over the bitmap layer even where the bit is set and the tile beneath had priority. The bitmap layer is never drawn above a sprite, which makes "priority over sprites" impossible to be a description of anything. |
| **Source** | `F18A Registers.xlsx` sheets `V1.8` and `V1.9`; the Pico9918 F18A Programmer's Reference, "Layer Priorities". |
| **Check** | Read the sources against each other. |
| **Consequence** | Anyone reading the v1.8 sheet plans a HUD drawn in the bitmap layer over their sprites, and cannot make it work. |
| **Fix** | `data/f18a.json` records the v1.9 reading with the conflict noted, and `docs/f18a/bitmap.md` states the rule in the negative — *the bitmap layer is never drawn over a sprite* — because that is the form a reader needs. |

### A50 — `6502-BIOS/README.md`: the GOSUB and FOR stacks put in the wrong page

| | |
|---|---|
| **Claim** | The README's RAM map gave `$0400–$05FF` as "BASIC line-input buffer, GOSUB stack, FOR stack". |
| **Truth** | Neither stack is there. `$0400` is `BAS_LINBUF` (the raw input line) and `$0500` is `BAS_TOKBUF` (tokenizing scratch); `GOSUB` and `FOR` frames are pushed onto the **CPU stack in page 1**. |
| **Source** | GREP. `BASIC.asm:204` says it in as many words — "GOSUB / FOR stacks live elsewhere; `$0500-$05FF` doubles as the tokenization scratch buffer" — and `BASIC.asm:209-210` defines both buffers. `BasCmdGosub` and `BasCmdFor` both `pha` their frames. |
| **Check** | GREP |
| **Consequence** | It is the reason A23's "up to 8 nested loops" looked plausible: a 512-byte region would explain a small fixed limit, where the truth is a 256-byte page shared with everything else the interpreter is doing. Anyone reasoning about how deep they can nest from this map reasons from the wrong number and the wrong place. |
| **Fix** | `fixed` — `6502-BIOS` bbca238 splits the row in two, names each buffer, notes that the CPU stack row is where the frames actually live, and adds a caution under the table that none of `$0400–$07FF` is free memory. |

### A51 — `6502-DEV/README.md`: the Output Board's J1 named SPEAKER

| | |
|---|---|
| **Claim** | The DEV Output Board BOM gave `J1` as `SPEAKER`. |
| **Truth** | The schematic's Value for that connector is `AUDIO`. |
| **Source** | SCHEM: `Hardware/DEV Output Board/Rev 1.0/DEV Output Board.kicad_sch`. |
| **Check** | SCHEM |
| **Consequence** | Trivial on its own. It is recorded because of how it was found: every designator in all five KiCad repos was compared against the schematic of the same name, revision by revision, after A20 and A42 showed the ACE's had drifted. This was the only other disagreement in the family — the COB's 33 board sections, the VCS's five boards and the KIM's three all agree with their schematics. |
| **Fix** | `fixed` — `6502-DEV` f5e5649. |

### A52 — The frame reports a normal startup as a permanent error

| | |
|---|---|
| **Observation** | Any frame carrying `prg`/`prg64` shows a red banner over the picture reading *Loaded — waiting for BASIC to boot to finish setting up the program*, and it never goes away. Reproduced in Chrome against the 2.6.0 web build at t=2 s, 5 s and 9 s, long after BASIC is up and the program has run. |
| **Truth** | Loading a program before the machine has booted is the supported way to do it and the way every embed on this site does it: the store writes the image, sets `loadWarning` as a *status*, and clears it when the end-of-program pointers are fixed up a moment later. `EmbedApp.vue` snapshotted that status once at mount and pushed it into `problems`, a permanent list rendered in red. The condition it describes resolves in about a second; the banner did not. |
| **Source** | Emulator 2.6.0, `dist/web/embed.html` |
| **Check** | RUN |
| **Status** | `fixed` — `6502-EMULATOR` d3632c1, released as **2.6.1**, which this site has been pinned at or past ever since. The warning is read *after* BASIC is ready rather than before, so only a load that genuinely failed reaches the banner; under `autostart=0` it waits for the machine to be started at all, since a program that has had no chance to load has not failed to load. The banner is also restyled from red to a neutral note, because nothing that reaches it is fatal — a malformed parameter has already fallen back to its default, and a file that would not load leaves a working BASIC prompt behind it. Verified by building both ways and driving the frame in Chrome: the banner is present at 2 s, 5 s and 9 s before the change and absent after. |
| **Consequence** | It was on every embed on this site that carries a program — twenty of them — announcing a fault, in red, on a machine that was working. Nothing in the docs described it, so there is no prose to correct; what needed correcting was the frame. |

### A53 — `autotype` cannot answer the boot menu, because it waits for BASIC

| | |
|---|---|
| **Observation** | An ACE gives five seconds at `ENTER=BASIC  ESC=MONITOR` before defaulting to BASIC, and a frame sits through all five. `autotype` cannot shorten it: it waits for `isBasicReady` before typing, so a leading `\r` arrives after the countdown it was meant to answer. |
| **Truth** | Not a bug — `autotype` waits on purpose, so that `autotype=RUN\r` cannot fire into a machine that is not listening. But it means the URL parameters alone cannot skip the boot menu, and a keystroke injected at reset *is* taken: with the machine paused at reset, `dbg send '\r'` then `run` reaches the `OK` prompt in under 900k cycles against about 5.4M for the countdown. It survives `KernalInit`. |
| **Source** | Emulator 2.6.0, `EmbedApp.vue` `autotype()`; reproduced on the CLI with `--pause` |
| **Check** | RUN |
| **Status** | `wontfix` upstream for now — worked around here. |
| **Consequence** | `<Emulator>` sends one `6502:type` with a carriage return when the frame announces `6502:ready`, which is the site's only use of the message API and the reason it passes `origins`. It is the difference between a reader clicking a button and waiting five seconds and a reader clicking a button and seeing a program. The one chapter that is *about* those five seconds asks for them back with `countdown`. |


### A54 — A relative `prg=` is relative to the emulator, not to your page

| | |
|---|---|
| **Claim** | `EMBEDDING.md`'s opening example is `embed.html?prg=game.prg`, and PLAN.md's Phase 11 says of itch.io that "a `.prg` uploaded beside the page loads fine". Both read as though a relative path resolves against the page doing the framing. |
| **Truth** | It resolves against the **frame's** document, because the frame is what calls `fetch`. A host page at `http://host/host.html` framing `http://host/6502-EMULATOR/embed.html?prg=game.prg` asks for `/6502-EMULATOR/game.prg`, not `/game.prg`. Reproduced in Chrome with the file present beside the host page and absent beside the frame: `prg: game.prg: HTTP 404 File not found`, over a working BASIC prompt. |
| **Source** | Emulator 2.6.0, `src/renderer/src/embed/media.ts` — `fetch(source.url)` with no base. |
| **Check** | RUN |
| **Status** | `confirmed` — inherent rather than fixable. The frame cannot read the parent's URL cross-origin, so it has no way to resolve against the host page even in principle. It is a documentation defect, in this repo's plan and in `EMBEDDING.md`'s example — the latter corrected in `6502-EMULATOR` d3632c1 (2.6.1). |
| **Consequence** | It is the difference between the starter folder working as uploaded and not working at all, and it fails *quietly* — a visitor gets a BASIC prompt rather than a blank frame, so a page can look almost right. `samples/embed/itch/index.html` resolves the address at load time with `new URL('game.prg', location.href)`, which is also the only way to do it on itch, where the address is not known until after the upload. `docs/using/emulator.md` gives the trap its own warning block and shows an absolute URL in the one-frame example. PLAN.md's Phase 11 note is corrected in its *What shipped* section rather than in the plan text, which is a record of what was believed at the time. |

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
