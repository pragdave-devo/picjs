// parser.ts — Recursive descent parser for pikchr TypeScript port
// Ported from pikchr.y grammar rules (lines 563-796) and doc/grammar.md

import {
  type PNum, type PPoint, type PRel, type PToken, type PObj, type PList, type Pik,
  TokenType, makeToken,
  pikError, pikAtof, pikDist, numToStr,
} from './types.ts';

import {
  pikValue, pikGetVar, pikLookupColor,
} from './constants.ts';

import { TokenStream, pikFindMacro } from './tokenizer.ts';

import {
  pikElemNew, pikElistAppend, pikAfterAddingAttributes,
  pikSetFrom, pikAddTo, pikSetAt, pikAddDirection, pikMoveHdg,
  pikEvenwith, pikThen, pikClosePath, pikBehind,
  pikSetNumprop, pikSetClrprop, pikSetDashed,
  pikAddTxt, pikTextPosition, pikSizeToFit,
  pikSetVar, pikNthValue, pikFindNth, pikFindByname,
  pikSame, pikPlaceOfElem, pikPositionBetween,
  pikPositionAtAngle, pikPositionAtHdg, pikNthVertex, pikPropertyOf,
  pikFunc, pikElemSetname, pikAssert, pikPositionAssert,
  pikSetDirection, pikAddMacro,
} from './layout.ts';

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
  T_FUNC1, T_FUNC2, T_IN, T_LAST, T_LEFT, T_PRINT, T_RIGHT,
  T_START, T_THE, T_TOP, T_BOTTOM, T_UNTIL, T_UP, T_VERTEX,
  T_WAY, T_X, T_Y, T_THIS,
  T_CODEBLOCK,
} = TokenType;

// --------------------------------------------------------------------------
// The main parse entry point
// --------------------------------------------------------------------------

export function pikParse(p: Pik, input: string): PList | null {
  p.sIn = { z: input, n: input.length, eCode: 0, eType: 0, eEdge: 0 };
  const ts = new TokenStream(p);
  ts.tokenize(input);
  if (p.nErr) return null;
  const list = parseDocument(p, ts);
  return list;
}

// --------------------------------------------------------------------------
// document ::= statement_list
// --------------------------------------------------------------------------

function parseDocument(p: Pik, ts: TokenStream): PList | null {
  return parseStatementList(p, ts);
}

// --------------------------------------------------------------------------
// statement_list ::= statement? (EOL statement?)*
// --------------------------------------------------------------------------

function parseStatementList(p: Pik, ts: TokenStream): PList | null {
  let list: PList | null = null;
  // Parse first statement (may be empty)
  const obj = parseStatement(p, ts);
  list = pikElistAppend(p, list, obj);
  // Parse subsequent: EOL statement
  while (p.nErr === 0 && !ts.atEnd()) {
    if (ts.peek().eType === T_RB) break; // end of [...] sublist
    if (!ts.match(T_EOL)) break;
    // skip consecutive EOLs
    while (ts.match(T_EOL)) { /* skip */ }
    if (ts.atEnd() || ts.peek().eType === T_RB) break;
    const obj2 = parseStatement(p, ts);
    list = pikElistAppend(p, list, obj2);
  }
  return list;
}

// --------------------------------------------------------------------------
// statement ::= direction | assignment | label:stmt | label:position
//             | object-definition | print | assert | define | (empty)
// --------------------------------------------------------------------------

function parseStatement(p: Pik, ts: TokenStream): PObj | null {
  if (p.nErr) return null;
  let t = ts.peek();

  // empty statement
  if (t.eType === T_EOL || ts.atEnd() || t.eType === T_RB) {
    return null;
  }

  // Check for macro invocation at statement level (handles macros that expand to statements)
  if (t.eType === T_ID) {
    const macName = t.z.substring(0, t.n);
    const pMac = pikFindMacro(p, macName);
    if (pMac) {
      ts.advance(); // consume the macro name
      const args = ts.parseMacroArgs();
      if (ts.expandMacro(pMac, args || new Array(9).fill(null).map(() => makeToken()))) {
        // Skip any leading EOLs in the expanded content
        while (ts.peek().eType === T_EOL) ts.advance();
        // Re-read the token and continue parsing (may be define, direction, etc.)
        t = ts.peek();
        if (t.eType === T_EOL || ts.atEnd() || t.eType === T_RB) {
          return null;
        }
        // Fall through to continue parsing the expanded content
      } else {
        return null; // error occurred during expansion
      }
    }
  }

  // direction: up | down | left | right
  // In the Lemon grammar, direction keywords are NOT classnames, so they
  // always reduce as direction-change statements at statement level.
  if (isDirection(t.eType)) {
    const dir = ts.advance();
    pikSetDirection(p, dir.eCode);
    return null;
  }

  // assignment: lvalue ASSIGN rvalue
  if (isLvalue(t.eType)) {
    const t2 = ts.peekAhead(1);
    if (t2.eType === T_ASSIGN) {
      const lv = ts.advance();
      const op = ts.advance();
      const rv = parseRvalue(p, ts);
      pikSetVar(p, lv, rv, op);
      return null;
    }
  }

  // PLACENAME COLON ...
  if (t.eType === T_PLACENAME) {
    const t2 = ts.peekAhead(1);
    if (t2.eType === T_COLON) {
      const label = ts.advance();
      ts.advance(); // consume ':'

      // Check what follows: an object definition or a position (label: position)
      // If it looks like an unnamed_statement, parse that
      // otherwise try position
      if (isBasetypeStart(ts.peek())) {
        const obj = parseUnnamedStatement(p, ts);
        pikElemSetname(p, obj, label);
        return obj;
      } else {
        // label: position — create a noop element positioned at the given place
        const pos = parsePosition(p, ts);
        const obj = pikElemNew(p, null, null, null);
        if (obj) {
          obj.ptAt = pos;
          pikElemSetname(p, obj, label);
        }
        return obj;
      }
    }
  }

  // print
  if (t.eType === T_PRINT) {
    ts.advance();
    parsePrlist(p, ts);
    return null;
  }

  // assert
  if (t.eType === T_ASSERT) {
    ts.advance();
    ts.expect(T_LP, 'expected \"(\" after \"assert\"');
    if (p.nErr) return null;

    // Try expr == expr first, fall back to position == position
    const saved = ts.save();
    const savedErr = p.nErr;
    const savedOut = p.zOut;

    const e1 = parseExpr(p, ts);
    if (p.nErr === 0 && ts.peek().eType === T_EQ) {
      const eqTok = ts.advance();
      const e2 = parseExpr(p, ts);
      if (p.nErr === 0) {
        ts.expect(T_RP, 'expected \")\"');
        pikAssert(p, e1, eqTok, e2);
        return null;
      }
    }

    // Expr parsing failed or didn't match pattern — try position == position
    p.nErr = savedErr;
    p.zOut = savedOut;
    ts.restore(saved);

    const pos1 = parsePosition(p, ts);
    if (p.nErr) return null;
    const eqTok = ts.expect(T_EQ, 'expected \"==\"');
    const pos2 = parsePosition(p, ts);
    ts.expect(T_RP, 'expected \")\"');
    pikPositionAssert(p, pos1, eqTok, pos2);
    return null;
  }

  // define
  if (t.eType === T_DEFINE) {
    ts.advance();
    const id = ts.expect(T_ID, 'expected macro name');
    const code = ts.expect(T_CODEBLOCK, 'expected code block {...}');
    if (p.nErr === 0) {
      pikAddMacro(p, id, code);
    }
    return null;
  }

  // unnamed_statement (object-definition)
  return parseUnnamedStatement(p, ts);
}

// --------------------------------------------------------------------------
// unnamed_statement ::= basetype attribute_list
// --------------------------------------------------------------------------

function parseUnnamedStatement(p: Pik, ts: TokenStream): PObj | null {
  const obj = parseBasetype(p, ts);
  if (p.nErr || !obj) return obj;
  parseAttributeList(p, ts, obj);
  if (p.nErr) return obj;
  pikAfterAddingAttributes(p, obj);
  return obj;
}

// --------------------------------------------------------------------------
// basetype ::= CLASSNAME | STRING textposition | '[' statement_list ']'
// --------------------------------------------------------------------------

function parseBasetype(p: Pik, ts: TokenStream): PObj | null {
  const t = ts.peek();

  // Check for macro invocation: T_ID that matches a defined macro
  if (t.eType === T_ID) {
    const macName = t.z.substring(0, t.n);
    const pMac = pikFindMacro(p, macName);
    if (pMac) {
      ts.advance(); // consume the macro name
      const args = ts.parseMacroArgs(); // parse (arg1, arg2) if present
      if (ts.expandMacro(pMac, args || new Array(9).fill(null).map(() => makeToken()))) {
        // Skip any leading EOLs in the expanded content
        while (ts.peek().eType === T_EOL) ts.advance();
        // Recursively parse the expanded tokens
        return parseBasetype(p, ts);
      }
      return null; // error occurred during expansion
    }
  }

  if (t.eType === T_CLASSNAME) {
    const cls = ts.advance();
    return pikElemNew(p, cls, null, null);
  }

  if (t.eType === T_STRING) {
    const str = ts.advance();
    const pos = parseTextposition(p, ts);
    str.eCode = pos;
    return pikElemNew(p, null, str, null);
  }

  if (t.eType === T_LB) {
    ts.advance(); // consume '['
    const savedList = p.list;
    p.list = null;
    const sublist = parseStatementList(p, ts);
    ts.expect(T_RB, 'expected \"]\"');
    const endTok = ts.lastToken();
    p.list = savedList;
    const obj = pikElemNew(p, null, null, sublist);
    if (obj) obj.errTok = { ...endTok };
    return obj;
  }

  pikError(p, t, 'syntax error');
  return null;
}

// --------------------------------------------------------------------------
// textposition ::= (CENTER|LJUST|RJUST|ABOVE|BELOW|ITALIC|BOLD|MONO|ALIGNED|BIG|SMALL)*
// --------------------------------------------------------------------------

function parseTextposition(p: Pik, ts: TokenStream): number {
  let pos = 0;
  while (isTextAttr(ts.peek().eType)) {
    const flag = ts.advance();
    pos = pikTextPosition(pos, flag);
  }
  return pos;
}

// --------------------------------------------------------------------------
// attribute_list ::= relexpr alist | alist
// alist ::= (attribute)*
// --------------------------------------------------------------------------

function parseAttributeList(p: Pik, ts: TokenStream, obj: PObj): void {
  if (p.nErr) return;

  // Check for leading relexpr (implicit direction distance)
  // This applies when the first token of the attribute list is something
  // that can start an expression, but is NOT a recognized attribute keyword.
  if (!ts.atStatementEnd() && isExprStart(ts.peek()) && !isAttributeStart(ts.peek())) {
    const rel = parseRelexpr(p, ts);
    pikAddDirection(p, null, rel);
  }

  // Parse zero or more attributes
  while (p.nErr === 0 && !ts.atStatementEnd()) {
    if (!parseAttribute(p, ts, obj)) break;
  }
}

// --------------------------------------------------------------------------
// attribute ::= (many alternatives)
// Returns true if an attribute was parsed, false if nothing matched.
// --------------------------------------------------------------------------

function parseAttribute(p: Pik, ts: TokenStream, obj: PObj): boolean {
  if (p.nErr || ts.atStatementEnd()) return false;
  const t = ts.peek();

  // numeric property: HEIGHT|WIDTH|RADIUS|DIAMETER|THICKNESS relexpr
  if (isNumProperty(t.eType)) {
    const prop = ts.advance();
    const rel = parseRelexpr(p, ts);
    pikSetNumprop(p, prop, rel);
    return true;
  }

  // dash property: DOTTED expr? | DASHED expr?
  if (t.eType === T_DOTTED || t.eType === T_DASHED) {
    const prop = ts.advance();
    if (!ts.atStatementEnd() && isExprStart(ts.peek())) {
      const val = parseExpr(p, ts);
      pikSetDashed(p, prop, val);
    } else {
      pikSetDashed(p, prop, null);
    }
    return true;
  }

  // color property: FILL rvalue | COLOR rvalue
  if (t.eType === T_FILL || t.eType === T_COLOR) {
    const prop = ts.advance();
    const val = parseRvalue(p, ts);
    pikSetClrprop(p, prop, val);
    return true;
  }

  // go direction optrelexpr
  // go direction even position
  // Also: bare direction (no "go" prefix)
  if (t.eType === T_GO || isDirection(t.eType)) {
    const hasGo = t.eType === T_GO;
    if (hasGo) ts.advance();
    const t2 = ts.peek();

    if (isDirection(t2.eType)) {
      const dir = ts.advance();
      // Check for "even with" or "until even with"
      if (isEvenStart(ts.peek())) {
        parseEvenWith(p, ts);
        const pos = parsePosition(p, ts);
        pikEvenwith(p, dir, pos);
      } else {
        // optrelexpr
        const rel = parseOptrelexpr(p, ts);
        pikAddDirection(p, dir, rel);
      }
      return true;
    }

    // (then|go) optrelexpr HEADING expr
    // (then|go) optrelexpr EDGEPT
    if (hasGo) {
      const errTok = t;
      const rel = parseOptrelexpr(p, ts);
      if (ts.peek().eType === T_HEADING) {
        const hdg = ts.advance();
        const angle = parseExpr(p, ts);
        pikMoveHdg(p, rel, hdg, angle, null, errTok);
      } else if (ts.peek().eType === T_EDGEPT) {
        const edgept = ts.advance();
        pikMoveHdg(p, rel, null, 0, edgept, errTok);
      } else {
        pikError(p, ts.peek(), 'expected direction after \"go\"');
      }
      return true;
    }
    // If no go and not a direction, fall through
    return false;
  }

  // CLOSE
  if (t.eType === T_CLOSE) {
    const tok = ts.advance();
    pikClosePath(p, tok);
    return true;
  }

  // CHOP
  if (t.eType === T_CHOP) {
    ts.advance();
    p.cur!.bChop = true;
    return true;
  }

  // FROM position
  if (t.eType === T_FROM) {
    const tok = ts.advance();
    const pos = parsePosition(p, ts);
    pikSetFrom(p, p.cur!, tok, pos);
    return true;
  }

  // TO position
  if (t.eType === T_TO) {
    const tok = ts.advance();
    const pos = parsePosition(p, ts);
    pikAddTo(p, p.cur!, tok, pos);
    return true;
  }

  // THEN
  if (t.eType === T_THEN) {
    const tok = ts.advance();
    // Check if THEN is followed by TO
    if (ts.peek().eType === T_TO) {
      pikThen(p, tok, p.cur!);
      // The TO will be picked up by the next iteration
      return true;
    }
    // Check for THEN direction
    if (isDirection(ts.peek().eType)) {
      pikThen(p, tok, p.cur!);
      // Direction will be picked up by next iteration
      return true;
    }
    // THEN optrelexpr HEADING expr
    // THEN optrelexpr EDGEPT
    const errTok = tok;
    const rel = parseOptrelexpr(p, ts);
    if (ts.peek().eType === T_HEADING) {
      pikThen(p, tok, p.cur!);
      const hdg = ts.advance();
      const angle = parseExpr(p, ts);
      pikMoveHdg(p, rel, hdg, angle, null, errTok);
    } else if (ts.peek().eType === T_EDGEPT) {
      pikThen(p, tok, p.cur!);
      const edgept = ts.advance();
      pikMoveHdg(p, rel, null, 0, edgept, errTok);
    } else {
      pikThen(p, tok, p.cur!);
    }
    return true;
  }

  // boolproperty: CW, CCW, LARROW, RARROW, LRARROW, INVIS, THICK, THIN, SOLID
  if (t.eType === T_CW) {
    ts.advance();
    p.cur!.cw = true;
    return true;
  }
  if (t.eType === T_CCW) {
    ts.advance();
    p.cur!.cw = false;
    return true;
  }
  if (t.eType === T_LARROW) {
    ts.advance();
    p.cur!.larrow = true;
    p.cur!.rarrow = false;
    return true;
  }
  if (t.eType === T_RARROW) {
    ts.advance();
    p.cur!.larrow = false;
    p.cur!.rarrow = true;
    return true;
  }
  if (t.eType === T_LRARROW) {
    ts.advance();
    p.cur!.larrow = true;
    p.cur!.rarrow = true;
    return true;
  }
  if (t.eType === T_INVIS) {
    ts.advance();
    p.cur!.sw = -0.00001;
    return true;
  }
  if (t.eType === T_THICK) {
    ts.advance();
    p.cur!.sw *= 1.5;
    return true;
  }
  if (t.eType === T_THIN) {
    ts.advance();
    p.cur!.sw *= 0.67;
    return true;
  }
  if (t.eType === T_SOLID) {
    ts.advance();
    p.cur!.sw = pikValue(p, 'thickness', 9).val;
    p.cur!.dotted = 0.0;
    p.cur!.dashed = 0.0;
    return true;
  }

  // AT position
  if (t.eType === T_AT) {
    const atTok = ts.advance();
    const pos = parsePosition(p, ts);
    pikSetAt(p, null, pos, atTok);
    return true;
  }

  // WITH clause
  if (t.eType === T_WITH) {
    ts.advance();
    parseWithClause(p, ts);
    return true;
  }

  // SAME | SAME AS object
  if (t.eType === T_SAME) {
    const sameTok = ts.advance();
    if (ts.peek().eType === T_AS) {
      ts.advance();
      const other = parseObject(p, ts);
      pikSame(p, other, sameTok);
    } else {
      pikSame(p, null, sameTok);
    }
    return true;
  }

  // STRING textposition
  if (t.eType === T_STRING) {
    const str = ts.advance();
    const pos = parseTextposition(p, ts);
    pikAddTxt(p, str, pos);
    return true;
  }

  // FIT
  if (t.eType === T_FIT) {
    const fitTok = ts.advance();
    pikSizeToFit(p, null, fitTok, 3);
    return true;
  }

  // BEHIND object
  if (t.eType === T_BEHIND) {
    ts.advance();
    const other = parseObject(p, ts);
    if (other) pikBehind(p, other);
    return true;
  }

  // Not a recognized attribute — stop parsing attributes
  return false;
}

// --------------------------------------------------------------------------
// withclause ::= DOT_E edge AT position | edge AT position
// --------------------------------------------------------------------------

function parseWithClause(p: Pik, ts: TokenStream): void {
  let edge: PToken;
  if (ts.peek().eType === T_DOT_E) {
    ts.advance(); // consume the dot
    edge = parseEdge(p, ts);
  } else {
    edge = parseEdge(p, ts);
  }
  const atTok = ts.expect(T_AT, 'expected \"at\"');
  const pos = parsePosition(p, ts);
  pikSetAt(p, edge, pos, atTok);
}

// --------------------------------------------------------------------------
// even ::= UNTIL EVEN WITH | EVEN WITH
// --------------------------------------------------------------------------

function parseEvenWith(p: Pik, ts: TokenStream): void {
  if (ts.peek().eType === T_UNTIL) {
    ts.advance();
  }
  if (ts.peek().eType === T_EVEN) {
    ts.advance();
  }
  if (ts.peek().eType === T_WITH) {
    ts.advance();
  }
}

// --------------------------------------------------------------------------
// relexpr ::= expr | expr '%'
// optrelexpr ::= relexpr | (empty => {rAbs:0, rRel:1.0})
// --------------------------------------------------------------------------

function parseRelexpr(p: Pik, ts: TokenStream): PRel {
  const val = parseExpr(p, ts);
  if (ts.peek().eType === T_PERCENT) {
    ts.advance();
    return { rAbs: 0, rRel: val / 100 };
  }
  return { rAbs: val, rRel: 0 };
}

function parseOptrelexpr(p: Pik, ts: TokenStream): PRel {
  if (isExprStart(ts.peek()) && !isPostRelexprKeyword(ts.peek())) {
    return parseRelexpr(p, ts);
  }
  return { rAbs: 0, rRel: 1.0 };
}

// --------------------------------------------------------------------------
// rvalue ::= expr | PLACENAME (color name)
// --------------------------------------------------------------------------

function parseRvalue(p: Pik, ts: TokenStream): PNum {
  // PLACENAME might be a color OR an object reference (like B2.n.x)
  // Only treat as color if not followed by a dot
  if (ts.peek().eType === T_PLACENAME) {
    const t2 = ts.peekAhead(1);
    if (t2.eType !== T_DOT_E && t2.eType !== T_DOT_XY &&
        t2.eType !== T_DOT_L && t2.eType !== T_DOT_U) {
      const clr = ts.advance();
      return pikLookupColor(p, clr);
    }
  }
  return parseExpr(p, ts);
}

// --------------------------------------------------------------------------
// print prlist
// prlist ::= pritem (, pritem)*
// pritem ::= FILL | COLOR | THICKNESS | rvalue | STRING
// --------------------------------------------------------------------------

function parsePrlist(p: Pik, ts: TokenStream): void {
  parsePritem(p, ts);
  while (ts.peek().eType === T_COMMA) {
    ts.advance();
    p.zOut += ' ';
    parsePritem(p, ts);
  }
  p.zOut += '<br>\n';
}

function parsePritem(p: Pik, ts: TokenStream): void {
  const t = ts.peek();
  if (t.eType === T_STRING) {
    const s = ts.advance();
    // Append the string content without quotes
    p.zOut += s.z.substring(1, s.n - 1);
    return;
  }
  if (t.eType === T_FILL || t.eType === T_COLOR || t.eType === T_THICKNESS) {
    const tok = ts.advance();
    const val = pikValue(p, tok.z, tok.n).val;
    p.zOut += numToStr(val);
    return;
  }
  const val = parseRvalue(p, ts);
  p.zOut += numToStr(val);
}

// --------------------------------------------------------------------------
// position ::= expr ',' expr
//            | place
//            | place (+|-) expr ',' expr
//            | place (+|-) '(' expr ',' expr ')'
//            | '(' position ',' position ')'
//            | '(' position ')'
//            | expr between position AND position
//            | expr '<' position ',' position '>'
//            | expr ABOVE position
//            | expr BELOW position
//            | expr LEFT OF position
//            | expr RIGHT OF position
//            | expr ON HEADING EDGEPT OF position
//            | expr HEADING EDGEPT OF position
//            | expr EDGEPT OF position
//            | expr ON HEADING expr FROM position
//            | expr HEADING expr FROM position
// --------------------------------------------------------------------------

function parsePosition(p: Pik, ts: TokenStream): PPoint {
  if (p.nErr) return { x: 0, y: 0 };

  // '(' position [',' position] ')'
  if (ts.peek().eType === T_LP) {
    // This could be parenthesized position or (position, position) form
    // or just a parenthesized expression at the start of expr,expr
    // We need to distinguish. Try: '(' position ',' position ')' first
    // Actually the grammar says:
    //   LP position COMMA position RP -> {x=X.x, y=Y.y}
    //   LP position RP -> X
    // But this conflicts with expr starting with LP.
    // Strategy: save, try to parse as (position, position) or (position)
    // If that fails, parse as expr, expr
    const saved = ts.save();
    const nErrSaved = p.nErr;
    ts.advance(); // consume LP
    const inner = parsePosition(p, ts);
    if (p.nErr === 0 && ts.peek().eType === T_COMMA) {
      ts.advance();
      const inner2 = parsePosition(p, ts);
      if (p.nErr === 0 && ts.peek().eType === T_RP) {
        ts.advance();
        return { x: inner.x, y: inner2.y };
      }
    }
    if (p.nErr === 0 && ts.peek().eType === T_RP) {
      ts.advance();
      return inner;
    }
    // Failed — backtrack and try expr,expr
    p.nErr = nErrSaved;
    p.zOut = p.zOut; // restore output (errors may have appended)
    ts.restore(saved);
  }

  // Try: expr ...
  // The expr path handles: expr,expr | expr ABOVE/BELOW/LEFT/RIGHT/... | expr between ...
  // Also handles place (which may start with object reference)
  //
  // The key ambiguity: place can start with the same tokens as expr
  // (PLACENAME, NTH, LAST, THIS). We use the following strategy:
  //
  // 1. Try to parse an expr first. If followed by COMMA -> absolute coord
  // 2. If followed by ABOVE/BELOW/LEFT/RIGHT/EDGEPT/HEADING/between -> distance+direction
  // 3. Otherwise, backtrack and try to parse a place.

  const saved = ts.save();
  const savedErr = p.nErr;
  const savedOut = p.zOut;
  const val = parseExpr(p, ts);

  if (p.nErr) {
    // expr parse failed, try place (which may be followed by +/- offset)
    p.nErr = savedErr;
    p.zOut = savedOut;
    ts.restore(saved);
    const place = parsePlace(p, ts);

    // place (+|-) expr ',' expr
    // place (+|-) '(' expr ',' expr ')'
    if (ts.peek().eType === T_PLUS || ts.peek().eType === T_MINUS) {
      const sign = ts.advance().eType === T_PLUS ? 1 : -1;
      if (ts.peek().eType === T_LP) {
        ts.advance();
        const dx = parseExpr(p, ts);
        ts.expect(T_COMMA, 'expected \",\"');
        const dy = parseExpr(p, ts);
        ts.expect(T_RP, 'expected \")\"');
        return { x: place.x + sign * dx, y: place.y + sign * dy };
      } else {
        const dx = parseExpr(p, ts);
        ts.expect(T_COMMA, 'expected \",\"');
        const dy = parseExpr(p, ts);
        return { x: place.x + sign * dx, y: place.y + sign * dy };
      }
    }

    return place;
  }

  // expr COMMA expr  -> absolute position
  if (ts.peek().eType === T_COMMA) {
    ts.advance();
    const y = parseExpr(p, ts);
    return { x: val, y };
  }

  // expr which-way-from position
  if (ts.peek().eType === T_ABOVE) {
    ts.advance();
    const pos = parsePosition(p, ts);
    return { x: pos.x, y: pos.y + val };
  }
  if (ts.peek().eType === T_BELOW) {
    ts.advance();
    const pos = parsePosition(p, ts);
    return { x: pos.x, y: pos.y - val };
  }
  if (ts.peek().eType === T_LEFT) {
    ts.advance();
    ts.match(T_OF);
    const pos = parsePosition(p, ts);
    return { x: pos.x - val, y: pos.y };
  }
  if (ts.peek().eType === T_RIGHT) {
    ts.advance();
    ts.match(T_OF);
    const pos = parsePosition(p, ts);
    return { x: pos.x + val, y: pos.y };
  }

  // expr EDGEPT OF position
  if (ts.peek().eType === T_EDGEPT) {
    const edgept = ts.advance();
    ts.match(T_OF);
    const pos = parsePosition(p, ts);
    return pikPositionAtHdg(val, edgept, pos);
  }

  // expr HEADING EDGEPT OF position
  // expr HEADING expr FROM position
  if (ts.peek().eType === T_HEADING) {
    ts.advance();
    if (ts.peek().eType === T_EDGEPT) {
      const edgept = ts.advance();
      ts.match(T_OF);
      const pos = parsePosition(p, ts);
      return pikPositionAtHdg(val, edgept, pos);
    } else {
      const angle = parseExpr(p, ts);
      ts.match(T_FROM);
      const pos = parsePosition(p, ts);
      return pikPositionAtAngle(val, angle, pos);
    }
  }

  // expr between ...
  // between ::= WAY BETWEEN | BETWEEN | OF THE WAY BETWEEN
  if (isBetweenStart(ts.peek(), ts)) {
    parseBetween(p, ts);
    const p1 = parsePosition(p, ts);
    ts.expect(T_AND, 'expected \"and\"');
    const p2 = parsePosition(p, ts);
    return pikPositionBetween(val, p1, p2);
  }

  // expr '<' position ',' position '>'
  if (ts.peek().eType === T_LT) {
    ts.advance();
    const p1 = parsePosition(p, ts);
    ts.expect(T_COMMA, 'expected \",\"');
    const p2 = parsePosition(p, ts);
    ts.expect(T_GT, 'expected \">\"');
    return pikPositionBetween(val, p1, p2);
  }

  // If none of the above matched, the expr we parsed might actually be part of a place.
  // Backtrack and try place.
  p.nErr = savedErr;
  p.zOut = savedOut;
  ts.restore(saved);
  const place = parsePlace(p, ts);

  // place (+|-) expr ',' expr
  // place (+|-) '(' expr ',' expr ')'
  if (ts.peek().eType === T_PLUS || ts.peek().eType === T_MINUS) {
    const sign = ts.advance().eType === T_PLUS ? 1 : -1;
    if (ts.peek().eType === T_LP) {
      ts.advance();
      const dx = parseExpr(p, ts);
      ts.expect(T_COMMA, 'expected \",\"');
      const dy = parseExpr(p, ts);
      ts.expect(T_RP, 'expected \")\"');
      return { x: place.x + sign * dx, y: place.y + sign * dy };
    } else {
      const dx = parseExpr(p, ts);
      ts.expect(T_COMMA, 'expected \",\"');
      const dy = parseExpr(p, ts);
      return { x: place.x + sign * dx, y: place.y + sign * dy };
    }
  }

  return place;
}

// --------------------------------------------------------------------------
// between ::= WAY BETWEEN | BETWEEN | OF THE WAY BETWEEN
// --------------------------------------------------------------------------

function parseBetween(p: Pik, ts: TokenStream): void {
  if (ts.peek().eType === T_OF) {
    ts.advance(); // OF
    ts.match(T_THE); // THE (optional)
    ts.match(T_WAY); // WAY (optional)
    ts.expect(T_BETWEEN, 'expected \"between\"');
    return;
  }
  if (ts.peek().eType === T_WAY) {
    ts.advance(); // WAY
    ts.expect(T_BETWEEN, 'expected \"between\"');
    return;
  }
  if (ts.peek().eType === T_BETWEEN) {
    ts.advance();
    return;
  }
}

// --------------------------------------------------------------------------
// place ::= object [dot-edgename]
//          | edge OF object
//          | NTH VERTEX OF object
// --------------------------------------------------------------------------

function parsePlace(p: Pik, ts: TokenStream): PPoint {
  if (p.nErr) return { x: 0, y: 0 };

  // edge OF object  (edgename followed by OF)
  if (isEdge(ts.peek()) && ts.peekAhead(1).eType === T_OF) {
    const edge = parseEdge(p, ts);
    ts.advance(); // consume OF
    const obj = parseObject(p, ts);
    return pikPlaceOfElem(p, obj, edge);
  }

  // NTH VERTEX OF object
  if (ts.peek().eType === T_NTH) {
    const saved = ts.save();
    // Check if it's NTH VERTEX OF
    const nth = ts.advance();
    if (ts.peek().eType === T_VERTEX) {
      const vertex = ts.advance();
      ts.match(T_OF);
      const obj = parseObject(p, ts);
      nth.eCode = pikNthValue(p, nth);
      return pikNthVertex(p, nth, vertex, obj);
    }
    // Not vertex, restore and fall through to object parse
    ts.restore(saved);
  }

  // object [dot-edgename]
  const obj = parseObject(p, ts);
  // Check for DOT_E (dot-edgename like .n .s .center etc)
  if (ts.peek().eType === T_DOT_E) {
    ts.advance(); // consume the dot
    const edge = parseEdge(p, ts);
    return pikPlaceOfElem(p, obj, edge);
  }
  return pikPlaceOfElem(p, obj, null);
}

// --------------------------------------------------------------------------
// edge ::= CENTER | EDGEPT | TOP | BOTTOM | START | END | RIGHT | LEFT
// --------------------------------------------------------------------------

function parseEdge(p: Pik, ts: TokenStream): PToken {
  const t = ts.peek();
  if (t.eType === T_CENTER || t.eType === T_EDGEPT ||
      t.eType === T_TOP || t.eType === T_BOTTOM ||
      t.eType === T_START || t.eType === T_END ||
      t.eType === T_RIGHT || t.eType === T_LEFT) {
    return ts.advance();
  }
  pikError(p, t, 'expected edge name');
  return t;
}

// --------------------------------------------------------------------------
// object ::= objectname | nth [OF|IN object]
// objectname ::= THIS | PLACENAME | objectname DOT_U PLACENAME
// --------------------------------------------------------------------------

function parseObject(p: Pik, ts: TokenStream): PObj | null {
  if (p.nErr) return null;
  const t = ts.peek();

  // THIS
  if (t.eType === T_THIS) {
    ts.advance();
    return p.cur;
  }

  // PLACENAME (possibly followed by DOT_U PLACENAME chain)
  if (t.eType === T_PLACENAME) {
    const name = ts.advance();
    let obj = pikFindByname(p, null, name);
    // Check for DOT_U PLACENAME chain
    while (p.nErr === 0 && ts.peek().eType === T_DOT_U) {
      ts.advance(); // consume dot
      const subname = ts.expect(T_PLACENAME, 'expected label after \".\"');
      obj = pikFindByname(p, obj, subname);
    }
    return obj;
  }

  // nth [OF|IN object]
  if (isNthStart(ts.peek())) {
    const nth = parseNth(p, ts);
    if (ts.peek().eType === T_OF || ts.peek().eType === T_IN) {
      ts.advance();
      const basis = parseObject(p, ts);
      return pikFindNth(p, basis, nth);
    }
    return pikFindNth(p, null, nth);
  }

  pikError(p, t, 'expected an object reference');
  return null;
}

// --------------------------------------------------------------------------
// nth ::= NTH CLASSNAME | NTH LAST CLASSNAME | LAST CLASSNAME | LAST
//        | NTH LB RB | NTH LAST LB RB | LAST LB RB
// --------------------------------------------------------------------------

function parseNth(p: Pik, ts: TokenStream): PToken {
  const t = ts.peek();

  if (t.eType === T_NTH) {
    const nth = ts.advance();
    const n = pikNthValue(p, nth);

    if (ts.peek().eType === T_LAST) {
      ts.advance(); // consume LAST
      if (ts.peek().eType === T_CLASSNAME) {
        const cls = ts.advance();
        cls.eCode = -n;
        return cls;
      }
      if (ts.peek().eType === T_LB) {
        const lb = ts.advance();
        ts.expect(T_RB, 'expected \"]\"');
        lb.eCode = -n;
        return lb;
      }
      // NTH LAST with no classname — treat as "last" of any type
      const tok = { ...nth };
      tok.eType = T_LAST;
      tok.eCode = -n;
      return tok;
    }

    if (ts.peek().eType === T_CLASSNAME) {
      const cls = ts.advance();
      cls.eCode = n;
      return cls;
    }

    if (ts.peek().eType === T_LB) {
      const lb = ts.advance();
      ts.expect(T_RB, 'expected \"]\"');
      lb.eCode = n;
      return lb;
    }

    pikError(p, ts.peek(), 'expected class name after ordinal');
    return nth;
  }

  if (t.eType === T_LAST) {
    const last = ts.advance();
    if (ts.peek().eType === T_CLASSNAME) {
      const cls = ts.advance();
      cls.eCode = -1;
      return cls;
    }
    if (ts.peek().eType === T_LB) {
      const lb = ts.advance();
      ts.expect(T_RB, 'expected \"]\"');
      lb.eCode = -1;
      return lb;
    }
    // bare "last" — last object of any type
    last.eCode = -1;
    return last;
  }

  pikError(p, t, 'expected ordinal or \"last\"');
  return t;
}

// --------------------------------------------------------------------------
// expr — three-level precedence recursive descent
// expr     ::= addExpr
// addExpr  ::= mulExpr ((+|-) mulExpr)*
// mulExpr  ::= unaryExpr ((*|/) unaryExpr)*
// unaryExpr ::= (- | +) unaryExpr | primary
// primary  ::= NUMBER | VARIABLE | COLORNAME lookup | (expr)
//            | (FILL|COLOR|THICKNESS)  [as variable name in parens]
//            | FUNC1(expr) | FUNC2(expr,expr) | DIST(position,position)
//            | place2.x | place2.y | object.property
// --------------------------------------------------------------------------

function parseExpr(p: Pik, ts: TokenStream): PNum {
  return parseAddExpr(p, ts);
}

function parseAddExpr(p: Pik, ts: TokenStream): PNum {
  let left = parseMulExpr(p, ts);
  while (p.nErr === 0) {
    if (ts.peek().eType === T_PLUS) {
      ts.advance();
      left += parseMulExpr(p, ts);
    } else if (ts.peek().eType === T_MINUS) {
      ts.advance();
      left -= parseMulExpr(p, ts);
    } else {
      break;
    }
  }
  return left;
}

function parseMulExpr(p: Pik, ts: TokenStream): PNum {
  let left = parseUnaryExpr(p, ts);
  while (p.nErr === 0) {
    if (ts.peek().eType === T_STAR) {
      ts.advance();
      left *= parseUnaryExpr(p, ts);
    } else if (ts.peek().eType === T_SLASH) {
      const slashTok = ts.advance();
      const right = parseUnaryExpr(p, ts);
      if (right === 0.0) {
        pikError(p, slashTok, 'division by zero');
        left = 0.0;
      } else {
        left /= right;
      }
    } else {
      break;
    }
  }
  return left;
}

function parseUnaryExpr(p: Pik, ts: TokenStream): PNum {
  if (ts.peek().eType === T_MINUS) {
    ts.advance();
    return -parseUnaryExpr(p, ts);
  }
  if (ts.peek().eType === T_PLUS) {
    ts.advance();
    return parseUnaryExpr(p, ts);
  }
  return parsePrimary(p, ts);
}

function parsePrimary(p: Pik, ts: TokenStream): PNum {
  if (p.nErr) return 0.0;
  const t = ts.peek();

  // NUMBER
  if (t.eType === T_NUMBER) {
    const num = ts.advance();
    return pikAtof(num);
  }

  // ID (variable)
  if (t.eType === T_ID) {
    const id = ts.advance();
    return pikGetVar(p, id);
  }

  // FUNC1 LP expr RP
  if (t.eType === T_FUNC1) {
    const fn = ts.advance();
    ts.expect(T_LP, 'expected \"(\"');
    const x = parseExpr(p, ts);
    ts.expect(T_RP, 'expected \")\"');
    return pikFunc(p, fn, x, 0.0);
  }

  // FUNC2 LP expr COMMA expr RP
  if (t.eType === T_FUNC2) {
    const fn = ts.advance();
    ts.expect(T_LP, 'expected \"(\"');
    const x = parseExpr(p, ts);
    ts.expect(T_COMMA, 'expected \",\"');
    const y = parseExpr(p, ts);
    ts.expect(T_RP, 'expected \")\"');
    return pikFunc(p, fn, x, y);
  }

  // DIST LP position COMMA position RP
  if (t.eType === T_DIST) {
    ts.advance();
    ts.expect(T_LP, 'expected \"(\"');
    const p1 = parsePosition(p, ts);
    ts.expect(T_COMMA, 'expected \",\"');
    const p2 = parsePosition(p, ts);
    ts.expect(T_RP, 'expected \")\"');
    return pikDist(p1, p2);
  }

  // LP expr RP  or  LP FILL|COLOR|THICKNESS RP
  if (t.eType === T_LP) {
    ts.advance();
    const inner = ts.peek();
    if ((inner.eType === T_FILL || inner.eType === T_COLOR || inner.eType === T_THICKNESS) &&
        ts.peekAhead(1).eType === T_RP) {
      const varTok = ts.advance();
      ts.advance(); // consume RP
      return pikGetVar(p, varTok);
    }
    const val = parseExpr(p, ts);
    ts.expect(T_RP, 'expected \")\"');
    return val;
  }

  // NTH VERTEX OF object.x/.y (vertex coordinates as expression)
  // e.g., "2nd vertex of 1st spline.x"
  if (t.eType === T_NTH && ts.peekAhead(1).eType === T_VERTEX) {
    const saved = ts.save();
    const savedErr = p.nErr;
    const savedOut = p.zOut;

    const nth = ts.advance(); // consume NTH
    const vertex = ts.advance(); // consume VERTEX
    ts.match(T_OF); // consume OF (optional)
    const obj = parseObject(p, ts);
    nth.eCode = pikNthValue(p, nth);

    if (p.nErr === 0 && obj && ts.peek().eType === T_DOT_XY) {
      ts.advance(); // consume dot
      const pt = pikNthVertex(p, nth, vertex, obj);
      if (ts.peek().eType === T_X) {
        ts.advance();
        return pt.x;
      } else if (ts.peek().eType === T_Y) {
        ts.advance();
        return pt.y;
      }
    }

    // Failed to parse as vertex expression, restore
    p.nErr = savedErr;
    p.zOut = savedOut;
    ts.restore(saved);
  }

  // place2.x or place2.y (object reference followed by DOT_XY)
  // object.property (object followed by DOT_L)
  // These overlap with each other and with variable/number parsing.
  // Handle: if we see something that starts an object reference (THIS, PLACENAME, NTH, LAST),
  // try to parse it as a place/object and check for DOT_XY or DOT_L suffix.
  if (isObjectStart(t)) {
    const saved = ts.save();
    const savedErr = p.nErr;
    const savedOut = p.zOut;

    // Try place2 first (for .x, .y access)
    // place2 = object [DOT_E edge] — NOT "edge OF object" form
    const obj = parseObject(p, ts);

    if (p.nErr === 0 && obj) {
      // Check for DOT_XY (place.x or place.y)
      if (ts.peek().eType === T_DOT_XY) {
        ts.advance(); // consume the dot
        // The next token should be X or Y
        if (ts.peek().eType === T_X) {
          ts.advance();
          return pikPlaceOfElem(p, obj, null).x;
        } else if (ts.peek().eType === T_Y) {
          ts.advance();
          return pikPlaceOfElem(p, obj, null).y;
        }
      }

      // Check for DOT_E then DOT_XY (place2 with edgename, then .x/.y)
      if (ts.peek().eType === T_DOT_E) {
        const dotSaved = ts.save();
        ts.advance(); // consume dot
        const edge = parseEdge(p, ts);
        if (ts.peek().eType === T_DOT_XY) {
          ts.advance(); // consume dot
          const pt = pikPlaceOfElem(p, obj, edge);
          if (ts.peek().eType === T_X) {
            ts.advance();
            return pt.x;
          } else if (ts.peek().eType === T_Y) {
            ts.advance();
            return pt.y;
          }
        }
        // Not .x/.y after edge, restore to before DOT_E
        ts.restore(dotSaved);
      }

      // Check for DOT_L property (object.height, etc.)
      if (ts.peek().eType === T_DOT_L) {
        ts.advance(); // consume the dot
        const prop = ts.peek();
        if (isNumProperty(prop.eType) || prop.eType === T_DOTTED || prop.eType === T_DASHED ||
            prop.eType === T_FILL || prop.eType === T_COLOR) {
          ts.advance();
          return pikPropertyOf(obj, prop);
        }
        pikError(p, prop, 'unknown property');
        return 0.0;
      }
    }

    // The object parsed but had no .x/.y/.property suffix.
    // This is not a valid expression primary. Restore and let it fail.
    p.nErr = savedErr;
    p.zOut = savedOut;
    ts.restore(saved);
  }

  pikError(p, t, 'expected expression');
  return 0.0;
}

// --------------------------------------------------------------------------
// Helper predicates
// --------------------------------------------------------------------------

function isDirection(eType: number): boolean {
  return eType === T_UP || eType === T_DOWN || eType === T_LEFT || eType === T_RIGHT;
}

function isLvalue(eType: number): boolean {
  return eType === T_ID || eType === T_FILL || eType === T_COLOR || eType === T_THICKNESS;
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
         t.eType === T_FUNC1 || t.eType === T_FUNC2 || t.eType === T_DIST ||
         t.eType === T_PLACENAME || t.eType === T_NTH || t.eType === T_LAST ||
         t.eType === T_THIS;
}

function isAttributeStart(t: PToken): boolean {
  // Tokens that unambiguously start an attribute (not an expression)
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
  // "of the way between" — only when OF is followed by THE
  if (t.eType === T_OF && ts) {
    const next = ts.peekAhead(1);
    return next.eType === T_THE;
  }
  return false;
}

function isPostRelexprKeyword(t: PToken): boolean {
  // Tokens that should follow an optrelexpr (so we should NOT consume them as expr)
  return t.eType === T_HEADING || t.eType === T_EDGEPT;
}
