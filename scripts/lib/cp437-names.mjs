// The names of the 256 CP437 glyphs in PICOVDP font $00.
//
// Generated once from 6502-BIOS v1.6 `Chars.asm`, whose comments named every
// character (`; Character $01 - ☺ (white smiling face)`). BIOS 2.0 moved the
// font onto the video card and kept only its bytes (`tests/fixtures/cp437-font.hex`),
// so the names no longer have a source file to be read from. The bytes are the
// same bytes (SPEC §7 hashes them), so the names still belong to them.
//
// Each entry is [glyph, name], indexed by character code. Do not edit by hand:
// regenerate from `git -C 6502-BIOS show v1.6:Chars.asm` if a name is wrong.

export const CP437_NAMES = [
  ["NULL", "blank"], // $00
  ["☺", "white smiling face"], // $01
  ["☻", "black smiling face"], // $02
  ["♥", "heart"], // $03
  ["♦", "diamond"], // $04
  ["♣", "club"], // $05
  ["♠", "spade"], // $06
  ["•", "bullet"], // $07
  ["◘", "inverse bullet"], // $08
  ["○", "white circle"], // $09
  ["◙", "inverse white circle"], // $0A
  ["♂", "male symbol"], // $0B
  ["♀", "female symbol"], // $0C
  ["♪", "eighth note"], // $0D
  ["♫", "beamed eighth notes"], // $0E
  ["☼", "sun"], // $0F
  ["►", "right-pointing triangle"], // $10
  ["◄", "left-pointing triangle"], // $11
  ["↕", "up/down arrow"], // $12
  ["‼", "double exclamation mark"], // $13
  ["¶", "pilcrow"], // $14
  ["§", "section sign"], // $15
  ["▬", "black rectangle"], // $16
  ["↨", "up/down arrow with base"], // $17
  ["↑", "up arrow"], // $18
  ["↓", "down arrow"], // $19
  ["→", "right arrow"], // $1A
  ["←", "left arrow"], // $1B
  ["∟", "right angle"], // $1C
  ["↔", "left/right arrow"], // $1D
  ["▲", "up-pointing triangle"], // $1E
  ["▼", "down-pointing triangle"], // $1F
  ["SPACE", "SPACE"], // $20
  ["!", "!"], // $21
  ["\"", "\""], // $22
  ["#", "#"], // $23
  ["$", "$"], // $24
  ["%", "%"], // $25
  ["&", "&"], // $26
  ["'", "'"], // $27
  ["(", "("], // $28
  [")", ")"], // $29
  ["*", "*"], // $2A
  ["+", "+"], // $2B
  [",", ","], // $2C
  ["-", "-"], // $2D
  [".", "."], // $2E
  ["/", "/"], // $2F
  ["0", "0"], // $30
  ["1", "1"], // $31
  ["2", "2"], // $32
  ["3", "3"], // $33
  ["4", "4"], // $34
  ["5", "5"], // $35
  ["6", "6"], // $36
  ["7", "7"], // $37
  ["8", "8"], // $38
  ["9", "9"], // $39
  [":", ":"], // $3A
  [";", ";"], // $3B
  ["<", "<"], // $3C
  ["=", "="], // $3D
  [">", ">"], // $3E
  ["?", "?"], // $3F
  ["@", "@"], // $40
  ["A", "A"], // $41
  ["B", "B"], // $42
  ["C", "C"], // $43
  ["D", "D"], // $44
  ["E", "E"], // $45
  ["F", "F"], // $46
  ["G", "G"], // $47
  ["H", "H"], // $48
  ["I", "I"], // $49
  ["J", "J"], // $4A
  ["K", "K"], // $4B
  ["L", "L"], // $4C
  ["M", "M"], // $4D
  ["N", "N"], // $4E
  ["O", "O"], // $4F
  ["P", "P"], // $50
  ["Q", "Q"], // $51
  ["R", "R"], // $52
  ["S", "S"], // $53
  ["T", "T"], // $54
  ["U", "U"], // $55
  ["V", "V"], // $56
  ["W", "W"], // $57
  ["X", "X"], // $58
  ["Y", "Y"], // $59
  ["Z", "Z"], // $5A
  ["[", "["], // $5B
  ["\\", "\\"], // $5C
  ["]", "]"], // $5D
  ["^", "^"], // $5E
  ["_", "_"], // $5F
  ["`", "`"], // $60
  ["a", "a"], // $61
  ["b", "b"], // $62
  ["c", "c"], // $63
  ["d", "d"], // $64
  ["e", "e"], // $65
  ["f", "f"], // $66
  ["g", "g"], // $67
  ["h", "h"], // $68
  ["i", "i"], // $69
  ["j", "j"], // $6A
  ["k", "k"], // $6B
  ["l", "l"], // $6C
  ["m", "m"], // $6D
  ["n", "n"], // $6E
  ["o", "o"], // $6F
  ["p", "p"], // $70
  ["q", "q"], // $71
  ["r", "r"], // $72
  ["s", "s"], // $73
  ["t", "t"], // $74
  ["u", "u"], // $75
  ["v", "v"], // $76
  ["w", "w"], // $77
  ["x", "x"], // $78
  ["y", "y"], // $79
  ["z", "z"], // $7A
  ["{", "{"], // $7B
  ["|", "|"], // $7C
  ["}", "}"], // $7D
  ["~", "~"], // $7E
  ["⌂", "house"], // $7F
  ["Ç", "Ç"], // $80
  ["ü", "ü"], // $81
  ["é", "é"], // $82
  ["â", "â"], // $83
  ["ä", "ä"], // $84
  ["à", "à"], // $85
  ["å", "å"], // $86
  ["ç", "ç"], // $87
  ["ê", "ê"], // $88
  ["ë", "ë"], // $89
  ["è", "è"], // $8A
  ["ï", "ï"], // $8B
  ["î", "î"], // $8C
  ["ì", "ì"], // $8D
  ["Ä", "Ä"], // $8E
  ["Å", "Å"], // $8F
  ["É", "É"], // $90
  ["æ", "æ"], // $91
  ["Æ", "Æ"], // $92
  ["ô", "ô"], // $93
  ["ö", "ö"], // $94
  ["ò", "ò"], // $95
  ["û", "û"], // $96
  ["ù", "ù"], // $97
  ["ÿ", "ÿ"], // $98
  ["Ö", "Ö"], // $99
  ["Ü", "Ü"], // $9A
  ["¢", "¢"], // $9B
  ["£", "£"], // $9C
  ["¥", "¥"], // $9D
  ["₧", "₧"], // $9E
  ["ƒ", "ƒ"], // $9F
  ["á", "á"], // $A0
  ["í", "í"], // $A1
  ["ó", "ó"], // $A2
  ["ú", "ú"], // $A3
  ["ñ", "ñ"], // $A4
  ["Ñ", "Ñ"], // $A5
  ["ª", "ª"], // $A6
  ["º", "º"], // $A7
  ["¿", "¿"], // $A8
  ["⌐", "⌐"], // $A9
  ["¬", "¬"], // $AA
  ["½", "½"], // $AB
  ["¼", "¼"], // $AC
  ["¡", "¡"], // $AD
  ["«", "«"], // $AE
  ["»", "»"], // $AF
  ["░", "light shade"], // $B0
  ["▒", "medium shade"], // $B1
  ["▓", "dark shade"], // $B2
  ["│", "box drawing vertical"], // $B3
  ["┤", "box drawing vertical and left"], // $B4
  ["╡", "box drawing vertical double and left single"], // $B5
  ["╢", "box drawing down double and left single"], // $B6
  ["╖", "box drawing down single and left double"], // $B7
  ["╕", "box drawing double vertical and left"], // $B8
  ["╣", "box drawing double vertical and left"], // $B9
  ["║", "box drawing double vertical"], // $BA
  ["╗", "box drawing double down and left"], // $BB
  ["╝", "box drawing double up and left"], // $BC
  ["╜", "box drawing up double and left single"], // $BD
  ["╛", "box drawing up single and left double"], // $BE
  ["┐", "box drawing down and left"], // $BF
  ["└", "box drawing up and right"], // $C0
  ["┴", "box drawing vertical and horizontal"], // $C1
  ["┬", "box drawing down and horizontal"], // $C2
  ["├", "box drawing vertical and right"], // $C3
  ["─", "box drawing horizontal"], // $C4
  ["┼", "box drawing vertical and horizontal"], // $C5
  ["╞", "box drawing vertical single and right double"], // $C6
  ["╟", "box drawing vertical double and right single"], // $C7
  ["╚", "box drawing double up and right"], // $C8
  ["╔", "box drawing double down and right"], // $C9
  ["╩", "box drawing double up and horizontal"], // $CA
  ["╦", "box drawing double down and horizontal"], // $CB
  ["╠", "box drawing double vertical and right"], // $CC
  ["═", "box drawing double horizontal"], // $CD
  ["╬", "box drawing double vertical and horizontal"], // $CE
  ["╧", "box drawing up single and horizontal double"], // $CF
  ["╨", "box drawing up double and horizontal single"], // $D0
  ["╤", "box drawing down single and horizontal double"], // $D1
  ["╥", "box drawing down double and horizontal single"], // $D2
  ["╙", "box drawing up double and right single"], // $D3
  ["╘", "box drawing up single and right double"], // $D4
  ["╒", "box drawing down single and right double"], // $D5
  ["╓", "box drawing down double and right single"], // $D6
  ["╫", "box drawing vertical double and horizontal single"], // $D7
  ["╪", "box drawing vertical single and horizontal double"], // $D8
  ["┘", "box drawing up and left"], // $D9
  ["┌", "box drawing down and right"], // $DA
  ["█", "full block"], // $DB
  ["▄", "lower half block"], // $DC
  ["▌", "left half block"], // $DD
  ["▐", "right half block"], // $DE
  ["▀", "upper half block"], // $DF
  ["α", "α"], // $E0
  ["ß", "ß"], // $E1
  ["Γ", "Γ"], // $E2
  ["π", "π"], // $E3
  ["Σ", "Σ"], // $E4
  ["σ", "σ"], // $E5
  ["µ", "µ"], // $E6
  ["τ", "τ"], // $E7
  ["Φ", "Φ"], // $E8
  ["Θ", "Θ"], // $E9
  ["Ω", "Ω"], // $EA
  ["δ", "δ"], // $EB
  ["∞", "∞"], // $EC
  ["φ", "φ"], // $ED
  ["ε", "ε"], // $EE
  ["∩", "∩"], // $EF
  ["≡", "≡"], // $F0
  ["±", "±"], // $F1
  ["≥", "≥"], // $F2
  ["≤", "≤"], // $F3
  ["⌠", "top half integral"], // $F4
  ["⌡", "bottom half integral"], // $F5
  ["÷", "÷"], // $F6
  ["≈", "≈"], // $F7
  ["°", "°"], // $F8
  ["∙", "∙"], // $F9
  ["·", "middle dot"], // $FA
  ["√", "√"], // $FB
  ["ⁿ", "ⁿ"], // $FC
  ["²", "²"], // $FD
  ["■", "black square"], // $FE
  ["nbsp", "non-breaking space, displayed as blank"] // $FF
]
