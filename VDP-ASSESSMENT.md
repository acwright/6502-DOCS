# VDP assessment: 6502-DOCS

> An outline, not a plan. The detailed plan for this repository goes in `VDP-PLAN.md`,
> written in a session of its own. Surveyed 2026-09-16 across the whole workspace.
> Line numbers drift; file and heading names are the durable references.

## The change

The ACE moves from a Pico9918 running stock TMS9918A firmware to the **6502-PICOVDP**
(`6502-PICOVDP/SPEC.md`) on PICO9918 PRO v2.0 hardware, running **BIOS 2.x**. Everything
else stays where it is: COB, DEV, KIM, VCS, PicoCalc, and any ACE whose card cannot be
reflashed (RP2040 pico9918 v1.0–1.3). Those keep the stock firmware and **BIOS 1.x (1.5)**.

- **Legacy** in these documents means TMS9918A + BIOS 1.x. **VDP** means PICOVDP + BIOS 2.x.
- **Compatibility runs one way.** The PICOVDP's legacy submode runs Text and Graphics I
  programs unchanged, so BIOS 1.5 and existing cartridges run on it. Graphics II and
  Multicolor fall back to Graphics I and draw garbage. Register writes above 7 no longer
  alias, so F18A tricks break. Sprites per line are 16 by default, not 4. Nothing written
  for the VDP runs on a TMS9918A.
- **BIOS 2.0 is assumed to be:** BIOS 1.5, plus the NVRAM save slots in
  `6502-BIOS/PLAN.md`, plus the VDP work in `6502-EMULATOR`'s
  `docs/handoff/6502-BIOS.md` (branch `v3-vdp`). Existing jump-table addresses stay put.
  A later BIOS redesign may revise this.

## Decisions already made

- No new repositories.
- **6502-EMULATOR** makes the video card an option (TMS9918A or PICOVDP): one app, one
  site. It also publishes a frozen 2.6.9 web build at a versioned path for the legacy docs.
- **This site** is versioned: legacy docs are frozen at `/6502-DOCS/v1/`, and the main
  site is rewritten for the VDP.
- **6502-BIOS** gets a `v1.x` maintenance branch; `main` becomes 2.x.
- **Assembly and C projects** get a VDP include chosen by a build option, not branches.
- **EhBASIC and vc83basic** stay 1.x. **PicoCalc** stays legacy. **The YouTube series**
  teaches the legacy VDP and mentions the new features.

## Order across the workspace

1. **6502-PICOVDP:** firmware proven on the PRO (its Phases 9–11). This gates the
   hardware switch, not the software work.
2. **6502-EMULATOR:** frozen 2.6.9 web build at `/6502-EMULATOR/v2/`.
3. **6502-DOCS:** `v1` branch published at `/6502-DOCS/v1/`, embeds pinned to step 2.
4. **6502-EMULATOR:** `v3-vdp` merged, with the card as an option; tagged 3.x.
5. **6502-BIOS:** `v1.x` cut; 2.0 built on `main`. This can start any time, because the
   `v3-vdp` emulator already runs the PICOVDP.
6. **6502-ASM** sets the VDP include convention. 6502-CRT, 6502-PRG, 6502-BIN and 6502-C
   follow it.
7. The emulator bundles BIOS 2.0. 6502-DOCS `main` is rewritten. 6502-ACE, bastok,
   WIZARDSLAB, 6502-EHBASIC, vc83basic and 6502-ASSEMBLY follow.

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
  for part C below.**

## Work outline

### A. Freeze the legacy docs (early; blocked only by the emulator's frozen build)

- Cut `v1` from `main` before any VDP rewrite begins.
- On `v1`:
  - `BASE = '/6502-DOCS/v1/'` in `docs/.vitepress/config.mts`, which also sets `SITE`
    and the og tags.
  - Frame URL → `https://acwright.github.io/6502-EMULATOR/v2/embed.html`.
  - The emulator pin stays 2.6.9, and facts stay extracted from BIOS `v1.5`/`v1.x`.
  - A persistent banner: "TMS9918A and BIOS 1.5: COB, DEV, KIM, VCS, PicoCalc and
    unconverted ACEs", linking to the current docs.
- **Deploy both.** The workflow on `main` checks out `v1`, builds it with its own base,
  and uploads one Pages artifact (`main` at the root, `v1` under `/v1/`). A push to `v1`
  must trigger that workflow (`workflow_dispatch` or `repository_dispatch`).
- **Verify on `v1`.** Decide whether `verify.yml` runs there too (pinned to 2.6.9) or
  `v1` is simply frozen.
- **The handoff's blocking item (§1).** `main`'s embeds are unpinned until the rewrite.
  Either pin them to a tag-stable URL, or rely on the emulator keeping the TMS9918A as
  its default card until the switchover. Settle this with 6502-EMULATOR.

### B. Family pages across the split

- `docs/family/{cob,dev,vcs}.md`, `docs/addons/kim.md` and `docs/using/picocalc.md` are
  about legacy machines. Either they live on `main` with a callout to `v1` as their
  reference, or `main` links out to `v1` for them.
- `docs/using/picocalc.md` says "the same machine as the emulator". After the rewrite it
  is the same machine as the emulator's TMS9918A card.

### C. Rewrite `main` for the VDP (after BIOS 2.0 and emulator 3.x)

Follow the handoff section by section:

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
- **Facts from BIOS 2.0:** re-run `extract-facts.mjs` against 6502-BIOS `main`. This picks
  up the NVRAM slot entries, the VDP entry points, the `COLOR` wording and
  `samples/lib/6502.inc`.
- **New material (§8):**
  - A chapter on the new modes, from the emulator's `samples/vdp-modes/` and
    `samples/vdp-layers/`.
  - Detection on `assembly/detection.md`.
  - The port-B convention, replacing the `sei`/`cli` warnings.
  - NVRAM save slots.
  - The new Kernal entries.
  - Getting started: which card an ACE needs, flashing the PICOVDP UF2, and the fact that
    RP2040 boards cannot run it.

## Linked repositories

| Repository | Path | Why |
|---|---|---|
| 6502-EMULATOR | `~/Developer/NodeJS/6502-EMULATOR` | Frozen `/v2/` build (a prerequisite for A); card parameter and 3.x tag (C); `docs/handoff/6502-DOCS.md` on `v3-vdp` |
| 6502-BIOS | `~/Developer/Assembly/6502-BIOS` | Facts are extracted from `v1.x` for `v1` and from `main` for the rewrite |
| 6502-PICOVDP | `~/Developer/C/6502-PICOVDP` | `SPEC.md` is the source for the new chapters; firmware release and flashing |
| 6502-ACE | `~/Developer/Kicad/6502-ACE` | Hardware requirement (PRO v2.0), cards |
| bastok | `~/Developer/NodeJS/bastok` | Builds the BASIC embeds; its token table follows BIOS 2.0 if keywords change |
| 6502-ASSEMBLY | `~/Developer/YouTube/6502-ASSEMBLY` | Episode 5 teaches the legacy VDP and links to these docs, and should link to `v1` |
| WIZARDSLAB | `~/Developer/Assembly/WIZARDSLAB` | Listed on the software pages; runs on both cards |

## Questions for VDP-PLAN.md

1. The `v1` branch point, and whether `v1` keeps running `verify`.
2. Whether family and PicoCalc pages stay on `main` with callouts, or move out to `v1`.
3. A version switcher (VitePress nav dropdown) versus a banner only.
4. How `main`'s embeds stay safe between the emulator merge and this rewrite.
5. Whether `/6502-DOCS/` keeps its current URLs for the rewritten pages, which means
   inbound links to F18A pages land on a 404 unless redirected to `/v1/`.
