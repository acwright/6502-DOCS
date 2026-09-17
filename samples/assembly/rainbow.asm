; A color for every character, and a color that changes everywhere at once.
;
; The pen is the pair of colors the next character is drawn in. Change it
; between lines and each line keeps the colors it was printed with. The palette
; is what those color numbers mean, so changing one entry recolors every
; character drawn with it, on the spot.

.setcpu "65C02"

.include "6502-VDP.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

ORANGE_R  = $0F                 ; a palette entry is %0000RRRR ...
ORANGE_GB = $80                 ; ... then %GGGGBBBB

Color := $40

Start:
  jsr KernalVersion             ; A = major version
  cmp #2
  bcc NoCard                    ; before 2.0 there is no palette to change
  jsr VdpInfo                   ; carry set: no 6502-PICOVDP
  bcs NoCard

  lda #(TMS_WHITE << 4) | TMS_BLACK
  jsr VideoSetColor             ; white on black, and a black border
  jsr VideoClear                ; the whole screen in that pen

  lda #<Title
  ldy #>Title
  jsr PrintStr

  lda #TMS_MED_GREEN            ; every color from 2 to 15, on black
  sta Color
@line:
  lda Color
  asl a
  asl a
  asl a
  asl a                         ; the color as the foreground nibble
  ora #TMS_BLACK
  jsr VideoSetColor             ; only what prints from here on
  lda Color
  asl a
  tax
  lda Names,x
  ldy Names+1,x
  jsr PrintStr
  inc Color
  lda Color
  cmp #16
  bne @line

  lda #(TMS_WHITE << 4) | TMS_BLACK
  jsr VideoSetColor
  lda #<Change
  ldy #>Change
  jsr PrintStr
  jsr WaitKey

  ldx #TMS_MAGENTA              ; entry 13 becomes orange ...
  lda #ORANGE_R
  ldy #ORANGE_GB
  jsr VdpSetPalette             ; ... and so does every character drawn in it

  lda #<Restore
  ldy #>Restore
  jsr PrintStr
  jsr WaitKey

  jmp InitVideo                 ; row 0 of the palette back as it was

NoCard:
  lda #<NeedsCard
  ldy #>NeedsCard
  jmp PrintStr

; Wait for a key without printing it: Chrin would echo it to the screen.
WaitKey:
  jsr BufferSize                ; how many keys are waiting
  beq WaitKey
  jmp ReadBuffer                ; take one, and say nothing

Names:
  .word 0, 0
  .word MedGreen, LtGreen, DkBlue, LtBlue, DkRed, Cyan, MedRed, LtRed
  .word DkYellow, LtYellow, DkGreen, Magenta, Gray, White

Title:     .byte "EVERY LINE IN ITS OWN PEN", CHAR_CR, CHAR_LF, CHAR_CR, CHAR_LF, $00
MedGreen:  .byte " 2 MEDIUM GREEN", CHAR_CR, CHAR_LF, $00
LtGreen:   .byte " 3 LIGHT GREEN", CHAR_CR, CHAR_LF, $00
DkBlue:    .byte " 4 DARK BLUE", CHAR_CR, CHAR_LF, $00
LtBlue:    .byte " 5 LIGHT BLUE", CHAR_CR, CHAR_LF, $00
DkRed:     .byte " 6 DARK RED", CHAR_CR, CHAR_LF, $00
Cyan:      .byte " 7 CYAN", CHAR_CR, CHAR_LF, $00
MedRed:    .byte " 8 MEDIUM RED", CHAR_CR, CHAR_LF, $00
LtRed:     .byte " 9 LIGHT RED", CHAR_CR, CHAR_LF, $00
DkYellow:  .byte "10 DARK YELLOW", CHAR_CR, CHAR_LF, $00
LtYellow:  .byte "11 LIGHT YELLOW", CHAR_CR, CHAR_LF, $00
DkGreen:   .byte "12 DARK GREEN", CHAR_CR, CHAR_LF, $00
Magenta:   .byte "13 MAGENTA", CHAR_CR, CHAR_LF, $00
Gray:      .byte "14 GRAY", CHAR_CR, CHAR_LF, $00
White:     .byte "15 WHITE", CHAR_CR, CHAR_LF, $00
Change:    .byte CHAR_CR, CHAR_LF, "PRESS A KEY TO CHANGE COLOR 13", CHAR_CR, CHAR_LF, $00
Restore:   .byte "PRESS A KEY TO PUT IT BACK", CHAR_CR, CHAR_LF, $00
NeedsCard: .byte "NEEDS BIOS 2 AND A 6502-PICOVDP", CHAR_CR, CHAR_LF, $00
