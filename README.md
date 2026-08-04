# 6502-DOCS

The user's and programmer's guide for the **ACE** — the flagship of the AC6502
family of homebrew 65C02 computers. A friendly, tutorial-first manual in the
spirit of the Commodore 64 and VIC-20 books that came in the box, and a
companion to the more technical READMEs in the sibling repos below.

Published at **<https://acwright.github.io/6502-DOCS/>**.

Built with [VitePress](https://vitepress.dev/), deployed to GitHub Pages.
See [`PLAN.md`](PLAN.md) for the full multi-phase build plan, sources of
truth, and verification method.

> **Read [`PLAN.md`'s *Voice & Style*](PLAN.md#voice--style) before writing a
> page.** It is binding, it is enforced by `npm run check:voice`, and it exists
> because the first pass at these docs read like a compliance report. Short
> version: the guide is about the ACE, it talks to a person, and the
> verification machinery that keeps it honest never appears on a page.

## Running locally

Requires Node 22+.

```sh
npm install
npm run docs:dev      # dev server with hot reload
npm run docs:build    # production build to docs/.vitepress/dist
npm run docs:preview  # serve the production build locally
```

To run or regenerate anything that touches the machine, you also need the
emulator CLI and cc65:

```sh
npm run preflight     # what's installed, what's missing, and what to do about it
npm run check:voice   # fail if the docs start talking about the docs
```

## Writing a page

The site is a manual for the **ACE**, addressed to someone who was handed one
and did not build it. It says "your ACE" and means it; it does not hedge across
five machines. COB, DEV and VCS live in `docs/family/` for builders, and the KIM
is documented as an ACE add-on in `docs/addons/kim.md`.

| Path | Section |
|---|---|
| `docs/index.md`, `docs/your-ace.md` | Introduction |
| `docs/getting-started/` | Setting up through to troubleshooting |
| `docs/using/` | Everything you do at the prompt |
| `docs/addons/` | Hardware that changes what the machine is |
| `docs/basic/` | The BASIC guide — tutorial, then reference |
| `docs/crossdev/` | Building on your own computer: cc65, the templates, debugging, testing |
| `docs/assembly/` | The assembly guide — the 65C02, the memory map, the Kernal, then a chapter per peripheral |
| `docs/family/` | The other four machines, for builders |

Depth that would break the flow goes in a `::: details` or `::: tip` block
rather than out of the chapter. See [`PLAN.md`](PLAN.md#voice--style) for the
full rules and the list of banned vocabulary.

## The fact base

`data/*.json` is the machine's truth, extracted mechanically from the BIOS
source so the docs write against it instead of re-deriving it. Every table on
the site is generated from these files at build time — no address, opcode,
keyword or error string on this site is typed in by hand.

```sh
npm run facts         # regenerate data/ and samples/lib/6502.inc
npm run facts:check   # fail if either is stale (run before committing)
```

| File | Extracted from |
|---|---|
| `boot.json` | Version, splash strings, and the boot menu — `BIOS.inc`, `Kernal.asm` |
| `kernal.json` | All 53 published jump-table slots plus the reserved range — `Kernal.asm` |
| `memory-map.json` | RAM regions, ROM segments, I/O window, every named symbol — `BIOS.inc`, `BIOS.cfg` |
| `hardware.json` | `HW_PRESENT` bits, the eight I/O slots and their registers — `BIOS.inc` |
| `basic-keywords.json` | Every keyword, token and dispatch target — `BASIC.asm` |
| `monitor-commands.json` | The command set, in dispatch-table order — `Monitor.asm` |
| `errors.json` | BASIC and Monitor message strings, verbatim — `BASIC.asm`, `Monitor.asm` |
| `systems.json` | The five machines. **Hand-maintained** from the KiCad READMEs, confirmed against the schematics. The ACE record describes the machine as shipped — banked RAM and storage included — with build-time caveats in `builderNotes`. |
| `basic-examples.json` | Syntax, summary and a worked example for all 85 BASIC keywords. **Hand-authored, machine-checked** — see below. |

The extractor needs a `6502-BIOS` checkout (`--bios <path>`, `$BIOS_SRC`, or
`~/Developer/Assembly/6502-BIOS`). The generated files are committed, so
building the site and running CI need only this repo.

Each record carries its provenance: `source` names the file and line it came
from, and `check` records which verification method backs it. Anything read
from a README is rank 4 and stays `verified: false` until a running sample
proves it.

## Adding and verifying a sample

Every code listing in the docs is a real file under `samples/`, included into
the Markdown by path, and executed against the emulator so the prose can never
drift from tested output.

1. Add `samples/<topic>/<name>.bas` (or `.asm`, `.prg`) plus a sibling
   `.expect` file saying what must be true. The harness refuses to run a
   listing that has no `.expect`.
2. `npm run verify` boots the emulator, runs every case, and prints `ok`/`FAIL`
   per case. `npm run verify -- <name>` runs one; add `-- --verbose` to see
   what the machine actually printed.
3. Reference it from a chapter with VitePress's snippet import so the page
   embeds the tested file:
   `<<< @/../samples/basic/times-table.bas`

A sample that a chapter *shows* has to be a program worth running, and asserts
on its own real output — never `PRINT "PASS"`. Pure regression cases go in
`samples/_checks/`, are never displayed, and may assert however they like.

[`samples/README.md`](samples/README.md) documents the `.expect` directives and
the boot-once/restore-per-case method. `samples/_harness/` holds a case that
asserts something untrue on purpose, so the suite is proved able to fail.

### The keyword examples

The BASIC reference needs a working example for each of 85 keywords, which is
too many to want as 170 files. They live instead in `data/basic-examples.json`,
one entry per keyword, and the same harness runs every one of them:

```sh
npm run verify -- reference/        # just the keyword examples
npm run verify -- reference/MID$    # just one
```

An entry's `example` lines are typed into the machine and its `output` lines are
asserted verbatim — and those are the same two arrays the reference page
renders, so what the page prints under a listing is what the machine printed
under it. A block beginning with a line number is typed in and `RUN`; anything
else runs as it is entered. `run: false` covers the entries that type a program
in only to `LIST` it or load it back off a card.

That file is the one thing in `data/` that is **not** generated. What a keyword
is for, and the shortest example worth printing, are writing decisions — and
its `syntax` field is also where the BIOS README's seven wrong keyword syntax
lines get corrected (ACCURACY.md A25).

CI runs the same harness on every push via `.github/workflows/verify.yml`,
which builds the emulator CLI and cc65 from source on the runner.

## The reference cards

`docs/public/cards/*.html` are printable quick-reference sheets, served raw at
`/cards/` outside the VitePress chrome. Print them at **letter, 100% scale,
margins off, background graphics on** — the black header and footer bars are
part of the artwork.

They all share one print stylesheet,
[`docs/public/cards/card.css`](docs/public/cards/card.css), which self-hosts
Bebas Neue and Source Code Pro so a card printed offline looks identical to one
printed online. A card picks a size regime with a body class — `card` for a
dense reference sheet, `card placard` for one read at arm's length — and sets
its column widths with custom properties. It never carries CSS of its own.

**Six of the ten are generated** from the fact base — the BASIC, Monitor,
Kernal, memory-map, character-set and keyboard-layout sheets. Edit `data/`, or
the layout in `scripts/build-cards.mjs`, never the HTML. The other four come
from schematics and firmware rather than from the ROM, so they are hand-written
with their source cited in a comment at the top of the file.

```sh
npm run cards         # regenerate the six that come from data/
npm run cards:verify  # fail if a checked-in copy has drifted (in verify + CI)
npm run cards:check   # no external requests, no inline CSS, real letter pages
```

Every card is indexed at [`/reference/`](docs/reference/index.md) and linked
from the chapter it condenses. **Nothing lives only on a card** — if you add a
fact to one, add it to a chapter too.

`cards/archive/` holds superseded sheets: the BIOS v1.0–v1.4 references and the
two KIM LED walk-throughs. They are kept as the record of what each firmware
release documented, not as current documentation.

See [`ASSETS-MIGRATION.md`](ASSETS-MIGRATION.md) for what moved from
`6502-ASSETS`, what was recreated, and what was deliberately dropped:

```sh
npm run migrate         # re-run the migration from a 6502-ASSETS checkout
npm run migrate:check   # fail if that repo holds anything this one doesn't
```

## Accuracy

[`ACCURACY.md`](ACCURACY.md) is the ledger of every place a document in this
ecosystem disagrees with the machine, what the machine actually does, and how
that was established. A later phase fixes each open item in the repo that got
it wrong, not just in these docs.

This file, `PLAN.md`, `IMAGES.md` and `ASSETS-MIGRATION.md` are the project's
own working notes. **None of their vocabulary belongs on the site** — see
*Voice & Style*.

## Deploying

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages automatically. No manual steps.

## Repository layout

| Path | Purpose |
|---|---|
| `docs/` | VitePress site source (pages, theme, public assets) |
| `docs/public/cards/` | Printable HTML quick-reference cards, served raw at `/cards/` |
| `data/` | Machine-readable fact base, generated — consumed by the docs at build time |
| `samples/` | Verified BASIC/assembly listings backing every listing in the docs |
| `scripts/` | Fact extractor, sample harness, voice check, toolchain preflight, asset migration |
| `assets/` | Design sources — logos, label artwork, and the `.afdesign`/`.numbers` originals pending HTML recreation. Never served; see [`assets/README.md`](assets/README.md). |
| `ACCURACY.md` | Ledger of factual discrepancies found and fixed |
| `ASSETS-MIGRATION.md` | What moved out of `6502-ASSETS`, and the evidence for retiring it |

## Sibling repositories

| Repo | Purpose |
|---|---|
| [6502-BIOS](https://github.com/acwright/6502-BIOS) | Shared BIOS — Kernal, BASIC, Monitor. Source of truth for software behaviour. |
| [6502-EMULATOR](https://github.com/acwright/6502-EMULATOR) | Desktop/browser emulator and CLI used to verify every sample in these docs. |
| [6502-ACE](https://github.com/acwright/6502-ACE) | **The machine this site documents.** All-in-one single-board computer. |
| [6502-COB](https://github.com/acwright/6502-COB) | Backplane and card-based system. Builder-facing. |
| [6502-DEV](https://github.com/acwright/6502-DEV) | Teensy-emulated CPU development vehicle. Builder-facing. |
| [6502-KIM](https://github.com/acwright/6502-KIM) | Keypad/LCD boards — an ACE add-on, and a standalone build. |
| [6502-VCS](https://github.com/acwright/6502-VCS) | Cartridge-based console. Builder-facing. |
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
