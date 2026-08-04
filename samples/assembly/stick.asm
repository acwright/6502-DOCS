; Reading the joysticks.
;
; A stick reports the opposite of what you would guess: a bit reads 1 while
; nothing is happening and drops to 0 while a direction or a button is held.
; So the test for "up is held" is that the up bit came back zero.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Reading := $40
Anything := $41

Start:
  lda #<Prompt
  ldy #>Prompt
  jsr PrintStr

Waiting:
  jsr Chrin
  bcc Waiting
  cmp #CHAR_CR
  bne Waiting
  jsr PrintCRLF

  lda #<One
  ldy #>One
  jsr PrintStr
  jsr ReadJoystick1
  jsr Report

  lda #<Two
  ldy #>Two
  jsr PrintStr
  jsr ReadJoystick2
  jsr Report
  rts

; Name every direction and button that is being held. A = the stick reading.
Report:
  sta Reading
  stz Anything
  ldx #0
@next:
  lda Mask,x
  and Reading
  bne @skip                     ; bit still high — that one is not held
  inc Anything
  lda Name_lo,x
  ldy Name_hi,x
  jsr PrintStr
@skip:
  inx
  cpx #8
  bne @next

  lda Anything
  bne @done
  lda #<Nothing
  ldy #>Nothing
  jsr PrintStr
@done:
  jmp PrintCRLF

Mask:
  .byte JOY_U, JOY_D, JOY_L, JOY_R, JOY_A, JOY_B, JOY_X, JOY_Y
Name_lo:
  .lobytes Up, Down, LeftWay, RightWay, ButtonA, ButtonB, ButtonX, ButtonY
Name_hi:
  .hibytes Up, Down, LeftWay, RightWay, ButtonA, ButtonB, ButtonX, ButtonY

Prompt:   .byte "HOLD A STICK, THEN PRESS ENTER", CHAR_CR, CHAR_LF, $00
One:      .byte "STICK 1: ", $00
Two:      .byte "STICK 2: ", $00
Nothing:  .byte "NOTHING", $00

Up:       .byte "UP ", $00
Down:     .byte "DOWN ", $00
LeftWay:  .byte "LEFT ", $00
RightWay: .byte "RIGHT ", $00
ButtonA:  .byte "A ", $00
ButtonB:  .byte "B ", $00
ButtonX:  .byte "X ", $00
ButtonY:  .byte "Y ", $00
