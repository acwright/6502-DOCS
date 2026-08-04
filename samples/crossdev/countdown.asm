; A countdown, in 65C02 assembly — the program the cross-development chapters
; build, run, debug and test.
;
; It counts down from ten, prints each number, and signs off. Console output
; goes through the Kernal, which routes it to the screen or the serial port
; depending on what the machine has, so this same file runs on an ACE with a
; monitor attached and on a headless emulator with no change.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

; A tokenized BASIC line — `10 SYS 2060` — so LOAD and RUN reach the machine
; code at $080C (2060). This stub stays at the very start of the image.
BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

; Zero page from $3A up is yours. This is the only byte this program needs.
; `:=` rather than `=` so the name reaches the label file and the debugger can
; talk about it by name.
Counter := $40

; Entry point ($080C). Return to BASIC with RTS.
Start:
  lda #10
  sta Counter

CountLoop:
  lda Counter                   ; low byte of the number to print
  ldx #0                        ; high byte — nothing here counts past 255
  jsr PrintDecU16
  jsr PrintCRLF
  dec Counter
  bne CountLoop

  lda #<LiftOff
  ldy #>LiftOff
  jsr PrintStr
  rts

LiftOff:
  .byte "LIFT OFF", CHAR_CR, CHAR_LF, $00
