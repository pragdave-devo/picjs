// types.ts — Data structures for pikchr TypeScript port
// Ported from pikchr.y lines 155-430

export type PNum = number;

// Compass points
export const CP_N = 1;
export const CP_NE = 2;
export const CP_E = 3;
export const CP_SE = 4;
export const CP_S = 5;
export const CP_SW = 6;
export const CP_W = 7;
export const CP_NW = 8;
export const CP_C = 9;
export const CP_END = 10;
export const CP_START = 11;

// Heading angles corresponding to compass points
export const pikHdgAngle: PNum[] = [
  /*none*/ 0.0,
  /* N  */ 0.0,
  /* NE */ 45.0,
  /* E  */ 90.0,
  /* SE */ 135.0,
  /* S  */ 180.0,
  /* SW */ 225.0,
  /* W  */ 270.0,
  /* NW */ 315.0,
  /* C  */ 0.0,
];

// Built-in functions
export const FN_ABS = 0;
export const FN_COS = 1;
export const FN_INT = 2;
export const FN_MAX = 3;
export const FN_MIN = 4;
export const FN_SIN = 5;
export const FN_SQRT = 6;

// Text position and style flags (stored in PToken.eCode)
export const TP_LJUST  = 0x0001;
export const TP_RJUST  = 0x0002;
export const TP_JMASK  = 0x0003;
export const TP_ABOVE2 = 0x0004;
export const TP_ABOVE  = 0x0008;
export const TP_CENTER = 0x0010;
export const TP_BELOW  = 0x0020;
export const TP_BELOW2 = 0x0040;
export const TP_VMASK  = 0x007c;
export const TP_BIG    = 0x0100;
export const TP_SMALL  = 0x0200;
export const TP_XTRA   = 0x0400;
export const TP_SZMASK = 0x0700;
export const TP_ITALIC = 0x1000;
export const TP_BOLD   = 0x2000;
export const TP_MONO   = 0x4000;
export const TP_FMASK  = 0x7000;
export const TP_ALIGN  = 0x8000;

// Directions of movement
export const DIR_RIGHT = 0;
export const DIR_DOWN = 1;
export const DIR_LEFT = 2;
export const DIR_UP = 3;

export function validDir(x: number): boolean {
  return x >= 0 && x <= 3;
}
export function isUpDown(x: number): boolean {
  return (x & 1) === 1;
}
export function isLeftRight(x: number): boolean {
  return (x & 1) === 0;
}

// Property bitmasks
export const A_WIDTH     = 0x0001;
export const A_HEIGHT    = 0x0002;
export const A_RADIUS    = 0x0004;
export const A_THICKNESS = 0x0008;
export const A_DASHED    = 0x0010;
export const A_FILL      = 0x0020;
export const A_COLOR     = 0x0040;
export const A_ARROW     = 0x0080;
export const A_FROM      = 0x0100;
export const A_CW        = 0x0200;
export const A_AT        = 0x0400;
export const A_TO        = 0x0800;
export const A_FIT       = 0x1000;

// Token type constants - mirrors the Lemon grammar token IDs
export enum TokenType {
  T_ID = 1,
  T_ASSIGN,
  T_PLACENAME,
  T_CLASSNAME,
  T_STRING,
  T_NUMBER,
  T_NTH,
  T_EOL,
  T_LP,
  T_RP,
  T_LB,
  T_RB,
  T_COMMA,
  T_COLON,
  T_PLUS,
  T_MINUS,
  T_STAR,
  T_SLASH,
  T_PERCENT,
  T_EQ,
  T_GT,
  T_LT,
  T_LARROW,
  T_RARROW,
  T_LRARROW,
  T_EDGEPT,
  T_OF,
  T_FILL,
  T_COLOR,
  T_THICKNESS,
  T_DOTTED,
  T_DASHED,
  T_CW,
  T_CCW,
  T_INVIS,
  T_THICK,
  T_THIN,
  T_SOLID,
  T_CHOP,
  T_FIT,
  T_BEHIND,
  T_SAME,
  T_FROM,
  T_TO,
  T_THEN,
  T_GO,
  T_CLOSE,
  T_AT,
  T_WITH,
  T_HEADING,
  T_HEIGHT,
  T_WIDTH,
  T_RADIUS,
  T_DIAMETER,
  T_ABOVE,
  T_BELOW,
  T_CENTER,
  T_LJUST,
  T_RJUST,
  T_ITALIC,
  T_BOLD,
  T_MONO,
  T_ALIGNED,
  T_BIG,
  T_SMALL,
  T_AND,
  T_AS,
  T_ASSERT,
  T_BETWEEN,
  T_DEFINE,
  T_DIST,
  T_DOT_E,
  T_DOT_L,
  T_DOT_U,
  T_DOT_XY,
  T_DOWN,
  T_END,
  T_EVEN,
  T_FUNC1,
  T_FUNC2,
  T_IN,
  T_LAST,
  T_LEFT,
  T_PRINT,
  T_RIGHT,
  T_START,
  T_THE,
  T_TOP,
  T_BOTTOM,
  T_UNTIL,
  T_UP,
  T_VERTEX,
  T_WAY,
  T_X,
  T_Y,
  T_THIS,
  T_CODEBLOCK,
  T_ISODATE,
  // Extra types not from Lemon
  T_PARAMETER = 253,
  T_WHITESPACE = 254,
  T_ERROR = 255,
}

// Position in 2D space
export interface PPoint {
  x: PNum;
  y: PNum;
}

export const cZeroPoint: PPoint = { x: 0, y: 0 };

export function pointCopy(p: PPoint): PPoint {
  return { x: p.x, y: p.y };
}

// Bounding box
export interface PBox {
  sw: PPoint;
  ne: PPoint;
}

// Absolute or relative value
export interface PRel {
  rAbs: PNum;
  rRel: PNum;
}

// A single token
export interface PToken {
  z: string;     // The token text (or pointer into source)
  n: number;     // Length of token
  eCode: number; // Auxiliary code
  eType: number; // Token type
  eEdge: number; // Compass point for edge keywords
}

export function makeToken(z: string = '', n: number = 0, eType: number = 0): PToken {
  return { z, n, eCode: 0, eType, eEdge: 0 };
}

// A script-defined variable
export interface PVar {
  zName: string;
  val: PNum;
  pNext: PVar | null;
}

// A macro definition
export interface PMacro {
  pNext: PMacro | null;
  macroName: PToken;
  macroBody: PToken;
  inUse: boolean;
}

// Virtual method table per shape class
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

// A single graphics object
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
  sw: PNum;    // stroke width / thickness
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

// List of graphics objects
export interface PList {
  n: number;
  a: PObj[];
}

// Flags
export const PIKCHR_PLAINTEXT_ERRORS = 0x0001;
export const PIKCHR_DARK_MODE = 0x0002;

// Max path entries and error contexts
export const MAX_TPATH = 1000;
export const MAX_CTX = 10;
export const MAX_TXT = 5;
export const PIKCHR_TOKEN_LIMIT = 100000;

// The main Pik parser/render state
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

// Create a fresh Pik state
export function createPik(): Pik {
  return {
    nErr: 0,
    nToken: 0,
    sIn: makeToken(),
    zOut: '',
    eDir: DIR_RIGHT,
    mFlags: 0,
    cur: null,
    lastRef: null,
    list: null,
    pMacros: null,
    pVar: null,
    bbox: { sw: { x: 1, y: 1 }, ne: { x: 0, y: 0 } },
    rScale: 144.0,
    fontScale: 1.0,
    charWidth: 0.08,
    charHeight: 0.14,
    wArrow: 0,
    hArrow: 0,
    bLayoutVars: false,
    thenFlag: false,
    samePath: false,
    zClass: null,
    wSVG: 0,
    hSVG: 0,
    fgcolor: -1,
    bgcolor: -1,
    nTPath: 0,
    mTPath: 0,
    aTPath: new Array(MAX_TPATH).fill(null).map(() => ({ x: 0, y: 0 })),
    nCtx: 0,
    aCtx: [],
  };
}

// Create a new PObj
export function createPObj(type: PClass): PObj {
  return {
    type,
    errTok: makeToken(),
    ptAt: { x: 0, y: 0 },
    ptEnter: { x: 0, y: 0 },
    ptExit: { x: 0, y: 0 },
    pSublist: null,
    zName: null,
    w: 0,
    h: 0,
    rad: 0,
    sw: 0,
    dotted: 0,
    dashed: 0,
    fill: -1,
    color: 0,
    with: { x: 0, y: 0 },
    eWith: CP_C,
    cw: false,
    larrow: false,
    rarrow: false,
    bClose: false,
    bChop: false,
    bAltAutoFit: false,
    nTxt: 0,
    mProp: 0,
    mCalc: 0,
    aTxt: [],
    iLayer: 1000,
    inDir: DIR_RIGHT,
    outDir: DIR_RIGHT,
    nPath: 0,
    aPath: [],
    pFrom: null,
    pTo: null,
    bbox: { sw: { x: 1, y: 1 }, ne: { x: 0, y: 0 } },
  };
}

// --- Utility functions ported from pikchr.y ---

export function pikTokenEq(token: PToken, z: string): number {
  const tokenText = token.z.substring(0, token.n);
  if (tokenText < z) return -1;
  if (tokenText > z) return 1;
  return 0;
}

export function pikRound(v: PNum): number {
  if (isNaN(v)) return 0;
  if (v < -2147483647) return -2147483648;
  if (v >= 2147483647) return 2147483647;
  return Math.round(v);
}

export function pikDist(a: PPoint, b: PPoint): PNum {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Bounding box utilities
export function bboxIsEmpty(box: PBox): boolean {
  return box.sw.x > box.ne.x;
}

export function bboxInit(box: PBox): void {
  box.sw.x = 1;
  box.sw.y = 1;
  box.ne.x = 0;
  box.ne.y = 0;
}

export function bboxAddBox(a: PBox, b: PBox): void {
  if (bboxIsEmpty(a)) {
    a.sw.x = b.sw.x; a.sw.y = b.sw.y;
    a.ne.x = b.ne.x; a.ne.y = b.ne.y;
  }
  if (bboxIsEmpty(b)) return;
  if (a.sw.x > b.sw.x) a.sw.x = b.sw.x;
  if (a.sw.y > b.sw.y) a.sw.y = b.sw.y;
  if (a.ne.x < b.ne.x) a.ne.x = b.ne.x;
  if (a.ne.y < b.ne.y) a.ne.y = b.ne.y;
}

export function bboxAddXY(box: PBox, x: PNum, y: PNum): void {
  if (bboxIsEmpty(box)) {
    box.ne.x = x; box.ne.y = y;
    box.sw.x = x; box.sw.y = y;
    return;
  }
  if (box.sw.x > x) box.sw.x = x;
  if (box.sw.y > y) box.sw.y = y;
  if (box.ne.x < x) box.ne.x = x;
  if (box.ne.y < y) box.ne.y = y;
}

export function bboxAddEllipse(box: PBox, x: PNum, y: PNum, rx: PNum, ry: PNum): void {
  if (bboxIsEmpty(box)) {
    box.ne.x = x + rx; box.ne.y = y + ry;
    box.sw.x = x - rx; box.sw.y = y - ry;
    return;
  }
  if (box.sw.x > x - rx) box.sw.x = x - rx;
  if (box.sw.y > y - ry) box.sw.y = y - ry;
  if (box.ne.x < x + rx) box.ne.x = x + rx;
  if (box.ne.y < y + ry) box.ne.y = y + ry;
}

export function bboxContainsPoint(box: PBox, pt: PPoint): boolean {
  if (bboxIsEmpty(box)) return false;
  return pt.x >= box.sw.x && pt.x <= box.ne.x &&
         pt.y >= box.sw.y && pt.y <= box.ne.y;
}

// Error reporting
export function pikError(p: Pik, pErr: PToken | null, zMsg: string | null): void {
  if (p.nErr) return;
  p.nErr++;
  if (zMsg === null) {
    p.zOut += '\n<div><p>Out of memory</p></div>\n';
    return;
  }
  if (pErr === null) {
    p.zOut += '\n' + escapeHtml(zMsg);
    return;
  }
  if (!(p.mFlags & PIKCHR_PLAINTEXT_ERRORS)) {
    p.zOut += '<div><pre>\n';
  }
  pikErrorContext(p, pErr, 5);
  p.zOut += 'ERROR: ';
  if (p.mFlags & PIKCHR_PLAINTEXT_ERRORS) {
    p.zOut += zMsg;
  } else {
    p.zOut += escapeHtml(zMsg);
  }
  p.zOut += '\n';
  for (let i = p.nCtx - 1; i >= 0; i--) {
    p.zOut += 'Called from:\n';
    pikErrorContext(p, p.aCtx[i], 0);
  }
  if (!(p.mFlags & PIKCHR_PLAINTEXT_ERRORS)) {
    p.zOut += '</pre></div>\n';
  }
}

function pikErrorContext(p: Pik, pErr: PToken, nContext: number): void {
  const input = p.sIn.z;
  let iErrPt = pErr.z.length > 0 ? input.indexOf(pErr.z) : input.length - 1;
  if (iErrPt < 0) iErrPt = input.length - 1;
  let iBump = 0;
  if (iErrPt >= input.length) {
    iErrPt = input.length - 1;
    iBump = 1;
  } else {
    while (iErrPt > 0 && (input[iErrPt] === '\n' || input[iErrPt] === '\r')) {
      iErrPt--;
      iBump = 1;
    }
  }
  let iLineno = 1;
  for (let i = 0; i < iErrPt; i++) {
    if (input[i] === '\n') iLineno++;
  }
  let iStart = 0;
  let iFirstLineno = 1;
  while (iFirstLineno + nContext < iLineno) {
    while (input[iStart] !== '\n') iStart++;
    iStart++;
    iFirstLineno++;
  }
  while (iFirstLineno <= iLineno) {
    const lineNoStr = `/* ${String(iFirstLineno).padStart(4)} */  `;
    p.zOut += lineNoStr;
    iFirstLineno++;
    let end = iStart;
    while (end < input.length && input[end] !== '\n') end++;
    const lineText = input.substring(iStart, end);
    if (p.mFlags & PIKCHR_PLAINTEXT_ERRORS) {
      p.zOut += lineText;
    } else {
      p.zOut += escapeHtml(lineText);
    }
    iStart = end + 1;
    p.zOut += '\n';
  }
  let iErrCol = 0;
  for (let i = iErrPt; i > 0 && input[i] !== '\n'; iErrCol++, i--) {}
  p.zOut += ' '.repeat(iErrCol + 11 + iBump);
  for (let i = 0; i < pErr.n; i++) p.zOut += '^';
  p.zOut += '\n';
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Append helpers (SVG coordinate transforms)
export function pikAppendX(p: Pik, prefix: string, v: PNum, suffix: string): string {
  v -= p.bbox.sw.x;
  return `${prefix}${p.rScale * v}${suffix}`;
}

export function pikAppendY(p: Pik, prefix: string, v: PNum, suffix: string): string {
  v = p.bbox.ne.y - v;
  return `${prefix}${p.rScale * v}${suffix}`;
}

export function pikAppendXY(p: Pik, prefix: string, x: PNum, y: PNum): string {
  x = x - p.bbox.sw.x;
  y = p.bbox.ne.y - y;
  return `${prefix}${p.rScale * x},${p.rScale * y}`;
}

export function pikAppendDis(p: Pik, prefix: string, v: PNum, suffix: string): string {
  return `${prefix}${p.rScale * v}${suffix}`;
}

export function pikAppendArc(p: Pik, r1: PNum, r2: PNum, x: PNum, y: PNum): string {
  x = x - p.bbox.sw.x;
  y = p.bbox.ne.y - y;
  return `A${p.rScale * r1} ${p.rScale * r2} 0 0 0 ${p.rScale * x} ${p.rScale * y}`;
}

export function pikColorToDarkMode(x: number, isBg: boolean): number {
  x = 0xffffff - x;
  let r = (x >> 16) & 0xff;
  let g = (x >> 8) & 0xff;
  let b = x & 0xff;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  r = mn + (mx - r);
  g = mn + (mx - g);
  b = mn + (mx - b);
  if (isBg) {
    if (mx > 127) {
      r = Math.floor((127 * r) / mx);
      g = Math.floor((127 * g) / mx);
      b = Math.floor((127 * b) / mx);
    }
  } else {
    if (mn < 128 && mx > mn) {
      r = 127 + Math.floor(((r - mn) * 128) / (mx - mn));
      g = 127 + Math.floor(((g - mn) * 128) / (mx - mn));
      b = 127 + Math.floor(((b - mn) * 128) / (mx - mn));
    }
  }
  return r * 0x10000 + g * 0x100 + b;
}

export function pikAppendClr(p: Pik, prefix: string, v: PNum, suffix: string, bg: boolean): string {
  let x = pikRound(v);
  if (x === 0 && p.fgcolor > 0 && !bg) {
    x = p.fgcolor;
  } else if (bg && x >= 0xffffff && p.bgcolor > 0) {
    x = p.bgcolor;
  } else if (p.mFlags & PIKCHR_DARK_MODE) {
    x = pikColorToDarkMode(x, bg);
  }
  const r = (x >> 16) & 0xff;
  const g = (x >> 8) & 0xff;
  const b = x & 0xff;
  return `${prefix}rgb(${r},${g},${b})${suffix}`;
}

// Number to string: match C's %g behavior approximately
export function numToStr(v: PNum): string {
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  const s = v.toPrecision(10);
  // Strip trailing zeros after decimal
  if (s.includes('.')) {
    return s.replace(/\.?0+$/, '');
  }
  return s;
}

// Convert numeric literal to number (port of pik_atof)
export function pikAtof(token: PToken): PNum {
  const text = token.z.substring(0, token.n);
  if (text.length >= 3 && text[0] === '0' && (text[1] === 'x' || text[1] === 'X')) {
    return parseInt(text.substring(2), 16);
  }
  // Try to parse, checking for unit suffixes
  let numStr = text;
  let multiplier = 1.0;
  if (text.length >= 3) {
    const suffix = text.substring(text.length - 2);
    if (suffix === 'cm') { multiplier = 1.0 / 2.54; numStr = text.substring(0, text.length - 2); }
    else if (suffix === 'mm') { multiplier = 1.0 / 25.4; numStr = text.substring(0, text.length - 2); }
    else if (suffix === 'px') { multiplier = 1.0 / 96; numStr = text.substring(0, text.length - 2); }
    else if (suffix === 'pt') { multiplier = 1.0 / 72; numStr = text.substring(0, text.length - 2); }
    else if (suffix === 'pc') { multiplier = 1.0 / 6; numStr = text.substring(0, text.length - 2); }
    else if (suffix === 'in') { multiplier = 1.0; numStr = text.substring(0, text.length - 2); }
  }
  return parseFloat(numStr) * multiplier;
}
