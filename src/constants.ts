// constants.ts — Static tables and lookup functions for pikchr TypeScript port
// Ported from pikchr.y

import {
  type PNum, type PToken, type Pik, type PVar,
  TokenType, pikRound, pikError,
  CP_N, CP_NE, CP_E, CP_SE, CP_S, CP_SW, CP_W, CP_NW, CP_C, CP_END, CP_START,
  DIR_RIGHT, DIR_DOWN, DIR_LEFT, DIR_UP,
  FN_ABS, FN_COS, FN_INT, FN_MAX, FN_MIN, FN_SIN, FN_SQRT, FN_D2R, FN_R2D,
} from './types.ts';

// ---------------------------------------------------------------------------
// PikWord — keyword table entry
// ---------------------------------------------------------------------------
export interface PikWord {
  zWord: string;
  nChar: number;
  eType: number;
  eCode: number;
  eEdge: number;
}

// ---------------------------------------------------------------------------
// Keywords table (pikchr.y lines 4666-4761)
// Sorted alphabetically for binary search.
// ---------------------------------------------------------------------------
export const keywords: readonly PikWord[] = [
  { zWord: "above",       nChar: 5,  eType: TokenType.T_ABOVE,     eCode: 0,         eEdge: 0        },
  { zWord: "abs",         nChar: 3,  eType: TokenType.T_FUNC1,     eCode: FN_ABS,    eEdge: 0        },
  { zWord: "aligned",     nChar: 7,  eType: TokenType.T_ALIGNED,   eCode: 0,         eEdge: 0        },
  { zWord: "and",         nChar: 3,  eType: TokenType.T_AND,       eCode: 0,         eEdge: 0        },
  { zWord: "as",          nChar: 2,  eType: TokenType.T_AS,        eCode: 0,         eEdge: 0        },
  { zWord: "assert",      nChar: 6,  eType: TokenType.T_ASSERT,    eCode: 0,         eEdge: 0        },
  { zWord: "at",          nChar: 2,  eType: TokenType.T_AT,        eCode: 0,         eEdge: 0        },
  { zWord: "behind",      nChar: 6,  eType: TokenType.T_BEHIND,    eCode: 0,         eEdge: 0        },
  { zWord: "below",       nChar: 5,  eType: TokenType.T_BELOW,     eCode: 0,         eEdge: 0        },
  { zWord: "between",     nChar: 7,  eType: TokenType.T_BETWEEN,   eCode: 0,         eEdge: 0        },
  { zWord: "big",         nChar: 3,  eType: TokenType.T_BIG,       eCode: 0,         eEdge: 0        },
  { zWord: "bold",        nChar: 4,  eType: TokenType.T_BOLD,      eCode: 0,         eEdge: 0        },
  { zWord: "bot",         nChar: 3,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_S     },
  { zWord: "bottom",      nChar: 6,  eType: TokenType.T_BOTTOM,    eCode: 0,         eEdge: CP_S     },
  { zWord: "c",           nChar: 1,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_C     },
  { zWord: "ccw",         nChar: 3,  eType: TokenType.T_CCW,       eCode: 0,         eEdge: 0        },
  { zWord: "center",      nChar: 6,  eType: TokenType.T_CENTER,    eCode: 0,         eEdge: CP_C     },
  { zWord: "chop",        nChar: 4,  eType: TokenType.T_CHOP,      eCode: 0,         eEdge: 0        },
  { zWord: "close",       nChar: 5,  eType: TokenType.T_CLOSE,     eCode: 0,         eEdge: 0        },
  { zWord: "color",       nChar: 5,  eType: TokenType.T_COLOR,     eCode: 0,         eEdge: 0        },
  { zWord: "cos",         nChar: 3,  eType: TokenType.T_FUNC1,     eCode: FN_COS,    eEdge: 0        },
  { zWord: "cw",          nChar: 2,  eType: TokenType.T_CW,        eCode: 0,         eEdge: 0        },
  { zWord: "dashed",      nChar: 6,  eType: TokenType.T_DASHED,    eCode: 0,         eEdge: 0        },
  { zWord: "define",      nChar: 6,  eType: TokenType.T_DEFINE,    eCode: 0,         eEdge: 0        },
  { zWord: "diameter",    nChar: 8,  eType: TokenType.T_DIAMETER,  eCode: 0,         eEdge: 0        },
  { zWord: "dist",        nChar: 4,  eType: TokenType.T_DIST,      eCode: 0,         eEdge: 0        },
  { zWord: "do",          nChar: 2,  eType: TokenType.T_DO,        eCode: 0,         eEdge: 0        },
  { zWord: "dotted",      nChar: 6,  eType: TokenType.T_DOTTED,    eCode: 0,         eEdge: 0        },
  { zWord: "d2r",         nChar: 3,  eType: TokenType.T_FUNC1,     eCode: FN_D2R,    eEdge: 0        },
  { zWord: "down",        nChar: 4,  eType: TokenType.T_DOWN,      eCode: DIR_DOWN,  eEdge: 0        },
  { zWord: "e",           nChar: 1,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_E     },
  { zWord: "east",        nChar: 4,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_E     },
  { zWord: "end",         nChar: 3,  eType: TokenType.T_END,       eCode: 0,         eEdge: CP_END   },
  { zWord: "even",        nChar: 4,  eType: TokenType.T_EVEN,      eCode: 0,         eEdge: 0        },
  { zWord: "fill",        nChar: 4,  eType: TokenType.T_FILL,      eCode: 0,         eEdge: 0        },
  { zWord: "first",       nChar: 5,  eType: TokenType.T_NTH,       eCode: 0,         eEdge: 0        },
  { zWord: "fit",         nChar: 3,  eType: TokenType.T_FIT,       eCode: 0,         eEdge: 0        },
  { zWord: "for",         nChar: 3,  eType: TokenType.T_FOR,       eCode: 0,         eEdge: 0        },
  { zWord: "from",        nChar: 4,  eType: TokenType.T_FROM,      eCode: 0,         eEdge: 0        },
  { zWord: "go",          nChar: 2,  eType: TokenType.T_GO,        eCode: 0,         eEdge: 0        },
  { zWord: "heading",     nChar: 7,  eType: TokenType.T_HEADING,   eCode: 0,         eEdge: 0        },
  { zWord: "height",      nChar: 6,  eType: TokenType.T_HEIGHT,    eCode: 0,         eEdge: 0        },
  { zWord: "ht",          nChar: 2,  eType: TokenType.T_HEIGHT,    eCode: 0,         eEdge: 0        },
  { zWord: "in",          nChar: 2,  eType: TokenType.T_IN,        eCode: 0,         eEdge: 0        },
  { zWord: "int",         nChar: 3,  eType: TokenType.T_FUNC1,     eCode: FN_INT,    eEdge: 0        },
  { zWord: "invis",       nChar: 5,  eType: TokenType.T_INVIS,     eCode: 0,         eEdge: 0        },
  { zWord: "invisible",   nChar: 9,  eType: TokenType.T_INVIS,     eCode: 0,         eEdge: 0        },
  { zWord: "italic",      nChar: 6,  eType: TokenType.T_ITALIC,    eCode: 0,         eEdge: 0        },
  { zWord: "last",        nChar: 4,  eType: TokenType.T_LAST,      eCode: 0,         eEdge: 0        },
  { zWord: "left",        nChar: 4,  eType: TokenType.T_LEFT,      eCode: DIR_LEFT,  eEdge: CP_W     },
  { zWord: "ljust",       nChar: 5,  eType: TokenType.T_LJUST,     eCode: 0,         eEdge: 0        },
  { zWord: "max",         nChar: 3,  eType: TokenType.T_FUNC2,     eCode: FN_MAX,    eEdge: 0        },
  { zWord: "min",         nChar: 3,  eType: TokenType.T_FUNC2,     eCode: FN_MIN,    eEdge: 0        },
  { zWord: "mono",        nChar: 4,  eType: TokenType.T_MONO,      eCode: 0,         eEdge: 0        },
  { zWord: "monospace",   nChar: 9,  eType: TokenType.T_MONO,      eCode: 0,         eEdge: 0        },
  { zWord: "n",           nChar: 1,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_N     },
  { zWord: "ne",          nChar: 2,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_NE    },
  { zWord: "north",       nChar: 5,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_N     },
  { zWord: "nw",          nChar: 2,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_NW    },
  { zWord: "of",          nChar: 2,  eType: TokenType.T_OF,        eCode: 0,         eEdge: 0        },
  { zWord: "pikchr_date", nChar: 11, eType: TokenType.T_ISODATE,   eCode: 0,         eEdge: 0        },
  { zWord: "previous",    nChar: 8,  eType: TokenType.T_LAST,      eCode: 0,         eEdge: 0        },
  { zWord: "print",       nChar: 5,  eType: TokenType.T_PRINT,     eCode: 0,         eEdge: 0        },
  { zWord: "rad",         nChar: 3,  eType: TokenType.T_RADIUS,    eCode: 0,         eEdge: 0        },
  { zWord: "radius",      nChar: 6,  eType: TokenType.T_RADIUS,    eCode: 0,         eEdge: 0        },
  { zWord: "r2d",         nChar: 3,  eType: TokenType.T_FUNC1,     eCode: FN_R2D,    eEdge: 0        },
  { zWord: "right",       nChar: 5,  eType: TokenType.T_RIGHT,     eCode: DIR_RIGHT, eEdge: CP_E     },
  { zWord: "rjust",       nChar: 5,  eType: TokenType.T_RJUST,     eCode: 0,         eEdge: 0        },
  { zWord: "s",           nChar: 1,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_S     },
  { zWord: "same",        nChar: 4,  eType: TokenType.T_SAME,      eCode: 0,         eEdge: 0        },
  { zWord: "se",          nChar: 2,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_SE    },
  { zWord: "sin",         nChar: 3,  eType: TokenType.T_FUNC1,     eCode: FN_SIN,    eEdge: 0        },
  { zWord: "small",       nChar: 5,  eType: TokenType.T_SMALL,     eCode: 0,         eEdge: 0        },
  { zWord: "solid",       nChar: 5,  eType: TokenType.T_SOLID,     eCode: 0,         eEdge: 0        },
  { zWord: "south",       nChar: 5,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_S     },
  { zWord: "sqrt",        nChar: 4,  eType: TokenType.T_FUNC1,     eCode: FN_SQRT,   eEdge: 0        },
  { zWord: "start",       nChar: 5,  eType: TokenType.T_START,     eCode: 0,         eEdge: CP_START },
  { zWord: "step",        nChar: 4,  eType: TokenType.T_STEP,      eCode: 0,         eEdge: 0        },
  { zWord: "sw",          nChar: 2,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_SW    },
  { zWord: "t",           nChar: 1,  eType: TokenType.T_TOP,       eCode: 0,         eEdge: CP_N     },
  { zWord: "the",         nChar: 3,  eType: TokenType.T_THE,       eCode: 0,         eEdge: 0        },
  { zWord: "then",        nChar: 4,  eType: TokenType.T_THEN,      eCode: 0,         eEdge: 0        },
  { zWord: "thick",       nChar: 5,  eType: TokenType.T_THICK,     eCode: 0,         eEdge: 0        },
  { zWord: "thickness",   nChar: 9,  eType: TokenType.T_THICKNESS, eCode: 0,         eEdge: 0        },
  { zWord: "thin",        nChar: 4,  eType: TokenType.T_THIN,      eCode: 0,         eEdge: 0        },
  { zWord: "this",        nChar: 4,  eType: TokenType.T_THIS,      eCode: 0,         eEdge: 0        },
  { zWord: "to",          nChar: 2,  eType: TokenType.T_TO,        eCode: 0,         eEdge: 0        },
  { zWord: "top",         nChar: 3,  eType: TokenType.T_TOP,       eCode: 0,         eEdge: CP_N     },
  { zWord: "until",       nChar: 5,  eType: TokenType.T_UNTIL,     eCode: 0,         eEdge: 0        },
  { zWord: "up",          nChar: 2,  eType: TokenType.T_UP,        eCode: DIR_UP,    eEdge: 0        },
  { zWord: "vertex",      nChar: 6,  eType: TokenType.T_VERTEX,    eCode: 0,         eEdge: 0        },
  { zWord: "w",           nChar: 1,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_W     },
  { zWord: "way",         nChar: 3,  eType: TokenType.T_WAY,       eCode: 0,         eEdge: 0        },
  { zWord: "west",        nChar: 4,  eType: TokenType.T_EDGEPT,    eCode: 0,         eEdge: CP_W     },
  { zWord: "wid",         nChar: 3,  eType: TokenType.T_WIDTH,     eCode: 0,         eEdge: 0        },
  { zWord: "width",       nChar: 5,  eType: TokenType.T_WIDTH,     eCode: 0,         eEdge: 0        },
  { zWord: "with",        nChar: 4,  eType: TokenType.T_WITH,      eCode: 0,         eEdge: 0        },
  { zWord: "x",           nChar: 1,  eType: TokenType.T_X,         eCode: 0,         eEdge: 0        },
  { zWord: "y",           nChar: 1,  eType: TokenType.T_Y,         eCode: 0,         eEdge: 0        },
];

// ---------------------------------------------------------------------------
// findKeyword — binary search in the keywords table (pikchr.y lines 4767-4790)
// ---------------------------------------------------------------------------
export function findKeyword(zIn: string, n: number): PikWord | null {
  let first = 0;
  let last = keywords.length - 1;
  while (first <= last) {
    const mid = (first + last) >> 1;
    const entry = keywords[mid];
    const sz = entry.nChar;
    const cmpLen = sz < n ? sz : n;
    let c = compareStrings(zIn, entry.zWord, cmpLen);
    if (c === 0) {
      c = n - sz;
      if (c === 0) return entry;
    }
    if (c < 0) {
      last = mid - 1;
    } else {
      first = mid + 1;
    }
  }
  return null;
}

function compareStrings(a: string, b: string, len: number): number {
  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i);
    const cb = b.charCodeAt(i);
    if (ca < cb) return -1;
    if (ca > cb) return 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Color table (pikchr.y lines 808-962)
// Sorted alphabetically (case-sensitive) for binary search.
// "None" and "Off" have value -1.
// ---------------------------------------------------------------------------
export const aColor: readonly { zName: string; val: number }[] = [
  { zName: "AliceBlue",                val: 0xf0f8ff },
  { zName: "AntiqueWhite",             val: 0xfaebd7 },
  { zName: "Aqua",                     val: 0x00ffff },
  { zName: "Aquamarine",               val: 0x7fffd4 },
  { zName: "Azure",                    val: 0xf0ffff },
  { zName: "Beige",                    val: 0xf5f5dc },
  { zName: "Bisque",                   val: 0xffe4c4 },
  { zName: "Black",                    val: 0x000000 },
  { zName: "BlanchedAlmond",           val: 0xffebcd },
  { zName: "Blue",                     val: 0x0000ff },
  { zName: "BlueViolet",               val: 0x8a2be2 },
  { zName: "Brown",                    val: 0xa52a2a },
  { zName: "BurlyWood",                val: 0xdeb887 },
  { zName: "CadetBlue",                val: 0x5f9ea0 },
  { zName: "Chartreuse",               val: 0x7fff00 },
  { zName: "Chocolate",                val: 0xd2691e },
  { zName: "Coral",                    val: 0xff7f50 },
  { zName: "CornflowerBlue",           val: 0x6495ed },
  { zName: "Cornsilk",                 val: 0xfff8dc },
  { zName: "Crimson",                  val: 0xdc143c },
  { zName: "Cyan",                     val: 0x00ffff },
  { zName: "DarkBlue",                 val: 0x00008b },
  { zName: "DarkCyan",                 val: 0x008b8b },
  { zName: "DarkGoldenrod",            val: 0xb8860b },
  { zName: "DarkGray",                 val: 0xa9a9a9 },
  { zName: "DarkGreen",                val: 0x006400 },
  { zName: "DarkGrey",                 val: 0xa9a9a9 },
  { zName: "DarkKhaki",                val: 0xbdb76b },
  { zName: "DarkMagenta",              val: 0x8b008b },
  { zName: "DarkOliveGreen",           val: 0x556b2f },
  { zName: "DarkOrange",               val: 0xff8c00 },
  { zName: "DarkOrchid",               val: 0x9932cc },
  { zName: "DarkRed",                  val: 0x8b0000 },
  { zName: "DarkSalmon",               val: 0xe9967a },
  { zName: "DarkSeaGreen",             val: 0x8fbc8f },
  { zName: "DarkSlateBlue",            val: 0x483d8b },
  { zName: "DarkSlateGray",            val: 0x2f4f4f },
  { zName: "DarkSlateGrey",            val: 0x2f4f4f },
  { zName: "DarkTurquoise",            val: 0x00ced1 },
  { zName: "DarkViolet",               val: 0x9400d3 },
  { zName: "DeepPink",                 val: 0xff1493 },
  { zName: "DeepSkyBlue",              val: 0x00bfff },
  { zName: "DimGray",                  val: 0x696969 },
  { zName: "DimGrey",                  val: 0x696969 },
  { zName: "DodgerBlue",               val: 0x1e90ff },
  { zName: "Firebrick",                val: 0xb22222 },
  { zName: "FloralWhite",              val: 0xfffaf0 },
  { zName: "ForestGreen",              val: 0x228b22 },
  { zName: "Fuchsia",                  val: 0xff00ff },
  { zName: "Gainsboro",                val: 0xdcdcdc },
  { zName: "GhostWhite",               val: 0xf8f8ff },
  { zName: "Gold",                     val: 0xffd700 },
  { zName: "Goldenrod",                val: 0xdaa520 },
  { zName: "Gray",                     val: 0x808080 },
  { zName: "Green",                    val: 0x008000 },
  { zName: "GreenYellow",              val: 0xadff2f },
  { zName: "Grey",                     val: 0x808080 },
  { zName: "Honeydew",                 val: 0xf0fff0 },
  { zName: "HotPink",                  val: 0xff69b4 },
  { zName: "IndianRed",                val: 0xcd5c5c },
  { zName: "Indigo",                   val: 0x4b0082 },
  { zName: "Ivory",                    val: 0xfffff0 },
  { zName: "Khaki",                    val: 0xf0e68c },
  { zName: "Lavender",                 val: 0xe6e6fa },
  { zName: "LavenderBlush",            val: 0xfff0f5 },
  { zName: "LawnGreen",                val: 0x7cfc00 },
  { zName: "LemonChiffon",             val: 0xfffacd },
  { zName: "LightBlue",                val: 0xadd8e6 },
  { zName: "LightCoral",               val: 0xf08080 },
  { zName: "LightCyan",                val: 0xe0ffff },
  { zName: "LightGoldenrodYellow",     val: 0xfafad2 },
  { zName: "LightGray",                val: 0xd3d3d3 },
  { zName: "LightGreen",               val: 0x90ee90 },
  { zName: "LightGrey",                val: 0xd3d3d3 },
  { zName: "LightPink",                val: 0xffb6c1 },
  { zName: "LightSalmon",              val: 0xffa07a },
  { zName: "LightSeaGreen",            val: 0x20b2aa },
  { zName: "LightSkyBlue",             val: 0x87cefa },
  { zName: "LightSlateGray",           val: 0x778899 },
  { zName: "LightSlateGrey",           val: 0x778899 },
  { zName: "LightSteelBlue",           val: 0xb0c4de },
  { zName: "LightYellow",              val: 0xffffe0 },
  { zName: "Lime",                     val: 0x00ff00 },
  { zName: "LimeGreen",                val: 0x32cd32 },
  { zName: "Linen",                    val: 0xfaf0e6 },
  { zName: "Magenta",                  val: 0xff00ff },
  { zName: "Maroon",                   val: 0x800000 },
  { zName: "MediumAquamarine",         val: 0x66cdaa },
  { zName: "MediumBlue",               val: 0x0000cd },
  { zName: "MediumOrchid",             val: 0xba55d3 },
  { zName: "MediumPurple",             val: 0x9370db },
  { zName: "MediumSeaGreen",           val: 0x3cb371 },
  { zName: "MediumSlateBlue",          val: 0x7b68ee },
  { zName: "MediumSpringGreen",        val: 0x00fa9a },
  { zName: "MediumTurquoise",          val: 0x48d1cc },
  { zName: "MediumVioletRed",          val: 0xc71585 },
  { zName: "MidnightBlue",             val: 0x191970 },
  { zName: "MintCream",                val: 0xf5fffa },
  { zName: "MistyRose",                val: 0xffe4e1 },
  { zName: "Moccasin",                 val: 0xffe4b5 },
  { zName: "NavajoWhite",              val: 0xffdead },
  { zName: "Navy",                     val: 0x000080 },
  { zName: "None",                     val: -1       },
  { zName: "Off",                      val: -1       },
  { zName: "OldLace",                  val: 0xfdf5e6 },
  { zName: "Olive",                    val: 0x808000 },
  { zName: "OliveDrab",                val: 0x6b8e23 },
  { zName: "Orange",                   val: 0xffa500 },
  { zName: "OrangeRed",                val: 0xff4500 },
  { zName: "Orchid",                   val: 0xda70d6 },
  { zName: "PaleGoldenrod",            val: 0xeee8aa },
  { zName: "PaleGreen",                val: 0x98fb98 },
  { zName: "PaleTurquoise",            val: 0xafeeee },
  { zName: "PaleVioletRed",            val: 0xdb7093 },
  { zName: "PapayaWhip",               val: 0xffefd5 },
  { zName: "PeachPuff",                val: 0xffdab9 },
  { zName: "Peru",                     val: 0xcd853f },
  { zName: "Pink",                     val: 0xffc0cb },
  { zName: "Plum",                     val: 0xdda0dd },
  { zName: "PowderBlue",               val: 0xb0e0e6 },
  { zName: "Purple",                   val: 0x800080 },
  { zName: "RebeccaPurple",            val: 0x663399 },
  { zName: "Red",                      val: 0xff0000 },
  { zName: "RosyBrown",                val: 0xbc8f8f },
  { zName: "RoyalBlue",                val: 0x4169e1 },
  { zName: "SaddleBrown",              val: 0x8b4513 },
  { zName: "Salmon",                   val: 0xfa8072 },
  { zName: "SandyBrown",               val: 0xf4a460 },
  { zName: "SeaGreen",                 val: 0x2e8b57 },
  { zName: "Seashell",                 val: 0xfff5ee },
  { zName: "Sienna",                   val: 0xa0522d },
  { zName: "Silver",                   val: 0xc0c0c0 },
  { zName: "SkyBlue",                  val: 0x87ceeb },
  { zName: "SlateBlue",                val: 0x6a5acd },
  { zName: "SlateGray",                val: 0x708090 },
  { zName: "SlateGrey",                val: 0x708090 },
  { zName: "Snow",                     val: 0xfffafa },
  { zName: "SpringGreen",              val: 0x00ff7f },
  { zName: "SteelBlue",                val: 0x4682b4 },
  { zName: "Tan",                      val: 0xd2b48c },
  { zName: "Teal",                     val: 0x008080 },
  { zName: "Thistle",                  val: 0xd8bfd8 },
  { zName: "Tomato",                   val: 0xff6347 },
  { zName: "Turquoise",                val: 0x40e0d0 },
  { zName: "Violet",                   val: 0xee82ee },
  { zName: "Wheat",                    val: 0xf5deb3 },
  { zName: "White",                    val: 0xffffff },
  { zName: "WhiteSmoke",               val: 0xf5f5f5 },
  { zName: "Yellow",                   val: 0xffff00 },
  { zName: "YellowGreen",              val: 0x9acd32 },
];

// ---------------------------------------------------------------------------
// pikLookupColor — case-insensitive binary search (pikchr.y lines 3887-3915)
// Returns the RGB value, or -99 if not found.
// If p is provided, posts an error on miss.
// ---------------------------------------------------------------------------
export function pikLookupColor(p: Pik | null, pId: PToken): number {
  let first = 0;
  let last = aColor.length - 1;
  while (first <= last) {
    const mid = (first + last) >> 1;
    const zClr = aColor[mid].zName;
    let c = 0;
    for (let i = 0; i < pId.n; i++) {
      const c1 = zClr.charCodeAt(i) | 0x20; // toLower
      const c2 = pId.z.charCodeAt(i) | 0x20; // toLower
      c = c2 - c1;
      if (c !== 0) break;
    }
    if (c === 0 && zClr.length > pId.n) c = -1;
    if (c === 0) return aColor[mid].val;
    if (c > 0) {
      first = mid + 1;
    } else {
      last = mid - 1;
    }
  }
  if (p) pikError(p, pId, "not a known color name");
  return -99.0;
}

// Convenience wrapper matching the C API name
export function lookupColor(name: string): number {
  const tok: PToken = { z: name, n: name.length, eCode: 0, eType: 0, eEdge: 0 };
  return pikLookupColor(null, tok);
}

// ---------------------------------------------------------------------------
// Built-in variables (pikchr.y lines 976-1010)
// Sorted alphabetically for binary search.
// ---------------------------------------------------------------------------
export const aBuiltin: readonly { zName: string; val: PNum }[] = [
  { zName: "$2pi",        val: 2 * Math.PI },
  { zName: "$pi",         val: Math.PI },
  { zName: "arcrad",      val: 0.25  },
  { zName: "arrowhead",   val: 2.0   },
  { zName: "arrowht",     val: 0.08  },
  { zName: "arrowwid",    val: 0.06  },
  { zName: "boxht",       val: 0.5   },
  { zName: "boxrad",      val: 0.0   },
  { zName: "boxwid",      val: 0.75  },
  { zName: "charht",      val: 0.14  },
  { zName: "charwid",     val: 0.08  },
  { zName: "circlerad",   val: 0.25  },
  { zName: "color",       val: 0.0   },
  { zName: "cylht",       val: 0.5   },
  { zName: "cylrad",      val: 0.075 },
  { zName: "cylwid",      val: 0.75  },
  { zName: "dashwid",     val: 0.05  },
  { zName: "diamondht",   val: 0.75  },
  { zName: "diamondwid",  val: 1.0   },
  { zName: "dotrad",      val: 0.015 },
  { zName: "ellipseht",   val: 0.5   },
  { zName: "ellipsewid",  val: 0.75  },
  { zName: "fileht",      val: 0.75  },
  { zName: "filerad",     val: 0.15  },
  { zName: "filewid",     val: 0.5   },
  { zName: "fill",        val: -1.0  },
  { zName: "lineht",      val: 0.5   },
  { zName: "linewid",     val: 0.5   },
  { zName: "movewid",     val: 0.5   },
  { zName: "ovalht",      val: 0.5   },
  { zName: "ovalwid",     val: 1.0   },
  { zName: "scale",       val: 1.0   },
  { zName: "textht",      val: 0.5   },
  { zName: "textwid",     val: 0.75  },
  { zName: "thickness",   val: 0.015 },
];

// ---------------------------------------------------------------------------
// pikValue — search app-defined variables, then builtins (pikchr.y lines 3849-3872)
// Returns { val, miss } where miss=true if not found.
// ---------------------------------------------------------------------------
export function pikValue(p: Pik, z: string, n: number): { val: PNum; miss: boolean } {
  // Search app-defined variables first
  let pVar: PVar | null = p.pVar;
  while (pVar) {
    if (pVar.zName.length === n && pVar.zName === z.substring(0, n)) {
      return { val: pVar.val, miss: false };
    }
    pVar = pVar.pNext;
  }
  // Binary search builtins
  let first = 0;
  let last = aBuiltin.length - 1;
  while (first <= last) {
    const mid = (first + last) >> 1;
    const entry = aBuiltin[mid];
    const cmpLen = entry.zName.length < n ? entry.zName.length : n;
    let c = compareStrings(z, entry.zName, cmpLen);
    if (c === 0) {
      if (n < entry.zName.length) c = -1;
      else if (n > entry.zName.length) c = 1;
      else return { val: entry.val, miss: false };
    }
    if (c > 0) {
      first = mid + 1;
    } else {
      last = mid - 1;
    }
  }
  return { val: 0.0, miss: true };
}

// ---------------------------------------------------------------------------
// pikValueInt — pikValue wrapped with pikRound (pikchr.y lines 3873-3875)
// ---------------------------------------------------------------------------
export function pikValueInt(p: Pik, z: string, n: number): { val: number; miss: boolean } {
  const r = pikValue(p, z, n);
  return { val: pikRound(r.val), miss: r.miss };
}

// ---------------------------------------------------------------------------
// pikGetVar — search variables then colors (pikchr.y lines 3927-3935)
// ---------------------------------------------------------------------------
export function pikGetVar(p: Pik, pId: PToken): PNum {
  const r = pikValue(p, pId.z, pId.n);
  if (!r.miss) return r.val;
  const v = pikLookupColor(null, pId);
  if (v > -90.0) return v;
  // Unknown variables default to 0 (matches C behavior)
  return 0.0;
}

// ---------------------------------------------------------------------------
// Character width table (pikchr.y lines 3577-3685)
// Width estimates for ASCII chars 0x20 through 0x7e, in units of 1/100th
// of the average character width.
// ---------------------------------------------------------------------------
export const awChar: readonly number[] = [
  /* ' ' */  45,
  /* '!' */  55,
  /* '"' */  62,
  /* '#' */ 115,
  /* '$' */  90,
  /* '%' */ 132,
  /* '&' */ 125,
  /* "'" */  40,

  /* '(' */  55,
  /* ')' */  55,
  /* '*' */  71,
  /* '+' */ 115,
  /* ',' */  45,
  /* '-' */  48,
  /* '.' */  45,
  /* '/' */  50,

  /* '0' */  91,
  /* '1' */  91,
  /* '2' */  91,
  /* '3' */  91,
  /* '4' */  91,
  /* '5' */  91,
  /* '6' */  91,
  /* '7' */  91,

  /* '8' */  91,
  /* '9' */  91,
  /* ':' */  50,
  /* ';' */  50,
  /* '<' */ 120,
  /* '=' */ 120,
  /* '>' */ 120,
  /* '?' */  78,

  /* '@' */ 142,
  /* 'A' */ 102,
  /* 'B' */ 105,
  /* 'C' */ 110,
  /* 'D' */ 115,
  /* 'E' */ 105,
  /* 'F' */  98,
  /* 'G' */ 105,

  /* 'H' */ 125,
  /* 'I' */  58,
  /* 'J' */  58,
  /* 'K' */ 107,
  /* 'L' */  95,
  /* 'M' */ 145,
  /* 'N' */ 125,
  /* 'O' */ 115,

  /* 'P' */  95,
  /* 'Q' */ 115,
  /* 'R' */ 107,
  /* 'S' */  95,
  /* 'T' */  97,
  /* 'U' */ 118,
  /* 'V' */ 102,
  /* 'W' */ 150,

  /* 'X' */ 100,
  /* 'Y' */  93,
  /* 'Z' */ 100,
  /* '[' */  58,
  /* '\\'*/  50,
  /* ']' */  58,
  /* '^' */ 119,
  /* '_' */  72,

  /* '`' */  72,
  /* 'a' */  86,
  /* 'b' */  92,
  /* 'c' */  80,
  /* 'd' */  92,
  /* 'e' */  85,
  /* 'f' */  52,
  /* 'g' */  92,

  /* 'h' */  92,
  /* 'i' */  47,
  /* 'j' */  47,
  /* 'k' */  88,
  /* 'l' */  48,
  /* 'm' */ 135,
  /* 'n' */  92,
  /* 'o' */  86,

  /* 'p' */  92,
  /* 'q' */  92,
  /* 'r' */  69,
  /* 's' */  75,
  /* 't' */  58,
  /* 'u' */  92,
  /* 'v' */  80,
  /* 'w' */ 121,

  /* 'x' */  81,
  /* 'y' */  80,
  /* 'z' */  76,
  /* '{' */  91,
  /* '|' */  49,
  /* '}' */  91,
  /* '~' */ 118,
];

// ---------------------------------------------------------------------------
// pikTextLength — estimate display width of a text token (pikchr.y lines 3700-3730)
// Returns width in units of 1/100th of average character width.
// The token is assumed to be a quoted string; characters inside the quotes
// (indices 1..n-2) are measured.
// ---------------------------------------------------------------------------
export function pikTextLength(pToken: PToken, isMonospace: boolean): number {
  const stdAvg = 100;
  const monoAvg = 82;
  const n = pToken.n;
  const z = pToken.z;
  let cnt = 0;
  let j = 1;
  while (j < n - 1) {
    let c = z.charCodeAt(j);
    if (c === 0x5c /* '\\' */ && z.charCodeAt(j + 1) !== 0x26 /* '&' */) {
      c = z.charCodeAt(++j);
    } else if (c === 0x26 /* '&' */) {
      let k = j + 1;
      while (k < j + 7 && k < z.length && z.charCodeAt(k) !== 0x3b /* ';' */) k++;
      if (z.charCodeAt(k) === 0x3b) j = k;
      cnt += (isMonospace ? monoAvg : stdAvg) * 3 / 2;
      j++;
      continue;
    }
    // Multi-byte UTF-8: in JS strings this manifests as code points > 0x7f
    // but the C code checks for 0xc0 lead bytes. In JS, characters are already
    // decoded, so any codepoint > 0x7e gets standard width.
    if (c > 0x7e) {
      cnt += isMonospace ? monoAvg : stdAvg;
      j++;
      continue;
    }
    if (isMonospace) {
      cnt += monoAvg;
    } else if (c >= 0x20 && c <= 0x7e) {
      cnt += awChar[c - 0x20];
    } else {
      cnt += stdAvg;
    }
    j++;
  }
  return cnt;
}
