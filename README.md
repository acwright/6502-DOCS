# 6502-DOCS

The user's and programmer's guide for the **ACE** — the flagship of the AC6502
family of homebrew 65C02 computers. A friendly, tutorial-first manual in the
spirit of the Commodore 64 and VIC-20 books that came in the box, and a
companion to the more technical READMEs in the sibling repos below.

Published at **<https://acwright.github.io/6502-DOCS/>**.

Built with [VitePress](https://vitepress.dev/), deployed to GitHub Pages.
See [`PLAN.md`](PLAN.md) for the full multi-phase build plan, sources of
truth, and verification method.

**The site describes BIOS v1.5, and every sample, screenshot and embedded
program in it was produced by emulator 2.6.1.** Those are the two versions that
move, and both are now gates rather than notes: `npm run check:voice` fails on a
page stating a BIOS version the firmware disagrees with, and `npm run preflight`
fails on an emulator that is not the one in `data/emulator.json`. See
[Maintenance](#maintenance) for what to do when either moves.

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

## Pictures

Three kinds, three pipelines, and one rule: **a picture ships when it shows
something the prose cannot say as quickly.** [`IMAGES.md`](IMAGES.md) is the
ledger — every image the site uses, where it came from, and what is still a
placeholder waiting on a camera.

```sh
npm run screens       # re-take every emulator screenshot
npm run diagrams      # redraw every diagram
npm run diagrams:verify   # fail if a checked-in drawing has drifted (in verify + CI)
npm run photos        # re-import the photographs from the KiCad repos
npm run photos:check  # fail if one a page references is missing (in verify + CI)
```

**Screenshots** (`docs/public/images/screens/`) come off a real machine:
`scripts/capture-screens.mjs` boots the emulator with a video console, types
what a reader would type, and reads the screen with `dbg screen png`. Where a
shot shows a program it names the file under `samples/` that the chapter
displays, so the picture cannot drift from the listing beside it. Re-take them
after a ROM change — they are not drift-checked, because that would mean
asserting on a PNG encoder.

**Diagrams** (`docs/.vitepress/diagrams/`) are drawn by
`scripts/build-diagrams.mjs`, nine of the fifteen straight out of `data/`. They
carry no color: every shape is `currentColor` at a fixed opacity, which is what
lets one file serve the light and the dark theme. That is also why they are
inlined into the page by `<Diagram>` rather than linked as an `<img>` — an
`<img>` is a separate document and cannot see the site's variables. Style them
in `docs/.vitepress/theme/style.css`, under the `.dg-*` classes.

**Photographs** (`docs/public/images/photos/`) are imported from the `Images/`
directory of each KiCad repo by `scripts/import-photos.mjs`, which records the
crop and the resize so the same command produces the same picture. The sources
live in sibling repos, so the import runs on a machine that has them and the
outputs are committed; CI only checks that every declared file is present.

Pages use three components, all registered in
[`docs/.vitepress/theme/index.ts`](docs/.vitepress/theme/index.ts):

```
<Figure src="/images/photos/ace.jpg" alt="…" caption="…" />      a photograph
<Figure src="/images/screens/wozmon.png" alt="…" caption="…" screen />
<Diagram name="memory-map" caption="…" />                        a drawing
<PlaceholderImage label="…" caption="…" />                       not shot yet
```

A placeholder's caption **describes the picture and nothing else** — no phase
numbers, no script names, no accuracy notes. Those go in `IMAGES.md`.

## Running machines on a page

Twenty-seven machines sit on nineteen pages, each beside the listing it belongs
to, in a frame around the emulator's second web entry point. That page is served
from the same origin as this site, so a frame costs no third-party request and
no CSP allowance.

```
<Emulator caption="…" />                             an empty machine
<Emulator sample="basic/times-table" caption="…" />  loaded and RUN
<Emulator sample="basic/goto-loop" :run="false" />   loaded, not run
<Emulator sample="basic/tune" sound caption="…" />   starts unmuted
<Emulator countdown caption="…" />                   sits through the boot menu
```

To add one:

1. Add the sample's path to `EMBEDS` in `scripts/build-embeds.mjs`.
2. `npm run embeds`, which writes the program's bytes into `data/embeds.json`
   using the same tools the harness uses — `bastok` for a BASIC listing, `cl65`
   for an assembly one.
3. Put `<Emulator sample="…">` on the page, next to the listing it belongs to.

The program travels in the URL rather than being fetched, so a chapter is
self-contained on the dev server as well as the deployed site — and, more to the
point, **the program that runs cannot be a different program from the one
printed above it**. `npm run verify` rebuilds every payload and fails if a
listing has moved without its bytes moving with it.

Four rules the component enforces rather than documents:

- **The frame enters the DOM on the click and not before**, so it is absent from
  the built HTML and from print, and a page with four machines on it emulates
  nothing until asked.
- **An embed never replaces a picture.** Every page that gained one kept the
  screenshot it had; print and no-JS readers lose nothing.
- **There is no `persist` prop.** Persistence is one IndexedDB record per
  origin, shared with the full web emulator on this same origin — an embed that
  saved its own small card would become what a reader's app restores. The
  parameter is not accepted rather than defaulted off.
- **Captions describe the machine, not the mechanism.** `npm run check:voice`
  fails on *iframe*, *base64*, *embed* and *postMessage* anywhere under `docs/`
  except one section of the emulator chapter, which is the one place the
  mechanism is what the reader came for.

Samples that read a memory card are not embeddable — the frame's card is blank,
and the smallest image `cffs` makes is a megabyte, which is not going in a URL.
There are no embeds under `/f18a/` either: the emulator is a faithful TMS9918A
and masks the register writes those chapters are about.

## Accuracy

[`ACCURACY.md`](ACCURACY.md) is the ledger of every place a document in this
ecosystem disagrees with the machine, what the machine actually does, and how
that was established. A later phase fixes each open item in the repo that got
it wrong, not just in these docs.

This file, `PLAN.md`, `IMAGES.md` and `ASSETS-MIGRATION.md` are the project's
own working notes. **None of their vocabulary belongs on the site** — see
*Voice & Style*.

## Maintenance

This site is generated from a machine that is still being worked on. Almost
everything on it — the tables, the cards, the diagrams, the listings, the
screenshots — is derived from the BIOS source or produced by running the ROM,
so the day the firmware moves, a lot of pages are quietly wrong until someone
re-derives them. These are the steps that do it, and the order matters.

### The rule

**A new BIOS feature ships with a docs page and a passing sample.** Not a
release note, not a line in a table: a chapter that tells a reader what to type
and a file under `samples/` that proves the machine answers. A feature nobody
can find and nobody has run is not finished. The same goes the other way — a
statement the ROM stops accepting is a broken sample, and the harness will say
so before a reader does.

### After a BIOS release

Run these in order from a checkout with the new firmware built. Each one either
prints `ok` or tells you what moved.

```sh
npm run facts         # re-extract data/ from the BIOS source
git diff data/        # read this — it is the release notes, mechanically derived
npm run cards         # the six generated cards follow the fact base
npm run diagrams      # so do nine of the fifteen diagrams
npm run verify        # every listing, every keyword example, against the new ROM
npm run screens:verify # did anything the reader looks at change?
npm run links         # nothing above should have broken a link, but check
```

`git diff data/` is the important one and the easy one to skip. It is the only
place the firmware's changes show up as a list, and every later step is
downstream of it. A new Kernal slot, a renamed error string, a moved buffer —
all of it appears there first.

If `npm run screens:verify` reports drift, **look at the picture before
accepting it**: run `npm run screens` and open what changed. A screenshot that
changed because the splash gained a line is a fix; one that changed because a
demo now crashes is a bug the harness may not have caught.

### Bumping the documented version

`data/boot.json` carries the version string, extracted from `BIOS.inc`, and the
site footer reads it at build time — so for the footer, `npm run facts` is the
whole bump.

Pages are not all so lucky. A handful state the version in prose, and three
show the splash screen as a transcript inside a code fence, where nothing can
interpolate. Those are typed by hand and have to be edited by hand — which is
exactly how the sheets this site replaced ended up describing a v1.0 ROM. So
`npm run check:voice` fails on any version stated next to the word *BIOS* that
disagrees with the fact base:

```
docs/reference/glossary.md:24  stale BIOS version — "BIOS v1.4"
       the firmware reports v1.5; re-run `npm run facts` and fix the page
```

Links into `cards/archive/` are exempt, since naming an old version is what
that directory is for.

The emulator version is pinned in `data/emulator.json`, hand-authored like
`basic-examples.json` and `f18a.json`, and it is a gate: `npm run preflight`
compares `6502 --version` against it and fails on anything else. That matters
more than it used to, because three different things now come off one release —
the samples' output, the screenshots' pixels, and the bytes of every program a
chapter offers to run. A run on a different release is not the check it looks
like.

`npm run check:voice` covers the other half, the numbers a page states in prose:
every three-part version in `docs/` has to be the pinned one, which catches the
two chapters that quote `6502 --version` and `6502 dbg info` inside a code
fence, where nothing can interpolate.

To bump it:

```sh
# 1. Edit data/emulator.json, then:
npm run preflight     # confirms the installed CLI is the release you named
npm run facts         # a new bundle may carry a rebuilt ROM — read git diff data/
npm run verify        # samples and embedded payloads, against the new release
npm run screens:verify
npm run links         # frame parameters are checked against the contract here
```

Bump `EMULATOR_REF` in `.github/workflows/verify.yml` to the matching tag in the
same commit, or CI will build a different emulator from the one preflight
demands.

### Superseded documentation

Old BIOS reference cards move to `docs/public/cards/archive/` rather than being
deleted — they are the record of what each firmware release documented. They
are outside `npm run cards:verify`, so they are never regenerated against a ROM
they never described, but `npm run cards:check` still holds them to the print
rules like any other card.

### Checking links

```sh
npm run links           # the built site plus this repo's notes, network included
npm run links:offline   # structure and anchors only, no network
```

Needs `npm run docs:build` first: it reads the build, not the Markdown, which
is how it sees component `src`s, the raw HTML cards and every anchor. An HTTP
error fails it; a host that refuses the connection outright, or answers 429, is
reported as unchecked — a reset is not an answer, and neither is "you are asking
too often" from a shared CI address. It runs in CI after the build.

It also checks the emulator frame's query strings against the parameter table in
`data/emulator.json`. The frame ignores a parameter it has never heard of, by
design, so that a page pinned to an old release keeps working — which means a
misspelled or renamed parameter here would fail silently and forever. Three
places are covered: the examples the emulator chapter prints, the starter page a
reader is invited to upload, and the `<Emulator>` component, whose URLs are
assembled in the browser and appear as text nowhere.

## Deploying

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages automatically. No manual steps.

## Repository layout

| Path | Purpose |
|---|---|
| `docs/` | VitePress site source (pages, theme, public assets) |
| `docs/public/cards/` | Printable HTML quick-reference cards, served raw at `/cards/` |
| `data/` | Machine-readable fact base, generated — consumed by the docs at build time |
| `samples/` | Verified BASIC/assembly listings backing every listing in the docs, plus the starter page under `samples/embed/` |
| `scripts/` | Fact extractor, sample harness, voice check, link check, toolchain preflight, asset migration, card/diagram/embed builders, screenshot capture, photo import |
| `docs/.vitepress/diagrams/` | Generated SVG diagrams, inlined into pages by `<Diagram>` |
| `docs/public/images/` | Screenshots, photographs and branding, served as-is |
| `assets/` | Design sources — logos, label artwork, and the `.afdesign`/`.numbers` originals pending HTML recreation. Never served; see [`assets/README.md`](assets/README.md). |
| `ACCURACY.md` | Ledger of factual discrepancies found and fixed |
| `ASSETS-MIGRATION.md` | What moved out of `6502-ASSETS`, and the evidence for retiring it |
| `IMAGES.md` | Every image the site uses, how it is made, and what is still a placeholder |

## Sibling repositories

| Repo | Purpose |
|---|---|
| [6502-BIOS](https://github.com/acwright/6502-BIOS) | Shared BIOS — Kernal, BASIC, Monitor. Source of truth for software behavior. |
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

## License

[MIT](LICENSE).
