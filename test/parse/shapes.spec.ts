import { 
  arc,
  testParse,
  at,
  colorModel,
  colorString,
  label,
  line,
  lineEndings,
  number,
  position,
  shape,
  string,
  withConstraint,
} from "../helpers/ast.js"


const n = (val: number) => number(val)
const s = (val: string) => string(val)
const n1 = n(1), n2 = n(2), n3 = n(3), n99 = n(99)

testParse(`Box`,             shape(`SBox`))
testParse(`Box x 99`,        shape(`SBox`, { x: n99 }))
testParse(`Box y 99`,        shape(`SBox`, { y: n99 }))
testParse(`Box x 77 y 88`,   shape(`SBox`, { x: number(77), y: number(88) }))
testParse(`Box at (77, 88)`, shape(`SBox`, { at: at(number(77), number(88)) }))
testParse(`Box (77, 88)`,    shape(`SBox`, { at: at(number(77), number(88)) }))
testParse(`Box width 10`,    shape(`SBox`, { width:  number(10) }))
testParse(`Box height 10`,   shape(`SBox`, { height: number(10) }))
testParse(`Box 10×20`,       shape(`SBox`, { width:  number(10), height: number(20) }))
testParse(`Box fill rgb(1,2,3)`, shape(`SBox`, { fill: colorModel(`rgb`, n1, n2, n3) }))
testParse(`Box opacity 0.5`,    shape(`SBox`, { opacity: number(0.5) }))
testParse(`Circle opacity 0`,   shape(`SCircle`, { opacity: number(0) }))
testParse(`Line opacity 0.8`,   line({ line_path: s(`straight`), opacity: number(0.8) }))

testParse(`Box stroke #010203 thick 3 dotted`,
  shape(`SBox`, 
    { stroke: colorString(`#010203`), "stroke_width": n3, linestyle: string(`dotted`) }))

testParse(
  `Box with .c at (20, 30)`, 
  shape(`SBox`, {}, withConstraint(`c`, position(number(20), number(30))))
)


testParse(
  `Box with .c (20, 30)`, 
  shape(`SBox`, {}, withConstraint(`c`, position(number(20), number(30))))
)

// attrs and abbreviations

testParse(`Box height 99`, shape(`SBox`, { height: n99 }))
testParse(`Box ht 99`,     shape(`SBox`, { height: n99 }))

testParse(`Box width 99`, shape(`SBox`, { width: n99 }))
testParse(`Box wid 99`,   shape(`SBox`, { width: n99 }))

testParse(`Box rx 99`,   shape(`SBox`, { rx: n99 }))
testParse(`Box ry 99`,   shape(`SBox`, { ry: n99 }))

testParse(`Line length 99`, line({ length: n99, line_path: s(`straight`) }))
testParse(`Line len 99`,    line({ length: n99, line_path: s(`straight`) }))

testParse(`Line fill ~red`, line({ line_path: s(`straight`), fill: colorString(`red`) }))
testParse(`Line stroke ~red`, line({ line_path: s(`straight`), stroke: colorString(`red`) }))

testParse(`Line smooth`,    line({ line_path: s(`smooth`) }))
testParse(`Line curved`,    line({ line_path: s(`smooth`) }))
testParse(`Line curve`,     line({ line_path: s(`smooth`) }))

testParse(`Line stepped`,   line({ line_path: s(`stepped`) }))
testParse(`Line step`,      line({ line_path: s(`stepped`) }))

testParse(`Line thickness 99`,
                                line({ line_path: s(`straight`), "stroke_width": n99 }))
testParse(`Line thick 99`,  line({ line_path: s(`straight`), "stroke_width": n99 }))

testParse(`Line solid`,  line({ line_path: s(`straight`), "linestyle": s(`solid`) }))
testParse(`Line dashed`,  line({ line_path: s(`straight`), "linestyle": s(`dashed`) }))
testParse(`Line dotted`,  line({ line_path: s(`straight`), "linestyle": s(`dotted`) }))

testParse(`Circle radius 99`, shape(`SCircle`, { r: n99 }))
testParse(`Circle rad 99`,    shape(`SCircle`, { r: n99 }))
testParse(`Circle r 99`,      shape(`SCircle`, { r: n99 }))


testParse(`Arc ccw`,     arc({ turn: s(`ccw`) }))
testParse(`Arc cw`,      arc({ turn: s(`cw`) }))


testParse(`Box rotation 45`, 
  shape(`SBox`, { rotation: number(45) }))

testParse(`Box rotation 45 about (1, 2)`, 
  shape(`SBox`, { 
    rotation: number(45),
    _rotationCenter: position(number(1), number(2))
  }))

// labels

testParse(`Label "hello"`, label(string(`hello`)))

// single label on a shape stays as `label` (not `_shapeLabels`)
testParse(`Box "hello"`, shape(`SBox`, { label: label(string(`hello`)) }))

// multiple labels on a shape become `_shapeLabels` array
testParse(`Box "A" "B"`, shape(`SBox`, { _shapeLabels: [label(string(`A`)), label(string(`B`))] }))
testParse(`Box "X" "Y" "Z"`, shape(`SBox`, { _shapeLabels: [label(string(`X`)), label(string(`Y`)), label(string(`Z`))] }))

// multiple labels on circle
testParse(`Circle "top" "bot"`, shape(`SCircle`, { _shapeLabels: [label(string(`top`)), label(string(`bot`))] }))

// multiple labels interleaved with other attrs
testParse(`Box "A" width 5 "B"`, shape(`SBox`, { _shapeLabels: [label(string(`A`)), label(string(`B`))], width: number(5) }))

// all the funky lines 

testParse(`Line`,     lineEndings())
testParse(`Line`,     lineEndings())
testParse(`Line ->`,  lineEndings(``, `>`))
testParse(`Line <-`,  lineEndings(`<`))
testParse(`Line <->`, lineEndings(`<`, `>`))
testParse(`Line -o`,  lineEndings(``, `o`))
testParse(`Line o-`,  lineEndings(`o`))
testParse(`Line o-o`, lineEndings(`o`, `o`))
testParse(`Line -|`,  lineEndings(``, `|`))
testParse(`Line |-`,  lineEndings(`|`))
testParse(`Line |-|`, lineEndings(`|`, `|`))
testParse(`Line |->`, lineEndings(`|`, `>`))
testParse(`Line o-|`, lineEndings(`o`, `|`))
testParse(`Line <-o`, lineEndings(`<`, `o`))

testParse(`--`,  lineEndings())
testParse(`->`,  lineEndings(``, `>`))
testParse(`<-`,  lineEndings(`<`))
testParse(`<->`, lineEndings(`<`, `>`))
testParse(`-o`,  lineEndings(``, `o`))
testParse(`o-`,  lineEndings(`o`))
testParse(`o-o`, lineEndings(`o`, `o`))
testParse(`-|`,  lineEndings(``, `|`))
testParse(`|-`,  lineEndings(`|`))
testParse(`|-|`, lineEndings(`|`, `|`))
testParse(`|->`, lineEndings(`|`, `>`))
testParse(`o-|`, lineEndings(`o`, `|`))
testParse(`<-o`, lineEndings(`<`, `o`))

