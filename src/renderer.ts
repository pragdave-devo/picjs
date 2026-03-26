// renderer.ts — SVG output generation for pikchr TypeScript port
// Ported from pikchr.y lines 2018-2600, 4462-4648

import {
  type PNum, type PPoint, type PBox, type PToken, type PClass, type PObj, type PList, type Pik,
  TokenType,
  TP_LJUST, TP_RJUST, TP_JMASK, TP_ABOVE, TP_ABOVE2, TP_CENTER,
  TP_BELOW, TP_BELOW2, TP_VMASK,
  TP_BIG, TP_SMALL, TP_XTRA, TP_SZMASK, TP_ITALIC, TP_BOLD, TP_MONO, TP_FMASK, TP_ALIGN,
  pikAppendX, pikAppendY, pikAppendXY, pikAppendDis, pikAppendArc, pikAppendClr,
  pikRound, pikError, numToStr,
  bboxInit, bboxAddBox, bboxAddXY, bboxAddEllipse, bboxIsEmpty,
  makeToken,
} from './types.ts';

import {
  pikValue, pikValueInt, pikLookupColor, pikTextLength,
} from './constants.ts';

import {
  pikComputeLayoutSettings,
} from './layout.ts';

import { getAnimations } from './evaluator.ts';
import type { AnimationDescriptor, ConnectorConstraint, ShapeGeometry } from './animation.ts';

// ---------------------------------------------------------------------------
// HTML entity check
// ---------------------------------------------------------------------------
function pikIsEntity(zText: string, start: number, n: number): boolean {
  if (n < 4 || zText[start] !== '&') return false;
  let pos = start + 1;
  const end = start + n;
  if (zText[pos] === '#') {
    pos++;
    let digitCount = 0;
    while (pos < end) {
      if (digitCount > 1 && zText[pos] === ';') return true;
      if (zText[pos] < '0' || zText[pos] > '9') return false;
      digitCount++;
      pos++;
    }
  } else {
    let charCount = 0;
    while (pos < end) {
      const c = zText[pos];
      if (charCount > 1 && c === ';') return true;
      if (charCount > 0 && c >= '0' && c <= '9') {
        charCount++;
        pos++;
        continue;
      }
      if ((c < 'A' || c > 'z') || (c > 'Z' && c < 'a')) return false;
      charCount++;
      pos++;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Text escaping for SVG
// ---------------------------------------------------------------------------
function pikAppendText(text: string, n: number, mFlags: number): string {
  const bQSpace = (mFlags & 1) !== 0;
  const bQAmp = (mFlags & 2) !== 0;
  let out = '';
  let pos = 0;

  while (pos < n) {
    let i = pos;
    while (i < n) {
      const c = text[i];
      if (c === '<' || c === '>') break;
      if (c === ' ' && bQSpace) break;
      if (c === '&' && bQAmp) break;
      i++;
    }
    if (i > pos) out += text.substring(pos, i);
    if (i >= n) break;
    const c = text[i];
    switch (c) {
      case '<': out += '&lt;'; break;
      case '>': out += '&gt;'; break;
      case ' ': out += '\u00a0'; break;
      case '&':
        if (pikIsEntity(text, i, n - i)) out += '&';
        else out += '&amp;';
        break;
    }
    pos = i + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Append style attribute (leaves quote unterminated for caller)
// ---------------------------------------------------------------------------
export function pikAppendStyle(p: Pik, pObj: PObj, eFill: number): void {
  let clrIsBg = 0;
  p.zOut += ' style="';
  if (pObj.fill >= 0 && eFill) {
    let fillIsBg = true;
    if (pObj.fill === pObj.color) {
      if (eFill === 2) fillIsBg = false;
      if (eFill === 3) clrIsBg = 1;
    }
    p.zOut += pikAppendClr(p, 'fill:', pObj.fill, ';', fillIsBg);
  } else {
    p.zOut += 'fill:none;';
  }
  if (pObj.sw >= 0.0 && pObj.color >= 0.0) {
    const sw = pObj.sw;
    p.zOut += pikAppendDis(p, 'stroke-width:', sw, ';');
    if (pObj.nPath > 2 && pObj.rad <= pObj.sw) {
      p.zOut += 'stroke-linejoin:round;';
    }
    p.zOut += pikAppendClr(p, 'stroke:', pObj.color, ';', clrIsBg !== 0);
    if (pObj.dotted > 0.0) {
      const v = pObj.dotted;
      let dashSw = sw;
      if (dashSw < 2.1 / p.rScale) dashSw = 2.1 / p.rScale;
      p.zOut += pikAppendDis(p, 'stroke-dasharray:', dashSw, '');
      p.zOut += pikAppendDis(p, ',', v, ';');
    } else if (pObj.dashed > 0.0) {
      const v = pObj.dashed;
      p.zOut += pikAppendDis(p, 'stroke-dasharray:', v, '');
      p.zOut += pikAppendDis(p, ',', v, ';');
    }
  }
  if (pObj.opacity >= 0 && pObj.opacity < 0.999) {
    p.zOut += `opacity:${numToStr(pObj.opacity)};`;
  }
}

// ---------------------------------------------------------------------------
// Font scale
// ---------------------------------------------------------------------------
function pikFontScale(t: PToken): PNum {
  let scale = 1.0;
  if (t.eCode & TP_BIG) scale *= 1.25;
  if (t.eCode & TP_SMALL) scale *= 0.8;
  if (t.eCode & TP_XTRA) scale *= scale;
  return scale;
}

// ---------------------------------------------------------------------------
// Vertical layout for text items
// ---------------------------------------------------------------------------
function pikTxtVerticalLayout(pObj: PObj): void {
  const n = pObj.nTxt;
  if (n === 0) return;
  const aTxt = pObj.aTxt;

  if (n === 1) {
    if ((aTxt[0].eCode & TP_VMASK) === 0) {
      aTxt[0].eCode |= TP_CENTER;
    }
    return;
  }

  let allSlots = 0;
  const aFree: number[] = [];
  let iSlot: number;

  // If there is more than one TP_ABOVE, change the first to TP_ABOVE2
  for (let j = 0, mJust = 0, i = n - 1; i >= 0; i--) {
    if (aTxt[i].eCode & TP_ABOVE) {
      if (j === 0) {
        j++;
        mJust = aTxt[i].eCode & TP_JMASK;
      } else if (j === 1 && mJust !== 0 && (aTxt[i].eCode & mJust) === 0) {
        j++;
      } else {
        aTxt[i].eCode = (aTxt[i].eCode & ~TP_VMASK) | TP_ABOVE2;
        break;
      }
    }
  }
  // If there is more than one TP_BELOW, change the last to TP_BELOW2
  for (let j = 0, mJust = 0, i = 0; i < n; i++) {
    if (aTxt[i].eCode & TP_BELOW) {
      if (j === 0) {
        j++;
        mJust = aTxt[i].eCode & TP_JMASK;
      } else if (j === 1 && mJust !== 0 && (aTxt[i].eCode & mJust) === 0) {
        j++;
      } else {
        aTxt[i].eCode = (aTxt[i].eCode & ~TP_VMASK) | TP_BELOW2;
        break;
      }
    }
  }

  // Mask of all used slots
  for (let i = 0; i < n; i++) allSlots |= aTxt[i].eCode & TP_VMASK;

  // Array of available slots
  if (n === 2 &&
      ((aTxt[0].eCode | aTxt[1].eCode) & TP_JMASK) === (TP_LJUST | TP_RJUST)) {
    iSlot = 2;
    aFree[0] = TP_CENTER;
    aFree[1] = TP_CENTER;
  } else {
    iSlot = 0;
    if (n >= 4 && (allSlots & TP_ABOVE2) === 0) aFree[iSlot++] = TP_ABOVE2;
    if ((allSlots & TP_ABOVE) === 0) aFree[iSlot++] = TP_ABOVE;
    if ((n & 1) !== 0) aFree[iSlot++] = TP_CENTER;
    if ((allSlots & TP_BELOW) === 0) aFree[iSlot++] = TP_BELOW;
    if (n >= 4 && (allSlots & TP_BELOW2) === 0) aFree[iSlot++] = TP_BELOW2;
  }

  // Assign VMASK for all unassigned texts
  for (let i = 0, s = 0; i < n; i++) {
    if ((aTxt[i].eCode & TP_VMASK) === 0) {
      aTxt[i].eCode |= aFree[s++];
    }
  }
}

// ---------------------------------------------------------------------------
// Append text labels (or compute bounding box if pBox is non-null)
// ---------------------------------------------------------------------------
export function pikAppendTxt(p: Pik, pObj: PObj, pBox: PBox | null): void {
  if (p.nErr) return;
  if (pObj.nTxt === 0) return;

  const aTxt = pObj.aTxt;
  const n = pObj.nTxt;
  pikTxtVerticalLayout(pObj);
  const x = pObj.ptAt.x;
  let allMask = 0;
  for (let i = 0; i < n; i++) allMask |= aTxt[i].eCode;

  const sw = pObj.sw >= 0.0 ? pObj.sw : 0;
  let yBase = 0.0;
  let ha2 = 0.0, ha1 = 0.0, hc = 0.0, hb1 = 0.0, hb2 = 0.0;

  if (pObj.type.isLine) {
    hc = sw * 1.5;
  } else if (pObj.rad > 0.0 && pObj.type.zName === 'cylinder') {
    yBase = -0.75 * pObj.rad;
  }

  if (allMask & TP_CENTER) {
    for (let i = 0; i < n; i++) {
      if (aTxt[i].eCode & TP_CENTER) {
        const s = pikFontScale(aTxt[i]);
        if (hc < s * p.charHeight) hc = s * p.charHeight;
      }
    }
  }
  if (allMask & TP_ABOVE) {
    for (let i = 0; i < n; i++) {
      if (aTxt[i].eCode & TP_ABOVE) {
        const s = pikFontScale(aTxt[i]) * p.charHeight;
        if (ha1 < s) ha1 = s;
      }
    }
    if (allMask & TP_ABOVE2) {
      for (let i = 0; i < n; i++) {
        if (aTxt[i].eCode & TP_ABOVE2) {
          const s = pikFontScale(aTxt[i]) * p.charHeight;
          if (ha2 < s) ha2 = s;
        }
      }
    }
  }
  if (allMask & TP_BELOW) {
    for (let i = 0; i < n; i++) {
      if (aTxt[i].eCode & TP_BELOW) {
        const s = pikFontScale(aTxt[i]) * p.charHeight;
        if (hb1 < s) hb1 = s;
      }
    }
    if (allMask & TP_BELOW2) {
      for (let i = 0; i < n; i++) {
        if (aTxt[i].eCode & TP_BELOW2) {
          const s = pikFontScale(aTxt[i]) * p.charHeight;
          if (hb2 < s) hb2 = s;
        }
      }
    }
  }

  let jw: PNum;
  if (pObj.type.eJust === 1) {
    jw = 0.5 * (pObj.w - 0.5 * (p.charWidth + sw));
  } else {
    jw = 0.0;
  }

  for (let i = 0; i < n; i++) {
    const t = aTxt[i];
    let xtraFontScale = pikFontScale(t);
    let nx: PNum = 0;
    const orig_y = pObj.ptAt.y;
    let y = yBase;

    if (t.eCode & TP_ABOVE2) y += 0.5 * hc + ha1 + 0.5 * ha2;
    if (t.eCode & TP_ABOVE)  y += 0.5 * hc + 0.5 * ha1;
    if (t.eCode & TP_BELOW)  y -= 0.5 * hc + 0.5 * hb1;
    if (t.eCode & TP_BELOW2) y -= 0.5 * hc + hb1 + 0.5 * hb2;
    if (t.eCode & TP_LJUST)  nx -= jw;
    if (t.eCode & TP_RJUST)  nx += jw;

    if (pBox !== null) {
      // Bounding box computation mode
      let cw = pikTextLength(t, (t.eCode & TP_MONO) !== 0) * p.charWidth * xtraFontScale * 0.01;
      const ch = p.charHeight * 0.5 * xtraFontScale;
      if ((t.eCode & (TP_BOLD | TP_MONO)) === TP_BOLD) cw *= 1.1;

      let x0: PNum, y0: PNum, x1: PNum, y1: PNum;
      if (t.eCode & TP_RJUST) {
        x0 = nx; y0 = y - ch; x1 = nx - cw; y1 = y + ch;
      } else if (t.eCode & TP_LJUST) {
        x0 = nx; y0 = y - ch; x1 = nx + cw; y1 = y + ch;
      } else {
        x0 = nx + cw / 2; y0 = y + ch; x1 = nx - cw / 2; y1 = y - ch;
      }

      if ((t.eCode & TP_ALIGN) !== 0 && pObj.nPath >= 2) {
        const nn = pObj.nPath;
        let dx = pObj.aPath[nn - 1].x - pObj.aPath[0].x;
        let dy = pObj.aPath[nn - 1].y - pObj.aPath[0].y;
        if (dx !== 0 || dy !== 0) {
          const dist = Math.hypot(dx, dy);
          dx /= dist;
          dy /= dist;
          let tt = dx * x0 - dy * y0; y0 = dy * x0 - dx * y0; x0 = tt;
          tt = dx * x1 - dy * y1; y1 = dy * x1 - dx * y1; x1 = tt;
        }
      }
      bboxAddXY(pBox, x + x0, orig_y + y0);
      bboxAddXY(pBox, x + x1, orig_y + y1);
      continue;
    }

    // Rendering mode
    const finalX = nx + x;
    const finalY = y + orig_y;

    p.zOut += pikAppendX(p, '<text x="', finalX, '"');
    p.zOut += pikAppendY(p, ' y="', finalY, '"');
    if (t.eCode & TP_RJUST) {
      p.zOut += ' text-anchor="end"';
    } else if (t.eCode & TP_LJUST) {
      p.zOut += ' text-anchor="start"';
    } else {
      p.zOut += ' text-anchor="middle"';
    }
    if (t.eCode & TP_ITALIC) p.zOut += ' font-style="italic"';
    if (t.eCode & TP_BOLD)   p.zOut += ' font-weight="bold"';
    if (t.eCode & TP_MONO)   p.zOut += ' font-family="monospace"';
    if (pObj.color >= 0.0) {
      p.zOut += pikAppendClr(p, ' fill="', pObj.color, '"', false);
    }
    xtraFontScale *= p.fontScale;
    if (xtraFontScale <= 0.99 || xtraFontScale >= 1.01) {
      p.zOut += ` font-size="${numToStr(xtraFontScale * 100.0)}%"`;
    }
    if ((t.eCode & TP_ALIGN) !== 0 && pObj.nPath >= 2) {
      const nn = pObj.nPath;
      const dx = pObj.aPath[nn - 1].x - pObj.aPath[0].x;
      const dy = pObj.aPath[nn - 1].y - pObj.aPath[0].y;
      if (dx !== 0 || dy !== 0) {
        const ang = Math.atan2(dy, dx) * -180 / Math.PI;
        p.zOut += ` transform="rotate(${numToStr(ang)}`;
        p.zOut += pikAppendXY(p, ' ', x, orig_y);
        p.zOut += ')"';
      }
    }
    p.zOut += ' dominant-baseline="central">';

    // Text content
    let z: string;
    let nz: number;
    if (t.n >= 2 && t.z[0] === '"') {
      z = t.z.substring(1);
      nz = t.n - 2;
    } else {
      z = t.z;
      nz = t.n;
    }
    let pos = 0;
    while (pos < nz) {
      let j = pos;
      while (j < nz && z[j] !== '\\') j++;
      if (j > pos) p.zOut += pikAppendText(z.substring(pos, j), j - pos, 0x3);
      if (j < nz && (j + 1 === nz || z[j + 1] === '\\')) {
        p.zOut += '&#92;';
        j++;
      }
      pos = j + 1;
    }
    p.zOut += '</text>\n';
  }
}

// ---------------------------------------------------------------------------
// Debug element rendering
// ---------------------------------------------------------------------------
function pikElemRender(p: Pik, pObj: PObj): void {
  if (!pObj) return;
  p.zOut += '<!-- ';
  if (pObj.zName) {
    p.zOut += pObj.zName + ': ';
  }
  p.zOut += pObj.type.zName;
  if (pObj.nTxt) {
    p.zOut += ' "' + pObj.aTxt[0].z.substring(1, pObj.aTxt[0].n - 1) + '"';
  }
  p.zOut += ` w=${numToStr(pObj.w)} h=${numToStr(pObj.h)}`;
  p.zOut += ` center=${numToStr(pObj.ptAt.x)},${numToStr(pObj.ptAt.y)}`;
  p.zOut += ` enter=${numToStr(pObj.ptEnter.x)},${numToStr(pObj.ptEnter.y)}`;
  p.zOut += ` exit=${numToStr(pObj.ptExit.x)},${numToStr(pObj.ptExit.y)}`;
  const dirNames = [' right', ' down', ' left', ' up'];
  p.zOut += dirNames[pObj.outDir] || ' right';
  p.zOut += ' -->\n';
}

// ---------------------------------------------------------------------------
// Render an element list (layered rendering)
// ---------------------------------------------------------------------------
export function pikElistRender(p: Pik, pList: PList): void {
  let iNextLayer = 0;
  let iThisLayer: number;
  let bMoreToDo: boolean;
  const mDebug = pikValueInt(p, 'debug', 5).val;

  do {
    bMoreToDo = false;
    iThisLayer = iNextLayer;
    iNextLayer = 0x7fffffff;
    for (let i = 0; i < pList.n; i++) {
      const pObj = pList.a[i];
      if (pObj.iLayer > iThisLayer) {
        if (pObj.iLayer < iNextLayer) iNextLayer = pObj.iLayer;
        bMoreToDo = true;
        continue;
      } else if (pObj.iLayer < iThisLayer) {
        continue;
      }
      if (mDebug & 1) pikElemRender(p, pObj);
      const hasAnimId = !!pObj.animId;
      if (hasAnimId) {
        p.zOut += `<g data-picjs-id="${pObj.animId}">`;
      }
      if (pObj.type.xRender) {
        pObj.type.xRender(p, pObj);
      }
      if (pObj.pSublist) {
        pikElistRender(p, pObj.pSublist);
      }
      if (hasAnimId) {
        p.zOut += '</g>\n';
      }
    }
  } while (bMoreToDo);

  // Debug label rendering
  const debugResult = pikValue(p, 'debug_label_color', 17);
  if (!debugResult.miss && debugResult.val >= 0.0) {
    for (let i = 0; i < pList.n; i++) {
      const pObj = pList.a[i];
      if (!pObj.zName) continue;
      // Render a small dot at each labeled object's position
      p.zOut += pikAppendXY(p, '<circle cx="', pObj.ptAt.x, pObj.ptAt.y);
      const rad = 0.015 * p.rScale;
      p.zOut += `" r="${numToStr(rad)}"`;
      p.zOut += pikAppendClr(p, ' fill="', debugResult.val, '"', false);
      p.zOut += '/>\n';
    }
  }
}

// ---------------------------------------------------------------------------
// Add all objects to bounding box
// ---------------------------------------------------------------------------
export function pikBboxAddElist(p: Pik, pList: PList, wArrow: PNum): void {
  for (let i = 0; i < pList.n; i++) {
    const pObj = pList.a[i];
    if (pObj.sw >= 0.0) bboxAddBox(p.bbox, pObj.bbox);
    pikAppendTxt(p, pObj, p.bbox);
    if (pObj.pSublist) pikBboxAddElist(p, pObj.pSublist, wArrow);

    // Expand bounding box for arrowheads
    if (pObj.type.isLine && pObj.nPath > 0) {
      if (pObj.larrow) {
        bboxAddEllipse(p.bbox, pObj.aPath[0].x, pObj.aPath[0].y, wArrow, wArrow);
      }
      if (pObj.rarrow) {
        const j = pObj.nPath - 1;
        bboxAddEllipse(p.bbox, pObj.aPath[j].x, pObj.aPath[j].y, wArrow, wArrow);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Expand bounding box to include animated positions
// ---------------------------------------------------------------------------
function findObjByAnimId(pList: PList, animId: string): PObj | null {
  for (let i = 0; i < pList.n; i++) {
    const pObj = pList.a[i];
    if (pObj.animId === animId) return pObj;
    if (pObj.pSublist) {
      const found = findObjByAnimId(pObj.pSublist, animId);
      if (found) return found;
    }
  }
  return null;
}

function pikBboxAddAnimations(p: Pik, pList: PList, animations: AnimationDescriptor[]): void {
  // Track cumulative deltas per object (animations chain)
  const deltas: Record<string, { dx: number; dy: number }> = {};

  for (const anim of animations) {
    for (const alt of anim.alterations) {
      if (alt.property !== 'cx' && alt.property !== 'cy') continue;

      const obj = findObjByAnimId(pList, alt.targetId);
      if (!obj) continue;

      // Initialize delta tracking for this object
      if (!deltas[alt.targetId]) {
        deltas[alt.targetId] = { dx: 0, dy: 0 };
      }

      // toValue is a delta from initial position
      const delta = alt.toValue as number;
      if (alt.property === 'cx') {
        deltas[alt.targetId].dx = delta;
      } else {
        deltas[alt.targetId].dy = delta;
      }

      // Compute final center position
      const finalX = obj.ptAt.x + deltas[alt.targetId].dx;
      const finalY = obj.ptAt.y + deltas[alt.targetId].dy;

      // Expand bbox to include object at final position
      const w2 = obj.w / 2;
      const h2 = obj.h / 2;
      bboxAddXY(p.bbox, finalX - w2, finalY - h2);
      bboxAddXY(p.bbox, finalX + w2, finalY + h2);
    }
  }
}

// ---------------------------------------------------------------------------
// Build connector constraints from pFrom/pTo references
// ---------------------------------------------------------------------------
function assignConnectorAnimIds(pList: PList): void {
  // First pass: assign animIds to shapes connected to animated shapes
  // This ensures we have geometry for both ends of connectors
  for (let i = 0; i < pList.n; i++) {
    const pObj = pList.a[i];
    if (pObj.type.isLine) {
      // If one end is animated, ensure the other end also has an animId
      if (pObj.pFrom?.animId && pObj.pTo && !pObj.pTo.animId) {
        pObj.pTo.animId = pObj.pTo.zName || `shape-${pList.a.indexOf(pObj.pTo) + 1}`;
      }
      if (pObj.pTo?.animId && pObj.pFrom && !pObj.pFrom.animId) {
        pObj.pFrom.animId = pObj.pFrom.zName || `shape-${pList.a.indexOf(pObj.pFrom) + 1}`;
      }
    }
    if (pObj.pSublist) assignConnectorAnimIds(pObj.pSublist);
  }

  // Second pass: assign animIds to lines connecting shapes with animIds
  for (let i = 0; i < pList.n; i++) {
    const pObj = pList.a[i];
    if (pObj.type.isLine && !pObj.animId) {
      if (pObj.pFrom?.animId || pObj.pTo?.animId) {
        pObj.animId = `conn-${i + 1}`;
      }
    }
    if (pObj.pSublist) assignConnectorAnimIds(pObj.pSublist);
  }
}

function buildConnectorConstraints(pList: PList): ConnectorConstraint[] {
  const result: ConnectorConstraint[] = [];
  for (let i = 0; i < pList.n; i++) {
    const pObj = pList.a[i];
    if (!pObj.type.isLine || !pObj.animId) continue;
    if (pObj.pFrom && pObj.pFrom.animId) {
      result.push({
        lineId: pObj.animId,
        endpoint: 'start',
        targetId: pObj.pFrom.animId,
        targetEdge: 0,
        chopEnabled: pObj.bChopStart || pObj.bChop,
      });
    }
    if (pObj.pTo && pObj.pTo.animId) {
      result.push({
        lineId: pObj.animId,
        endpoint: 'end',
        targetId: pObj.pTo.animId,
        targetEdge: 0,
        chopEnabled: pObj.bChopEnd || pObj.bChop,
      });
    }
    if (pObj.pSublist) {
      result.push(...buildConnectorConstraints(pObj.pSublist));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build shape geometries for runtime chop calculations
// ---------------------------------------------------------------------------
function buildShapeGeometries(pList: PList, bbox: PBox, rScale: number): Record<string, ShapeGeometry> {
  const result: Record<string, ShapeGeometry> = {};

  function mapShapeType(typeName: string): ShapeGeometry['shapeType'] {
    if (typeName === 'circle' || typeName === 'dot') return 'circle';
    if (typeName === 'ellipse') return 'ellipse';
    return 'box'; // box, diamond, cylinder, file, oval, text all use box-like chop
  }

  function processObj(pObj: PObj): void {
    if (!pObj.animId || pObj.type.isLine) return;

    const geo: ShapeGeometry = {
      shapeType: mapShapeType(pObj.type.zName),
      // Convert from PicJS coordinates to SVG coordinates
      centerX: (pObj.ptAt.x - bbox.sw.x) * rScale,
      centerY: (bbox.ne.y - pObj.ptAt.y) * rScale,
      width: pObj.w * rScale,
      height: pObj.h * rScale,
    };

    if (pObj.rad > 0) {
      geo.radius = pObj.rad * rScale;
    }

    result[pObj.animId] = geo;

    if (pObj.pSublist) {
      for (let i = 0; i < pObj.pSublist.n; i++) {
        processObj(pObj.pSublist.a[i]);
      }
    }
  }

  for (let i = 0; i < pList.n; i++) {
    processObj(pList.a[i]);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------
export function pikRender(p: Pik, pList: PList | null): void {
  if (!pList) return;
  if (p.nErr === 0) {
    pikComputeLayoutSettings(p);
    let thickness = pikValue(p, 'thickness', 9).val;
    if (thickness <= 0.01) thickness = 0.01;
    let margin = pikValue(p, 'margin', 6).val;
    margin += thickness;
    const wArrow = p.wArrow * thickness;

    // fgcolor
    const fgResult = pikValueInt(p, 'fgcolor', 7);
    if (fgResult.miss) {
      const t: PToken = { z: 'fgcolor', n: 7, eType: 0, eCode: 0, eEdge: 0 };
      p.fgcolor = pikRound(pikLookupColor(null, t));
    } else {
      p.fgcolor = fgResult.val;
    }
    // bgcolor
    const bgResult = pikValueInt(p, 'bgcolor', 7);
    if (bgResult.miss) {
      const t: PToken = { z: 'bgcolor', n: 7, eType: 0, eCode: 0, eEdge: 0 };
      p.bgcolor = pikRound(pikLookupColor(null, t));
    } else {
      p.bgcolor = bgResult.val;
    }

    // Compute bounding box
    bboxInit(p.bbox);
    pikBboxAddElist(p, pList, wArrow);

    // Expand bbox to include animated positions across entire timeline
    const animations = getAnimations();
    if (animations.length > 0) {
      pikBboxAddAnimations(p, pList, animations);
    }

    // Expand bbox for margins
    p.bbox.ne.x += margin + pikValue(p, 'rightmargin', 11).val;
    p.bbox.ne.y += margin + pikValue(p, 'topmargin', 9).val;
    p.bbox.sw.x -= margin + pikValue(p, 'leftmargin', 10).val;
    p.bbox.sw.y -= margin + pikValue(p, 'bottommargin', 12).val;

    // Output SVG
    p.zOut += "<svg xmlns='http://www.w3.org/2000/svg' style='font-size:initial;'";
    if (p.zClass) {
      p.zOut += ` class="${p.zClass}"`;
    }
    const w = p.bbox.ne.x - p.bbox.sw.x;
    const h = p.bbox.ne.y - p.bbox.sw.y;
    p.wSVG = pikRound(p.rScale * w);
    p.hSVG = pikRound(p.rScale * h);

    const pikScale = pikValue(p, 'scale', 5).val;
    if (pikScale >= 0.001 && pikScale <= 1000.0 &&
        (pikScale < 0.99 || pikScale > 1.01)) {
      p.wSVG = pikRound(p.wSVG * pikScale);
      p.hSVG = pikRound(p.hSVG * pikScale);
      p.zOut += ` width="${p.wSVG}" height="${p.hSVG}"`;
    }
    p.zOut += pikAppendDis(p, ' viewBox="0 0 ', w, '');
    p.zOut += pikAppendDis(p, ' ', h, '"');
    p.zOut += '>\n';

    // Pre-pass: assign animIds to lines connecting animated shapes
    // (must happen before render so they get <g data-picjs-id> wrappers)
    assignConnectorAnimIds(pList);

    pikElistRender(p, pList);

    // Embed animation data if any animations exist
    if (animations.length > 0) {
      const connectors = buildConnectorConstraints(pList);
      const shapes = buildShapeGeometries(pList, p.bbox, p.rScale);
      // Convert position deltas from PicJS units to SVG units
      // Note: toValue is a delta (not absolute), so only scale, don't offset
      const svgAnimations = animations.map(anim => ({
        ...anim,
        alterations: anim.alterations.map(alt => {
          if (alt.property === 'cx') {
            return {
              ...alt,
              fromValue: alt.fromValue !== null ? (alt.fromValue as number) * p.rScale : null,
              toValue: (alt.toValue as number) * p.rScale,
            };
          } else if (alt.property === 'cy') {
            // SVG y is inverted, so negate the delta
            return {
              ...alt,
              fromValue: alt.fromValue !== null ? -(alt.fromValue as number) * p.rScale : null,
              toValue: -(alt.toValue as number) * p.rScale,
            };
          }
          return alt;
        }),
      }));
      const animData = {
        animations: svgAnimations,
        connectors,
        shapes,
      };
      p.zOut += `<script type="application/json" data-picjs-anim>${JSON.stringify(animData)}</script>\n`;
    }

    p.zOut += '</svg>\n';
  } else {
    p.wSVG = -1;
    p.hSVG = -1;
  }
}
