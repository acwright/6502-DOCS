# Storage

An 8-bit True IDE CompactFlash card is the family's disk. VCS is the one
machine that doesn't have a slot for one at all — cartridges are its storage,
see [its system page](/systems/vcs).

## The disk-bank model

One CompactFlash card holds up to 256 **disk banks**, 1 MB each — `DISK n`
selects which bank subsequent commands operate on (`n` is `0`–`255`). Each
bank has its own 16-entry directory; filenames follow the 8.3 convention
(8 characters, a dot, a 3-character extension), the same shape DOS and CP/M
readers will already recognize.

## The commands

<<< @/../samples/basic/storage-dir-load.bas{basic}

RUN-verified against a real CompactFlash image (`console storage` in this
repo's test harness, a genuine `cffs`-built disk attached to the emulator via
`--cf`, not a mock):

```
RUN
READY

OK
DIR
DISK 0
HELLO   .TXT 8

OK
LOAD "HELLO.TXT"

OK
```

`DIR` lists the current bank's directory: disk number, then each file as
`NAME.EXT` (padded to the 8.3 field width) and its size in bytes. `LOAD
"name"` (quotes required) loads a file from the card; bare `LOAD` — no
filename — switches to XModem instead, covered in
[Serial & XModem](/using/serial). `SAVE` and `SAVE "name"` work the same way
in reverse.

`DEL "name"` removes a directory entry — RUN-verified: after
`DEL "HELLO.TXT"`, a following `DIR` shows an empty bank.

### Binary data — `BLOAD`/`BSAVE`

`BSAVE addr, len, "name"` writes `len` bytes starting at `addr` to a file;
`BLOAD addr, "name"` reads them back. Unlike `LOAD`/`SAVE`, which always deal
in whatever is currently in BASIC's program area, `BLOAD`/`BSAVE` work with
any address — screen data, a character set, a sound patch. RUN-verified round
trip:

<<< @/../samples/basic/storage-bsave-bload.bas{basic}

A byte poked to `$0A00`, saved, zeroed, and loaded back reads unchanged.

### `FORMAT`

`FORMAT` erases the current bank's directory — every entry, not the file
data itself. It asks first:

```
FORMAT
ERASE DISK 0? (Y/N) Y

OK
```

Anything but `Y` aborts with no change. This one isn't in the `samples/`
harness (its confirmation prompt doesn't fit the harness's one-shot
run-and-assert model cleanly), but the transcript above is a direct RUN
check against the real emulator, typed exactly as shown.

## The 16-entry / 8.3 limit

Each bank's directory holds exactly 16 entries — confirmed both in the ROM
source (`Kernal.asm`'s `FS_MAX_FILES`) and by `cffs info` on a real image
(`Directory: 1/16 entries used, 15 free`, the same tool this harness uses to
build its test fixture). A 17th file needs a different bank (`DISK n`), not a
bigger directory.

## When there's no card

Every storage command guards on the CompactFlash bit in `HW_PRESENT`
(`ReqHw`, `BASIC.asm:7976`) and raises `?NO DEVICE ERROR` if it's clear,
rather than hanging — the same graceful-degradation pattern as
[sound and video](/using/sound-and-video) with no card fitted.

::: warning Not RUN-verified
Every other claim on this page was checked by actually running it. This one
wasn't: the current emulator CLI has no way to boot a machine with the
Storage card removed entirely — `--cf` only attaches a backing image to a
card that's always present in the default headless profile, so a run with no
`--cf` flag still reports the card as fitted (an empty, working disk) rather
than absent. Recorded as [ACCURACY.md O5](https://github.com/acwright/6502-DOCS/blob/main/ACCURACY.md)
— the error text and the guard that raises it are real and read straight
from the ROM source, but reproducing the condition itself is currently
outside what the tooling can simulate.
:::

<PlaceholderImage
  label="CF disk-bank / directory model"
  caption="A diagram of the 256-bank / 16-entry model, once Phase 8 authors the family's hand-drawn SVGs."
/>
