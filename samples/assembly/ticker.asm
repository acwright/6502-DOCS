; Counting interrupts — a handler of your own, hooked in front of the one the
; machine already runs.
;
; Every key that arrives interrupts the processor. This program adds a link to
; the front of that chain, counts what goes past, then unhooks itself and says
; how many it saw. The counting handler is one instruction long on purpose:
; the handler behind it reads the processor status off the stack at a fixed
; depth, so a link in the chain must leave the stack exactly as it found it.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Start:
  stz Count

  lda #<Prompt
  ldy #>Prompt
  jsr PrintStr

  sei                           ; never swap a vector with interrupts live
  lda IRQ_PTR
  sta Chain
  lda IRQ_PTR + 1
  sta Chain + 1
  lda #<CountOne
  sta IRQ_PTR
  lda #>CountOne
  sta IRQ_PTR + 1
  cli

Waiting:
  jsr Chrin                     ; carry set = a key was waiting, already echoed
  bcc Waiting
  cmp #CHAR_CR
  bne Waiting

  sei                           ; put the old handler back
  lda Chain
  sta IRQ_PTR
  lda Chain + 1
  sta IRQ_PTR + 1
  cli

  jsr PrintCRLF
  lda #<Saw
  ldy #>Saw
  jsr PrintStr
  lda Count
  ldx #0
  jsr PrintDecU16
  lda #<Times
  ldy #>Times
  jsr PrintStr
  jsr PrintCRLF
  rts

; The new front of the chain. INC touches no register and pushes nothing, so
; the handler it hands over to finds the stack the way the processor left it.
CountOne:
  inc Count
  jmp (Chain)

Count:  .byte 0
Chain:  .word 0

Prompt: .byte "TYPE SOMETHING AND PRESS ENTER", CHAR_CR, CHAR_LF, $00
Saw:    .byte "THE PROCESSOR WAS INTERRUPTED ", $00
Times:  .byte " TIMES", $00
