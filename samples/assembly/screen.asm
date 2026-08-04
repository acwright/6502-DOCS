; Drawing on the screen directly — a framed sign, built out of the box-drawing
; characters the machine already has in its character set.
;
; Console output goes wherever the machine's console goes. This does not: it
; puts characters at chosen positions on the screen, which is how a game draws
; and how anything with a layout draws.

.setcpu "65C02"

.include "6502.inc"

.segment "CODE"

BasicStartup:
  .byte $0A, $08, $0A, $00, $A5, $32, $30, $36, $30, $00, $00, $00

BOX_LEFT  = 8                   ; column of the left-hand edge
BOX_TOP   = 6                   ; row of the top edge
BOX_WIDTH = 24                  ; including both edges

; The box-drawing corners and edges, by character code.
TOP_LEFT     = $C9
TOP_RIGHT    = $BB
BOTTOM_LEFT  = $C8
BOTTOM_RIGHT = $BC
ACROSS       = $CD
DOWN         = $BA

Left  := $40                    ; what DrawRow puts at each end and in between
Middle := $41
Right := $42
Row   := $43

Start:
  lda HW_PRESENT
  and #HW_VID                   ; no screen, nothing to draw on
  beq NoScreen

  jsr VideoClear
  lda #(TMS_LT_YELLOW * 16) | TMS_DK_BLUE
  jsr VideoSetColor             ; letters, then background

  lda #TOP_LEFT
  sta Left
  lda #ACROSS
  sta Middle
  lda #TOP_RIGHT
  sta Right
  lda #BOX_TOP
  sta Row
  jsr DrawRow

  lda #DOWN                     ; three hollow rows
  sta Left
  sta Right
  lda #' '
  sta Middle
  ldx #3
@sides:
  phx
  inc Row
  jsr DrawRow
  plx
  dex
  bne @sides

  lda #BOTTOM_LEFT
  sta Left
  lda #ACROSS
  sta Middle
  lda #BOTTOM_RIGHT
  sta Right
  inc Row
  jsr DrawRow

  ldx #16                       ; centered in the box
  ldy #BOX_TOP + 2
  jsr VideoSetCursor
  ldy #0
@title:
  lda Title,y
  beq Done
  jsr VideoChroutRaw            ; stamps the character and moves along
  iny
  bra @title

; Leave the cursor somewhere sensible. Whatever prints next — including
; BASIC's own prompt — carries on from wherever this program left it.
Done:
  ldx #0
  ldy #20
  jmp VideoSetCursor

NoScreen:
  lda #<NoScreenMsg
  ldy #>NoScreenMsg
  jsr PrintStr
  rts

; One row of the box: an edge, a run of middles, an edge.
DrawRow:
  ldx #BOX_LEFT
  ldy Row
  jsr VideoSetCursor
  lda Left
  jsr VideoChroutRaw
  ldx #BOX_WIDTH - 2
@across:
  lda Middle
  jsr VideoChroutRaw            ; keeps X and Y for us
  dex
  bne @across
  lda Right
  jmp VideoChroutRaw

Title:        .byte "THE ACE", $00
NoScreenMsg:  .byte "NO SCREEN TO DRAW ON", CHAR_CR, CHAR_LF, $00
