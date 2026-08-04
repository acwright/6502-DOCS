.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

; =============================================================================
;   BASIC Startup Stub
; =============================================================================
;   A tokenized BASIC line: 10 SYS 2060
;   When this program is loaded into $0800 and RUN in BASIC, the SYS command
;   jumps to the machine code entry point at $080C (decimal 2060).
;   This stub must remain at the very start of the program.

BasicStartup: .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

; =============================================================================
;   What kind of video card is this? ($080C)
; =============================================================================
;   Unlocks F18A mode, asks the card to prove it has a GPU, and prints what it
;   found.  Every F18A program starts with some version of this, because every
;   step of it does damage on a card that turns out not to be an F18A.
;
;   THE PROBE
;   ---------
;   Six bytes of TMS9900 machine code go into VRAM at $3F00:
;
;       $3F00   04E0 3F00   CLR  @>3F00      ; erase this instruction
;       $3F04   0340        IDLE             ; and stop
;
;   Writing register 55 hands that address to the card's GPU and starts it.
;   If a GPU ran, the first byte of the program is $00 -- it deleted itself.
;   If nothing ran, it is still $04, the top byte of the CLR opcode.
;
;   THE DAMAGE
;   ----------
;   A card that only has eight registers looks at the low three bits of a
;   register number and ignores the rest.  So on a stock TMS9918A:
;
;       register 57  ->  register 1   the two unlock writes blank the screen
;       register 54  ->  register 6   sprite pattern table address
;       register 55  ->  register 7   screen colors
;
;   All three are put back below before anything is printed.  Skip that and a
;   detection routine leaves a blank screen behind on exactly the machines it
;   was supposed to leave alone.
; =============================================================================

; --- VDP registers, by number ---
VDP_R1          = 1                 ; Mode control 2 (blanking lives here)
VDP_R6          = 6                 ; Sprite pattern table base
VDP_R7          = 7                 ; Screen colors
VDP_R15         = 15                ; Status register select
VDP_R54         = 54                ; GPU program counter, high byte
VDP_R55         = 55                ; GPU program counter, low byte -- triggers
VDP_R57         = 57                ; Unlock

F18A_UNLOCK     = $1C               ; Written to register 57, twice

; --- The three values the BIOS sets up text mode with ---
R1_TEXT         = $D0               ; 16K VRAM, display on, interrupt off, text
R6_TEXT         = $00               ; Sprite patterns at VRAM $0000
R7_TEXT         = (TMS_BLACK * 16) | TMS_WHITE

; --- The probe ---
PROBE_ADDR      = $3F00             ; High in VRAM, out of the way of text mode
PROBE_LEN       = 6

; --- Identity, from status register 1 ---
ID_MASK         = %11100000         ; Bits 7-5: 111 says F18A
ID_F18A         = %11100000
ID_EMULATED     = %00001000         ; Bit 3: an F18A personality, not the silicon

; =============================================================================
;   Start
; =============================================================================

Start:
  lda HW_PRESENT
  and #HW_VID                       ; No video card at all?
  beq NoCard

  sei                               ; Every access below is a *pair* of writes
                                    ; to one address. Anything that gets in
                                    ; between leaves the card half-told.

  jsr Unlock
  jsr LoadProbe
  jsr RunProbe
  jsr ReadProbe                      ; A = $00 if a GPU erased it
  pha

  jsr RestoreRegisters               ; Undo the damage, whatever the answer

  pla
  cmp #$00
  bne Stock                          ; Nothing ran the program -- stock card

  jsr ReadIdentity                   ; A = status register 1
  tax
  and #ID_MASK
  cmp #ID_F18A
  bne Stock                          ; A GPU but no F18A identity: not ours

  txa
  and #ID_EMULATED
  beq RealF18A

  cli
  lda #<PicoMsg
  ldy #>PicoMsg
  bra Report

RealF18A:
  cli
  lda #<F18AMsg
  ldy #>F18AMsg
  bra Report

Stock:
  cli
  lda #<StockMsg
  ldy #>StockMsg
  bra Report

NoCard:
  lda #<NoCardMsg
  ldy #>NoCardMsg

Report:
  jsr PrintStr
  jsr PrintCRLF
  rts

; =============================================================================
;   Unlock — write $1C to register 57, twice, with nothing in between
; =============================================================================

Unlock:
  lda #F18A_UNLOCK
  ldx #VDP_R57
  jsr SetVdpReg
  lda #F18A_UNLOCK
  ldx #VDP_R57
  jmp SetVdpReg

; =============================================================================
;   LoadProbe — six bytes of TMS9900 code into VRAM at $3F00
; =============================================================================

LoadProbe:
  lda #<PROBE_ADDR
  ldx #>PROBE_ADDR
  jsr SetVramWrite
  ldx #0
@Loop:
  lda Probe,x
  sta VC_DATA
  inx
  cpx #PROBE_LEN
  bne @Loop
  rts

; =============================================================================
;   RunProbe — point the GPU at $3F00 and start it
; =============================================================================
;   Register 54 takes the high byte.  Writing register 55 loads the low byte
;   *and* starts the GPU, so it goes last.

RunProbe:
  lda #>PROBE_ADDR
  ldx #VDP_R54
  jsr SetVdpReg
  lda #<PROBE_ADDR
  ldx #VDP_R55
  jmp SetVdpReg

; =============================================================================
;   ReadProbe — read back the first byte of the program
; =============================================================================

ReadProbe:
  lda #<PROBE_ADDR
  ldx #>PROBE_ADDR
  jsr SetVramRead
  lda VC_DATA
  rts

; =============================================================================
;   ReadIdentity — status register 1, then put the selection back
; =============================================================================
;   Leaving the selection anywhere but 0 breaks the machine: the Kernal's
;   interrupt handler reads the status port to acknowledge the frame interrupt,
;   and any register but 0 acknowledges nothing.

ReadIdentity:
  lda #1
  ldx #VDP_R15
  jsr SetVdpReg
  lda VC_STATUS
  pha
  lda #0
  ldx #VDP_R15
  jsr SetVdpReg
  pla
  rts

; =============================================================================
;   RestoreRegisters — put back what a stock card just had done to it
; =============================================================================

RestoreRegisters:
  lda #R6_TEXT
  ldx #VDP_R6
  jsr SetVdpReg
  lda #R7_TEXT
  ldx #VDP_R7
  jsr SetVdpReg
  lda #R1_TEXT
  ldx #VDP_R1
  jmp SetVdpReg

; =============================================================================
;   Talking to the card
; =============================================================================
;   A register write is the value, then the register number with bit 7 set.
;   A VRAM address is the low byte, then the high byte with bit 6 set to write
;   or clear to read.  Both are two writes to the same address, which is why
;   interrupts are off around all of this.

SetVdpReg:
  sta VC_REG                        ; Value first
  txa
  ora #$80                          ; Then register number | $80
  sta VC_REG
  rts

SetVramWrite:
  sta VC_REG                        ; Address low byte
  txa
  ora #$40                          ; High byte | $40 = write
  sta VC_REG
  rts

SetVramRead:
  sta VC_REG                        ; Address low byte
  txa
  and #$3F                          ; High byte, top bits clear = read
  sta VC_REG
  rts

; =============================================================================
;   Data
; =============================================================================

Probe:
  .byte $04, $E0, $3F, $00          ; CLR  @>3F00
  .byte $03, $40                    ; IDLE

StockMsg:   .byte "VIDEO: TMS9918A, NO F18A MODE", 0
F18AMsg:    .byte "VIDEO: F18A", 0
PicoMsg:    .byte "VIDEO: F18A MODE ON A PICO9918", 0
NoCardMsg:  .byte "VIDEO: NO CARD FITTED", 0
