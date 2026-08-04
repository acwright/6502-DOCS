; Hello world, in 65C02 assembly: assemble with cl65, load the .prg, RUN it
; from BASIC.
;
; Console output goes through Chrout, which routes to video or serial by
; IO_MODE — so this same program prints on a machine with a video card and on
; one running headless over the serial port, with no change.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

; A tokenized BASIC line — `10 SYS 2060` — so that LOAD + RUN reaches the
; machine code at $080C (2060). This stub stays at the very start of the image.
BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

; Entry point ($080C). The machine is fully initialized by the time this runs:
; hardware probed, interrupts enabled, console chosen. Return to BASIC with RTS.
Start:
  lda #<Message
  ldy #>Message
  jsr PrintStr
  rts

Message:
  .byte "HELLO FROM ASSEMBLY", CHAR_CR, CHAR_LF, $00
