; A screen of tiles in Graphics mode: 32 × 30 cells of 8 × 8 pixels, sixteen
; colors in every cell, and a palette row for each cell to pick its colors from.
;
; Three tables make the picture, all in the card's own memory: patterns (what
; each tile looks like), names (which tile goes in each cell) and attributes
; (which palette row each cell draws in). Press a key to go back to text.

.setcpu "65C02"

.include "6502-VDP.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

COLS          = 32              ; Graphics mode
ROWS          = 30

NAMES         = $0000           ; one byte per cell: which tile
ATTRIBUTES    = $0400           ; one byte per cell: which palette row
PATTERNS      = $2000           ; 32 bytes per 4-bit tile

TILE_BYTES    = 32              ; 8 rows × 4 bytes, two pixels to a byte
TILE_COUNT    = 4

GRAY_ROW      = 1               ; palette row 1 is a gray ramp
FIRST_HUE     = 2               ; rows 2-13 are twelve hues
HUES          = 12

Column := $40
Row    := $41
Temp   := $42

Start:
  jsr KernalVersion             ; A = major version
  cmp #2
  bcc NoCard
  jsr VdpInfo                   ; carry set: no 6502-PICOVDP
  bcc Setup
NoCard:
  lda #<NeedsCard
  ldy #>NeedsCard
  jmp PrintStr

; -----------------------------------------------------------------------------
; The registers, with the display off so nothing half-built is ever seen.
; -----------------------------------------------------------------------------
Setup:
  lda #0
  ldx #VC_REG_MODE1             ; display off
  jsr VdpWriteReg

  lda #VC_VMODE_GRAPHICS        ; 32 × 30 cells of 8 × 8
  jsr VdpSetMode

  lda #VC_LCTRL_4BPP | VC_LCTRL_ATTR_CELL | VC_LCTRL_ENABLE | VC_LCTRL_OPAQUE
  ldx #VC_REG_L0CTRL            ; 4 bits a pixel, an attribute per cell,
  jsr VdpWriteReg               ;   layer on, color 0 drawn rather than see-through

  ldy #0
@register:
  lda Registers+1,y             ; the value
  ldx Registers,y               ; the register
  jsr VdpWriteReg               ; keeps Y
  iny
  iny
  cpy #RegistersEnd - Registers
  bne @register

; -----------------------------------------------------------------------------
; The patterns: four tiles, straight down the data port.
; -----------------------------------------------------------------------------
  lda #<PATTERNS
  ldx #>PATTERNS
  jsr PointAt
  ldx #0
@pattern:
  lda Tiles,x
  sta VC_DATA                   ; the card's pointer moves on by itself
  inx
  cpx #TILE_BYTES * TILE_COUNT
  bne @pattern

; -----------------------------------------------------------------------------
; The names: tiles 0-3 in a two-by-two repeat.
; -----------------------------------------------------------------------------
  lda #<NAMES
  ldx #>NAMES
  jsr PointAt
  stz Row
@nameRow:
  stz Column
@nameCell:
  lda Row
  and #1
  asl a                         ; 2 on odd rows
  sta Temp
  lda Column
  and #1                        ; + 1 on odd columns
  ora Temp
  sta VC_DATA
  inc Column
  lda Column
  cmp #COLS
  bne @nameCell
  inc Row
  lda Row
  cmp #ROWS
  bne @nameRow

; -----------------------------------------------------------------------------
; The attributes: a palette row per cell. Tile 3 draws in gray; everything
; else takes a hue that steps every two cells across and every two down, so
; the colors run in diagonal bands.
; -----------------------------------------------------------------------------
  lda #<ATTRIBUTES
  ldx #>ATTRIBUTES
  jsr PointAt
  stz Row
@attrRow:
  stz Column
@attrCell:
  lda Column
  and Row
  and #1                        ; odd column and odd row: tile 3
  beq @hue
  lda #GRAY_ROW
  bra @store
@hue:
  lda Column
  lsr a
  sta Temp
  lda Row
  lsr a
  clc
  adc Temp                      ; 0-29
@wrap:
  cmp #HUES
  bcc @inRange
  sbc #HUES                     ; carry is set here
  bra @wrap
@inRange:
  adc #FIRST_HUE                ; carry is clear here
@store:
  sta VC_DATA
  inc Column
  lda Column
  cmp #COLS
  bne @attrCell
  inc Row
  lda Row
  cmp #ROWS
  bne @attrRow

  lda #VC_MODE1_DISP            ; display on
  ldx #VC_REG_MODE1
  jsr VdpWriteReg

; -----------------------------------------------------------------------------
; Wait for a key, then text mode and the card's own character set back.
; -----------------------------------------------------------------------------
@wait:
  jsr BufferSize
  beq @wait
  jsr ReadBuffer
  jsr InitVideo
  jmp VideoClear                ; the tables still hold tiles, not text

; Point port A at a card address below $4000, for writing. A = low, X = high.
PointAt:
  sta VC_REG
  txa
  ora #VC_ADDR_WRITE
  sta VC_REG
  rts

; Register, value — everything about layer 0 the mode doesn't set.
Registers:
  .byte VC_REG_L0NAME,  NAMES >> 10         ; table bases count in 1 KB ...
  .byte VC_REG_L0ATTR,  ATTRIBUTES >> 10
  .byte VC_REG_L0PAT,   PATTERNS >> 11      ; ... and patterns in 2 KB
  .byte VC_REG_L0PAL,   0
  .byte VC_REG_L0SCRX,  0                   ; text mode may have left it scrolled
  .byte VC_REG_L0SCRY,  0
  .byte VC_REG_SPRCTRL, 0                   ; no sprites
  .byte VC_REG_COLOR,   TMS_BLACK           ; black beside the picture
RegistersEnd:

; Four tiles. Each nibble is a pixel, and its value is a color in the cell's
; palette row: 0 darkest, 7 the pure hue, 15 nearly white.
Tiles:
; A beveled block: light top and left, dark bottom and right
  .byte $DD, $DD, $DD, $DB
  .byte $DB, $99, $99, $73
  .byte $D9, $77, $77, $53
  .byte $D9, $77, $77, $53
  .byte $D9, $77, $77, $53
  .byte $D9, $77, $77, $53
  .byte $D7, $55, $55, $53
  .byte $B3, $33, $33, $31
; Diagonal stripes
  .byte $99, $94, $44, $44
  .byte $49, $99, $44, $44
  .byte $44, $99, $94, $44
  .byte $44, $49, $99, $44
  .byte $44, $44, $99, $94
  .byte $44, $44, $49, $99
  .byte $94, $44, $44, $99
  .byte $99, $44, $44, $49
; A checker
  .byte $66, $BB, $66, $BB
  .byte $66, $BB, $66, $BB
  .byte $BB, $66, $BB, $66
  .byte $BB, $66, $BB, $66
  .byte $66, $BB, $66, $BB
  .byte $66, $BB, $66, $BB
  .byte $BB, $66, $BB, $66
  .byte $BB, $66, $BB, $66
; A diamond
  .byte $33, $33, $33, $33
  .byte $33, $3F, $F3, $33
  .byte $33, $FF, $FF, $33
  .byte $3F, $FF, $FF, $F3
  .byte $3F, $FF, $FF, $F3
  .byte $33, $FF, $FF, $33
  .byte $33, $3F, $F3, $33
  .byte $33, $33, $33, $33

NeedsCard: .byte "NEEDS BIOS 2 AND A 6502-PICOVDP", CHAR_CR, CHAR_LF, $00
