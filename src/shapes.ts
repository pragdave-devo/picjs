// shapes.ts — Shape class definitions for pikchr TypeScript port
// Ported from pikchr.y lines 1013-1951, 1958-2004

import {
  PNum, PPoint, PBox, PToken, PClass, PObj, Pik, PList,
  cZeroPoint, pointCopy,
  CP_C, CP_N, CP_NE, CP_E, CP_SE, CP_S, CP_SW, CP_W, CP_NW,
  A_WIDTH, A_HEIGHT, A_RADIUS, A_FIT,
  DIR_RIGHT,
  TokenType,
  pikAppendXY, pikAppendX, pikAppendY, pikAppendDis, pikAppendArc, pikAppendClr,
  pikError, pikDist, numToStr,
  bboxInit, bboxAddBox, bboxAddXY, bboxAddEllipse, bboxIsEmpty,
} from './types.ts';

// Forward declarations - will be provided by the integration layer
export let pikValueFn: (p: Pik, name: string) => number = () => 0;
export function setPikValueFn(fn: (p: Pik, name: string) => number) {
  pikValueFn = fn;
}

// Forward declaration for pik_append_style (from renderer)
export let pikAppendStyleFn: (p: Pik, pObj: PObj, eFill: number) => void = () => {};
export function setPikAppendStyleFn(fn: (p: Pik, pObj: PObj, eFill: number) => void) {
  pikAppendStyleFn = fn;
}

// Forward declaration for pik_append_txt (from renderer)
export let pikAppendTxtFn: (p: Pik, pObj: PObj, pBox: PBox | null) => void = () => {};
export function setPikAppendTxtFn(fn: (p: Pik, pObj: PObj, pBox: PBox | null) => void) {
  pikAppendTxtFn = fn;
}

// Forward declaration for pik_size_to_fit (from layout)
export let pikSizeToFitFn: (p: Pik, pObj: PObj, pFit: PToken, eWhich: number) => void = () => {};
export function setPikSizeToFitFn(fn: (p: Pik, pObj: PObj, pFit: PToken, eWhich: number) => void) {
  pikSizeToFitFn = fn;
}

// ============================================================
// Utility functions
// ============================================================

/**
 * Reduce the length of the line segment by amt (if possible) by
 * modifying the location of t.
 * Ported from pikchr.y lines 1958-1970.
 */
export function pikChop(f: PPoint, t: PPoint, amt: PNum): void {
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= amt) {
    t.x = f.x;
    t.y = f.y;
    return;
  }
  const r = 1.0 - amt / dist;
  t.x = f.x + r * dx;
  t.y = f.y + r * dy;
}

/**
 * Draw an arrowhead on the end of the line segment from pFrom to pTo.
 * Also shorten the line segment so the shaft doesn't extend into the arrowhead.
 * Ported from pikchr.y lines 1977-2004.
 */
export function pikDrawArrowhead(p: Pik, f: PPoint, t: PPoint, pObj: PObj): void {
  let dx = t.x - f.x;
  let dy = t.y - f.y;
  const dist = Math.hypot(dx, dy);
  let h = p.hArrow * pObj.sw;
  const w = p.wArrow * pObj.sw;
  if (pObj.color < 0.0) return;
  if (pObj.sw <= 0.0) return;
  if (dist <= 0.0) return;
  dx /= dist;
  dy /= dist;
  let e1 = dist - h;
  if (e1 < 0.0) {
    e1 = 0.0;
    h = dist;
  }
  const ddx = -w * dy;
  const ddy = w * dx;
  const bx = f.x + e1 * dx;
  const by = f.y + e1 * dy;
  p.zOut += pikAppendXY(p, '<polygon points="', t.x, t.y);
  p.zOut += pikAppendXY(p, ' ', bx - ddx, by - ddy);
  p.zOut += pikAppendXY(p, ' ', bx + ddx, by + ddy);
  p.zOut += pikAppendClr(p, '" style="fill:', pObj.color, '"/>\n', false);
  pikChop(f, t, h / 2);
}

// ============================================================
// Arc
// ============================================================

export function arcInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'arcrad');
  pObj.h = pObj.w;
}

function arcControlPoint(cw: boolean, f: PPoint, t: PPoint): PPoint {
  const m: PPoint = { x: 0, y: 0 };
  m.x = 0.5 * (f.x + t.x);
  m.y = 0.5 * (f.y + t.y);
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  if (cw) {
    m.x -= 0.5 * dy;
    m.y += 0.5 * dx;
  } else {
    m.x += 0.5 * dy;
    m.y -= 0.5 * dx;
  }
  return m;
}

function arcCheck(p: Pik, pObj: PObj): void {
  if (p.nTPath > 2) {
    pikError(p, pObj.errTok, 'arc geometry error');
    return;
  }
  const f = p.aTPath[0];
  const t = p.aTPath[1];
  const m = arcControlPoint(pObj.cw, f, t);
  const sw = pObj.sw;
  for (let i = 1; i < 16; i++) {
    const t1 = 0.0625 * i;
    const t2 = 1.0 - t1;
    const a = t2 * t2;
    const b = 2 * t1 * t2;
    const c = t1 * t1;
    const x = a * f.x + b * m.x + c * t.x;
    const y = a * f.y + b * m.y + c * t.y;
    bboxAddEllipse(pObj.bbox, x, y, sw, sw);
  }
}

function arcRender(p: Pik, pObj: PObj): void {
  if (pObj.nPath < 2) return;
  if (pObj.sw < 0.0) return;
  const f = pObj.aPath[0];
  const t = pObj.aPath[1];
  const m = arcControlPoint(pObj.cw, f, t);
  if (pObj.larrow) {
    pikDrawArrowhead(p, m, f, pObj);
  }
  if (pObj.rarrow) {
    pikDrawArrowhead(p, m, t, pObj);
  }
  p.zOut += pikAppendXY(p, '<path d="M', f.x, f.y);
  p.zOut += pikAppendXY(p, 'Q', m.x, m.y);
  p.zOut += pikAppendXY(p, ' ', t.x, t.y);
  p.zOut += '" ';
  pikAppendStyleFn(p, pObj, 0);
  p.zOut += '" />\n';
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Arrow
// ============================================================

function arrowInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'linewid');
  pObj.h = pikValueFn(p, 'lineht');
  pObj.rad = pikValueFn(p, 'linerad');
  pObj.rarrow = true;
}

// ============================================================
// Box
// ============================================================

function boxInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'boxwid');
  pObj.h = pikValueFn(p, 'boxht');
  pObj.rad = pikValueFn(p, 'boxrad');
}

function boxOffset(_p: Pik, pObj: PObj, cp: number): PPoint {
  const pt: PPoint = { x: 0, y: 0 };
  const w2 = 0.5 * pObj.w;
  const h2 = 0.5 * pObj.h;
  let rad = pObj.rad;
  let rx: PNum;
  if (rad <= 0.0) {
    rx = 0.0;
  } else {
    if (rad > w2) rad = w2;
    if (rad > h2) rad = h2;
    rx = 0.29289321881345252392 * rad;
  }
  switch (cp) {
    case CP_C:                                    break;
    case CP_N:   pt.x = 0.0;     pt.y = h2;      break;
    case CP_NE:  pt.x = w2 - rx; pt.y = h2 - rx;  break;
    case CP_E:   pt.x = w2;      pt.y = 0.0;      break;
    case CP_SE:  pt.x = w2 - rx; pt.y = rx - h2;  break;
    case CP_S:   pt.x = 0.0;     pt.y = -h2;      break;
    case CP_SW:  pt.x = rx - w2; pt.y = rx - h2;  break;
    case CP_W:   pt.x = -w2;     pt.y = 0.0;      break;
    case CP_NW:  pt.x = rx - w2; pt.y = h2 - rx;  break;
  }
  return pt;
}

function boxChop(p: Pik, pObj: PObj, pPt: PPoint): PPoint {
  let cp = CP_C;
  const chop = pointCopy(pObj.ptAt);
  if (pObj.w <= 0.0) return chop;
  if (pObj.h <= 0.0) return chop;
  const dx = (pPt.x - pObj.ptAt.x) * pObj.h / pObj.w;
  const dy = pPt.y - pObj.ptAt.y;
  if (dx > 0.0) {
    if (dy >= 2.414 * dx) {
      cp = CP_N;
    } else if (dy >= 0.414 * dx) {
      cp = CP_NE;
    } else if (dy >= -0.414 * dx) {
      cp = CP_E;
    } else if (dy > -2.414 * dx) {
      cp = CP_SE;
    } else {
      cp = CP_S;
    }
  } else {
    if (dy >= -2.414 * dx) {
      cp = CP_N;
    } else if (dy >= -0.414 * dx) {
      cp = CP_NW;
    } else if (dy >= 0.414 * dx) {
      cp = CP_W;
    } else if (dy > 2.414 * dx) {
      cp = CP_SW;
    } else {
      cp = CP_S;
    }
  }
  const off = pObj.type.xOffset!(p, pObj, cp);
  return { x: off.x + pObj.ptAt.x, y: off.y + pObj.ptAt.y };
}

function boxFit(_p: Pik, pObj: PObj, w: PNum, h: PNum): void {
  if (w > 0) pObj.w = w;
  if (h > 0) pObj.h = h;
}

function boxRender(p: Pik, pObj: PObj): void {
  const w2 = 0.5 * pObj.w;
  const h2 = 0.5 * pObj.h;
  let rad = pObj.rad;
  const pt = pObj.ptAt;
  if (pObj.sw >= 0.0) {
    if (rad <= 0.0) {
      p.zOut += pikAppendXY(p, '<path d="M', pt.x - w2, pt.y - h2);
      p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y - h2);
      p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y + h2);
      p.zOut += pikAppendXY(p, 'L', pt.x - w2, pt.y + h2);
      p.zOut += 'Z" ';
    } else {
      if (rad > w2) rad = w2;
      if (rad > h2) rad = h2;
      const x0 = pt.x - w2;
      const x1 = x0 + rad;
      const x3 = pt.x + w2;
      const x2 = x3 - rad;
      const y0 = pt.y - h2;
      const y1 = y0 + rad;
      const y3 = pt.y + h2;
      const y2 = y3 - rad;
      p.zOut += pikAppendXY(p, '<path d="M', x1, y0);
      if (x2 > x1) p.zOut += pikAppendXY(p, 'L', x2, y0);
      p.zOut += pikAppendArc(p, rad, rad, x3, y1);
      if (y2 > y1) p.zOut += pikAppendXY(p, 'L', x3, y2);
      p.zOut += pikAppendArc(p, rad, rad, x2, y3);
      if (x2 > x1) p.zOut += pikAppendXY(p, 'L', x1, y3);
      p.zOut += pikAppendArc(p, rad, rad, x0, y2);
      if (y2 > y1) p.zOut += pikAppendXY(p, 'L', x0, y1);
      p.zOut += pikAppendArc(p, rad, rad, x1, y0);
      p.zOut += 'Z" ';
    }
    pikAppendStyleFn(p, pObj, 3);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Circle
// ============================================================

function circleInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'circlerad') * 2;
  pObj.h = pObj.w;
  pObj.rad = 0.5 * pObj.w;
}

function circleNumProp(_p: Pik, pObj: PObj, pId: PToken): void {
  switch (pId.eType) {
    case TokenType.T_DIAMETER:
    case TokenType.T_RADIUS:
      pObj.w = pObj.h = 2.0 * pObj.rad;
      break;
    case TokenType.T_WIDTH:
      pObj.h = pObj.w;
      pObj.rad = 0.5 * pObj.w;
      break;
    case TokenType.T_HEIGHT:
      pObj.w = pObj.h;
      pObj.rad = 0.5 * pObj.w;
      break;
  }
}

function circleChop(_p: Pik, pObj: PObj, pPt: PPoint): PPoint {
  const dx = pPt.x - pObj.ptAt.x;
  const dy = pPt.y - pObj.ptAt.y;
  const dist = Math.hypot(dx, dy);
  if (dist < pObj.rad || dist <= 0) return pointCopy(pObj.ptAt);
  return {
    x: pObj.ptAt.x + dx * pObj.rad / dist,
    y: pObj.ptAt.y + dy * pObj.rad / dist,
  };
}

function circleFit(_p: Pik, pObj: PObj, w: PNum, h: PNum): void {
  let mx = 0.0;
  if (w > 0) mx = w;
  if (h > mx) mx = h;
  if (w * h > 0 && (w * w + h * h) > mx * mx) {
    mx = Math.hypot(w, h);
  }
  if (mx > 0.0) {
    pObj.rad = 0.5 * mx;
    pObj.w = pObj.h = mx;
  }
}

function circleRender(p: Pik, pObj: PObj): void {
  const r = pObj.rad;
  const pt = pObj.ptAt;
  if (pObj.sw >= 0.0) {
    p.zOut += pikAppendX(p, '<circle cx="', pt.x, '"');
    p.zOut += pikAppendY(p, ' cy="', pt.y, '"');
    p.zOut += pikAppendDis(p, ' r="', r, '" ');
    pikAppendStyleFn(p, pObj, 3);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Cylinder
// ============================================================

function cylinderInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'cylwid');
  pObj.h = pikValueFn(p, 'cylht');
  pObj.rad = pikValueFn(p, 'cylrad');
}

function cylinderFit(_p: Pik, pObj: PObj, w: PNum, h: PNum): void {
  if (w > 0) pObj.w = w;
  if (h > 0) pObj.h = h + 0.25 * pObj.rad + pObj.sw;
}

function cylinderRender(p: Pik, pObj: PObj): void {
  const w2 = 0.5 * pObj.w;
  const h2 = 0.5 * pObj.h;
  let rad = pObj.rad;
  const pt = pObj.ptAt;
  if (pObj.sw >= 0.0) {
    if (rad > h2) {
      rad = h2;
    } else if (rad < 0) {
      rad = 0;
    }
    p.zOut += pikAppendXY(p, '<path d="M', pt.x - w2, pt.y + h2 - rad);
    p.zOut += pikAppendXY(p, 'L', pt.x - w2, pt.y - h2 + rad);
    p.zOut += pikAppendArc(p, w2, rad, pt.x + w2, pt.y - h2 + rad);
    p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y + h2 - rad);
    p.zOut += pikAppendArc(p, w2, rad, pt.x - w2, pt.y + h2 - rad);
    p.zOut += pikAppendArc(p, w2, rad, pt.x + w2, pt.y + h2 - rad);
    p.zOut += '" ';
    pikAppendStyleFn(p, pObj, 3);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

function cylinderOffset(_p: Pik, pObj: PObj, cp: number): PPoint {
  const pt: PPoint = { x: 0, y: 0 };
  const w2 = pObj.w * 0.5;
  const h1 = pObj.h * 0.5;
  const h2 = h1 - pObj.rad;
  switch (cp) {
    case CP_C:                                 break;
    case CP_N:   pt.x = 0.0;   pt.y = h1;     break;
    case CP_NE:  pt.x = w2;    pt.y = h2;     break;
    case CP_E:   pt.x = w2;    pt.y = 0.0;    break;
    case CP_SE:  pt.x = w2;    pt.y = -h2;    break;
    case CP_S:   pt.x = 0.0;   pt.y = -h1;    break;
    case CP_SW:  pt.x = -w2;   pt.y = -h2;    break;
    case CP_W:   pt.x = -w2;   pt.y = 0.0;    break;
    case CP_NW:  pt.x = -w2;   pt.y = h2;     break;
  }
  return pt;
}

// ============================================================
// Dot
// ============================================================

function dotInit(p: Pik, pObj: PObj): void {
  pObj.rad = pikValueFn(p, 'dotrad');
  pObj.h = pObj.w = pObj.rad * 6;
  pObj.fill = pObj.color;
}

function dotNumProp(_p: Pik, pObj: PObj, pId: PToken): void {
  switch (pId.eType) {
    case TokenType.T_COLOR:
      pObj.fill = pObj.color;
      break;
    case TokenType.T_FILL:
      pObj.color = pObj.fill;
      break;
  }
}

function dotCheck(_p: Pik, pObj: PObj): void {
  pObj.w = pObj.h = 0;
  bboxAddEllipse(pObj.bbox, pObj.ptAt.x, pObj.ptAt.y, pObj.rad, pObj.rad);
}

function dotOffset(_p: Pik, _pObj: PObj, _cp: number): PPoint {
  return { x: 0, y: 0 };
}

function dotRender(p: Pik, pObj: PObj): void {
  const r = pObj.rad;
  const pt = pObj.ptAt;
  if (pObj.sw >= 0.0) {
    p.zOut += pikAppendX(p, '<circle cx="', pt.x, '"');
    p.zOut += pikAppendY(p, ' cy="', pt.y, '"');
    p.zOut += pikAppendDis(p, ' r="', r, '"');
    pikAppendStyleFn(p, pObj, 2);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Diamond
// ============================================================

function diamondInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'diamondwid');
  pObj.h = pikValueFn(p, 'diamondht');
  pObj.bAltAutoFit = true;
}

function diamondOffset(_p: Pik, pObj: PObj, cp: number): PPoint {
  const pt: PPoint = { x: 0, y: 0 };
  const w2 = 0.5 * pObj.w;
  const w4 = 0.25 * pObj.w;
  const h2 = 0.5 * pObj.h;
  const h4 = 0.25 * pObj.h;
  switch (cp) {
    case CP_C:                                    break;
    case CP_N:   pt.x = 0.0;   pt.y = h2;        break;
    case CP_NE:  pt.x = w4;    pt.y = h4;        break;
    case CP_E:   pt.x = w2;    pt.y = 0.0;       break;
    case CP_SE:  pt.x = w4;    pt.y = -h4;       break;
    case CP_S:   pt.x = 0.0;   pt.y = -h2;       break;
    case CP_SW:  pt.x = -w4;   pt.y = -h4;       break;
    case CP_W:   pt.x = -w2;   pt.y = 0.0;       break;
    case CP_NW:  pt.x = -w4;   pt.y = h4;        break;
  }
  return pt;
}

function diamondFit(_p: Pik, pObj: PObj, w: PNum, h: PNum): void {
  if (pObj.w <= 0) pObj.w = w * 1.5;
  if (pObj.h <= 0) pObj.h = h * 1.5;
  if (pObj.w > 0 && pObj.h > 0) {
    const x = pObj.w * h / pObj.h + w;
    const y = pObj.h * x / pObj.w;
    pObj.w = x;
    pObj.h = y;
  }
}

function diamondRender(p: Pik, pObj: PObj): void {
  const w2 = 0.5 * pObj.w;
  const h2 = 0.5 * pObj.h;
  const pt = pObj.ptAt;
  if (pObj.sw >= 0.0) {
    p.zOut += pikAppendXY(p, '<path d="M', pt.x - w2, pt.y);
    p.zOut += pikAppendXY(p, 'L', pt.x, pt.y - h2);
    p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y);
    p.zOut += pikAppendXY(p, 'L', pt.x, pt.y + h2);
    p.zOut += 'Z" ';
    pikAppendStyleFn(p, pObj, 3);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Ellipse
// ============================================================

function ellipseInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'ellipsewid');
  pObj.h = pikValueFn(p, 'ellipseht');
}

function ellipseChop(_p: Pik, pObj: PObj, pPt: PPoint): PPoint {
  const dx = pPt.x - pObj.ptAt.x;
  const dy = pPt.y - pObj.ptAt.y;
  if (pObj.w <= 0.0) return pointCopy(pObj.ptAt);
  if (pObj.h <= 0.0) return pointCopy(pObj.ptAt);
  const s = pObj.h / pObj.w;
  const dq = dx * s;
  const dist = Math.hypot(dq, dy);
  if (dist < pObj.h) return pointCopy(pObj.ptAt);
  return {
    x: pObj.ptAt.x + 0.5 * dq * pObj.h / (dist * s),
    y: pObj.ptAt.y + 0.5 * dy * pObj.h / dist,
  };
}

function ellipseOffset(_p: Pik, pObj: PObj, cp: number): PPoint {
  const pt: PPoint = { x: 0, y: 0 };
  const w = pObj.w * 0.5;
  const w2 = w * 0.70710678118654747608;
  const h = pObj.h * 0.5;
  const h2 = h * 0.70710678118654747608;
  switch (cp) {
    case CP_C:                                break;
    case CP_N:   pt.x = 0.0;   pt.y = h;     break;
    case CP_NE:  pt.x = w2;    pt.y = h2;    break;
    case CP_E:   pt.x = w;     pt.y = 0.0;   break;
    case CP_SE:  pt.x = w2;    pt.y = -h2;   break;
    case CP_S:   pt.x = 0.0;   pt.y = -h;    break;
    case CP_SW:  pt.x = -w2;   pt.y = -h2;   break;
    case CP_W:   pt.x = -w;    pt.y = 0.0;   break;
    case CP_NW:  pt.x = -w2;   pt.y = h2;    break;
  }
  return pt;
}

function ellipseRender(p: Pik, pObj: PObj): void {
  const w = pObj.w;
  const h = pObj.h;
  const pt = pObj.ptAt;
  if (pObj.sw >= 0.0) {
    p.zOut += pikAppendX(p, '<ellipse cx="', pt.x, '"');
    p.zOut += pikAppendY(p, ' cy="', pt.y, '"');
    p.zOut += pikAppendDis(p, ' rx="', w / 2.0, '"');
    p.zOut += pikAppendDis(p, ' ry="', h / 2.0, '" ');
    pikAppendStyleFn(p, pObj, 3);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// File
// ============================================================

function fileInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'filewid');
  pObj.h = pikValueFn(p, 'fileht');
  pObj.rad = pikValueFn(p, 'filerad');
}

function fileOffset(_p: Pik, pObj: PObj, cp: number): PPoint {
  const pt: PPoint = { x: 0, y: 0 };
  const w2 = 0.5 * pObj.w;
  const h2 = 0.5 * pObj.h;
  let rx = pObj.rad;
  const mn = w2 < h2 ? w2 : h2;
  if (rx > mn) rx = mn;
  if (rx < mn * 0.25) rx = mn * 0.25;
  rx *= 0.5;
  switch (cp) {
    case CP_C:                                    break;
    case CP_N:   pt.x = 0.0;      pt.y = h2;     break;
    case CP_NE:  pt.x = w2 - rx;  pt.y = h2 - rx; break;
    case CP_E:   pt.x = w2;       pt.y = 0.0;     break;
    case CP_SE:  pt.x = w2;       pt.y = -h2;     break;
    case CP_S:   pt.x = 0.0;      pt.y = -h2;     break;
    case CP_SW:  pt.x = -w2;      pt.y = -h2;     break;
    case CP_W:   pt.x = -w2;      pt.y = 0.0;     break;
    case CP_NW:  pt.x = -w2;      pt.y = h2;      break;
  }
  return pt;
}

function fileFit(_p: Pik, pObj: PObj, w: PNum, h: PNum): void {
  if (w > 0) pObj.w = w;
  if (h > 0) pObj.h = h + 2 * pObj.rad;
}

function fileRender(p: Pik, pObj: PObj): void {
  const w2 = 0.5 * pObj.w;
  const h2 = 0.5 * pObj.h;
  let rad = pObj.rad;
  const pt = pObj.ptAt;
  const mn = w2 < h2 ? w2 : h2;
  if (rad > mn) rad = mn;
  if (rad < mn * 0.25) rad = mn * 0.25;
  if (pObj.sw >= 0.0) {
    p.zOut += pikAppendXY(p, '<path d="M', pt.x - w2, pt.y - h2);
    p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y - h2);
    p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y + (h2 - rad));
    p.zOut += pikAppendXY(p, 'L', pt.x + (w2 - rad), pt.y + h2);
    p.zOut += pikAppendXY(p, 'L', pt.x - w2, pt.y + h2);
    p.zOut += 'Z" ';
    pikAppendStyleFn(p, pObj, 1);
    p.zOut += '" />\n';
    p.zOut += pikAppendXY(p, '<path d="M', pt.x + (w2 - rad), pt.y + h2);
    p.zOut += pikAppendXY(p, 'L', pt.x + (w2 - rad), pt.y + (h2 - rad));
    p.zOut += pikAppendXY(p, 'L', pt.x + w2, pt.y + (h2 - rad));
    p.zOut += '" ';
    pikAppendStyleFn(p, pObj, 0);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Line
// ============================================================

function lineInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'linewid');
  pObj.h = pikValueFn(p, 'lineht');
  pObj.rad = pikValueFn(p, 'linerad');
}

function lineOffset(p: Pik, pObj: PObj, cp: number): PPoint {
  return boxOffset(p, pObj, cp);
}

function lineRender(p: Pik, pObj: PObj): void {
  if (pObj.sw > 0.0) {
    let z = '<path d="M';
    const n = pObj.nPath;
    if (pObj.larrow) {
      pikDrawArrowhead(p, pObj.aPath[1], pObj.aPath[0], pObj);
    }
    if (pObj.rarrow) {
      pikDrawArrowhead(p, pObj.aPath[n - 2], pObj.aPath[n - 1], pObj);
    }
    for (let i = 0; i < pObj.nPath; i++) {
      p.zOut += pikAppendXY(p, z, pObj.aPath[i].x, pObj.aPath[i].y);
      z = 'L';
    }
    if (pObj.bClose) {
      p.zOut += 'Z';
    } else {
      pObj.fill = -1.0;
    }
    p.zOut += '" ';
    pikAppendStyleFn(p, pObj, pObj.bClose ? 3 : 0);
    p.zOut += '" />\n';
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Move
// ============================================================

function moveInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'movewid');
  pObj.h = pObj.w;
  pObj.fill = -1.0;
  pObj.color = -1.0;
  pObj.sw = -1.0;
}

function moveRender(_p: Pik, _pObj: PObj): void {
  // No-op
}

// ============================================================
// Oval
// ============================================================

function ovalInit(p: Pik, pObj: PObj): void {
  pObj.h = pikValueFn(p, 'ovalht');
  pObj.w = pikValueFn(p, 'ovalwid');
  pObj.rad = 0.5 * (pObj.h < pObj.w ? pObj.h : pObj.w);
}

function ovalNumProp(_p: Pik, pObj: PObj, _pId: PToken): void {
  pObj.rad = 0.5 * (pObj.h < pObj.w ? pObj.h : pObj.w);
}

function ovalFit(_p: Pik, pObj: PObj, w: PNum, h: PNum): void {
  if (w > 0) pObj.w = w;
  if (h > 0) pObj.h = h;
  if (pObj.w < pObj.h) pObj.w = pObj.h;
  pObj.rad = 0.5 * (pObj.h < pObj.w ? pObj.h : pObj.w);
}

// ============================================================
// Spline
// ============================================================

function splineInit(p: Pik, pObj: PObj): void {
  pObj.w = pikValueFn(p, 'linewid');
  pObj.h = pikValueFn(p, 'lineht');
  pObj.rad = 1000;
}

/**
 * Return a point along the path from f to t that is r units
 * prior to reaching t, or the midpoint if the path is < 2*r total.
 */
function radiusMidpoint(f: PPoint, t: PPoint, r: PNum): { pt: PPoint; isMid: boolean } {
  let dx = t.x - f.x;
  let dy = t.y - f.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.0) return { pt: pointCopy(t), isMid: false };
  dx /= dist;
  dy /= dist;
  let isMid = false;
  let rr = r;
  if (rr > 0.5 * dist) {
    rr = 0.5 * dist;
    isMid = true;
  }
  return {
    pt: { x: t.x - rr * dx, y: t.y - rr * dy },
    isMid,
  };
}

function radiusPath(p: Pik, pObj: PObj, r: PNum): void {
  const n = pObj.nPath;
  const a = pObj.aPath;
  let an = a[n - 1];
  const iLast = pObj.bClose ? n : n - 1;

  p.zOut += pikAppendXY(p, '<path d="M', a[0].x, a[0].y);
  let rm = radiusMidpoint(a[0], a[1], r);
  p.zOut += pikAppendXY(p, ' L ', rm.pt.x, rm.pt.y);
  for (let i = 1; i < iLast; i++) {
    an = i < n - 1 ? a[i + 1] : a[0];
    rm = radiusMidpoint(an, a[i], r);
    p.zOut += pikAppendXY(p, ' Q ', a[i].x, a[i].y);
    p.zOut += pikAppendXY(p, ' ', rm.pt.x, rm.pt.y);
    if (!rm.isMid) {
      rm = radiusMidpoint(a[i], an, r);
      p.zOut += pikAppendXY(p, ' L ', rm.pt.x, rm.pt.y);
    }
  }
  p.zOut += pikAppendXY(p, ' L ', an.x, an.y);
  if (pObj.bClose) {
    p.zOut += 'Z';
  } else {
    pObj.fill = -1.0;
  }
  p.zOut += '" ';
  pikAppendStyleFn(p, pObj, pObj.bClose ? 3 : 0);
  p.zOut += '" />\n';
}

function splineRender(p: Pik, pObj: PObj): void {
  if (pObj.sw > 0.0) {
    const n = pObj.nPath;
    const r = pObj.rad;
    if (n < 3 || r <= 0.0) {
      lineRender(p, pObj);
      return;
    }
    if (pObj.larrow) {
      pikDrawArrowhead(p, pObj.aPath[1], pObj.aPath[0], pObj);
    }
    if (pObj.rarrow) {
      pikDrawArrowhead(p, pObj.aPath[n - 2], pObj.aPath[n - 1], pObj);
    }
    radiusPath(p, pObj, pObj.rad);
  }
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Text
// ============================================================

function textInit(p: Pik, pObj: PObj): void {
  // Touch variables to ensure layout cache, but don't assign
  pikValueFn(p, 'textwid');
  pikValueFn(p, 'textht');
  pObj.sw = 0.0;
}

function textOffset(p: Pik, pObj: PObj, cp: number): PPoint {
  pikSizeToFitFn(p, pObj, pObj.errTok, 3);
  return boxOffset(p, pObj, cp);
}

function textRender(p: Pik, pObj: PObj): void {
  pikAppendTxtFn(p, pObj, null);
}

// ============================================================
// Sublist
// ============================================================

function sublistInit(_p: Pik, pObj: PObj): void {
  // Sublists are invisible containers - ensure they don't render
  pObj.sw = -1.0;
  pObj.fill = -1.0;
  pObj.color = -1.0;
  const pList = pObj.pSublist;
  if (!pList) return;
  bboxInit(pObj.bbox);
  for (let i = 0; i < pList.n; i++) {
    bboxAddBox(pObj.bbox, pList.a[i].bbox);
  }
  pObj.w = pObj.bbox.ne.x - pObj.bbox.sw.x;
  pObj.h = pObj.bbox.ne.y - pObj.bbox.sw.y;
  pObj.ptAt.x = 0.5 * (pObj.bbox.ne.x + pObj.bbox.sw.x);
  pObj.ptAt.y = 0.5 * (pObj.bbox.ne.y + pObj.bbox.sw.y);
  pObj.mCalc |= A_WIDTH | A_HEIGHT | A_RADIUS;
}

// ============================================================
// Shape class table (aClass array)
// Ported from pikchr.y lines 1772-1951
// ============================================================

export const aClass: PClass[] = [
  {
    zName: 'arc',
    isLine: true,
    eJust: 0,
    xInit: arcInit,
    xNumProp: null,
    xCheck: arcCheck,
    xChop: null,
    xOffset: boxOffset,
    xFit: null,
    xRender: arcRender,
  },
  {
    zName: 'arrow',
    isLine: true,
    eJust: 0,
    xInit: arrowInit,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: lineOffset,
    xFit: null,
    xRender: splineRender,
  },
  {
    zName: 'box',
    isLine: false,
    eJust: 1,
    xInit: boxInit,
    xNumProp: null,
    xCheck: null,
    xChop: boxChop,
    xOffset: boxOffset,
    xFit: boxFit,
    xRender: boxRender,
  },
  {
    zName: 'circle',
    isLine: false,
    eJust: 0,
    xInit: circleInit,
    xNumProp: circleNumProp,
    xCheck: null,
    xChop: circleChop,
    xOffset: ellipseOffset,
    xFit: circleFit,
    xRender: circleRender,
  },
  {
    zName: 'cylinder',
    isLine: false,
    eJust: 1,
    xInit: cylinderInit,
    xNumProp: null,
    xCheck: null,
    xChop: boxChop,
    xOffset: cylinderOffset,
    xFit: cylinderFit,
    xRender: cylinderRender,
  },
  {
    zName: 'diamond',
    isLine: false,
    eJust: 0,
    xInit: diamondInit,
    xNumProp: null,
    xCheck: null,
    xChop: boxChop,
    xOffset: diamondOffset,
    xFit: diamondFit,
    xRender: diamondRender,
  },
  {
    zName: 'dot',
    isLine: false,
    eJust: 0,
    xInit: dotInit,
    xNumProp: dotNumProp,
    xCheck: dotCheck,
    xChop: circleChop,
    xOffset: dotOffset,
    xFit: null,
    xRender: dotRender,
  },
  {
    zName: 'ellipse',
    isLine: false,
    eJust: 0,
    xInit: ellipseInit,
    xNumProp: null,
    xCheck: null,
    xChop: ellipseChop,
    xOffset: ellipseOffset,
    xFit: boxFit,
    xRender: ellipseRender,
  },
  {
    zName: 'file',
    isLine: false,
    eJust: 1,
    xInit: fileInit,
    xNumProp: null,
    xCheck: null,
    xChop: boxChop,
    xOffset: fileOffset,
    xFit: fileFit,
    xRender: fileRender,
  },
  {
    zName: 'line',
    isLine: true,
    eJust: 0,
    xInit: lineInit,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: lineOffset,
    xFit: null,
    xRender: splineRender,
  },
  {
    zName: 'move',
    isLine: true,
    eJust: 0,
    xInit: moveInit,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: boxOffset,
    xFit: null,
    xRender: moveRender,
  },
  {
    zName: 'oval',
    isLine: false,
    eJust: 1,
    xInit: ovalInit,
    xNumProp: ovalNumProp,
    xCheck: null,
    xChop: boxChop,
    xOffset: boxOffset,
    xFit: ovalFit,
    xRender: boxRender,
  },
  {
    zName: 'spline',
    isLine: true,
    eJust: 0,
    xInit: splineInit,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: lineOffset,
    xFit: null,
    xRender: splineRender,
  },
  {
    zName: 'text',
    isLine: false,
    eJust: 0,
    xInit: textInit,
    xNumProp: null,
    xCheck: null,
    xChop: boxChop,
    xOffset: textOffset,
    xFit: boxFit,
    xRender: textRender,
  },
];

export const sublistClass: PClass = {
  zName: '[]',
  isLine: false,
  eJust: 0,
  xInit: sublistInit,
  xNumProp: null,
  xCheck: null,
  xChop: null,
  xOffset: boxOffset,
  xFit: null,
  xRender: null,
};

export const noopClass: PClass = {
  zName: 'noop',
  isLine: false,
  eJust: 0,
  xInit: null,
  xNumProp: null,
  xCheck: null,
  xChop: null,
  xOffset: boxOffset,
  xFit: null,
  xRender: null,
};
