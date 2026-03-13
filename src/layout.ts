// layout.ts — Position resolution, object construction, and layout engine
// Ported from pikchr.y lines 2693-4426

import {
  type PNum, type PPoint, type PBox, type PRel, type PToken, type PVar, type PMacro,
  type PClass, type PObj, type PList, type Pik,
  TokenType, cZeroPoint, pointCopy,
  CP_N, CP_NE, CP_E, CP_SE, CP_S, CP_SW, CP_W, CP_NW, CP_C, CP_END, CP_START,
  DIR_RIGHT, DIR_DOWN, DIR_LEFT, DIR_UP, validDir, isUpDown, isLeftRight,
  A_WIDTH, A_HEIGHT, A_RADIUS, A_THICKNESS, A_DASHED, A_FILL, A_COLOR,
  A_ARROW, A_FROM, A_CW, A_AT, A_TO, A_FIT,
  TP_LJUST, TP_RJUST, TP_JMASK, TP_ABOVE, TP_ABOVE2, TP_CENTER,
  TP_BELOW, TP_BELOW2, TP_VMASK,
  TP_BIG, TP_SMALL, TP_XTRA, TP_SZMASK, TP_ITALIC, TP_BOLD, TP_MONO, TP_FMASK, TP_ALIGN,
  FN_ABS, FN_COS, FN_INT, FN_MAX, FN_MIN, FN_SIN, FN_SQRT, FN_D2R, FN_R2D,
  MAX_TXT, MAX_TPATH, PIKCHR_TOKEN_LIMIT,
  pikHdgAngle,
  createPObj, makeToken, pikRound, pikDist,
  bboxInit, bboxAddBox, bboxAddXY, bboxAddEllipse, bboxContainsPoint, bboxIsEmpty,
  pikError,
  pikAppendX, pikAppendY, pikAppendXY, pikAppendDis, pikAppendArc, pikAppendClr,
  numToStr, pikAtof,
} from './types.ts';

import {
  pikValue, pikValueInt, pikGetVar, pikLookupColor, pikTextLength,
} from './constants.ts';

// --- Forward-declared references to shapes ---
// These are set by shapes.ts via setShapeClasses() to avoid circular imports.

let sublistClass: PClass;
let noopClass: PClass;
let aClass: PClass[] = [];
let arcInitFn: ((p: Pik, obj: PObj) => void) | null = null;

export function setShapeClasses(
  classes: PClass[],
  sublist: PClass,
  noop: PClass,
  arcInit: ((p: Pik, obj: PObj) => void) | null,
): void {
  aClass = classes;
  sublistClass = sublist;
  noopClass = noop;
  arcInitFn = arcInit;
}

// --- Forward-declared reference to renderer's pikAppendTxt ---
// Used by pikSizeToFit. Set by renderer.ts via setAppendTxtFn().

let pikAppendTxtFn: ((p: Pik, pObj: PObj, pBox: PBox) => void) | null = null;

export function setAppendTxtFn(fn: (p: Pik, pObj: PObj, pBox: PBox) => void): void {
  pikAppendTxtFn = fn;
}

// ---------------------------------------------------------------------------
// Binary search for class name
// ---------------------------------------------------------------------------
export function pikFindClass(pId: PToken): PClass | null {
  let first = 0;
  let last = aClass.length - 1;
  while (first <= last) {
    const mid = (first + last) >> 1;
    const name = aClass[mid].zName;
    const tokenText = pId.z.substring(0, pId.n);
    let c: number;
    if (name < tokenText) c = -1;
    else if (name > tokenText) c = 1;
    else c = 0;
    if (c === 0) return aClass[mid];
    if (c < 0) first = mid + 1;
    else last = mid - 1;
  }
  return null;
}

export function pikFindClassByName(name: string): PClass | null {
  const tok: PToken = { z: name, n: name.length, eType: 0, eCode: 0, eEdge: 0 };
  return pikFindClass(tok);
}

// ---------------------------------------------------------------------------
// List management
// ---------------------------------------------------------------------------
export function pikElistAppend(p: Pik, pList: PList | null, pObj: PObj | null): PList | null {
  if (!pObj) return pList;
  if (!pList) {
    pList = { n: 0, a: [] };
  }
  pList.a.push(pObj);
  pList.n = pList.a.length;
  p.list = pList;
  return pList;
}

// ---------------------------------------------------------------------------
// Object construction
// ---------------------------------------------------------------------------
export function pikElemNew(
  p: Pik,
  pId: PToken | null,
  pStr: PToken | null,
  pSublist: PList | null,
): PObj | null {
  if (p.nErr) return null;

  const pNew = createPObj(noopClass); // temporary type, overwritten below
  p.cur = pNew;
  p.nTPath = 1;
  p.thenFlag = false;

  if (!p.list || p.list.n === 0) {
    pNew.ptAt.x = 0;
    pNew.ptAt.y = 0;
    pNew.eWith = CP_C;
  } else {
    const pPrior = p.list.a[p.list.n - 1];
    pNew.ptAt = pointCopy(pPrior.ptExit);
    switch (p.eDir) {
      default:        pNew.eWith = CP_W; break;
      case DIR_LEFT:  pNew.eWith = CP_E; break;
      case DIR_UP:    pNew.eWith = CP_S; break;
      case DIR_DOWN:  pNew.eWith = CP_N; break;
    }
  }
  p.aTPath[0] = pointCopy(pNew.ptAt);
  pNew.with = pointCopy(pNew.ptAt);
  pNew.outDir = pNew.inDir = p.eDir;
  const layerResult = pikValueInt(p, 'layer', 5);
  pNew.iLayer = layerResult.miss ? 1000 : layerResult.val;
  if (pNew.iLayer < 0) pNew.iLayer = 0;

  if (pSublist) {
    pNew.type = sublistClass;
    pNew.pSublist = pSublist;
    if (sublistClass.xInit) sublistClass.xInit(p, pNew);
    return pNew;
  }

  if (pStr) {
    const n: PToken = { z: 'text', n: 4, eType: 0, eCode: 0, eEdge: 0 };
    const textClass = pikFindClass(n);
    if (!textClass) return null;
    pNew.type = textClass;
    pNew.errTok = { ...pStr };
    if (pNew.type.xInit) pNew.type.xInit(p, pNew);
    pikAddTxt(p, pStr, pStr.eCode);
    return pNew;
  }

  if (pId) {
    pNew.errTok = { ...pId };
    const pClass = pikFindClass(pId);
    if (pClass) {
      pNew.type = pClass;
      pNew.sw = pikValue(p, 'thickness', 9).val;
      pNew.fill = pikValue(p, 'fill', 4).val;
      pNew.color = pikValue(p, 'color', 5).val;
      if (pClass.xInit) pClass.xInit(p, pNew);
      return pNew;
    }
    pikError(p, pId, 'unknown object type');
    return null;
  }

  pNew.type = noopClass;
  pNew.ptExit = pointCopy(pNew.ptAt);
  pNew.ptEnter = pointCopy(pNew.ptAt);
  return pNew;
}

// ---------------------------------------------------------------------------
// Macro management
// ---------------------------------------------------------------------------
export function pikFindMacro(p: Pik, pId: PToken): PMacro | null {
  let pMac = p.pMacros;
  while (pMac) {
    if (pMac.macroName.n === pId.n &&
        pMac.macroName.z.substring(0, pMac.macroName.n) === pId.z.substring(0, pId.n)) {
      return pMac;
    }
    pMac = pMac.pNext;
  }
  return null;
}

export function pikAddMacro(p: Pik, pId: PToken, pCode: PToken): void {
  let pNew = pikFindMacro(p, pId);
  if (!pNew) {
    pNew = {
      pNext: p.pMacros,
      macroName: { ...pId },
      macroBody: makeToken(),
      inUse: false,
    };
    p.pMacros = pNew;
  }
  // Strip the enclosing braces: { ... } -> ...
  // pCode.z starts at '{', pCode.n is the full length including braces
  const bodyLen = pCode.n - 2;
  pNew.macroBody.z = pCode.z.substring(1, 1 + bodyLen);
  pNew.macroBody.n = bodyLen;
}

// ---------------------------------------------------------------------------
// Exit point and direction
// ---------------------------------------------------------------------------
export function pikElemSetExit(pObj: PObj, eDir: number): void {
  pObj.outDir = eDir;
  if (!pObj.type.isLine || pObj.bClose) {
    pObj.ptExit = pointCopy(pObj.ptAt);
    switch (pObj.outDir) {
      default:        pObj.ptExit.x += pObj.w * 0.5; break;
      case DIR_LEFT:  pObj.ptExit.x -= pObj.w * 0.5; break;
      case DIR_UP:    pObj.ptExit.y += pObj.h * 0.5; break;
      case DIR_DOWN:  pObj.ptExit.y -= pObj.h * 0.5; break;
    }
  }
}

export function pikSetDirection(p: Pik, eDir: number): void {
  p.eDir = eDir;
  if (p.list && p.list.n) {
    pikElemSetExit(p.list.a[p.list.n - 1], eDir);
  }
}

// ---------------------------------------------------------------------------
// Movement and translation
// ---------------------------------------------------------------------------
export function pikElemMove(pObj: PObj, dx: PNum, dy: PNum): void {
  pObj.ptAt.x += dx;
  pObj.ptAt.y += dy;
  pObj.ptEnter.x += dx;
  pObj.ptEnter.y += dy;
  pObj.ptExit.x += dx;
  pObj.ptExit.y += dy;
  pObj.bbox.ne.x += dx;
  pObj.bbox.ne.y += dy;
  pObj.bbox.sw.x += dx;
  pObj.bbox.sw.y += dy;
  for (let i = 0; i < pObj.nPath; i++) {
    pObj.aPath[i].x += dx;
    pObj.aPath[i].y += dy;
  }
  if (pObj.pSublist) {
    pikElistMove(pObj.pSublist, dx, dy);
  }
}

export function pikElistMove(pList: PList, dx: PNum, dy: PNum): void {
  for (let i = 0; i < pList.n; i++) {
    pikElemMove(pList.a[i], dx, dy);
  }
}

// ---------------------------------------------------------------------------
// Constraint checking
// ---------------------------------------------------------------------------
export function pikParamOk(p: Pik, pObj: PObj, pId: PToken, mThis: number): boolean {
  if (pObj.mProp & mThis) {
    pikError(p, pId, 'value is already set');
    return false;
  }
  if (pObj.mCalc & mThis) {
    pikError(p, pId, 'value already fixed by prior constraints');
    return false;
  }
  pObj.mProp |= mThis;
  return true;
}

// ---------------------------------------------------------------------------
// Numeric property setters
// ---------------------------------------------------------------------------
export function pikSetNumprop(p: Pik, pId: PToken, pVal: PRel): void {
  const pObj = p.cur!;
  switch (pId.eType) {
    case TokenType.T_HEIGHT:
      if (!pikParamOk(p, pObj, pId, A_HEIGHT)) return;
      pObj.h = pObj.h * pVal.rRel + pVal.rAbs;
      break;
    case TokenType.T_WIDTH:
      if (!pikParamOk(p, pObj, pId, A_WIDTH)) return;
      pObj.w = pObj.w * pVal.rRel + pVal.rAbs;
      break;
    case TokenType.T_RADIUS:
      if (!pikParamOk(p, pObj, pId, A_RADIUS)) return;
      pObj.rad = pObj.rad * pVal.rRel + pVal.rAbs;
      break;
    case TokenType.T_DIAMETER:
      if (!pikParamOk(p, pObj, pId, A_RADIUS)) return;
      pObj.rad = pObj.rad * pVal.rRel + 0.5 * pVal.rAbs;
      break;
    case TokenType.T_THICKNESS:
      if (!pikParamOk(p, pObj, pId, A_THICKNESS)) return;
      pObj.sw = pObj.sw * pVal.rRel + pVal.rAbs;
      break;
  }
  if (pObj.type.xNumProp) {
    pObj.type.xNumProp(p, pObj, pId);
  }
}

export function pikSetClrprop(p: Pik, pId: PToken, rClr: PNum): void {
  const pObj = p.cur!;
  switch (pId.eType) {
    case TokenType.T_FILL:
      if (!pikParamOk(p, pObj, pId, A_FILL)) return;
      pObj.fill = rClr;
      break;
    case TokenType.T_COLOR:
      if (!pikParamOk(p, pObj, pId, A_COLOR)) return;
      pObj.color = rClr;
      break;
  }
  if (pObj.type.xNumProp) {
    pObj.type.xNumProp(p, pObj, pId);
  }
}

export function pikSetDashed(p: Pik, pId: PToken, pVal: PNum | null): void {
  const pObj = p.cur!;
  switch (pId.eType) {
    case TokenType.T_DOTTED: {
      const v = pVal === null ? pikValue(p, 'dashwid', 7).val : pVal;
      pObj.dotted = v;
      pObj.dashed = 0.0;
      break;
    }
    case TokenType.T_DASHED: {
      const v = pVal === null ? pikValue(p, 'dashwid', 7).val : pVal;
      pObj.dashed = v;
      pObj.dotted = 0.0;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Path management
// ---------------------------------------------------------------------------
export function pikResetSamepath(p: Pik): void {
  if (p.samePath) {
    p.samePath = false;
    p.nTPath = 1;
  }
}

export function pikThen(p: Pik, pToken: PToken, pObj: PObj): void {
  if (!pObj.type.isLine) {
    pikError(p, pToken, 'use with line-oriented objects only');
    return;
  }
  const n = p.nTPath - 1;
  if (n < 1 && (pObj.mProp & A_FROM) === 0) {
    pikError(p, pToken, 'no prior path points');
    return;
  }
  p.thenFlag = true;
}

export function pikNextRpath(p: Pik, pErr: PToken | null): number {
  let n = p.nTPath - 1;
  if (n + 1 >= MAX_TPATH) {
    if (pErr) pikError(p, pErr, 'too many path elements');
    return n;
  }
  n++;
  p.nTPath++;
  p.aTPath[n] = pointCopy(p.aTPath[n - 1]);
  p.mTPath = 0;
  return n;
}

// ---------------------------------------------------------------------------
// Direction handling for lines
// ---------------------------------------------------------------------------
export function pikAddDirection(p: Pik, pDir: PToken | null, pVal: PRel): void {
  const pObj = p.cur!;
  if (!pObj.type.isLine) {
    if (pDir) {
      pikError(p, pDir, 'use with line-oriented objects only');
    } else {
      pikError(p, pObj.errTok, 'syntax error');
    }
    return;
  }
  pikResetSamepath(p);
  let n = p.nTPath - 1;
  if (p.thenFlag || p.mTPath === 3 || n === 0) {
    n = pikNextRpath(p, pDir);
    p.thenFlag = false;
  }
  const dir = pDir ? pDir.eCode : p.eDir;
  switch (dir) {
    case DIR_UP:
      if (p.mTPath & 2) n = pikNextRpath(p, pDir);
      p.aTPath[n].y += pVal.rAbs + pObj.h * pVal.rRel;
      p.mTPath |= 2;
      break;
    case DIR_DOWN:
      if (p.mTPath & 2) n = pikNextRpath(p, pDir);
      p.aTPath[n].y -= pVal.rAbs + pObj.h * pVal.rRel;
      p.mTPath |= 2;
      break;
    case DIR_RIGHT:
      if (p.mTPath & 1) n = pikNextRpath(p, pDir);
      p.aTPath[n].x += pVal.rAbs + pObj.w * pVal.rRel;
      p.mTPath |= 1;
      break;
    case DIR_LEFT:
      if (p.mTPath & 1) n = pikNextRpath(p, pDir);
      p.aTPath[n].x -= pVal.rAbs + pObj.w * pVal.rRel;
      p.mTPath |= 1;
      break;
  }
  pObj.outDir = dir;
}

// ---------------------------------------------------------------------------
// Heading-based movement
// ---------------------------------------------------------------------------
export function pikMoveHdg(
  p: Pik,
  pDist: PRel,
  pHeading: PToken | null,
  rHdg: PNum,
  pEdgept: PToken | null,
  pErr: PToken,
): void {
  const pObj = p.cur!;
  const rDist = pDist.rAbs + pikValue(p, 'linewid', 7).val * pDist.rRel;
  if (!pObj.type.isLine) {
    pikError(p, pErr, 'use with line-oriented objects only');
    return;
  }
  pikResetSamepath(p);
  let n: number;
  do {
    n = pikNextRpath(p, pErr);
  } while (n < 1);
  if (pHeading) {
    rHdg = rHdg % 360.0;
  } else if (pEdgept && pEdgept.eEdge === CP_C) {
    pikError(p, pEdgept, 'syntax error');
    return;
  } else if (pEdgept) {
    rHdg = pikHdgAngle[pEdgept.eEdge];
  }
  if (rHdg <= 45.0) {
    pObj.outDir = DIR_UP;
  } else if (rHdg <= 135.0) {
    pObj.outDir = DIR_RIGHT;
  } else if (rHdg <= 225.0) {
    pObj.outDir = DIR_DOWN;
  } else if (rHdg <= 315.0) {
    pObj.outDir = DIR_LEFT;
  } else {
    pObj.outDir = DIR_UP;
  }
  const rad = rHdg * 0.017453292519943295769;
  p.aTPath[n].x += rDist * Math.sin(rad);
  p.aTPath[n].y += rDist * Math.cos(rad);
  p.mTPath = 2;
}

// ---------------------------------------------------------------------------
// "right until even with" positioning
// ---------------------------------------------------------------------------
export function pikEvenwith(p: Pik, pDir: PToken, pPlace: PPoint): void {
  const pObj = p.cur!;
  if (!pObj.type.isLine) {
    pikError(p, pDir, 'use with line-oriented objects only');
    return;
  }
  pikResetSamepath(p);
  let n = p.nTPath - 1;
  if (p.thenFlag || p.mTPath === 3 || n === 0) {
    n = pikNextRpath(p, pDir);
    p.thenFlag = false;
  }
  switch (pDir.eCode) {
    case DIR_DOWN:
    case DIR_UP:
      if (p.mTPath & 2) n = pikNextRpath(p, pDir);
      p.aTPath[n].y = pPlace.y;
      p.mTPath |= 2;
      break;
    case DIR_RIGHT:
    case DIR_LEFT:
      if (p.mTPath & 1) n = pikNextRpath(p, pDir);
      p.aTPath[n].x = pPlace.x;
      p.mTPath |= 1;
      break;
  }
  pObj.outDir = pDir.eCode;
}

// ---------------------------------------------------------------------------
// Last-referenced object (side-channel for chop)
// ---------------------------------------------------------------------------
export function pikLastRefObject(p: Pik, pPt: PPoint): PObj | null {
  let pRes: PObj | null = null;
  if (!p.lastRef) return null;
  if (p.lastRef.ptAt.x === pPt.x && p.lastRef.ptAt.y === pPt.y) {
    pRes = p.lastRef;
  }
  p.lastRef = null;
  return pRes;
}

// ---------------------------------------------------------------------------
// "from", "to", "close", "at" setters
// ---------------------------------------------------------------------------
export function pikSetFrom(p: Pik, pObj: PObj, pTk: PToken, pPt: PPoint): void {
  if (!pObj.type.isLine) {
    pikError(p, pTk, 'use "at" to position this object');
    return;
  }
  if (pObj.mProp & A_FROM) {
    pikError(p, pTk, 'line start location already fixed');
    return;
  }
  if (pObj.bClose) {
    pikError(p, pTk, 'polygon is closed');
    return;
  }
  if (p.nTPath > 1) {
    const dx = pPt.x - p.aTPath[0].x;
    const dy = pPt.y - p.aTPath[0].y;
    for (let i = 1; i < p.nTPath; i++) {
      p.aTPath[i].x += dx;
      p.aTPath[i].y += dy;
    }
  }
  p.aTPath[0] = pointCopy(pPt);
  p.mTPath = 3;
  pObj.mProp |= A_FROM;
  pObj.pFrom = pikLastRefObject(p, pPt);
}

export function pikAddTo(p: Pik, pObj: PObj, pTk: PToken, pPt: PPoint): void {
  if (!pObj.type.isLine) {
    pikError(p, pTk, 'use "at" to position this object');
    return;
  }
  if (pObj.bClose) {
    pikError(p, pTk, 'polygon is closed');
    return;
  }
  pikResetSamepath(p);
  let n = p.nTPath - 1;
  if (n === 0 || p.mTPath === 3 || p.thenFlag) {
    n = pikNextRpath(p, pTk);
  }
  p.aTPath[n] = pointCopy(pPt);
  p.mTPath = 3;
  pObj.pTo = pikLastRefObject(p, pPt);
}

export function pikClosePath(p: Pik, pErr: PToken): void {
  const pObj = p.cur!;
  if (p.nTPath < 3) {
    pikError(p, pErr, 'need at least 3 vertexes in order to close the polygon');
    return;
  }
  if (pObj.bClose) {
    pikError(p, pErr, 'polygon already closed');
    return;
  }
  pObj.bClose = true;
}

export function pikBehind(p: Pik, pOther: PObj): void {
  const pObj = p.cur!;
  if (p.nErr === 0 && pObj.iLayer >= pOther.iLayer) {
    pObj.iLayer = pOther.iLayer - 1;
  }
}

const eDirToCp = [CP_E, CP_S, CP_W, CP_N];

export function pikSetAt(p: Pik, pEdge: PToken | null, pAt: PPoint, pErrTok: PToken): void {
  if (p.nErr) return;
  const pObj = p.cur!;
  if (pObj.type.isLine) {
    pikError(p, pErrTok, 'use "from" and "to" to position this object');
    return;
  }
  if (pObj.mProp & A_AT) {
    pikError(p, pErrTok, 'location fixed by prior "at"');
    return;
  }
  pObj.mProp |= A_AT;
  pObj.eWith = pEdge ? pEdge.eEdge : CP_C;
  if (pObj.eWith >= CP_END) {
    const dir = pObj.eWith === CP_END ? pObj.outDir : (pObj.inDir + 2) % 4;
    pObj.eWith = eDirToCp[dir];
  }
  pObj.with = pointCopy(pAt);
}

// ---------------------------------------------------------------------------
// Text handling
// ---------------------------------------------------------------------------
export function pikAddTxt(p: Pik, pTxt: PToken, iPos: number): void {
  const pObj = p.cur!;
  if (pObj.nTxt >= MAX_TXT) {
    pikError(p, pTxt, 'too many text terms');
    return;
  }
  const pT: PToken = { ...pTxt, eCode: iPos };
  pObj.aTxt.push(pT);
  pObj.nTxt = pObj.aTxt.length;
}

export function pikTextPosition(iPrev: number, pFlag: PToken): number {
  let iRes = iPrev;
  switch (pFlag.eType) {
    case TokenType.T_LJUST:   iRes = (iRes & ~TP_JMASK) | TP_LJUST;  break;
    case TokenType.T_RJUST:   iRes = (iRes & ~TP_JMASK) | TP_RJUST;  break;
    case TokenType.T_ABOVE:   iRes = (iRes & ~TP_VMASK) | TP_ABOVE;  break;
    case TokenType.T_CENTER:  iRes = (iRes & ~TP_VMASK) | TP_CENTER; break;
    case TokenType.T_BELOW:   iRes = (iRes & ~TP_VMASK) | TP_BELOW;  break;
    case TokenType.T_ITALIC:  iRes |= TP_ITALIC;                     break;
    case TokenType.T_BOLD:    iRes |= TP_BOLD;                       break;
    case TokenType.T_MONO:    iRes |= TP_MONO;                       break;
    case TokenType.T_ALIGNED: iRes |= TP_ALIGN;                      break;
    case TokenType.T_BIG:
      if (iRes & TP_BIG) iRes |= TP_XTRA;
      else iRes = (iRes & ~TP_SZMASK) | TP_BIG;
      break;
    case TokenType.T_SMALL:
      if (iRes & TP_SMALL) iRes |= TP_XTRA;
      else iRes = (iRes & ~TP_SZMASK) | TP_SMALL;
      break;
  }
  return iRes;
}

// ---------------------------------------------------------------------------
// Size to fit
// ---------------------------------------------------------------------------
export function pikSizeToFit(p: Pik, pObj: PObj | null, pFit: PToken, eWhich: number): void {
  if (p.nErr) return;
  if (!pObj) pObj = p.cur!;
  if (pObj.nTxt === 0) {
    pikError(p, pFit, 'no text to fit to');
    return;
  }
  if (!pObj.type.xFit) return;

  const bbox: PBox = { sw: { x: 1, y: 1 }, ne: { x: 0, y: 0 } };
  pikComputeLayoutSettings(p);
  if (pikAppendTxtFn) {
    pikAppendTxtFn(p, pObj, bbox);
  }

  let w: PNum = 0;
  let h: PNum = 0;
  if ((eWhich & 1) !== 0 || pObj.bAltAutoFit) {
    w = (bbox.ne.x - bbox.sw.x) + p.charWidth;
  }
  if ((eWhich & 2) !== 0 || pObj.bAltAutoFit) {
    const h1 = bbox.ne.y - pObj.ptAt.y;
    const h2 = pObj.ptAt.y - bbox.sw.y;
    h = 2.0 * (h1 < h2 ? h2 : h1) + 0.5 * p.charHeight;
  }
  pObj.type.xFit(p, pObj, w, h);
  pObj.mProp |= A_FIT;
}

// ---------------------------------------------------------------------------
// Variable management
// ---------------------------------------------------------------------------
export function pikSetVar(p: Pik, pId: PToken, val: PNum, pOp: PToken): void {
  let pVar = p.pVar;
  const name = pId.z.substring(0, pId.n);
  while (pVar) {
    if (pVar.zName === name) break;
    pVar = pVar.pNext;
  }
  if (!pVar) {
    pVar = {
      zName: name,
      val: pikValue(p, pId.z, pId.n).val,
      pNext: p.pVar,
    };
    p.pVar = pVar;
  }
  switch (pOp.eCode) {
    case TokenType.T_PLUS:  pVar.val += val; break;
    case TokenType.T_STAR:  pVar.val *= val; break;
    case TokenType.T_MINUS: pVar.val -= val; break;
    case TokenType.T_SLASH:
      if (val === 0.0) {
        pikError(p, pOp, 'division by zero');
      } else {
        pVar.val /= val;
      }
      break;
    default: pVar.val = val; break;
  }
  p.bLayoutVars = false;
}

// ---------------------------------------------------------------------------
// Ordinal and lookup
// ---------------------------------------------------------------------------
export function pikNthValue(p: Pik, pNth: PToken): number {
  let i = parseInt(pNth.z, 10);
  if (isNaN(i)) i = 0; // parseInt("first") returns NaN, atoi returns 0
  if (i > 1000) {
    pikError(p, pNth, "value too big - max '1000th'");
    i = 1;
  }
  if (i === 0 && pNth.z.substring(0, pNth.n) === 'first') i = 1;
  return i;
}

export function pikFindNth(p: Pik, pBasis: PObj | null, pNth: PToken): PObj | null {
  let pList: PList | null;
  if (!pBasis) {
    pList = p.list;
  } else {
    pList = pBasis.pSublist;
  }
  if (!pList) {
    pikError(p, pNth, 'no such object');
    return null;
  }
  let pClass: PClass | null;
  if (pNth.eType === TokenType.T_LAST) {
    pClass = null;
  } else if (pNth.eType === TokenType.T_LB) {
    pClass = sublistClass;
  } else {
    pClass = pikFindClass(pNth);
    if (!pClass) {
      pikError(p, pNth, 'no such object type');
      return null;
    }
  }
  let n = pNth.eCode;
  if (n < 0) {
    for (let i = pList.n - 1; i >= 0; i--) {
      const pObj = pList.a[i];
      if (pClass && pObj.type !== pClass) continue;
      n++;
      if (n === 0) return pObj;
    }
  } else {
    for (let i = 0; i < pList.n; i++) {
      const pObj = pList.a[i];
      if (pClass && pObj.type !== pClass) continue;
      n--;
      if (n === 0) return pObj;
    }
  }
  pikError(p, pNth, 'no such object');
  return null;
}

export function pikFindByname(p: Pik, pBasis: PObj | null, pName: PToken): PObj | null {
  let pList: PList | null;
  if (!pBasis) {
    pList = p.list;
  } else {
    pList = pBasis.pSublist;
  }
  if (!pList) {
    pikError(p, pName, 'no such object');
    return null;
  }
  const nameStr = pName.z.substring(0, pName.n);
  // First look for explicitly tagged objects
  for (let i = pList.n - 1; i >= 0; i--) {
    const pObj = pList.a[i];
    if (pObj.zName && pObj.zName === nameStr) {
      p.lastRef = pObj;
      return pObj;
    }
  }
  // Second pass: look for objects containing text matching the name
  for (let i = pList.n - 1; i >= 0; i--) {
    const pObj = pList.a[i];
    for (let j = 0; j < pObj.nTxt; j++) {
      const txt = pObj.aTxt[j];
      if (txt.n === pName.n + 2 &&
          txt.z.substring(1, 1 + pName.n) === nameStr) {
        p.lastRef = pObj;
        return pObj;
      }
    }
  }
  pikError(p, pName, 'no such object');
  return null;
}

// ---------------------------------------------------------------------------
// "same" — copy properties from prior object
// ---------------------------------------------------------------------------
export function pikSame(p: Pik, pOther: PObj | null, pErrTok: PToken): void {
  const pObj = p.cur!;
  if (p.nErr) return;
  if (!pOther) {
    let i: number;
    for (i = (p.list ? p.list.n : 0) - 1; i >= 0; i--) {
      pOther = p.list!.a[i];
      if (pOther.type === pObj.type) break;
    }
    if (i < 0) {
      pikError(p, pErrTok, 'no prior objects of the same type');
      return;
    }
  }
  if (pOther!.nPath && pObj.type.isLine) {
    const dx = p.aTPath[0].x - pOther!.aPath[0].x;
    const dy = p.aTPath[0].y - pOther!.aPath[0].y;
    for (let i = 1; i < pOther!.nPath; i++) {
      p.aTPath[i] = {
        x: pOther!.aPath[i].x + dx,
        y: pOther!.aPath[i].y + dy,
      };
    }
    p.nTPath = pOther!.nPath;
    p.mTPath = 3;
    p.samePath = true;
  }
  if (!pObj.type.isLine) {
    pObj.w = pOther!.w;
    pObj.h = pOther!.h;
  }
  pObj.rad = pOther!.rad;
  pObj.sw = pOther!.sw;
  pObj.dashed = pOther!.dashed;
  pObj.dotted = pOther!.dotted;
  pObj.fill = pOther!.fill;
  pObj.color = pOther!.color;
  pObj.cw = pOther!.cw;
  pObj.larrow = pOther!.larrow;
  pObj.rarrow = pOther!.rarrow;
  pObj.bClose = pOther!.bClose;
  pObj.bChop = pOther!.bChop;
  pObj.iLayer = pOther!.iLayer;
}

// ---------------------------------------------------------------------------
// Place, position, property helpers
// ---------------------------------------------------------------------------
export function pikElemOffset(p: Pik, pObj: PObj, cp: number): PPoint {
  if (pObj.type.xOffset) {
    return pObj.type.xOffset(p, pObj, cp);
  }
  return { x: 0, y: 0 };
}

export function pikPlaceOfElem(p: Pik, pObj: PObj | null, pEdge: PToken | null): PPoint {
  if (!pObj) return { x: 0, y: 0 };
  if (!pEdge) return pointCopy(pObj.ptAt);
  if (pEdge.eType === TokenType.T_EDGEPT || (pEdge.eEdge > 0 && pEdge.eEdge < CP_END)) {
    const pt = pikElemOffset(p, pObj, pEdge.eEdge);
    pt.x += pObj.ptAt.x;
    pt.y += pObj.ptAt.y;
    return pt;
  }
  if (pEdge.eType === TokenType.T_START) {
    return pointCopy(pObj.ptEnter);
  } else {
    return pointCopy(pObj.ptExit);
  }
}

export function pikPositionBetween(x: PNum, p1: PPoint, p2: PPoint): PPoint {
  return {
    x: p2.x * x + p1.x * (1.0 - x),
    y: p2.y * x + p1.y * (1.0 - x),
  };
}

export function pikPositionAtAngle(dist: PNum, r: PNum, pt: PPoint): PPoint {
  const rad = r * 0.017453292519943295769;
  return {
    x: pt.x + dist * Math.sin(rad),
    y: pt.y + dist * Math.cos(rad),
  };
}

export function pikPositionAtHdg(dist: PNum, pD: PToken, pt: PPoint): PPoint {
  return pikPositionAtAngle(dist, pikHdgAngle[pD.eEdge], pt);
}

export function pikNthVertex(p: Pik, pNth: PToken, pErr: PToken, pObj: PObj | null): PPoint {
  if (p.nErr || !pObj) return pointCopy(p.aTPath[0]);
  if (!pObj.type.isLine) {
    pikError(p, pErr, 'object is not a line');
    return { x: 0, y: 0 };
  }
  const n = parseInt(pNth.z, 10);
  if (n < 1 || n > pObj.nPath) {
    pikError(p, pNth, 'no such vertex');
    return { x: 0, y: 0 };
  }
  return pointCopy(pObj.aPath[n - 1]);
}

export function pikPropertyOf(pObj: PObj | null, pProp: PToken): PNum {
  if (!pObj) return 0.0;
  switch (pProp.eType) {
    case TokenType.T_HEIGHT:    return pObj.h;
    case TokenType.T_WIDTH:     return pObj.w;
    case TokenType.T_RADIUS:    return pObj.rad;
    case TokenType.T_DIAMETER:  return pObj.rad * 2.0;
    case TokenType.T_THICKNESS: return pObj.sw;
    case TokenType.T_DASHED:    return pObj.dashed;
    case TokenType.T_DOTTED:    return pObj.dotted;
    case TokenType.T_FILL:      return pObj.fill;
    case TokenType.T_COLOR:     return pObj.color;
    case TokenType.T_X:         return pObj.ptAt.x;
    case TokenType.T_Y:         return pObj.ptAt.y;
    case TokenType.T_TOP:       return pObj.bbox.ne.y;
    case TokenType.T_BOTTOM:    return pObj.bbox.sw.y;
    case TokenType.T_LEFT:      return pObj.bbox.sw.x;
    case TokenType.T_RIGHT:     return pObj.bbox.ne.x;
    default: return 0.0;
  }
}

// ---------------------------------------------------------------------------
// Built-in functions
// ---------------------------------------------------------------------------
export function pikFunc(p: Pik, pFunc: PToken, x: PNum, y: PNum): PNum {
  switch (pFunc.eCode) {
    case FN_ABS:  return x < 0 ? -x : x;
    case FN_COS:  return Math.cos(x);
    case FN_INT:  return Math.round(x);
    case FN_SIN:  return Math.sin(x);
    case FN_SQRT:
      if (x < 0) {
        pikError(p, pFunc, 'sqrt of negative value');
        return 0.0;
      }
      return Math.sqrt(x);
    case FN_MAX:  return x > y ? x : y;
    case FN_MIN:  return x < y ? x : y;
    case FN_D2R:  return x * Math.PI / 180;  // degrees to radians
    case FN_R2D:  return x * 180 / Math.PI;  // radians to degrees
    default:      return 0.0;
  }
}

// ---------------------------------------------------------------------------
// Name assignment
// ---------------------------------------------------------------------------
export function pikElemSetname(p: Pik, pObj: PObj | null, pName: PToken | null): void {
  if (!pObj || !pName) return;
  pObj.zName = pName.z.substring(0, pName.n);
}

// ---------------------------------------------------------------------------
// Chop helpers
// ---------------------------------------------------------------------------
export function pikFindChopper(pList: PList | null, pCenter: PPoint, pOther: PPoint): PObj | null {
  if (!pList) return null;
  for (let i = pList.n - 1; i >= 0; i--) {
    let pObj = pList.a[i];
    if (pObj.type.xChop &&
        pObj.ptAt.x === pCenter.x &&
        pObj.ptAt.y === pCenter.y &&
        !bboxContainsPoint(pObj.bbox, pOther)) {
      return pObj;
    } else if (pObj.pSublist) {
      pObj = pikFindChopper(pObj.pSublist, pCenter, pOther)!;
      if (pObj) return pObj;
    }
  }
  return null;
}

export function pikAutochop(p: Pik, pFrom: PPoint, pTo: PPoint, pObj: PObj | null): void {
  if (!pObj || !pObj.type.xChop) {
    pObj = pikFindChopper(p.list, pTo, pFrom);
  }
  if (pObj && pObj.type.xChop) {
    const chopped = pObj.type.xChop(p, pObj, pFrom);
    pTo.x = chopped.x;
    pTo.y = chopped.y;
  }
}

// ---------------------------------------------------------------------------
// Assert statements
// ---------------------------------------------------------------------------
export function pikAssert(p: Pik, e1: PNum, pEq: PToken, e2: PNum): null {
  const zE1 = numToStr(e1);
  const zE2 = numToStr(e2);
  if (zE1 !== zE2) {
    pikError(p, pEq, `${zE1} != ${zE2}`);
  }
  return null;
}

export function pikPositionAssert(p: Pik, e1: PPoint, pEq: PToken, e2: PPoint): null {
  const zE1 = `(${numToStr(e1.x)},${numToStr(e1.y)})`;
  const zE2 = `(${numToStr(e2.x)},${numToStr(e2.y)})`;
  if (zE1 !== zE2) {
    pikError(p, pEq, `${zE1} != ${zE2}`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layout settings
// ---------------------------------------------------------------------------
export function pikComputeLayoutSettings(p: Pik): void {
  if (p.bLayoutVars) return;
  let thickness = pikValue(p, 'thickness', 9).val;
  if (thickness <= 0.01) thickness = 0.01;
  const wArrow = 0.5 * pikValue(p, 'arrowwid', 8).val;
  p.wArrow = wArrow / thickness;
  p.hArrow = pikValue(p, 'arrowht', 7).val / thickness;
  p.fontScale = pikValue(p, 'fontscale', 9).val;
  if (p.fontScale <= 0.0) p.fontScale = 1.0;
  p.rScale = 144.0;
  p.charWidth = pikValue(p, 'charwid', 7).val * p.fontScale;
  p.charHeight = pikValue(p, 'charht', 6).val * p.fontScale;
  p.bLayoutVars = true;
}

// ---------------------------------------------------------------------------
// The main post-parse layout engine
// ---------------------------------------------------------------------------
export function pikAfterAddingAttributes(p: Pik, pObj: PObj): void {
  if (p.nErr) return;

  // Position block objects
  if (!pObj.type.isLine) {
    // Auto-fit text
    if (pObj.h <= 0.0) {
      if (pObj.nTxt === 0) {
        pObj.h = 0.0;
      } else if (pObj.w <= 0.0) {
        pikSizeToFit(p, pObj, pObj.errTok, 3);
      } else {
        pikSizeToFit(p, pObj, pObj.errTok, 2);
      }
    }
    if (pObj.w <= 0.0) {
      if (pObj.nTxt === 0) {
        pObj.w = 0.0;
      } else {
        pikSizeToFit(p, pObj, pObj.errTok, 1);
      }
    }
    // WITH positioning
    const ofst = pikElemOffset(p, pObj, pObj.eWith);
    const dx = (pObj.with.x - ofst.x) - pObj.ptAt.x;
    const dy = (pObj.with.y - ofst.y) - pObj.ptAt.y;
    if (dx !== 0 || dy !== 0) {
      pikElemMove(pObj, dx, dy);
    }
  }

  // For line objects with no movement, add default direction movement
  if (pObj.type.isLine && p.nTPath < 2) {
    pikNextRpath(p, null);
    switch (pObj.inDir) {
      default:        p.aTPath[1].x += pObj.w; break;
      case DIR_DOWN:  p.aTPath[1].y -= pObj.h; break;
      case DIR_LEFT:  p.aTPath[1].x -= pObj.w; break;
      case DIR_UP:    p.aTPath[1].y += pObj.h; break;
    }
    // Arc special handling
    if (arcInitFn && pObj.type.xInit === arcInitFn) {
      pObj.outDir = (pObj.inDir + (pObj.cw ? 1 : 3)) % 4;
      p.eDir = pObj.outDir;
      switch (pObj.outDir) {
        default:        p.aTPath[1].x += pObj.w; break;
        case DIR_DOWN:  p.aTPath[1].y -= pObj.h; break;
        case DIR_LEFT:  p.aTPath[1].x -= pObj.w; break;
        case DIR_UP:    p.aTPath[1].y += pObj.h; break;
      }
    }
  }

  // Initialize bounding box
  bboxInit(pObj.bbox);

  // Run object-specific check
  if (pObj.type.xCheck) {
    pObj.type.xCheck(p, pObj);
    if (p.nErr) return;
  }

  // Compute final bounding box, entry/exit, center, path
  if (pObj.type.isLine) {
    pObj.aPath = [];
    pObj.nPath = p.nTPath;
    for (let i = 0; i < p.nTPath; i++) {
      pObj.aPath.push(pointCopy(p.aTPath[i]));
    }

    // "chop" processing
    if (pObj.bChop && pObj.nPath >= 2) {
      const n = pObj.nPath;
      pikAutochop(p, pObj.aPath[n - 2], pObj.aPath[n - 1], pObj.pTo);
      pikAutochop(p, pObj.aPath[1], pObj.aPath[0], pObj.pFrom);
    }

    pObj.ptEnter = pointCopy(pObj.aPath[0]);
    pObj.ptExit = pointCopy(pObj.aPath[pObj.nPath - 1]);

    // Compute center from bounding box over vertexes
    for (let i = 0; i < pObj.nPath; i++) {
      bboxAddXY(pObj.bbox, pObj.aPath[i].x, pObj.aPath[i].y);
    }
    pObj.ptAt.x = (pObj.bbox.ne.x + pObj.bbox.sw.x) / 2.0;
    pObj.ptAt.y = (pObj.bbox.ne.y + pObj.bbox.sw.y) / 2.0;

    // Reset width/height to bounding box
    pObj.w = pObj.bbox.ne.x - pObj.bbox.sw.x;
    pObj.h = pObj.bbox.ne.y - pObj.bbox.sw.y;

    // Closed polygon exit adjustment
    if (pObj.bClose) {
      pikElemSetExit(pObj, pObj.inDir);
    }
  } else {
    const w2 = pObj.w / 2.0;
    const h2 = pObj.h / 2.0;
    pObj.ptEnter = pointCopy(pObj.ptAt);
    pObj.ptExit = pointCopy(pObj.ptAt);
    switch (pObj.inDir) {
      default:        pObj.ptEnter.x -= w2; break;
      case DIR_LEFT:  pObj.ptEnter.x += w2; break;
      case DIR_UP:    pObj.ptEnter.y -= h2; break;
      case DIR_DOWN:  pObj.ptEnter.y += h2; break;
    }
    switch (pObj.outDir) {
      default:        pObj.ptExit.x += w2; break;
      case DIR_LEFT:  pObj.ptExit.x -= w2; break;
      case DIR_UP:    pObj.ptExit.y += h2; break;
      case DIR_DOWN:  pObj.ptExit.y -= h2; break;
    }
    bboxAddXY(pObj.bbox, pObj.ptAt.x - w2, pObj.ptAt.y - h2);
    bboxAddXY(pObj.bbox, pObj.ptAt.x + w2, pObj.ptAt.y + h2);
  }
  p.eDir = pObj.outDir;
}
