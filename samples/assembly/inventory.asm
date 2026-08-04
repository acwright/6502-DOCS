; What's fitted — the machine builds a list of its own cards at power-on and
; leaves it in one byte. This reads that byte and names every card it found.
;
; Guarding your own code the same way the Kernal guards its own is the whole
; point: a program that checks before it draws keeps running on a machine with
; no video card instead of hanging.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Start:
  lda #<Header
  ldy #>Header
  jsr PrintStr

  ldx #0
NextCard:
  lda CardName_lo,x             ; the name is padded, so the column lines up
  ldy CardName_hi,x
  jsr PrintStr                  ; PrintStr keeps X for us

  lda Mask,x
  and HW_PRESENT                ; the byte the power-on probe wrote
  beq NotFitted

  lda #<Fitted
  ldy #>Fitted
  bra Report

NotFitted:
  lda #<Missing
  ldy #>Missing

Report:
  jsr PrintStr
  jsr PrintCRLF
  inx
  cpx #8
  bne NextCard
  rts

Mask:
  .byte HW_RAM_L, HW_RAM_H, HW_RTC, HW_CF
  .byte HW_SC, HW_GPIO, HW_SID, HW_VID

CardName_lo:
  .lobytes Ram1, Ram2, Clock, Card, Serial, Input, Sound, Video
CardName_hi:
  .hibytes Ram1, Ram2, Clock, Card, Serial, Input, Sound, Video

Header:  .byte "WHAT THIS MACHINE HAS", CHAR_CR, CHAR_LF, $00
Fitted:  .byte "YES", $00
Missing: .byte "NO", $00

Ram1:    .byte "BANKED RAM, LOW     ", $00
Ram2:    .byte "BANKED RAM, HIGH    ", $00
Clock:   .byte "CLOCK               ", $00
Card:    .byte "MEMORY CARD         ", $00
Serial:  .byte "SERIAL PORT         ", $00
Input:   .byte "KEYBOARD AND STICKS ", $00
Sound:   .byte "SOUND               ", $00
Video:   .byte "VIDEO               ", $00
