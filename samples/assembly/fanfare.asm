; A six-note fanfare.
;
; The sound chip does not think in hertz. Its frequency registers count in
; steps of about one-sixteenth of a hertz, so a note is the frequency you want
; multiplied by 67 and divided by 4 — worked out here while the program is
; being assembled, so the machine never does the arithmetic at all.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

.define NOTE(hz) (hz * 67 / 4)  ; hertz as the sound chip counts it

NOTES = 6

Index := $40

Start:
  lda #<Title
  ldy #>Title
  jsr PrintStr

  lda #12                       ; volume, 0 to 15
  jsr SidSetVolume

  stz Index
NextNote:
  ldx Index
  lda Letter,x                  ; say which note is playing
  jsr Chrout
  lda #' '
  jsr Chrout

  ldx Index
  ldy FreqHigh,x
  lda FreqLow,x
  tax                           ; X = low byte, Y = high byte
  lda #0                        ; voice 0, of three
  jsr SidPlayNote

  ldx Index
  lda Length,x                  ; hold it, in hundredths of a second
  ldx #0
  jsr SysDelay
  jsr SidSilence

  inc Index
  lda Index
  cmp #NOTES
  bne NextNote

  jsr PrintCRLF
  rts

; C  E  G  C'  G  C'
FreqLow:  .lobytes NOTE(262), NOTE(330), NOTE(392), NOTE(523), NOTE(392), NOTE(523)
FreqHigh: .hibytes NOTE(262), NOTE(330), NOTE(392), NOTE(523), NOTE(392), NOTE(523)
Length:   .byte 15, 15, 15, 30, 15, 45
Letter:   .byte "CEGCGC"

Title:    .byte "A LITTLE FANFARE", CHAR_CR, CHAR_LF, $00
