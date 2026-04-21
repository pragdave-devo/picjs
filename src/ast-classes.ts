import { Location } from "./location.js"
import { XY } from "./position.js"

export class Base {
  public readonly type: string
  constructor(location?: Location) {
    this.type = this.constructor.name
  }
}

type AnimationParams = { [name: string]: any }

type FormalParameterList = Identifier[] 
type ExpressionOrBlock = ExpressionList | Base 


export class ArrayExpression extends Base {
  constructor(
    location: Location, 
    public elements: Base[] 
  ) {
    super(location)
  }
}

export class Assignment extends Base {
  constructor(
    location: Location, 
    public lvalue: Base, 
    public rvalue: Base 
  ) {
    super(location)
  }
}

export class BinaryExpression extends Base {
  constructor(
    location: Location, 
    public left: Base, 
    public operator: string, 
    public right: Base
  ) {
    super(location)
  }
}

// //   VisitBlockStatement(node: AST.Base) {
// export class BlockStatement extends Base {
//   constructor(
//     location: Location, 
//     public left: Base, 
//     public operator: string, 
//     public right: Base
//   ) {
//     super(location)
//   }
// }

export class Boolean extends Base {
  constructor(
    location: Location, 
    public value: boolean 
  ) {
    super(location)
  }
}

export class ColorLiteral extends Base {
  constructor(
    location: Location, 
    public model: string, 
    public spec: string 
  ) {
    super(location)
  }
}


export class ExpressionList extends Base {
  constructor(
    location: Location, 
    public body: Base[] 
  ) {
    super(location)
  }
}

export class FaceAngle extends Base {
  constructor(
    location: Location, 
    public angle: Base
  ) {
    super(location)
  }
}

export class FaceCardinalDirection extends Base {
  constructor(
    location: Location, 
    public direction: XY    // unit vector
  ) {
    super(location)
  }
}

export abstract class Font extends Base {}

export class SystemFont extends Font {
  constructor(
    location: Location, 
    public name: string, 
  ) {
    super(location)
  }
}

export class SpeccedFont extends Font {
  constructor(
    location: Location, 
    public spec: { [attr: string]: string }
  ) {
    super(location)
  }
}


export class FunctionExpression extends Base {
  constructor(
    location: Location, 
    public params: FormalParameterList, 
    public body: ExpressionOrBlock 
  ) {
    super(location)
  }
}

export class GetTime extends Base {
  constructor(
    location: Location, 
  ) {
    super(location)
  }
}

export class Identifier extends Base {
  constructor(
    location: Location, 
    public name: string, 
  ) {
    super(location)
  }
}

export class IfExpression extends Base {
  constructor(
    location: Location, 
    public test: Base, 
    public consequent: Base, 
    public alternate: Base 
  ) {
    super(location)
  }
}

export class Inspect extends Base {
  constructor(
    location: Location, 
    public Value: Base, 
  ) {
    super(location)
  }
}

export class MoveTo extends Base {
  constructor(
    location: Location, 
    public what: Base, 
    public place: Base, 
    public params: { [name: string]: any }
  ) {
    super(location)
  }
}

export class Number extends Base {
  constructor(
    location: Location, 
    public value: number 
  ) {
    super(location)
  }
}

export class Position extends Base {
  constructor(
    location: Location, 
    public x: number,
    public y: number
  ) {
    super(location)
  }
}


// //   VisitProgram(node: AST.Base) {
// export class BinaryExpression extends Base {
//   constructor(
//     location: Location, 
//     public left: Base, 
//     public operator: string, 
//     public right: Base
//   ) {
//     super(location)
//   }
// }

export class QualifiedLValue extends Base {
  constructor(
    location: Location, 
    public left: Base, 
    public right: Base
  ) {
    super(location)
  }
}

export class QualifiedRValue extends Base {
  constructor(
    location: Location, 
    public left: Base, 
    public right: Base
  ) {
    super(location)
  }
}

export class Range extends Base {
  constructor(
    location: Location, 
    public start: Base, 
    public end: Base
  ) {
    super(location)
  }
}

export class Rotate extends Base {
  constructor(
    location: Location, 
    public what: Base, 
    public angle: Base, 
    public about: Base, 
    public params: AnimationParams
  ) {
    super(location)
  }
}

export class Set extends Base {
  constructor(
    location: Location, 
    public what: Base, 
    public value: Base, 
    public params: AnimationParams
  ) {
    super(location)
  }
}

export class SetTime extends Base {
  constructor(
    location: Location, 
    public when: string | number, 
  ) {
    super(location)
  }
}

export class Shape extends Base {
  constructor(
    location: Location, 
    public shape: string, 
    public args: Base[],
    public withConstraint?: Base
  ) {
    super(location)
  }
}

export class DefaultShapeSetter extends Base {
  constructor(
    location: Location, 
    public shape: string, 
    public klass: string, 
    public attr: string, 
    public value: Base
  ) {
    super(location)
  }
}

export class String extends Base {
  constructor(
    location: Location, 
    public value: string, 
  ) {
    super(location)
  }
}

export class UnaryExpression extends Base {
  constructor(
    location: Location, 
    public operator: string, 
    public argument: Base
  ) {
    super(location)
  }
}

export class VariableValue extends Base {
  constructor(
    location: Location, 
    public name: string, 
  ) {
    super(location)
  }
}

//   VisitWait(node: AST.Base) {
// export class BinaryExpression extends Base {
//   constructor(
//     location: Location, 
//     public left: Base, 
//     public operator: string, 
//     public right: Base
//   ) {
//     super(location)
//   }
// }


// export class BinaryExpression extends Base {
//   constructor(
//     location: Location, 
//     public left: Base, 
//     public operator: string, 
//     public right: Base
//   ) {
//     super(location)
//   }
// }


