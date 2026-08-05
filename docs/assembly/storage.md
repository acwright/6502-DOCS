# Files on the memory card

The CompactFlash card is divided into up to **256 disks** of one megabyte each.
One disk is current at a time, it holds up to **16 files**, and every name is
eight characters plus a three-character extension. That is the whole model, and
it is small enough to keep in your head — see [Storage](/using/storage) for the
same thing from BASIC's side.

## Loading and saving

Everything goes through three places in memory:

| | |
|---|---|
| `STR_PTR` (`$02`) | Points at the filename, which ends with a zero |
| `FS_IO_ADDR` (`$037F`) | Where the bytes go, or come from |
| `FS_FILE_SIZE` (`$034A`) | How many — set by a load, set *by you* before a save |

and then one call, which answers with the carry flag:

| | |
|---|---|
| `FsLoadFileAddr` | Load the named file to `FS_IO_ADDR` |
| `FsSaveFileAddr` | Save `FS_FILE_SIZE` bytes from `FS_IO_ADDR` |
| `FsLoadFile` | The same load, always to `$0800` — how a program gets loaded |
| `FsDeleteFile` | Remove the named file |
| `FsFormatDisk` | Empty the current disk's directory. No confirmation, no undo. |

```asm
  lda #<Name
  sta STR_PTR
  lda #>Name
  sta STR_PTR + 1
  lda #<Buffer
  sta FS_IO_ADDR
  lda #>Buffer
  sta FS_IO_ADDR + 1
  jsr FsLoadFileAddr
  bcs Missing                   ; carry set: not found, or the card said no
  ; FS_FILE_SIZE now holds how many bytes arrived

Name: .byte "LEVEL1.DAT", $00
```

::: warning `FS_FILE_SIZE` is an input to a save
A load fills it in for you. A save reads it, so setting it is your job, and
setting it wrong writes the wrong number of bytes without complaining. Count
the bytes as you build them, or use the difference between two pointers.
:::

## Both directions

<<< @/../samples/assembly/notes.asm{asm}

```
RUN
THE CARD ALREADY HELD: HELLO
AND NOW IT HOLDS: WRITTEN BY A PROGRAM

OK
```

The wipe in the middle matters: without it, a load that silently did nothing
would leave the old bytes sitting in the buffer and the program would print
them back happily.

## Choosing a disk

| | |
|---|---|
| `FsSetDisk` | Disk number in A, 0 to 255 |
| `FsGetDisk` | The current one, back in A |
| `FsPrintDisk` | Print `DISK n` and a new line |

Disk 0 is selected at power-on. A disk is a megabyte, its directory lives in its
first sector, and its files cannot spill into the next one — which makes disks a
genuinely good way to keep a big project's data apart from everything else.

## The card itself

Underneath the filesystem there are three routines that move raw 512-byte
sectors:

| | |
|---|---|
| `StReadSector` | Sector number in `CF_LBA`, destination in `CF_BUF_PTR` |
| `StWriteSector` | The same, the other way |
| `StWaitReady` | Block until the card is not busy |

`CF_LBA` (`$26`) is four bytes, little end first, counting 512-byte sectors from
the start of the card — not from the start of the current disk. A disk's own
first sector is at `disk × 2048`.

```asm
  stz CF_LBA                    ; sector 0 of the card
  stz CF_LBA + 1
  stz CF_LBA + 2
  stz CF_LBA + 3
  lda #<Sector
  sta CF_BUF_PTR
  lda #>Sector
  sta CF_BUF_PTR + 1
  jsr StReadSector
  bcs CardTrouble
```

Both routines advance `CF_BUF_PTR` by 512 on success, so reading a run of
sectors is a loop that only increments `CF_LBA`.

Use these when you want your own layout — a save format, a level pack, a
database — and the sixteen-file directory is in your way. Use the filesystem
calls for anything a person will see the name of.

::: warning `$0600–$07FF` belongs to the filesystem
Every filesystem call reads a sector into the buffer at `$0600` to look at the
directory. If your program is keeping anything in that 512 bytes, one `LOAD`
will eat it. There is 30 KB of program RAM; use it.
:::

## When the card is not there

`HW_PRESENT` has a bit for the storage card, and everything above sets the
carry flag rather than hanging when the card is missing, unformatted, or
wedged. A program that checks the bit once at the start and the carry flag
after each call can say "put a card in" instead of stopping dead:

```asm
  lda HW_PRESENT
  and #HW_CF
  beq NoCard
```

Next: [the serial port](/assembly/serial).
