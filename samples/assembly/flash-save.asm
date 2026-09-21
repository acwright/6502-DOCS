; A cartridge that writes to its own flash: erase a sector, program a byte,
; read it back. This is the whole of how a Flash Cart saves, and it is the
; piece nobody gets right from prose alone, so here it is short enough to read
; whole.
;
; Three things catch people, and all three are in the code below:
;
;   1. The unlock addresses are FLASH addresses, and you reach them through
;      the window — so the bank register has to be set before every command
;      cycle, not once at the start.
;   2. A byte program can only turn bits off (new = old AND data), so a sector
;      erase comes first. Erase writes $FF.
;   3. The routine must run from RAM with interrupts off, because while the
;      chip is busy every read of it returns status bits — including the fixed
;      region, where the vectors are.
;
; 6502-EMULATOR models that busy window, so a routine that got (3) wrong hangs
; here exactly as it would on the board. The PicoCalc and the DB Emulator
; complete instantly and would run it happily; see ACCURACY.md.

.setcpu "65C02"

.include "6502-VDP.inc"

BANK      = $E000               ; the bank register: write-only, reaches no flash
BANKSHDW  = $3A                 ; the only record of what is selected

; Where the save goes. Bank $03 holds flash $6000-$7FFF, so the byte at $C000
; with bank $03 selected is flash $6000 — the first byte of a 4 KB sector.
TARGET_BANK = $03
TARGET      = $C000
SAVE_VALUE  = $5A

; The two unlock cycles of 6502-VCS PLAN.md §3, as the CPU sees them. The chip
; wants flash $5555 and $2AAA; the window is 8 KB, so flash $5555 is offset
; $1555 of bank $02 and flash $2AAA is offset $0AAA of bank $01. There is no
; way to write both without a bank switch in between, and that is the point of
; this listing.
UNLOCK1_BANK = $02
UNLOCK1      = $D555
UNLOCK2_BANK = $01
UNLOCK2      = $CAAA

; Free RAM. $0800 is where a .prg would load; a cartridge has it to itself.
RAM_ROUTINE  = $0800

.segment "FIXED"

SetBank:
  sta BANKSHDW                  ; shadow first, so an interrupt between the two
  sta BANK                      ;   stores sees it ahead rather than behind
  rts

CartReset:
  ldx #$ff
  txs
  stz BANKSHDW
  jsr KernalInit
  cli

  lda #<Banner
  ldy #>Banner
  jsr PrintStr

  ; What is there now. An erased flash chip holds $FF, and the linker fills
  ; every unused byte of the image with $FF for exactly that reason.
  lda #<BeforeMsg
  ldy #>BeforeMsg
  jsr PrintStr
  lda #TARGET_BANK
  jsr SetBank
  lda TARGET
  jsr PrintHexByte
  jsr PrintCRLF

  ; Copy the programming routine into RAM and call it there.
  ldx #$00
@Copy:
  lda RamRoutine,x
  sta RAM_ROUTINE,x
  inx
  cpx #(RamRoutineEnd - RamRoutine)
  bne @Copy
  jsr RAM_ROUTINE

  ; And what is there now.
  lda #<AfterMsg
  ldy #>AfterMsg
  jsr PrintStr
  lda #TARGET_BANK
  jsr SetBank
  lda TARGET
  jsr PrintHexByte
  jsr PrintCRLF

@Loop:
  bra @Loop

; =============================================================================
;   The routine that runs from RAM
; =============================================================================
;   Copied byte for byte to $0800 and called there. It needs no relocating:
;   every address in it is an absolute constant and every branch is relative,
;   so the same bytes work wherever they land. That is worth checking whenever
;   you change it — one `jsr` to a label inside would break it silently, since
;   it would jump back into the copy in the fixed region and run there.
; =============================================================================

RamRoutine:
  sei                           ; a vector fetch during the busy window would
                                ;   read status bits instead of an address

  ; --- Sector erase: $5555<-AA, $2AAA<-55, $5555<-80, $5555<-AA, $2AAA<-55,
  ;     sector<-30. Six cycles, five bank switches.
  lda #UNLOCK1_BANK
  sta BANK
  lda #$AA
  sta UNLOCK1
  lda #UNLOCK2_BANK
  sta BANK
  lda #$55
  sta UNLOCK2
  lda #UNLOCK1_BANK
  sta BANK
  lda #$80
  sta UNLOCK1
  lda #UNLOCK1_BANK
  sta BANK
  lda #$AA
  sta UNLOCK1
  lda #UNLOCK2_BANK
  sta BANK
  lda #$55
  sta UNLOCK2
  lda #TARGET_BANK
  sta BANK
  lda #$30
  sta TARGET

  ; DQ7 reads 0 for the whole 25 ms erase and 1 when the sector is $FF again.
@EraseWait:
  lda TARGET
  bpl @EraseWait

  ; --- Byte program: $5555<-AA, $2AAA<-55, $5555<-A0, target<-data.
  lda #UNLOCK1_BANK
  sta BANK
  lda #$AA
  sta UNLOCK1
  lda #UNLOCK2_BANK
  sta BANK
  lda #$55
  sta UNLOCK2
  lda #UNLOCK1_BANK
  sta BANK
  lda #$A0
  sta UNLOCK1
  lda #TARGET_BANK
  sta BANK
  lda #SAVE_VALUE
  sta TARGET

  ; DQ7 is the complement of the bit just written until the 20 us window
  ; closes, so the read matches the value only when the chip is done.
@ProgramWait:
  lda TARGET
  eor #SAVE_VALUE
  and #$80
  bne @ProgramWait

  stz BANK                      ; leave the register and its shadow agreed and
  stz BANKSHDW                  ;   at 0, the way reset left them
  cli
  rts

RamRoutineEnd:

; The copy loop above counts in X, so the routine has to fit in a page.
.assert (RamRoutineEnd - RamRoutine) < 256, error, "the RAM routine no longer fits in one page"

; =============================================================================
;   Printing
; =============================================================================

; A = the byte. Chrout preserves X and Y.
PrintHexByte:
  pha
  lsr a
  lsr a
  lsr a
  lsr a
  jsr @Nybble
  pla
@Nybble:
  and #$0F
  ora #$30
  cmp #$3A                      ; $30-$39 are already "0"-"9"
  bcc @Out
  adc #$06                      ; carry is set here, so this adds seven
@Out:
  jmp Chrout

Banner:
  .byte "FLASH CART SAVE", CHAR_CR, CHAR_LF, $00
BeforeMsg:
  .byte "BEFORE $", $00
AfterMsg:
  .byte "AFTER  $", $00

IrqTrampoline:
  jmp (IRQ_PTR)

NmiTrampoline:
  jmp (NMI_PTR)

.segment "VECTORS"

.word   NmiTrampoline
.word   CartReset
.word   IrqTrampoline
