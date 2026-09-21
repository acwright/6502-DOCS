; A banked cartridge, as small as the idea gets: the code is in the fixed
; region and the string it prints is in bank $01.
;
; Build it with the Flash Cart config rather than the 16 KB one —
; `make FLASH=512K` in a 6502-CRT or 6502-ASM project — and what comes out is
; a 524,288-byte .crt, a byte-exact image of the chip on the cart.

.setcpu "65C02"

.include "6502-VDP.inc"

; The bank register. Write-only, eight bits, at any address in $E000-$FFFF;
; this one by convention. A write latches it and reaches no flash, so writing
; the register is never also a flash write. RESB clears it to 0.
BANK      = $E000

; It cannot be read back, so this byte is the only record of which bank is
; selected. $3A is the first byte the include marks free for a program that has
; taken the machine over, and a cartridge is by definition such a program.
BANKSHDW  = $3A

.segment "FIXED"

; SetBank has to live in the fixed region, and has to be called from it. A
; `jsr SetBank` from code at $C000-$DFFF returns to an address that no longer
; holds the calling code — the machine does not fault, it runs whatever the
; newly selected bank has there.
;
; The shadow is written before the register. An interrupt landing between the
; two stores then sees the shadow one instruction ahead of the hardware, which
; restoring from the shadow puts right; the other order leaves the two
; permanently disagreed.
SetBank:
  sta BANKSHDW
  sta BANK
  rts

CartReset:
  ldx #$ff
  txs                           ; nothing else has set the stack pointer
  stz BANKSHDW                  ; RESB cleared the register, so the shadow
                                ;   starts honest rather than only becoming so
                                ;   at the first SetBank
  jsr KernalInit
  cli

  lda #<FixedMsg
  ldy #>FixedMsg
  jsr PrintStr

  ; The segment name is the value you write: `.segment "BANK01"` below is
  ; reached with `lda #$01`. BankedMsg is a $C0xx address either way — that is
  ; the window, not a position in the file.
  lda #$01
  jsr SetBank
  lda #<BankedMsg
  ldy #>BankedMsg
  jsr PrintStr                  ; PrintStr is in the Kernal at $A090, not in
                                ;   the window, so the bank stays selected
                                ;   across the call

@Loop:
  bra @Loop                     ; a cartridge has nowhere to return to

FixedMsg:
  .byte "THIS LINE IS IN THE FIXED REGION", CHAR_CR, CHAR_LF, $00

.segment "BANK01"

BankedMsg:
  .byte "AND THIS ONE IS IN BANK $01", CHAR_CR, CHAR_LF, $00

.segment "FIXED"

IrqTrampoline:
  jmp (IRQ_PTR)

NmiTrampoline:
  jmp (NMI_PTR)

; The vectors are the reason the fixed region exists. A vector in a bank would
; point at an address whose contents depend on the bank register, and the
; register is cleared by the very reset that reads the vector.
.segment "VECTORS"

.word   NmiTrampoline
.word   CartReset
.word   IrqTrampoline
