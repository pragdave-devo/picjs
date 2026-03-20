// evaluator.ts — AST walker producing PObj list via existing layout API
// Part of the DSL overhaul (Phase 1B)

import {
  type PNum, type PPoint, type PRel, type PToken, type PObj, type PList, type Pik,
  TokenType, makeToken,
  pikError, pikAtof, pikDist, numToStr,
} from './types.ts';

import {
  pikValue, pikGetVar, pikLookupColor,
} from './constants.ts';

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

import { Environment } from './environment.ts';
import { mkNum, mkStr, mkBool, mkFn, mkList, toNumber, toString, valuesEqual, type PicValue } from './values.ts';

import type {
  AstStmt, AstShape, AstLabel, AstLabelPosition, AstForRange, AstForIn, AstFnCall,
  AstCase, AstIf, AstPrint, AstPrintItem, AstAssert, AstAssign, AstDefine, AstDirection,
  AstAttr, AstAttrNumeric, AstAttrColor, AstAttrDash, AstAttrBool,
  AstAttrText, AstAttrContaining, AstAttrPosition, AstAttrDirection, AstAttrWith, AstAttrSame,
  AstAttrBehind, AstAttrFit, AstAttrEvenWith, AstAttrFlag,
  AstRelExpr,
  AstExpr,
  AstPosition,
  AstPlace, AstObject,
} from './ast.ts';

const {
  T_FILL, T_COLOR, T_THICKNESS,
  T_EDGEPT, T_X, T_Y,
  T_ASSIGN, T_LAST,
} = TokenType;

// ============================================================
// String interpolation helper (same logic as parser.ts)
// ============================================================

function expandStringInterpolation(p: Pik, token: PToken): PToken {
  const str = token.z.substring(0, token.n);
  if (!str.includes('${')) return token;

  let result = '"';
  let i = 1;
  const end = token.n - 1;

  while (i < end) {
    if (str[i] === '$' && i + 1 < end && str[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < end && depth > 0) {
        if (str[j] === '{') depth++;
        else if (str[j] === '}') depth--;
        j++;
      }
      if (depth !== 0) {
        pikError(p, token, 'unterminated ${...} in string');
        return token;
      }
      const exprText = str.substring(i + 2, j - 1);
      const exprValue = evaluateInterpolationExpr(p, exprText, token);
      if (p.nErr) return token;
      result += exprValue;
      i = j;
    } else {
      result += str[i];
      i++;
    }
  }
  result += '"';
  return { z: result, n: result.length, eType: token.eType, eCode: token.eCode, eEdge: token.eEdge };
}

// Lazy-bound reference to parseToAst (set by integration layer to avoid circular imports)
let parseToAstFn: ((p: Pik, input: string) => AstStmt[]) | null = null;

export function setParseToAstFn(fn: (p: Pik, input: string) => AstStmt[]): void {
  parseToAstFn = fn;
}

function evaluateInterpolationExpr(p: Pik, exprText: string, errToken: PToken): string {
  if (p.nErr || !parseToAstFn) return '0';
  // Parse as an assignment so we get an expression AST
  const stmts = parseToAstFn(p, `_interp_result = ${exprText}`);
  if (p.nErr || stmts.length === 0) return '0';
  // Extract the expression from the assignment
  const stmt = stmts[0];
  if (stmt.kind === 'assign') {
    const val = evalRichExpr(p, stmt.value);
    return formatRichValue(val);
  }
  // Fallback: evaluate as statement and read numeric result
  for (const s of stmts) {
    evalStmt(p, s);
  }
  const val = pikValue(p, '_interp_result', 14);
  return formatNumericValue(val.miss ? 0 : val.val);
}

function formatRichValue(value: PicValue): string {
  switch (value.tag) {
    case "string": return value.val;
    case "boolean": return value.val ? "1" : "0";
    default: return formatNumericValue(toNumber(value));
  }
}

function formatNumericValue(value: PNum): string {
  if (Number.isNaN(value)) return 'NaN';
  if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }
  let s = value.toPrecision(10);
  if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  return s;
}

// ============================================================
// Environment for $-prefixed variables
// ============================================================

let currentEnv = new Environment();

export function resetEvalState(): void {
  currentEnv = new Environment();
}

// ============================================================
// Main evaluation entry point
// ============================================================

export function evaluate(p: Pik, stmts: AstStmt[]): PList | null {
  for (const stmt of stmts) {
    if (p.nErr) break;
    evalStmt(p, stmt);
  }
  return p.list;
}

// ============================================================
// Statement evaluation
// ============================================================

function evalStmt(p: Pik, stmt: AstStmt): void {
  if (p.nErr) return;

  switch (stmt.kind) {
    case "direction":
      pikSetDirection(p, stmt.dir);
      break;

    case "assign":
      evalAssign(p, stmt);
      break;

    case "define":
      evalDefine(p, stmt);
      break;

    case "shape":
      evalShape(p, stmt, null);
      break;

    case "label":
      evalLabel(p, stmt);
      break;

    case "for_range":
      evalForRange(p, stmt);
      break;

    case "for_in":
      evalForIn(p, stmt);
      break;

    case "fncall":
      evalFnCallStmt(p, stmt);
      break;

    case "case":
      evalCaseStmt(p, stmt);
      break;

    case "if":
      evalIfStmt(p, stmt);
      break;

    case "print":
      evalPrint(p, stmt);
      break;

    case "assert":
      evalAssertStmt(p, stmt);
      break;

    case "empty":
      break;
  }
}

// ============================================================
// Assignment
// ============================================================

function evalAssign(p: Pik, stmt: AstAssign): void {
  const name = stmt.name.z.substring(0, stmt.name.n);
  if (name[0] === '$') {
    // $-prefixed variable: store rich value in Environment
    const val = evalRichExpr(p, stmt.value);
    currentEnv.set(name, val);
  } else {
    // Old-style variable: store number in Pik
    const val = evalExpr(p, stmt.value);
    pikSetVar(p, stmt.name, val, stmt.op);
  }
}

// ============================================================
// Define (macro)
// ============================================================

function evalDefine(p: Pik, stmt: AstDefine): void {
  pikAddMacro(p, stmt.name, stmt.body);
}

// ============================================================
// Shape evaluation
// ============================================================

function evalShape(p: Pik, shape: AstShape, labelTok: PToken | null): void {
  if (p.nErr) return;

  let obj: PObj | null = null;

  if (shape.sublist) {
    // [...] sublist
    const savedList = p.list;
    const savedDir = p.eDir;
    p.list = null;
    evaluate(p, shape.sublist);
    const sublist = p.list;
    p.list = savedList;
    p.eDir = savedDir;
    obj = pikElemNew(p, null, null, sublist);
  } else if (shape.textTok) {
    // bare string
    const expanded = expandStringInterpolation(p, shape.textTok);
    expanded.eCode = shape.textPos;
    obj = pikElemNew(p, null, expanded, null);
  } else if (shape.classTok) {
    // class name
    obj = pikElemNew(p, shape.classTok, null, null);
  } else {
    // noop
    obj = pikElemNew(p, null, null, null);
  }

  if (p.nErr || !obj) return;

  // Label
  if (labelTok) {
    pikElemSetname(p, obj, labelTok);
  }

  // Leading relexpr (implicit direction distance)
  if (shape.leadingExpr) {
    const rel = evalRelExpr(p, shape.leadingExpr);
    pikAddDirection(p, null, rel);
  }

  // Attributes
  for (const attr of shape.attrs) {
    if (p.nErr) break;
    evalAttr(p, attr, obj);
  }

  if (p.nErr) return;
  pikAfterAddingAttributes(p, obj);
  pikElistAppend(p, p.list, obj);
}

// ============================================================
// Attribute evaluation
// ============================================================

function evalAttr(p: Pik, attr: AstAttr, obj: PObj): void {
  if (p.nErr) return;

  switch (attr.attrKind) {
    case "numeric": {
      const rel = evalRelExpr(p, attr.value);
      pikSetNumprop(p, attr.prop, rel);
      break;
    }
    case "color": {
      const val = evalExpr(p, attr.value);
      pikSetClrprop(p, attr.prop, val);
      break;
    }
    case "dash": {
      const val = attr.value ? evalExpr(p, attr.value) : null;
      pikSetDashed(p, attr.prop, val);
      break;
    }
    case "bool":
      evalBoolAttr(p, attr, obj);
      break;
    case "text": {
      const expanded = expandStringInterpolation(p, attr.tok);
      pikAddTxt(p, expanded, attr.posFlags);
      break;
    }
    case "containing": {
      const val = evalRichExpr(p, attr.expr);
      const str = toString(val);
      // Create a synthetic string token: "str"
      const quoted = `"${str}"`;
      const tok: PToken = { z: quoted, n: quoted.length, eType: 0, eCode: 0, eEdge: 0 };
      pikAddTxt(p, tok, attr.posFlags);
      break;
    }
    case "position":
      evalPositionAttr(p, attr, obj);
      break;
    case "direction":
      evalDirectionAttr(p, attr, obj);
      break;
    case "with":
      evalWithAttr(p, attr);
      break;
    case "same": {
      let other: PObj | null = null;
      if (attr.asObject) {
        other = resolveObject(p, attr.asObject);
      }
      pikSame(p, other, attr.tok);
      break;
    }
    case "behind": {
      const other = resolveObject(p, attr.object);
      if (other) pikBehind(p, other);
      break;
    }
    case "fit":
      pikSizeToFit(p, null, attr.tok, 3);
      break;
    case "even_with": {
      const pos = evalPosition(p, attr.position);
      pikEvenwith(p, attr.dirTok, pos);
      break;
    }
    case "flag":
      evalFlagAttr(p, attr, obj);
      break;
  }
}

function evalBoolAttr(p: Pik, attr: AstAttrBool, obj: PObj): void {
  switch (attr.prop) {
    case "cw":      obj.cw = true; break;
    case "ccw":     obj.cw = false; break;
    case "larrow":  obj.larrow = true; obj.rarrow = false; break;
    case "rarrow":  obj.larrow = false; obj.rarrow = true; break;
    case "lrarrow": obj.larrow = true; obj.rarrow = true; break;
    case "invis":   obj.sw = -0.00001; break;
    case "thick":   obj.sw *= 1.5; break;
    case "thin":    obj.sw *= 0.67; break;
    case "solid":
      obj.sw = pikValue(p, 'thickness', 9).val;
      obj.dotted = 0.0;
      obj.dashed = 0.0;
      break;
  }
}

function evalPositionAttr(p: Pik, attr: AstAttrPosition, obj: PObj): void {
  switch (attr.variant) {
    case "from": {
      const pos = evalPosition(p, attr.position);
      pikSetFrom(p, obj, attr.tok, pos);
      break;
    }
    case "to": {
      const pos = evalPosition(p, attr.position);
      pikAddTo(p, obj, attr.tok, pos);
      break;
    }
    case "at": {
      const pos = evalPosition(p, attr.position);
      pikSetAt(p, null, pos, attr.tok);
      break;
    }
    case "close":
      pikClosePath(p, attr.tok);
      break;
  }
}

function evalDirectionAttr(p: Pik, attr: AstAttrDirection, obj: PObj): void {
  if (attr.headingTok || attr.edgeptTok) {
    // Heading-based movement
    const rel = attr.value ? evalRelExpr(p, attr.value) : { rAbs: 0, rRel: 1.0 };
    const angle = attr.headingExpr ? evalExpr(p, attr.headingExpr) : 0;
    const errTok = attr.dirTok || attr.headingTok || attr.edgeptTok!;

    // If this came from "then", fire pikThen first
    // (handled via "then" flag in the attr list before this attr)

    pikMoveHdg(p, rel, attr.headingTok, angle, attr.edgeptTok, errTok);
  } else if (attr.dirTok) {
    const rel = attr.value ? evalRelExpr(p, attr.value) : { rAbs: 0, rRel: 1.0 };
    pikAddDirection(p, attr.dirTok, rel);
  }
}

function evalWithAttr(p: Pik, attr: AstAttrWith): void {
  const pos = evalPosition(p, attr.position);
  pikSetAt(p, attr.edge, pos, attr.edge || makeToken());
}

function evalFlagAttr(p: Pik, attr: AstAttrFlag, obj: PObj): void {
  switch (attr.name) {
    case "chop":
      obj.bChop = true;
      break;
    case "then":
      pikThen(p, attr.tok, obj);
      break;
    case "close":
      pikClosePath(p, attr.tok);
      break;
  }
}

// ============================================================
// Label evaluation
// ============================================================

function evalLabel(p: Pik, stmt: AstLabel): void {
  if (stmt.body.kind === "shape") {
    evalShape(p, stmt.body, stmt.name);
  } else {
    // label_position
    const pos = evalPosition(p, (stmt.body as AstLabelPosition).position);
    const obj = pikElemNew(p, null, null, null);
    if (obj) {
      obj.ptAt = pos;
      pikElemSetname(p, obj, stmt.name);
      pikAfterAddingAttributes(p, obj);
      pikElistAppend(p, p.list, obj);
    }
  }
}

// ============================================================
// For-loop evaluation
// ============================================================

const PIKCHR_LOOP_LIMIT = 10000;
let loopIterationCount = 0;

function checkIterationLimit(p: Pik, tok: PToken): boolean {
  if (++loopIterationCount > PIKCHR_LOOP_LIMIT) {
    pikError(p, tok, `loop exceeded ${PIKCHR_LOOP_LIMIT} iterations`);
    return false;
  }
  return true;
}

function evalForRange(p: Pik, stmt: AstForRange): void {
  loopIterationCount = 0;

  const startVal = evalExpr(p, stmt.start);
  const endVal = evalExpr(p, stmt.end);
  let stepVal = stmt.step ? evalExpr(p, stmt.step) : 1.0;

  if (endVal < startVal && stepVal > 0) stepVal = -stepVal;
  else if (endVal > startVal && stepVal < 0) stepVal = -stepVal;

  if (stepVal === 0) {
    pikError(p, stmt.varTok, 'step value cannot be zero');
    return;
  }

  const opToken = makeToken('=', 1, TokenType.T_ASSIGN);
  opToken.eCode = TokenType.T_ASSIGN;

  if (stepVal > 0) {
    for (let i = startVal; i <= endVal; i += stepVal) {
      if (!checkIterationLimit(p, stmt.varTok)) return;
      if (p.nErr) return;
      pikSetVar(p, stmt.varTok, i, opToken);
      evaluate(p, stmt.body);
    }
  } else {
    for (let i = startVal; i >= endVal; i += stepVal) {
      if (!checkIterationLimit(p, stmt.varTok)) return;
      if (p.nErr) return;
      pikSetVar(p, stmt.varTok, i, opToken);
      evaluate(p, stmt.body);
    }
  }
}

function evalForIn(p: Pik, stmt: AstForIn): void {
  loopIterationCount = 0;

  const opToken = makeToken('=', 1, TokenType.T_ASSIGN);
  opToken.eCode = TokenType.T_ASSIGN;

  for (const item of stmt.list) {
    if (!checkIterationLimit(p, stmt.varTok)) return;
    if (p.nErr) return;
    const val = evalExpr(p, item);
    pikSetVar(p, stmt.varTok, val, opToken);
    evaluate(p, stmt.body);
  }
}

// ============================================================
// Case evaluation
// ============================================================

function evalCaseStmt(p: Pik, stmt: AstCase): void {
  const val = evalRichExpr(p, stmt.expr);

  for (const arm of stmt.arms) {
    if (p.nErr) return;
    // null pattern = default arm (matches anything)
    if (arm.pattern === null) {
      evaluate(p, arm.body);
      return;
    }
    const patVal = evalRichExpr(p, arm.pattern);
    if (valuesEqual(val, patVal)) {
      evaluate(p, arm.body);
      return;
    }
  }
  // No match — do nothing
}

// ============================================================
// If evaluation
// ============================================================

function evalIfStmt(p: Pik, stmt: AstIf): void {
  const condVal = evalExpr(p, stmt.condition);
  if (p.nErr) return;

  // Truthy: non-zero number, or true boolean
  if (condVal !== 0) {
    evaluate(p, stmt.thenBody);
  } else if (stmt.elseBody) {
    evaluate(p, stmt.elseBody);
  }
}

// ============================================================
// Print evaluation
// ============================================================

function evalPrint(p: Pik, stmt: AstPrint): void {
  for (let i = 0; i < stmt.items.length; i++) {
    if (i > 0) p.zOut += ' ';
    const item = stmt.items[i];
    switch (item.tag) {
      case "string":
        p.zOut += item.tok.z.substring(1, item.tok.n - 1);
        break;
      case "property": {
        const val = pikValue(p, item.tok.z, item.tok.n).val;
        p.zOut += numToStr(val);
        break;
      }
      case "expr": {
        const val = evalExpr(p, item.expr);
        p.zOut += numToStr(val);
        break;
      }
    }
  }
  p.zOut += '<br>\n';
}

// ============================================================
// Assert evaluation
// ============================================================

function evalAssertStmt(p: Pik, stmt: AstAssert): void {
  if (stmt.variant === "expr") {
    const e1 = evalExpr(p, stmt.left as AstExpr);
    const e2 = evalExpr(p, stmt.right as AstExpr);
    pikAssert(p, e1, stmt.eqTok, e2);
  } else if (stmt.variant === "bool") {
    const val = evalExpr(p, stmt.left as AstExpr);
    if (val === 0) {
      pikError(p, stmt.eqTok, 'assertion failed');
    }
  } else {
    const p1 = evalPosition(p, stmt.left as AstPosition);
    const p2 = evalPosition(p, stmt.right as AstPosition);
    pikPositionAssert(p, p1, stmt.eqTok, p2);
  }
}

// ============================================================
// Expression evaluation
// ============================================================

function evalExpr(p: Pik, expr: AstExpr): PNum {
  if (p.nErr) return 0;

  switch (expr.exprKind) {
    case "number":
      return expr.value;

    case "varRef": {
      const vname = expr.tok.z.substring(0, expr.tok.n);
      if (vname[0] === '$') {
        const val = currentEnv.get(vname);
        if (val !== undefined) return toNumber(val);
      }
      // Fall back to old variable system (builtins like $pi, old-style vars)
      return pikGetVar(p, expr.tok);
    }

    case "colorName":
      return pikLookupColor(p, expr.tok);

    case "binOp": {
      const left = evalExpr(p, expr.left);
      const right = evalExpr(p, expr.right);
      switch (expr.op) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/":
          if (right === 0) {
            pikError(p, expr.tok, 'division by zero');
            return 0;
          }
          return left / right;
        case "%": return left % right;
      }
      return 0;
    }

    case "unaryOp": {
      const operand = evalExpr(p, expr.operand);
      return expr.op === "-" ? -operand : operand;
    }

    case "paren":
      return evalExpr(p, expr.expr);

    case "funcCall": {
      const args = expr.args.map(a => evalExpr(p, a));
      return pikFunc(p, expr.func, args[0] || 0, args[1] || 0, args[2] || 0);
    }

    case "dist": {
      const p1 = evalPosition(p, expr.p1);
      const p2 = evalPosition(p, expr.p2);
      return pikDist(p1, p2);
    }

    case "property": {
      const obj = resolveObject(p, expr.object);
      return pikPropertyOf(obj, expr.prop);
    }

    case "placeXY": {
      const pt = evalPlace(p, expr.place);
      return expr.axis === "x" ? pt.x : pt.y;
    }

    case "boolean":
      return expr.value ? 1 : 0;

    case "string":
      return 0;

    case "compare": {
      const cl = evalExpr(p, expr.left);
      const cr = evalExpr(p, expr.right);
      switch (expr.op) {
        case "==": return cl === cr ? 1 : 0;
        case "!=": return cl !== cr ? 1 : 0;
        case ">":  return cl > cr ? 1 : 0;
        case "<":  return cl < cr ? 1 : 0;
        case ">=": return cl >= cr ? 1 : 0;
        case "<=": return cl <= cr ? 1 : 0;
      }
      return 0;
    }

    case "logical": {
      if (expr.op === "not") {
        const val = evalExpr(p, expr.left);
        return val === 0 ? 1 : 0;
      }
      const ll = evalExpr(p, expr.left);
      if (expr.op === "and") {
        if (ll === 0) return 0;
        return evalExpr(p, expr.right!) !== 0 ? 1 : 0;
      }
      if (expr.op === "or") {
        if (ll !== 0) return 1;
        return evalExpr(p, expr.right!) !== 0 ? 1 : 0;
      }
      return 0;
    }

    case "fn":
      // fn expression in numeric context — returns 0
      return 0;

    case "userCall":
      return evalUserCall(p, expr.func, expr.args, expr.tok);

    case "list":
    case "index":
    case "builtinCall":
      // Phase 2+ feature — returns 0 in numeric context
      return 0;
  }

  return 0;
}

// ============================================================
// Rich expression evaluation (returns PicValue)
// ============================================================

function evalRichExpr(p: Pik, expr: AstExpr): PicValue {
  if (p.nErr) return mkNum(0);
  switch (expr.exprKind) {
    case "fn":
      return mkFn({
        params: expr.params.map(t => t.z.substring(0, t.n)),
        body: expr.body,
        closure: currentEnv,
      });
    case "boolean":
      return mkBool(expr.value);
    case "string":
      return mkStr(expr.value);
    case "list":
      return mkList(expr.items.map(item => evalRichExpr(p, item)));
    case "varRef": {
      const vname = expr.tok.z.substring(0, expr.tok.n);
      if (vname[0] === '$') {
        const val = currentEnv.get(vname);
        if (val !== undefined) return val;
      }
      return mkNum(evalExpr(p, expr));
    }
    default:
      return mkNum(evalExpr(p, expr));
  }
}

// ============================================================
// User function call
// ============================================================

function evalUserCall(p: Pik, funcExpr: AstExpr, args: AstExpr[], tok: PToken): PNum {
  const funcVal = evalRichExpr(p, funcExpr);
  if (funcVal.tag !== "function") {
    pikError(p, tok, 'not a function');
    return 0;
  }
  const fn = funcVal.val;

  // Create child environment from closure
  const callEnv = fn.closure ? fn.closure.child() : currentEnv.child();

  // Bind parameters
  for (let i = 0; i < fn.params.length; i++) {
    const argVal = i < args.length ? evalRichExpr(p, args[i]) : mkNum(0);
    callEnv.define(fn.params[i], argVal);
  }

  // Evaluate body in the new environment
  const savedEnv = currentEnv;
  currentEnv = callEnv;
  evaluate(p, fn.body);
  currentEnv = savedEnv;

  return 0; // functions don't return values in numeric context yet
}

// ============================================================
// Function call statement
// ============================================================

function evalFnCallStmt(p: Pik, stmt: AstFnCall): void {
  evalUserCall(p, stmt.func, stmt.args, stmt.tok);
}

// ============================================================
// Relative expression evaluation
// ============================================================

function evalRelExpr(p: Pik, rel: AstRelExpr): PRel {
  const val = evalExpr(p, rel.expr);
  if (rel.isPercent) {
    return { rAbs: 0, rRel: val / 100 };
  }
  return { rAbs: val, rRel: 0 };
}

// ============================================================
// Position evaluation
// ============================================================

function evalPosition(p: Pik, pos: AstPosition): PPoint {
  if (p.nErr) return { x: 0, y: 0 };

  switch (pos.posKind) {
    case "absolute": {
      const x = evalExpr(p, pos.x);
      const y = evalExpr(p, pos.y);
      return { x, y };
    }

    case "place":
      return evalPlace(p, pos.place);

    case "relative": {
      const base = evalPosition(p, pos.base);
      const dx = evalExpr(p, pos.dx);
      const dy = evalExpr(p, pos.dy);
      return { x: base.x + pos.sign * dx, y: base.y + pos.sign * dy };
    }

    case "between": {
      const frac = evalExpr(p, pos.fraction);
      const p1 = evalPosition(p, pos.p1);
      const p2 = evalPosition(p, pos.p2);
      return pikPositionBetween(frac, p1, p2);
    }

    case "distDir": {
      const dist = evalExpr(p, pos.distance);
      const of = evalPosition(p, pos.of);
      switch (pos.direction) {
        case "above": return { x: of.x, y: of.y + dist };
        case "below": return { x: of.x, y: of.y - dist };
        case "left":  return { x: of.x - dist, y: of.y };
        case "right": return { x: of.x + dist, y: of.y };
        case "heading": {
          const angle = pos.headingExpr ? evalExpr(p, pos.headingExpr) : 0;
          return pikPositionAtAngle(dist, angle, of);
        }
        case "edgept":
          return pikPositionAtHdg(dist, pos.edgeptTok!, of);
      }
      return of;
    }

    case "composite": {
      const xFrom = evalPosition(p, pos.xFrom);
      const yFrom = evalPosition(p, pos.yFrom);
      return { x: xFrom.x, y: yFrom.y };
    }

    case "paren":
      return evalPosition(p, pos.inner);
  }
}

// ============================================================
// Place evaluation
// ============================================================

function evalPlace(p: Pik, place: AstPlace): PPoint {
  const obj = resolveObject(p, place.object);
  return pikPlaceOfElem(p, obj, place.edge);
}

// ============================================================
// Object resolution
// ============================================================

function resolveObject(p: Pik, astObj: AstObject): PObj | null {
  if (p.nErr) return null;

  switch (astObj.objKind) {
    case "this":
      return p.cur;

    case "named": {
      let obj = pikFindByname(p, null, astObj.names[0]);
      for (let i = 1; i < astObj.names.length && p.nErr === 0; i++) {
        obj = pikFindByname(p, obj, astObj.names[i]);
      }
      return obj;
    }

    case "nth": {
      let basis: PObj | null = null;
      if (astObj.inObject) {
        basis = resolveObject(p, astObj.inObject);
      }
      // Set eCode on classTok for pikFindNth
      const nthTok = { ...astObj.classTok };
      return pikFindNth(p, basis, nthTok);
    }
  }
}
