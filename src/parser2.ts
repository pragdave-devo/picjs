// parser2.ts — New recursive descent parser producing AST
// Part of the DSL overhaul (Phase 1A)
//
// Produces AST nodes instead of eagerly evaluating. Desugars abbreviations
// to canonical form. Handles all existing PIC syntax plus new constructs.

import {
  type PNum, type PPoint, type PRel, type PToken, type PObj, type PList, type Pik,
  TokenType, makeToken,
  pikError, pikAtof,
} from './types.ts';

import { TokenStream } from './tokenizer.ts';
import { pikAddMacro } from './layout.ts';

import type {
  AstStmt, AstShape, AstLabel, AstLabelPosition, AstForRange, AstForIn, AstFnCall, AstCase,
  AstPrint, AstPrintItem, AstAssert, AstAssign, AstDefine, AstDirection, AstEmpty,
  AstAttr, AstAttrNumeric, AstAttrColor, AstAttrDash, AstAttrBool,
  AstAttrText, AstAttrPosition, AstAttrDirection, AstAttrWith, AstAttrSame,
  AstAttrBehind, AstAttrFit, AstAttrEvenWith, AstAttrFlag,
  AstRelExpr,
  AstExpr, AstExprNumber, AstExprVarRef, AstExprBinOp, AstExprUnaryOp,
  AstExprParen, AstExprFuncCall, AstExprDist, AstExprProperty, AstExprPlaceXY,
  AstExprColorName,
  AstPosition, AstPosAbsolute, AstPosPlace, AstPosRelative, AstPosBetween,
  AstPosDistDir, AstPosComposite, AstPosParen,
  AstPlace, AstObject, AstObjThis, AstObjNamed, AstObjNth,
} from './ast.ts';

const {
  T_ID, T_ASSIGN, T_PLACENAME, T_CLASSNAME, T_STRING, T_NUMBER, T_NTH, T_EOL,
  T_LP, T_RP, T_LB, T_RB, T_COMMA, T_COLON,
  T_PLUS, T_MINUS, T_STAR, T_SLASH, T_PERCENT,
  T_EQ, T_GT, T_LT,
  T_LARROW, T_RARROW, T_LRARROW,
  T_EDGEPT, T_OF, T_FILL, T_COLOR, T_THICKNESS,
  T_DOTTED, T_DASHED, T_CW, T_CCW, T_INVIS, T_THICK, T_THIN, T_SOLID,
  T_CHOP, T_FIT, T_BEHIND, T_SAME,
  T_FROM, T_TO, T_THEN, T_GO, T_CLOSE,
  T_AT, T_WITH, T_HEADING, T_HEIGHT, T_WIDTH, T_RADIUS, T_DIAMETER,
  T_ABOVE, T_BELOW, T_CENTER, T_LJUST, T_RJUST,
  T_ITALIC, T_BOLD, T_MONO, T_ALIGNED, T_BIG, T_SMALL,
  T_AND, T_AS, T_ASSERT, T_BETWEEN, T_DEFINE, T_DIST,
  T_DOT_E, T_DOT_L, T_DOT_U, T_DOT_XY,
  T_DOWN, T_END, T_EVEN,
  T_FUNC1, T_FUNC2, T_FUNC3, T_IN, T_LAST, T_LEFT, T_PRINT, T_RIGHT,
  T_START, T_THE, T_TOP, T_BOTTOM, T_UNTIL, T_UP, T_VERTEX,
  T_WAY, T_X, T_Y, T_THIS,
  T_CODEBLOCK,
  T_FOR, T_DO, T_STEP,
  T_YES, T_NO, T_NOT, T_OR,
  T_GE, T_LE, T_NE,
  T_FN, T_CASE, T_FATARROW,
} = TokenType;

// ============================================================
// Main entry point
// ============================================================

export function parseToAst(p: Pik, input: string): AstStmt[] {
  p.sIn = { z: input, n: input.length, eCode: 0, eType: 0, eEdge: 0 };
  const ts = new TokenStream(p);
  ts.tokenize(input);
  if (p.nErr) return [];
  return parseDocument(p, ts);
}

// ============================================================
// Document = statement list
// ============================================================

function parseDocument(p: Pik, ts: TokenStream): AstStmt[] {
  return parseStatementList(p, ts);
}

function parseStatementList(p: Pik, ts: TokenStream): AstStmt[] {
  const stmts: AstStmt[] = [];
  const s = parseStatement(p, ts);
  if (s) stmts.push(s);

  while (p.nErr === 0 && !ts.atEnd()) {
    if (ts.peek().eType === T_RB) break;
    if (!ts.match(T_EOL)) break;
    while (ts.match(T_EOL)) {}
    if (ts.atEnd() || ts.peek().eType === T_RB) break;
    const s2 = parseStatement(p, ts);
    if (s2) stmts.push(s2);
  }
  return stmts;
}

// ============================================================
// Statement
// ============================================================

function parseStatement(p: Pik, ts: TokenStream): AstStmt | null {
  if (p.nErr) return null;

  while (ts.peek().eType === T_EOL && !ts.atEnd()) ts.advance();

  let t = ts.peek();

  if (t.eType === T_EOL || ts.atEnd() || t.eType === T_RB) return null;

  // direction
  if (isDirection(t.eType)) {
    const dir = ts.advance();
    return { kind: "direction", dir: dir.eCode, tok: dir };
  }

  // assignment: lvalue ASSIGN rvalue_expr
  if (isLvalue(t.eType)) {
    const t2 = ts.peekAhead(1);
    if (t2.eType === T_ASSIGN) {
      const lv = ts.advance();
      const op = ts.advance();
      const rv = parseRvalueExpr(p, ts);
      return { kind: "assign", name: lv, op: op, value: rv };
    }
  }

  // reserved name check
  if (isReservedName(t.eType)) {
    const t2 = ts.peekAhead(1);
    if (t2.eType === T_ASSIGN) {
      const name = t.z.substring(0, t.n);
      pikError(p, t, `'${name}' is a reserved name`);
      return null;
    }
  }

  // PLACENAME COLON ...
  if (t.eType === T_PLACENAME) {
    const t2 = ts.peekAhead(1);
    if (t2.eType === T_COLON) {
      const label = ts.advance();
      ts.advance(); // colon

      if (isBasetypeStart(ts.peek())) {
        const shape = parseUnnamedStatement(p, ts);
        if (shape) {
          return { kind: "label", name: label, body: shape };
        }
        return null;
      } else {
        const pos = parsePosition(p, ts);
        return {
          kind: "label",
          name: label,
          body: { kind: "label_position", position: pos },
        };
      }
    }
  }

  // print
  if (t.eType === T_PRINT) {
    ts.advance();
    return parsePrintStmt(p, ts);
  }

  // assert
  if (t.eType === T_ASSERT) {
    ts.advance();
    return parseAssertStmt(p, ts);
  }

  // define
  if (t.eType === T_DEFINE) {
    ts.advance();
    const id = ts.expectRaw(T_ID, 'expected macro name');
    const code = ts.expect(T_CODEBLOCK, 'expected code block {...}');
    if (p.nErr) return null;
    // Register macro eagerly so it's available for subsequent token expansion
    pikAddMacro(p, id, code);
    return { kind: "define", name: id, body: code };
  }

  // for-loop
  if (t.eType === T_FOR) {
    ts.advance();
    return parseForStmt(p, ts);
  }

  // case statement
  if (t.eType === T_CASE) {
    return parseCaseStmt(p, ts);
  }

  // $name(args) function call statement
  if (t.eType === T_ID) {
    const name = t.z.substring(0, t.n);
    if (name[0] === '$' && ts.peekAhead(1).eType === T_LP) {
      return parseFnCallStmt(p, ts);
    }
  }

  // unnamed_statement (shape definition)
  return parseUnnamedStatement(p, ts);
}

// ============================================================
// Unnamed statement = basetype + attribute_list
// ============================================================

function parseUnnamedStatement(p: Pik, ts: TokenStream): AstShape | null {
  if (p.nErr) return null;

  // Skip leading EOLs
  while (ts.peek().eType === T_EOL && !ts.atEnd()) ts.advance();

  const t = ts.peek();
  let classTok: PToken | null = null;
  let textTok: PToken | null = null;
  let textPos = 0;
  let sublist: AstStmt[] | null = null;

  if (t.eType === T_CLASSNAME) {
    classTok = ts.advance();
  } else if (t.eType === T_STRING) {
    textTok = ts.advance();
    textPos = parseTextposition(p, ts);
  } else if (t.eType === T_LB) {
    ts.advance();
    sublist = parseStatementList(p, ts);
    ts.expect(T_RB, 'expected "]"');
    if (p.nErr) return null;
  } else {
    pikError(p, t, 'syntax error');
    return null;
  }

  // Parse leading relexpr if present (implicit direction distance)
  let leadingExpr: AstRelExpr | null = null;
  if (!ts.atStatementEnd() && isExprStart(ts.peek()) && !isAttributeStart(ts.peek())) {
    leadingExpr = parseRelExpr(p, ts);
  }

  // Parse attributes
  const attrs: AstAttr[] = [];
  while (p.nErr === 0 && !ts.atStatementEnd()) {
    const attr = parseAttribute(p, ts);
    if (!attr) break;
    attrs.push(attr);
  }

  return {
    kind: "shape",
    classTok,
    textTok,
    textPos,
    sublist,
    attrs,
    leadingExpr,
  };
}

// ============================================================
// Attribute parsing
// ============================================================

function parseAttribute(p: Pik, ts: TokenStream): AstAttr | null {
  if (p.nErr || ts.atStatementEnd()) return null;
  const t = ts.peek();

  // numeric property: HEIGHT|WIDTH|RADIUS|DIAMETER|THICKNESS relexpr
  if (isNumProperty(t.eType)) {
    const prop = ts.advance();
    const value = parseRelExpr(p, ts);
    return { attrKind: "numeric", prop, value };
  }

  // dash: DOTTED expr? | DASHED expr?
  if (t.eType === T_DOTTED || t.eType === T_DASHED) {
    const prop = ts.advance();
    let value: AstExpr | null = null;
    if (!ts.atStatementEnd() && isExprStart(ts.peek())) {
      value = parseExpr(p, ts);
    }
    return { attrKind: "dash", prop, value };
  }

  // color: FILL rvalue | COLOR rvalue
  if (t.eType === T_FILL || t.eType === T_COLOR) {
    const prop = ts.advance();
    const value = parseRvalueExpr(p, ts);
    return { attrKind: "color", prop, value };
  }

  // direction and "go"
  if (t.eType === T_GO || isDirection(t.eType)) {
    return parseDirectionAttr(p, ts);
  }

  // CLOSE
  if (t.eType === T_CLOSE) {
    const tok = ts.advance();
    return { attrKind: "position", variant: "close", tok, position: { posKind: "absolute", x: mkNumExpr(tok, 0), y: mkNumExpr(tok, 0) } };
  }

  // CHOP
  if (t.eType === T_CHOP) {
    const tok = ts.advance();
    return { attrKind: "flag", name: "chop", tok };
  }

  // FROM position
  if (t.eType === T_FROM) {
    const tok = ts.advance();
    const position = parsePosition(p, ts);
    return { attrKind: "position", variant: "from", tok, position };
  }

  // TO position
  if (t.eType === T_TO) {
    const tok = ts.advance();
    const position = parsePosition(p, ts);
    return { attrKind: "position", variant: "to", tok, position };
  }

  // THEN
  if (t.eType === T_THEN) {
    return parseThenAttr(p, ts);
  }

  // Boolean properties
  if (t.eType === T_CW) { const tok = ts.advance(); return { attrKind: "bool", prop: "cw", tok }; }
  if (t.eType === T_CCW) { const tok = ts.advance(); return { attrKind: "bool", prop: "ccw", tok }; }
  if (t.eType === T_LARROW) { const tok = ts.advance(); return { attrKind: "bool", prop: "larrow", tok }; }
  if (t.eType === T_RARROW) { const tok = ts.advance(); return { attrKind: "bool", prop: "rarrow", tok }; }
  if (t.eType === T_LRARROW) { const tok = ts.advance(); return { attrKind: "bool", prop: "lrarrow", tok }; }
  if (t.eType === T_INVIS) { const tok = ts.advance(); return { attrKind: "bool", prop: "invis", tok }; }
  if (t.eType === T_THICK) { const tok = ts.advance(); return { attrKind: "bool", prop: "thick", tok }; }
  if (t.eType === T_THIN) { const tok = ts.advance(); return { attrKind: "bool", prop: "thin", tok }; }
  if (t.eType === T_SOLID) { const tok = ts.advance(); return { attrKind: "bool", prop: "solid", tok }; }

  // AT position
  if (t.eType === T_AT) {
    const tok = ts.advance();
    const position = parsePosition(p, ts);
    return { attrKind: "position", variant: "at", tok, position };
  }

  // WITH clause
  if (t.eType === T_WITH) {
    ts.advance();
    return parseWithAttr(p, ts);
  }

  // SAME [AS object]
  if (t.eType === T_SAME) {
    const tok = ts.advance();
    let asObject: AstObject | null = null;
    if (ts.peek().eType === T_AS) {
      ts.advance();
      asObject = parseObject(p, ts);
    }
    return { attrKind: "same", tok, asObject };
  }

  // STRING textposition
  if (t.eType === T_STRING) {
    const tok = ts.advance();
    const posFlags = parseTextposition(p, ts);
    return { attrKind: "text", tok, posFlags };
  }

  // FIT
  if (t.eType === T_FIT) {
    const tok = ts.advance();
    return { attrKind: "fit", tok };
  }

  // BEHIND object
  if (t.eType === T_BEHIND) {
    ts.advance();
    const object = parseObject(p, ts);
    return { attrKind: "behind", object };
  }

  return null;
}

// ============================================================
// Direction attribute (go, bare direction)
// ============================================================

function parseDirectionAttr(p: Pik, ts: TokenStream): AstAttr | null {
  const t = ts.peek();
  const hasGo = t.eType === T_GO;
  if (hasGo) ts.advance();
  const t2 = ts.peek();

  if (isDirection(t2.eType)) {
    const dir = ts.advance();
    // Check for "even with"
    if (isEvenStart(ts.peek())) {
      parseEvenWith(p, ts);
      const position = parsePosition(p, ts);
      return { attrKind: "even_with", dirTok: dir, position };
    }
    // optrelexpr
    const value = parseOptRelExpr(p, ts);
    return {
      attrKind: "direction",
      dirTok: dir,
      hasGo,
      value,
      headingTok: null,
      headingExpr: null,
      edgeptTok: null,
    };
  }

  if (hasGo) {
    const errTok = t;
    const value = parseOptRelExpr(p, ts);
    if (ts.peek().eType === T_HEADING) {
      const hdg = ts.advance();
      const angle = parseExpr(p, ts);
      return {
        attrKind: "direction",
        dirTok: null,
        hasGo: true,
        value,
        headingTok: hdg,
        headingExpr: angle,
        edgeptTok: null,
      };
    } else if (ts.peek().eType === T_EDGEPT) {
      const edgept = ts.advance();
      return {
        attrKind: "direction",
        dirTok: null,
        hasGo: true,
        value,
        headingTok: null,
        headingExpr: null,
        edgeptTok: edgept,
      };
    } else {
      pikError(p, ts.peek(), 'expected direction after "go"');
      return null;
    }
  }

  return null;
}

// ============================================================
// THEN attribute
// ============================================================

function parseThenAttr(p: Pik, ts: TokenStream): AstAttr {
  const tok = ts.advance(); // consume THEN

  // THEN TO — emit "then" flag, TO will be parsed on next iteration
  if (ts.peek().eType === T_TO) {
    return { attrKind: "flag", name: "then", tok };
  }

  // THEN direction — emit "then" flag, direction handled next iteration
  if (isDirection(ts.peek().eType)) {
    return { attrKind: "flag", name: "then", tok };
  }

  // THEN optrelexpr HEADING expr / EDGEPT
  const value = parseOptRelExpr(p, ts);
  if (ts.peek().eType === T_HEADING) {
    const hdg = ts.advance();
    const angle = parseExpr(p, ts);
    // "then" + heading movement
    return {
      attrKind: "direction",
      dirTok: null,
      hasGo: false,
      value,
      headingTok: hdg,
      headingExpr: angle,
      edgeptTok: null,
    };
  }
  if (ts.peek().eType === T_EDGEPT) {
    const edgept = ts.advance();
    return {
      attrKind: "direction",
      dirTok: null,
      hasGo: false,
      value,
      headingTok: null,
      headingExpr: null,
      edgeptTok: edgept,
    };
  }

  // Bare "then"
  return { attrKind: "flag", name: "then", tok };
}

// ============================================================
// WITH clause
// ============================================================

function parseWithAttr(p: Pik, ts: TokenStream): AstAttrWith {
  let hasDotE = false;
  if (ts.peek().eType === T_DOT_E) {
    ts.advance();
    hasDotE = true;
  }
  const edge = parseEdge(p, ts);
  ts.expect(T_AT, 'expected "at"');
  const position = parsePosition(p, ts);
  return { attrKind: "with", edge, hasDotE, position };
}

// ============================================================
// Even with
// ============================================================

function parseEvenWith(p: Pik, ts: TokenStream): void {
  if (ts.peek().eType === T_UNTIL) ts.advance();
  if (ts.peek().eType === T_EVEN) ts.advance();
  if (ts.peek().eType === T_WITH) ts.advance();
}

// ============================================================
// Text position flags
// ============================================================

function parseTextposition(p: Pik, ts: TokenStream): number {
  let pos = 0;
  while (isTextAttr(ts.peek().eType)) {
    const flag = ts.advance();
    pos = computeTextPos(pos, flag);
  }
  return pos;
}

function computeTextPos(iPrev: number, pFlag: PToken): number {
  // Mirrors pikTextPosition from layout.ts
  const TP_LJUST  = 0x0001;
  const TP_RJUST  = 0x0002;
  const TP_JMASK  = 0x0003;
  const TP_ABOVE  = 0x0008;
  const TP_CENTER = 0x0010;
  const TP_BELOW  = 0x0020;
  const TP_VMASK  = 0x007c;
  const TP_BIG    = 0x0100;
  const TP_SMALL  = 0x0200;
  const TP_XTRA   = 0x0400;
  const TP_SZMASK = 0x0700;
  const TP_ITALIC = 0x1000;
  const TP_BOLD   = 0x2000;
  const TP_MONO   = 0x4000;
  const TP_ALIGN  = 0x8000;

  let iRes = iPrev;
  switch (pFlag.eType) {
    case T_LJUST:   iRes = (iRes & ~TP_JMASK) | TP_LJUST;  break;
    case T_RJUST:   iRes = (iRes & ~TP_JMASK) | TP_RJUST;  break;
    case T_ABOVE:   iRes = (iRes & ~TP_VMASK) | TP_ABOVE;  break;
    case T_CENTER:  iRes = (iRes & ~TP_VMASK) | TP_CENTER; break;
    case T_BELOW:   iRes = (iRes & ~TP_VMASK) | TP_BELOW;  break;
    case T_ITALIC:  iRes |= TP_ITALIC;                     break;
    case T_BOLD:    iRes |= TP_BOLD;                       break;
    case T_MONO:    iRes |= TP_MONO;                       break;
    case T_ALIGNED: iRes |= TP_ALIGN;                      break;
    case T_BIG:
      if (iRes & TP_BIG) iRes |= TP_XTRA;
      else iRes = (iRes & ~TP_SZMASK) | TP_BIG;
      break;
    case T_SMALL:
      if (iRes & TP_SMALL) iRes |= TP_XTRA;
      else iRes = (iRes & ~TP_SZMASK) | TP_SMALL;
      break;
  }
  return iRes;
}

// ============================================================
// Relative expression
// ============================================================

function parseRelExpr(p: Pik, ts: TokenStream): AstRelExpr {
  const expr = parseExpr(p, ts);
  if (ts.peek().eType === T_PERCENT) {
    ts.advance();
    return { expr, isPercent: true };
  }
  return { expr, isPercent: false };
}

function parseOptRelExpr(p: Pik, ts: TokenStream): AstRelExpr | null {
  if (isExprStart(ts.peek()) && !isPostRelexprKeyword(ts.peek())) {
    return parseRelExpr(p, ts);
  }
  return null; // signals "use default" (rRel=1.0)
}

// ============================================================
// Rvalue expression (handles color names)
// ============================================================

function parseRvalueExpr(p: Pik, ts: TokenStream): AstExpr {
  if (ts.peek().eType === T_PLACENAME) {
    const t2 = ts.peekAhead(1);
    if (t2.eType !== T_DOT_E && t2.eType !== T_DOT_XY &&
        t2.eType !== T_DOT_L && t2.eType !== T_DOT_U) {
      const clr = ts.advance();
      return { exprKind: "colorName", tok: clr };
    }
  }
  return parseExpr(p, ts);
}

// ============================================================
// Print statement
// ============================================================

function parsePrintStmt(p: Pik, ts: TokenStream): AstPrint {
  const items: AstPrintItem[] = [];
  items.push(parsePrintItem(p, ts));
  while (ts.peek().eType === T_COMMA) {
    ts.advance();
    items.push(parsePrintItem(p, ts));
  }
  return { kind: "print", items };
}

function parsePrintItem(p: Pik, ts: TokenStream): AstPrintItem {
  const t = ts.peek();
  if (t.eType === T_STRING) {
    const tok = ts.advance();
    return { tag: "string", tok };
  }
  if (t.eType === T_FILL || t.eType === T_COLOR || t.eType === T_THICKNESS) {
    const tok = ts.advance();
    return { tag: "property", tok };
  }
  const expr = parseRvalueExpr(p, ts);
  return { tag: "expr", expr };
}

// ============================================================
// Assert statement
// ============================================================

function parseAssertStmt(p: Pik, ts: TokenStream): AstAssert | null {
  ts.expect(T_LP, 'expected "(" after "assert"');
  if (p.nErr) return null;

  // Try expression first (may include ==, >, < etc as comparison operators)
  const saved = ts.save();
  const savedErr = p.nErr;
  const savedOut = p.zOut;

  const expr = parseExpr(p, ts);
  if (p.nErr === 0 && ts.peek().eType === T_RP) {
    ts.advance(); // consume )
    // If top-level is == comparison, decompose for backward-compatible pikAssert
    if (expr.exprKind === "compare" && expr.op === "==") {
      return { kind: "assert", variant: "expr", left: expr.left, right: expr.right, eqTok: expr.tok };
    }
    // General boolean assert (truthy check)
    return { kind: "assert", variant: "bool", left: expr, right: null as any, eqTok: expr.exprKind === "compare" ? (expr as any).tok : makeToken() };
  }

  // Fall back to position == position
  p.nErr = savedErr;
  p.zOut = savedOut;
  ts.restore(saved);

  const pos1 = parsePosition(p, ts);
  if (p.nErr) return null;
  const eqTok = ts.expect(T_EQ, 'expected "=="');
  const pos2 = parsePosition(p, ts);
  ts.expect(T_RP, 'expected ")"');
  return { kind: "assert", variant: "position", left: pos1, right: pos2, eqTok };
}

// ============================================================
// For-loop statement
// ============================================================

function parseForStmt(p: Pik, ts: TokenStream): AstForRange | AstForIn | null {
  const varTok = ts.expect(T_ID, 'expected variable name after "for"');
  if (p.nErr) return null;

  const t = ts.peek();
  if (t.eType === T_IN) {
    ts.advance();
    return parseForInStmt(p, ts, varTok);
  } else if (t.eType === T_FROM) {
    ts.advance();
    return parseForRangeStmt(p, ts, varTok);
  } else {
    pikError(p, t, 'expected "in" or "from" after variable name');
    return null;
  }
}

function parseForInStmt(p: Pik, ts: TokenStream, varTok: PToken): AstForIn | null {
  ts.expect(T_LB, 'expected "[" after "in"');
  if (p.nErr) return null;

  const list: AstExpr[] = [];
  let first = true;
  while (p.nErr === 0) {
    if (ts.peek().eType === T_RB) { ts.advance(); break; }
    if (!first) {
      ts.expect(T_COMMA, 'expected "," or "]"');
      if (p.nErr) return null;
    }
    first = false;
    list.push(parseExpr(p, ts));
    if (p.nErr) return null;
  }

  ts.expect(T_DO, 'expected "do" after list');
  if (p.nErr) return null;

  const bodyTok = ts.expect(T_CODEBLOCK, 'expected "{" for loop body');
  if (p.nErr) return null;

  // Parse the body text into AST statements
  const bodyText = bodyTok.z.substring(1, bodyTok.n - 1);
  const body = parseBodyText(p, bodyText);

  return { kind: "for_in", varTok, list, body, bodyTok };
}

function parseForRangeStmt(p: Pik, ts: TokenStream, varTok: PToken): AstForRange | null {
  const start = parseExpr(p, ts);
  if (p.nErr) return null;

  ts.expect(T_TO, 'expected "to" after start value');
  if (p.nErr) return null;

  const end = parseExpr(p, ts);
  if (p.nErr) return null;

  let step: AstExpr | null = null;
  if (ts.peek().eType === T_STEP) {
    ts.advance();
    step = parseExpr(p, ts);
    if (p.nErr) return null;
  }

  ts.expect(T_DO, 'expected "do" after range specification');
  if (p.nErr) return null;

  const bodyTok = ts.expect(T_CODEBLOCK, 'expected "{" for loop body');
  if (p.nErr) return null;

  const bodyText = bodyTok.z.substring(1, bodyTok.n - 1);
  const body = parseBodyText(p, bodyText);

  return { kind: "for_range", varTok, start, end, step, body, bodyTok };
}

function parseBodyText(p: Pik, bodyText: string): AstStmt[] {
  const bodyStream = new TokenStream(p);
  bodyStream.tokenize(bodyText);
  if (p.nErr) return [];
  return parseStatementList(p, bodyStream);
}

// ============================================================
// Case statement: case expr { pattern => { body } ... }
// ============================================================

function parseCaseStmt(p: Pik, ts: TokenStream): AstCase | null {
  const tok = ts.advance(); // consume T_CASE
  const expr = parseExpr(p, ts);
  if (p.nErr) return null;

  const outerTok = ts.expect(T_CODEBLOCK, 'expected "{" after case expression');
  if (p.nErr) return null;

  // Parse the inside of the codeblock to get arms
  const innerText = outerTok.z.substring(1, outerTok.n - 1);
  const innerStream = new TokenStream(p);
  innerStream.tokenize(innerText);
  if (p.nErr) return null;

  const arms: { pattern: AstExpr; body: AstStmt[] }[] = [];
  while (p.nErr === 0 && !innerStream.atEnd()) {
    // Skip newlines between arms
    while (!innerStream.atEnd() && innerStream.peek().eType === T_EOL) innerStream.advance();
    if (innerStream.atEnd()) break;

    const pattern = parseExpr(p, innerStream);
    if (p.nErr) return null;

    innerStream.expect(T_FATARROW, 'expected "=>" after case pattern');
    if (p.nErr) return null;

    const bodyTok = innerStream.expect(T_CODEBLOCK, 'expected "{" for case arm body');
    if (p.nErr) return null;

    const bodyText = bodyTok.z.substring(1, bodyTok.n - 1);
    const body = parseBodyText(p, bodyText);

    arms.push({ pattern, body });
  }

  return { kind: "case", expr, arms, tok };
}

// ============================================================
// Function call statement: $name(args)
// ============================================================

function parseFnCallStmt(p: Pik, ts: TokenStream): AstFnCall | null {
  const id = ts.advance(); // consume $name
  ts.advance(); // consume LP
  const args: AstExpr[] = [];
  if (ts.peek().eType !== T_RP) {
    args.push(parseExpr(p, ts));
    while (p.nErr === 0 && ts.peek().eType === T_COMMA) {
      ts.advance();
      args.push(parseExpr(p, ts));
    }
  }
  ts.expect(T_RP, 'expected ")"');
  return { kind: "fncall", func: { exprKind: "varRef", tok: id }, args, tok: id };
}

// ============================================================
// Position
// ============================================================

function parsePosition(p: Pik, ts: TokenStream): AstPosition {
  if (p.nErr) return { posKind: "absolute", x: mkNumExpr(makeToken(), 0), y: mkNumExpr(makeToken(), 0) };

  // '(' position [',' position] ')'
  if (ts.peek().eType === T_LP) {
    const saved = ts.save();
    const nErrSaved = p.nErr;
    const savedOut = p.zOut;
    ts.advance();
    const inner = parsePosition(p, ts);
    if (p.nErr === 0 && ts.peek().eType === T_COMMA) {
      ts.advance();
      const inner2 = parsePosition(p, ts);
      if (p.nErr === 0 && ts.peek().eType === T_RP) {
        ts.advance();
        return { posKind: "composite", xFrom: inner, yFrom: inner2 };
      }
    }
    if (p.nErr === 0 && ts.peek().eType === T_RP) {
      ts.advance();
      return { posKind: "paren", inner };
    }
    // Failed — backtrack
    p.nErr = nErrSaved;
    p.zOut = savedOut;
    ts.restore(saved);
  }

  // Try expr first (noBracketCompare: < and > are between-brackets here)
  const saved = ts.save();
  const savedErr = p.nErr;
  const savedOut = p.zOut;
  const val = parseExpr(p, ts, true);

  if (p.nErr) {
    // expr failed, try place
    p.nErr = savedErr;
    p.zOut = savedOut;
    ts.restore(saved);
    return parsePlacePosition(p, ts);
  }

  // expr COMMA expr -> absolute
  if (ts.peek().eType === T_COMMA) {
    ts.advance();
    const y = parseExpr(p, ts);
    return { posKind: "absolute", x: val, y };
  }

  // Distance + direction
  if (ts.peek().eType === T_ABOVE) {
    ts.advance();
    const of = parsePosition(p, ts);
    return { posKind: "distDir", distance: val, direction: "above", headingExpr: null, edgeptTok: null, of };
  }
  if (ts.peek().eType === T_BELOW) {
    ts.advance();
    const of = parsePosition(p, ts);
    return { posKind: "distDir", distance: val, direction: "below", headingExpr: null, edgeptTok: null, of };
  }
  if (ts.peek().eType === T_LEFT) {
    ts.advance();
    ts.match(T_OF);
    const of = parsePosition(p, ts);
    return { posKind: "distDir", distance: val, direction: "left", headingExpr: null, edgeptTok: null, of };
  }
  if (ts.peek().eType === T_RIGHT) {
    ts.advance();
    ts.match(T_OF);
    const of = parsePosition(p, ts);
    return { posKind: "distDir", distance: val, direction: "right", headingExpr: null, edgeptTok: null, of };
  }

  // EDGEPT
  if (ts.peek().eType === T_EDGEPT) {
    const edgept = ts.advance();
    ts.match(T_OF);
    const of = parsePosition(p, ts);
    return { posKind: "distDir", distance: val, direction: "edgept", headingExpr: null, edgeptTok: edgept, of };
  }

  // HEADING
  if (ts.peek().eType === T_HEADING) {
    ts.advance();
    if (ts.peek().eType === T_EDGEPT) {
      const edgept = ts.advance();
      ts.match(T_OF);
      const of = parsePosition(p, ts);
      return { posKind: "distDir", distance: val, direction: "edgept", headingExpr: null, edgeptTok: edgept, of };
    } else {
      const angle = parseExpr(p, ts);
      ts.match(T_FROM);
      const of = parsePosition(p, ts);
      return { posKind: "distDir", distance: val, direction: "heading", headingExpr: angle, edgeptTok: null, of };
    }
  }

  // between
  if (isBetweenStart(ts.peek(), ts)) {
    parseBetween(p, ts);
    const p1 = parsePosition(p, ts);
    ts.expect(T_AND, 'expected "and"');
    const p2 = parsePosition(p, ts);
    return { posKind: "between", fraction: val, p1, p2 };
  }

  // < position , position >
  if (ts.peek().eType === T_LT) {
    ts.advance();
    const p1 = parsePosition(p, ts);
    ts.expect(T_COMMA, 'expected ","');
    const p2 = parsePosition(p, ts);
    ts.expect(T_GT, 'expected ">"');
    return { posKind: "between", fraction: val, p1, p2 };
  }

  // Backtrack and try place
  p.nErr = savedErr;
  p.zOut = savedOut;
  ts.restore(saved);
  return parsePlacePosition(p, ts);
}

function parsePlacePosition(p: Pik, ts: TokenStream): AstPosition {
  const place = parsePlace(p, ts);
  const pos: AstPosPlace = { posKind: "place", place };

  // place (+|-) ...
  if (ts.peek().eType === T_PLUS || ts.peek().eType === T_MINUS) {
    const sign: 1 | -1 = ts.advance().eType === T_PLUS ? 1 : -1;
    if (ts.peek().eType === T_LP) {
      ts.advance();
      const dx = parseExpr(p, ts);
      ts.expect(T_COMMA, 'expected ","');
      const dy = parseExpr(p, ts);
      ts.expect(T_RP, 'expected ")"');
      return { posKind: "relative", base: pos, sign, dx, dy, paren: true };
    } else {
      const dx = parseExpr(p, ts);
      ts.expect(T_COMMA, 'expected ","');
      const dy = parseExpr(p, ts);
      return { posKind: "relative", base: pos, sign, dx, dy, paren: false };
    }
  }

  return pos;
}

// ============================================================
// Between syntax
// ============================================================

function parseBetween(p: Pik, ts: TokenStream): void {
  if (ts.peek().eType === T_OF) {
    ts.advance();
    ts.match(T_THE);
    ts.match(T_WAY);
    ts.expect(T_BETWEEN, 'expected "between"');
    return;
  }
  if (ts.peek().eType === T_WAY) {
    ts.advance();
    ts.expect(T_BETWEEN, 'expected "between"');
    return;
  }
  if (ts.peek().eType === T_BETWEEN) {
    ts.advance();
    return;
  }
}

// ============================================================
// Place = object [.edge]
// ============================================================

function parsePlace(p: Pik, ts: TokenStream): AstPlace {
  if (p.nErr) return { object: { objKind: "this", tok: makeToken() }, edge: null, hasDotE: false };

  // edge OF object
  if (isEdge(ts.peek()) && ts.peekAhead(1).eType === T_OF) {
    const edge = parseEdge(p, ts);
    ts.advance(); // OF
    const object = parseObject(p, ts);
    return { object, edge, hasDotE: false };
  }

  // NTH VERTEX OF object
  if (ts.peek().eType === T_NTH) {
    const saved = ts.save();
    const nth = ts.advance();
    if (ts.peek().eType === T_VERTEX) {
      const vertex = ts.advance();
      ts.match(T_OF);
      const object = parseObject(p, ts);
      // Store vertex info in the nth token
      nth.eCode = parseNthValue(nth);
      return { object, edge: vertex, hasDotE: false };
    }
    ts.restore(saved);
  }

  // object [.edge]
  const object = parseObject(p, ts);
  if (ts.peek().eType === T_DOT_E) {
    ts.advance();
    const edge = parseEdge(p, ts);
    return { object, edge, hasDotE: true };
  }
  return { object, edge: null, hasDotE: false };
}

// ============================================================
// Edge
// ============================================================

function parseEdge(p: Pik, ts: TokenStream): PToken | null {
  const t = ts.peek();
  if (t.eType === T_CENTER || t.eType === T_EDGEPT ||
      t.eType === T_TOP || t.eType === T_BOTTOM ||
      t.eType === T_START || t.eType === T_END ||
      t.eType === T_RIGHT || t.eType === T_LEFT) {
    return ts.advance();
  }
  pikError(p, t, 'expected edge name');
  return null;
}

// ============================================================
// Object reference
// ============================================================

function parseObject(p: Pik, ts: TokenStream): AstObject {
  if (p.nErr) return { objKind: "this", tok: makeToken() };
  const t = ts.peek();

  // THIS
  if (t.eType === T_THIS) {
    const tok = ts.advance();
    return { objKind: "this", tok };
  }

  // PLACENAME [.PLACENAME]*
  if (t.eType === T_PLACENAME) {
    const names: PToken[] = [];
    names.push(ts.advance());
    while (p.nErr === 0 && ts.peek().eType === T_DOT_U) {
      ts.advance();
      const sub = ts.expect(T_PLACENAME, 'expected label after "."');
      names.push(sub);
    }
    return { objKind: "named", names };
  }

  // nth
  if (isNthStart(ts.peek())) {
    return parseNthObject(p, ts);
  }

  pikError(p, t, 'expected an object reference');
  return { objKind: "this", tok: t };
}

function parseNthObject(p: Pik, ts: TokenStream): AstObject {
  const t = ts.peek();

  if (t.eType === T_NTH) {
    const nth = ts.advance();
    const n = parseNthValue(nth);

    if (ts.peek().eType === T_LAST) {
      ts.advance();
      if (ts.peek().eType === T_CLASSNAME) {
        const cls = ts.advance();
        cls.eCode = -n;
        return { objKind: "nth", nth, classTok: cls, inObject: parseOptionalInOf(p, ts) };
      }
      if (ts.peek().eType === T_LB) {
        const lb = ts.advance();
        ts.expect(T_RB, 'expected "]"');
        lb.eCode = -n;
        return { objKind: "nth", nth, classTok: lb, inObject: parseOptionalInOf(p, ts) };
      }
      const tok = { ...nth };
      tok.eType = T_LAST;
      tok.eCode = -n;
      return { objKind: "nth", nth, classTok: tok, inObject: parseOptionalInOf(p, ts) };
    }

    if (ts.peek().eType === T_CLASSNAME) {
      const cls = ts.advance();
      cls.eCode = n;
      return { objKind: "nth", nth, classTok: cls, inObject: parseOptionalInOf(p, ts) };
    }

    if (ts.peek().eType === T_LB) {
      const lb = ts.advance();
      ts.expect(T_RB, 'expected "]"');
      lb.eCode = n;
      return { objKind: "nth", nth, classTok: lb, inObject: parseOptionalInOf(p, ts) };
    }

    pikError(p, ts.peek(), 'expected class name after ordinal');
    return { objKind: "this", tok: nth };
  }

  if (t.eType === T_LAST) {
    const last = ts.advance();
    if (ts.peek().eType === T_CLASSNAME) {
      const cls = ts.advance();
      cls.eCode = -1;
      return { objKind: "nth", nth: last, classTok: cls, inObject: parseOptionalInOf(p, ts) };
    }
    if (ts.peek().eType === T_LB) {
      const lb = ts.advance();
      ts.expect(T_RB, 'expected "]"');
      lb.eCode = -1;
      return { objKind: "nth", nth: last, classTok: lb, inObject: parseOptionalInOf(p, ts) };
    }
    last.eCode = -1;
    return { objKind: "nth", nth: last, classTok: last, inObject: parseOptionalInOf(p, ts) };
  }

  pikError(p, t, 'expected ordinal or "last"');
  return { objKind: "this", tok: t };
}

function parseOptionalInOf(p: Pik, ts: TokenStream): AstObject | null {
  if (ts.peek().eType === T_OF || ts.peek().eType === T_IN) {
    ts.advance();
    return parseObject(p, ts);
  }
  return null;
}

function parseNthValue(pNth: PToken): number {
  let i = parseInt(pNth.z, 10);
  if (isNaN(i)) i = 0;
  if (i === 0 && pNth.z.substring(0, pNth.n) === 'first') i = 1;
  return i;
}

// ============================================================
// Expression parsing
// ============================================================

// noBracketCompare: when true, < and > are NOT comparison operators
// (used in position context where they serve as between-brackets)
function parseExpr(p: Pik, ts: TokenStream, noBracketCompare = false): AstExpr {
  return parseOrExpr(p, ts, noBracketCompare);
}

function parseOrExpr(p: Pik, ts: TokenStream, nbc: boolean): AstExpr {
  let left = parseAndExpr(p, ts, nbc);
  while (p.nErr === 0 && ts.peek().eType === T_OR) {
    const tok = ts.advance();
    const right = parseAndExpr(p, ts, nbc);
    left = { exprKind: "logical", op: "or", left, right, tok };
  }
  return left;
}

function parseAndExpr(p: Pik, ts: TokenStream, nbc: boolean): AstExpr {
  let left = parseNotExpr(p, ts, nbc);
  while (p.nErr === 0 && ts.peek().eType === T_AND) {
    const tok = ts.advance();
    const right = parseNotExpr(p, ts, nbc);
    left = { exprKind: "logical", op: "and", left, right, tok };
  }
  return left;
}

function parseNotExpr(p: Pik, ts: TokenStream, nbc: boolean): AstExpr {
  if (ts.peek().eType === T_NOT) {
    const tok = ts.advance();
    const operand = parseNotExpr(p, ts, nbc);
    return { exprKind: "logical", op: "not", left: operand, right: null, tok };
  }
  return parseCompareExpr(p, ts, nbc);
}

function parseCompareExpr(p: Pik, ts: TokenStream, nbc: boolean): AstExpr {
  const left = parseAddExpr(p, ts);
  const t = ts.peek();
  // ==, !=, >=, <= are always comparison operators
  if (t.eType === T_EQ || t.eType === T_NE ||
      t.eType === T_GE || t.eType === T_LE) {
    const tok = ts.advance();
    const right = parseAddExpr(p, ts);
    const op = tok.eType === T_EQ ? "==" :
               tok.eType === T_NE ? "!=" :
               tok.eType === T_GE ? ">=" : "<=";
    return { exprKind: "compare", op: op as any, left, right, tok };
  }
  // < and > are comparisons only when NOT in position context
  // (in position context they are between-brackets: n<p1,p2>)
  if (!nbc && (t.eType === T_GT || t.eType === T_LT)) {
    const tok = ts.advance();
    const right = parseAddExpr(p, ts);
    const op = tok.eType === T_GT ? ">" : "<";
    return { exprKind: "compare", op: op as any, left, right, tok };
  }
  return left;
}

function parseAddExpr(p: Pik, ts: TokenStream): AstExpr {
  let left = parseMulExpr(p, ts);
  while (p.nErr === 0) {
    const t = ts.peek();
    if (t.eType === T_PLUS) {
      const tok = ts.advance();
      const right = parseMulExpr(p, ts);
      left = { exprKind: "binOp", op: "+", left, right, tok };
    } else if (t.eType === T_MINUS) {
      const tok = ts.advance();
      const right = parseMulExpr(p, ts);
      left = { exprKind: "binOp", op: "-", left, right, tok };
    } else {
      break;
    }
  }
  return left;
}

function parseMulExpr(p: Pik, ts: TokenStream): AstExpr {
  let left = parseUnaryExpr(p, ts);
  while (p.nErr === 0) {
    const t = ts.peek();
    if (t.eType === T_STAR) {
      const tok = ts.advance();
      const right = parseUnaryExpr(p, ts);
      left = { exprKind: "binOp", op: "*", left, right, tok };
    } else if (t.eType === T_SLASH) {
      const tok = ts.advance();
      const right = parseUnaryExpr(p, ts);
      left = { exprKind: "binOp", op: "/", left, right, tok };
    } else {
      break;
    }
  }
  return left;
}

function parseUnaryExpr(p: Pik, ts: TokenStream): AstExpr {
  if (ts.peek().eType === T_MINUS) {
    const tok = ts.advance();
    const operand = parseUnaryExpr(p, ts);
    return { exprKind: "unaryOp", op: "-", operand, tok };
  }
  if (ts.peek().eType === T_PLUS) {
    const tok = ts.advance();
    const operand = parseUnaryExpr(p, ts);
    return { exprKind: "unaryOp", op: "+", operand, tok };
  }
  return parsePrimary(p, ts);
}

function parsePrimary(p: Pik, ts: TokenStream): AstExpr {
  if (p.nErr) return mkNumExpr(makeToken(), 0);
  const t = ts.peek();

  // YES / NO (boolean literals)
  if (t.eType === T_YES) {
    const tok = ts.advance();
    return { exprKind: "boolean", tok, value: true };
  }
  if (t.eType === T_NO) {
    const tok = ts.advance();
    return { exprKind: "boolean", tok, value: false };
  }

  // STRING literal (in expression context for function args, $-variables, etc.)
  if (t.eType === T_STRING) {
    const tok = ts.advance();
    return { exprKind: "string", tok, value: tok.z.substring(1, tok.n - 1) };
  }

  // List literal [expr, expr, ...]
  if (t.eType === T_LB) {
    const tok = ts.advance();
    const items: AstExpr[] = [];
    if (ts.peek().eType !== T_RB) {
      items.push(parseExpr(p, ts));
      while (p.nErr === 0 && ts.peek().eType === T_COMMA) {
        ts.advance();
        if (ts.peek().eType === T_RB) break; // trailing comma
        items.push(parseExpr(p, ts));
      }
    }
    ts.expect(T_RB, 'expected "]"');
    return { exprKind: "list", items, tok };
  }

  // NUMBER
  if (t.eType === T_NUMBER) {
    const num = ts.advance();
    return { exprKind: "number", tok: num, value: pikAtof(num) };
  }

  // fn(params) { body } — function expression
  if (t.eType === T_FN) {
    const tok = ts.advance();
    ts.expect(T_LP, 'expected "(" after "fn"');
    const params: PToken[] = [];
    if (ts.peek().eType !== T_RP) {
      params.push(ts.expect(T_ID, 'expected parameter name'));
      while (p.nErr === 0 && ts.peek().eType === T_COMMA) {
        ts.advance();
        params.push(ts.expect(T_ID, 'expected parameter name'));
      }
    }
    ts.expect(T_RP, 'expected ")"');
    const bodyTok = ts.expect(T_CODEBLOCK, 'expected "{" for function body');
    if (p.nErr) return mkNumExpr(makeToken(), 0);
    const bodyText = bodyTok.z.substring(1, bodyTok.n - 1);
    const body = parseBodyText(p, bodyText);
    return { exprKind: "fn", params, body, tok };
  }

  // ID (variable or $name function call)
  if (t.eType === T_ID) {
    const id = ts.advance();
    const name = id.z.substring(0, id.n);
    // $name(args) is a function call in expression context
    if (name[0] === '$' && ts.peek().eType === T_LP) {
      ts.advance(); // consume LP
      const args: AstExpr[] = [];
      if (ts.peek().eType !== T_RP) {
        args.push(parseExpr(p, ts));
        while (p.nErr === 0 && ts.peek().eType === T_COMMA) {
          ts.advance();
          args.push(parseExpr(p, ts));
        }
      }
      ts.expect(T_RP, 'expected ")"');
      return { exprKind: "userCall", func: { exprKind: "varRef", tok: id }, args, tok: id };
    }
    return { exprKind: "varRef", tok: id };
  }

  // FUNC1
  if (t.eType === T_FUNC1) {
    const fn = ts.advance();
    ts.expect(T_LP, 'expected "("');
    const x = parseExpr(p, ts);
    ts.expect(T_RP, 'expected ")"');
    return { exprKind: "funcCall", func: fn, args: [x] };
  }

  // FUNC2
  if (t.eType === T_FUNC2) {
    const fn = ts.advance();
    ts.expect(T_LP, 'expected "("');
    const x = parseExpr(p, ts);
    ts.expect(T_COMMA, 'expected ","');
    const y = parseExpr(p, ts);
    ts.expect(T_RP, 'expected ")"');
    return { exprKind: "funcCall", func: fn, args: [x, y] };
  }

  // FUNC3
  if (t.eType === T_FUNC3) {
    const fn = ts.advance();
    ts.expect(T_LP, 'expected "("');
    const x = parseExpr(p, ts);
    ts.expect(T_COMMA, 'expected ","');
    const y = parseExpr(p, ts);
    ts.expect(T_COMMA, 'expected ","');
    const z = parseExpr(p, ts);
    ts.expect(T_RP, 'expected ")"');
    return { exprKind: "funcCall", func: fn, args: [x, y, z] };
  }

  // DIST
  if (t.eType === T_DIST) {
    const tok = ts.advance();
    ts.expect(T_LP, 'expected "("');
    const p1 = parsePosition(p, ts);
    ts.expect(T_COMMA, 'expected ","');
    const p2 = parsePosition(p, ts);
    ts.expect(T_RP, 'expected ")"');
    return { exprKind: "dist", p1, p2, tok };
  }

  // LP expr RP or LP FILL|COLOR|THICKNESS RP
  if (t.eType === T_LP) {
    ts.advance();
    const inner = ts.peek();
    if ((inner.eType === T_FILL || inner.eType === T_COLOR || inner.eType === T_THICKNESS) &&
        ts.peekAhead(1).eType === T_RP) {
      const varTok = ts.advance();
      ts.advance(); // RP
      return { exprKind: "varRef", tok: varTok };
    }
    const expr = parseExpr(p, ts);
    ts.expect(T_RP, 'expected ")"');
    return { exprKind: "paren", expr };
  }

  // NTH VERTEX OF object.x/.y
  if (t.eType === T_NTH && ts.peekAhead(1).eType === T_VERTEX) {
    const saved = ts.save();
    const savedErr = p.nErr;
    const savedOut2 = p.zOut;

    const nth = ts.advance();
    const vertex = ts.advance();
    ts.match(T_OF);
    const obj = parseObject(p, ts);

    if (p.nErr === 0 && ts.peek().eType === T_DOT_XY) {
      ts.advance();
      const pt = ts.peek();
      if (pt.eType === T_X || pt.eType === T_Y) {
        const axis = ts.advance();
        // Return as placeXY with vertex info encoded
        nth.eCode = parseNthValue(nth);
        return {
          exprKind: "placeXY",
          place: { object: obj, edge: vertex, hasDotE: false },
          axis: axis.eType === T_X ? "x" : "y",
        };
      }
    }

    p.nErr = savedErr;
    p.zOut = savedOut2;
    ts.restore(saved);
  }

  // Object reference with .x/.y or .property
  if (isObjectStart(t)) {
    const saved = ts.save();
    const savedErr = p.nErr;
    const savedOut2 = p.zOut;

    const obj = parseObject(p, ts);

    if (p.nErr === 0) {
      // .x or .y
      if (ts.peek().eType === T_DOT_XY) {
        ts.advance();
        if (ts.peek().eType === T_X) {
          ts.advance();
          return { exprKind: "placeXY", place: { object: obj, edge: null, hasDotE: false }, axis: "x" };
        }
        if (ts.peek().eType === T_Y) {
          ts.advance();
          return { exprKind: "placeXY", place: { object: obj, edge: null, hasDotE: false }, axis: "y" };
        }
      }

      // .edge.x / .edge.y
      if (ts.peek().eType === T_DOT_E) {
        const dotSaved = ts.save();
        ts.advance();
        const edge = parseEdge(p, ts);
        if (ts.peek().eType === T_DOT_XY) {
          ts.advance();
          if (ts.peek().eType === T_X) {
            ts.advance();
            return { exprKind: "placeXY", place: { object: obj, edge, hasDotE: true }, axis: "x" };
          }
          if (ts.peek().eType === T_Y) {
            ts.advance();
            return { exprKind: "placeXY", place: { object: obj, edge, hasDotE: true }, axis: "y" };
          }
        }
        ts.restore(dotSaved);
      }

      // .property
      if (ts.peek().eType === T_DOT_L) {
        ts.advance();
        const prop = ts.peek();
        if (isNumProperty(prop.eType) || prop.eType === T_DOTTED || prop.eType === T_DASHED ||
            prop.eType === T_FILL || prop.eType === T_COLOR) {
          const propTok = ts.advance();
          return { exprKind: "property", object: obj, prop: propTok };
        }
        pikError(p, prop, 'unknown property');
        return mkNumExpr(makeToken(), 0);
      }
    }

    // Not a valid expr primary — restore
    p.nErr = savedErr;
    p.zOut = savedOut2;
    ts.restore(saved);
  }

  pikError(p, t, 'expected expression');
  return mkNumExpr(makeToken(), 0);
}

// ============================================================
// Helper: create number literal AST node
// ============================================================

function mkNumExpr(tok: PToken, value: number): AstExprNumber {
  return { exprKind: "number", tok, value };
}

// ============================================================
// Predicates (same as parser.ts)
// ============================================================

function isDirection(eType: number): boolean {
  return eType === T_UP || eType === T_DOWN || eType === T_LEFT || eType === T_RIGHT;
}

function isLvalue(eType: number): boolean {
  return eType === T_ID || eType === T_FILL || eType === T_COLOR || eType === T_THICKNESS;
}

function isReservedName(eType: number): boolean {
  return eType === T_TOP || eType === T_EDGEPT || eType === T_X || eType === T_Y;
}

function isBasetypeStart(t: PToken): boolean {
  return t.eType === T_CLASSNAME || t.eType === T_STRING || t.eType === T_LB;
}

function isTextAttr(eType: number): boolean {
  return eType === T_CENTER || eType === T_LJUST || eType === T_RJUST ||
         eType === T_ABOVE || eType === T_BELOW ||
         eType === T_ITALIC || eType === T_BOLD || eType === T_MONO ||
         eType === T_ALIGNED || eType === T_BIG || eType === T_SMALL;
}

function isNumProperty(eType: number): boolean {
  return eType === T_HEIGHT || eType === T_WIDTH || eType === T_RADIUS ||
         eType === T_DIAMETER || eType === T_THICKNESS;
}

function isEdge(t: PToken): boolean {
  return t.eType === T_CENTER || t.eType === T_EDGEPT ||
         t.eType === T_TOP || t.eType === T_BOTTOM ||
         t.eType === T_START || t.eType === T_END ||
         t.eType === T_RIGHT || t.eType === T_LEFT;
}

function isExprStart(t: PToken): boolean {
  return t.eType === T_NUMBER || t.eType === T_ID || t.eType === T_LP ||
         t.eType === T_PLUS || t.eType === T_MINUS ||
         t.eType === T_FUNC1 || t.eType === T_FUNC2 || t.eType === T_FUNC3 || t.eType === T_DIST ||
         t.eType === T_PLACENAME || t.eType === T_NTH || t.eType === T_LAST ||
         t.eType === T_THIS ||
         t.eType === T_YES || t.eType === T_NO || t.eType === T_NOT;
}

function isAttributeStart(t: PToken): boolean {
  return isNumProperty(t.eType) ||
         isDirection(t.eType) ||
         t.eType === T_DOTTED || t.eType === T_DASHED ||
         t.eType === T_FILL || t.eType === T_COLOR ||
         t.eType === T_GO || t.eType === T_CLOSE || t.eType === T_CHOP ||
         t.eType === T_FROM || t.eType === T_TO || t.eType === T_THEN ||
         t.eType === T_AT || t.eType === T_WITH || t.eType === T_SAME ||
         t.eType === T_FIT || t.eType === T_BEHIND ||
         t.eType === T_CW || t.eType === T_CCW ||
         t.eType === T_LARROW || t.eType === T_RARROW || t.eType === T_LRARROW ||
         t.eType === T_INVIS || t.eType === T_THICK || t.eType === T_THIN ||
         t.eType === T_SOLID ||
         t.eType === T_STRING;
}

function isObjectStart(t: PToken): boolean {
  return t.eType === T_THIS || t.eType === T_PLACENAME ||
         t.eType === T_NTH || t.eType === T_LAST;
}

function isNthStart(t: PToken): boolean {
  return t.eType === T_NTH || t.eType === T_LAST;
}

function isEvenStart(t: PToken): boolean {
  return t.eType === T_UNTIL || t.eType === T_EVEN;
}

function isBetweenStart(t: PToken, ts?: TokenStream): boolean {
  if (t.eType === T_WAY || t.eType === T_BETWEEN) return true;
  if (t.eType === T_OF && ts) {
    const next = ts.peekAhead(1);
    return next.eType === T_THE;
  }
  return false;
}

function isPostRelexprKeyword(t: PToken): boolean {
  return t.eType === T_HEADING || t.eType === T_EDGEPT;
}
