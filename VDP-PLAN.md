# VDP plan: 6502-DOCS

> Part 1 only: document BIOS 1.6 on `main`, then freeze the legacy docs as `v1`. The
> outline and the cross-repo order are in [VDP-ASSESSMENT.md](VDP-ASSESSMENT.md); this file
> does not repeat the decisions made there. Written 2026-09-16 against 6502-DOCS `56dbe98`,
> 6502-BIOS `56a9944` (latest tag `v1.5`, 1.6 not yet written) and 6502-EMULATOR `v2.6.9`.
> Line numbers drift; file and heading names are the durable references. Anything not
> checked against a file is marked **unverified**.
>
> **Status, 2026-09-16:** 6502-BIOS `v1.6` is released (tag at `71e1e66`, GitHub release
> published) and `v1.x` is cut from it, so P1 holds. The extractor was run against the
> tagged source in a scratch copy of this repo. §3, A1 and §7 now record what it produced
> instead of predictions, and two things it turned up are added to A1 and A2. P2–P4 wait on
> the emulator's 2.7.0 release.

---

## 1. Goal and definition of done

**Goal.** The site on `main` describes BIOS 1.6 (save slots included) and is pinned to
emulator 2.7.0. A frozen copy of that site is published at `/6502-DOCS/v1/`, framing the
emulator's frozen 2.7.0 build, for every machine that stays on the TMS9918A.

**Done when:**

- `main` passes `npm run verify`, `npm run check:voice`, `npm run cards:verify`,
  `npm run diagrams:verify`, `npm run embeds:verify` and `npm run links` on emulator 2.7.0.
  CI (`verify.yml`) is green with `EMULATOR_REF: v2.7.0`.
- `npm run facts:check -- --bios <6502-BIOS at v1.6>` reports current.
- `npm run screens:verify` is clean after the re-capture.
- `/6502-DOCS/` shows the footer "Written for BIOS v1.6", and the save-slot sections in
  `assembly/clock` and `basic/clock` have passing samples.
- `/6502-DOCS/v1/` is live from the same Pages deployment, has the legacy banner on every
  page, frames `/6502-EMULATOR/v2/embed.html`, and passes its own `verify.yml` on 2.7.0.
- A push to `v1` redeploys the whole site from `main`'s workflow.

---

## 2. Preconditions

| # | Precondition | Blocks | How to confirm |
|---|---|---|---|
| P1 | ~~6502-BIOS tag `v1.6` exists (cross-repo step 1)~~ **Done:** `v1.6` at `71e1e66`, `v1.x` cut | All of A | `git -C ~/Developer/Assembly/6502-BIOS tag -l v1.6` |
| P2 | 6502-EMULATOR `v2.7.0` tagged, with BIOS 1.6 bundled (step 2) | A2–A10 (pins, samples, screenshots, CI) | `6502 --version` prints `2.7.0`; `6502 dbg mem A09F 3` on it shows a JMP that is not the reserved stub's target |
| P3 | Emulator 2.7.0's web build deployed at `/6502-EMULATOR/` | Merging A | The unpinned frame on `main` must already boot a v1.6 splash, or new save-slot machines call `RTS` stubs |
| P4 | Emulator's frozen build live at `/6502-EMULATOR/v2/` | B4 onward (and so publishing `v1`) | `curl -sI https://acwright.github.io/6502-EMULATOR/v2/embed.html` is 200; `check-links.mjs:496` adds the frame URL to the network check, so `npm run links` on `v1` fails until then |

The legacy include copies (cross-repo step 4) do not block this repo: `samples/lib/6502.inc`
is generated here (A1).

---

## 3. What BIOS 1.6 moves here

Traced through `scripts/extract-facts.mjs`, which writes eight JSON files and the include.
**Every generated file changes**, because each carries `$meta.biosVersion` and source
hashes (`meta()`, `extract-facts.mjs:1270-1280`), even where its content does not.

| Output | What changes | Notes |
|---|---|---|
| `data/boot.json` | `version` → `v1.6`; the `@SplashTitle` text → `-- 6502 BIOS v1.6 --` | Title is interpolated from the equates (`extractBoot`). `source` strings `BIOS.inc:134-135` (`:1095`) and `Kernal.asm:738-765` (`:1116`) are hard-coded and will be stale once the files shift. Provenance only, no gate |
| `data/kernal.json` | `publishedSlots` 53 → 59; six new slot records; `reserved` 32 → 26 | **Confirmed against `v1.6`:** `publishedSlots: 59`, `reserved` `{count: 26, start: "$A0B1", end: "$A0FE"}`, `totalSlots: 85`. 1.6 gave the six a `; --- NVRAM save slots (DS1511Y) ---` heading, so their extracted group is "NVRAM save slots (DS1511Y)". It updated the `; Reserved entries ($A0B1-$A0FE)` comment that `readReservedRange` (`:195-209`) reads. Two quirks of 1.6's doc blocks: see A1 |
| `data/memory-map.json` | `NV_ID` ($0390) under "Kernal variables" | **Confirmed against `v1.6`:** 1.6 put `NV_ID` above the `; RAM Card \| IO 1` banner, so `parseIncSymbols` (`:327-338`) extracts it. `NV_PTR := STR_PTR` is dropped silently, because the regex needs a numeric value (the existing `PE_PTR := CF_BUF_PTR` is dropped the same way). The `NV_*` `=` constants never reach any output |
| `data/hardware.json` | Meta, and every `source` line reference (`BIOS.inc` grew 18 lines) | **Confirmed against `v1.6`:** no other content changes. `RTC_CTRL_B_BME` (`%00100000`) is outside slot 3's window, like `RTC_CTRL_B_TE` |
| `data/basic-keywords.json` | Meta only (README hash) | **Confirmed against `v1.6`:** still 85 keywords. The README's new `#### SAVEMGR.BAS` subsection under `### BASIC` is a code block, which `readmeBasicForms` ignores |
| `data/monitor-commands.json`, `errors.json`, `charset.json` | Meta only | **Confirmed against `v1.6`** |
| `samples/lib/6502.inc` | Header `BIOS : v1.6`; six `Nv*` equates; `NV_ID`; `BIOS_VERSION_MINOR = 6`; reserved-slot comment | **Confirmed against `v1.6`** (369 lines). **No `NV_*` constants and no `NV_PTR`**, as predicted. A2 adds them |

Downstream of the fact base:

| Artifact | Change | Gate |
|---|---|---|
| `docs/public/cards/kernal-jump-table.html` | Six rows, the "26 slots" note, side label v1.6 | `build-cards.mjs:498-501` **throws** on an ungrouped slot, so the `GROUPS` list must gain the six names first |
| `basic-reference.html`, `monitor-reference.html`, `memory-map.html`, `character-map.html` | Side label v1.6 | `cards:verify` |
| `memory-map.html` note | Hard-coded `'BIOS v1.5, BASIC V2.0 and Monitor v1.1…'` at `build-cards.mjs:751`. `cards:verify` passes with it stale | none |
| `docs/.vitepress/diagrams/kernal-table.svg` | "59 slots" (`build-diagrams.mjs:806`) | `diagrams:verify` |
| `docs/assembly/kernal.md` | Its own `groups` list (`:11-20`) **silently omits** any slot it does not name | none |
| Site footer | Reads `boot.json` (`config.mts:320`) | automatic |
| `data/embeds.json` | Unchanged unless a new embed is added. Existing programs do not move | `embeds:verify` |

Places the version is typed by hand:

| Where | Text | Caught by `check:voice`? |
|---|---|---|
| `docs/index.md:18`, `docs/getting-started/first-boot.md:6`, `docs/crossdev/build-run-loop.md:74` | Splash transcript | Yes |
| `docs/getting-started/first-boot.md:29` (alt text), `:62` | "BIOS v1.5" | Yes |
| `docs/reference/glossary.md:24` | "describes BIOS v1.5" | Yes |
| `docs/public/cards/ace.html:114`, `:147` | Hand-written card | **No** (`markdownFiles` skips `public/`) |
| `scripts/build-cards.mjs:751` | Memory-map card note | No |
| `README.md:12`, `:109` ("All 53"), `:454` (sample output); `ACCURACY.md:25` | Repo notes | No |
| `data/systems.json` `$meta.biosVersion` | Hand-maintained, read by nothing | No |

How the version rules work (`scripts/check-voice.mjs:103-119`): the BIOS rule matches
`BIOS` followed within 40 characters by `v<d>.<d>` and compares it with `boot.json`. "BIOS
1.6" without the `v` is **not** checked. The emulator rule fails on any three-part number
in `docs/**/*.md` other than `data/emulator.json`'s `version`. **Neither reads a hard-coded
version, so `check-voice.mjs` needs no edit.** Moving `emulator.json` is the whole bump.

Pinned emulator version, every occurrence (`git grep 2\.6\.9`):
`data/emulator.json:18`, `.github/workflows/verify.yml:17`, `docs/crossdev/debugging.md:56`
(`headless 2.6.9 — … 21137480 cycles`), `docs/crossdev/tools.md:26`, `README.md:13`,
`ACCURACY.md:25`. `ACCURACY.md:896-899` (A67) names 2.6.9 historically and stays.
`package.json` `version` has tracked the pin (`1.6.8` → `1.6.9` in `b12f747`), so it moves
to `1.7.0` with `package-lock.json`.

Screenshots (`scripts/capture-screens.mjs:65-150`): only **`boot-splash.png`** shows the
version (`boot: 'splash'`, stopped at 2,650,000 cycles). The rest show BASIC, the Monitor
or Wozmon after the splash has cleared. `screens:verify` compares bytes, so it finds out.

---

## 4. A — Document BIOS 1.6 on `main`

Work on a branch (`bios-1.6`). Two commits, each green: the release move (A1–A7), then
the save slots (A8–A12).

### A1. Re-extract against `v1.6`

1. `git -C ~/Developer/Assembly/6502-BIOS worktree add /tmp/bios-v1.6 v1.6` (a worktree,
   so the BIOS checkout's own branch is left alone).
2. `npm run facts -- --bios /tmp/bios-v1.6`, then `git diff data/ samples/lib/`. Confirm:
   - `kernal.json`: `publishedSlots: 59`, `reserved.count: 26`, `reserved.start: "$A0B1"`,
     and six slots `NvStat` `$A09F` … `NvFormat` `$A0AE`, each with `output`, and `input`
     on the five that take arguments.
   - `memory-map.json` lists `NV_ID` at `$0390` under Kernal variables.
   - `boot.json` `version.string` is `v1.6` and `splashMatchesVersion` is `true`.

   **All of this already held in a scratch run against the tag (2026-09-16).** Two things
   to expect:
   - **`NvFormat` has no `input`, and that is correct.** It takes no arguments, like 28
     existing slots (`Chrin`, `PrintCRLF` and others). It is not a missing doc block.
   - **`NvRead`'s `output` has three entries where it means two.** Its doc block wraps a
     sentence across two `; Output:` continuation lines ("…or a slot that is not" / "valid
     (A = its status, Y = its owner ID) — the buffer is untouched"). The extractor makes
     each line an entry. No other slot wraps like this. Fix it in A2, not in 6502-BIOS,
     because `v1.6` is tagged.
3. If `reserved.start` is still `$A09F`, or `NV_ID` is missing, or one of the five
   slots that take arguments has no `input`, stop and raise it with 6502-BIOS (§7). Do not
   patch around it here.

### A2. Harden the extractor (same commit)

In `scripts/extract-facts.mjs`:

- `extractKernal`: throw if `reserved.start` ≠ `base + publishedSlots × 3`, the same kind of
  self-check the slot comments already get (`:141-146`).
- `renderInclude`: add a `NVRAM save slots` block under `USEFUL CONSTANTS` (`:1226`)
  emitting `NV_SLOTS`, `NV_SLOT_SIZE`, `NV_SLOT_DATA`, `NV_CK_SEED`, `NV_EMPTY`, `NV_VALID`
  and `NV_BAD` by name from `parseIncSymbols`, throwing if any is missing. Emit
  `NV_PTR := STR_PTR` as an alias line. Names must match `BIOS.inc` exactly, because the
  legacy include copies (cross-repo step 4) use them too.
- `RAM_REGIONS` "Kernal variables" purpose (`:223`): add "save-slot owner ID".
- The doc-block reader behind `input`/`output`: join a line that starts with a lowercase
  letter onto the entry before it, so `NvRead`'s wrapped sentence becomes one entry (A1).
  It is the only such line in `v1.6`, so check that nothing else in `kernal.json` changes.
- Leave the hard-coded `source` line ranges (`:1095`, `:1116`) alone, or re-read them
  from the source. Either way, not a gate.

Re-run `npm run facts` and `npm run facts:check -- --bios /tmp/bios-v1.6`.

### A3. Kernal grouping

- `scripts/build-cards.mjs:493` and `docs/assembly/kernal.md:18`: append `NvStat`,
  `NvRead`, `NvWrite`, `NvErase`, `NvFind`, `NvFormat` to "Clock and lasting memory". Same
  group, same chapter link, so the card's `half(0, 4)` / `half(4, 9)` split
  (`build-cards.mjs:544`) stays as it is.
- `docs/assembly/kernal.md`: after building `groups`, throw on any slot in
  `kernal.slots` that no group names, mirroring `build-cards.mjs:498-501`.
- `build-cards.mjs:751`: interpolate `version` instead of the literal `v1.5`.
- `npm run cards && npm run diagrams`. Print-preview `kernal-jump-table.html` at letter,
  100%: page 2 gains six rows, and `cards:check` does not detect overflow.

### A4. Pin emulator 2.7.0

Read first, as the README's bump procedure asks:
`git -C ~/Developer/NodeJS/6502-EMULATOR diff v2.6.9 v2.7.0 -- docs/EMBEDDING.md assets/roms/`.
If the contract moved, update `data/emulator.json` `parameters`/`frame` to match.

- `data/emulator.json:18` → `"2.7.0"`.
- `.github/workflows/verify.yml:17` → `EMULATOR_REF: v2.7.0`.
- `package.json` / `package-lock.json` → `1.7.0`.
- `npm run preflight` (installed CLI must report `2.7.0`).

### A5. Hand-typed versions and transcripts

- Splash transcripts and prose, every row of the §3 table: `docs/index.md`,
  `first-boot.md` (transcript, alt text, details block), `build-run-loop.md`,
  `glossary.md`, `docs/public/cards/ace.html` (both places).
- `docs/crossdev/tools.md:26`: re-run `6502 --version` and paste the result.
- `docs/crossdev/debugging.md:56`: re-run the transcript exactly as the chapter gives it
  and paste the whole line. The cycle count may move with 1.6's probe change.
- `README.md:12-13` ("BIOS v1.6 … emulator 2.7.0"), `:109` ("All 59"), `:454` (the
  example output: "reports v1.6"). `ACCURACY.md:25` baseline → "BIOS v1.6, emulator
  2.7.0".
- `data/systems.json` `$meta.biosVersion` → `"1.6"`.
- `npm run check:voice`.

### A6. Samples and checks on 2.7.0

- `samples/_checks/memory-map.bas:40` and `.expect:10`: the first reserved slot is now
  `$A0B1` (41137). The existing `PEEK(41119) <> 76` still passes, since `NvStat` is a JMP
  too, so it proves nothing. Point it at 41137, and add a line asserting that the JMP
  target at `$A09F` differs from the one at `$A0B1`, so the ROM under test really has the
  entries.
- `npm run verify`. Everything that passed on 2.6.9 should pass unchanged.
- `samples/crossdev/test.sh`: repeat the hand check in `samples/README.md` ("whenever the
  emulator's CLI moves").

### A7. Screenshots

- `npm run screens:verify`. Expect `boot-splash` to differ. Run `npm run screens --
  boot-splash`, open it, and confirm it still catches the countdown at 2,650,000 cycles
  with `v1.6` on it. Look at anything else that differs before accepting it.
- Commit A1–A7 as one: "Move the pin to emulator 2.7.0 and BIOS 1.6".

### A8. Assembly: a save-slots section

In `docs/assembly/clock.md`, a new `## Save slots` between "The 256 bytes" (`:51`) and
"The registers underneath" (`:81`):

- The format: slot *n* is NVRAM `$n0–$nF`; byte 0 is the owner ID (`$00` = free), byte 1
  the checksum, bytes 2–15 are 14 bytes of payload. Checksum: seed `$A6`, rotate left
  and exclusive-OR over the ID and the payload. States free/valid/damaged. A table
  generated from `facts.kernal` for the six entries, not typed.
- The conventions: carry set means nothing happened; on a failed `NvRead`, A holds the
  status and Y the owner ID; the destination is untouched on failure; `NvRead`/`NvWrite`
  clobber `STR_PTR`; `NV_ID` is an input for `NvWrite` only, and nothing writes it back;
  `X` is preserved by all but `NvFind` and `NvFormat`; D and I come back as the caller had
  them. The 6502-BIOS README's "NVRAM Save Slots" subsection is the source for all of it.
- Version check: on an older ROM these six are reserved slots, a bare `RTS` that leaves
  carry as the caller had it. So a cartridge checks `KernalVersion` (1, ≥ 6) first. Link
  `/assembly/detection#which-rom-am-i-on`.
- Rewrite the warning "A fresh card holds garbage, not zero" (`:69-75`): the slots are
  the answer to it. A damaged slot reads as damaged rather than as a save, and
  `NvFormat` clears them all.
- Listing: `samples/assembly/save-slots.asm` + `.expect`. It checks the version, calls
  `NvFind` with its owner ID and falls back to `NvFind` with `$00`, writes a 14-byte record
  (level, score, name) with `NvWrite`, then reads it back with `NvStat` and `NvRead` and
  prints it. It then damages one payload byte with `RtcWriteNVRAM` and shows `NvRead`
  refusing it. The harness boots with an all-zero NVRAM (`RTC.ts` `ramData = new
  Uint8Array(256)`; `verify-samples.mjs:257-273` passes no `--nvram`), so the output is
  fixed. Confirm with `6502 dbg mem 0 256 --space nvram`.
- `<Emulator sample="assembly/save-slots" …/>` beside it: add to `EMBEDS`
  (`build-embeds.mjs:49-80`), then `npm run embeds`. The frame has no `persist`, so a save
  lasts until the machine is closed. The caption says so in the reader's terms.

### A9. BASIC: a save-slots section

In `docs/basic/clock.md`, a new `## Save slots` after "What it's good for" (`:59`),
following the chapter's voice (no Kernal names, no hex beyond what `NVRAM` takes):

- The same layout in BASIC terms: slot `S` starts at `S * 16`, the first byte says who owns
  it, the second is a check number, and 14 bytes are yours. The layout is shared with
  cartridges, so a BASIC program that keeps to it can read a game's save and the reverse.
- Listing `samples/basic/savemgr.bas` + `.expect`, derived from the `SAVEMGR.BAS` that is
  published in the 6502-BIOS README at `v1.6` (its `#### SAVEMGR.BAS` subsection). As
  published, lines 10–100 list all 16 slots as `SLOT n : FREE`, `SLOT n : ID n` or
  `SLOT n : DAMAGED ID n`. Subroutines follow: 1000 is status (`T`, `I`), 1500 the
  checksum step, 2000 write, 3000 read, 4000 erase. The check-number routine is the
  subject:
  - There is no XOR keyword, so line 1520 uses `C = (C OR V) - (C AND V)`.
  - The rotate is line 1510, `C = C * 2 : IF C > 255 THEN C = C - 255`.

  The demo writes and erases nothing, so the sample's own main lines do, using those
  subroutines. The `.expect` asserts the listing before and after one save and one erase.
  Keep the subroutine lines identical to the README, so the BIOS suite's check (A10) covers
  them too.
- The existing three-line high-score program (`:69-73`) stays. Add a sentence pointing
  from raw bytes to slots when two programs share the card.
- `data/basic-examples.json`: no change (no new keyword).

### A10. Prove BASIC's checksum is the Kernal's

`samples/_checks/nv-slot-format.bas` + `.expect` (never shown). It writes slot 3 byte by
byte with the BASIC routine from A9, POKEs a stub (`LDX #3`, `JSR $A09F`, `STA`, `STY`,
`RTS`) above the program and its variables, `SYS`es it, and asserts A = 1 (`NV_VALID`)
and Y = the owner ID. Then it flips one payload byte and asserts A = 2. Without this, the
BASIC listing only agrees with itself.

6502-BIOS already holds its README listing to the ROM in both directions
(`tests/probe/savemgr-and-the-kernal-agree-on-the-slot-format.mjs`). This check is still
needed, because it covers the copy this repo publishes and runs it on the emulator the
docs pin.

### A11. Surrounding pages

- `docs/basic/index.md:61`: add save slots to the "Time and memory that lasts" row.
- `docs/reference/glossary.md`: add **save slot** after **NVRAM** (`:84`).
- `docs/assembly/detection.md:103-111`: optional. Make the example check minor `6` with
  "the save slots arrived in this release". Keep "BIOS" away from any version string, so
  Part 2's 2.x facts do not trip the voice rule on it.
- `README.md:307` ("Twenty-eight machines sit on twenty pages … Twenty-seven are ACEs"):
  update the counts if A8 added a machine.

### A12. Commit and merge

`npm run verify && npm run docs:build && npm run links`, then commit "Document the save
slots". Merge to `main` only once P3 holds, so that no machine on the live site boots a v1.5
ROM beside a page describing v1.6.

### Verification for A

| Check | Expect |
|---|---|
| `npm run facts:check -- --bios /tmp/bios-v1.6` | all `ok`, "fact base current against BIOS v1.6" |
| `npm run preflight` | `6502` ok at `2.7.0` |
| `npm run verify` | every case `ok`, including `assembly/save-slots`, `basic/savemgr`, `_checks/nv-slot-format`, `_checks/memory-map`, and `_harness/deliberate-failure` still inverted |
| `npm run check:voice` | `voice: ok` |
| `npm run screens:verify` | clean after A7 |
| `npm run docs:build && npm run links` | green |
| `git grep -n 'v1\.5\|2\.6\.9'` | only `cards/archive/`, `VDP-ASSESSMENT.md`, A67 and other historical `ACCURACY.md` entries, and comments in `scripts/` |
| CI `verify.yml` on the branch | green, building `v2.7.0` |
| Deployed `/6502-DOCS/` | footer v1.6; the `assembly/clock` machine runs the save-slot program; the `first-boot` machine shows v1.6 |

---

## 5. B — Freeze and publish `v1`

Starts after A merges and P4 holds. Nothing on `main` changes between A's merge and B1.

### B1. Cut the branch

`git branch v1 <A's merge commit> && git push origin v1`. Record the SHA in `main`'s
README (B7).

### B2. Base path, on `v1`

Every place `/6502-DOCS/` is hard-coded (`git grep 6502-DOCS`, excluding repo URLs):

| File | Change |
|---|---|
| `docs/.vitepress/config.mts:23` | `const BASE = '/6502-DOCS/v1/'`. `SITE`, `OG_CARD`, the `head` hrefs, canonical and `og:url` all derive from it |
| `docs/public/site.webmanifest:5-7, 13, 19, 25` | `id`, `start_url`, `scope`, three icon `src`s → `/6502-DOCS/v1/…`. A distinct `id` also keeps "Add to Dock" separate from the current docs |
| `scripts/check-links.mjs:28` | `const BASE = '/6502-DOCS/v1/'` (SITE follows) |
| `docs/public/cards/ace.html:157` | `acwright.github.io/6502-DOCS/v1` |
| `README.md:8` | Published URL, plus the frozen note (B6) |

Already base-safe, no change: the Markdown links and card links (VitePress prefixes
`base`, `config.mts:108-137`); `Figure.vue` (`withBase`); `themeConfig.logo`; card
stylesheets and fonts (relative); `style.css:10, 18` `url('/fonts/…')`, which Vite rewrites
at build (today's `dist` CSS has `url(/6502-DOCS/fonts/BebasNeue-Regular.woff2)`).
`.github/ISSUE_TEMPLATE/` is read from the default branch only, so leave it.

### B3. The emulator, on `v1`

- `data/emulator.json`: `web.frame` → `https://acwright.github.io/6502-EMULATOR/v2/embed.html`;
  `web.app` → `https://acwright.github.io/6502-EMULATOR/v2/`; `web.contract` →
  `https://github.com/acwright/6502-EMULATOR/blob/v2.7.0/docs/EMBEDDING.md`; `version` stays
  `2.7.0`. `Emulator.vue` reads the frame from here, so every machine follows.
- `docs/using/emulator.md:16` (app link) and `:209` (the reader's `<iframe>` example), and
  `samples/embed/itch/index.html:44`: → the `/v2/` URLs. A legacy reader's own page should
  frame the machine they have.
- `check-links.mjs` `contractFor` (`:448-449`) matches by `url.includes(web.frame)` and
  defaults to the ACE contract, so the `/v2/` URLs stay covered.
- `persist`: the note in `data/emulator.json:42`, `Emulator.vue:26` and `README.md:342`
  still holds, and holds more strongly. `/6502-EMULATOR/`, `/6502-EMULATOR/v2/` and both
  docs sites share the origin `acwright.github.io` and, today, one IndexedDB database
  (`6502-emulator`, per the emulator assessment §C). Keep the ban. Reword "the full web
  emulator" to "the web emulators" in `emulator.json` and `Emulator.vue`. No page text
  changes.
- `docs/using/emulator.md`, the desktop app and the releases link: see open question 2.
- Redo `samples/README.md`'s itch.io checks 2 and 3 (and 1, if the contract moved at
  2.7.0), because the starter page's URL changed.

### B4. The banner, on `v1`

- New `docs/.vitepress/theme/LegacyBanner.vue`: "TMS9918A and BIOS 1.6 — for COB, DEV,
  KIM, VCS, PicoCalc and unconverted ACEs", with a link to the current docs as an
  **absolute** `https://acwright.github.io/6502-DOCS/`. Do not use `withBase`, which would
  point back into `/v1/`. `check-links` treats the absolute URL as external and checks it
  over the network.
- `docs/.vitepress/theme/index.ts`: add
  `Layout: () => h(DefaultTheme.Layout, null, { 'layout-top': () => h(LegacyBanner) })` and
  set `--vp-layout-top-height` in `style.css` so the fixed nav clears it (**unverified**
  against VitePress 1.6.4: check in `docs:dev` on desktop and phone widths, light and
  dark).
- It prints (it is the edition notice). The banner is a `.vue` file, so `check:voice`
  does not read it. Keep "embed"/"iframe" out of it anyway.
- The footer (`config.mts:320`) already reads "Written for BIOS v1.6". Leave the title and
  the og tags as they are.

### B5. CI on `v1`: keep `verify.yml`, pin the rest

Recommend **running `verify.yml` on `v1`**. It already triggers on every branch
(`on: push`, `verify.yml:3-5`), is pinned to `v2.7.0`, and only runs when someone pushes
to the frozen branch, which is exactly when a check is wanted. What would break it over
time is the floating refs, so pin them at the cut:

- `BASTOK_REF` and `CFFS_REF` (`verify.yml:19-20`) → the commit SHAs of their `main` at
  the cut. bastok gains the 2.x token table in Part 2, and `embeds:verify` re-tokenizes
  every BASIC listing with it.
- `CC65_REF: master` (`:18`): `git clone --branch` (`:179`) does not accept a SHA. Replace it
  with `git init .cc65-src && git -C .cc65-src fetch --depth 1 https://github.com/cc65/cc65.git
  "$CC65_REF" && git -C .cc65-src checkout FETCH_HEAD`, and pin the SHA. The cache key
  already uses `CC65_REF`.
- The `links` step will eventually hit external link rot. Accept that. A red `v1` run
  says a link rotted, not that a machine changed.

### B6. Frozen-branch housekeeping, on `v1`

- `.github/workflows/deploy.yml`: **delete** it and add `redeploy.yml` (§6). If it stayed,
  a manual `workflow_dispatch` on `v1` would publish an artifact holding only `v1`, and
  that would replace the whole site.
- `README.md`: a note under the title saying this is the frozen legacy edition at `/v1/`,
  pinned to BIOS v1.6 and emulator 2.7.0, and not bumped. Under "Deploying": pushes here
  dispatch `main`'s workflow. Point "Maintenance → After a BIOS release" at `main`.
- Do not touch `VDP-ASSESSMENT.md` or this file on `v1`.

### B7. Deploy from `main`

Edit `main`'s `.github/workflows/deploy.yml` (§6), **after** B2–B6 are pushed. Otherwise
the first run would nest a `v1` built with the old base. In `main`'s `README.md`, under
"Deploying", say `v1` is built into `/v1/` from branch `v1` @ `<sha>`.

---

## 6. Deployment

### `main`: `.github/workflows/deploy.yml`

```yaml
name: Deploy docs to Pages

on:
  push:
    branches: [main]
  # Also how a push to `v1` redeploys: v1's redeploy.yml dispatches this workflow on main.
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Setup Node
        uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run docs:build

      # The frozen legacy edition, built by its own branch with its own base
      # (/6502-DOCS/v1/) and its own lockfile, and nested into this artifact.
      # Pages publishes one artifact for the whole site, so leaving v1 out would
      # take /v1/ down. A failed v1 build therefore fails the deploy.
      - name: Checkout v1
        uses: actions/checkout@v7
        with:
          ref: v1
          path: .v1

      - name: Install v1 dependencies
        working-directory: .v1
        run: npm ci

      - name: Build v1
        working-directory: .v1
        run: npm run docs:build

      - name: Nest v1 under /v1/
        run: |
          test ! -e docs/.vitepress/dist/v1
          cp -R .v1/docs/.vitepress/dist docs/.vitepress/dist/v1
          test -f docs/.vitepress/dist/v1/index.html
          grep -q '/6502-DOCS/v1/' docs/.vitepress/dist/v1/index.html

      - name: Setup Pages
        uses: actions/configure-pages@v6

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

### `v1`: `.github/workflows/redeploy.yml`

```yaml
name: Redeploy Pages from main

on:
  push:
    branches: [v1]

permissions:
  actions: write

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - name: Run main's deploy workflow
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh workflow run deploy.yml --repo "$GITHUB_REPOSITORY" --ref main
```

**Why `workflow_dispatch` from `v1`.**

- A push runs the workflow file **from the pushed commit**. So `branches: [main, v1]` in
  `main`'s `deploy.yml` does nothing for a push to `v1`: `v1`'s own copy is what runs.
- The build has to run on `main`'s ref, because only `main`'s workflow knows how to
  assemble both editions. The `github-pages` environment may also restrict deployments to
  the default branch (**unverified**: repo settings not readable from here; a run on `main`
  satisfies it either way).
- `workflow_dispatch` is already declared (`deploy.yml:6`), names the workflow and the
  ref, and is the same button used for a manual redeploy.
- `repository_dispatch` would need a new `types:` trigger and a payload, and gains
  nothing.
- GitHub makes an exception for `workflow_dispatch` and `repository_dispatch` raised with
  `GITHUB_TOKEN`: they do create runs, so no PAT is needed.
- `concurrency: pages` serializes a `main` push and a `v1` dispatch that race.

### Verification for B

| Check | Expect |
|---|---|
| On `v1`: `npm run check:voice && npm run cards:verify && npm run diagrams:verify && npm run embeds:verify && npm run verify` | green on 2.7.0 |
| On `v1`: `npm run docs:build && npm run links` | green, including the `/v2/` frame (needs P4) and the banner's absolute link |
| On `v1`: `grep -rn '/6502-DOCS/' docs/.vitepress/dist \| grep -v '/6502-DOCS/v1/'` | only the banner link and the `ace.html` text |
| Local artifact | Build `main` and `v1`, then `mkdir -p <scratch>/site && cp -R docs/.vitepress/dist <scratch>/site/6502-DOCS && cp -R .v1/docs/.vitepress/dist <scratch>/site/6502-DOCS/v1 && npx serve <scratch>/site`. Both `/6502-DOCS/` and `/6502-DOCS/v1/` render with fonts, logo and search. A card opens from `/v1/reference/`. |
| After B7 | Actions: one run on `main` with both builds; `curl -sI` 200 for `/6502-DOCS/`, `/6502-DOCS/v1/`, `/6502-DOCS/v1/site.webmanifest` |
| Machines on `v1` | `/6502-DOCS/v1/assembly/clock`: the frame loads from `/6502-EMULATOR/v2/embed.html` (devtools), boots `-- 6502 BIOS v1.6 --`, and the save-slot program runs |
| Redeploy path | Push a no-op commit to `v1` (e.g. a README wording fix); `redeploy.yml` succeeds, a `workflow_dispatch` run of `deploy.yml` on `main` follows, and `v1`'s change is live |
| `verify.yml` on `v1` | Runs on that push, green with pinned `BASTOK_REF`/`CFFS_REF`/`CC65_REF` |

---

## 7. Handoffs

| To | What |
|---|---|
| 6502-BIOS | **Delivered in `v1.6`, nothing outstanding.** The jump-table line format is kept, the six entries have a `; --- NVRAM save slots (DS1511Y) ---` heading, and the header reads `; Reserved entries ($A0B1-$A0FE)`. Each `Nv*Impl` has an `Input:`/`Output:`/`Modifies:` block, and `NV_ID := $0390` sits above the `; RAM Card \| IO 1` banner. `SAVEMGR.BAS` is in the README. The table stays at 85 slots (59 + 26), which the BIOS plan also says. The one wrapped doc line (A1) is handled here, in A2. Any later 1.x change comes from branch `v1.x`, not `main`. |
| 6502-EMULATOR | P2, P3, P4. `/6502-EMULATOR/v2/embed.html` and `/v2/` are a contract for `v1`: never move them. Storage namespacing (its assessment §C) is theirs. **Keep the TMS9918A as the default card on `main`'s deployed build until 6502-DOCS Part 2 lands**, or tell this repo first (§8 risk 1). Once A merges, `docs/handoff/6502-DOCS.md` §1 is superseded by this plan's §8 risk 1. |
| 6502-ASSEMBLY | After B7: rung 5 (legacy VDP) links `https://acwright.github.io/6502-DOCS/v1/…` (`assembly/video`, `assembly/graphics`, `f18a/`) rather than the unversioned site. |
| 6502-PICOCALC | Ships BIOS 1.6 (decided): it re-embeds the `v1.6` ROM and releases a new UF2. Its RTC already models burst mode (`CTRLB_BME` in `src/machine/rtc.c`) and keeps NVRAM in flash, so the save-slot sections apply to it unchanged. `docs/using/picocalc.md` names the release that carries 1.6. |

---

## 8. Risks

1. **`main`'s machines stay unpinned until Part 2.** `data/emulator.json:22` frames
   `/6502-EMULATOR/embed.html`, which is whatever the emulator's `main` last deployed.
   - **Part 1 leaves `main` unpinned on purpose.** From P3 until `v3-vdp` merges, that is
     2.7.0. After the merge, the emulator keeps the TMS9918A as its default card until the
     switchover, and nothing on `main` passes a card parameter. So every machine on `main`
     keeps booting BIOS 1.x on a TMS9918A. CI is unaffected because `EMULATOR_REF` is a
     tag.
   - **Residual risk:** the default flips, or 3.x's TMS9918A card or bundled BIOS changes,
     before Part 2. Then `graphics-2`/`multicolor` draw garbage, and the splash disagrees
     with `main`'s footer.
   - **Fallback:** a one-line commit on `main` setting `web.frame` to the `v1` URL
     (`/6502-EMULATOR/v2/embed.html`). `check-links` still resolves its contract
     (`:448-449`), so `main` is pinned to 2.7.0 until the rewrite. Do it pre-emptively if
     the emulator cannot promise the default.
2. **One artifact couples the editions.** A broken `v1` build (for example, `npm ci`
   against a registry outage) blocks deploying `main`. That is intended, since publishing
   without it deletes `/v1/`. The fix is on `v1`, or a re-run.
3. **Extractor silent drops.** `NV_PTR` (alias) is always dropped, and A2 emits it by hand.
   At `v1.6`, `NV_ID` is above the I/O banner and the reserved-range header is current, so
   those two drops don't happen. A wrapped doc line becomes a broken entry, as in `NvRead`
   (A1, A2). A1 and A2 catch these, but only if the diff is read.
4. **`kernal.md` omits ungrouped slots silently** until A3 adds the guard.
5. **Kernal card may spill onto a third page.** `cards:check` does not measure layout
   (A3 print preview).
6. **Floating CI refs on a frozen branch.** Handled in B5. `6502-ASSETS` (checked out by
   the `assets` job, `verify.yml:71`) is archived but still checks out.
7. **Link rot on `v1`** turns its CI red eventually (B5). This is expected and does not
   affect deploys.

---

## 9. Open questions

1. ~~Does 6502-PICOCALC ship BIOS 1.6?~~ **Decided: yes.** It re-embeds the `v1.6` ROM and
   releases a new UF2 in Part 1. Its RTC models burst mode and flash-backed NVRAM, so the
   banner and the save-slot sections are accurate for it. Wait for that release before
   cutting `v1`, so `docs/using/picocalc.md` can name it.
2. **What the `v1` emulator chapter tells a desktop user.** The browser app at `/v2/` is
   frozen. The desktop app will move to 3.x, whose card option name and default are
   6502-EMULATOR's open questions 1 and 2. Either link the `v2.7.0` release, or name the
   TMS9918A setting once it exists. Settle this before B3 is committed, and do not edit
   `v1` for it afterwards.
3. **Whether the BASIC save manager is also a machine on the page.** The recommendation is
   the assembly program only (A8). A manager for a card that empties when the frame closes
   is a weaker demonstration.

---

## 10. Part 2

To be appended: the VDP and BIOS 2.x rewrite of `main` (assessment parts C and D).
