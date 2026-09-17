; Asking the video card what it is.
;
; VdpInfo reports what the machine found when it looked for a video card at
; power-on: which firmware the card runs, and what that firmware can do. A
; program that wants a feature asks here first, rather than finding out by
; drawing garbage.

.setcpu "65C02"

.include "6502-VDP.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Firmware := $40
Features := $41
Which    := $42

Start:
  jsr KernalVersion             ; A = major version
  cmp #2                        ; 1.x has no VdpInfo: its slot just returns
  bcs @ask
  lda #<OldRom
  ldy #>OldRom
  jmp PrintStr

@ask:
  jsr VdpInfo                   ; A = firmware, X = features, Y = $AC
  bcc @found
  cpy #VC_ID                    ; carry set, but the card answered:
  beq @noFont                   ;   a 6502-PICOVDP too old to have a font
  lda #<NoCard
  ldy #>NoCard
  jmp PrintStr
@noFont:
  lda #<NoFont
  ldy #>NoFont
  jmp PrintStr

@found:
  sta Firmware
  stx Features
  lda #<Heading
  ldy #>Heading
  jsr PrintStr
  lda Firmware                  ; two decimal digits: major, then minor
  lsr a
  lsr a
  lsr a
  lsr a
  ora #'0'
  jsr Chrout
  lda #'.'
  jsr Chrout
  lda Firmware
  and #$0F
  ora #'0'
  jsr Chrout
  jsr PrintCRLF
  jsr PrintCRLF

  stz Which                     ; one line per feature bit
@feature:
  lda Which
  asl a
  tax
  lda Names+1,x
  beq @next                     ; bit 6 means nothing yet
  tay
  lda Names,x
  jsr PrintStr
  lsr Features                  ; this bit into carry
  lda #<Yes
  ldy #>Yes
  bcs @say
  lda #<No
  ldy #>No
@say:
  jsr PrintStr
  inc Which
  lda Which
  cmp #8
  bne @feature
  rts
@next:
  lsr Features                  ; skip the bit
  inc Which
  bra @feature

Names:
  .word TwoLayers, Deep, Flip, Scroll, Scanline, Memory, 0, Font

Heading:   .byte "6502-PICOVDP, FIRMWARE ", $00
TwoLayers: .byte "TWO LAYERS         ", $00
Deep:      .byte "256-COLOR TILES    ", $00
Flip:      .byte "FLIPPED SPRITES    ", $00
Scroll:    .byte "HARDWARE SCROLL    ", $00
Scanline:  .byte "LINE INTERRUPT     ", $00
Memory:    .byte "64 KB OF MEMORY    ", $00
Font:      .byte "CHARACTER SET      ", $00
Yes:       .byte "YES", CHAR_CR, CHAR_LF, $00
No:        .byte "NO", CHAR_CR, CHAR_LF, $00
OldRom:    .byte "THIS ROM IS OLDER THAN BIOS 2", CHAR_CR, CHAR_LF, $00
NoCard:    .byte "NO 6502-PICOVDP", CHAR_CR, CHAR_LF, $00
NoFont:    .byte "A 6502-PICOVDP WITHOUT A CHARACTER SET", CHAR_CR, CHAR_LF, $00
