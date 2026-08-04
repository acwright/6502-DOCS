; Setting the clock and reading it back, then leaving a note in the 256 bytes
; of memory the clock card keeps alive on its battery.
;
; The clock hands over plain binary numbers — hours, minutes, day, month — so
; nothing here has to unpack anything. Printing two digits with a leading zero
; is the only real work.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

NOTE_SLOT = 0                   ; which of the 256 battery-backed bytes to use

Start:
  lda #20                       ; the century, kept apart from the year
  sta RTC_BUF_CENT
  lda #26                       ; day
  ldx #12                       ; month
  ldy #26                       ; year within the century
  jsr RtcWriteDate

  lda #9                        ; hours
  ldx #30                       ; minutes
  ldy #0                        ; seconds
  jsr RtcWriteTime

  lda #<Now
  ldy #>Now
  jsr PrintStr

  jsr RtcReadTime               ; A = hours, X = minutes, Y = seconds
  phy                           ; PrintTwo needs X and Y for itself
  phx
  jsr PrintTwo                  ; hours
  lda #':'
  jsr Chrout
  pla
  jsr PrintTwo                  ; minutes
  lda #':'
  jsr Chrout
  pla
  jsr PrintTwo                  ; seconds

  lda #<OnThe
  ldy #>OnThe
  jsr PrintStr

  jsr RtcReadDate               ; A = day, X = month, Y = year
  phy
  phx
  jsr PrintTwo                  ; day
  lda #'/'
  jsr Chrout
  pla
  jsr PrintTwo                  ; month
  lda #'/'
  jsr Chrout
  lda RTC_BUF_CENT              ; the century the read left behind
  jsr PrintTwo
  pla
  jsr PrintTwo                  ; year
  jsr PrintCRLF

; Those 256 bytes survive a power cut. Write one, read it straight back, and
; it will still be there next week.
  lda #30
  ldx #NOTE_SLOT
  jsr RtcWriteNVRAM

  lda #<Remembered
  ldy #>Remembered
  jsr PrintStr
  ldx #NOTE_SLOT
  jsr RtcReadNVRAM
  jsr PrintTwo
  jsr PrintCRLF
  rts

; Print A as two decimal digits, leading zero included. Clobbers X.
PrintTwo:
  ldx #'0'
@tens:
  cmp #10
  bcc @units
  sbc #10
  inx
  bra @tens
@units:
  ora #'0'
  pha                           ; the units digit, out of the way
  txa
  jsr Chrout                    ; tens
  pla
  jmp Chrout                    ; units

Now:        .byte "THE TIME IS ", $00
OnThe:      .byte " ON ", $00
Remembered: .byte "AND THE CLOCK CARD REMEMBERS ", $00
