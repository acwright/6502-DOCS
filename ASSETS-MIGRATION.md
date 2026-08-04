# ASSETS-MIGRATION.md — retiring `6502-ASSETS`

The evidence that `6502-ASSETS` can be archived.

[Phase 10](PLAN.md#phase-10--launch--assets-retirement) archives that repo. This
file is what makes that a decision rather than a guess: every path that existed
in it, where it went, and — where it went nowhere — why.

**Status: complete.** Every path in `6502-ASSETS` is accounted for, and
[Phase 7](PLAN.md#phase-7--quick-reference-cards) has finished the authoring
that was outstanding: the six sheets that existed only as Affinity or Numbers
documents are now HTML cards, and the five migrated system sheets have been
audited against the machine and corrected
([ACCURACY.md O1 and O4](ACCURACY.md), both resolved). Nothing in this repo
still depends on `6502-ASSETS`.

## How this file is kept honest

The migration is a script, not a series of hand copies:

```sh
npm run migrate         # copy, convert, and rewrite the inventory below
npm run migrate:check   # verify coverage and drift; writes nothing
```

`scripts/migrate-assets.mjs` holds a manifest naming every path in the source
repo. It walks the real `6502-ASSETS` tree on every run and fails if it finds a
file the manifest does not name, or names one that no longer exists. The
inventory table below is generated from that same manifest, so a ✅ in it means
the file is on disk right now — not that somebody ticked a box once.

`npm run migrate:check` runs in CI against a **fresh clone** of `6502-ASSETS`, so
the day that repo gains a file, the build says so. The fresh clone matters: the
script walks whatever working tree it is pointed at, and the local checkout this
migration was first run against had `Documentation/ACE/ACE.pdf` deleted but
uncommitted. CI's copy is the authoritative one.

By default the source repo is read from `~/Developer/Assets/6502-ASSETS`; pass
`--source <path>` for a checkout somewhere else.

`npm run cards:check` is the companion guard and needs no source repo at all: it
holds every card in `docs/public/cards/` to the rules this phase set — no
external requests, no inline stylesheet, on `card.css`, `body.card`, real letter
pages — so a card cannot quietly drift back to how the originals were.

## What the migration did and did not do

**Did:** move the files, and put every reference sheet on one shared print
stylesheet.

The seventeen HTML sheets each carried their own inline copy of nearly the same
CSS — 81 KB across the set, drifted into two size regimes — and each pulled Bebas
Neue and Source Code Pro from Google Fonts, so every one of them printed in a
fallback face on a machine that was offline. Both are fixed:
[`docs/public/cards/card.css`](docs/public/cards/card.css) is 15 KB, self-hosts
both faces from `docs/public/fonts/`, and expresses the two size regimes as
`.card` (dense reference sheet) and `.card.placard` (display sheet) over one set
of custom properties.

The conversion touches the `<head>` and the `<body>` tag and nothing else. Every
table, address, and listing is the text that shipped in `6502-ASSETS`, so a
converted card diffs cleanly against its original and any visual change is
attributable to the stylesheet alone.

**Did not:** correct any card's content. That was Phase 7, which typed every
listing on every sheet into the emulator and found twelve broken ones across the
five system cards ([ACCURACY.md A38–A41](ACCURACY.md)) on top of the ROM
boundary and `READY.` prompt already logged as A2 and A3. The ACE and KIM sheets
were rebuilt from scratch; the COB, DEV and VCS sheets were corrected in place.
Every card is now linked from [the card index](docs/reference/index.md) and from
the chapter it condenses.

## Where things landed

| Directory | Holds |
|---|---|
| [`docs/public/cards/`](docs/public/cards/) | Ten current sheets and the shared `card.css`. Served at `/cards/*.html` — raw print pages, outside the VitePress chrome. Five came from `6502-ASSETS`; five are new in Phase 7. |
| [`docs/public/cards/archive/`](docs/public/cards/archive/) | The BIOS v1.0–v1.4 reference sheets and the two KIM LED walk-throughs. Kept as the record of what each firmware release documented; superseded, not current. |
| [`docs/public/images/`](docs/public/images/) | Branding exports, the family photo, and the character-set renders at 1×–16×. |
| [`assets/`](assets/) | Design sources — nothing here is served. See [`assets/README.md`](assets/README.md). |

### Verification

The nine sheets rendered by headless Chrome from `file://` with no network:
every one prints to a 612 × 792 pt page (US Letter, exactly), at the same page
count as its original, with `BebasNeue-Regular` embedded in the output. The
originals, rendered the same way, fall back to Helvetica — which is the bug this
migration fixes. Phase 7 re-ran the same check across all fourteen current
sheets and got the same result.

One caveat on that check, found in Phase 7 and worth writing down so nobody
chases it twice: **`Source Code Pro` never appears in a `--print-to-pdf`
output**, whichever card you render, and the PDF names Menlo instead. It is not
a loading failure. A screenshot of the same page shows the face rendering
correctly — dotted zero, Source Code Pro letterforms — so the `@font-face`
resolves and the browser is using it. Chrome's headless PDF writer substitutes a
system monospace at export time; printing from a normal browser window, which is
what the print hint on every card tells the reader to do, does not.

### What is deliberately not here

- **PDFs of the HTML sheets** (10 files). Print artefacts, not sources. Regenerate
  by printing the card: letter, 100%, margins off, background graphics on. The
  PDF/PNG exports of the *legacy* sheets — the ones with no HTML to print — are
  kept in `assets/legacy/renders/` as the reference their Phase 7 recreations
  were checked against.
- **`README.md`.** Its folder guide describes a tree that no longer exists; its
  memory-map summary is wrong in two places ([A4, A8](ACCURACY.md)) and is
  replaced by `data/memory-map.json`; its Related table is rebuilt in this repo's
  README.
- **`LICENSE`, `.gitignore`.** This repo has its own.

### Authored rather than migrated

Six sheets existed only as Affinity Designer or Numbers documents published to
PDF. There was nothing to migrate — a `.afdesign` cannot be diffed against
`Kernal.asm` — so Phase 7 recreated each as HTML from the fact base or from the
KiCad schematics. Sources stay parked in `assets/affinity/` and
`assets/numbers/`, last exports in `assets/legacy/renders/`, and the full
mapping is in [`assets/README.md`](assets/README.md).

Three of the recreations are **generated** from `data/` by
`scripts/build-cards.mjs` and re-checked by `npm run verify`, so they cannot
fall behind the ROM. Three are hand-written from the schematics and firmware,
each citing its source in a comment at the top of the file.

---

## Inventory

Every path in `6502-ASSETS`, generated from the manifest.

<!-- BEGIN GENERATED INVENTORY -->

<!-- Generated by scripts/migrate-assets.mjs — do not edit by hand. -->

| In `6502-ASSETS` | In this repo | Status | Notes |
|---|---|---|---|
| `.gitignore` | — | ⬜ dropped | Repo mechanics. This repo has its own. |
| `LICENSE` | — | ⬜ dropped | This repo carries its own identical MIT LICENSE. |
| `README.md` | — | ⬜ dropped | Superseded. Its folder guide is obsolete once the tree moves; its memory-map summary is wrong in two places (ACCURACY.md A4, A8) and is replaced by data/memory-map.json; its Related table is rebuilt in this repo's README. |
| `Branding/6502.afdesign` | `assets/branding/6502.afdesign` | ✅ copied | Byte-for-byte. |
| `Branding/Logo.afdesign` | `assets/branding/logo.afdesign` | ✅ copied | Byte-for-byte. |
| `Branding/Favicon.aseprite` | `assets/branding/favicon.aseprite` | ✅ copied | Byte-for-byte. |
| `Branding/6502.png` | `assets/branding/6502.png`<br>`docs/public/images/mark.png` | ✅ copied | Byte-for-byte. |
| `Branding/Logo.png` | `assets/branding/logo.png`<br>`docs/public/images/logo.png` | ✅ copied | Byte-for-byte. |
| `Branding/Logo BOW.png` | `assets/branding/logo-bow.png`<br>`docs/public/images/logo-bow.png` | ✅ copied | Byte-for-byte. |
| `Branding/Logo WOB.png` | `assets/branding/logo-wob.png`<br>`docs/public/images/logo-wob.png` | ✅ copied | Byte-for-byte. |
| `Branding/Favicon.ico` | `assets/branding/favicon.ico`<br>`docs/public/favicon.ico` | ✅ copied | Byte-for-byte. |
| `Images/6502.png` | `docs/public/images/6502.png` | ✅ copied | Byte-for-byte. |
| `Labels/Cartridge Template.afdesign` | `assets/labels/cartridge-template.afdesign` | ✅ copied | Byte-for-byte. |
| `Labels/Cartridges.afdesign` | `assets/labels/cartridges.afdesign` | ✅ copied | Byte-for-byte. |
| `Labels/EhBASIC Cartridge Label.afdesign` | `assets/labels/ehbasic-cartridge-label.afdesign` | ✅ copied | Byte-for-byte. |
| `Labels/Template Cartridge Label.afdesign` | `assets/labels/template-cartridge-label.afdesign` | ✅ copied | Byte-for-byte. |
| `Labels/VC83 BASIC Cartridge Label.afdesign` | `assets/labels/vc83-basic-cartridge-label.afdesign` | ✅ copied | Byte-for-byte. |
| `Labels/VC83.png` | `assets/labels/vc83.png` | ✅ copied | Byte-for-byte. |
| `Documentation/ACE/ACE.html` | `docs/public/cards/ace.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/COB/COB.html` | `docs/public/cards/cob.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/DEV/DEV.html` | `docs/public/cards/dev.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/KIM/KIM.html` | `docs/public/cards/kim.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/VCS/VCS.html` | `docs/public/cards/vcs.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/ACE/ACE.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/COB/COB.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/DEV/DEV.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/KIM/KIM.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/VCS/VCS.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/KIM/KIM LED Demo - Binary Counter.html` | `docs/public/cards/archive/kim-led-binary-counter.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/KIM/KIM LED Demo - KITT Scanner.html` | `docs/public/cards/archive/kim-led-kitt-scanner.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/KIM/KIM LED Demo - Binary Counter.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/KIM/KIM LED Demo - KITT Scanner.pdf` | — | ⬜ dropped | Print artefact, not a source. Regenerated by printing the HTML card (letter, 100%, margins off, background graphics on). |
| `Documentation/BIOS/v1.0/6502 BIOS - BASIC Reference.html` | `docs/public/cards/archive/bios-v1.0-basic-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.0/6502 BIOS - Monitor Reference.html` | `docs/public/cards/archive/bios-v1.0-monitor-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.1/6502 BIOS - BASIC Reference.html` | `docs/public/cards/archive/bios-v1.1-basic-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.1/6502 BIOS - Monitor Reference.html` | `docs/public/cards/archive/bios-v1.1-monitor-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.2/6502 BIOS - BASIC Reference.html` | `docs/public/cards/archive/bios-v1.2-basic-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.2/6502 BIOS - Monitor Reference.html` | `docs/public/cards/archive/bios-v1.2-monitor-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.3/6502 BIOS - BASIC Reference.html` | `docs/public/cards/archive/bios-v1.3-basic-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.3/6502 BIOS - Monitor Reference.html` | `docs/public/cards/archive/bios-v1.3-monitor-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.4/6502 BIOS - BASIC Reference.html` | `docs/public/cards/archive/bios-v1.4-basic-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/BIOS/v1.4/6502 BIOS - Monitor Reference.html` | `docs/public/cards/archive/bios-v1.4-monitor-reference.html` | ✅ converted | Rewritten onto `cards/card.css`; markup untouched. |
| `Documentation/Memory Map/Memory Map.afdesign` | `assets/affinity/memory-map.afdesign` | ✅ copied | Byte-for-byte. |
| `Documentation/Memory Map/Memory Map.png` | `assets/legacy/renders/memory-map.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Memory Map/Memory Map.pdf` | `assets/legacy/renders/memory-map.pdf` | ✅ copied | Byte-for-byte. |
| `Documentation/Connectors/Connectors.afdesign` | `assets/affinity/connectors.afdesign` | ✅ copied | Byte-for-byte. |
| `Documentation/Connectors/Connectors.png` | `assets/legacy/renders/connectors.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Connectors/Connectors.pdf` | `assets/legacy/renders/connectors.pdf` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Set.afdesign` | `assets/affinity/character-set.afdesign` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Map.numbers` | `assets/numbers/character-map.numbers` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Map.png` | `assets/legacy/renders/character-map.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Map.pdf` | `assets/legacy/renders/character-map.pdf` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Set.png` | `docs/public/images/charset/charset-1x.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Set 2x.png` | `docs/public/images/charset/charset-2x.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Set 4x.png` | `docs/public/images/charset/charset-4x.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Set 8x.png` | `docs/public/images/charset/charset-8x.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Characters/Character Set 16x.png` | `docs/public/images/charset/charset-16x.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Keyboard Layout/Keyboard Layout.json` | `assets/keyboard/keyboard-layout.json` | ✅ copied | Byte-for-byte. |
| `Documentation/Keyboard Layout/Keyboard Layout.svg` | `assets/keyboard/keyboard-layout.svg` | ✅ copied | Byte-for-byte. |
| `Documentation/Keyboard Layout/Keyboard Layout.png` | `assets/keyboard/keyboard-layout.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Keyboard Matrix/Keyboard Matrix.numbers` | `assets/numbers/keyboard-matrix.numbers` | ✅ copied | Byte-for-byte. |
| `Documentation/Keyboard Matrix/Keyboard Matrix.png` | `assets/legacy/renders/keyboard-matrix.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Keyboard Matrix/Keyboard Matrix.pdf` | `assets/legacy/renders/keyboard-matrix.pdf` | ✅ copied | Byte-for-byte. |
| `Documentation/Keypad Mapping/Keypad Mapping.numbers` | `assets/numbers/keypad-mapping.numbers` | ✅ copied | Byte-for-byte. |
| `Documentation/Keypad Mapping/Keypad Mapping.png` | `assets/legacy/renders/keypad-mapping.png` | ✅ copied | Byte-for-byte. |
| `Documentation/Keypad Mapping/Keypad Mapping.pdf` | `assets/legacy/renders/keypad-mapping.pdf` | ✅ copied | Byte-for-byte. |

<!-- END GENERATED INVENTORY -->
