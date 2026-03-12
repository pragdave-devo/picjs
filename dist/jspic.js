var ua = Object.defineProperty;
var fa = (e, t, r) => t in e ? ua(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var qe = (e, t, r) => fa(e, typeof t != "symbol" ? t + "" : t, r);
const Yn = [
  /*none*/
  0,
  /* N  */
  0,
  /* NE */
  45,
  /* E  */
  90,
  /* SE */
  135,
  /* S  */
  180,
  /* SW */
  225,
  /* W  */
  270,
  /* NW */
  315,
  /* C  */
  0
], qn = 0, Qn = 1, Zn = 2, bn = 3, On = 4, pn = 5, jn = 6, Re = 1, ke = 2, De = 3, ye = 4, ie = 8, ne = 16, oe = 32, xe = 64, K = 124, Rt = 256, kt = 512, Dt = 1024, er = 4096, pe = 8192, je = 16384, Wt = 32768, Z = 0, G = 1, B = 2, I = 3, tr = 1, nr = 2, It = 4, da = 8, Ta = 32, ha = 64, Mt = 256, Tn = 1024, _a = 4096;
var s = /* @__PURE__ */ ((e) => (e[e.T_ID = 1] = "T_ID", e[e.T_ASSIGN = 2] = "T_ASSIGN", e[e.T_PLACENAME = 3] = "T_PLACENAME", e[e.T_CLASSNAME = 4] = "T_CLASSNAME", e[e.T_STRING = 5] = "T_STRING", e[e.T_NUMBER = 6] = "T_NUMBER", e[e.T_NTH = 7] = "T_NTH", e[e.T_EOL = 8] = "T_EOL", e[e.T_LP = 9] = "T_LP", e[e.T_RP = 10] = "T_RP", e[e.T_LB = 11] = "T_LB", e[e.T_RB = 12] = "T_RB", e[e.T_COMMA = 13] = "T_COMMA", e[e.T_COLON = 14] = "T_COLON", e[e.T_PLUS = 15] = "T_PLUS", e[e.T_MINUS = 16] = "T_MINUS", e[e.T_STAR = 17] = "T_STAR", e[e.T_SLASH = 18] = "T_SLASH", e[e.T_PERCENT = 19] = "T_PERCENT", e[e.T_EQ = 20] = "T_EQ", e[e.T_GT = 21] = "T_GT", e[e.T_LT = 22] = "T_LT", e[e.T_LARROW = 23] = "T_LARROW", e[e.T_RARROW = 24] = "T_RARROW", e[e.T_LRARROW = 25] = "T_LRARROW", e[e.T_EDGEPT = 26] = "T_EDGEPT", e[e.T_OF = 27] = "T_OF", e[e.T_FILL = 28] = "T_FILL", e[e.T_COLOR = 29] = "T_COLOR", e[e.T_THICKNESS = 30] = "T_THICKNESS", e[e.T_DOTTED = 31] = "T_DOTTED", e[e.T_DASHED = 32] = "T_DASHED", e[e.T_CW = 33] = "T_CW", e[e.T_CCW = 34] = "T_CCW", e[e.T_INVIS = 35] = "T_INVIS", e[e.T_THICK = 36] = "T_THICK", e[e.T_THIN = 37] = "T_THIN", e[e.T_SOLID = 38] = "T_SOLID", e[e.T_CHOP = 39] = "T_CHOP", e[e.T_FIT = 40] = "T_FIT", e[e.T_BEHIND = 41] = "T_BEHIND", e[e.T_SAME = 42] = "T_SAME", e[e.T_FROM = 43] = "T_FROM", e[e.T_TO = 44] = "T_TO", e[e.T_THEN = 45] = "T_THEN", e[e.T_GO = 46] = "T_GO", e[e.T_CLOSE = 47] = "T_CLOSE", e[e.T_AT = 48] = "T_AT", e[e.T_WITH = 49] = "T_WITH", e[e.T_HEADING = 50] = "T_HEADING", e[e.T_HEIGHT = 51] = "T_HEIGHT", e[e.T_WIDTH = 52] = "T_WIDTH", e[e.T_RADIUS = 53] = "T_RADIUS", e[e.T_DIAMETER = 54] = "T_DIAMETER", e[e.T_ABOVE = 55] = "T_ABOVE", e[e.T_BELOW = 56] = "T_BELOW", e[e.T_CENTER = 57] = "T_CENTER", e[e.T_LJUST = 58] = "T_LJUST", e[e.T_RJUST = 59] = "T_RJUST", e[e.T_ITALIC = 60] = "T_ITALIC", e[e.T_BOLD = 61] = "T_BOLD", e[e.T_MONO = 62] = "T_MONO", e[e.T_ALIGNED = 63] = "T_ALIGNED", e[e.T_BIG = 64] = "T_BIG", e[e.T_SMALL = 65] = "T_SMALL", e[e.T_AND = 66] = "T_AND", e[e.T_AS = 67] = "T_AS", e[e.T_ASSERT = 68] = "T_ASSERT", e[e.T_BETWEEN = 69] = "T_BETWEEN", e[e.T_DEFINE = 70] = "T_DEFINE", e[e.T_DIST = 71] = "T_DIST", e[e.T_DOT_E = 72] = "T_DOT_E", e[e.T_DOT_L = 73] = "T_DOT_L", e[e.T_DOT_U = 74] = "T_DOT_U", e[e.T_DOT_XY = 75] = "T_DOT_XY", e[e.T_DOWN = 76] = "T_DOWN", e[e.T_END = 77] = "T_END", e[e.T_EVEN = 78] = "T_EVEN", e[e.T_FUNC1 = 79] = "T_FUNC1", e[e.T_FUNC2 = 80] = "T_FUNC2", e[e.T_IN = 81] = "T_IN", e[e.T_LAST = 82] = "T_LAST", e[e.T_LEFT = 83] = "T_LEFT", e[e.T_PRINT = 84] = "T_PRINT", e[e.T_RIGHT = 85] = "T_RIGHT", e[e.T_START = 86] = "T_START", e[e.T_THE = 87] = "T_THE", e[e.T_TOP = 88] = "T_TOP", e[e.T_BOTTOM = 89] = "T_BOTTOM", e[e.T_UNTIL = 90] = "T_UNTIL", e[e.T_UP = 91] = "T_UP", e[e.T_VERTEX = 92] = "T_VERTEX", e[e.T_WAY = 93] = "T_WAY", e[e.T_X = 94] = "T_X", e[e.T_Y = 95] = "T_Y", e[e.T_THIS = 96] = "T_THIS", e[e.T_CODEBLOCK = 97] = "T_CODEBLOCK", e[e.T_ISODATE = 98] = "T_ISODATE", e[e.T_PARAMETER = 253] = "T_PARAMETER", e[e.T_WHITESPACE = 254] = "T_WHITESPACE", e[e.T_ERROR = 255] = "T_ERROR", e))(s || {});
function E(e) {
  return { x: e.x, y: e.y };
}
function A(e = "", t = 0, r = 0) {
  return { z: e, n: t, eCode: 0, eType: r, eEdge: 0 };
}
const We = 1, rr = 2, ar = 1e3, Se = 10, ya = 5, hn = 1e5;
function xa() {
  return {
    nErr: 0,
    nToken: 0,
    sIn: A(),
    zOut: "",
    eDir: Z,
    mFlags: 0,
    cur: null,
    lastRef: null,
    list: null,
    pMacros: null,
    pVar: null,
    bbox: { sw: { x: 1, y: 1 }, ne: { x: 0, y: 0 } },
    rScale: 144,
    fontScale: 1,
    charWidth: 0.08,
    charHeight: 0.14,
    wArrow: 0,
    hArrow: 0,
    bLayoutVars: !1,
    thenFlag: !1,
    samePath: !1,
    zClass: null,
    wSVG: 0,
    hSVG: 0,
    fgcolor: -1,
    bgcolor: -1,
    nTPath: 0,
    mTPath: 0,
    aTPath: new Array(ar).fill(null).map(() => ({ x: 0, y: 0 })),
    nCtx: 0,
    aCtx: []
  };
}
function Ca(e) {
  return {
    type: e,
    errTok: A(),
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
    eWith: 9,
    cw: !1,
    larrow: !1,
    rarrow: !1,
    bClose: !1,
    bChop: !1,
    bAltAutoFit: !1,
    nTxt: 0,
    mProp: 0,
    mCalc: 0,
    aTxt: [],
    iLayer: 1e3,
    inDir: Z,
    outDir: Z,
    nPath: 0,
    aPath: [],
    pFrom: null,
    pTo: null,
    bbox: { sw: { x: 1, y: 1 }, ne: { x: 0, y: 0 } }
  };
}
function X(e) {
  return isNaN(e) ? 0 : e < -2147483647 ? -2147483648 : e >= 2147483647 ? 2147483647 : Math.round(e);
}
function za(e, t) {
  return Math.hypot(t.x - e.x, t.y - e.y);
}
function Ue(e) {
  return e.sw.x > e.ne.x;
}
function Ot(e) {
  e.sw.x = 1, e.sw.y = 1, e.ne.x = 0, e.ne.y = 0;
}
function ir(e, t) {
  Ue(e) && (e.sw.x = t.sw.x, e.sw.y = t.sw.y, e.ne.x = t.ne.x, e.ne.y = t.ne.y), !Ue(t) && (e.sw.x > t.sw.x && (e.sw.x = t.sw.x), e.sw.y > t.sw.y && (e.sw.y = t.sw.y), e.ne.x < t.ne.x && (e.ne.x = t.ne.x), e.ne.y < t.ne.y && (e.ne.y = t.ne.y));
}
function Ie(e, t, r) {
  if (Ue(e)) {
    e.ne.x = t, e.ne.y = r, e.sw.x = t, e.sw.y = r;
    return;
  }
  e.sw.x > t && (e.sw.x = t), e.sw.y > r && (e.sw.y = r), e.ne.x < t && (e.ne.x = t), e.ne.y < r && (e.ne.y = r);
}
function at(e, t, r, n, a) {
  if (Ue(e)) {
    e.ne.x = t + n, e.ne.y = r + a, e.sw.x = t - n, e.sw.y = r - a;
    return;
  }
  e.sw.x > t - n && (e.sw.x = t - n), e.sw.y > r - a && (e.sw.y = r - a), e.ne.x < t + n && (e.ne.x = t + n), e.ne.y < r + a && (e.ne.y = r + a);
}
function Ea(e, t) {
  return Ue(e) ? !1 : t.x >= e.sw.x && t.x <= e.ne.x && t.y >= e.sw.y && t.y <= e.ne.y;
}
function f(e, t, r) {
  if (!e.nErr) {
    if (e.nErr++, r === null) {
      e.zOut += `
<div><p>Out of memory</p></div>
`;
      return;
    }
    if (t === null) {
      e.zOut += `
` + Ft(r);
      return;
    }
    e.mFlags & We || (e.zOut += `<div><pre>
`), _n(e, t, 5), e.zOut += "ERROR: ", e.mFlags & We ? e.zOut += r : e.zOut += Ft(r), e.zOut += `
`;
    for (let n = e.nCtx - 1; n >= 0; n--)
      e.zOut += `Called from:
`, _n(e, e.aCtx[n], 0);
    e.mFlags & We || (e.zOut += `</pre></div>
`);
  }
}
function _n(e, t, r) {
  const n = e.sIn.z;
  let a = t.z.length > 0 ? n.indexOf(t.z) : n.length - 1;
  a < 0 && (a = n.length - 1);
  let i = 0;
  if (a >= n.length)
    a = n.length - 1, i = 1;
  else
    for (; a > 0 && (n[a] === `
` || n[a] === "\r"); )
      a--, i = 1;
  let o = 1;
  for (let d = 0; d < a; d++)
    n[d] === `
` && o++;
  let l = 0, c = 1;
  for (; c + r < o; ) {
    for (; n[l] !== `
`; ) l++;
    l++, c++;
  }
  for (; c <= o; ) {
    const d = `/* ${String(c).padStart(4)} */  `;
    e.zOut += d, c++;
    let T = l;
    for (; T < n.length && n[T] !== `
`; ) T++;
    const x = n.substring(l, T);
    e.mFlags & We ? e.zOut += x : e.zOut += Ft(x), l = T + 1, e.zOut += `
`;
  }
  let u = 0;
  for (let d = a; d > 0 && n[d] !== `
`; u++, d--)
    ;
  e.zOut += " ".repeat(u + 11 + i);
  for (let d = 0; d < t.n; d++) e.zOut += "^";
  e.zOut += `
`;
}
function Ft(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function dt(e, t, r, n) {
  return r -= e.bbox.sw.x, `${t}${e.rScale * r}${n}`;
}
function Tt(e, t, r, n) {
  return r = e.bbox.ne.y - r, `${t}${e.rScale * r}${n}`;
}
function _(e, t, r, n) {
  return r = r - e.bbox.sw.x, n = e.bbox.ne.y - n, `${t}${e.rScale * r},${e.rScale * n}`;
}
function k(e, t, r, n) {
  return `${t}${e.rScale * r}${n}`;
}
function re(e, t, r, n, a) {
  return n = n - e.bbox.sw.x, a = e.bbox.ne.y - a, `A${e.rScale * t} ${e.rScale * r} 0 0 0 ${e.rScale * n} ${e.rScale * a}`;
}
function ma(e, t) {
  e = 16777215 - e;
  let r = e >> 16 & 255, n = e >> 8 & 255, a = e & 255;
  const i = Math.max(r, n, a), o = Math.min(r, n, a);
  return r = o + (i - r), n = o + (i - n), a = o + (i - a), t ? i > 127 && (r = Math.floor(127 * r / i), n = Math.floor(127 * n / i), a = Math.floor(127 * a / i)) : o < 128 && i > o && (r = 127 + Math.floor((r - o) * 128 / (i - o)), n = 127 + Math.floor((n - o) * 128 / (i - o)), a = 127 + Math.floor((a - o) * 128 / (i - o))), r * 65536 + n * 256 + a;
}
function Ve(e, t, r, n, a) {
  let i = X(r);
  i === 0 && e.fgcolor > 0 && !a ? i = e.fgcolor : a && i >= 16777215 && e.bgcolor > 0 ? i = e.bgcolor : e.mFlags & rr && (i = ma(i, a));
  const o = i >> 16 & 255, l = i >> 8 & 255, c = i & 255;
  return `${t}rgb(${o},${l},${c})${n}`;
}
function P(e) {
  if (Number.isInteger(e) && Math.abs(e) < 1e15) return String(e);
  const t = e.toPrecision(10);
  return t.includes(".") ? t.replace(/\.?0+$/, "") : t;
}
function Na(e) {
  const t = e.z.substring(0, e.n);
  if (t.length >= 3 && t[0] === "0" && (t[1] === "x" || t[1] === "X"))
    return parseInt(t.substring(2), 16);
  let r = t, n = 1;
  if (t.length >= 3) {
    const a = t.substring(t.length - 2);
    a === "cm" ? (n = 1 / 2.54, r = t.substring(0, t.length - 2)) : a === "mm" ? (n = 1 / 25.4, r = t.substring(0, t.length - 2)) : a === "px" ? (n = 1 / 96, r = t.substring(0, t.length - 2)) : a === "pt" ? (n = 1 / 72, r = t.substring(0, t.length - 2)) : a === "pc" ? (n = 1 / 6, r = t.substring(0, t.length - 2)) : a === "in" && (n = 1, r = t.substring(0, t.length - 2));
  }
  return parseFloat(r) * n;
}
const yn = [
  { zWord: "above", nChar: 5, eType: s.T_ABOVE, eCode: 0, eEdge: 0 },
  { zWord: "abs", nChar: 3, eType: s.T_FUNC1, eCode: qn, eEdge: 0 },
  { zWord: "aligned", nChar: 7, eType: s.T_ALIGNED, eCode: 0, eEdge: 0 },
  { zWord: "and", nChar: 3, eType: s.T_AND, eCode: 0, eEdge: 0 },
  { zWord: "as", nChar: 2, eType: s.T_AS, eCode: 0, eEdge: 0 },
  { zWord: "assert", nChar: 6, eType: s.T_ASSERT, eCode: 0, eEdge: 0 },
  { zWord: "at", nChar: 2, eType: s.T_AT, eCode: 0, eEdge: 0 },
  { zWord: "behind", nChar: 6, eType: s.T_BEHIND, eCode: 0, eEdge: 0 },
  { zWord: "below", nChar: 5, eType: s.T_BELOW, eCode: 0, eEdge: 0 },
  { zWord: "between", nChar: 7, eType: s.T_BETWEEN, eCode: 0, eEdge: 0 },
  { zWord: "big", nChar: 3, eType: s.T_BIG, eCode: 0, eEdge: 0 },
  { zWord: "bold", nChar: 4, eType: s.T_BOLD, eCode: 0, eEdge: 0 },
  { zWord: "bot", nChar: 3, eType: s.T_EDGEPT, eCode: 0, eEdge: 5 },
  { zWord: "bottom", nChar: 6, eType: s.T_BOTTOM, eCode: 0, eEdge: 5 },
  { zWord: "c", nChar: 1, eType: s.T_EDGEPT, eCode: 0, eEdge: 9 },
  { zWord: "ccw", nChar: 3, eType: s.T_CCW, eCode: 0, eEdge: 0 },
  { zWord: "center", nChar: 6, eType: s.T_CENTER, eCode: 0, eEdge: 9 },
  { zWord: "chop", nChar: 4, eType: s.T_CHOP, eCode: 0, eEdge: 0 },
  { zWord: "close", nChar: 5, eType: s.T_CLOSE, eCode: 0, eEdge: 0 },
  { zWord: "color", nChar: 5, eType: s.T_COLOR, eCode: 0, eEdge: 0 },
  { zWord: "cos", nChar: 3, eType: s.T_FUNC1, eCode: Qn, eEdge: 0 },
  { zWord: "cw", nChar: 2, eType: s.T_CW, eCode: 0, eEdge: 0 },
  { zWord: "dashed", nChar: 6, eType: s.T_DASHED, eCode: 0, eEdge: 0 },
  { zWord: "define", nChar: 6, eType: s.T_DEFINE, eCode: 0, eEdge: 0 },
  { zWord: "diameter", nChar: 8, eType: s.T_DIAMETER, eCode: 0, eEdge: 0 },
  { zWord: "dist", nChar: 4, eType: s.T_DIST, eCode: 0, eEdge: 0 },
  { zWord: "dotted", nChar: 6, eType: s.T_DOTTED, eCode: 0, eEdge: 0 },
  { zWord: "down", nChar: 4, eType: s.T_DOWN, eCode: G, eEdge: 0 },
  { zWord: "e", nChar: 1, eType: s.T_EDGEPT, eCode: 0, eEdge: 3 },
  { zWord: "east", nChar: 4, eType: s.T_EDGEPT, eCode: 0, eEdge: 3 },
  { zWord: "end", nChar: 3, eType: s.T_END, eCode: 0, eEdge: 10 },
  { zWord: "even", nChar: 4, eType: s.T_EVEN, eCode: 0, eEdge: 0 },
  { zWord: "fill", nChar: 4, eType: s.T_FILL, eCode: 0, eEdge: 0 },
  { zWord: "first", nChar: 5, eType: s.T_NTH, eCode: 0, eEdge: 0 },
  { zWord: "fit", nChar: 3, eType: s.T_FIT, eCode: 0, eEdge: 0 },
  { zWord: "from", nChar: 4, eType: s.T_FROM, eCode: 0, eEdge: 0 },
  { zWord: "go", nChar: 2, eType: s.T_GO, eCode: 0, eEdge: 0 },
  { zWord: "heading", nChar: 7, eType: s.T_HEADING, eCode: 0, eEdge: 0 },
  { zWord: "height", nChar: 6, eType: s.T_HEIGHT, eCode: 0, eEdge: 0 },
  { zWord: "ht", nChar: 2, eType: s.T_HEIGHT, eCode: 0, eEdge: 0 },
  { zWord: "in", nChar: 2, eType: s.T_IN, eCode: 0, eEdge: 0 },
  { zWord: "int", nChar: 3, eType: s.T_FUNC1, eCode: Zn, eEdge: 0 },
  { zWord: "invis", nChar: 5, eType: s.T_INVIS, eCode: 0, eEdge: 0 },
  { zWord: "invisible", nChar: 9, eType: s.T_INVIS, eCode: 0, eEdge: 0 },
  { zWord: "italic", nChar: 6, eType: s.T_ITALIC, eCode: 0, eEdge: 0 },
  { zWord: "last", nChar: 4, eType: s.T_LAST, eCode: 0, eEdge: 0 },
  { zWord: "left", nChar: 4, eType: s.T_LEFT, eCode: B, eEdge: 7 },
  { zWord: "ljust", nChar: 5, eType: s.T_LJUST, eCode: 0, eEdge: 0 },
  { zWord: "max", nChar: 3, eType: s.T_FUNC2, eCode: bn, eEdge: 0 },
  { zWord: "min", nChar: 3, eType: s.T_FUNC2, eCode: On, eEdge: 0 },
  { zWord: "mono", nChar: 4, eType: s.T_MONO, eCode: 0, eEdge: 0 },
  { zWord: "monospace", nChar: 9, eType: s.T_MONO, eCode: 0, eEdge: 0 },
  { zWord: "n", nChar: 1, eType: s.T_EDGEPT, eCode: 0, eEdge: 1 },
  { zWord: "ne", nChar: 2, eType: s.T_EDGEPT, eCode: 0, eEdge: 2 },
  { zWord: "north", nChar: 5, eType: s.T_EDGEPT, eCode: 0, eEdge: 1 },
  { zWord: "nw", nChar: 2, eType: s.T_EDGEPT, eCode: 0, eEdge: 8 },
  { zWord: "of", nChar: 2, eType: s.T_OF, eCode: 0, eEdge: 0 },
  { zWord: "pikchr_date", nChar: 11, eType: s.T_ISODATE, eCode: 0, eEdge: 0 },
  { zWord: "previous", nChar: 8, eType: s.T_LAST, eCode: 0, eEdge: 0 },
  { zWord: "print", nChar: 5, eType: s.T_PRINT, eCode: 0, eEdge: 0 },
  { zWord: "rad", nChar: 3, eType: s.T_RADIUS, eCode: 0, eEdge: 0 },
  { zWord: "radius", nChar: 6, eType: s.T_RADIUS, eCode: 0, eEdge: 0 },
  { zWord: "right", nChar: 5, eType: s.T_RIGHT, eCode: Z, eEdge: 3 },
  { zWord: "rjust", nChar: 5, eType: s.T_RJUST, eCode: 0, eEdge: 0 },
  { zWord: "s", nChar: 1, eType: s.T_EDGEPT, eCode: 0, eEdge: 5 },
  { zWord: "same", nChar: 4, eType: s.T_SAME, eCode: 0, eEdge: 0 },
  { zWord: "se", nChar: 2, eType: s.T_EDGEPT, eCode: 0, eEdge: 4 },
  { zWord: "sin", nChar: 3, eType: s.T_FUNC1, eCode: pn, eEdge: 0 },
  { zWord: "small", nChar: 5, eType: s.T_SMALL, eCode: 0, eEdge: 0 },
  { zWord: "solid", nChar: 5, eType: s.T_SOLID, eCode: 0, eEdge: 0 },
  { zWord: "south", nChar: 5, eType: s.T_EDGEPT, eCode: 0, eEdge: 5 },
  { zWord: "sqrt", nChar: 4, eType: s.T_FUNC1, eCode: jn, eEdge: 0 },
  { zWord: "start", nChar: 5, eType: s.T_START, eCode: 0, eEdge: 11 },
  { zWord: "sw", nChar: 2, eType: s.T_EDGEPT, eCode: 0, eEdge: 6 },
  { zWord: "t", nChar: 1, eType: s.T_TOP, eCode: 0, eEdge: 1 },
  { zWord: "the", nChar: 3, eType: s.T_THE, eCode: 0, eEdge: 0 },
  { zWord: "then", nChar: 4, eType: s.T_THEN, eCode: 0, eEdge: 0 },
  { zWord: "thick", nChar: 5, eType: s.T_THICK, eCode: 0, eEdge: 0 },
  { zWord: "thickness", nChar: 9, eType: s.T_THICKNESS, eCode: 0, eEdge: 0 },
  { zWord: "thin", nChar: 4, eType: s.T_THIN, eCode: 0, eEdge: 0 },
  { zWord: "this", nChar: 4, eType: s.T_THIS, eCode: 0, eEdge: 0 },
  { zWord: "to", nChar: 2, eType: s.T_TO, eCode: 0, eEdge: 0 },
  { zWord: "top", nChar: 3, eType: s.T_TOP, eCode: 0, eEdge: 1 },
  { zWord: "until", nChar: 5, eType: s.T_UNTIL, eCode: 0, eEdge: 0 },
  { zWord: "up", nChar: 2, eType: s.T_UP, eCode: I, eEdge: 0 },
  { zWord: "vertex", nChar: 6, eType: s.T_VERTEX, eCode: 0, eEdge: 0 },
  { zWord: "w", nChar: 1, eType: s.T_EDGEPT, eCode: 0, eEdge: 7 },
  { zWord: "way", nChar: 3, eType: s.T_WAY, eCode: 0, eEdge: 0 },
  { zWord: "west", nChar: 4, eType: s.T_EDGEPT, eCode: 0, eEdge: 7 },
  { zWord: "wid", nChar: 3, eType: s.T_WIDTH, eCode: 0, eEdge: 0 },
  { zWord: "width", nChar: 5, eType: s.T_WIDTH, eCode: 0, eEdge: 0 },
  { zWord: "with", nChar: 4, eType: s.T_WITH, eCode: 0, eEdge: 0 },
  { zWord: "x", nChar: 1, eType: s.T_X, eCode: 0, eEdge: 0 },
  { zWord: "y", nChar: 1, eType: s.T_Y, eCode: 0, eEdge: 0 }
];
function va(e, t) {
  let r = 0, n = yn.length - 1;
  for (; r <= n; ) {
    const a = r + n >> 1, i = yn[a], o = i.nChar, l = o < t ? o : t;
    let c = or(e, i.zWord, l);
    if (c === 0 && (c = t - o, c === 0))
      return i;
    c < 0 ? n = a - 1 : r = a + 1;
  }
  return null;
}
function or(e, t, r) {
  for (let n = 0; n < r; n++) {
    const a = e.charCodeAt(n), i = t.charCodeAt(n);
    if (a < i) return -1;
    if (a > i) return 1;
  }
  return 0;
}
const Et = [
  { zName: "AliceBlue", val: 15792383 },
  { zName: "AntiqueWhite", val: 16444375 },
  { zName: "Aqua", val: 65535 },
  { zName: "Aquamarine", val: 8388564 },
  { zName: "Azure", val: 15794175 },
  { zName: "Beige", val: 16119260 },
  { zName: "Bisque", val: 16770244 },
  { zName: "Black", val: 0 },
  { zName: "BlanchedAlmond", val: 16772045 },
  { zName: "Blue", val: 255 },
  { zName: "BlueViolet", val: 9055202 },
  { zName: "Brown", val: 10824234 },
  { zName: "BurlyWood", val: 14596231 },
  { zName: "CadetBlue", val: 6266528 },
  { zName: "Chartreuse", val: 8388352 },
  { zName: "Chocolate", val: 13789470 },
  { zName: "Coral", val: 16744272 },
  { zName: "CornflowerBlue", val: 6591981 },
  { zName: "Cornsilk", val: 16775388 },
  { zName: "Crimson", val: 14423100 },
  { zName: "Cyan", val: 65535 },
  { zName: "DarkBlue", val: 139 },
  { zName: "DarkCyan", val: 35723 },
  { zName: "DarkGoldenrod", val: 12092939 },
  { zName: "DarkGray", val: 11119017 },
  { zName: "DarkGreen", val: 25600 },
  { zName: "DarkGrey", val: 11119017 },
  { zName: "DarkKhaki", val: 12433259 },
  { zName: "DarkMagenta", val: 9109643 },
  { zName: "DarkOliveGreen", val: 5597999 },
  { zName: "DarkOrange", val: 16747520 },
  { zName: "DarkOrchid", val: 10040012 },
  { zName: "DarkRed", val: 9109504 },
  { zName: "DarkSalmon", val: 15308410 },
  { zName: "DarkSeaGreen", val: 9419919 },
  { zName: "DarkSlateBlue", val: 4734347 },
  { zName: "DarkSlateGray", val: 3100495 },
  { zName: "DarkSlateGrey", val: 3100495 },
  { zName: "DarkTurquoise", val: 52945 },
  { zName: "DarkViolet", val: 9699539 },
  { zName: "DeepPink", val: 16716947 },
  { zName: "DeepSkyBlue", val: 49151 },
  { zName: "DimGray", val: 6908265 },
  { zName: "DimGrey", val: 6908265 },
  { zName: "DodgerBlue", val: 2003199 },
  { zName: "Firebrick", val: 11674146 },
  { zName: "FloralWhite", val: 16775920 },
  { zName: "ForestGreen", val: 2263842 },
  { zName: "Fuchsia", val: 16711935 },
  { zName: "Gainsboro", val: 14474460 },
  { zName: "GhostWhite", val: 16316671 },
  { zName: "Gold", val: 16766720 },
  { zName: "Goldenrod", val: 14329120 },
  { zName: "Gray", val: 8421504 },
  { zName: "Green", val: 32768 },
  { zName: "GreenYellow", val: 11403055 },
  { zName: "Grey", val: 8421504 },
  { zName: "Honeydew", val: 15794160 },
  { zName: "HotPink", val: 16738740 },
  { zName: "IndianRed", val: 13458524 },
  { zName: "Indigo", val: 4915330 },
  { zName: "Ivory", val: 16777200 },
  { zName: "Khaki", val: 15787660 },
  { zName: "Lavender", val: 15132410 },
  { zName: "LavenderBlush", val: 16773365 },
  { zName: "LawnGreen", val: 8190976 },
  { zName: "LemonChiffon", val: 16775885 },
  { zName: "LightBlue", val: 11393254 },
  { zName: "LightCoral", val: 15761536 },
  { zName: "LightCyan", val: 14745599 },
  { zName: "LightGoldenrodYellow", val: 16448210 },
  { zName: "LightGray", val: 13882323 },
  { zName: "LightGreen", val: 9498256 },
  { zName: "LightGrey", val: 13882323 },
  { zName: "LightPink", val: 16758465 },
  { zName: "LightSalmon", val: 16752762 },
  { zName: "LightSeaGreen", val: 2142890 },
  { zName: "LightSkyBlue", val: 8900346 },
  { zName: "LightSlateGray", val: 7833753 },
  { zName: "LightSlateGrey", val: 7833753 },
  { zName: "LightSteelBlue", val: 11584734 },
  { zName: "LightYellow", val: 16777184 },
  { zName: "Lime", val: 65280 },
  { zName: "LimeGreen", val: 3329330 },
  { zName: "Linen", val: 16445670 },
  { zName: "Magenta", val: 16711935 },
  { zName: "Maroon", val: 8388608 },
  { zName: "MediumAquamarine", val: 6737322 },
  { zName: "MediumBlue", val: 205 },
  { zName: "MediumOrchid", val: 12211667 },
  { zName: "MediumPurple", val: 9662683 },
  { zName: "MediumSeaGreen", val: 3978097 },
  { zName: "MediumSlateBlue", val: 8087790 },
  { zName: "MediumSpringGreen", val: 64154 },
  { zName: "MediumTurquoise", val: 4772300 },
  { zName: "MediumVioletRed", val: 13047173 },
  { zName: "MidnightBlue", val: 1644912 },
  { zName: "MintCream", val: 16121850 },
  { zName: "MistyRose", val: 16770273 },
  { zName: "Moccasin", val: 16770229 },
  { zName: "NavajoWhite", val: 16768685 },
  { zName: "Navy", val: 128 },
  { zName: "None", val: -1 },
  { zName: "Off", val: -1 },
  { zName: "OldLace", val: 16643558 },
  { zName: "Olive", val: 8421376 },
  { zName: "OliveDrab", val: 7048739 },
  { zName: "Orange", val: 16753920 },
  { zName: "OrangeRed", val: 16729344 },
  { zName: "Orchid", val: 14315734 },
  { zName: "PaleGoldenrod", val: 15657130 },
  { zName: "PaleGreen", val: 10025880 },
  { zName: "PaleTurquoise", val: 11529966 },
  { zName: "PaleVioletRed", val: 14381203 },
  { zName: "PapayaWhip", val: 16773077 },
  { zName: "PeachPuff", val: 16767673 },
  { zName: "Peru", val: 13468991 },
  { zName: "Pink", val: 16761035 },
  { zName: "Plum", val: 14524637 },
  { zName: "PowderBlue", val: 11591910 },
  { zName: "Purple", val: 8388736 },
  { zName: "RebeccaPurple", val: 6697881 },
  { zName: "Red", val: 16711680 },
  { zName: "RosyBrown", val: 12357519 },
  { zName: "RoyalBlue", val: 4286945 },
  { zName: "SaddleBrown", val: 9127187 },
  { zName: "Salmon", val: 16416882 },
  { zName: "SandyBrown", val: 16032864 },
  { zName: "SeaGreen", val: 3050327 },
  { zName: "Seashell", val: 16774638 },
  { zName: "Sienna", val: 10506797 },
  { zName: "Silver", val: 12632256 },
  { zName: "SkyBlue", val: 8900331 },
  { zName: "SlateBlue", val: 6970061 },
  { zName: "SlateGray", val: 7372944 },
  { zName: "SlateGrey", val: 7372944 },
  { zName: "Snow", val: 16775930 },
  { zName: "SpringGreen", val: 65407 },
  { zName: "SteelBlue", val: 4620980 },
  { zName: "Tan", val: 13808780 },
  { zName: "Teal", val: 32896 },
  { zName: "Thistle", val: 14204888 },
  { zName: "Tomato", val: 16737095 },
  { zName: "Turquoise", val: 4251856 },
  { zName: "Violet", val: 15631086 },
  { zName: "Wheat", val: 16113331 },
  { zName: "White", val: 16777215 },
  { zName: "WhiteSmoke", val: 16119285 },
  { zName: "Yellow", val: 16776960 },
  { zName: "YellowGreen", val: 10145074 }
];
function it(e, t) {
  let r = 0, n = Et.length - 1;
  for (; r <= n; ) {
    const a = r + n >> 1, i = Et[a].zName;
    let o = 0;
    for (let l = 0; l < t.n; l++) {
      const c = i.charCodeAt(l) | 32;
      if (o = (t.z.charCodeAt(l) | 32) - c, o !== 0) break;
    }
    if (o === 0 && i.length > t.n && (o = -1), o === 0) return Et[a].val;
    o > 0 ? r = a + 1 : n = a - 1;
  }
  return e && f(e, t, "not a known color name"), -99;
}
const xn = [
  { zName: "arcrad", val: 0.25 },
  { zName: "arrowhead", val: 2 },
  { zName: "arrowht", val: 0.08 },
  { zName: "arrowwid", val: 0.06 },
  { zName: "boxht", val: 0.5 },
  { zName: "boxrad", val: 0 },
  { zName: "boxwid", val: 0.75 },
  { zName: "charht", val: 0.14 },
  { zName: "charwid", val: 0.08 },
  { zName: "circlerad", val: 0.25 },
  { zName: "color", val: 0 },
  { zName: "cylht", val: 0.5 },
  { zName: "cylrad", val: 0.075 },
  { zName: "cylwid", val: 0.75 },
  { zName: "dashwid", val: 0.05 },
  { zName: "diamondht", val: 0.75 },
  { zName: "diamondwid", val: 1 },
  { zName: "dotrad", val: 0.015 },
  { zName: "ellipseht", val: 0.5 },
  { zName: "ellipsewid", val: 0.75 },
  { zName: "fileht", val: 0.75 },
  { zName: "filerad", val: 0.15 },
  { zName: "filewid", val: 0.5 },
  { zName: "fill", val: -1 },
  { zName: "lineht", val: 0.5 },
  { zName: "linewid", val: 0.5 },
  { zName: "movewid", val: 0.5 },
  { zName: "ovalht", val: 0.5 },
  { zName: "ovalwid", val: 1 },
  { zName: "scale", val: 1 },
  { zName: "textht", val: 0.5 },
  { zName: "textwid", val: 0.75 },
  { zName: "thickness", val: 0.015 }
];
function z(e, t, r) {
  let n = e.pVar;
  for (; n; ) {
    if (n.zName.length === r && n.zName === t.substring(0, r))
      return { val: n.val, miss: !1 };
    n = n.pNext;
  }
  let a = 0, i = xn.length - 1;
  for (; a <= i; ) {
    const o = a + i >> 1, l = xn[o], c = l.zName.length < r ? l.zName.length : r;
    let u = or(t, l.zName, c);
    if (u === 0)
      if (r < l.zName.length) u = -1;
      else if (r > l.zName.length) u = 1;
      else return { val: l.val, miss: !1 };
    u > 0 ? a = o + 1 : i = o - 1;
  }
  return { val: 0, miss: !0 };
}
function ot(e, t, r) {
  const n = z(e, t, r);
  return { val: X(n.val), miss: n.miss };
}
function Cn(e, t) {
  const r = z(e, t.z, t.n);
  if (!r.miss) return r.val;
  const n = it(null, t);
  return n > -90 ? n : 0;
}
const wa = [
  /* ' ' */
  45,
  /* '!' */
  55,
  /* '"' */
  62,
  /* '#' */
  115,
  /* '$' */
  90,
  /* '%' */
  132,
  /* '&' */
  125,
  /* "'" */
  40,
  /* '(' */
  55,
  /* ')' */
  55,
  /* '*' */
  71,
  /* '+' */
  115,
  /* ',' */
  45,
  /* '-' */
  48,
  /* '.' */
  45,
  /* '/' */
  50,
  /* '0' */
  91,
  /* '1' */
  91,
  /* '2' */
  91,
  /* '3' */
  91,
  /* '4' */
  91,
  /* '5' */
  91,
  /* '6' */
  91,
  /* '7' */
  91,
  /* '8' */
  91,
  /* '9' */
  91,
  /* ':' */
  50,
  /* ';' */
  50,
  /* '<' */
  120,
  /* '=' */
  120,
  /* '>' */
  120,
  /* '?' */
  78,
  /* '@' */
  142,
  /* 'A' */
  102,
  /* 'B' */
  105,
  /* 'C' */
  110,
  /* 'D' */
  115,
  /* 'E' */
  105,
  /* 'F' */
  98,
  /* 'G' */
  105,
  /* 'H' */
  125,
  /* 'I' */
  58,
  /* 'J' */
  58,
  /* 'K' */
  107,
  /* 'L' */
  95,
  /* 'M' */
  145,
  /* 'N' */
  125,
  /* 'O' */
  115,
  /* 'P' */
  95,
  /* 'Q' */
  115,
  /* 'R' */
  107,
  /* 'S' */
  95,
  /* 'T' */
  97,
  /* 'U' */
  118,
  /* 'V' */
  102,
  /* 'W' */
  150,
  /* 'X' */
  100,
  /* 'Y' */
  93,
  /* 'Z' */
  100,
  /* '[' */
  58,
  /* '\\'*/
  50,
  /* ']' */
  58,
  /* '^' */
  119,
  /* '_' */
  72,
  /* '`' */
  72,
  /* 'a' */
  86,
  /* 'b' */
  92,
  /* 'c' */
  80,
  /* 'd' */
  92,
  /* 'e' */
  85,
  /* 'f' */
  52,
  /* 'g' */
  92,
  /* 'h' */
  92,
  /* 'i' */
  47,
  /* 'j' */
  47,
  /* 'k' */
  88,
  /* 'l' */
  48,
  /* 'm' */
  135,
  /* 'n' */
  92,
  /* 'o' */
  86,
  /* 'p' */
  92,
  /* 'q' */
  92,
  /* 'r' */
  69,
  /* 's' */
  75,
  /* 't' */
  58,
  /* 'u' */
  92,
  /* 'v' */
  80,
  /* 'w' */
  121,
  /* 'x' */
  81,
  /* 'y' */
  80,
  /* 'z' */
  76,
  /* '{' */
  91,
  /* '|' */
  49,
  /* '}' */
  91,
  /* '~' */
  118
];
function Pa(e, t) {
  const a = e.n, i = e.z;
  let o = 0, l = 1;
  for (; l < a - 1; ) {
    let c = i.charCodeAt(l);
    if (c === 92 && i.charCodeAt(l + 1) !== 38)
      c = i.charCodeAt(++l);
    else if (c === 38) {
      let u = l + 1;
      for (; u < l + 7 && u < i.length && i.charCodeAt(u) !== 59; ) u++;
      i.charCodeAt(u) === 59 && (l = u), o += (t ? 82 : 100) * 3 / 2, l++;
      continue;
    }
    if (c > 126) {
      o += t ? 82 : 100, l++;
      continue;
    }
    t ? o += 82 : c >= 32 && c <= 126 ? o += wa[c - 32] : o += 100, l++;
  }
  return o;
}
let Gt = () => null, lr = () => !1;
function Aa(e) {
  Gt = e;
}
function ga(e) {
  lr = e;
}
const {
  T_WHITESPACE: ee,
  T_ERROR: g,
  T_EOL: _e,
  T_STRING: Bt,
  T_PLUS: zn,
  T_MINUS: En,
  T_STAR: mn,
  T_SLASH: Nn,
  T_PERCENT: Sa,
  T_LP: Ht,
  T_RP: $t,
  T_LB: cr,
  T_RB: sr,
  T_COMMA: ur,
  T_COLON: La,
  T_GT: Ra,
  T_LT: ka,
  T_EQ: Da,
  T_ASSIGN: de,
  T_RARROW: Qe,
  T_LARROW: Ze,
  T_LRARROW: mt,
  T_NUMBER: vn,
  T_NTH: Wa,
  T_CLASSNAME: Ia,
  T_ID: lt,
  T_PLACENAME: Ma,
  T_PARAMETER: Ut,
  T_CODEBLOCK: Fa,
  T_DOT_E: Ga,
  T_DOT_XY: Ba,
  T_DOT_L: Ha,
  T_DOT_U: $a,
  T_EDGEPT: Ua,
  T_START: Va,
  T_END: Ja,
  T_X: Xa,
  T_Y: Ka,
  T_ISODATE: wn
} = s;
function fr(e) {
  return e >= "A" && e <= "Z";
}
function Vt(e) {
  return e >= "a" && e <= "z";
}
function Jt(e) {
  return e >= "0" && e <= "9";
}
function Ya(e) {
  return e >= "0" && e <= "9" || e >= "a" && e <= "f" || e >= "A" && e <= "F";
}
function be(e) {
  return Jt(e) || fr(e) || Vt(e);
}
function Pn(e) {
  return e === " " || e === "	" || e === "\r" || e === "\f" || e === `
`;
}
function ct(e, t) {
  const r = e.z, n = r.length;
  if (n === 0)
    return e.eType = g, 0;
  const a = r[0];
  switch (a) {
    case "\\": {
      e.eType = ee;
      let i = 1;
      for (; i < n && (r[i] === "\r" || r[i] === " " || r[i] === "	"); ) i++;
      return i < n && r[i] === `
` ? i + 1 : (e.eType = g, 1);
    }
    case ";":
    case `
`:
      return e.eType = _e, 1;
    case '"': {
      for (let i = 1; i < n; i++) {
        const o = r[i];
        if (o === "\\") {
          if (i + 1 >= n) break;
          i++;
          continue;
        }
        if (o === '"')
          return e.eType = Bt, i + 1;
      }
      return e.eType = g, n;
    }
    case " ":
    case "	":
    case "\f":
    case "\r": {
      let i = 1;
      for (; i < n; ) {
        const o = r[i];
        if (o !== " " && o !== "	" && o !== "\r" && o !== "\f") break;
        i++;
      }
      return e.eType = ee, i;
    }
    case "#": {
      let i = 1;
      for (; i < n && r[i] !== `
`; ) i++;
      return e.eType = ee, i;
    }
    case "/":
      if (n > 1 && r[1] === "*") {
        let i = 2;
        for (; i < n && !(r[i] === "*" && i + 1 < n && r[i + 1] === "/"); ) i++;
        return i < n && r[i] === "*" ? (e.eType = ee, i + 2) : (e.eType = g, i);
      } else if (n > 1 && r[1] === "/") {
        let i = 2;
        for (; i < n && r[i] !== `
`; ) i++;
        return e.eType = ee, i;
      } else return n > 1 && r[1] === "=" ? (e.eType = de, e.eCode = Nn, 2) : (e.eType = Nn, 1);
    case "+":
      return n > 1 && r[1] === "=" ? (e.eType = de, e.eCode = zn, 2) : (e.eType = zn, 1);
    case "*":
      return n > 1 && r[1] === "=" ? (e.eType = de, e.eCode = mn, 2) : (e.eType = mn, 1);
    case "%":
      return e.eType = Sa, 1;
    case "(":
      return e.eType = Ht, 1;
    case ")":
      return e.eType = $t, 1;
    case "[":
      return e.eType = cr, 1;
    case "]":
      return e.eType = sr, 1;
    case ",":
      return e.eType = ur, 1;
    case ":":
      return e.eType = La, 1;
    case ">":
      return e.eType = Ra, 1;
    case "=":
      return n > 1 && r[1] === "=" ? (e.eType = Da, 2) : (e.eType = de, e.eCode = de, 1);
    case "-":
      return n > 1 && r[1] === ">" ? (e.eType = Qe, 2) : n > 1 && r[1] === "=" ? (e.eType = de, e.eCode = En, 2) : (e.eType = En, 1);
    case "<":
      return n > 1 && r[1] === "-" ? n > 2 && r[2] === ">" ? (e.eType = mt, 3) : (e.eType = Ze, 2) : (e.eType = ka, 1);
    case "{": {
      let i = 1;
      if (t) {
        let o = 1;
        for (; i < n && o > 0; ) {
          const l = A(r.substring(i), n - i), c = ct(l, !1);
          c === 1 && (r[i] === "{" && o++, r[i] === "}" && o--), i += c;
        }
        if (o)
          return e.eType = g, 1;
      } else
        return e.eType = g, 1;
      return e.eType = Fa, i;
    }
    case "&": {
      const i = [
        { nByte: 6, eCode: Qe, zEntity: "&rarr;" },
        { nByte: 12, eCode: Qe, zEntity: "&rightarrow;" },
        { nByte: 6, eCode: Ze, zEntity: "&larr;" },
        { nByte: 11, eCode: Ze, zEntity: "&leftarrow;" },
        { nByte: 16, eCode: mt, zEntity: "&leftrightarrow;" }
      ];
      for (const o of i)
        if (r.startsWith(o.zEntity))
          return e.eType = o.eCode, o.nByte;
      return e.eType = g, 1;
    }
    default: {
      if (a === "←")
        return e.eType = Ze, 1;
      if (a === "→")
        return e.eType = Qe, 1;
      if (a === "↔")
        return e.eType = mt, 1;
      let i = a, o;
      if (i === ".")
        if (n > 1 && Vt(r[1])) {
          for (o = 2; o < n && r[o] >= "a" && r[o] <= "z"; ) o++;
          const l = r.substring(1, o), c = Gt(l, l.length);
          return c && (c.eEdge > 0 || c.eType === Ua || c.eType === Va || c.eType === Ja) ? e.eType = Ga : c && (c.eType === Xa || c.eType === Ka) ? e.eType = Ba : e.eType = Ha, 1;
        } else if (n > 1 && Jt(r[1]))
          o = 0;
        else if (n > 1 && fr(r[1])) {
          for (o = 2; o < n && (be(r[o]) || r[o] === "_"); ) o++;
          return e.eType = $a, 1;
        } else
          return e.eType = g, 1;
      if (i >= "0" && i <= "9" || i === ".") {
        let l, c = !0;
        if (i !== ".") {
          for (l = 1, o = 1; o < n && r[o] >= "0" && r[o] <= "9"; )
            o++, l++;
          if (i = o < n ? r[o] : "", o === 1 && (i === "x" || i === "X")) {
            for (o = 2; o < n && Ya(r[o]); ) o++;
            return e.eType = vn, o;
          }
        } else
          c = !1, l = 0, o = 0, i = r[0];
        if (o < n && r[o] === ".")
          for (c = !1, o++; o < n && r[o] >= "0" && r[o] <= "9"; )
            o++, l++;
        if (l === 0)
          return e.eType = g, o;
        if (i = o < n ? r[o] : "", i === "e" || i === "E") {
          const d = o;
          o++;
          let T = o < n ? r[o] : "";
          if ((T === "+" || T === "-") && (o++, T = o < n ? r[o] : ""), T < "0" || T > "9")
            o = d;
          else
            for (o++, c = !1; o < n && r[o] >= "0" && r[o] <= "9"; ) o++;
        }
        i = o < n ? r[o] : "";
        const u = i && o + 1 < n ? r[o + 1] : "";
        return c && (i === "t" && u === "h" || i === "r" && u === "d" || i === "n" && u === "d" || i === "s" && u === "t") ? (e.eType = Wa, o + 2) : ((i === "i" && u === "n" || i === "c" && u === "m" || i === "m" && u === "m" || i === "p" && u === "t" || i === "p" && u === "x" || i === "p" && u === "c") && (o += 2), e.eType = vn, o);
      }
      if (Vt(i)) {
        for (o = 1; o < n && (be(r[o]) || r[o] === "_"); ) o++;
        const l = r.substring(0, o), c = Gt(l, o);
        return c ? (e.eType = c.eType, e.eCode = c.eCode, e.eEdge = c.eEdge, o) : (e.n = o, lr(l, o) ? e.eType = Ia : e.eType = lt, o);
      }
      if (i >= "A" && i <= "Z") {
        for (o = 1; o < n && (be(r[o]) || r[o] === "_"); ) o++;
        return e.eType = Ma, o;
      }
      if (i === "$" && n > 1 && r[1] >= "1" && r[1] <= "9" && !(n > 2 && Jt(r[2])))
        return e.eType = Ut, e.eCode = r[1].charCodeAt(0) - 49, 2;
      if (i === "_" || i === "$" || i === "@") {
        for (o = 1; o < n && (be(r[o]) || r[o] === "_"); ) o++;
        return e.eType = lt, o;
      }
      return e.eType = g, 1;
    }
  }
}
class qa {
  constructor(t) {
    qe(this, "p");
    qe(this, "tokens", []);
    qe(this, "pos", 0);
    this.p = t;
  }
  /** Tokenize input text and fill the token array, handling macros */
  tokenize(t) {
    this.tokens = [], this.pos = 0, this._tokenizeInput({ z: t, n: t.length, eCode: 0, eType: 0, eEdge: 0 }, null);
  }
  _tokenizeInput(t, r) {
    const n = this.p;
    let a = 0;
    for (; a < t.n && t.z[a] && n.nErr === 0; ) {
      const i = {
        z: t.z.substring(a),
        n: 0,
        eCode: 0,
        eType: 0,
        eEdge: 0
      }, o = ct(i, !0);
      if (i.eType === ee) {
        a += o;
        continue;
      }
      if (o > 5e4) {
        i.n = 1, f(n, i, "token is too long - max length 50000 bytes");
        break;
      }
      if (i.eType === g) {
        i.n = o, f(n, i, "unrecognized token");
        break;
      }
      if (o + a > t.n) {
        i.n = t.n - a, f(n, i, "syntax error");
        break;
      }
      if (i.n = o, i.eType === Ut) {
        if (!r || r[i.eCode].n === 0) {
          a += o;
          continue;
        }
        n.nCtx >= Se ? f(n, i, "macros nested too deep") : (n.aCtx[n.nCtx++] = { ...i }, this._tokenizeInput(r[i.eCode], null), n.nCtx--), a += o;
        continue;
      }
      if (i.eType === lt) {
        const l = i.z.substring(0, i.n), c = st(n, l);
        if (c) {
          if (c.inUse) {
            f(n, c.macroName, "recursive macro definition");
            break;
          }
          if (n.nCtx >= Se) {
            f(n, i, "macros nested too deep");
            break;
          }
          c.inUse = !0;
          const u = new Array(9).fill(null).map(() => A());
          n.aCtx[n.nCtx++] = { ...i };
          const d = a + o, T = An(n, t.z.substring(d), t.n - d, u, r);
          this._tokenizeInput(c.macroBody, u), n.nCtx--, c.inUse = !1, a = d + T;
          continue;
        }
      }
      if (n.nToken++ > hn) {
        f(n, i, "script is too complex");
        break;
      }
      i.eType === wn && (i.z = '"pikchr"', i.n = 8, i.eType = Bt), this.tokens.push({ ...i }), a += o;
    }
  }
  /** Peek at the current token without advancing */
  peek() {
    return this.pos >= this.tokens.length ? A("", 0, _e) : this.tokens[this.pos];
  }
  /** Peek at a token N positions ahead */
  peekAhead(t) {
    const r = this.pos + t;
    return r >= this.tokens.length ? A("", 0, _e) : this.tokens[r];
  }
  /** Advance past the current token and return it */
  advance() {
    return this.pos >= this.tokens.length ? A("", 0, _e) : this.tokens[this.pos++];
  }
  /** If current token matches eType, advance and return it; else return null */
  match(t) {
    if (this.pos >= this.tokens.length) return null;
    const r = this.tokens[this.pos];
    return r.eType === t ? (this.pos++, r) : null;
  }
  /** Expect the current token to be eType. Error if not. */
  expect(t, r) {
    const n = this.peek();
    return n.eType === t ? this.advance() : (f(this.p, n.n > 0 ? n : this.lastToken(), r), n);
  }
  /** Check if we're at end of statement (EOL, end of input, or ]) */
  atStatementEnd() {
    const t = this.peek();
    return t.eType === _e || this.pos >= this.tokens.length || t.eType === s.T_RB;
  }
  /** Check if at end of input */
  atEnd() {
    return this.pos >= this.tokens.length;
  }
  /** Get the last consumed token (for error reporting) */
  lastToken() {
    return this.pos > 0 && this.pos <= this.tokens.length ? this.tokens[this.pos - 1] : A("", 0, _e);
  }
  /** Save current position for backtracking */
  save() {
    return this.pos;
  }
  /** Restore to a saved position */
  restore(t) {
    this.pos = t;
  }
  /**
   * Expand a macro and insert its tokens at the current position.
   * Called by the parser when it encounters a macro invocation.
   */
  expandMacro(t, r) {
    const n = this.p;
    if (t.inUse)
      return f(n, t.macroName, "recursive macro definition"), !1;
    if (n.nCtx >= Se)
      return f(n, t.macroName, "macros nested too deep"), !1;
    t.inUse = !0, n.aCtx[n.nCtx++] = { ...t.macroName };
    const a = [];
    return this._tokenizeMacroBody(t.macroBody, r, a), n.nCtx--, t.inUse = !1, this.tokens.splice(this.pos, 0, ...a), !0;
  }
  /**
   * Tokenize a macro body with parameter substitution.
   * Results are pushed to the output array.
   */
  _tokenizeMacroBody(t, r, n) {
    const a = this.p;
    let i = 0;
    for (; i < t.n && t.z[i] && a.nErr === 0; ) {
      const o = {
        z: t.z.substring(i),
        n: 0,
        eCode: 0,
        eType: 0,
        eEdge: 0
      }, l = ct(o, !0);
      if (o.eType === ee) {
        i += l;
        continue;
      }
      if (l > 5e4) {
        o.n = 1, f(a, o, "token is too long - max length 50000 bytes");
        break;
      }
      if (o.eType === g) {
        o.n = l, f(a, o, "unrecognized token");
        break;
      }
      if (l + i > t.n) {
        o.n = t.n - i, f(a, o, "syntax error");
        break;
      }
      if (o.n = l, o.eType === Ut) {
        if (r && r[o.eCode].n > 0) {
          if (a.nCtx >= Se) {
            f(a, o, "macros nested too deep");
            break;
          }
          a.aCtx[a.nCtx++] = { ...o }, this._tokenizeMacroBody(r[o.eCode], null, n), a.nCtx--;
        }
        i += l;
        continue;
      }
      if (o.eType === lt) {
        const c = o.z.substring(0, o.n), u = st(a, c);
        if (u) {
          if (u.inUse) {
            f(a, u.macroName, "recursive macro definition");
            break;
          }
          if (a.nCtx >= Se) {
            f(a, o, "macros nested too deep");
            break;
          }
          u.inUse = !0;
          const d = new Array(9).fill(null).map(() => A());
          a.aCtx[a.nCtx++] = { ...o };
          const T = i + l, x = An(a, t.z.substring(T), t.n - T, d, r);
          this._tokenizeMacroBody(u.macroBody, d, n), a.nCtx--, u.inUse = !1, i = T + x;
          continue;
        }
      }
      if (a.nToken++ > hn) {
        f(a, o, "script is too complex");
        break;
      }
      o.eType === wn && (o.z = '"pikchr"', o.n = 8, o.eType = Bt), n.push({ ...o }), i += l;
    }
  }
  /**
   * Parse macro arguments from the token stream (for parser use).
   * Returns the argument tokens or null if no arguments present.
   */
  parseMacroArgs() {
    if (this.pos >= this.tokens.length || this.tokens[this.pos].eType !== Ht)
      return null;
    const t = new Array(9).fill(null).map(() => A());
    let r = 0, n = 0, a = this.pos + 1;
    for (this.pos++; this.pos < this.tokens.length; ) {
      const i = this.tokens[this.pos];
      if (i.eType === $t && n === 0)
        return t[r] = this._collectArgTokens(a, this.pos), this.pos++, t;
      if (i.eType === ur && n === 0) {
        if (t[r] = this._collectArgTokens(a, this.pos), r++, r >= 9)
          return f(this.p, i, "too many macro arguments - max 9"), null;
        this.pos++, a = this.pos;
        continue;
      }
      (i.eType === Ht || i.eType === cr) && n++, (i.eType === $t || i.eType === sr) && n--, this.pos++;
    }
    return f(this.p, this.tokens[a] || A(), "unterminated macro argument list"), null;
  }
  /**
   * Collect tokens in a range and create a pseudo-token for the argument.
   * This reconstructs the text representation for macro parameter substitution.
   */
  _collectArgTokens(t, r) {
    if (t >= r)
      return A();
    const n = [];
    for (let i = t; i < r; i++)
      n.push(this.tokens[i].z.substring(0, this.tokens[i].n));
    const a = n.join(" ");
    return { z: a, n: a.length, eType: 0, eCode: 0, eEdge: 0 };
  }
}
function st(e, t) {
  let r = e.pMacros;
  for (; r; ) {
    if (r.macroName.z.substring(0, r.macroName.n) === t) return r;
    r = r.pNext;
  }
  return null;
}
function An(e, t, r, n, a) {
  if (r === 0 || t[0] !== "(") return 0;
  let i = 0, o = 1, l = 0;
  n[0].z = t.substring(1);
  let c;
  for (c = 1; c < r && t[c] !== ")"; ) {
    const d = A(t.substring(c), r - c), T = ct(d, !1);
    if (T === 1)
      if (t[c] === "," && l <= 0) {
        if (n[i].n = c - o, i === 8) {
          const x = A(t, 1);
          return f(e, x, "too many macro arguments - max 9"), 0;
        }
        i++, n[i].z = t.substring(c + 1), o = c + 1, l = 0;
      } else t[c] === "(" || t[c] === "{" || t[c] === "[" ? l++ : (t[c] === ")" || t[c] === "}" || t[c] === "]") && l--;
    c += T;
  }
  if (c < r && t[c] === ")") {
    n[i].n = c - o;
    for (let d = 0; d <= i; d++) {
      const T = n[d];
      let x = T.z, v = T.n;
      for (; v > 0 && Pn(x[0]); )
        v--, x = x.substring(1);
      for (; v > 0 && Pn(x[v - 1]); )
        v--;
      if (T.z = x, T.n = v, v === 2 && x[0] === "$" && x[1] >= "1" && x[1] <= "9") {
        const ce = x.charCodeAt(1) - 49;
        a ? n[d] = { ...a[ce] } : T.n = 0;
      }
    }
    return c + 1;
  }
  const u = A(t, 1);
  return f(e, u, "unterminated macro argument list"), 0;
}
let Me, Xt, et = [], Kt = null;
function Qa(e, t, r, n) {
  et = e, Me = t, Xt = r, Kt = n;
}
let Yt = null;
function Za(e) {
  Yt = e;
}
function ut(e) {
  let t = 0, r = et.length - 1;
  for (; t <= r; ) {
    const n = t + r >> 1, a = et[n].zName, i = e.z.substring(0, e.n);
    let o;
    if (a < i ? o = -1 : a > i ? o = 1 : o = 0, o === 0) return et[n];
    o < 0 ? t = n + 1 : r = n - 1;
  }
  return null;
}
function gn(e, t, r) {
  return r && (t || (t = { n: 0, a: [] }), t.a.push(r), t.n = t.a.length, e.list = t), t;
}
function tt(e, t, r, n) {
  if (e.nErr) return null;
  const a = Ca(Xt);
  if (e.cur = a, e.nTPath = 1, e.thenFlag = !1, !e.list || e.list.n === 0)
    a.ptAt.x = 0, a.ptAt.y = 0, a.eWith = 9;
  else {
    const o = e.list.a[e.list.n - 1];
    switch (a.ptAt = E(o.ptExit), e.eDir) {
      default:
        a.eWith = 7;
        break;
      case B:
        a.eWith = 3;
        break;
      case I:
        a.eWith = 5;
        break;
      case G:
        a.eWith = 1;
        break;
    }
  }
  e.aTPath[0] = E(a.ptAt), a.with = E(a.ptAt), a.outDir = a.inDir = e.eDir;
  const i = ot(e, "layer", 5);
  if (a.iLayer = i.miss ? 1e3 : i.val, a.iLayer < 0 && (a.iLayer = 0), n)
    return a.type = Me, a.pSublist = n, Me.xInit && Me.xInit(e, a), a;
  if (r) {
    const l = ut({ z: "text", n: 4 });
    return l ? (a.type = l, a.errTok = { ...r }, a.type.xInit && a.type.xInit(e, a), xr(e, r, r.eCode), a) : null;
  }
  if (t) {
    a.errTok = { ...t };
    const o = ut(t);
    return o ? (a.type = o, a.sw = z(e, "thickness", 9).val, a.fill = z(e, "fill", 4).val, a.color = z(e, "color", 5).val, o.xInit && o.xInit(e, a), a) : (f(e, t, "unknown object type"), null);
  }
  return a.type = Xt, a.ptExit = E(a.ptAt), a.ptEnter = E(a.ptAt), a;
}
function ba(e, t) {
  let r = e.pMacros;
  for (; r; ) {
    if (r.macroName.n === t.n && r.macroName.z.substring(0, r.macroName.n) === t.z.substring(0, t.n))
      return r;
    r = r.pNext;
  }
  return null;
}
function Oa(e, t, r) {
  let n = ba(e, t);
  n || (n = {
    pNext: e.pMacros,
    macroName: { ...t },
    macroBody: A(),
    inUse: !1
  }, e.pMacros = n);
  const a = r.n - 2;
  n.macroBody.z = r.z.substring(1, 1 + a), n.macroBody.n = a;
}
function dr(e, t) {
  if (e.outDir = t, !e.type.isLine || e.bClose)
    switch (e.ptExit = E(e.ptAt), e.outDir) {
      default:
        e.ptExit.x += e.w * 0.5;
        break;
      case B:
        e.ptExit.x -= e.w * 0.5;
        break;
      case I:
        e.ptExit.y += e.h * 0.5;
        break;
      case G:
        e.ptExit.y -= e.h * 0.5;
        break;
    }
}
function pa(e, t) {
  e.eDir = t, e.list && e.list.n && dr(e.list.a[e.list.n - 1], t);
}
function Tr(e, t, r) {
  e.ptAt.x += t, e.ptAt.y += r, e.ptEnter.x += t, e.ptEnter.y += r, e.ptExit.x += t, e.ptExit.y += r, e.bbox.ne.x += t, e.bbox.ne.y += r, e.bbox.sw.x += t, e.bbox.sw.y += r;
  for (let n = 0; n < e.nPath; n++)
    e.aPath[n].x += t, e.aPath[n].y += r;
  e.pSublist && ja(e.pSublist, t, r);
}
function ja(e, t, r) {
  for (let n = 0; n < e.n; n++)
    Tr(e.a[n], t, r);
}
function te(e, t, r, n) {
  return t.mProp & n ? (f(e, r, "value is already set"), !1) : t.mCalc & n ? (f(e, r, "value already fixed by prior constraints"), !1) : (t.mProp |= n, !0);
}
function ei(e, t, r) {
  const n = e.cur;
  switch (t.eType) {
    case s.T_HEIGHT:
      if (!te(e, n, t, nr)) return;
      n.h = n.h * r.rRel + r.rAbs;
      break;
    case s.T_WIDTH:
      if (!te(e, n, t, tr)) return;
      n.w = n.w * r.rRel + r.rAbs;
      break;
    case s.T_RADIUS:
      if (!te(e, n, t, It)) return;
      n.rad = n.rad * r.rRel + r.rAbs;
      break;
    case s.T_DIAMETER:
      if (!te(e, n, t, It)) return;
      n.rad = n.rad * r.rRel + 0.5 * r.rAbs;
      break;
    case s.T_THICKNESS:
      if (!te(e, n, t, da)) return;
      n.sw = n.sw * r.rRel + r.rAbs;
      break;
  }
  n.type.xNumProp && n.type.xNumProp(e, n, t);
}
function ti(e, t, r) {
  const n = e.cur;
  switch (t.eType) {
    case s.T_FILL:
      if (!te(e, n, t, Ta)) return;
      n.fill = r;
      break;
    case s.T_COLOR:
      if (!te(e, n, t, ha)) return;
      n.color = r;
      break;
  }
  n.type.xNumProp && n.type.xNumProp(e, n, t);
}
function Sn(e, t, r) {
  const n = e.cur;
  switch (t.eType) {
    case s.T_DOTTED: {
      const a = r === null ? z(e, "dashwid", 7).val : r;
      n.dotted = a, n.dashed = 0;
      break;
    }
    case s.T_DASHED: {
      const a = r === null ? z(e, "dashwid", 7).val : r;
      n.dashed = a, n.dotted = 0;
      break;
    }
  }
}
function ht(e) {
  e.samePath && (e.samePath = !1, e.nTPath = 1);
}
function Le(e, t, r) {
  if (!r.type.isLine) {
    f(e, t, "use with line-oriented objects only");
    return;
  }
  if (e.nTPath - 1 < 1 && (r.mProp & Mt) === 0) {
    f(e, t, "no prior path points");
    return;
  }
  e.thenFlag = !0;
}
function D(e, t) {
  let r = e.nTPath - 1;
  return r + 1 >= ar ? (t && f(e, t, "too many path elements"), r) : (r++, e.nTPath++, e.aTPath[r] = E(e.aTPath[r - 1]), e.mTPath = 0, r);
}
function hr(e, t, r) {
  const n = e.cur;
  if (!n.type.isLine) {
    t ? f(e, t, "use with line-oriented objects only") : f(e, n.errTok, "syntax error");
    return;
  }
  ht(e);
  let a = e.nTPath - 1;
  (e.thenFlag || e.mTPath === 3 || a === 0) && (a = D(e, t), e.thenFlag = !1);
  const i = t ? t.eCode : e.eDir;
  switch (i) {
    case I:
      e.mTPath & 2 && (a = D(e, t)), e.aTPath[a].y += r.rAbs + n.h * r.rRel, e.mTPath |= 2;
      break;
    case G:
      e.mTPath & 2 && (a = D(e, t)), e.aTPath[a].y -= r.rAbs + n.h * r.rRel, e.mTPath |= 2;
      break;
    case Z:
      e.mTPath & 1 && (a = D(e, t)), e.aTPath[a].x += r.rAbs + n.w * r.rRel, e.mTPath |= 1;
      break;
    case B:
      e.mTPath & 1 && (a = D(e, t)), e.aTPath[a].x -= r.rAbs + n.w * r.rRel, e.mTPath |= 1;
      break;
  }
  n.outDir = i;
}
function Oe(e, t, r, n, a, i) {
  const o = e.cur, l = t.rAbs + z(e, "linewid", 7).val * t.rRel;
  if (!o.type.isLine) {
    f(e, i, "use with line-oriented objects only");
    return;
  }
  ht(e);
  let c;
  do
    c = D(e, i);
  while (c < 1);
  if (r)
    n = n % 360;
  else if (a && a.eEdge === 9) {
    f(e, a, "syntax error");
    return;
  } else a && (n = Yn[a.eEdge]);
  n <= 45 ? o.outDir = I : n <= 135 ? o.outDir = Z : n <= 225 ? o.outDir = G : n <= 315 ? o.outDir = B : o.outDir = I;
  const u = n * 0.017453292519943295;
  e.aTPath[c].x += l * Math.sin(u), e.aTPath[c].y += l * Math.cos(u), e.mTPath = 2;
}
function ni(e, t, r) {
  const n = e.cur;
  if (!n.type.isLine) {
    f(e, t, "use with line-oriented objects only");
    return;
  }
  ht(e);
  let a = e.nTPath - 1;
  switch ((e.thenFlag || e.mTPath === 3 || a === 0) && (a = D(e, t), e.thenFlag = !1), t.eCode) {
    case G:
    case I:
      e.mTPath & 2 && (a = D(e, t)), e.aTPath[a].y = r.y, e.mTPath |= 2;
      break;
    case Z:
    case B:
      e.mTPath & 1 && (a = D(e, t)), e.aTPath[a].x = r.x, e.mTPath |= 1;
      break;
  }
  n.outDir = t.eCode;
}
function _r(e, t) {
  let r = null;
  return e.lastRef ? (e.lastRef.ptAt.x === t.x && e.lastRef.ptAt.y === t.y && (r = e.lastRef), e.lastRef = null, r) : null;
}
function ri(e, t, r, n) {
  if (!t.type.isLine) {
    f(e, r, 'use "at" to position this object');
    return;
  }
  if (t.mProp & Mt) {
    f(e, r, "line start location already fixed");
    return;
  }
  if (t.bClose) {
    f(e, r, "polygon is closed");
    return;
  }
  if (e.nTPath > 1) {
    const a = n.x - e.aTPath[0].x, i = n.y - e.aTPath[0].y;
    for (let o = 1; o < e.nTPath; o++)
      e.aTPath[o].x += a, e.aTPath[o].y += i;
  }
  e.aTPath[0] = E(n), e.mTPath = 3, t.mProp |= Mt, t.pFrom = _r(e, n);
}
function ai(e, t, r, n) {
  if (!t.type.isLine) {
    f(e, r, 'use "at" to position this object');
    return;
  }
  if (t.bClose) {
    f(e, r, "polygon is closed");
    return;
  }
  ht(e);
  let a = e.nTPath - 1;
  (a === 0 || e.mTPath === 3 || e.thenFlag) && (a = D(e, r)), e.aTPath[a] = E(n), e.mTPath = 3, t.pTo = _r(e, n);
}
function ii(e, t) {
  const r = e.cur;
  if (e.nTPath < 3) {
    f(e, t, "need at least 3 vertexes in order to close the polygon");
    return;
  }
  if (r.bClose) {
    f(e, t, "polygon already closed");
    return;
  }
  r.bClose = !0;
}
function oi(e, t) {
  const r = e.cur;
  e.nErr === 0 && r.iLayer >= t.iLayer && (r.iLayer = t.iLayer - 1);
}
const li = [3, 5, 7, 1];
function yr(e, t, r, n) {
  if (e.nErr) return;
  const a = e.cur;
  if (a.type.isLine) {
    f(e, n, 'use "from" and "to" to position this object');
    return;
  }
  if (a.mProp & Tn) {
    f(e, n, 'location fixed by prior "at"');
    return;
  }
  if (a.mProp |= Tn, a.eWith = t ? t.eEdge : 9, a.eWith >= 10) {
    const i = a.eWith === 10 ? a.outDir : (a.inDir + 2) % 4;
    a.eWith = li[i];
  }
  a.with = E(r);
}
function xr(e, t, r) {
  const n = e.cur;
  if (n.nTxt >= ya) {
    f(e, t, "too many text terms");
    return;
  }
  const a = { ...t, eCode: r };
  n.aTxt.push(a), n.nTxt = n.aTxt.length;
}
function ci(e, t) {
  let r = e;
  switch (t.eType) {
    case s.T_LJUST:
      r = r & ~De | Re;
      break;
    case s.T_RJUST:
      r = r & ~De | ke;
      break;
    case s.T_ABOVE:
      r = r & ~K | ie;
      break;
    case s.T_CENTER:
      r = r & ~K | ne;
      break;
    case s.T_BELOW:
      r = r & ~K | oe;
      break;
    case s.T_ITALIC:
      r |= er;
      break;
    case s.T_BOLD:
      r |= pe;
      break;
    case s.T_MONO:
      r |= je;
      break;
    case s.T_ALIGNED:
      r |= Wt;
      break;
    case s.T_BIG:
      r & Rt ? r |= Dt : r = r & -1793 | Rt;
      break;
    case s.T_SMALL:
      r & kt ? r |= Dt : r = r & -1793 | kt;
      break;
  }
  return r;
}
function Fe(e, t, r, n) {
  if (e.nErr) return;
  if (t || (t = e.cur), t.nTxt === 0) {
    f(e, r, "no text to fit to");
    return;
  }
  if (!t.type.xFit) return;
  const a = { sw: { x: 1, y: 1 }, ne: { x: 0, y: 0 } };
  Nr(e), Yt && Yt(e, t, a);
  let i = 0, o = 0;
  if (((n & 1) !== 0 || t.bAltAutoFit) && (i = a.ne.x - a.sw.x + e.charWidth), (n & 2) !== 0 || t.bAltAutoFit) {
    const l = a.ne.y - t.ptAt.y, c = t.ptAt.y - a.sw.y;
    o = 2 * (l < c ? c : l) + 0.5 * e.charHeight;
  }
  t.type.xFit(e, t, i, o), t.mProp |= _a;
}
function si(e, t, r, n) {
  let a = e.pVar;
  const i = t.z.substring(0, t.n);
  for (; a && a.zName !== i; )
    a = a.pNext;
  switch (a || (a = {
    zName: i,
    val: z(e, t.z, t.n).val,
    pNext: e.pVar
  }, e.pVar = a), n.eCode) {
    case s.T_PLUS:
      a.val += r;
      break;
    case s.T_STAR:
      a.val *= r;
      break;
    case s.T_MINUS:
      a.val -= r;
      break;
    case s.T_SLASH:
      r === 0 ? f(e, n, "division by zero") : a.val /= r;
      break;
    default:
      a.val = r;
      break;
  }
  e.bLayoutVars = !1;
}
function pt(e, t) {
  let r = parseInt(t.z, 10);
  return isNaN(r) && (r = 0), r > 1e3 && (f(e, t, "value too big - max '1000th'"), r = 1), r === 0 && t.z.substring(0, t.n) === "first" && (r = 1), r;
}
function Ln(e, t, r) {
  let n;
  if (t ? n = t.pSublist : n = e.list, !n)
    return f(e, r, "no such object"), null;
  let a;
  if (r.eType === s.T_LAST)
    a = null;
  else if (r.eType === s.T_LB)
    a = Me;
  else if (a = ut(r), !a)
    return f(e, r, "no such object type"), null;
  let i = r.eCode;
  if (i < 0)
    for (let o = n.n - 1; o >= 0; o--) {
      const l = n.a[o];
      if (!(a && l.type !== a) && (i++, i === 0))
        return l;
    }
  else
    for (let o = 0; o < n.n; o++) {
      const l = n.a[o];
      if (!(a && l.type !== a) && (i--, i === 0))
        return l;
    }
  return f(e, r, "no such object"), null;
}
function Rn(e, t, r) {
  let n;
  if (t ? n = t.pSublist : n = e.list, !n)
    return f(e, r, "no such object"), null;
  const a = r.z.substring(0, r.n);
  for (let i = n.n - 1; i >= 0; i--) {
    const o = n.a[i];
    if (o.zName && o.zName === a)
      return e.lastRef = o, o;
  }
  for (let i = n.n - 1; i >= 0; i--) {
    const o = n.a[i];
    for (let l = 0; l < o.nTxt; l++) {
      const c = o.aTxt[l];
      if (c.n === r.n + 2 && c.z.substring(1, 1 + r.n) === a)
        return e.lastRef = o, o;
    }
  }
  return f(e, r, "no such object"), null;
}
function kn(e, t, r) {
  const n = e.cur;
  if (!e.nErr) {
    if (!t) {
      let a;
      for (a = (e.list ? e.list.n : 0) - 1; a >= 0 && (t = e.list.a[a], t.type !== n.type); a--)
        ;
      if (a < 0) {
        f(e, r, "no prior objects of the same type");
        return;
      }
    }
    if (t.nPath && n.type.isLine) {
      const a = e.aTPath[0].x - t.aPath[0].x, i = e.aTPath[0].y - t.aPath[0].y;
      for (let o = 1; o < t.nPath; o++)
        e.aTPath[o] = {
          x: t.aPath[o].x + a,
          y: t.aPath[o].y + i
        };
      e.nTPath = t.nPath, e.mTPath = 3, e.samePath = !0;
    }
    n.type.isLine || (n.w = t.w, n.h = t.h), n.rad = t.rad, n.sw = t.sw, n.dashed = t.dashed, n.dotted = t.dotted, n.fill = t.fill, n.color = t.color, n.cw = t.cw, n.larrow = t.larrow, n.rarrow = t.rarrow, n.bClose = t.bClose, n.bChop = t.bChop, n.iLayer = t.iLayer;
  }
}
function Cr(e, t, r) {
  return t.type.xOffset ? t.type.xOffset(e, t, r) : { x: 0, y: 0 };
}
function Ce(e, t, r) {
  if (!t) return { x: 0, y: 0 };
  if (!r) return E(t.ptAt);
  if (r.eType === s.T_EDGEPT || r.eEdge > 0 && r.eEdge < 10) {
    const n = Cr(e, t, r.eEdge);
    return n.x += t.ptAt.x, n.y += t.ptAt.y, n;
  }
  return r.eType === s.T_START ? E(t.ptEnter) : E(t.ptExit);
}
function Dn(e, t, r) {
  return {
    x: r.x * e + t.x * (1 - e),
    y: r.y * e + t.y * (1 - e)
  };
}
function zr(e, t, r) {
  const n = t * 0.017453292519943295;
  return {
    x: r.x + e * Math.sin(n),
    y: r.y + e * Math.cos(n)
  };
}
function Wn(e, t, r) {
  return zr(e, Yn[t.eEdge], r);
}
function Er(e, t, r, n) {
  if (e.nErr || !n) return E(e.aTPath[0]);
  if (!n.type.isLine)
    return f(e, r, "object is not a line"), { x: 0, y: 0 };
  const a = parseInt(t.z, 10);
  return a < 1 || a > n.nPath ? (f(e, t, "no such vertex"), { x: 0, y: 0 }) : E(n.aPath[a - 1]);
}
function ui(e, t) {
  if (!e) return 0;
  switch (t.eType) {
    case s.T_HEIGHT:
      return e.h;
    case s.T_WIDTH:
      return e.w;
    case s.T_RADIUS:
      return e.rad;
    case s.T_DIAMETER:
      return e.rad * 2;
    case s.T_THICKNESS:
      return e.sw;
    case s.T_DASHED:
      return e.dashed;
    case s.T_DOTTED:
      return e.dotted;
    case s.T_FILL:
      return e.fill;
    case s.T_COLOR:
      return e.color;
    case s.T_X:
      return e.ptAt.x;
    case s.T_Y:
      return e.ptAt.y;
    case s.T_TOP:
      return e.bbox.ne.y;
    case s.T_BOTTOM:
      return e.bbox.sw.y;
    case s.T_LEFT:
      return e.bbox.sw.x;
    case s.T_RIGHT:
      return e.bbox.ne.x;
    default:
      return 0;
  }
}
function In(e, t, r, n) {
  switch (t.eCode) {
    case qn:
      return r < 0 ? -r : r;
    case Qn:
      return Math.cos(r);
    case Zn:
      return Math.round(r);
    case pn:
      return Math.sin(r);
    case jn:
      return r < 0 ? (f(e, t, "sqrt of negative value"), 0) : Math.sqrt(r);
    case bn:
      return r > n ? r : n;
    case On:
      return r < n ? r : n;
    default:
      return 0;
  }
}
function Mn(e, t, r) {
  !t || !r || (t.zName = r.z.substring(0, r.n));
}
function mr(e, t, r) {
  if (!e) return null;
  for (let n = e.n - 1; n >= 0; n--) {
    let a = e.a[n];
    if (a.type.xChop && a.ptAt.x === t.x && a.ptAt.y === t.y && !Ea(a.bbox, r))
      return a;
    if (a.pSublist && (a = mr(a.pSublist, t, r), a))
      return a;
  }
  return null;
}
function Fn(e, t, r, n) {
  if ((!n || !n.type.xChop) && (n = mr(e.list, r, t)), n && n.type.xChop) {
    const a = n.type.xChop(e, n, t);
    r.x = a.x, r.y = a.y;
  }
}
function fi(e, t, r, n) {
  const a = P(t), i = P(n);
  return a !== i && f(e, r, `${a} != ${i}`), null;
}
function di(e, t, r, n) {
  const a = `(${P(t.x)},${P(t.y)})`, i = `(${P(n.x)},${P(n.y)})`;
  return a !== i && f(e, r, `${a} != ${i}`), null;
}
function Nr(e) {
  if (e.bLayoutVars) return;
  let t = z(e, "thickness", 9).val;
  t <= 0.01 && (t = 0.01);
  const r = 0.5 * z(e, "arrowwid", 8).val;
  e.wArrow = r / t, e.hArrow = z(e, "arrowht", 7).val / t, e.fontScale = z(e, "fontscale", 9).val, e.fontScale <= 0 && (e.fontScale = 1), e.rScale = 144, e.charWidth = z(e, "charwid", 7).val * e.fontScale, e.charHeight = z(e, "charht", 6).val * e.fontScale, e.bLayoutVars = !0;
}
function Ti(e, t) {
  if (!e.nErr) {
    if (!t.type.isLine) {
      t.h <= 0 && (t.nTxt === 0 ? t.h = 0 : t.w <= 0 ? Fe(e, t, t.errTok, 3) : Fe(e, t, t.errTok, 2)), t.w <= 0 && (t.nTxt === 0 ? t.w = 0 : Fe(e, t, t.errTok, 1));
      const r = Cr(e, t, t.eWith), n = t.with.x - r.x - t.ptAt.x, a = t.with.y - r.y - t.ptAt.y;
      (n !== 0 || a !== 0) && Tr(t, n, a);
    }
    if (t.type.isLine && e.nTPath < 2) {
      switch (D(e, null), t.inDir) {
        default:
          e.aTPath[1].x += t.w;
          break;
        case G:
          e.aTPath[1].y -= t.h;
          break;
        case B:
          e.aTPath[1].x -= t.w;
          break;
        case I:
          e.aTPath[1].y += t.h;
          break;
      }
      if (Kt && t.type.xInit === Kt)
        switch (t.outDir = (t.inDir + (t.cw ? 1 : 3)) % 4, e.eDir = t.outDir, t.outDir) {
          default:
            e.aTPath[1].x += t.w;
            break;
          case G:
            e.aTPath[1].y -= t.h;
            break;
          case B:
            e.aTPath[1].x -= t.w;
            break;
          case I:
            e.aTPath[1].y += t.h;
            break;
        }
    }
    if (Ot(t.bbox), !(t.type.xCheck && (t.type.xCheck(e, t), e.nErr))) {
      if (t.type.isLine) {
        t.aPath = [], t.nPath = e.nTPath;
        for (let r = 0; r < e.nTPath; r++)
          t.aPath.push(E(e.aTPath[r]));
        if (t.bChop && t.nPath >= 2) {
          const r = t.nPath;
          Fn(e, t.aPath[r - 2], t.aPath[r - 1], t.pTo), Fn(e, t.aPath[1], t.aPath[0], t.pFrom);
        }
        t.ptEnter = E(t.aPath[0]), t.ptExit = E(t.aPath[t.nPath - 1]);
        for (let r = 0; r < t.nPath; r++)
          Ie(t.bbox, t.aPath[r].x, t.aPath[r].y);
        t.ptAt.x = (t.bbox.ne.x + t.bbox.sw.x) / 2, t.ptAt.y = (t.bbox.ne.y + t.bbox.sw.y) / 2, t.w = t.bbox.ne.x - t.bbox.sw.x, t.h = t.bbox.ne.y - t.bbox.sw.y, t.bClose && dr(t, t.inDir);
      } else {
        const r = t.w / 2, n = t.h / 2;
        switch (t.ptEnter = E(t.ptAt), t.ptExit = E(t.ptAt), t.inDir) {
          default:
            t.ptEnter.x -= r;
            break;
          case B:
            t.ptEnter.x += r;
            break;
          case I:
            t.ptEnter.y -= n;
            break;
          case G:
            t.ptEnter.y += n;
            break;
        }
        switch (t.outDir) {
          default:
            t.ptExit.x += r;
            break;
          case B:
            t.ptExit.x -= r;
            break;
          case I:
            t.ptExit.y += n;
            break;
          case G:
            t.ptExit.y -= n;
            break;
        }
        Ie(t.bbox, t.ptAt.x - r, t.ptAt.y - n), Ie(t.bbox, t.ptAt.x + r, t.ptAt.y + n);
      }
      e.eDir = t.outDir;
    }
  }
}
let C = () => 0;
function hi(e) {
  C = e;
}
let S = () => {
};
function _i(e) {
  S = e;
}
let L = () => {
};
function yi(e) {
  L = e;
}
let vr = () => {
};
function xi(e) {
  vr = e;
}
function Ci(e, t, r) {
  const n = t.x - e.x, a = t.y - e.y, i = Math.hypot(n, a);
  if (i <= r) {
    t.x = e.x, t.y = e.y;
    return;
  }
  const o = 1 - r / i;
  t.x = e.x + o * n, t.y = e.y + o * a;
}
function me(e, t, r, n) {
  let a = r.x - t.x, i = r.y - t.y;
  const o = Math.hypot(a, i);
  let l = e.hArrow * n.sw;
  const c = e.wArrow * n.sw;
  if (n.color < 0 || n.sw <= 0 || o <= 0) return;
  a /= o, i /= o;
  let u = o - l;
  u < 0 && (u = 0, l = o);
  const d = -c * i, T = c * a, x = t.x + u * a, v = t.y + u * i;
  e.zOut += _(e, '<polygon points="', r.x, r.y), e.zOut += _(e, " ", x - d, v - T), e.zOut += _(e, " ", x + d, v + T), e.zOut += Ve(e, '" style="fill:', n.color, `"/>
`, !1), Ci(t, r, l / 2);
}
function wr(e, t) {
  t.w = C(e, "arcrad"), t.h = t.w;
}
function Pr(e, t, r) {
  const n = { x: 0, y: 0 };
  n.x = 0.5 * (t.x + r.x), n.y = 0.5 * (t.y + r.y);
  const a = r.x - t.x, i = r.y - t.y;
  return e ? (n.x -= 0.5 * i, n.y += 0.5 * a) : (n.x += 0.5 * i, n.y -= 0.5 * a), n;
}
function zi(e, t) {
  if (e.nTPath > 2) {
    f(e, t.errTok, "arc geometry error");
    return;
  }
  const r = e.aTPath[0], n = e.aTPath[1], a = Pr(t.cw, r, n), i = t.sw;
  for (let o = 1; o < 16; o++) {
    const l = 0.0625 * o, c = 1 - l, u = c * c, d = 2 * l * c, T = l * l, x = u * r.x + d * a.x + T * n.x, v = u * r.y + d * a.y + T * n.y;
    at(t.bbox, x, v, i, i);
  }
}
function Ei(e, t) {
  if (t.nPath < 2 || t.sw < 0) return;
  const r = t.aPath[0], n = t.aPath[1], a = Pr(t.cw, r, n);
  t.larrow && me(e, a, r, t), t.rarrow && me(e, a, n, t), e.zOut += _(e, '<path d="M', r.x, r.y), e.zOut += _(e, "Q", a.x, a.y), e.zOut += _(e, " ", n.x, n.y), e.zOut += '" ', S(e, t, 0), e.zOut += `" />
`, L(e, t, null);
}
function mi(e, t) {
  t.w = C(e, "linewid"), t.h = C(e, "lineht"), t.rad = C(e, "linerad"), t.rarrow = !0;
}
function Ni(e, t) {
  t.w = C(e, "boxwid"), t.h = C(e, "boxht"), t.rad = C(e, "boxrad");
}
function Y(e, t, r) {
  const n = { x: 0, y: 0 }, a = 0.5 * t.w, i = 0.5 * t.h;
  let o = t.rad, l;
  switch (o <= 0 ? l = 0 : (o > a && (o = a), o > i && (o = i), l = 0.29289321881345254 * o), r) {
    case 9:
      break;
    case 1:
      n.x = 0, n.y = i;
      break;
    case 2:
      n.x = a - l, n.y = i - l;
      break;
    case 3:
      n.x = a, n.y = 0;
      break;
    case 4:
      n.x = a - l, n.y = l - i;
      break;
    case 5:
      n.x = 0, n.y = -i;
      break;
    case 6:
      n.x = l - a, n.y = l - i;
      break;
    case 7:
      n.x = -a, n.y = 0;
      break;
    case 8:
      n.x = l - a, n.y = i - l;
      break;
  }
  return n;
}
function Te(e, t, r) {
  let n = 9;
  const a = E(t.ptAt);
  if (t.w <= 0 || t.h <= 0) return a;
  const i = (r.x - t.ptAt.x) * t.h / t.w, o = r.y - t.ptAt.y;
  i > 0 ? o >= 2.414 * i ? n = 1 : o >= 0.414 * i ? n = 2 : o >= -0.414 * i ? n = 3 : o > -2.414 * i ? n = 4 : n = 5 : o >= -2.414 * i ? n = 1 : o >= -0.414 * i ? n = 8 : o >= 0.414 * i ? n = 7 : o > 2.414 * i ? n = 6 : n = 5;
  const l = t.type.xOffset(e, t, n);
  return { x: l.x + t.ptAt.x, y: l.y + t.ptAt.y };
}
function Nt(e, t, r, n) {
  r > 0 && (t.w = r), n > 0 && (t.h = n);
}
function Gn(e, t) {
  const r = 0.5 * t.w, n = 0.5 * t.h;
  let a = t.rad;
  const i = t.ptAt;
  if (t.sw >= 0) {
    if (a <= 0)
      e.zOut += _(e, '<path d="M', i.x - r, i.y - n), e.zOut += _(e, "L", i.x + r, i.y - n), e.zOut += _(e, "L", i.x + r, i.y + n), e.zOut += _(e, "L", i.x - r, i.y + n), e.zOut += 'Z" ';
    else {
      a > r && (a = r), a > n && (a = n);
      const o = i.x - r, l = o + a, c = i.x + r, u = c - a, d = i.y - n, T = d + a, x = i.y + n, v = x - a;
      e.zOut += _(e, '<path d="M', l, d), u > l && (e.zOut += _(e, "L", u, d)), e.zOut += re(e, a, a, c, T), v > T && (e.zOut += _(e, "L", c, v)), e.zOut += re(e, a, a, u, x), u > l && (e.zOut += _(e, "L", l, x)), e.zOut += re(e, a, a, o, v), v > T && (e.zOut += _(e, "L", o, T)), e.zOut += re(e, a, a, l, d), e.zOut += 'Z" ';
    }
    S(e, t, 3), e.zOut += `" />
`;
  }
  L(e, t, null);
}
function vi(e, t) {
  t.w = C(e, "circlerad") * 2, t.h = t.w, t.rad = 0.5 * t.w;
}
function wi(e, t, r) {
  switch (r.eType) {
    case s.T_DIAMETER:
    case s.T_RADIUS:
      t.w = t.h = 2 * t.rad;
      break;
    case s.T_WIDTH:
      t.h = t.w, t.rad = 0.5 * t.w;
      break;
    case s.T_HEIGHT:
      t.w = t.h, t.rad = 0.5 * t.w;
      break;
  }
}
function Bn(e, t, r) {
  const n = r.x - t.ptAt.x, a = r.y - t.ptAt.y, i = Math.hypot(n, a);
  return i < t.rad || i <= 0 ? E(t.ptAt) : {
    x: t.ptAt.x + n * t.rad / i,
    y: t.ptAt.y + a * t.rad / i
  };
}
function Pi(e, t, r, n) {
  let a = 0;
  r > 0 && (a = r), n > a && (a = n), r * n > 0 && r * r + n * n > a * a && (a = Math.hypot(r, n)), a > 0 && (t.rad = 0.5 * a, t.w = t.h = a);
}
function Ai(e, t) {
  const r = t.rad, n = t.ptAt;
  t.sw >= 0 && (e.zOut += dt(e, '<circle cx="', n.x, '"'), e.zOut += Tt(e, ' cy="', n.y, '"'), e.zOut += k(e, ' r="', r, '" '), S(e, t, 3), e.zOut += `" />
`), L(e, t, null);
}
function gi(e, t) {
  t.w = C(e, "cylwid"), t.h = C(e, "cylht"), t.rad = C(e, "cylrad");
}
function Si(e, t, r, n) {
  r > 0 && (t.w = r), n > 0 && (t.h = n + 0.25 * t.rad + t.sw);
}
function Li(e, t) {
  const r = 0.5 * t.w, n = 0.5 * t.h;
  let a = t.rad;
  const i = t.ptAt;
  t.sw >= 0 && (a > n ? a = n : a < 0 && (a = 0), e.zOut += _(e, '<path d="M', i.x - r, i.y + n - a), e.zOut += _(e, "L", i.x - r, i.y - n + a), e.zOut += re(e, r, a, i.x + r, i.y - n + a), e.zOut += _(e, "L", i.x + r, i.y + n - a), e.zOut += re(e, r, a, i.x - r, i.y + n - a), e.zOut += re(e, r, a, i.x + r, i.y + n - a), e.zOut += '" ', S(e, t, 3), e.zOut += `" />
`), L(e, t, null);
}
function Ri(e, t, r) {
  const n = { x: 0, y: 0 }, a = t.w * 0.5, i = t.h * 0.5, o = i - t.rad;
  switch (r) {
    case 9:
      break;
    case 1:
      n.x = 0, n.y = i;
      break;
    case 2:
      n.x = a, n.y = o;
      break;
    case 3:
      n.x = a, n.y = 0;
      break;
    case 4:
      n.x = a, n.y = -o;
      break;
    case 5:
      n.x = 0, n.y = -i;
      break;
    case 6:
      n.x = -a, n.y = -o;
      break;
    case 7:
      n.x = -a, n.y = 0;
      break;
    case 8:
      n.x = -a, n.y = o;
      break;
  }
  return n;
}
function ki(e, t) {
  t.rad = C(e, "dotrad"), t.h = t.w = t.rad * 6, t.fill = t.color;
}
function Di(e, t, r) {
  switch (r.eType) {
    case s.T_COLOR:
      t.fill = t.color;
      break;
    case s.T_FILL:
      t.color = t.fill;
      break;
  }
}
function Wi(e, t) {
  t.w = t.h = 0, at(t.bbox, t.ptAt.x, t.ptAt.y, t.rad, t.rad);
}
function Ii(e, t, r) {
  return { x: 0, y: 0 };
}
function Mi(e, t) {
  const r = t.rad, n = t.ptAt;
  t.sw >= 0 && (e.zOut += dt(e, '<circle cx="', n.x, '"'), e.zOut += Tt(e, ' cy="', n.y, '"'), e.zOut += k(e, ' r="', r, '"'), S(e, t, 2), e.zOut += `" />
`), L(e, t, null);
}
function Fi(e, t) {
  t.w = C(e, "diamondwid"), t.h = C(e, "diamondht"), t.bAltAutoFit = !0;
}
function Gi(e, t, r) {
  const n = { x: 0, y: 0 }, a = 0.5 * t.w, i = 0.25 * t.w, o = 0.5 * t.h, l = 0.25 * t.h;
  switch (r) {
    case 9:
      break;
    case 1:
      n.x = 0, n.y = o;
      break;
    case 2:
      n.x = i, n.y = l;
      break;
    case 3:
      n.x = a, n.y = 0;
      break;
    case 4:
      n.x = i, n.y = -l;
      break;
    case 5:
      n.x = 0, n.y = -o;
      break;
    case 6:
      n.x = -i, n.y = -l;
      break;
    case 7:
      n.x = -a, n.y = 0;
      break;
    case 8:
      n.x = -i, n.y = l;
      break;
  }
  return n;
}
function Bi(e, t, r, n) {
  if (t.w <= 0 && (t.w = r * 1.5), t.h <= 0 && (t.h = n * 1.5), t.w > 0 && t.h > 0) {
    const a = t.w * n / t.h + r, i = t.h * a / t.w;
    t.w = a, t.h = i;
  }
}
function Hi(e, t) {
  const r = 0.5 * t.w, n = 0.5 * t.h, a = t.ptAt;
  t.sw >= 0 && (e.zOut += _(e, '<path d="M', a.x - r, a.y), e.zOut += _(e, "L", a.x, a.y - n), e.zOut += _(e, "L", a.x + r, a.y), e.zOut += _(e, "L", a.x, a.y + n), e.zOut += 'Z" ', S(e, t, 3), e.zOut += `" />
`), L(e, t, null);
}
function $i(e, t) {
  t.w = C(e, "ellipsewid"), t.h = C(e, "ellipseht");
}
function Ui(e, t, r) {
  const n = r.x - t.ptAt.x, a = r.y - t.ptAt.y;
  if (t.w <= 0 || t.h <= 0) return E(t.ptAt);
  const i = t.h / t.w, o = n * i, l = Math.hypot(o, a);
  return l < t.h ? E(t.ptAt) : {
    x: t.ptAt.x + 0.5 * o * t.h / (l * i),
    y: t.ptAt.y + 0.5 * a * t.h / l
  };
}
function Hn(e, t, r) {
  const n = { x: 0, y: 0 }, a = t.w * 0.5, i = a * 0.7071067811865475, o = t.h * 0.5, l = o * 0.7071067811865475;
  switch (r) {
    case 9:
      break;
    case 1:
      n.x = 0, n.y = o;
      break;
    case 2:
      n.x = i, n.y = l;
      break;
    case 3:
      n.x = a, n.y = 0;
      break;
    case 4:
      n.x = i, n.y = -l;
      break;
    case 5:
      n.x = 0, n.y = -o;
      break;
    case 6:
      n.x = -i, n.y = -l;
      break;
    case 7:
      n.x = -a, n.y = 0;
      break;
    case 8:
      n.x = -i, n.y = l;
      break;
  }
  return n;
}
function Vi(e, t) {
  const r = t.w, n = t.h, a = t.ptAt;
  t.sw >= 0 && (e.zOut += dt(e, '<ellipse cx="', a.x, '"'), e.zOut += Tt(e, ' cy="', a.y, '"'), e.zOut += k(e, ' rx="', r / 2, '"'), e.zOut += k(e, ' ry="', n / 2, '" '), S(e, t, 3), e.zOut += `" />
`), L(e, t, null);
}
function Ji(e, t) {
  t.w = C(e, "filewid"), t.h = C(e, "fileht"), t.rad = C(e, "filerad");
}
function Xi(e, t, r) {
  const n = { x: 0, y: 0 }, a = 0.5 * t.w, i = 0.5 * t.h;
  let o = t.rad;
  const l = a < i ? a : i;
  switch (o > l && (o = l), o < l * 0.25 && (o = l * 0.25), o *= 0.5, r) {
    case 9:
      break;
    case 1:
      n.x = 0, n.y = i;
      break;
    case 2:
      n.x = a - o, n.y = i - o;
      break;
    case 3:
      n.x = a, n.y = 0;
      break;
    case 4:
      n.x = a, n.y = -i;
      break;
    case 5:
      n.x = 0, n.y = -i;
      break;
    case 6:
      n.x = -a, n.y = -i;
      break;
    case 7:
      n.x = -a, n.y = 0;
      break;
    case 8:
      n.x = -a, n.y = i;
      break;
  }
  return n;
}
function Ki(e, t, r, n) {
  r > 0 && (t.w = r), n > 0 && (t.h = n + 2 * t.rad);
}
function Yi(e, t) {
  const r = 0.5 * t.w, n = 0.5 * t.h;
  let a = t.rad;
  const i = t.ptAt, o = r < n ? r : n;
  a > o && (a = o), a < o * 0.25 && (a = o * 0.25), t.sw >= 0 && (e.zOut += _(e, '<path d="M', i.x - r, i.y - n), e.zOut += _(e, "L", i.x + r, i.y - n), e.zOut += _(e, "L", i.x + r, i.y + (n - a)), e.zOut += _(e, "L", i.x + (r - a), i.y + n), e.zOut += _(e, "L", i.x - r, i.y + n), e.zOut += 'Z" ', S(e, t, 1), e.zOut += `" />
`, e.zOut += _(e, '<path d="M', i.x + (r - a), i.y + n), e.zOut += _(e, "L", i.x + (r - a), i.y + (n - a)), e.zOut += _(e, "L", i.x + r, i.y + (n - a)), e.zOut += '" ', S(e, t, 0), e.zOut += `" />
`), L(e, t, null);
}
function qi(e, t) {
  t.w = C(e, "linewid"), t.h = C(e, "lineht"), t.rad = C(e, "linerad");
}
function vt(e, t, r) {
  return Y(e, t, r);
}
function Qi(e, t) {
  if (t.sw > 0) {
    let r = '<path d="M';
    const n = t.nPath;
    t.larrow && me(e, t.aPath[1], t.aPath[0], t), t.rarrow && me(e, t.aPath[n - 2], t.aPath[n - 1], t);
    for (let a = 0; a < t.nPath; a++)
      e.zOut += _(e, r, t.aPath[a].x, t.aPath[a].y), r = "L";
    t.bClose ? e.zOut += "Z" : t.fill = -1, e.zOut += '" ', S(e, t, t.bClose ? 3 : 0), e.zOut += `" />
`;
  }
  L(e, t, null);
}
function Zi(e, t) {
  t.w = C(e, "movewid"), t.h = t.w, t.fill = -1, t.color = -1, t.sw = -1;
}
function bi(e, t) {
}
function Oi(e, t) {
  t.h = C(e, "ovalht"), t.w = C(e, "ovalwid"), t.rad = 0.5 * (t.h < t.w ? t.h : t.w);
}
function pi(e, t, r) {
  t.rad = 0.5 * (t.h < t.w ? t.h : t.w);
}
function ji(e, t, r, n) {
  r > 0 && (t.w = r), n > 0 && (t.h = n), t.w < t.h && (t.w = t.h), t.rad = 0.5 * (t.h < t.w ? t.h : t.w);
}
function eo(e, t) {
  t.w = C(e, "linewid"), t.h = C(e, "lineht"), t.rad = 1e3;
}
function wt(e, t, r) {
  let n = t.x - e.x, a = t.y - e.y;
  const i = Math.hypot(n, a);
  if (i <= 0) return { pt: E(t), isMid: !1 };
  n /= i, a /= i;
  let o = !1, l = r;
  return l > 0.5 * i && (l = 0.5 * i, o = !0), {
    pt: { x: t.x - l * n, y: t.y - l * a },
    isMid: o
  };
}
function to(e, t, r) {
  const n = t.nPath, a = t.aPath;
  let i = a[n - 1];
  const o = t.bClose ? n : n - 1;
  e.zOut += _(e, '<path d="M', a[0].x, a[0].y);
  let l = wt(a[0], a[1], r);
  e.zOut += _(e, " L ", l.pt.x, l.pt.y);
  for (let c = 1; c < o; c++)
    i = c < n - 1 ? a[c + 1] : a[0], l = wt(i, a[c], r), e.zOut += _(e, " Q ", a[c].x, a[c].y), e.zOut += _(e, " ", l.pt.x, l.pt.y), l.isMid || (l = wt(a[c], i, r), e.zOut += _(e, " L ", l.pt.x, l.pt.y));
  e.zOut += _(e, " L ", i.x, i.y), t.bClose ? e.zOut += "Z" : t.fill = -1, e.zOut += '" ', S(e, t, t.bClose ? 3 : 0), e.zOut += `" />
`;
}
function Pt(e, t) {
  if (t.sw > 0) {
    const r = t.nPath, n = t.rad;
    if (r < 3 || n <= 0) {
      Qi(e, t);
      return;
    }
    t.larrow && me(e, t.aPath[1], t.aPath[0], t), t.rarrow && me(e, t.aPath[r - 2], t.aPath[r - 1], t), to(e, t, t.rad);
  }
  L(e, t, null);
}
function no(e, t) {
  C(e, "textwid"), C(e, "textht"), t.sw = 0;
}
function ro(e, t, r) {
  return vr(e, t, t.errTok, 3), Y(e, t, r);
}
function ao(e, t) {
  L(e, t, null);
}
function io(e, t) {
  const r = t.pSublist;
  if (r) {
    Ot(t.bbox);
    for (let n = 0; n < r.n; n++)
      ir(t.bbox, r.a[n].bbox);
    t.w = t.bbox.ne.x - t.bbox.sw.x, t.h = t.bbox.ne.y - t.bbox.sw.y, t.ptAt.x = 0.5 * (t.bbox.ne.x + t.bbox.sw.x), t.ptAt.y = 0.5 * (t.bbox.ne.y + t.bbox.sw.y), t.mCalc |= tr | nr | It;
  }
}
const oo = [
  {
    zName: "arc",
    isLine: !0,
    eJust: 0,
    xInit: wr,
    xNumProp: null,
    xCheck: zi,
    xChop: null,
    xOffset: Y,
    xFit: null,
    xRender: Ei
  },
  {
    zName: "arrow",
    isLine: !0,
    eJust: 0,
    xInit: mi,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: vt,
    xFit: null,
    xRender: Pt
  },
  {
    zName: "box",
    isLine: !1,
    eJust: 1,
    xInit: Ni,
    xNumProp: null,
    xCheck: null,
    xChop: Te,
    xOffset: Y,
    xFit: Nt,
    xRender: Gn
  },
  {
    zName: "circle",
    isLine: !1,
    eJust: 0,
    xInit: vi,
    xNumProp: wi,
    xCheck: null,
    xChop: Bn,
    xOffset: Hn,
    xFit: Pi,
    xRender: Ai
  },
  {
    zName: "cylinder",
    isLine: !1,
    eJust: 1,
    xInit: gi,
    xNumProp: null,
    xCheck: null,
    xChop: Te,
    xOffset: Ri,
    xFit: Si,
    xRender: Li
  },
  {
    zName: "diamond",
    isLine: !1,
    eJust: 0,
    xInit: Fi,
    xNumProp: null,
    xCheck: null,
    xChop: Te,
    xOffset: Gi,
    xFit: Bi,
    xRender: Hi
  },
  {
    zName: "dot",
    isLine: !1,
    eJust: 0,
    xInit: ki,
    xNumProp: Di,
    xCheck: Wi,
    xChop: Bn,
    xOffset: Ii,
    xFit: null,
    xRender: Mi
  },
  {
    zName: "ellipse",
    isLine: !1,
    eJust: 0,
    xInit: $i,
    xNumProp: null,
    xCheck: null,
    xChop: Ui,
    xOffset: Hn,
    xFit: Nt,
    xRender: Vi
  },
  {
    zName: "file",
    isLine: !1,
    eJust: 1,
    xInit: Ji,
    xNumProp: null,
    xCheck: null,
    xChop: Te,
    xOffset: Xi,
    xFit: Ki,
    xRender: Yi
  },
  {
    zName: "line",
    isLine: !0,
    eJust: 0,
    xInit: qi,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: vt,
    xFit: null,
    xRender: Pt
  },
  {
    zName: "move",
    isLine: !0,
    eJust: 0,
    xInit: Zi,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: Y,
    xFit: null,
    xRender: bi
  },
  {
    zName: "oval",
    isLine: !1,
    eJust: 1,
    xInit: Oi,
    xNumProp: pi,
    xCheck: null,
    xChop: Te,
    xOffset: Y,
    xFit: ji,
    xRender: Gn
  },
  {
    zName: "spline",
    isLine: !0,
    eJust: 0,
    xInit: eo,
    xNumProp: null,
    xCheck: null,
    xChop: null,
    xOffset: vt,
    xFit: null,
    xRender: Pt
  },
  {
    zName: "text",
    isLine: !1,
    eJust: 0,
    xInit: no,
    xNumProp: null,
    xCheck: null,
    xChop: Te,
    xOffset: ro,
    xFit: Nt,
    xRender: ao
  }
], lo = {
  zName: "[]",
  isLine: !1,
  eJust: 0,
  xInit: io,
  xNumProp: null,
  xCheck: null,
  xChop: null,
  xOffset: Y,
  xFit: null,
  xRender: null
}, co = {
  zName: "noop",
  isLine: !1,
  eJust: 0,
  xInit: null,
  xNumProp: null,
  xCheck: null,
  xChop: null,
  xOffset: Y,
  xFit: null,
  xRender: null
};
function so(e, t, r) {
  if (r < 4 || e[t] !== "&") return !1;
  let n = t + 1;
  const a = t + r;
  if (e[n] === "#") {
    n++;
    let i = 0;
    for (; n < a; ) {
      if (i > 1 && e[n] === ";") return !0;
      if (e[n] < "0" || e[n] > "9") return !1;
      i++, n++;
    }
  } else {
    let i = 0;
    for (; n < a; ) {
      const o = e[n];
      if (i > 1 && o === ";") return !0;
      if (i > 0 && o >= "0" && o <= "9") {
        i++, n++;
        continue;
      }
      if (o < "A" || o > "z" || o > "Z" && o < "a") return !1;
      i++, n++;
    }
  }
  return !1;
}
function uo(e, t, r) {
  const n = (r & 1) !== 0, a = (r & 2) !== 0;
  let i = "", o = 0;
  for (; o < t; ) {
    let l = o;
    for (; l < t; ) {
      const u = e[l];
      if (u === "<" || u === ">" || u === " " && n || u === "&" && a) break;
      l++;
    }
    if (l > o && (i += e.substring(o, l)), l >= t) break;
    switch (e[l]) {
      case "<":
        i += "&lt;";
        break;
      case ">":
        i += "&gt;";
        break;
      case " ":
        i += " ";
        break;
      case "&":
        so(e, l, t - l) ? i += "&" : i += "&amp;";
        break;
    }
    o = l + 1;
  }
  return i;
}
function fo(e, t, r) {
  let n = 0;
  if (e.zOut += ' style="', t.fill >= 0 && r) {
    let a = !0;
    t.fill === t.color && (r === 2 && (a = !1), r === 3 && (n = 1)), e.zOut += Ve(e, "fill:", t.fill, ";", a);
  } else
    e.zOut += "fill:none;";
  if (t.sw >= 0 && t.color >= 0) {
    const a = t.sw;
    if (e.zOut += k(e, "stroke-width:", a, ";"), t.nPath > 2 && t.rad <= t.sw && (e.zOut += "stroke-linejoin:round;"), e.zOut += Ve(e, "stroke:", t.color, ";", n !== 0), t.dotted > 0) {
      const i = t.dotted;
      let o = a;
      o < 2.1 / e.rScale && (o = 2.1 / e.rScale), e.zOut += k(e, "stroke-dasharray:", o, ""), e.zOut += k(e, ",", i, ";");
    } else if (t.dashed > 0) {
      const i = t.dashed;
      e.zOut += k(e, "stroke-dasharray:", i, ""), e.zOut += k(e, ",", i, ";");
    }
  }
}
function he(e) {
  let t = 1;
  return e.eCode & Rt && (t *= 1.25), e.eCode & kt && (t *= 0.8), e.eCode & Dt && (t *= t), t;
}
function To(e) {
  const t = e.nTxt;
  if (t === 0) return;
  const r = e.aTxt;
  if (t === 1) {
    (r[0].eCode & K) === 0 && (r[0].eCode |= ne);
    return;
  }
  let n = 0;
  const a = [];
  let i;
  for (let o = 0, l = 0, c = t - 1; c >= 0; c--)
    if (r[c].eCode & ie)
      if (o === 0)
        o++, l = r[c].eCode & De;
      else if (o === 1 && l !== 0 && (r[c].eCode & l) === 0)
        o++;
      else {
        r[c].eCode = r[c].eCode & ~K | ye;
        break;
      }
  for (let o = 0, l = 0, c = 0; c < t; c++)
    if (r[c].eCode & oe)
      if (o === 0)
        o++, l = r[c].eCode & De;
      else if (o === 1 && l !== 0 && (r[c].eCode & l) === 0)
        o++;
      else {
        r[c].eCode = r[c].eCode & ~K | xe;
        break;
      }
  for (let o = 0; o < t; o++) n |= r[o].eCode & K;
  t === 2 && ((r[0].eCode | r[1].eCode) & De) === (Re | ke) ? (i = 2, a[0] = ne, a[1] = ne) : (i = 0, t >= 4 && (n & ye) === 0 && (a[i++] = ye), (n & ie) === 0 && (a[i++] = ie), (t & 1) !== 0 && (a[i++] = ne), (n & oe) === 0 && (a[i++] = oe), t >= 4 && (n & xe) === 0 && (a[i++] = xe));
  for (let o = 0, l = 0; o < t; o++)
    (r[o].eCode & K) === 0 && (r[o].eCode |= a[l++]);
}
function qt(e, t, r) {
  if (e.nErr || t.nTxt === 0) return;
  const n = t.aTxt, a = t.nTxt;
  To(t);
  const i = t.ptAt.x;
  let o = 0;
  for (let y = 0; y < a; y++) o |= n[y].eCode;
  const l = t.sw >= 0 ? t.sw : 0;
  let c = 0, u = 0, d = 0, T = 0, x = 0, v = 0;
  if (t.type.isLine ? T = l * 1.5 : t.rad > 0 && t.type.zName === "cylinder" && (c = -0.75 * t.rad), o & ne) {
    for (let y = 0; y < a; y++)
      if (n[y].eCode & ne) {
        const h = he(n[y]);
        T < h * e.charHeight && (T = h * e.charHeight);
      }
  }
  if (o & ie) {
    for (let y = 0; y < a; y++)
      if (n[y].eCode & ie) {
        const h = he(n[y]) * e.charHeight;
        d < h && (d = h);
      }
    if (o & ye) {
      for (let y = 0; y < a; y++)
        if (n[y].eCode & ye) {
          const h = he(n[y]) * e.charHeight;
          u < h && (u = h);
        }
    }
  }
  if (o & oe) {
    for (let y = 0; y < a; y++)
      if (n[y].eCode & oe) {
        const h = he(n[y]) * e.charHeight;
        x < h && (x = h);
      }
    if (o & xe) {
      for (let y = 0; y < a; y++)
        if (n[y].eCode & xe) {
          const h = he(n[y]) * e.charHeight;
          v < h && (v = h);
        }
    }
  }
  let ce;
  t.type.eJust === 1 ? ce = 0.5 * (t.w - 0.5 * (e.charWidth + l)) : ce = 0;
  for (let y = 0; y < a; y++) {
    const h = n[y];
    let se = he(h), $ = 0;
    const Ye = t.ptAt.y;
    let R = c;
    if (h.eCode & ye && (R += 0.5 * T + d + 0.5 * u), h.eCode & ie && (R += 0.5 * T + 0.5 * d), h.eCode & oe && (R -= 0.5 * T + 0.5 * x), h.eCode & xe && (R -= 0.5 * T + x + 0.5 * v), h.eCode & Re && ($ -= ce), h.eCode & ke && ($ += ce), r !== null) {
      let w = Pa(h, (h.eCode & je) !== 0) * e.charWidth * se * 0.01;
      const U = e.charHeight * 0.5 * se;
      (h.eCode & (pe | je)) === pe && (w *= 1.1);
      let M, V, b, O;
      if (h.eCode & ke ? (M = $, V = R - U, b = $ - w, O = R + U) : h.eCode & Re ? (M = $, V = R - U, b = $ + w, O = R + U) : (M = $ + w / 2, V = R + U, b = $ - w / 2, O = R - U), (h.eCode & Wt) !== 0 && t.nPath >= 2) {
        const fn = t.nPath;
        let p = t.aPath[fn - 1].x - t.aPath[0].x, j = t.aPath[fn - 1].y - t.aPath[0].y;
        if (p !== 0 || j !== 0) {
          const dn = Math.hypot(p, j);
          p /= dn, j /= dn;
          let zt = p * M - j * V;
          V = j * M - p * V, M = zt, zt = p * b - j * O, O = j * b - p * O, b = zt;
        }
      }
      Ie(r, i + M, Ye + V), Ie(r, i + b, Ye + O);
      continue;
    }
    const ca = $ + i, sa = R + Ye;
    if (e.zOut += dt(e, '<text x="', ca, '"'), e.zOut += Tt(e, ' y="', sa, '"'), h.eCode & ke ? e.zOut += ' text-anchor="end"' : h.eCode & Re ? e.zOut += ' text-anchor="start"' : e.zOut += ' text-anchor="middle"', h.eCode & er && (e.zOut += ' font-style="italic"'), h.eCode & pe && (e.zOut += ' font-weight="bold"'), h.eCode & je && (e.zOut += ' font-family="monospace"'), t.color >= 0 && (e.zOut += Ve(e, ' fill="', t.color, '"', !1)), se *= e.fontScale, (se <= 0.99 || se >= 1.01) && (e.zOut += ` font-size="${P(se * 100)}%"`), (h.eCode & Wt) !== 0 && t.nPath >= 2) {
      const w = t.nPath, U = t.aPath[w - 1].x - t.aPath[0].x, M = t.aPath[w - 1].y - t.aPath[0].y;
      if (U !== 0 || M !== 0) {
        const V = Math.atan2(M, U) * -180 / Math.PI;
        e.zOut += ` transform="rotate(${P(V)}`, e.zOut += _(e, " ", i, Ye), e.zOut += ')"';
      }
    }
    e.zOut += ' dominant-baseline="central">';
    let ge, ue;
    h.n >= 2 && h.z[0] === '"' ? (ge = h.z.substring(1), ue = h.n - 2) : (ge = h.z, ue = h.n);
    let fe = 0;
    for (; fe < ue; ) {
      let w = fe;
      for (; w < ue && ge[w] !== "\\"; ) w++;
      w > fe && (e.zOut += uo(ge.substring(fe, w), w - fe, 3)), w < ue && (w + 1 === ue || ge[w + 1] === "\\") && (e.zOut += "&#92;", w++), fe = w + 1;
    }
    e.zOut += `</text>
`;
  }
}
function ho(e, t) {
  if (!t) return;
  e.zOut += "<!-- ", t.zName && (e.zOut += t.zName + ": "), e.zOut += t.type.zName, t.nTxt && (e.zOut += ' "' + t.aTxt[0].z.substring(1, t.aTxt[0].n - 1) + '"'), e.zOut += ` w=${P(t.w)} h=${P(t.h)}`, e.zOut += ` center=${P(t.ptAt.x)},${P(t.ptAt.y)}`, e.zOut += ` enter=${P(t.ptEnter.x)},${P(t.ptEnter.y)}`, e.zOut += ` exit=${P(t.ptExit.x)},${P(t.ptExit.y)}`;
  const r = [" right", " down", " left", " up"];
  e.zOut += r[t.outDir] || " right", e.zOut += ` -->
`;
}
function Ar(e, t) {
  let r = 0, n, a;
  const i = ot(e, "debug", 5).val;
  do {
    a = !1, n = r, r = 2147483647;
    for (let l = 0; l < t.n; l++) {
      const c = t.a[l];
      if (c.iLayer > n) {
        c.iLayer < r && (r = c.iLayer), a = !0;
        continue;
      } else if (c.iLayer < n)
        continue;
      i & 1 && ho(e, c), c.type.xRender && c.type.xRender(e, c), c.pSublist && Ar(e, c.pSublist);
    }
  } while (a);
  const o = z(e, "debug_label_color", 17);
  if (!o.miss && o.val >= 0)
    for (let l = 0; l < t.n; l++) {
      const c = t.a[l];
      if (!c.zName) continue;
      e.zOut += _(e, '<circle cx="', c.ptAt.x, c.ptAt.y);
      const u = 0.015 * e.rScale;
      e.zOut += `" r="${P(u)}"`, e.zOut += Ve(e, ' fill="', o.val, '"', !1), e.zOut += `/>
`;
    }
}
function gr(e, t, r) {
  for (let n = 0; n < t.n; n++) {
    const a = t.a[n];
    if (a.sw >= 0 && ir(e.bbox, a.bbox), qt(e, a, e.bbox), a.pSublist && gr(e, a.pSublist, r), a.type.isLine && a.nPath > 0 && (a.larrow && at(e.bbox, a.aPath[0].x, a.aPath[0].y, r, r), a.rarrow)) {
      const i = a.nPath - 1;
      at(e.bbox, a.aPath[i].x, a.aPath[i].y, r, r);
    }
  }
}
function _o(e, t) {
  if (t)
    if (e.nErr === 0) {
      Nr(e);
      let r = z(e, "thickness", 9).val;
      r <= 0.01 && (r = 0.01);
      let n = z(e, "margin", 6).val;
      n += r;
      const a = e.wArrow * r, i = ot(e, "fgcolor", 7);
      if (i.miss) {
        const d = { z: "fgcolor", n: 7 };
        e.fgcolor = X(it(null, d));
      } else
        e.fgcolor = i.val;
      const o = ot(e, "bgcolor", 7);
      if (o.miss) {
        const d = { z: "bgcolor", n: 7 };
        e.bgcolor = X(it(null, d));
      } else
        e.bgcolor = o.val;
      Ot(e.bbox), gr(e, t, a), e.bbox.ne.x += n + z(e, "rightmargin", 11).val, e.bbox.ne.y += n + z(e, "topmargin", 9).val, e.bbox.sw.x -= n + z(e, "leftmargin", 10).val, e.bbox.sw.y -= n + z(e, "bottommargin", 12).val, e.zOut += "<svg xmlns='http://www.w3.org/2000/svg' style='font-size:initial;'", e.zClass && (e.zOut += ` class="${e.zClass}"`);
      const l = e.bbox.ne.x - e.bbox.sw.x, c = e.bbox.ne.y - e.bbox.sw.y;
      e.wSVG = X(e.rScale * l), e.hSVG = X(e.rScale * c);
      const u = z(e, "scale", 5).val;
      u >= 1e-3 && u <= 1e3 && (u < 0.99 || u > 1.01) && (e.wSVG = X(e.wSVG * u), e.hSVG = X(e.hSVG * u), e.zOut += ` width="${e.wSVG}" height="${e.hSVG}"`), e.zOut += k(e, ' viewBox="0 0 ', l, ""), e.zOut += k(e, " ", c, '"'), e.zOut += `>
`, Ar(e, t), e.zOut += `</svg>
`;
    } else
      e.wSVG = -1, e.hSVG = -1;
}
const {
  T_ID: Ne,
  T_ASSIGN: yo,
  T_PLACENAME: ve,
  T_CLASSNAME: Ge,
  T_STRING: Ke,
  T_NUMBER: Sr,
  T_NTH: Ae,
  T_EOL: ze,
  T_LP: J,
  T_RP: W,
  T_LB: Be,
  T_RB: q,
  T_COMMA: F,
  T_COLON: xo,
  T_PLUS: ae,
  T_MINUS: Je,
  T_STAR: Co,
  T_SLASH: zo,
  T_PERCENT: Eo,
  T_EQ: $n,
  T_GT: mo,
  T_LT: No,
  T_LARROW: Lr,
  T_RARROW: Rr,
  T_LRARROW: kr,
  T_EDGEPT: le,
  T_OF: H,
  T_FILL: we,
  T_COLOR: Pe,
  T_THICKNESS: _t,
  T_DOTTED: jt,
  T_DASHED: en,
  T_CW: Dr,
  T_CCW: Wr,
  T_INVIS: Ir,
  T_THICK: Mr,
  T_THIN: Fr,
  T_SOLID: Gr,
  T_CHOP: Br,
  T_FIT: Hr,
  T_BEHIND: $r,
  T_SAME: Ur,
  T_FROM: tn,
  T_TO: Qt,
  T_THEN: Vr,
  T_GO: Zt,
  T_CLOSE: Jr,
  T_AT: nn,
  T_WITH: rn,
  T_HEADING: ft,
  T_HEIGHT: vo,
  T_WIDTH: wo,
  T_RADIUS: Po,
  T_DIAMETER: Ao,
  T_ABOVE: Xr,
  T_BELOW: Kr,
  T_CENTER: an,
  T_LJUST: go,
  T_RJUST: So,
  T_ITALIC: Lo,
  T_BOLD: Ro,
  T_MONO: ko,
  T_ALIGNED: Do,
  T_BIG: Wo,
  T_SMALL: Io,
  T_AND: Mo,
  T_AS: Fo,
  T_ASSERT: Go,
  T_BETWEEN: nt,
  T_DEFINE: Bo,
  T_DIST: Yr,
  T_DOT_E: yt,
  T_DOT_L: qr,
  T_DOT_U: Qr,
  T_DOT_XY: rt,
  T_DOWN: Ho,
  T_END: Zr,
  T_EVEN: br,
  T_FUNC1: Or,
  T_FUNC2: pr,
  T_IN: $o,
  T_LAST: Ee,
  T_LEFT: xt,
  T_PRINT: Uo,
  T_RIGHT: Ct,
  T_START: jr,
  T_THE: ea,
  T_TOP: ta,
  T_BOTTOM: na,
  T_UNTIL: ra,
  T_UP: Vo,
  T_VERTEX: aa,
  T_WAY: bt,
  T_X: At,
  T_Y: gt,
  T_THIS: on,
  T_CODEBLOCK: Jo
} = s;
function Xo(e, t) {
  e.sIn = { z: t, n: t.length, eCode: 0, eType: 0, eEdge: 0 };
  const r = new qa(e);
  return r.tokenize(t), e.nErr ? null : Ko(e, r);
}
function Ko(e, t) {
  return ia(e, t);
}
function ia(e, t) {
  let r = null;
  const n = Un(e, t);
  for (r = gn(e, r, n); e.nErr === 0 && !t.atEnd() && !(t.peek().eType === q || !t.match(ze)); ) {
    for (; t.match(ze); )
      ;
    if (t.atEnd() || t.peek().eType === q) break;
    const a = Un(e, t);
    r = gn(e, r, a);
  }
  return r;
}
function Un(e, t) {
  if (e.nErr) return null;
  let r = t.peek();
  if (r.eType === ze || t.atEnd() || r.eType === q)
    return null;
  if (r.eType === Ne) {
    const n = r.z.substring(0, r.n), a = st(e, n);
    if (a) {
      t.advance();
      const i = t.parseMacroArgs();
      if (t.expandMacro(a, i || new Array(9).fill(null).map(() => A()))) {
        for (; t.peek().eType === ze; ) t.advance();
        if (r = t.peek(), r.eType === ze || t.atEnd() || r.eType === q)
          return null;
      } else
        return null;
    }
  }
  if ($e(r.eType)) {
    const n = t.advance();
    return pa(e, n.eCode), null;
  }
  if (tl(r.eType) && t.peekAhead(1).eType === yo) {
    const a = t.advance(), i = t.advance(), o = cn(e, t);
    return si(e, a, o, i), null;
  }
  if (r.eType === ve && t.peekAhead(1).eType === xo) {
    const a = t.advance();
    if (t.advance(), nl(t.peek())) {
      const i = Vn(e, t);
      return Mn(e, i, a), i;
    } else {
      const i = m(e, t), o = tt(e, null, null, null);
      return o && (o.ptAt = i, Mn(e, o, a)), o;
    }
  }
  if (r.eType === Uo)
    return t.advance(), bo(e, t), null;
  if (r.eType === Go) {
    if (t.advance(), t.expect(J, 'expected "(" after "assert"'), e.nErr) return null;
    const n = t.save(), a = e.nErr, i = e.zOut, o = N(e, t);
    if (e.nErr === 0 && t.peek().eType === $n) {
      const d = t.advance(), T = N(e, t);
      if (e.nErr === 0)
        return t.expect(W, 'expected ")"'), fi(e, o, d, T), null;
    }
    e.nErr = a, e.zOut = i, t.restore(n);
    const l = m(e, t);
    if (e.nErr) return null;
    const c = t.expect($n, 'expected "=="'), u = m(e, t);
    return t.expect(W, 'expected ")"'), di(e, l, c, u), null;
  }
  if (r.eType === Bo) {
    t.advance();
    const n = t.expect(Ne, "expected macro name"), a = t.expect(Jo, "expected code block {...}");
    return e.nErr === 0 && Oa(e, n, a), null;
  }
  return Vn(e, t);
}
function Vn(e, t) {
  const r = oa(e, t);
  return e.nErr || !r || (Yo(e, t), e.nErr) || Ti(e, r), r;
}
function oa(e, t) {
  const r = t.peek();
  if (r.eType === Ne) {
    const n = r.z.substring(0, r.n), a = st(e, n);
    if (a) {
      t.advance();
      const i = t.parseMacroArgs();
      if (t.expandMacro(a, i || new Array(9).fill(null).map(() => A()))) {
        for (; t.peek().eType === ze; ) t.advance();
        return oa(e, t);
      }
      return null;
    }
  }
  if (r.eType === Ge) {
    const n = t.advance();
    return tt(e, n, null, null);
  }
  if (r.eType === Ke) {
    const n = t.advance(), a = la(e, t);
    return n.eCode = a, tt(e, null, n, null);
  }
  if (r.eType === Be) {
    t.advance();
    const n = e.list;
    e.list = null;
    const a = ia(e, t);
    t.expect(q, 'expected "]"');
    const i = t.lastToken();
    e.list = n;
    const o = tt(e, null, null, a);
    return o && (o.errTok = { ...i }), o;
  }
  return f(e, r, "syntax error"), null;
}
function la(e, t) {
  let r = 0;
  for (; rl(t.peek().eType); ) {
    const n = t.advance();
    r = ci(r, n);
  }
  return r;
}
function Yo(e, t, r) {
  if (!e.nErr) {
    if (!t.atStatementEnd() && un(t.peek()) && !il(t.peek())) {
      const n = ln(e, t);
      hr(e, null, n);
    }
    for (; e.nErr === 0 && !t.atStatementEnd() && qo(e, t); )
      ;
  }
}
function qo(e, t, r) {
  if (e.nErr || t.atStatementEnd()) return !1;
  const n = t.peek();
  if (sn(n.eType)) {
    const a = t.advance(), i = ln(e, t);
    return ei(e, a, i), !0;
  }
  if (n.eType === jt || n.eType === en) {
    const a = t.advance();
    if (!t.atStatementEnd() && un(t.peek())) {
      const i = N(e, t);
      Sn(e, a, i);
    } else
      Sn(e, a, null);
    return !0;
  }
  if (n.eType === we || n.eType === Pe) {
    const a = t.advance(), i = cn(e, t);
    return ti(e, a, i), !0;
  }
  if (n.eType === Zt || $e(n.eType)) {
    const a = n.eType === Zt;
    a && t.advance();
    const i = t.peek();
    if ($e(i.eType)) {
      const o = t.advance();
      if (cl(t.peek())) {
        Zo(e, t);
        const l = m(e, t);
        ni(e, o, l);
      } else {
        const l = St(e, t);
        hr(e, o, l);
      }
      return !0;
    }
    if (a) {
      const o = n, l = St(e, t);
      if (t.peek().eType === ft) {
        const c = t.advance(), u = N(e, t);
        Oe(e, l, c, u, null, o);
      } else if (t.peek().eType === le) {
        const c = t.advance();
        Oe(e, l, null, 0, c, o);
      } else
        f(e, t.peek(), 'expected direction after "go"');
      return !0;
    }
    return !1;
  }
  if (n.eType === Jr) {
    const a = t.advance();
    return ii(e, a), !0;
  }
  if (n.eType === Br)
    return t.advance(), e.cur.bChop = !0, !0;
  if (n.eType === tn) {
    const a = t.advance(), i = m(e, t);
    return ri(e, e.cur, a, i), !0;
  }
  if (n.eType === Qt) {
    const a = t.advance(), i = m(e, t);
    return ai(e, e.cur, a, i), !0;
  }
  if (n.eType === Vr) {
    const a = t.advance();
    if (t.peek().eType === Qt || $e(t.peek().eType))
      return Le(e, a, e.cur), !0;
    const i = a, o = St(e, t);
    if (t.peek().eType === ft) {
      Le(e, a, e.cur);
      const l = t.advance(), c = N(e, t);
      Oe(e, o, l, c, null, i);
    } else if (t.peek().eType === le) {
      Le(e, a, e.cur);
      const l = t.advance();
      Oe(e, o, null, 0, l, i);
    } else
      Le(e, a, e.cur);
    return !0;
  }
  if (n.eType === Dr)
    return t.advance(), e.cur.cw = !0, !0;
  if (n.eType === Wr)
    return t.advance(), e.cur.cw = !1, !0;
  if (n.eType === Lr)
    return t.advance(), e.cur.larrow = !0, e.cur.rarrow = !1, !0;
  if (n.eType === Rr)
    return t.advance(), e.cur.larrow = !1, e.cur.rarrow = !0, !0;
  if (n.eType === kr)
    return t.advance(), e.cur.larrow = !0, e.cur.rarrow = !0, !0;
  if (n.eType === Ir)
    return t.advance(), e.cur.sw = -1e-5, !0;
  if (n.eType === Mr)
    return t.advance(), e.cur.sw *= 1.5, !0;
  if (n.eType === Fr)
    return t.advance(), e.cur.sw *= 0.67, !0;
  if (n.eType === Gr)
    return t.advance(), e.cur.sw = z(e, "thickness", 9).val, e.cur.dotted = 0, e.cur.dashed = 0, !0;
  if (n.eType === nn) {
    const a = t.advance(), i = m(e, t);
    return yr(e, null, i, a), !0;
  }
  if (n.eType === rn)
    return t.advance(), Qo(e, t), !0;
  if (n.eType === Ur) {
    const a = t.advance();
    if (t.peek().eType === Fo) {
      t.advance();
      const i = Q(e, t);
      kn(e, i, a);
    } else
      kn(e, null, a);
    return !0;
  }
  if (n.eType === Ke) {
    const a = t.advance(), i = la(e, t);
    return xr(e, a, i), !0;
  }
  if (n.eType === Hr) {
    const a = t.advance();
    return Fe(e, null, a, 3), !0;
  }
  if (n.eType === $r) {
    t.advance();
    const a = Q(e, t);
    return a && oi(e, a), !0;
  }
  return !1;
}
function Qo(e, t) {
  let r;
  t.peek().eType === yt && t.advance(), r = Xe(e, t);
  const n = t.expect(nn, 'expected "at"'), a = m(e, t);
  yr(e, r, a, n);
}
function Zo(e, t) {
  t.peek().eType === ra && t.advance(), t.peek().eType === br && t.advance(), t.peek().eType === rn && t.advance();
}
function ln(e, t) {
  const r = N(e, t);
  return t.peek().eType === Eo ? (t.advance(), { rAbs: 0, rRel: r / 100 }) : { rAbs: r, rRel: 0 };
}
function St(e, t) {
  return un(t.peek()) && !ul(t.peek()) ? ln(e, t) : { rAbs: 0, rRel: 1 };
}
function cn(e, t) {
  if (t.peek().eType === ve) {
    const r = t.peekAhead(1);
    if (r.eType !== yt && r.eType !== rt && r.eType !== qr && r.eType !== Qr) {
      const n = t.advance();
      return it(e, n);
    }
  }
  return N(e, t);
}
function bo(e, t) {
  for (Jn(e, t); t.peek().eType === F; )
    t.advance(), e.zOut += " ", Jn(e, t);
  e.zOut += `<br>
`;
}
function Jn(e, t) {
  const r = t.peek();
  if (r.eType === Ke) {
    const a = t.advance();
    e.zOut += a.z.substring(1, a.n - 1);
    return;
  }
  if (r.eType === we || r.eType === Pe || r.eType === _t) {
    const a = t.advance(), i = z(e, a.z, a.n).val;
    e.zOut += P(i);
    return;
  }
  const n = cn(e, t);
  e.zOut += P(n);
}
function m(e, t) {
  if (e.nErr) return { x: 0, y: 0 };
  if (t.peek().eType === J) {
    const l = t.save(), c = e.nErr;
    t.advance();
    const u = m(e, t);
    if (e.nErr === 0 && t.peek().eType === F) {
      t.advance();
      const d = m(e, t);
      if (e.nErr === 0 && t.peek().eType === W)
        return t.advance(), { x: u.x, y: d.y };
    }
    if (e.nErr === 0 && t.peek().eType === W)
      return t.advance(), u;
    e.nErr = c, e.zOut = e.zOut, t.restore(l);
  }
  const r = t.save(), n = e.nErr, a = e.zOut, i = N(e, t);
  if (e.nErr) {
    e.nErr = n, e.zOut = a, t.restore(r);
    const l = Xn(e, t);
    if (t.peek().eType === ae || t.peek().eType === Je) {
      const c = t.advance().eType === ae ? 1 : -1;
      if (t.peek().eType === J) {
        t.advance();
        const u = N(e, t);
        t.expect(F, 'expected ","');
        const d = N(e, t);
        return t.expect(W, 'expected ")"'), { x: l.x + c * u, y: l.y + c * d };
      } else {
        const u = N(e, t);
        t.expect(F, 'expected ","');
        const d = N(e, t);
        return { x: l.x + c * u, y: l.y + c * d };
      }
    }
    return l;
  }
  if (t.peek().eType === F) {
    t.advance();
    const l = N(e, t);
    return { x: i, y: l };
  }
  if (t.peek().eType === Xr) {
    t.advance();
    const l = m(e, t);
    return { x: l.x, y: l.y + i };
  }
  if (t.peek().eType === Kr) {
    t.advance();
    const l = m(e, t);
    return { x: l.x, y: l.y - i };
  }
  if (t.peek().eType === xt) {
    t.advance(), t.match(H);
    const l = m(e, t);
    return { x: l.x - i, y: l.y };
  }
  if (t.peek().eType === Ct) {
    t.advance(), t.match(H);
    const l = m(e, t);
    return { x: l.x + i, y: l.y };
  }
  if (t.peek().eType === le) {
    const l = t.advance();
    t.match(H);
    const c = m(e, t);
    return Wn(i, l, c);
  }
  if (t.peek().eType === ft)
    if (t.advance(), t.peek().eType === le) {
      const l = t.advance();
      t.match(H);
      const c = m(e, t);
      return Wn(i, l, c);
    } else {
      const l = N(e, t);
      t.match(tn);
      const c = m(e, t);
      return zr(i, l, c);
    }
  if (sl(t.peek(), t)) {
    Oo(e, t);
    const l = m(e, t);
    t.expect(Mo, 'expected "and"');
    const c = m(e, t);
    return Dn(i, l, c);
  }
  if (t.peek().eType === No) {
    t.advance();
    const l = m(e, t);
    t.expect(F, 'expected ","');
    const c = m(e, t);
    return t.expect(mo, 'expected ">"'), Dn(i, l, c);
  }
  e.nErr = n, e.zOut = a, t.restore(r);
  const o = Xn(e, t);
  if (t.peek().eType === ae || t.peek().eType === Je) {
    const l = t.advance().eType === ae ? 1 : -1;
    if (t.peek().eType === J) {
      t.advance();
      const c = N(e, t);
      t.expect(F, 'expected ","');
      const u = N(e, t);
      return t.expect(W, 'expected ")"'), { x: o.x + l * c, y: o.y + l * u };
    } else {
      const c = N(e, t);
      t.expect(F, 'expected ","');
      const u = N(e, t);
      return { x: o.x + l * c, y: o.y + l * u };
    }
  }
  return o;
}
function Oo(e, t) {
  if (t.peek().eType === H) {
    t.advance(), t.match(ea), t.match(bt), t.expect(nt, 'expected "between"');
    return;
  }
  if (t.peek().eType === bt) {
    t.advance(), t.expect(nt, 'expected "between"');
    return;
  }
  if (t.peek().eType === nt) {
    t.advance();
    return;
  }
}
function Xn(e, t) {
  if (e.nErr) return { x: 0, y: 0 };
  if (al(t.peek()) && t.peekAhead(1).eType === H) {
    const n = Xe(e, t);
    t.advance();
    const a = Q(e, t);
    return Ce(e, a, n);
  }
  if (t.peek().eType === Ae) {
    const n = t.save(), a = t.advance();
    if (t.peek().eType === aa) {
      const i = t.advance();
      t.match(H);
      const o = Q(e, t);
      return a.eCode = pt(e, a), Er(e, a, i, o);
    }
    t.restore(n);
  }
  const r = Q(e, t);
  if (t.peek().eType === yt) {
    t.advance();
    const n = Xe(e, t);
    return Ce(e, r, n);
  }
  return Ce(e, r, null);
}
function Xe(e, t) {
  const r = t.peek();
  return r.eType === an || r.eType === le || r.eType === ta || r.eType === na || r.eType === jr || r.eType === Zr || r.eType === Ct || r.eType === xt ? t.advance() : (f(e, r, "expected edge name"), r);
}
function Q(e, t) {
  if (e.nErr) return null;
  const r = t.peek();
  if (r.eType === on)
    return t.advance(), e.cur;
  if (r.eType === ve) {
    const n = t.advance();
    let a = Rn(e, null, n);
    for (; e.nErr === 0 && t.peek().eType === Qr; ) {
      t.advance();
      const i = t.expect(ve, 'expected label after "."');
      a = Rn(e, a, i);
    }
    return a;
  }
  if (ll(t.peek())) {
    const n = po(e, t);
    if (t.peek().eType === H || t.peek().eType === $o) {
      t.advance();
      const a = Q(e, t);
      return Ln(e, a, n);
    }
    return Ln(e, null, n);
  }
  return f(e, r, "expected an object reference"), null;
}
function po(e, t) {
  const r = t.peek();
  if (r.eType === Ae) {
    const n = t.advance(), a = pt(e, n);
    if (t.peek().eType === Ee) {
      if (t.advance(), t.peek().eType === Ge) {
        const o = t.advance();
        return o.eCode = -a, o;
      }
      if (t.peek().eType === Be) {
        const o = t.advance();
        return t.expect(q, 'expected "]"'), o.eCode = -a, o;
      }
      const i = { ...n };
      return i.eType = Ee, i.eCode = -a, i;
    }
    if (t.peek().eType === Ge) {
      const i = t.advance();
      return i.eCode = a, i;
    }
    if (t.peek().eType === Be) {
      const i = t.advance();
      return t.expect(q, 'expected "]"'), i.eCode = a, i;
    }
    return f(e, t.peek(), "expected class name after ordinal"), n;
  }
  if (r.eType === Ee) {
    const n = t.advance();
    if (t.peek().eType === Ge) {
      const a = t.advance();
      return a.eCode = -1, a;
    }
    if (t.peek().eType === Be) {
      const a = t.advance();
      return t.expect(q, 'expected "]"'), a.eCode = -1, a;
    }
    return n.eCode = -1, n;
  }
  return f(e, r, 'expected ordinal or "last"'), r;
}
function N(e, t) {
  return jo(e, t);
}
function jo(e, t) {
  let r = Lt(e, t);
  for (; e.nErr === 0; )
    if (t.peek().eType === ae)
      t.advance(), r += Lt(e, t);
    else if (t.peek().eType === Je)
      t.advance(), r -= Lt(e, t);
    else
      break;
  return r;
}
function Lt(e, t) {
  let r = He(e, t);
  for (; e.nErr === 0; )
    if (t.peek().eType === Co)
      t.advance(), r *= He(e, t);
    else if (t.peek().eType === zo) {
      const n = t.advance(), a = He(e, t);
      a === 0 ? (f(e, n, "division by zero"), r = 0) : r /= a;
    } else
      break;
  return r;
}
function He(e, t) {
  return t.peek().eType === Je ? (t.advance(), -He(e, t)) : t.peek().eType === ae ? (t.advance(), He(e, t)) : el(e, t);
}
function el(e, t) {
  if (e.nErr) return 0;
  const r = t.peek();
  if (r.eType === Sr) {
    const n = t.advance();
    return Na(n);
  }
  if (r.eType === Ne) {
    const n = t.advance();
    return Cn(e, n);
  }
  if (r.eType === Or) {
    const n = t.advance();
    t.expect(J, 'expected "("');
    const a = N(e, t);
    return t.expect(W, 'expected ")"'), In(e, n, a, 0);
  }
  if (r.eType === pr) {
    const n = t.advance();
    t.expect(J, 'expected "("');
    const a = N(e, t);
    t.expect(F, 'expected ","');
    const i = N(e, t);
    return t.expect(W, 'expected ")"'), In(e, n, a, i);
  }
  if (r.eType === Yr) {
    t.advance(), t.expect(J, 'expected "("');
    const n = m(e, t);
    t.expect(F, 'expected ","');
    const a = m(e, t);
    return t.expect(W, 'expected ")"'), za(n, a);
  }
  if (r.eType === J) {
    t.advance();
    const n = t.peek();
    if ((n.eType === we || n.eType === Pe || n.eType === _t) && t.peekAhead(1).eType === W) {
      const i = t.advance();
      return t.advance(), Cn(e, i);
    }
    const a = N(e, t);
    return t.expect(W, 'expected ")"'), a;
  }
  if (r.eType === Ae && t.peekAhead(1).eType === aa) {
    const n = t.save(), a = e.nErr, i = e.zOut, o = t.advance(), l = t.advance();
    t.match(H);
    const c = Q(e, t);
    if (o.eCode = pt(e, o), e.nErr === 0 && c && t.peek().eType === rt) {
      t.advance();
      const u = Er(e, o, l, c);
      if (t.peek().eType === At)
        return t.advance(), u.x;
      if (t.peek().eType === gt)
        return t.advance(), u.y;
    }
    e.nErr = a, e.zOut = i, t.restore(n);
  }
  if (ol(r)) {
    const n = t.save(), a = e.nErr, i = e.zOut, o = Q(e, t);
    if (e.nErr === 0 && o) {
      if (t.peek().eType === rt) {
        if (t.advance(), t.peek().eType === At)
          return t.advance(), Ce(e, o, null).x;
        if (t.peek().eType === gt)
          return t.advance(), Ce(e, o, null).y;
      }
      if (t.peek().eType === yt) {
        const l = t.save();
        t.advance();
        const c = Xe(e, t);
        if (t.peek().eType === rt) {
          t.advance();
          const u = Ce(e, o, c);
          if (t.peek().eType === At)
            return t.advance(), u.x;
          if (t.peek().eType === gt)
            return t.advance(), u.y;
        }
        t.restore(l);
      }
      if (t.peek().eType === qr) {
        t.advance();
        const l = t.peek();
        return sn(l.eType) || l.eType === jt || l.eType === en || l.eType === we || l.eType === Pe ? (t.advance(), ui(o, l)) : (f(e, l, "unknown property"), 0);
      }
    }
    e.nErr = a, e.zOut = i, t.restore(n);
  }
  return f(e, r, "expected expression"), 0;
}
function $e(e) {
  return e === Vo || e === Ho || e === xt || e === Ct;
}
function tl(e) {
  return e === Ne || e === we || e === Pe || e === _t;
}
function nl(e) {
  return e.eType === Ge || e.eType === Ke || e.eType === Be;
}
function rl(e) {
  return e === an || e === go || e === So || e === Xr || e === Kr || e === Lo || e === Ro || e === ko || e === Do || e === Wo || e === Io;
}
function sn(e) {
  return e === vo || e === wo || e === Po || e === Ao || e === _t;
}
function al(e) {
  return e.eType === an || e.eType === le || e.eType === ta || e.eType === na || e.eType === jr || e.eType === Zr || e.eType === Ct || e.eType === xt;
}
function un(e) {
  return e.eType === Sr || e.eType === Ne || e.eType === J || e.eType === ae || e.eType === Je || e.eType === Or || e.eType === pr || e.eType === Yr || e.eType === ve || e.eType === Ae || e.eType === Ee || e.eType === on;
}
function il(e) {
  return sn(e.eType) || $e(e.eType) || e.eType === jt || e.eType === en || e.eType === we || e.eType === Pe || e.eType === Zt || e.eType === Jr || e.eType === Br || e.eType === tn || e.eType === Qt || e.eType === Vr || e.eType === nn || e.eType === rn || e.eType === Ur || e.eType === Hr || e.eType === $r || e.eType === Dr || e.eType === Wr || e.eType === Lr || e.eType === Rr || e.eType === kr || e.eType === Ir || e.eType === Mr || e.eType === Fr || e.eType === Gr || e.eType === Ke;
}
function ol(e) {
  return e.eType === on || e.eType === ve || e.eType === Ae || e.eType === Ee;
}
function ll(e) {
  return e.eType === Ae || e.eType === Ee;
}
function cl(e) {
  return e.eType === ra || e.eType === br;
}
function sl(e, t) {
  return e.eType === bt || e.eType === nt ? !0 : e.eType === H && t ? t.peekAhead(1).eType === ea : !1;
}
function ul(e) {
  return e.eType === ft || e.eType === le;
}
let Kn = !1;
function fl() {
  Kn || (Kn = !0, Aa((e, t) => {
    const r = va(e, t);
    return r ? { eType: r.eType, eCode: r.eCode, eEdge: r.eEdge } : null;
  }), ga((e, t) => ut({ z: e, n: t }) !== null), Qa(oo, lo, co, wr), Za(qt), hi((e, t) => z(e, t, t.length).val), _i(fo), yi(qt), xi(Fe));
}
function dl(e, t) {
  fl();
  const r = xa();
  r.sIn = { z: e, n: e.length, eType: 0, eCode: 0, eEdge: 0 }, r.eDir = Z, r.zClass = (t == null ? void 0 : t.cssClass) || null;
  let n = 0;
  t != null && t.darkMode && (n |= rr), t != null && t.plaintextErrors && (n |= We), r.mFlags = n;
  const a = Xo(r, e);
  return r.nErr === 0 && a && _o(r, a), !r.zOut && r.nErr === 0 && (r.zOut = `<!-- empty jspic diagram -->
`), {
    svg: r.zOut,
    width: r.nErr ? -1 : r.wSVG,
    height: r.nErr ? -1 : r.hSVG,
    isError: r.nErr > 0
  };
}
function hl(e) {
  if (typeof document > "u") return;
  const t = e || "code.jspic, pre > code.language-jspic";
  document.querySelectorAll(t).forEach((n) => {
    const a = n.textContent || "", i = dl(a), o = document.createElement("div");
    o.className = "jspic-container", o.innerHTML = i.svg;
    const l = n.parentElement;
    l && l.tagName === "PRE" ? l.replaceWith(o) : n.replaceWith(o);
  });
}
export {
  dl as jspic,
  dl as pikchr,
  hl as processCodeBlocks
};
//# sourceMappingURL=jspic.js.map
