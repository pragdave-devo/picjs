import { Location } from "./parser.js"
import { Cardinals, XY } from "./position.js"
import { WithConstraint } from "./shapes/_base.js"

// type Expression 
//   = Inspect
//   | ShapeDefaultSetter
//   | Shape
//   | SetTime
//   | AnimationSequence
//   | Assignment
//   | IfExpression
//   | ConditionalExpression

// type AnimationSequence = ExpressionList | Animation

// type Animation 
//   = MoveTo
//   | Rotate
//   | Set

// type ConditionalExpression 
//   = IfExpression
//   | BinaryExpression
//   | UnaryExpression
//   | FunctionExpression
//   | Primary

// type Primary
//   = Number
//   | Boolean
//   | Color
//   | Position
//   | String
//   | TimelineValue
//   | VarfiableValue
//   | ArrayOrRange
//   | ConditionalExpression

export interface Base {
  type: string
  location?: Location
}

export type Parameters = { [paramname: string]: any }

type FormalParameterList = Identifier[] 
export type ExpressionOrBlock = ExpressionList | Node


export interface ArrayExpression extends Base {
  type: `ArrayExpression`
  elements: Node[] 
}

export interface Assignment extends Base {
  type: `Assignment`,
  lvalue: Node, 
  rvalue: Node 
}

export interface BinaryExpression extends Base {
  type: `BinaryExpression`,
  left: Node, 
  operator: string, 
  right: Node
}

// //   VisitBlockStatement(node: AST.Base) {
// export interface BlockStatement extends Base {
//   constructor(
//     location: Location, 
//     left: Node, 
//     operator: string, 
//     right: Node
//   ) {
//     super(location)
//   }
// }

export interface Boolean extends Base {
  type: `Booloean`
  value: boolean 
}

export interface ColorLiteralString extends Base {
  type: `ColorLiteralString`,
  spec: string 
}

export interface ColorLiteralWithModel extends Base {
  type: `ColorLiteralWithModel`,
  model: string, 
  params: Node[]
}

export type ColorLiteral = ColorLiteralString | ColorLiteralWithModel


export interface Draw extends Base {
  type: `Draw`
  what: Node,
  params: Parameters
}

export interface ExpressionList extends Base {
  type: `ExpressionList`
  body: Node[]
}

export interface FaceAngle extends Base {
  type: `FaceAngle`
  angle: Node
}

export interface FaceCardinalDirection extends Base {
  type: `FaceCardinalDirection`
  direction: XY    // unit vector
}


export interface SystemFont extends Base {
  type: `SystemFont`
  name: string, 
}

export interface Font extends Base {
  type: `Font`
  spec: { [attr: string]: string }
}

export interface FunctionExpression extends Base {
  type: `FunctionExpression`
  params: FormalParameterList, 
  body: ExpressionOrBlock 
}

export interface GetTime extends Base {
  type: `GetTime`
}

export interface Group extends Base {
  type: `Group`
  body: ExpressionList | Node
  withConstraint?: WithConstraint
}

export interface Identifier extends Base {
  type: `Identifier`
  name: string, 
}

export interface IfExpression extends Base {
  type: `IfExpression`
  test: Node, 
  consequent: Node, 
  alternate: Node 
}

export interface Inspect extends Base {
  type: `Inspect`
  value: Node, 
}

export interface MoveTo extends Base {
  type: `MoveTo`
  what: QualifiedLValue | VariableValue, 
  place: Node, 
  params: { [name: string]: any }
}

export interface Number extends Base {
  type: `Number`
  value: number 
}

export interface Position extends Base {
  type: `Position`,
  x: Node,
  y: Node
}

export interface Program extends Base {
  type: `Program`,
  body: ExpressionList,
}

export interface QualifiedLValue extends Base {
  type: `QualifiedLValue`,
  left: Node, 
  right: Qualifier
}

export interface QualifiedRValue extends Base {
  type: `QualifiedRValue`,
  left: Node, 
  right: Qualifier
}

export interface QualifierFunctionCall  {
  qtype: `call`,
  qvalue: Node[],   // args
}

export interface QualifierIndex  {
  qtype: `index`,
  qvalue: Node   // args
}

export interface QualifierAttr  {
  qtype: `attr`,
  qvalue: Identifier
}

export type Qualifier = QualifierFunctionCall | QualifierIndex | QualifierAttr

export interface Range extends Base {
  type: `Range`
  start: Node, 
  end: Node
}

export interface Rotate extends Base {
  type: `Rotate`
  what: Node, 
  angle: Node, 
  about: Node, 
  params: Parameters
}

export interface Set extends Base {
  type: `Set`
  what: Node, 
  value: Node, 
  params: Parameters
}

export interface SetTime extends Base {
  type: `SetTime`
  when: string | number, 
}

export interface Shape extends Base {
  type: `Shape`
  shape: string,
  args: Record<string, Node>,
  withConstraint?: WithConstraint,
  isChildShape?: boolean,  // true for label shapes that shouldn't become lastShape
}

export interface ShapeDefaultSetter extends Base {
  type: `ShapeDefaultSetter`
  shape: string, 
  klass: string, 
  attr: string, 
  value: Node
}

export interface String extends Base {
  type: `String`
  value: string, 
}

export interface UnaryExpression extends Base {
  type: `UnaryExpression`
  operator: string, 
  argument: Node
}

export interface VariableValue extends Base {
  type: `VariableValue`,
  name: string, 
}


export interface ASTWithConstraint {
  type: `ASTWithConstraint`,
  cardinal: Cardinals,
  place: Node

}

export type Node
  = ArrayExpression
  | Assignment
  | BinaryExpression
  | Boolean
  | ColorLiteralString
  | ColorLiteralWithModel
  | Draw
  | ExpressionList
  | FaceAngle
  | FaceCardinalDirection
  | Font
  | FunctionExpression
  | GetTime
  | Group
  | Identifier
  | IfExpression
  | Inspect
  | MoveTo
  | Number
  | Position
  | Program
  | QualifiedLValue
  | QualifiedRValue
  | Range
  | Rotate
  | Set
  | SetTime
  | Shape
  | ShapeDefaultSetter
  | String
  | UnaryExpression
  | VariableValue

//   VisitWait(node: AST.Base) {
// export interface BinaryExpression extends Base {
//   constructor(
//     location: Location, 
//     left: Node, 
//     operator: string, 
//     right: Node
//   ) {
//     super(location)
//   }
// }


// export interface BinaryExpression extends Base {
//   constructor(
//     location: Location, 
//     left: Node, 
//     operator: string, 
//     right: Node
//   ) {
//     super(location)
//   }
// }


