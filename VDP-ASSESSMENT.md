# VDP assessment: 6502-DOCS

> An outline, not a plan. The detailed plan for this repository goes in `VDP-PLAN.md`,
> written in a session of its own. Surveyed 2026-09-16 across the whole workspace.
> Line numbers drift; file and heading names are the durable references.

## The change

The ACE moves from a Pico9918 running stock TMS9918A firmware to the **6502-PICOVDP**
(`6502-PICOVDP/SPEC.md`) on PICO9918 PRO v2.0 hardware, running **BIOS 2.x**. Everything
else stays where it is: COB, DEV, KIM, VCS, PicoCalc, and any ACE whose card cannot be
reflashed (RP2040 pico9918 v1.0–1.3). Those keep the stock firmware and **BIOS 1.x**,
whose last release is **1.6**.

- **Legacy** in these documents means TMS9918A + BIOS 1.x. **VDP** means PICOVDP + BIOS 2.x.
- **Compatibility runs one way.** The PICOVDP's legacy submode runs Text and Graphics I
  programs unchanged, so BIOS 1.x and existing cartridges run on it. Graphics II and
  Multicolor fall back to Graphics I and draw garbage. Register writes above 7 no longer
  alias, so F18A tricks break. Sprites per line are 16 by default, not 4. Nothing written
  for the VDP runs on a TMS9918A.

## Decisions already made

- **No new repositories.**
- **BIOS 1.6 is the last 1.x release.** It is 1.5 plus the NVRAM save slots in
  `6502-BIOS/PLAN.md`, and nothing else. It ships in emulator **2.7.0**, and the frozen
  legacy docs document it.
- **BIOS 2.0 is 1.6 plus:**
  - The PICOVDP work in `6502-EMULATOR`'s `docs/handoff/6502-BIOS.md` (branch `v3-vdp`):
    card detection, hardware scroll, port B for interrupt handlers, `WaitVBlank`.
  - A console in the PICOVDP's **Text mode** (`VMODE $1`, 40×24, 6×8 cells) with a
    **per-cell colour table**. It keeps the same font and every screen layout.
  - **No Monitor.** The machine **boots straight to BASIC**, with a new header and a colour
    logo drawn from the font's CP437 block characters. Wozmon stays at `$FF00`.
  - **The font lives in the PICOVDP firmware.** The card loads it into VRAM at reset and
    on command (a new register and a capability bit, SPEC draft 0.5). ROM `$B800` holds
    no font on 2.x.
  - **ROM layout:** BASIC takes the Monitor's 4.3 KB (`$C000–$FEFF`), and the Kernal takes
    all of `$A000–$BFFF`, including the space the font used. Nothing the Kernal needs goes
    above `$C000`, because cartridges overlay `$C000–$FFFF`. The Kernal holds the
    primitives cartridges need; BASIC-only work lives in BASIC.
  - **No TMS9918A support.** BIOS 2.x runs only with a PICOVDP, with no fallback paths.
  - **New BASIC commands with matching Kernal entries.**
    - Core: `SCREEN`, `VPOKE`/`VPEEK`, `VREG`, `PALETTE`, `VSYNC`, `VLOAD`.
    - Second tier, if room is found: `SPRITE`, `SCROLL`, `LAYER`, `VSTAT`.
    - Save-slot commands, if room is found.
    - `SYS addr[,a,x,y]`, and `BLOAD`/`BSAVE` over XModem when given no filename.
    - BASIC returns to the text console when a program stops.
  - **Tokens:** every 1.x token keeps its value, and new keywords are appended after `$D4`.
    The `BRK` statement is retired and its token `$B4` goes to a new keyword.
  - **A BRK instruction** prints `BREAK $nn AT $xxxx  A= X= Y= P= S=` and warm-starts
    BASIC. `BRK_PTR` stays hookable.
  - **`COLOR fg[,bg[,border]]`** sets the pen for later output, `CLS` fills the screen with
    it, and `border` is register 7's low nibble.
  - **Existing jump-table addresses do not move.** New entries are appended.
- **6502-EMULATOR** makes the video card an option (TMS9918A or PICOVDP): one app, one
  site. It also publishes a frozen **2.7.0** web build at `/6502-EMULATOR/v2/` for the
  legacy docs.
- **6502-DOCS** is versioned: legacy docs (BIOS 1.6) are frozen at `/6502-DOCS/v1/`, and
  the main site is rewritten for the VDP and BIOS 2.x.
- **6502-BIOS** gets a `v1.x` branch cut at `v1.6`; `main` becomes 2.x.
- **Assembly and C projects** get a VDP include chosen by a build option, not branches.
  The legacy `6502.inc` gets one last update, for 1.6.
- **EhBASIC and vc83basic** stay 1.x. **PicoCalc** stays legacy and ships BIOS 1.6. **The YouTube series**
  teaches the legacy VDP and mentions the new features.

## Order across the workspace

**Part 1: BIOS 1.6, the last legacy release**

1. **6502-BIOS:** build 1.6 on `main`, tag `v1.6`, and cut `v1.x` from it.
2. **6502-EMULATOR `main`:** bundle 1.6, release **2.7.0**, and publish its frozen web build
   at `/6502-EMULATOR/v2/`. Then merge `main` into `v3-vdp` and re-capture the goldens
   there; they exist only on that branch.
3. **6502-PICOVDP:** re-sync `tests/oracle/`, whose pinned `bios` goldens moved.
4. **The legacy include** gains the NVRAM entries in every copy: 6502-ASM, 6502-CRT,
   6502-PRG, 6502-BIN, 6502-EHBASIC, 6502-C (with `6502.h`) and WIZARDSLAB.
5. **6502-DOCS `main`** documents 1.6 and pins 2.7.0. Then it cuts `v1`, published at
   `/6502-DOCS/v1/`, against the emulator's frozen 2.7.0 build at `/6502-EMULATOR/v2/`.

Alongside steps 2–5, once step 1 is tagged: **6502-PICOCALC** embeds the `v1.6` ROM and
releases a new UF2. DOCS waits for that release before cutting `v1`.

**Part 2: the VDP**

6. **6502-PICOVDP:**
   - SPEC draft 0.5 adds the built-in font and its load command. The emulator's PICOVDP
     card implements it first, then the firmware.
   - Firmware proven on the PRO (its Phases 9–11) gates the hardware switch, not the
     software work.
7. **6502-EMULATOR:** `v3-vdp` merged, with the card as an option; tagged 3.x.
8. **6502-BIOS:** 2.0 on `main`. This can start once step 1 is done, because the `v3-vdp`
   emulator already runs the PICOVDP. Its console work needs the built-in font in the
   emulator (step 6).
9. **6502-ASM** sets the VDP include convention. 6502-CRT, 6502-PRG, 6502-BIN and 6502-C
   follow it.
10. **Everything else follows BIOS 2.0:**
    - The emulator bundles BIOS 2.0.
    - 6502-DOCS `main` is rewritten.
    - bastok gains the 2.x token table.
    - 6502-ACE, WIZARDSLAB, 6502-EHBASIC, vc83basic, cffs and 6502-ASSEMBLY follow.

---

## This repository's role

The reference for the whole family ("ACE Documentation"). It generates facts from BIOS
source, proves every sample on the emulator, and embeds live machines. After the change it
serves two audiences: legacy owners (frozen `v1`) and VDP owners (`main`).

## Where it stands

- VitePress with `base: '/6502-DOCS/'`. `deploy.yml` publishes `main` on every push.
- Pinned to emulator 2.6.9 in `data/emulator.json`, `.github/workflows/verify.yml`
  (`EMULATOR_REF`) and `scripts/check-voice.mjs`.
- `data/emulator.json`'s frame URL is `https://acwright.github.io/6502-EMULATOR/embed.html`,
  which is **unpinned**. It serves whatever the emulator's `main` last deployed.
- `scripts/extract-facts.mjs` generates `data/*.json` and `samples/lib/6502.inc` from a
  6502-BIOS checkout (`--bios`, then `$BIOS_SRC`).
- `6502-EMULATOR`'s `docs/handoff/6502-DOCS.md` (branch `v3-vdp`) is a line-numbered
  inventory as of `85d6bb7`, the current HEAD. It covers pins, samples, screenshots, the
  colour table, pages, the emulator chapter and new material. **It is the starting point
  for part D below.**

## Work outline

`VDP-PLAN.md` has the detailed steps for A and B.

### A. Document BIOS 1.6 on `main` (after 6502-BIOS tags `v1.6` and the emulator releases 2.7.0)

- Re-run `extract-facts.mjs` against 6502-BIOS `v1.6`. It picks up the six NVRAM slot
  entries in `kernal.json`, the boot and version data, and `samples/lib/6502.inc`.
- A save-slots section, wherever NVRAM is documented today, with the `SAVEMGR.BAS`
  example from the BIOS README as a verified sample.
- Move the pins to 2.7.0: `data/emulator.json`, `verify.yml` `EMULATOR_REF`, the
  `check-voice` version rule, the version transcripts in `crossdev/`, and the `README.md`
  and `ACCURACY.md` baselines.
- Re-capture any screenshot that shows the splash, which now reads v1.6.

### B. Freeze the legacy docs (right after A; needs the emulator's frozen 2.7.0 build)

- Cut `v1` from `main` once A is in, and before any VDP rewrite begins.
- On `v1`:
  - `BASE = '/6502-DOCS/v1/'` in `docs/.vitepress/config.mts`, which also sets `SITE`
    and the og tags.
  - Frame URL → `https://acwright.github.io/6502-EMULATOR/v2/embed.html`.
  - The emulator pin stays 2.7.0, and facts stay extracted from BIOS `v1.6`/`v1.x`.
  - A persistent banner: "TMS9918A and BIOS 1.6: COB, DEV, KIM, VCS, PicoCalc and
    unconverted ACEs", linking to the current docs.
- **Deploy both.** The workflow on `main` checks out `v1`, builds it with its own base,
  and uploads one Pages artifact (`main` at the root, `v1` under `/v1/`). A push to `v1`
  must trigger that workflow (`workflow_dispatch` or `repository_dispatch`).
- **Verify on `v1`.** Decide whether `verify.yml` runs there too (pinned to 2.7.0) or
  `v1` is simply frozen.
- **The handoff's blocking item (§1).** `main`'s embeds are unpinned until the rewrite.
  Either pin them to a tag-stable URL, or rely on the emulator keeping the TMS9918A as
  its default card until the switchover. Settle this with 6502-EMULATOR.

### C. Family pages across the split

- `docs/family/{cob,dev,vcs}.md`, `docs/addons/kim.md` and `docs/using/picocalc.md` are
  about legacy machines. Either they live on `main` with a callout to `v1` as their
  reference, or `main` links out to `v1` for them.
- `docs/using/picocalc.md` says "the same machine as the emulator". After the rewrite it
  is the same machine as the emulator's TMS9918A card.

### D. Rewrite `main` for the VDP and BIOS 2.x (after BIOS 2.0 and emulator 3.x)

Follow the handoff section by section, then the BIOS 2.x changes it predates:

- **Pins (§2):**
  - `data/emulator.json` version, `verify.yml` `EMULATOR_REF`, and the `check-voice`
    version rule.
  - The version transcripts in `crossdev/debugging.md` and `crossdev/tools.md`.
  - The baselines in `README.md` and `ACCURACY.md`.
  - The embed contract gains the emulator's card parameter.
- **Samples (§3):**
  - Rewrite or remove `graphics-2` and `multicolor`.
  - Add a legacy-mode note to `graphics-1`.
  - Fix the `f18a-detect` verdict text.
  - Make the `.expect` files assert on the picture (`dbg screen hash` or `--screenshot`),
    not just `OK`.
  - Update `samples/README.md` and `scripts/build-embeds.mjs`.
- **Screenshots (§4):** re-capture, because the palette is quantized to 12-bit. Bring
  `screens:verify` into `verify` or CI, or correct the README's claim that screenshots
  are drift-checked.
- **Colour table (§5):**
  - `TMS9918_COLORS` in `extract-facts.mjs` → palette row 0 (the handoff has the table).
  - That feeds `hardware.json` and `ColorChart.vue`.
- **Pages (§6):**
  - `assembly/video.md`, `assembly/graphics.md`.
  - The whole `f18a/` section and its nav. It stays in `v1`, and on `main` it goes.
  - `using/` and `basic/sound-and-video.md`, `reference/glossary.md`,
    `crossdev/tools.md`, `software/index.md` and the issue template.
  - Theme files (`ColorChart.vue`, `style.css`, `Figure.vue`).
  - `hardware.json` slot 8 (four ports), `systems.json`, the memory-map card,
    `io-slots.svg`, the ace/vcs/cob cards.
  - `ACCURACY.md` A45, A46 and A48.
- **Emulator chapter (§7):** the card selector, `--screenshot`, `dbg video`, snapshot
  compatibility.
- **Facts from BIOS 2.0:** re-run `extract-facts.mjs` against 6502-BIOS `main`.
  - It picks up the VDP entry points, the new keywords, the `COLOR` wording and
    `samples/lib/6502.inc`.
  - `monitor-commands.json` has no source on 2.x, so the extractor stops producing it on
    `main`.
  - `charset.json` and the character-set reference page: on `main` the glyphs come from
    6502-PICOVDP's font source, because `Chars.asm` leaves 6502-BIOS `main`. `v1` keeps
    extracting from `Chars.asm`.
- **BIOS 2.x changes beyond the handoff:**
  - **Monitor gone.** `using/monitor.md`, its nav entry and card, and every
    "ESC=MONITOR", `BRK`-statement and Monitor `L`/`S` mention stay in `v1` only.
    `main` documents Wozmon, the BRK report, `SYS addr[,a,x,y]`, and `BLOAD`/`BSAVE`
    over XModem.
  - **Boot.** `getting-started/first-boot.md` and `first-ten-minutes.md`: straight to
    BASIC with the new colour header, and no menu.
  - **Console.** Text mode with per-cell colour. `COLOR fg[,bg[,border]]` sets the pen;
    `CLS` fills with it.
  - **Memory map.** No character set at `$B800`; the Kernal is `$A000–$BFFF`; the font is
    in the card, loaded at reset and by `VdpLoadFont`. Document the load command for
    programs that replace the pattern table.
  - **Requirements.** BIOS 2.x needs a PICOVDP (and a firmware version with the built-in
    font); it does not run on a TMS9918A.
  - **BASIC reference.** Document every new keyword: `SCREEN`, `VPOKE`/`VPEEK`, `VREG`,
    `PALETTE`, `VSYNC`, `VLOAD`, the second tier and the save-slot commands, whichever
    ship. Note the token-stability promise (1.x programs run unchanged, except `BRK`)
    and that BASIC returns to text when a program stops.
  - **BASIC graphics chapter.** `basic/sound-and-video.md` grows, or gains a sibling, with
    verified samples and embeds.
- **New material (§8):**
  - A chapter on the new modes, from the emulator's `samples/vdp-modes/` and
    `samples/vdp-layers/`.
  - Detection on `assembly/detection.md`.
  - The port-B convention, replacing the `sei`/`cli` warnings.
  - NVRAM save slots from BASIC, if 2.0 adds the commands.
  - The new Kernal entries.
  - Getting started: which card an ACE needs, flashing the PICOVDP UF2, and the fact that
    RP2040 boards cannot run it.

## Linked repositories

| Repository | Path | Why |
|---|---|---|
| 6502-EMULATOR | `~/Developer/NodeJS/6502-EMULATOR` | 2.7.0 with BIOS 1.6 (A); frozen `/v2/` build (B); card parameter and 3.x tag (D); `docs/handoff/6502-DOCS.md` on `v3-vdp` |
| 6502-BIOS | `~/Developer/Assembly/6502-BIOS` | Facts are extracted from `v1.6`/`v1.x` for `v1` and from `main` for the rewrite; its assessment lists the 2.x changes |
| 6502-PICOVDP | `~/Developer/C/6502-PICOVDP` | `SPEC.md` is the source for the new chapters; the font source for `charset.json` on `main`; firmware release and flashing |
| 6502-ACE | `~/Developer/Kicad/6502-ACE` | Hardware requirement (PRO v2.0), cards |
| bastok | `~/Developer/NodeJS/bastok` | Builds the BASIC embeds: 1.x table for `v1`, 2.x table for `main` |
| 6502-ASSEMBLY | `~/Developer/YouTube/6502-ASSEMBLY` | Episode 5 teaches the legacy VDP and links to these docs, and should link to `v1` |
| WIZARDSLAB | `~/Developer/Assembly/WIZARDSLAB` | Listed on the software pages; runs on both cards |

## Questions for VDP-PLAN.md

1. Whether `v1` keeps running `verify` after it is cut.
2. Whether family and PicoCalc pages stay on `main` with callouts, or move out to `v1`.
3. A version switcher (VitePress nav dropdown) versus a banner only.
4. How `main`'s embeds stay safe between the emulator merge and this rewrite.
5. Whether `/6502-DOCS/` keeps its current URLs for the rewritten pages, which means
   inbound links to F18A pages land on a 404 unless redirected to `/v1/`.
