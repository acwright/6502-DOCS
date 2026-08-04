; Reading a line of typing, one key at a time.
;
; Getting a key never blocks: you ask, and you are told either "here it is" or
; "nothing yet". A program that wants a whole line asks in a loop, which is
; also a program that can get on with something else between keys.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

NAME_MAX = 16

Start:
  lda #<Question
  ldy #>Question
  jsr PrintStr

  ldx #0                        ; how much of the name we have so far
Reading:
  jsr Chrin                     ; carry clear means nothing arrived yet
  bcc Reading
  cmp #CHAR_CR                  ; Enter ends the line
  beq Done
  cpx #NAME_MAX                 ; anything longer than the box is dropped
  bcs Reading
  sta Name,x
  inx
  bra Reading

Done:
  stz Name,x                    ; a string ends with a zero
  jsr PrintCRLF

  lda #<Hello
  ldy #>Hello
  jsr PrintStr
  lda #<Name
  ldy #>Name
  jsr PrintStr
  lda #'!'
  jsr Chrout
  jsr PrintCRLF
  rts

Name: .res NAME_MAX + 1

Question: .byte "WHAT IS YOUR NAME? ", $00
Hello:    .byte "PLEASED TO MEET YOU, ", $00
