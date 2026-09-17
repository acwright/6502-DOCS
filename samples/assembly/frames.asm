; Counting pictures: the video card's interrupt, handled on port B.
;
; The card can interrupt at the end of every picture it draws. This program
; asks it to, counts the interrupts for one second, and says how many arrived.
; The handler reads the card through port B, which the Kernal never uses, so it
; can never land between the two halves of a command the Kernal is sending on
; port A.

.setcpu "65C02"

.include "6502-VDP.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

Start:
  jsr KernalVersion             ; A = major version
  cmp #2
  bcc NoCard
  jsr VdpInfo                   ; carry set: no 6502-PICOVDP
  bcs NoCard

  ; Print first. The screen comes up on the first thing printed, and setting it
  ; up switches the card's interrupts off, so they are switched on after.
  lda #<Counting
  ldy #>Counting
  jsr PrintStr

  sei                           ; two bytes of IRQ_PTR change together
  lda IRQ_PTR
  sta OldIrq
  lda IRQ_PTR+1
  sta OldIrq+1
  lda #<FrameIrq
  sta IRQ_PTR
  lda #>FrameIrq
  sta IRQ_PTR+1

  lda #VC_STAT1                 ; port B's status address reads STAT1 ...
  sta VC_REG2
  lda #VC_REG_WRITE | VC_REG_STATSEL_B
  sta VC_REG2                   ; ... set through port B's own command address

  stz Frames
  lda #VC_IRQ_VBLANK            ; interrupt at the end of every picture
  ldx #VC_REG_IRQEN
  jsr VdpWriteReg
  cli

  lda #100                      ; one second: 100 hundredths
  ldx #0
  jsr SysDelay

  lda #0                        ; the card stops interrupting ...
  ldx #VC_REG_IRQEN
  jsr VdpWriteReg
  sei                           ; ... and the Kernal gets its vector back
  lda OldIrq
  sta IRQ_PTR
  lda OldIrq+1
  sta IRQ_PTR+1
  cli

  lda Frames
  ldx #0
  jsr PrintDecU16
  lda #<Pictures
  ldy #>Pictures
  jmp PrintStr

NoCard:
  lda #<NeedsCard
  ldy #>NeedsCard
  jmp PrintStr

; Every interrupt on the machine comes here first. Only the card's is counted,
; and everything goes on to the Kernal's handler with the stack as it arrived.
FrameIrq:
  pha
  lda VC_STATUS2                ; STAT1: which of the card's interrupts fired,
  lsr a                         ;   and reading it acknowledges them
  bcc @chain                    ; bit 0, the end of a picture, into carry
  inc Frames
@chain:
  pla
  jmp (OldIrq)

Counting:  .byte "COUNTING PICTURES FOR ONE SECOND", CHAR_CR, CHAR_LF, $00
Pictures:  .byte " PICTURES", CHAR_CR, CHAR_LF, $00
NeedsCard: .byte "NEEDS BIOS 2 AND A 6502-PICOVDP", CHAR_CR, CHAR_LF, $00

OldIrq:    .word $0000
Frames:    .byte $00
