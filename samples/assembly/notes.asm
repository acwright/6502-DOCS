; Reading and writing files on the memory card.
;
; Three things have to be true before a load or a save: a pointer to the name,
; a pointer to where the bytes live, and — for a save — how many of them there
; are. Then one call does the rest, and the carry flag says whether it worked.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Start:
  lda HW_PRESENT
  and #HW_CF
  beq NoCard

; --- Read a file that is already there ---------------------------------------
  lda #<HelloName
  ldy #>HelloName
  jsr SetName
  lda #<Buffer
  sta FS_IO_ADDR
  lda #>Buffer
  sta FS_IO_ADDR + 1
  jsr FsLoadFileAddr
  bcs Failed                    ; carry set means it did not happen

  lda #<Found
  ldy #>Found
  jsr PrintStr
  jsr PrintBuffer

; --- Write one of our own ----------------------------------------------------
  ldy #0
@copy:
  lda Note,y
  sta Buffer,y
  beq @copied
  iny
  bra @copy
@copied:
  sty FS_FILE_SIZE              ; the terminator itself is not saved
  stz FS_FILE_SIZE + 1

  lda #<NoteName
  ldy #>NoteName
  jsr SetName
  lda #<Buffer
  sta FS_IO_ADDR
  lda #>Buffer
  sta FS_IO_ADDR + 1
  jsr FsSaveFileAddr
  bcs Failed

; --- And read it straight back ----------------------------------------------
  lda #0                        ; wipe the buffer so the read has to do the work
  ldy #0
@wipe:
  sta Buffer,y                  ; STZ has no Y-indexed form; STA does
  iny
  cpy #64
  bne @wipe

  lda #<NoteName
  ldy #>NoteName
  jsr SetName
  lda #<Buffer
  sta FS_IO_ADDR
  lda #>Buffer
  sta FS_IO_ADDR + 1
  jsr FsLoadFileAddr
  bcs Failed

  lda #<Back
  ldy #>Back
  jsr PrintStr
  jsr PrintBuffer
  rts

Failed:
  lda #<Trouble
  ldy #>Trouble
  jsr PrintStr
  rts

NoCard:
  lda #<NoCardMsg
  ldy #>NoCardMsg
  jsr PrintStr
  rts

; Point the filesystem at a name. A/Y = address of a NUL-terminated 8.3 name.
SetName:
  sta STR_PTR
  sty STR_PTR + 1
  rts

; Print however many bytes the last load brought in.
PrintBuffer:
  ldy #0
@next:
  cpy FS_FILE_SIZE              ; these files are far smaller than a page
  beq @done
  lda Buffer,y
  phy
  jsr Chrout
  ply
  iny
  bra @next
@done:
  jmp PrintCRLF

HelloName: .byte "HELLO.TXT", $00
NoteName:  .byte "NOTE.TXT", $00
Note:      .byte "WRITTEN BY A PROGRAM", $00

Found:     .byte "THE CARD ALREADY HELD: ", $00
Back:      .byte "AND NOW IT HOLDS: ", $00
Trouble:   .byte "THE CARD SAID NO", CHAR_CR, CHAR_LF, $00
NoCardMsg: .byte "NO MEMORY CARD FITTED", CHAR_CR, CHAR_LF, $00

Buffer:    .res 64
