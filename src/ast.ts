// ast.ts — AST node types for the new DSL parser
// Part of the DSL overhaul (Phase 0)
//
// The AST is produced by parser2.ts and consumed by evaluator.ts.
// Expressions are unevaluated; the evaluator walks them to produce PicValues.

import type { PToken } from './types.ts';

// ============================================================
// Statements
// ============================================================

export type AstStmt =
  | AstDirection
  | AstAssign
  | AstDefine
  | AstShape
  | AstLabel
  | AstSublist
  | AstForRange
  | AstForIn
  | AstFnCall
  | AstCase
  | AstPrint
  | AstAssert
  | AstEmpty

export interface AstDirection {
  kind: "direction";
  dir: number;       // DIR_RIGHT, DIR_DOWN, etc.
  tok: PToken;
}

export interface AstAssign {
  kind: "assign";
  name: PToken;
  op: PToken;         // T_ASSIGN with eCode indicating +=, *= etc.
  value: AstExpr;
}

export interface AstDefine {
  kind: "define";
  name: PToken;
  body: PToken;
}

export interface AstShape {
  kind: "shape";
  classTok: PToken | null;   // T_CLASSNAME, or null for string/sublist
  textTok: PToken | null;     // T_STRING for bare text objects
  textPos: number;            // text position flags for textTok
  sublist: AstStmt[] | null;  // [...] sublist body
  attrs: AstAttr[];
  leadingExpr: AstRelExpr | null;  // implicit direction distance
}

export interface AstLabel {
  kind: "label";
  name: PToken;
  body: AstShape | AstLabelPosition;
}

export interface AstLabelPosition {
  kind: "label_position";
  position: AstPosition;
}

export interface AstSublist {
  kind: "sublist";
  body: AstStmt[];
}

export interface AstForRange {
  kind: "for_range";
  varTok: PToken;
  start: AstExpr;
  end: AstExpr;
  step: AstExpr | null;
  body: AstStmt[];    // parsed body (not raw codeblock)
  bodyTok: PToken;     // original codeblock token for error reporting
}

export interface AstForIn {
  kind: "for_in";
  varTok: PToken;
  list: AstExpr[];
  body: AstStmt[];
  bodyTok: PToken;
}

export interface AstPrint {
  kind: "print";
  items: AstPrintItem[];
}

export type AstPrintItem =
  | { tag: "string"; tok: PToken }
  | { tag: "property"; tok: PToken }   // fill, color, thickness
  | { tag: "expr"; expr: AstExpr }

export interface AstAssert {
  kind: "assert";
  variant: "expr" | "position" | "bool";
  left: AstExpr | AstPosition;
  right: AstExpr | AstPosition | null;
  eqTok: PToken;
}

export interface AstCase {
  kind: "case";
  expr: AstExpr;
  arms: { pattern: AstExpr; body: AstStmt[] }[];
  tok: PToken;
}

export interface AstFnCall {
  kind: "fncall";
  func: AstExpr;
  args: AstExpr[];
  tok: PToken;
}

export interface AstEmpty {
  kind: "empty";
}

// ============================================================
// Attributes (canonical form)
// ============================================================

export type AstAttr =
  | AstAttrNumeric
  | AstAttrColor
  | AstAttrDash
  | AstAttrBool
  | AstAttrText
  | AstAttrContaining
  | AstAttrPosition
  | AstAttrDirection
  | AstAttrFlag
  | AstAttrWith
  | AstAttrSame
  | AstAttrBehind
  | AstAttrFit
  | AstAttrEvenWith

export interface AstAttrNumeric {
  attrKind: "numeric";
  prop: PToken;       // T_HEIGHT, T_WIDTH, T_RADIUS, T_DIAMETER, T_THICKNESS
  value: AstRelExpr;
}

export interface AstAttrColor {
  attrKind: "color";
  prop: PToken;       // T_FILL or T_COLOR
  value: AstExpr;
}

export interface AstAttrDash {
  attrKind: "dash";
  prop: PToken;       // T_DASHED or T_DOTTED
  value: AstExpr | null;
}

export interface AstAttrBool {
  attrKind: "bool";
  prop: string;       // "cw", "ccw", "larrow", "rarrow", "lrarrow", "invis", "thick", "thin", "solid"
  tok: PToken;
}

export interface AstAttrText {
  attrKind: "text";
  tok: PToken;         // T_STRING
  posFlags: number;   // text position flags
}

export interface AstAttrContaining {
  attrKind: "containing";
  expr: AstExpr;
  posFlags: number;   // text position flags
  tok: PToken;
}

export interface AstAttrPosition {
  attrKind: "position";
  variant: "from" | "to" | "at" | "close";
  tok: PToken;
  position: AstPosition;
}

export interface AstAttrDirection {
  attrKind: "direction";
  dirTok: PToken | null;   // direction token, or null for implicit
  hasGo: boolean;
  value: AstRelExpr | null;
  // For heading-based movement
  headingTok: PToken | null;
  headingExpr: AstExpr | null;
  edgeptTok: PToken | null;
}

export interface AstAttrWith {
  attrKind: "with";
  edge: PToken | null;
  hasDotE: boolean;
  position: AstPosition;
}

export interface AstAttrSame {
  attrKind: "same";
  tok: PToken;
  asObject: AstObject | null;
}

export interface AstAttrBehind {
  attrKind: "behind";
  object: AstObject;
}

export interface AstAttrFit {
  attrKind: "fit";
  tok: PToken;
}

export interface AstAttrEvenWith {
  attrKind: "even_with";
  dirTok: PToken;
  position: AstPosition;
}

export interface AstAttrFlag {
  attrKind: "flag";
  name: string;       // "chop", "close", "then"
  tok: PToken;
}

// ============================================================
// Relative expression (value or percentage)
// ============================================================

export interface AstRelExpr {
  expr: AstExpr;
  isPercent: boolean;
}

// ============================================================
// Expressions
// ============================================================

export type AstExpr =
  | AstExprNumber
  | AstExprString
  | AstExprBool
  | AstExprVarRef
  | AstExprBinOp
  | AstExprUnaryOp
  | AstExprCompare
  | AstExprLogical
  | AstExprParen
  | AstExprFuncCall
  | AstExprBuiltinCall
  | AstExprDist
  | AstExprProperty
  | AstExprPlaceXY
  | AstExprColorName
  | AstExprList
  | AstExprIndex
  | AstExprFn
  | AstExprUserCall

export interface AstExprNumber {
  exprKind: "number";
  tok: PToken;
  value: number;
}

export interface AstExprString {
  exprKind: "string";
  tok: PToken;
  value: string;
}

export interface AstExprBool {
  exprKind: "boolean";
  tok: PToken;
  value: boolean;
}

export interface AstExprVarRef {
  exprKind: "varRef";
  tok: PToken;
}

export interface AstExprBinOp {
  exprKind: "binOp";
  op: "+" | "-" | "*" | "/" | "%";
  left: AstExpr;
  right: AstExpr;
  tok: PToken;
}

export interface AstExprUnaryOp {
  exprKind: "unaryOp";
  op: "-" | "+";
  operand: AstExpr;
  tok: PToken;
}

export interface AstExprCompare {
  exprKind: "compare";
  op: "==" | ">" | "<" | ">=" | "<=" | "!=";
  left: AstExpr;
  right: AstExpr;
  tok: PToken;
}

export interface AstExprLogical {
  exprKind: "logical";
  op: "and" | "or" | "not";
  left: AstExpr;
  right: AstExpr | null;  // null for "not"
  tok: PToken;
}

export interface AstExprParen {
  exprKind: "paren";
  expr: AstExpr;
}

export interface AstExprFuncCall {
  exprKind: "funcCall";
  func: PToken;     // T_FUNC1, T_FUNC2, T_FUNC3
  args: AstExpr[];
}

export interface AstExprBuiltinCall {
  exprKind: "builtinCall";
  name: string;
  args: AstExpr[];
  tok: PToken;
}

export interface AstExprDist {
  exprKind: "dist";
  p1: AstPosition;
  p2: AstPosition;
  tok: PToken;
}

export interface AstExprProperty {
  exprKind: "property";
  object: AstObject;
  prop: PToken;     // T_HEIGHT, T_WIDTH, etc. or T_X, T_Y via DOT_L
}

export interface AstExprPlaceXY {
  exprKind: "placeXY";
  place: AstPlace;
  axis: "x" | "y";
}

export interface AstExprColorName {
  exprKind: "colorName";
  tok: PToken;
}

export interface AstExprList {
  exprKind: "list";
  items: AstExpr[];
  tok: PToken;
}

export interface AstExprIndex {
  exprKind: "index";
  object: AstExpr;
  index: number;
  tok: PToken;
}

export interface AstExprFn {
  exprKind: "fn";
  params: PToken[];
  body: AstStmt[];
  tok: PToken;
}

export interface AstExprUserCall {
  exprKind: "userCall";
  func: AstExpr;
  args: AstExpr[];
  tok: PToken;
}

// ============================================================
// Positions
// ============================================================

export type AstPosition =
  | AstPosAbsolute
  | AstPosPlace
  | AstPosRelative
  | AstPosBetween
  | AstPosDistDir
  | AstPosComposite
  | AstPosParen

export interface AstPosAbsolute {
  posKind: "absolute";
  x: AstExpr;
  y: AstExpr;
}

export interface AstPosPlace {
  posKind: "place";
  place: AstPlace;
}

export interface AstPosRelative {
  posKind: "relative";
  base: AstPosition;
  sign: 1 | -1;
  dx: AstExpr;
  dy: AstExpr;
  paren: boolean;  // whether offset was in parens
}

export interface AstPosBetween {
  posKind: "between";
  fraction: AstExpr;
  p1: AstPosition;
  p2: AstPosition;
}

export interface AstPosDistDir {
  posKind: "distDir";
  distance: AstExpr;
  direction: "above" | "below" | "left" | "right" | "heading" | "edgept";
  headingExpr: AstExpr | null;
  edgeptTok: PToken | null;
  of: AstPosition;
}

export interface AstPosComposite {
  posKind: "composite";
  xFrom: AstPosition;
  yFrom: AstPosition;
}

export interface AstPosParen {
  posKind: "paren";
  inner: AstPosition;
}

// ============================================================
// Places and Objects
// ============================================================

export interface AstPlace {
  object: AstObject;
  edge: PToken | null;      // compass point or start/end
  hasDotE: boolean;          // whether accessed via .edge syntax
}

export type AstObject =
  | AstObjThis
  | AstObjNamed
  | AstObjNth

export interface AstObjThis {
  objKind: "this";
  tok: PToken;
}

export interface AstObjNamed {
  objKind: "named";
  names: PToken[];   // chain of PLACENAME tokens (A.B.C)
}

export interface AstObjNth {
  objKind: "nth";
  nth: PToken;       // T_NTH with eCode set, or T_LAST
  classTok: PToken;  // T_CLASSNAME or T_LB or T_LAST
  inObject: AstObject | null;  // "of" or "in" basis object
}

// Vertex expression
export interface AstVertexExpr {
  nth: PToken;
  vertex: PToken;
  object: AstObject;
  axis: "x" | "y";
}
