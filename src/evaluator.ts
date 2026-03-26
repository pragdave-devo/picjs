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
import { mkNum, mkStr, mkBool, mkPos, mkFn, mkList, mkObj, mkAnim, mkNull, toNumber, toString, toBoolean, valuesEqual, applyBinOp, type PicValue, type PicFunction, type BinOp } from './values.ts';

import type {
  AstStmt, AstShape, AstLabel, AstLabelPosition, AstForRange, AstForIn, AstFnCall,
  AstCase, AstIf, AstPrint, AstPrintItem, AstAssert, AstAssign, AstDefine, AstDirection,
  AstAnimation, AstAlter,
  AstAttr, AstAttrNumeric, AstAttrColor, AstAttrDash, AstAttrBool,
  AstAttrText, AstAttrContaining, AstAttrPosition, AstAttrDirection, AstAttrWith, AstAttrSame,
  AstAttrBehind, AstAttrFit, AstAttrEvenWith, AstAttrFlag,
  AstRelExpr,
  AstExpr,
  AstPosition,
  AstPlace, AstObject,
} from './ast.ts';

import type { AnimationDescriptor, AlterDescriptor, AlterableProperty } from './animation.ts';
import { resolveAnimTiming } from './animation.ts';

const {
  T_FILL, T_COLOR, T_THICKNESS,
  T_EDGEPT, T_X, T_Y,
  T_ASSIGN, T_LAST,
  T_CENTER, T_TOP, T_BOTTOM, T_START, T_END, T_RIGHT, T_LEFT,
} = TokenType;

// Lazy-bound reference to parseToAst (set by integration layer to avoid circular imports)
let parseToAstFn: ((p: Pik, input: string) => AstStmt[]) | null = null;

export function setParseToAstFn(fn: (p: Pik, input: string) => AstStmt[]): void {
  parseToAstFn = fn;
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

// Animation registry
let animationList: AnimationDescriptor[] = [];
let animIdCounter = 0;
let evalDepth = 0;

export function resetAnimations(): void {
  animationList = [];
  animIdCounter = 0;
}

export function getAnimations(): AnimationDescriptor[] {
  return animationList;
}

function generateAnimId(): string {
  return `anim-${++animIdCounter}`;
}

export function evaluate(p: Pik, stmts: AstStmt[]): PicValue {
  const isTopLevel = evalDepth === 0;
  if (isTopLevel) {
    resetAnimations();
  }
  evalDepth++;
  let lastValue: PicValue = mkNull();
  for (const stmt of stmts) {
    if (p.nErr) break;
    lastValue = evalStmt(p, stmt);
  }
  evalDepth--;
  return lastValue;
}

// ============================================================
// Statement evaluation
// ============================================================

function evalStmt(p: Pik, stmt: AstStmt): PicValue {
  if (p.nErr) return mkNull();

  switch (stmt.kind) {
    case "direction":
      pikSetDirection(p, stmt.dir);
      return mkNull();

    case "assign":
      return evalAssign(p, stmt);

    case "define":
      evalDefine(p, stmt);
      return mkNull();

    case "shape":
      return evalShape(p, stmt, null);

    case "label":
      return evalLabel(p, stmt);

    case "for_range":
      return evalForRange(p, stmt);

    case "for_in":
      return evalForIn(p, stmt);

    case "fncall":
      return evalFnCallStmt(p, stmt);

    case "case":
      return evalCaseStmt(p, stmt);

    case "if":
      return evalIfStmt(p, stmt);

    case "print":
      evalPrint(p, stmt);
      return mkNull();

    case "assert":
      evalAssertStmt(p, stmt);
      return mkNull();

    case "animation":
      return evalAnimationStmt(p, stmt);

    case "empty":
      return mkNull();
  }
}

// ============================================================
// Assignment
// ============================================================

function evalAssign(p: Pik, stmt: AstAssign): PicValue {
  const name = stmt.name.z.substring(0, stmt.name.n);
  if (name[0] === '$') {
    // $-prefixed variable: store rich value in Environment
    const val = evalRichExpr(p, stmt.value);
    currentEnv.set(name, val);
    return val;
  } else {
    // Old-style variable: store number in Pik
    const val = evalExpr(p, stmt.value);
    pikSetVar(p, stmt.name, val, stmt.op);
    return mkNum(val);
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

function evalShape(p: Pik, shape: AstShape, labelTok: PToken | null): PicValue {
  if (p.nErr) return mkNull();

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
    // bare string (interpolation handled at tokenizer level)
    const tok = { ...shape.textTok, eCode: shape.textPos };
    obj = pikElemNew(p, null, tok, null);
  } else if (shape.classTok) {
    // class name
    obj = pikElemNew(p, shape.classTok, null, null);
  } else {
    // noop
    obj = pikElemNew(p, null, null, null);
  }

  if (p.nErr || !obj) return mkNull();

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

  if (p.nErr) return mkNull();

  // Apply auto-chop only if BOTH endpoints reference objects without explicit edges
  const pending = autoChopPending.get(obj);
  if (pending && pending.start && pending.end) {
    obj.bChopStart = true;
    obj.bChopEnd = true;
  }
  autoChopPending.delete(obj);

  pikAfterAddingAttributes(p, obj);
  pikElistAppend(p, p.list, obj);
  return mkObj(obj);
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
      // Interpolation handled at tokenizer level
      pikAddTxt(p, attr.tok, attr.posFlags);
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

function resolvePositionObject(p: Pik, pos: AstPosition): PObj | null {
  if (pos.posKind === 'place') return resolveObject(p, pos.place.object);
  if (pos.posKind === 'paren') return resolvePositionObject(p, pos.inner);
  return null;
}

// Check if a position references an object without an explicit edge
// (i.e., "from A" not "from A.n" or "from A.c")
function shouldChopAtPosition(pos: AstPosition): boolean {
  if (pos.posKind === 'place') {
    // Chop only if no explicit edge specified
    return pos.place.edge === null;
  }
  if (pos.posKind === 'paren') {
    return shouldChopAtPosition(pos.inner);
  }
  // Coordinates, between, etc. - no chop
  return false;
}

// Track which endpoints should be auto-chopped per object
// Key: object reference, Value: { start: boolean, end: boolean }
const autoChopPending = new WeakMap<PObj, { start: boolean; end: boolean }>();

function evalPositionAttr(p: Pik, attr: AstAttrPosition, obj: PObj): void {
  switch (attr.variant) {
    case "from": {
      const refObj = resolvePositionObject(p, attr.position);
      const pos = evalPosition(p, attr.position);
      pikSetFrom(p, obj, attr.tok, pos);
      if (refObj && !obj.pFrom) obj.pFrom = refObj;
      // Mark pending chop at start if no explicit edge was specified
      if (refObj && shouldChopAtPosition(attr.position)) {
        const pending = autoChopPending.get(obj) || { start: false, end: false };
        pending.start = true;
        autoChopPending.set(obj, pending);
      }
      break;
    }
    case "to": {
      const refObj = resolvePositionObject(p, attr.position);
      const pos = evalPosition(p, attr.position);
      pikAddTo(p, obj, attr.tok, pos);
      if (refObj && !obj.pTo) obj.pTo = refObj;
      // Mark pending chop at end if no explicit edge was specified
      if (refObj && shouldChopAtPosition(attr.position)) {
        const pending = autoChopPending.get(obj) || { start: false, end: false };
        pending.end = true;
        autoChopPending.set(obj, pending);
      }
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

function evalLabel(p: Pik, stmt: AstLabel): PicValue {
  if (stmt.body.kind === "shape") {
    return evalShape(p, stmt.body, stmt.name);
  } else {
    // label_position
    const pos = evalPosition(p, (stmt.body as AstLabelPosition).position);
    const obj = pikElemNew(p, null, null, null);
    if (obj) {
      obj.ptAt = pos;
      pikElemSetname(p, obj, stmt.name);
      pikAfterAddingAttributes(p, obj);
      pikElistAppend(p, p.list, obj);
      return mkObj(obj);
    }
    return mkNull();
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

function evalForRange(p: Pik, stmt: AstForRange): PicValue {
  loopIterationCount = 0;

  const startVal = evalExpr(p, stmt.start);
  const endVal = evalExpr(p, stmt.end);
  let stepVal = stmt.step ? evalExpr(p, stmt.step) : 1.0;

  if (endVal < startVal && stepVal > 0) stepVal = -stepVal;
  else if (endVal > startVal && stepVal < 0) stepVal = -stepVal;

  if (stepVal === 0) {
    pikError(p, stmt.varTok, 'step value cannot be zero');
    return mkNull();
  }

  const opToken = makeToken('=', 1, TokenType.T_ASSIGN);
  opToken.eCode = TokenType.T_ASSIGN;

  let lastValue: PicValue = mkNull();
  if (stepVal > 0) {
    for (let i = startVal; i <= endVal; i += stepVal) {
      if (!checkIterationLimit(p, stmt.varTok)) return mkNull();
      if (p.nErr) return mkNull();
      pikSetVar(p, stmt.varTok, i, opToken);
      lastValue = evaluate(p, stmt.body);
    }
  } else {
    for (let i = startVal; i >= endVal; i += stepVal) {
      if (!checkIterationLimit(p, stmt.varTok)) return mkNull();
      if (p.nErr) return mkNull();
      pikSetVar(p, stmt.varTok, i, opToken);
      lastValue = evaluate(p, stmt.body);
    }
  }
  return lastValue;
}

function evalForIn(p: Pik, stmt: AstForIn): PicValue {
  loopIterationCount = 0;

  const opToken = makeToken('=', 1, TokenType.T_ASSIGN);
  opToken.eCode = TokenType.T_ASSIGN;

  // Build the list to iterate over
  let items: PicValue[] = [];
  for (const item of stmt.list) {
    const val = evalRichExpr(p, item);
    if (p.nErr) return mkNull();
    // If the item evaluates to a list (e.g., range or list variable), flatten it
    if (val.tag === 'list') {
      items = items.concat(val.val);
    } else {
      items.push(val);
    }
  }

  // Check if loop variable is $-prefixed (uses environment for rich values)
  const varName = stmt.varTok.z.substring(0, stmt.varTok.n);
  const useEnv = varName[0] === '$';

  // Iterate
  let lastValue: PicValue = mkNull();
  for (const item of items) {
    if (!checkIterationLimit(p, stmt.varTok)) return mkNull();
    if (p.nErr) return mkNull();
    if (useEnv) {
      currentEnv.set(varName, item);
    } else {
      const val = toNumber(item);
      pikSetVar(p, stmt.varTok, val, opToken);
    }
    lastValue = evaluate(p, stmt.body);
  }
  return lastValue;
}

// ============================================================
// Case evaluation
// ============================================================

function evalCaseStmt(p: Pik, stmt: AstCase): PicValue {
  const val = evalRichExpr(p, stmt.expr);

  for (const arm of stmt.arms) {
    if (p.nErr) return mkNull();
    // null pattern = default arm (matches anything)
    if (arm.pattern === null) {
      return evaluate(p, arm.body);
    }
    const patVal = evalRichExpr(p, arm.pattern);
    if (valuesEqual(val, patVal)) {
      return evaluate(p, arm.body);
    }
  }
  // No match — return null
  return mkNull();
}

// ============================================================
// If evaluation
// ============================================================

function evalIfStmt(p: Pik, stmt: AstIf): PicValue {
  const condVal = evalExpr(p, stmt.condition);
  if (p.nErr) return mkNull();

  // Truthy: non-zero number, or true boolean
  if (condVal !== 0) {
    return evaluate(p, stmt.thenBody);
  } else if (stmt.elseBody) {
    return evaluate(p, stmt.elseBody);
  }
  return mkNull();
}

// ============================================================
// Print evaluation
// ============================================================

function evalPrint(p: Pik, stmt: AstPrint): void {
  for (let i = 0; i < stmt.items.length; i++) {
    if (i > 0) p.printOutput += ' ';
    const item = stmt.items[i];
    switch (item.tag) {
      case "string":
        p.printOutput += item.tok.z.substring(1, item.tok.n - 1);
        break;
      case "property": {
        const val = pikValue(p, item.tok.z, item.tok.n).val;
        p.printOutput += numToStr(val);
        break;
      }
      case "expr": {
        const val = evalRichExpr(p, item.expr);
        p.printOutput += toString(val);
        break;
      }
    }
  }
  p.printOutput += '\n';
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
      // For +, check if operands are lists or strings for concatenation
      if (expr.op === "+") {
        const leftVal = evalRichExpr(p, expr.left);
        const rightVal = evalRichExpr(p, expr.right);
        // List concatenation
        if (leftVal.tag === 'list' && rightVal.tag === 'list') {
          return toNumber(mkList([...leftVal.val, ...rightVal.val]));
        }
        // String concatenation
        if (leftVal.tag === 'string' || rightVal.tag === 'string') {
          return 0; // String result can't be represented as number
        }
        // Numeric addition
        return toNumber(leftVal) + toNumber(rightVal);
      }
      const left = evalExpr(p, expr.left);
      const right = evalExpr(p, expr.right);
      switch (expr.op) {
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
      // List/index in numeric context — returns 0
      return 0;

    case "builtinCall": {
      const result = evalBuiltinCall(p, expr.name, expr.args, expr.tok);
      return toNumber(result);
    }

    case "dollarProp": {
      // Evaluate via evalRichExpr and convert to number
      return toNumber(evalRichExpr(p, expr));
    }
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
    case "index": {
      const obj = evalRichExpr(p, expr.object);
      const idx = Math.round(toNumber(evalRichExpr(p, expr.index)));
      if (obj.tag === 'list') {
        if (idx < 0 || idx >= obj.val.length) {
          pikError(p, expr.tok, `index ${idx} out of bounds (length ${obj.val.length})`);
          return mkNum(0);
        }
        return obj.val[idx];
      }
      if (obj.tag === 'string') {
        if (idx < 0 || idx >= obj.val.length) {
          pikError(p, expr.tok, `index ${idx} out of bounds (length ${obj.val.length})`);
          return mkStr('');
        }
        return mkStr(obj.val[idx]);
      }
      pikError(p, expr.tok, `cannot index ${obj.tag}`);
      return mkNum(0);
    }
    case "varRef": {
      const vname = expr.tok.z.substring(0, expr.tok.n);
      if (vname[0] === '$') {
        const val = currentEnv.get(vname);
        if (val !== undefined) return val;
      }
      return mkNum(evalExpr(p, expr));
    }
    case "builtinCall":
      return evalBuiltinCall(p, expr.name, expr.args, expr.tok);
    case "userCall":
      return evalUserCallRich(p, expr.func, expr.args, expr.tok);
    case "range":
      return evalRangeExpr(p, expr);
    case "dollarProp": {
      const vname = expr.varTok.z.substring(0, expr.varTok.n);
      const val = currentEnv.get(vname);
      if (!val) {
        pikError(p, expr.varTok, `undefined variable '${vname}'`);
        return mkNum(0);
      }
      const propName = expr.propTok.z.substring(0, expr.propTok.n);
      if (val.tag === 'animation') {
        const timing = resolveAnimTiming(val.val);
        switch (propName) {
          case 'start':    return mkNum(timing.start);
          case 'end':      return mkNum(timing.end);
          case 'duration': return mkNum(val.val.duration);
          default:
            pikError(p, expr.propTok, `animation has no property '${propName}'`);
            return mkNum(0);
        }
      }
      if (val.tag === 'obj') {
        // Compass edge access: $var.n, $var.ne, etc.
        const pt = pikPlaceOfElem(p, val.val, expr.propTok);
        return mkPos(pt.x, pt.y);
      }
      pikError(p, expr.propTok, `cannot access property '${propName}' on ${val.tag} value`);
      return mkNum(0);
    }
    case "paren":
      return evalRichExpr(p, expr.expr);
    case "posLiteral": {
      const x = toNumber(evalRichExpr(p, expr.x));
      const y = toNumber(evalRichExpr(p, expr.y));
      return mkPos(x, y);
    }
    case "objRef": {
      const obj = resolveObject(p, expr.object);
      if (obj) return mkObj(obj);
      return mkNull();
    }
    case "binOp": {
      const leftVal = evalRichExpr(p, expr.left);
      const rightVal = evalRichExpr(p, expr.right);
      // Try double dispatch first
      const result = applyBinOp(expr.op as BinOp, leftVal, rightVal);
      if (result !== null) return result;
      // Fallback: string coercion for + (e.g., number + string)
      if (expr.op === '+' && (leftVal.tag === 'string' || rightVal.tag === 'string')) {
        return mkStr(toString(leftVal) + toString(rightVal));
      }
      // Fallback: numeric evaluation
      return mkNum(evalExpr(p, expr));
    }
    case "property": {
      const obj = resolveObject(p, expr.object);
      if (!obj) return mkNum(0);
      // Check if it's a compass edge - return position
      const eType = expr.prop.eType;
      if (eType === T_CENTER || eType === T_EDGEPT ||
          eType === T_TOP || eType === T_BOTTOM ||
          eType === T_START || eType === T_END ||
          eType === T_RIGHT || eType === T_LEFT) {
        const pt = pikPlaceOfElem(p, obj, expr.prop);
        return mkPos(pt.x, pt.y);
      }
      // Numeric property
      return mkNum(pikPropertyOf(obj, expr.prop));
    }
    default:
      return mkNum(evalExpr(p, expr));
  }
}

// ============================================================
// Range expression evaluation
// ============================================================

const MAX_RANGE_LENGTH = 40;

function evalRangeExpr(p: Pik, expr: { start: any; end: any; tok: any }): PicValue {
  const startVal = evalRichExpr(p, expr.start);
  const endVal = evalRichExpr(p, expr.end);
  if (p.nErr) return mkList([]);

  // Numeric range
  if (startVal.tag === 'number' && endVal.tag === 'number') {
    const start = Math.round(startVal.val);
    const end = Math.round(endVal.val);
    const step = start <= end ? 1 : -1;
    const count = Math.abs(end - start) + 1;
    if (count > MAX_RANGE_LENGTH) {
      pikError(p, expr.tok, `range exceeds maximum of ${MAX_RANGE_LENGTH} elements`);
      return mkList([]);
    }
    const result: PicValue[] = [];
    for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
      result.push(mkNum(i));
    }
    return mkList(result);
  }

  // String range
  if (startVal.tag === 'string' && endVal.tag === 'string') {
    const startStr = startVal.val;
    const endStr = endVal.val;

    // Single character range
    if (startStr.length === 1 && endStr.length === 1) {
      const startCode = startStr.charCodeAt(0);
      const endCode = endStr.charCodeAt(0);
      const step = startCode <= endCode ? 1 : -1;
      const count = Math.abs(endCode - startCode) + 1;
      if (count > MAX_RANGE_LENGTH) {
        pikError(p, expr.tok, `range exceeds maximum of ${MAX_RANGE_LENGTH} elements`);
        return mkList([]);
      }
      const result: PicValue[] = [];
      for (let c = startCode; step > 0 ? c <= endCode : c >= endCode; c += step) {
        result.push(mkStr(String.fromCharCode(c)));
      }
      return mkList(result);
    }

    // Multi-char string range: prefix must match, vary last char
    if (startStr.length === endStr.length && startStr.length > 1) {
      const prefix = startStr.slice(0, -1);
      const endPrefix = endStr.slice(0, -1);
      if (prefix === endPrefix) {
        const startCode = startStr.charCodeAt(startStr.length - 1);
        const endCode = endStr.charCodeAt(endStr.length - 1);
        const step = startCode <= endCode ? 1 : -1;
        const count = Math.abs(endCode - startCode) + 1;
        if (count > MAX_RANGE_LENGTH) {
          pikError(p, expr.tok, `range exceeds maximum of ${MAX_RANGE_LENGTH} elements`);
          return mkList([]);
        }
        const result: PicValue[] = [];
        for (let c = startCode; step > 0 ? c <= endCode : c >= endCode; c += step) {
          result.push(mkStr(prefix + String.fromCharCode(c)));
        }
        return mkList(result);
      }
    }

    pikError(p, expr.tok, 'string range must be single chars or have matching prefix');
    return mkList([]);
  }

  pikError(p, expr.tok, 'range requires two numbers or two strings');
  return mkList([]);
}

// ============================================================
// Builtin list/string function calls
// ============================================================

function evalBuiltinCall(p: Pik, name: string, args: AstExpr[], tok: PToken): PicValue {
  const evaledArgs = args.map(a => evalRichExpr(p, a));
  if (p.nErr) return mkNum(0);

  switch (name) {
    case 'len': {
      const arg = evaledArgs[0];
      if (arg.tag === 'list') return mkNum(arg.val.length);
      if (arg.tag === 'string') return mkNum(arg.val.length);
      pikError(p, tok, 'len() expects a list or string');
      return mkNum(0);
    }

    case 'head': {
      const arg = evaledArgs[0];
      if (arg.tag === 'list') {
        if (arg.val.length === 0) {
          pikError(p, tok, 'head() called on empty list');
          return mkNum(0);
        }
        return arg.val[0];
      }
      pikError(p, tok, 'head() expects a list');
      return mkNum(0);
    }

    case 'last': {
      const arg = evaledArgs[0];
      if (arg.tag === 'list') {
        if (arg.val.length === 0) {
          pikError(p, tok, 'last() called on empty list');
          return mkNum(0);
        }
        return arg.val[arg.val.length - 1];
      }
      pikError(p, tok, 'last() expects a list');
      return mkNum(0);
    }

    case 'pop': {
      const arg = evaledArgs[0];
      if (arg.tag === 'list') {
        if (arg.val.length === 0) return mkList([]);
        return mkList(arg.val.slice(0, -1));
      }
      pikError(p, tok, 'pop() expects a list');
      return mkList([]);
    }

    case 'shift': {
      const arg = evaledArgs[0];
      if (arg.tag === 'list') {
        if (arg.val.length === 0) return mkList([]);
        return mkList(arg.val.slice(1));
      }
      pikError(p, tok, 'shift() expects a list');
      return mkList([]);
    }

    case 'reverse': {
      const arg = evaledArgs[0];
      if (arg.tag === 'list') {
        return mkList([...arg.val].reverse());
      }
      if (arg.tag === 'string') {
        return mkStr([...arg.val].reverse().join(''));
      }
      pikError(p, tok, 'reverse() expects a list or string');
      return mkList([]);
    }

    case 'push': {
      const list = evaledArgs[0];
      const val = evaledArgs[1];
      if (list.tag === 'list') {
        return mkList([...list.val, val]);
      }
      pikError(p, tok, 'push() expects a list as first argument');
      return mkList([]);
    }

    case 'unshift': {
      const list = evaledArgs[0];
      const val = evaledArgs[1];
      if (list.tag === 'list') {
        return mkList([val, ...list.val]);
      }
      pikError(p, tok, 'unshift() expects a list as first argument');
      return mkList([]);
    }

    case 'lset': {
      const list = evaledArgs[0];
      const idx = Math.round(toNumber(evaledArgs[1]));
      const val = evaledArgs[2];
      if (list.tag !== 'list') {
        pikError(p, tok, 'lset() expects a list as first argument');
        return mkList([]);
      }
      if (idx < 0 || idx >= list.val.length) {
        pikError(p, tok, `lset() index ${idx} out of bounds (length ${list.val.length})`);
        return list;
      }
      const newList = [...list.val];
      newList[idx] = val;
      return mkList(newList);
    }

    case 'contains': {
      const list = evaledArgs[0];
      const val = evaledArgs[1];
      if (list.tag === 'list') {
        for (const item of list.val) {
          if (valuesEqual(item, val)) return mkBool(true);
        }
        return mkBool(false);
      }
      if (list.tag === 'string' && val.tag === 'string') {
        return mkBool(list.val.includes(val.val));
      }
      pikError(p, tok, 'contains() expects a list or string as first argument');
      return mkBool(false);
    }

    case 'join': {
      const list = evaledArgs[0];
      const sep = evaledArgs[1];
      if (list.tag !== 'list') {
        pikError(p, tok, 'join() expects a list as first argument');
        return mkStr('');
      }
      const sepStr = sep.tag === 'string' ? sep.val : toString(sep);
      const parts = list.val.map(v => toString(v));
      return mkStr(parts.join(sepStr));
    }

    case 'split': {
      const str = evaledArgs[0];
      const sep = evaledArgs[1];
      if (str.tag !== 'string') {
        pikError(p, tok, 'split() expects a string as first argument');
        return mkList([]);
      }
      const sepStr = sep.tag === 'string' ? sep.val : toString(sep);
      const parts = str.val.split(sepStr);
      return mkList(parts.map(s => mkStr(s)));
    }

    case 'map': {
      const list = evaledArgs[0];
      const fn = evaledArgs[1];
      if (list.tag !== 'list') {
        pikError(p, tok, 'map() expects a list as first argument');
        return mkList([]);
      }
      if (fn.tag !== 'function') {
        pikError(p, tok, 'map() expects a function as second argument');
        return mkList([]);
      }
      const result: PicValue[] = [];
      for (const item of list.val) {
        const mapped = applyFunction(p, fn.val, [item], tok);
        if (p.nErr) return mkList([]);
        result.push(mapped);
      }
      return mkList(result);
    }

    case 'filter': {
      const list = evaledArgs[0];
      const fn = evaledArgs[1];
      if (list.tag !== 'list') {
        pikError(p, tok, 'filter() expects a list as first argument');
        return mkList([]);
      }
      if (fn.tag !== 'function') {
        pikError(p, tok, 'filter() expects a function as second argument');
        return mkList([]);
      }
      const result: PicValue[] = [];
      for (const item of list.val) {
        const keep = applyFunction(p, fn.val, [item], tok);
        if (p.nErr) return mkList([]);
        if (toBoolean(keep)) {
          result.push(item);
        }
      }
      return mkList(result);
    }

    case 'sort': {
      const list = evaledArgs[0];
      if (list.tag !== 'list') {
        pikError(p, tok, 'sort() expects a list');
        return mkList([]);
      }
      const sorted = [...list.val].sort((a, b) => {
        // Sort by numeric value if both are numbers
        if (a.tag === 'number' && b.tag === 'number') {
          return a.val - b.val;
        }
        // Otherwise sort by string representation
        return toString(a).localeCompare(toString(b));
      });
      return mkList(sorted);
    }

    default:
      pikError(p, tok, `unknown builtin function: ${name}`);
      return mkNum(0);
  }
}

// ============================================================
// Apply function helper (for map/filter)
// ============================================================

function applyFunction(p: Pik, fn: PicFunction, args: PicValue[], tok: PToken): PicValue {
  // Create child environment from closure
  const callEnv = fn.closure ? fn.closure.child() : currentEnv.child();

  // Bind parameters
  for (let i = 0; i < fn.params.length; i++) {
    const argVal = i < args.length ? args[i] : mkNum(0);
    callEnv.define(fn.params[i], argVal);
  }

  // Evaluate body in the new environment and return last value
  const savedEnv = currentEnv;
  currentEnv = callEnv;
  const result = evaluate(p, fn.body);
  currentEnv = savedEnv;

  return result;
}

// ============================================================
// User function call
// ============================================================

function evalUserCallRich(p: Pik, funcExpr: AstExpr, args: AstExpr[], tok: PToken): PicValue {
  const funcVal = evalRichExpr(p, funcExpr);
  if (funcVal.tag !== "function") {
    pikError(p, tok, 'not a function');
    return mkNull();
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
  const result = evaluate(p, fn.body);
  currentEnv = savedEnv;

  return result;
}

function evalUserCall(p: Pik, funcExpr: AstExpr, args: AstExpr[], tok: PToken): PNum {
  const result = evalUserCallRich(p, funcExpr, args, tok);
  return toNumber(result);
}

// ============================================================
// Function call statement
// ============================================================

function evalFnCallStmt(p: Pik, stmt: AstFnCall): PicValue {
  return evalUserCallRich(p, stmt.func, stmt.args, stmt.tok);
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
  // Set lastRef so pikSetFrom/pikAddTo can establish pFrom/pTo references
  if (obj) p.lastRef = obj;
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

    case "expr": {
      const val = evalRichExpr(p, astObj.expr);
      if (val.tag === 'obj') return val.val;
      pikError(p, astObj.expr.tok || makeToken(), `expected object, got ${val.tag}`);
      return null;
    }
  }
}

// ============================================================
// Animation evaluation
// ============================================================

function evalAnimationStmt(p: Pik, stmt: AstAnimation): PicValue {
  if (p.nErr) return mkNull();

  // Evaluate timing
  const startTime = stmt.startExpr ? evalExpr(p, stmt.startExpr) : null;
  const endTime = stmt.endExpr ? evalExpr(p, stmt.endExpr) : null;
  const duration = stmt.durationExpr ? evalExpr(p, stmt.durationExpr) : 1.0;
  const bounceStart = stmt.bounceStart ? evalExpr(p, stmt.bounceStart) : 0;
  const bounceEnd = stmt.bounceEnd ? evalExpr(p, stmt.bounceEnd) : 0;

  // Evaluate alter statements
  const alterations: AlterDescriptor[] = [];
  for (const alter of stmt.body) {
    const descs = evalAlterStmt(p, alter);
    alterations.push(...descs);
  }

  const id = stmt.id || generateAnimId();

  const anim: AnimationDescriptor = {
    id,
    startTime,
    endTime,
    duration,
    easeIn: stmt.easeIn || 'linear',
    easeOut: stmt.easeOut || 'linear',
    bounceStart,
    bounceEnd,
    alterations,
  };

  // Register in global animation list
  animationList.push(anim);

  // If assigned to a variable, store in environment
  if (stmt.id) {
    currentEnv.set(stmt.id, mkAnim(anim));
  }

  return mkAnim(anim);
}

function evalAlterStmt(p: Pik, alter: AstAlter): AlterDescriptor[] {
  if (p.nErr) return [];

  // Resolve the target object
  const obj = resolveObject(p, alter.target.object);
  if (!obj) {
    pikError(p, alter.tok, 'alter target object not found');
    return [];
  }

  // Assign an animId if not already set
  if (!obj.animId) {
    obj.animId = obj.zName || `${obj.type.zName}-${p.list ? p.list.a.indexOf(obj) + 1 : 0}`;
  }

  // Evaluate to-value - check if it's an AstPosition or AstExpr
  const isAstPosition = 'posKind' in alter.toValue;
  let toRichValue: PicValue;
  if (isAstPosition) {
    const pos = evalPosition(p, alter.toValue as AstPosition);
    toRichValue = mkPos(pos);
  } else {
    toRichValue = evalRichExpr(p, alter.toValue as AstExpr);
  }

  // Get object's initial position for computing deltas
  const initialX = obj.ptAt?.x ?? 0;
  const initialY = obj.ptAt?.y ?? 0;

  // Check if target is edge without axis and value is position — animate both x and y
  const hasExplicitAxis = alter.target.axis !== null;
  if (!hasExplicitAxis && alter.target.edge && toRichValue.tag === 'position') {
    // Create two descriptors: one for cx, one for cy
    // Store as deltas (target - initial) so runtime math works correctly
    return [
      {
        targetId: obj.animId,
        property: 'cx',
        fromValue: null,
        toValue: toRichValue.val.x - initialX,
      },
      {
        targetId: obj.animId,
        property: 'cy',
        fromValue: null,
        toValue: toRichValue.val.y - initialY,
      },
    ];
  }

  // Single property animation
  const propName = alter.property.z.substring(0, alter.property.n);
  const property = mapToAlterableProperty(propName, alter.target.edge, alter.target.axis);

  if (!property) {
    pikError(p, alter.property, `cannot animate property '${propName}'`);
    return [];
  }

  let toValue: number | string;
  if (toRichValue.tag === 'color') {
    toValue = toRichValue.val;
  } else if (toRichValue.tag === 'position') {
    // Position target with explicit axis — extract the relevant axis as delta
    if (property === 'cx') toValue = toRichValue.val.x - initialX;
    else if (property === 'cy') toValue = toRichValue.val.y - initialY;
    else toValue = toNumber(toRichValue);
  } else {
    // Numeric value — for position properties, treat as delta from initial
    const numVal = toNumber(toRichValue);
    if (property === 'cx') toValue = numVal - initialX;
    else if (property === 'cy') toValue = numVal - initialY;
    else toValue = numVal;
  }

  return [{
    targetId: obj.animId,
    property,
    fromValue: null,  // captured at runtime when animation starts
    toValue,
  }];
}

function mapToAlterableProperty(name: string, edge: PToken | null, axis: "x" | "y" | null = null): AlterableProperty | null {
  // If an edge is provided, it's a position animation
  if (edge) {
    // With explicit axis (.c.x or .c.y), use that axis
    if (axis === 'y') return 'cy';
    return 'cx'; // default to cx for edge without axis
  }

  switch (name) {
    case 'c':     return 'cx';
    case 'x':     return 'cx';
    case 'y':     return 'cy';
    case 'fill':  return 'fill';
    case 'color': return 'color';
    case 'opacity': return 'opacity';
    case 'width': case 'wid': case 'w': return 'width';
    case 'height': case 'ht': case 'h': return 'height';
    case 'radius': case 'rad': return 'radius';
    case 'thickness': case 'sw': return 'sw';
    default: return null;
  }
}

function capturePropertyValue(obj: PObj, prop: AlterableProperty): number | string {
  switch (prop) {
    case 'cx':     return obj.ptAt.x;
    case 'cy':     return obj.ptAt.y;
    case 'width':  return obj.w;
    case 'height': return obj.h;
    case 'radius': return obj.rad;
    case 'fill':   return obj.fill;
    case 'color':  return obj.color;
    case 'opacity': return obj.opacity;
    case 'sw':     return obj.sw;
  }
}
