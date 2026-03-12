export type PNum = number;
export declare const CP_N = 1;
export declare const CP_NE = 2;
export declare const CP_E = 3;
export declare const CP_SE = 4;
export declare const CP_S = 5;
export declare const CP_SW = 6;
export declare const CP_W = 7;
export declare const CP_NW = 8;
export declare const CP_C = 9;
export declare const CP_END = 10;
export declare const CP_START = 11;
export declare const pikHdgAngle: PNum[];
export declare const FN_ABS = 0;
export declare const FN_COS = 1;
export declare const FN_INT = 2;
export declare const FN_MAX = 3;
export declare const FN_MIN = 4;
export declare const FN_SIN = 5;
export declare const FN_SQRT = 6;
export declare const TP_LJUST = 1;
export declare const TP_RJUST = 2;
export declare const TP_JMASK = 3;
export declare const TP_ABOVE2 = 4;
export declare const TP_ABOVE = 8;
export declare const TP_CENTER = 16;
export declare const TP_BELOW = 32;
export declare const TP_BELOW2 = 64;
export declare const TP_VMASK = 124;
export declare const TP_BIG = 256;
export declare const TP_SMALL = 512;
export declare const TP_XTRA = 1024;
export declare const TP_SZMASK = 1792;
export declare const TP_ITALIC = 4096;
export declare const TP_BOLD = 8192;
export declare const TP_MONO = 16384;
export declare const TP_FMASK = 28672;
export declare const TP_ALIGN = 32768;
export declare const DIR_RIGHT = 0;
export declare const DIR_DOWN = 1;
export declare const DIR_LEFT = 2;
export declare const DIR_UP = 3;
export declare function validDir(x: number): boolean;
export declare function isUpDown(x: number): boolean;
export declare function isLeftRight(x: number): boolean;
export declare const A_WIDTH = 1;
export declare const A_HEIGHT = 2;
export declare const A_RADIUS = 4;
export declare const A_THICKNESS = 8;
export declare const A_DASHED = 16;
export declare const A_FILL = 32;
export declare const A_COLOR = 64;
export declare const A_ARROW = 128;
export declare const A_FROM = 256;
export declare const A_CW = 512;
export declare const A_AT = 1024;
export declare const A_TO = 2048;
export declare const A_FIT = 4096;
export declare enum TokenType {
    T_ID = 1,
    T_ASSIGN = 2,
    T_PLACENAME = 3,
    T_CLASSNAME = 4,
    T_STRING = 5,
    T_NUMBER = 6,
    T_NTH = 7,
    T_EOL = 8,
    T_LP = 9,
    T_RP = 10,
    T_LB = 11,
    T_RB = 12,
    T_COMMA = 13,
    T_COLON = 14,
    T_PLUS = 15,
    T_MINUS = 16,
    T_STAR = 17,
    T_SLASH = 18,
    T_PERCENT = 19,
    T_EQ = 20,
    T_GT = 21,
    T_LT = 22,
    T_LARROW = 23,
    T_RARROW = 24,
    T_LRARROW = 25,
    T_EDGEPT = 26,
    T_OF = 27,
    T_FILL = 28,
    T_COLOR = 29,
    T_THICKNESS = 30,
    T_DOTTED = 31,
    T_DASHED = 32,
    T_CW = 33,
    T_CCW = 34,
    T_INVIS = 35,
    T_THICK = 36,
    T_THIN = 37,
    T_SOLID = 38,
    T_CHOP = 39,
    T_FIT = 40,
    T_BEHIND = 41,
    T_SAME = 42,
    T_FROM = 43,
    T_TO = 44,
    T_THEN = 45,
    T_GO = 46,
    T_CLOSE = 47,
    T_AT = 48,
    T_WITH = 49,
    T_HEADING = 50,
    T_HEIGHT = 51,
    T_WIDTH = 52,
    T_RADIUS = 53,
    T_DIAMETER = 54,
    T_ABOVE = 55,
    T_BELOW = 56,
    T_CENTER = 57,
    T_LJUST = 58,
    T_RJUST = 59,
    T_ITALIC = 60,
    T_BOLD = 61,
    T_MONO = 62,
    T_ALIGNED = 63,
    T_BIG = 64,
    T_SMALL = 65,
    T_AND = 66,
    T_AS = 67,
    T_ASSERT = 68,
    T_BETWEEN = 69,
    T_DEFINE = 70,
    T_DIST = 71,
    T_DOT_E = 72,
    T_DOT_L = 73,
    T_DOT_U = 74,
    T_DOT_XY = 75,
    T_DOWN = 76,
    T_END = 77,
    T_EVEN = 78,
    T_FUNC1 = 79,
    T_FUNC2 = 80,
    T_IN = 81,
    T_LAST = 82,
    T_LEFT = 83,
    T_PRINT = 84,
    T_RIGHT = 85,
    T_START = 86,
    T_THE = 87,
    T_TOP = 88,
    T_BOTTOM = 89,
    T_UNTIL = 90,
    T_UP = 91,
    T_VERTEX = 92,
    T_WAY = 93,
    T_X = 94,
    T_Y = 95,
    T_THIS = 96,
    T_CODEBLOCK = 97,
    T_ISODATE = 98,
    T_PARAMETER = 253,
    T_WHITESPACE = 254,
    T_ERROR = 255
}
export interface PPoint {
    x: PNum;
    y: PNum;
}
export declare const cZeroPoint: PPoint;
export declare function pointCopy(p: PPoint): PPoint;
export interface PBox {
    sw: PPoint;
    ne: PPoint;
}
export interface PRel {
    rAbs: PNum;
    rRel: PNum;
}
export interface PToken {
    z: string;
    n: number;
    eCode: number;
    eType: number;
    eEdge: number;
}
export declare function makeToken(z?: string, n?: number, eType?: number): PToken;
export interface PVar {
    zName: string;
    val: PNum;
    pNext: PVar | null;
}
export interface PMacro {
    pNext: PMacro | null;
    macroName: PToken;
    macroBody: PToken;
    inUse: boolean;
}
export interface PClass {
    zName: string;
    isLine: boolean;
    eJust: number;
    xInit: ((p: Pik, obj: PObj) => void) | null;
    xNumProp: ((p: Pik, obj: PObj, id: PToken) => void) | null;
    xCheck: ((p: Pik, obj: PObj) => void) | null;
    xChop: ((p: Pik, obj: PObj, pt: PPoint) => PPoint) | null;
    xOffset: ((p: Pik, obj: PObj, cp: number) => PPoint) | null;
    xFit: ((p: Pik, obj: PObj, w: PNum, h: PNum) => void) | null;
    xRender: ((p: Pik, obj: PObj) => void) | null;
}
export interface PObj {
    type: PClass;
    errTok: PToken;
    ptAt: PPoint;
    ptEnter: PPoint;
    ptExit: PPoint;
    pSublist: PList | null;
    zName: string | null;
    w: PNum;
    h: PNum;
    rad: PNum;
    sw: PNum;
    dotted: PNum;
    dashed: PNum;
    fill: PNum;
    color: PNum;
    with: PPoint;
    eWith: number;
    cw: boolean;
    larrow: boolean;
    rarrow: boolean;
    bClose: boolean;
    bChop: boolean;
    bAltAutoFit: boolean;
    nTxt: number;
    mProp: number;
    mCalc: number;
    aTxt: PToken[];
    iLayer: number;
    inDir: number;
    outDir: number;
    nPath: number;
    aPath: PPoint[];
    pFrom: PObj | null;
    pTo: PObj | null;
    bbox: PBox;
}
export interface PList {
    n: number;
    a: PObj[];
}
export declare const PIKCHR_PLAINTEXT_ERRORS = 1;
export declare const PIKCHR_DARK_MODE = 2;
export declare const MAX_TPATH = 1000;
export declare const MAX_CTX = 10;
export declare const MAX_TXT = 5;
export declare const PIKCHR_TOKEN_LIMIT = 100000;
export interface Pik {
    nErr: number;
    nToken: number;
    sIn: PToken;
    zOut: string;
    eDir: number;
    mFlags: number;
    cur: PObj | null;
    lastRef: PObj | null;
    list: PList | null;
    pMacros: PMacro | null;
    pVar: PVar | null;
    bbox: PBox;
    rScale: PNum;
    fontScale: PNum;
    charWidth: PNum;
    charHeight: PNum;
    wArrow: PNum;
    hArrow: PNum;
    bLayoutVars: boolean;
    thenFlag: boolean;
    samePath: boolean;
    zClass: string | null;
    wSVG: number;
    hSVG: number;
    fgcolor: number;
    bgcolor: number;
    nTPath: number;
    mTPath: number;
    aTPath: PPoint[];
    nCtx: number;
    aCtx: PToken[];
}
export declare function createPik(): Pik;
export declare function createPObj(type: PClass): PObj;
export declare function pikTokenEq(token: PToken, z: string): number;
export declare function pikRound(v: PNum): number;
export declare function pikDist(a: PPoint, b: PPoint): PNum;
export declare function bboxIsEmpty(box: PBox): boolean;
export declare function bboxInit(box: PBox): void;
export declare function bboxAddBox(a: PBox, b: PBox): void;
export declare function bboxAddXY(box: PBox, x: PNum, y: PNum): void;
export declare function bboxAddEllipse(box: PBox, x: PNum, y: PNum, rx: PNum, ry: PNum): void;
export declare function bboxContainsPoint(box: PBox, pt: PPoint): boolean;
export declare function pikError(p: Pik, pErr: PToken | null, zMsg: string | null): void;
export declare function pikAppendX(p: Pik, prefix: string, v: PNum, suffix: string): string;
export declare function pikAppendY(p: Pik, prefix: string, v: PNum, suffix: string): string;
export declare function pikAppendXY(p: Pik, prefix: string, x: PNum, y: PNum): string;
export declare function pikAppendDis(p: Pik, prefix: string, v: PNum, suffix: string): string;
export declare function pikAppendArc(p: Pik, r1: PNum, r2: PNum, x: PNum, y: PNum): string;
export declare function pikColorToDarkMode(x: number, isBg: boolean): number;
export declare function pikAppendClr(p: Pik, prefix: string, v: PNum, suffix: string, bg: boolean): string;
export declare function numToStr(v: PNum): string;
export declare function pikAtof(token: PToken): PNum;
//# sourceMappingURL=types.d.ts.map