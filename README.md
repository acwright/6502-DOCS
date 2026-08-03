# 6502-DOCS

The user's and programmer's guide for the **AC6502** family of homebrew
computers — ACE, COB, DEV, KIM, and VCS. A friendly, tutorial-first companion
to the more technical READMEs in the sibling repos below, in the spirit of
the Commodore 64 manuals.

Published at **<https://acwright.github.io/6502-DOCS/>**.

Built with [VitePress](https://vitepress.dev/), deployed to GitHub Pages.
See [`PLAN.md`](PLAN.md) for the full multi-phase build plan, sources of
truth, and verification method.

## Running locally

Requires Node 22+.

```sh
npm install
npm run docs:dev      # dev server with hot reload
npm run docs:build    # production build to docs/.vitepress/dist
npm run docs:preview  # serve the production build locally
```

## Adding and verifying a sample

Every code listing in the docs is a real file under `samples/`, included into
the Markdown by path, and executed against the emulator so the prose can
never drift from tested output. That harness (`npm run verify`) is built out
in Phase 1 of `PLAN.md`; today it's a placeholder that always passes. Once
Phase 1 lands, the workflow will be:

1. Add `samples/<topic>/<name>.bas` (or `.prg`, `.asm`) plus a sibling
   `.expect` file with the asserted console output.
2. Run `npm run verify` locally — it boots the emulator, runs every sample,
   and prints `ok`/`FAIL` per case.
3. Reference the sample from a chapter using VitePress's code-snippet import
   syntax so the docs embed the tested file directly.

CI runs the same harness on every push via `.github/workflows/verify.yml`.

## Deploying

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages automatically. No manual steps.

## Repository layout

| Path | Purpose |
|---|---|
| `docs/` | VitePress site source (pages, theme, public assets) |
| `data/` | Machine-readable fact base consumed by the docs at build time (Phase 1) |
| `samples/` | Verified BASIC/assembly listings backing the docs (Phase 1+) |
| `cards/` | Printable HTML quick-reference cards (Phase 2/7) |
| `assets/` | Legacy design sources (`.afdesign`, `.numbers`) kept for provenance |
| `scripts/` | Sample harness and toolchain preflight scripts |
| `ACCURACY.md` | Ledger of factual discrepancies found and fixed (Phase 1+) |

## Sibling repositories

| Repo | Purpose |
|---|---|
| [6502-BIOS](https://github.com/acwright/6502-BIOS) | Shared BIOS — Kernal, BASIC, Monitor. Source of truth for software behaviour. |
| [6502-EMULATOR](https://github.com/acwright/6502-EMULATOR) | Desktop/browser emulator and CLI used to verify every sample in these docs. |
| [6502-ACE](https://github.com/acwright/6502-ACE) | All-in-one single-board computer. |
| [6502-COB](https://github.com/acwright/6502-COB) | Backplane and card-based system. |
| [6502-DEV](https://github.com/acwright/6502-DEV) | Teensy-emulated CPU development vehicle. |
| [6502-KIM](https://github.com/acwright/6502-KIM) | Minimal keypad/LCD machine. |
| [6502-VCS](https://github.com/acwright/6502-VCS) | Cartridge-based console. |
| [6502-PRG](https://github.com/acwright/6502-PRG) | Cross-dev template for RAM programs. |
| [6502-CRT](https://github.com/acwright/6502-CRT) | Cross-dev template for cartridges. |
| [6502-ASM](https://github.com/acwright/6502-ASM) | Assembly sample code. |
| [6502-BAS](https://github.com/acwright/6502-BAS) | BASIC sample code. |
| [bastok](https://github.com/acwright/bastok) | BASIC tokenizer (`.bas` text → `.prg`). |
| [cffs](https://github.com/acwright/cffs) | CompactFlash disk image tool. |
| [bin2woz](https://github.com/acwright/bin2woz) | Binary → Wozmon paste-able upload helper. |
| [TMS9918-EDITOR](https://github.com/acwright/TMS9918-EDITOR) | Character/screen/sprite editor. |

## Licence

[MIT](LICENSE).
