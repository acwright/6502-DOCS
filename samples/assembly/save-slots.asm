; A game's save, kept in one of the clock card's sixteen save slots: find the
; slot, write a record, read it back, then damage one byte and watch the
; Kernal refuse to load it.
;
; The Kernal does the checksum. All the game decides is its owner ID and what
; its 14 bytes mean: here a level, a two-byte score and an eleven-letter name.

.setcpu "65C02"

.include "6502-VDP.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

GAME_ID = $5A                   ; any value but $00, which means "free"

Start:
; On a ROM older than v1.6 these six entries are reserved slots: a bare RTS
; that leaves carry as it found it. Ask the ROM before trusting the answers.
  jsr KernalVersion             ; A = major, X = minor
  cmp #1
  bcc @old
  bne @new
  cpx #6
  bcs @new
@old:
  lda #<TooOld
  ldy #>TooOld
  jmp PrintStr

@new:
  lda #GAME_ID
  jsr NvFind                    ; X = our slot, carry set if we have none
  bcc @ours
  lda #$00
  jsr NvFind                    ; X = the first free slot
  bcc @free
  lda #<NoRoom
  ldy #>NoRoom
  jmp PrintStr

@ours:
  stx Slot
  lda #<Found
  ldy #>Found
  bra @report
@free:
  stx Slot
  lda #<NoSave
  ldy #>NoSave
@report:
  jsr PrintStr
  jsr PrintSlot
  jsr PrintCRLF

; Save. The owner ID goes in NV_ID; the 14 bytes go by address.
  lda #GAME_ID
  sta NV_ID
  ldx Slot
  lda #<Record
  ldy #>Record
  jsr NvWrite
  bcs Failed

; Load it into a different buffer, so what is printed really came back.
  ldx Slot
  jsr NvStat                    ; A = NV_EMPTY, NV_VALID or NV_BAD
  cmp #NV_VALID
  bne Failed
  lda #<Loaded
  ldy #>Loaded
  jsr NvRead
  bcs Failed
  jsr PrintRecord

; Now damage it: flip every bit of the level byte, going around the Kernal.
  lda Slot                      ; slot n starts at NVRAM n * 16
  asl
  asl
  asl
  asl
  ora #2                        ; + 2 skips the owner ID and the checksum
  sta Where
  tax
  jsr RtcReadNVRAM
  eor #$FF
  ldx Where
  jsr RtcWriteNVRAM

  ldx Slot
  lda #<Loaded
  ldy #>Loaded
  jsr NvRead                    ; carry set: A = its status, Y = its owner
  bcc Failed
  cmp #NV_BAD
  bne Failed
  phy
  lda #<Damaged
  ldy #>Damaged
  jsr PrintStr
  jsr PrintSlot
  lda #<Owner
  ldy #>Owner
  jsr PrintStr
  pla
  ldx #0
  jsr PrintDecU16
  jmp PrintCRLF

Failed:
  lda #<Trouble
  ldy #>Trouble
  jmp PrintStr

; "LEVEL 3, SCORE 1250, ADA" from the 14 bytes at Loaded.
PrintRecord:
  lda #<Level
  ldy #>Level
  jsr PrintStr
  lda Loaded
  ldx #0
  jsr PrintDecU16
  lda #<Score
  ldy #>Score
  jsr PrintStr
  lda Loaded + 1
  ldx Loaded + 2
  jsr PrintDecU16
  lda #<Comma
  ldy #>Comma
  jsr PrintStr
  lda #<(Loaded + 3)            ; the name is zero-padded, so it prints as is
  ldy #>(Loaded + 3)
  jsr PrintStr
  jmp PrintCRLF

PrintSlot:
  lda Slot
  ldx #0
  jmp PrintDecU16

Slot:    .byte 0
Where:   .byte 0

; The record as the game keeps it: exactly 14 bytes, the name zero-padded to
; eleven.
Record:
  .byte 3                       ; level
  .word 1250                    ; score
  .byte "ADA", 0, 0, 0, 0, 0, 0, 0, 0

; Where it comes back to. The byte past the 14 ends an eleven-letter name.
Loaded:  .res 15, 0

TooOld:  .byte "THIS ROM HAS NO SAVE SLOTS", $0D, $0A, $00
NoRoom:  .byte "EVERY SLOT IS TAKEN", $0D, $0A, $00
NoSave:  .byte "NO SAVE YET - USING FREE SLOT ", $00
Found:   .byte "FOUND OUR SAVE IN SLOT ", $00
Level:   .byte "LOADED LEVEL ", $00
Score:   .byte ", SCORE ", $00
Comma:   .byte ", ", $00
Damaged: .byte "SLOT ", $00
Owner:   .byte " IS DAMAGED - OWNER ", $00
Trouble: .byte "THE CLOCK CARD DID NOT ANSWER", $0D, $0A, $00
