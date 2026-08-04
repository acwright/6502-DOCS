# assets/

Design sources. **Nothing here is served by the site** — everything the site
loads lives under [`docs/public/`](../docs/public/). These are the editable
originals kept so the published artefacts can be regenerated or corrected.

They arrived from `6502-ASSETS` in
[Phase 2](../PLAN.md#phase-2--assets-migration); every path's origin and fate is
recorded in [`ASSETS-MIGRATION.md`](../ASSETS-MIGRATION.md).

## Layout

| Path | What it holds | Status |
|---|---|---|
| `branding/` | Logo and favicon masters — `.afdesign`, `.aseprite`, and the PNG/ICO exports | **Current.** The exports are wired into the site; these are the files to edit if the mark changes. |
| `labels/` | Cartridge label artwork and blank templates (`.afdesign`) | **Current.** Print artwork with no web equivalent; documented in the cartridge chapter. |
| `keyboard/` | Keyboard layout as KLE JSON, SVG, and PNG | **Current.** The JSON round-trips through [keyboard-layout-editor.com](https://www.keyboard-layout-editor.com); the SVG embeds directly into the layout card. |
| `affinity/` | `.afdesign` sources for the memory map, connectors, and character set sheets | **Legacy.** Pending HTML recreation — see below. |
| `numbers/` | `.numbers` spreadsheets behind the character map, keyboard matrix, and keypad mapping sheets | **Legacy.** Pending HTML recreation — see below. |
| `legacy/renders/` | The PDF and PNG each legacy source last exported to | **Reference only.** What the artwork looked like, so the recreation can be checked against it. |

## The legacy sources

Six reference sheets were authored in Affinity Designer or Numbers and published
only as PDF and PNG. That makes them unverifiable in the sense this project
means it: nothing can diff a `.afdesign` against `Kernal.asm`, and the memory map
one is [already known to be wrong](../ACCURACY.md).

Phase 7 recreates each as an HTML card built from the fact base in
[`data/`](../data/) or verified against the KiCad schematics:

| Legacy source | Becomes | Verified by |
|---|---|---|
| `affinity/memory-map.afdesign` | `docs/public/cards/memory-map.html` | `data/memory-map.json` (GREP + INSPECT) |
| `affinity/connectors.afdesign` | `docs/public/cards/connectors.html` | KiCad schematics (SCHEM) |
| `affinity/character-set.afdesign` | `docs/public/cards/character-map.html` | `6502 dbg mem` at `$B800` (INSPECT) |
| `numbers/character-map.numbers` | `docs/public/cards/character-map.html` | as above |
| `numbers/keyboard-matrix.numbers` | `docs/public/cards/keyboard-matrix.html` | KiCad schematics (SCHEM) |
| `numbers/keypad-mapping.numbers` | `docs/public/cards/keypad-mapping.html` | KiCad schematics (SCHEM) |

Once a recreation is signed off, the HTML is canonical and the legacy source
stays here as history. Nothing in `affinity/` or `numbers/` is deleted by the
plan — but neither should anything cite them as a source of truth again.

## Adding to this directory

Design sources only. If a file is loaded by a page, a card, or a stylesheet, it
belongs in `docs/public/` instead — and if it is a *fact* rather than an image,
it belongs in `data/`, extracted by `npm run facts`.
