; Banked RAM — a kilobyte-wide window onto 256 kilobytes of memory.
;
; The window sits at $8000. Writing a bank number to the latch at its top end
; swings a different kilobyte into view; everything below stays exactly where
; it was. This puts a different message in two banks and then goes back for
; both of them.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Source := $40                   ; a spare pair of zero-page bytes

Start:
  lda #3
  jsr SelectBank
  lda #<Spring
  ldy #>Spring
  jsr StoreInBank

  lda #9
  jsr SelectBank
  lda #<Autumn
  ldy #>Autumn
  jsr StoreInBank

  lda #3                        ; back for the first one
  jsr SelectBank
  jsr ShowBank

  lda #9
  jsr SelectBank
  jsr ShowBank
  rts

; Swing bank A into the window. The latch cannot be read back, so a program
; that needs to know where it is keeps its own note.
SelectBank:
  sta RAM_BANK_L
  sta CurrentBank
  rts

; Copy the NUL-terminated string at A/Y into the window.
StoreInBank:
  sta Source
  sty Source + 1
  ldy #0
@copy:
  lda (Source),y
  sta RAM_DATA_L,y              ; whichever kilobyte is in the window right now
  beq @done
  iny
  bra @copy
@done:
  rts

; Print "BANK n HOLDS <whatever is in the window>".
ShowBank:
  lda #<Holds
  ldy #>Holds
  jsr PrintStr
  lda CurrentBank
  ldx #0
  jsr PrintDecU16
  lda #' '
  jsr Chrout
  lda #<RAM_DATA_L
  ldy #>RAM_DATA_L
  jsr PrintStr
  jmp PrintCRLF

CurrentBank: .byte 0

Holds:  .byte "BANK ", $00
Spring: .byte "SNOWDROPS AND MUD", $00
Autumn: .byte "APPLES AND WOODSMOKE", $00
