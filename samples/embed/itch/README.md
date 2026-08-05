# A playable link, in two files

Zip this folder and upload it to [itch.io](https://itch.io/) as an HTML
project. That is the whole job — the page inside frames the 6502 emulator and
points it at `game.prg`.

`game.prg` is [Treasure Grid](../../basic/treasure.bas), tokenized. Replace it
with your own program and change the `<title>` in `index.html`; nothing else
needs touching.

## Why there is a script in a page that is one iframe

`prg` is fetched by the emulator, and the emulator is served from its own site.
So a relative `prg=game.prg` asks for a file next to *the emulator* — which is
not there, and the visitor gets a working BASIC prompt with a 404 beside it.
The program needs its full `https://…` address, and on itch you do not know
what that is until after you have uploaded.

`new URL('game.prg', location.href)` is how the page works it out at the moment
it loads. It is three lines, and it is the difference between the folder
working as uploaded and not working at all.

## Uploading it

Create a new project, then:

| Field | Value |
|---|---|
| **Kind of project** | HTML |
| **Upload** | this folder, zipped, with **This file will be played in the browser** ticked |
| **Viewport dimensions** | `640` × `520` |

520 rather than 480 is the video output doubled plus the emulator's own control
bar. Pass `controls=none` in the frame's URL and 640 × 480 fits exactly.

## Getting your own program in

`game.prg` is a raw image loaded at `$0800` — the same bytes `SAVE` writes to a
memory card. Three ways to get one:

```sh
bastok -t -o game.prg game.bas     # from a BASIC listing
make                               # from the 6502-PRG template
```

…or `SAVE "GAME"` on the machine and copy the file off the card with `cffs`.

## Testing it before you upload

**Opening `index.html` from your file system will not load the program.** The
frame's content security policy allows fetches over `https:` only, so a
`file://` path is refused — the emulator boots to a BASIC prompt and says why.
That is not a broken page; it is the one thing that only works once the files
are somewhere with a real certificate.

Two ways to check it properly:

- **Upload it as a draft project on itch.io** and play it there. Drafts are
  private until you publish.
- **Carry the program in the URL instead**, which needs no server at all:

  ```sh
  printf 'prg64=%s' "$(base64 < game.prg | tr '+/' '-_' | tr -d '=\n')"
  ```

  Paste that in place of `prg=game.prg` and the page works from anywhere,
  including a double-click. A few tens of kilobytes is the practical limit.

## How this folder is checked

`index.html` is the file the emulator chapter displays, so the page a reader
copies is this one and cannot drift from it. `game.prg` is written by
`scripts/build-embeds.mjs` from `samples/basic/treasure.bas`, and
`npm run verify` fails if it stops matching that listing.

The upload itself is checked by hand — the harness runs programs, not pages.
See `samples/README.md` for what was done and how to repeat it.
