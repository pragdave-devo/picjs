#!/usr/bin/env node

// Phase 1: Parse jp.pegjs via Peggy's own parser and visitor,
// extract structured syntax data into grammar-data.json.
//
// Inspired by peggy-tracks (https://github.com/peggyjs/peggy-tracks)

const peggy = require('peggy')
const asts  = require('peggy/lib/compiler/asts')
const { stringEscape, regexpClassEscape } = require('peggy/lib/compiler/utils')
const fs   = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const GRAMMAR_FILE = path.join(ROOT, 'src/peg_parser/jp.pegjs')
const OUTPUT_FILE  = path.join(ROOT, 'docs/grammar-data.json')

// ──────────────────────────────────────────────── Parse the grammar

const grammarSource = fs.readFileSync(GRAMMAR_FILE, 'utf8')
const grammar = peggy.parser.parse(grammarSource)
const rulesByName = Object.fromEntries(grammar.rules.map(r => [r.name, r]))

// ──────────────────────────────────────────────── Rule classification

// Rules that just match a keyword literal (e.g., move = "move" !IdentifierPart)
const KEYWORD_RULES = new Set()

for (const rule of grammar.rules) {
  if (isKeywordRule(rule)) KEYWORD_RULES.add(rule.name)
}

function isKeywordRule(rule) {
  const expr = unwrap(rule.expression)
  if (expr.type !== 'sequence') return false
  const first = expr.elements[0]
  // literal !IdentifierPart  or  (literal / literal) !IdentifierPart
  if (first.type === 'literal') return true
  if (first.type === 'group') {
    const inner = first.expression
    if (inner.type === 'literal') return true
    if (inner.type === 'choice' && inner.alternatives.every(a => a.type === 'literal'))
      return true
  }
  if (first.type === 'choice' && first.alternatives.every(a => a.type === 'literal'))
    return true
  return false
}

function unwrap(node) {
  if (node.type === 'action') return unwrap(node.expression)
  if (node.type === 'named') return unwrap(node.expression)
  return node
}

// Get the primary keyword text for a keyword rule
function keywordText(ruleName) {
  const rule = rulesByName[ruleName]
  if (!rule) return ruleName
  const expr = unwrap(rule.expression)
  if (expr.type !== 'sequence') return ruleName
  const first = expr.elements[0]
  if (first.type === 'literal') return first.value
  if (first.type === 'group') {
    const inner = first.expression
    if (inner.type === 'literal') return inner.value
    if (inner.type === 'choice') return inner.alternatives[0].value
  }
  if (first.type === 'choice') return first.alternatives[0].value
  return ruleName
}

// Rules to suppress entirely in rendered syntax
const SKIP_RULES = new Set([
  '_', '__', 'EOF', 'WhiteSpace', 'LineTerminator', 'LineTerminatorSequence',
  'Comment', 'IdentifierStart', 'IdentifierPart', 'UnicodeLetter',
  'UnicodeCombiningMark', 'UnicodeDigit', 'UnicodeConnectorPunctuation',
  'Ll', 'Lm', 'Lo', 'Lt', 'Lu', 'Mc', 'Mn', 'Nd', 'Nl', 'Pc', 'Zs',
  'DecimalDigit', 'DecimalIntegerLiteral', 'ExponentPart', 'DecimalPoint',
  'HexNibble', 'HexByte', 'LineContinuation', 'EscapeSequence',
  'CharacterEscapeSequence', 'SingleEscapeCharacter', 'NonEscapeCharacter',
  'EscapeCharacter', 'HexEscapeSequence', 'UnicodeEscapeSequence',
  'DoubleStringCharacter', 'SingleStringCharacter',
])

// Rules that should inline to a readable placeholder
const PLACEHOLDERS = {
  'Expression':        '<expr>',
  'NonShapeExpression': '<expr>',
  'ExpressionOrBlock': '<body>',
  'LogicalORExpression': '<expr>',
  'PositionValue':     '<position>',
  'Position':          '<position>',
  'Identifier':        '<name>',
  'String':            '<string>',
  'Number':            '<number>',
  'Color':             '<color>',
  'Boolean':           '<boolean>',
  'Cardinal':          '.<cardinal>',
  'CardinalVector':    '<cardinal>',
  'FontSpec':          '<font-spec>',
  'Primary':           '<value>',
  'FormalParameterList': '<params>',
  'AnimationParams':   '[take <duration>] [ease <name>]',
  'ArgumentList':      '<args>',
  'LValue':            '<target>',
  'BaseLValue':        '<target>',
  'ActualNumber':      '<digits>',
  'SimpleDecimalNumber': '<number>',
  'ColorModel':        '<model>',
  'ColorComponents':   '<components>',
  'ElementList':       '<elements>',
  'AssignmentOperator': '<op>',
  // Shape option groups — show as <options> in shape variants
  'SECommon':          '<option>',
  'SESize':            '<option>',
  'SERadius':          '<option>',
  'SERadii':           '<option>',
  'SELineEndings':     '<line-style>',
  'SELineShape':       '<line-shape>',
  'SELineLength':      '<option>',
  'SEText':            '<option>',
  'SETurn':            '<turn>',
  'SEStroke':          '<option>',
  'SEStrokeAttr':      '<option>',
  'SELabel':           '<option>',
  'SEPos':             '<option>',
  'SERotation':        '<option>',
  'SEFill':            '<option>',
  'SEClass':           '<option>',
  // Shape-specific rules
  'WithConstraint':    'with [.<cardinal>] at <place>',
  'FromPosition':      'from <position>',
  'ToPosition':        'to <position>',
  'LineOrAbbrev':      'Line',
  'ShapeName':         '<Shape>',
  'AttrName':          '<attr>',
  'SkipArgs':          '[<distance>]',
  'Smooth':            'smooth',
}

// ──────────────────────────────────────────────── Visitor-based syntax renderer

const visit = peggy.compiler.visitor.build({

  rule(node) {
    // Render a rule's expression, skipping the rule name wrapper
    return visit(node.expression)
  },

  named(node) {
    // Strip peggy display-name annotations
    return visit(node.expression)
  },

  action(node) {
    // Strip action code blocks
    return visit(node.expression)
  },

  sequence(node) {
    const parts = node.elements.map(e => visit(e)).filter(Boolean)
    return parts.join(' ')
  },

  choice(node) {
    const alts = node.alternatives.map(a => visit(a)).filter(Boolean)
    if (alts.length === 0) return ''
    if (alts.length === 1) return alts[0]
    return alts.join(' | ')
  },

  labeled(node) {
    // Key insight: render through the inner expression rather than
    // collapsing to <label>. The inner rendering has the real info.
    const inner = visit(node.expression)
    if (!inner) return ''
    return inner
  },

  rule_ref(node) {
    const name = node.name
    if (SKIP_RULES.has(name)) return ''
    if (KEYWORD_RULES.has(name)) return keywordText(name)
    if (name in PLACEHOLDERS) return PLACEHOLDERS[name]
    return `<${name}>`
  },

  literal(node) {
    return node.value
  },

  class(node) {
    const parts = node.parts.map(([start, end]) => (end
      ? `${regexpClassEscape(start)}-${regexpClassEscape(end)}`
      : regexpClassEscape(start)))
    return `[${node.inverted ? '^' : ''}${parts.join('')}]`
  },

  any() {
    return ''  // error-handler catch-alls, not real syntax
  },

  optional(node) {
    const inner = visit(node.expression)
    if (!inner) return ''
    return `[${inner}]`
  },

  zero_or_more(node) {
    const inner = visit(node.expression)
    if (!inner) return ''
    return `${inner}*`
  },

  one_or_more(node) {
    const inner = visit(node.expression)
    if (!inner) return ''
    return `${inner}+`
  },

  group(node) {
    return visit(node.expression)
  },

  text(node) {
    return visit(node.expression)
  },

  simple_not() {
    return ''  // lookahead, invisible in syntax
  },

  simple_and() {
    return ''  // lookahead, invisible in syntax
  },

  semantic_not() { return '' },
  semantic_and() { return '' },
})


// ──────────────────────────────────────────────── Helpers

function renderRule(name) {
  const rule = rulesByName[name]
  if (!rule) return ''
  return visit(rule).replace(/\s+/g, ' ').trim()
}

function renderAlternatives(name) {
  const rule = rulesByName[name]
  if (!rule) return []
  const expr = unwrap(rule.expression)
  if (expr.type === 'choice') {
    return expr.alternatives
      .map(a => visit(a).replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .filter(s => !isErrorAlternative(s))
  }
  const s = visit(rule).replace(/\s+/g, ' ').trim()
  return (s && !isErrorAlternative(s)) ? [s] : []
}

// Filter out PEG error-message alternatives (they use . or .* to consume input
// and trigger a custom error message)
function isErrorAlternative(s) {
  return /^\S+\s+\.\*?$/.test(s)  // e.g. "move .*" or "rotate ."
      || s === '.'
      || /^\.+(\s\.+)*$/.test(s)  // sequences of dots like ". . . . ."
      || /^\w+$/.test(s)          // bare keyword with no arguments (error fallback)
      || /^<(?!digits)\w+>$/.test(s) // bare <placeholder> (fallthrough), but not <digits>
}

// ──────────────────────────────────────────────── Extraction

function extractStatements() {
  const descriptions = {
    'Inspect':              'Debug: print the value of an expression',
    'ShapeDefaultSetter':   'Set a default attribute for a shape type',
    'Shape':                'Draw a shape',
    'SetTime':              'Set the animation timeline position',
    'AnimationSequence':    'One or more animations, optionally chained with "then"',
    'Assignment':           'Assign a value to a variable or attribute',
    'IfExpression':         'Conditional expression (if/else)',
    'ConditionalExpression':'Ternary conditional (test ? then : else)',
  }

  const rule = rulesByName['Expression']
  const expr = unwrap(rule.expression)
  if (expr.type !== 'choice') return []

  // Hand-curated overrides for statements that render poorly
  const syntaxOverrides = {
    'ShapeDefaultSetter': ['<Shape>.<attr> = <expr>', '<Shape>.<class>.<attr> = <expr>'],
    'Assignment': ['<target> = <expr>', '<target> += <expr>', '<target> -= <expr>', '<target> *= <expr>', '<target> /= <expr>', '<target> %= <expr>'],
    'SetTime': ['@@ <expr>'],
  }

  return expr.alternatives
    .filter(a => a.type === 'rule_ref')
    .map(a => ({
      name: a.name,
      syntax: syntaxOverrides[a.name] || renderAlternatives(a.name).filter(s => !isErrorAlternative(s)),
      description: descriptions[a.name] || '',
    }))
}

function extractShapes() {
  const rule = rulesByName['Shape']
  const expr = unwrap(rule.expression)
  if (expr.type !== 'choice') return []

  const SHAPE_OPTIONS = {
    'Arc':     { options: ['SECommon', 'SELineEndings', 'SETurn'] },
    'Box':     { options: ['SECommon', 'SESize', 'SERadii', 'WithConstraint'] },
    'Circle':  { options: ['SECommon', 'SERadius', 'WithConstraint'] },
    'Ellipse': { options: ['SECommon', 'SERadius', 'WithConstraint'] },
    'Oval':    { options: ['SECommon', 'SERadius', 'WithConstraint'] },
    'Line':    { options: ['SECommon', 'SELineEndings', 'SELineShape', 'SELineLength'] },
    'Label':   { options: ['SECommon', 'SEText', 'WithConstraint'] },
    'Face':    { options: [] },
    'Skip':    { options: [] },
  }

  const shapes = {}
  for (const [name, info] of Object.entries(SHAPE_OPTIONS)) {
    shapes[name] = { name, variants: [], optionSets: info.options }
  }

  for (const alt of expr.alternatives) {
    const syntax = visit(alt).replace(/\s+/g, ' ').trim()
    if (!syntax || isErrorAlternative(syntax)) continue
    const shapeName = identifyShape(alt)
    if (!shapeName || !shapes[shapeName]) continue

    // The grammar combines Circle/Ellipse/Oval into one alternative.
    // Split it so each shape gets its own variant.
    if (syntax.includes('Circle | Ellipse | Oval')) {
      for (const sub of ['Circle', 'Ellipse', 'Oval']) {
        if (shapes[sub]) {
          shapes[sub].variants.push(
            syntax.replace('Circle | Ellipse | Oval', sub)
          )
        }
      }
    } else {
      shapes[shapeName].variants.push(syntax)
    }
  }

  // Clean up shape variants: collapse repetitive option placeholders
  for (const shape of Object.values(shapes)) {
    shape.variants = shape.variants.map(v => {
      return v
        // Normalize various option-like placeholders to <option>
        .replace(/<line-style>/g, '<option>')
        .replace(/<line-shape>/g, '<option>')
        .replace(/<turn>/g, '<option>')
        // Collapse runs of <option> | <option> | ...
        .replace(/(<option>)( \| <option>)+/g, '<option>')
        // <option>* → [<options>...]
        .replace(/<option>\*/g, '[<options>...]')
        // standalone <option> in a variant → [<options>...]
        .replace(/<option>/g, '[<options>...]')
        // fix doubled brackets
        .replace(/\[\[<options>\.\.\.]\]/g, '[<options>...]')
        .replace(/\s+/g, ' ').trim()
    })
  }

  return Object.values(shapes)
}

function identifyShape(node) {
  const names = ['Arc','Box','Circle','Ellipse','Oval','Line','Label','Face','Skip']
  function find(n) {
    if (!n) return null
    if (n.type === 'rule_ref' && names.includes(n.name)) return n.name
    if (n.type === 'rule_ref' && n.name === 'LineOrAbbrev') return 'Line'
    if (n.type === 'action') return find(n.expression)
    if (n.type === 'named') return find(n.expression)
    if (n.type === 'labeled') return find(n.expression)
    if (n.type === 'sequence') {
      for (let i = 0; i < Math.min(3, n.elements.length); i++) {
        const r = find(n.elements[i])
        if (r) return r
      }
    }
    if (n.type === 'choice') {
      for (const a of n.alternatives) {
        const r = find(a)
        if (r) return r
      }
    }
    return null
  }
  return find(node)
}

function extractAnimations() {
  const alts = renderAlternatives('Animation')
  const animations = {}

  for (const syntax of alts) {
    let name = null
    if (syntax.startsWith('move')) name = 'move'
    else if (syntax.startsWith('rotate')) name = 'rotate'
    else if (syntax.startsWith('set')) name = 'set'
    if (!name) continue

    if (!animations[name]) {
      animations[name] = { name, variants: [], params: [
        { name: 'take', type: '<expr>', description: 'animation duration' },
        { name: 'ease', type: '<string>', description: 'easing function name' },
      ]}
    }
    animations[name].variants.push(syntax)
  }
  return Object.values(animations)
}

function extractOptions() {
  const defs = {
    SECommon:       'Options available on most shapes',
    SELabel:        'Attach a text label to a shape',
    SEPos:          'Set the position of a shape',
    SERotation:     'Rotate a shape',
    SEFill:         'Set the fill color',
    SEStrokeAttr:   'Set stroke color, thickness, or line style',
    SEClass:        'Apply a CSS class to the shape',
    SESize:         'Set width and/or height (Box)',
    SERadius:       'Set the radius (Circle, Ellipse, Oval)',
    SERadii:        'Set corner radii (Box)',
    SELineEndings:  'Line path style and arrow markers',
    SELineShape:    'Line interpolation: straight, stepped, or smooth',
    SELineLength:   'Set the length of a line',
    SEText:         'Label text options: alignment and font',
    SETurn:         'Arc turn direction: cw, ccw, or angle',
    WithConstraint: 'Position a shape by constraining a cardinal point to a place',
  }

  // Hand-curated overrides for options that render poorly from the grammar
  const overrides = {
    SECommon: [
      '"<text>"           — label',
      'rotation <angle> [about <position>]',
      'at <position> | (<x>, <y>) | x <n> | y <n>',
      'fill <color>',
      'stroke <color>',
      'thickness <n> | solid | dotted | dashed',
      '.<class-name>',
    ],
    SELineEndings: [
      '<start><path><end>',
      'start/end markers: < (arrow) | > (arrow) | | (bar) | o (dot)',
      'path style: -- (straight) | ~~ (smooth)',
    ],
    SEText: [
      'align .<cardinal>',
      'font <font-spec>',
    ],
    SEPos: [
      'at <expr>',
      '(<x>, <y>)',
      'x <expr>',
      'y <expr>',
    ],
    SERadii: [
      'rx <expr>',
      'ry <expr>',
    ],
    SESize: [
      '<width> x <height>',
      'width <expr>',
      'height <expr>',
    ],
    SELineShape: [
      'straight',
      'stepped',
      'smooth',
    ],
    WithConstraint: [
      'with [.<cardinal>] [at] <place>',
    ],
    SETurn: [
      '[turn] cw | ccw',
      'turn <angle>',
    ],
  }

  const result = {}
  for (const [name, description] of Object.entries(defs)) {
    const syntax = overrides[name] || renderAlternatives(name)
    result[name] = { description, syntax }
  }
  return result
}

function extractExpressions() {
  return {
    precedence: [
      { level: 1, name: 'Logical OR',       operators: ['||'] },
      { level: 2, name: 'Logical AND',      operators: ['&&'] },
      { level: 3, name: 'Equality',         operators: ['==', '!='] },
      { level: 4, name: 'Relational',       operators: ['<', '>', '<=', '>='] },
      { level: 5, name: 'Additive',         operators: ['+', '-'] },
      { level: 6, name: 'Multiplicative',   operators: ['*', '/', '%'] },
      { level: 7, name: 'Power',            operators: ['^'] },
      { level: 8, name: 'Unary',            operators: ['+', '-', '!'] },
    ],
    qualifiers: [
      { syntax: '<expr>(<args>)',   description: 'function call' },
      { syntax: '<expr>[<index>]',  description: 'index access' },
      { syntax: '<expr>.<attr>',    description: 'attribute access' },
    ],
    conditionals: renderAlternatives('IfExpression')
      .filter(s => s.startsWith('if'))
      .concat(
        renderAlternatives('ConditionalExpression')
          .filter(s => s.includes('?'))
      ),
    assignment: {
      operators: ['=', '+=', '-=', '*=', '/=', '%='],
      syntax: renderAlternatives('Assignment'),
    },
    functions: {
      syntax: renderAlternatives('FunctionDefinitionExpression'),
    },
  }
}

function extractValues() {
  return [
    {
      name: 'Number',
      syntax: renderAlternatives('Number'),
      description: 'Integer, decimal, scientific notation; append % to divide by 100',
      examples: ['42', '3.14', '50%', '1e3', '.5'],
    },
    {
      name: 'Boolean',
      syntax: ['true | false'],
      description: 'Boolean true or false',
    },
    {
      name: 'Color',
      syntax: [
        '<model>(<r>, <g>, <b>[, <a>])',
        '#rrggbb[aa]',
        '#rgb[a]',
        '~<name>',
      ],
      description: 'Colors in various formats',
      examples: ['#f00', '#ff0000', '#ff000080', '~red', 'rgb(255, 0, 0)', 'hsl(0, 100, 50)', 'oklch(63, 0.26, 29)'],
      models: {
        rgb:   { params: ['r (0-255)', 'g (0-255)', 'b (0-255)', '[alpha (0-1)]'] },
        hsl:   { params: ['h (0-360)', 's (0-100)', 'l (0-100)', '[alpha (0-1)]'] },
        hsv:   { params: ['h (0-360)', 's (0-100)', 'v (0-100)', '[alpha (0-1)]'] },
        oklch: { params: ['L (0-100)', 'C (0-0.4)', 'h (0-360)', '[alpha (0-1)]'] },
      },
    },
    {
      name: 'String',
      syntax: [`"..." | '...'`],
      description: 'Single or double quoted, with standard escape sequences (\\n, \\t, \\\\, etc.)',
    },
    {
      name: 'Position',
      syntax: renderAlternatives('Position'),
      description: 'An (x, y) coordinate pair',
      examples: ['(100, 200)', '(x + 10, y)'],
    },
    {
      name: 'Array',
      syntax: ['[<expr>, ...]', '[]'],
      description: 'A list of values',
      examples: ['[1, 2, 3]', '[]', '[~red, ~blue]'],
    },
    {
      name: 'Range',
      syntax: ['[<start> .. <end>]'],
      description: 'An inclusive range between two values',
      examples: ['[1..10]', '[0..n-1]', '[~red .. ~blue]'],
    },
    {
      name: 'Timeline',
      syntax: ['@ (read current time)', '@@ (advance timeline)'],
      description: 'Access the animation timeline',
    },
    {
      name: 'Function',
      syntax: renderAlternatives('FunctionDefinitionExpression'),
      description: 'Lambda/arrow function expressions',
      examples: ['n => n * 2', '(x, y) => x + y', '=> Box'],
    },
  ]
}

// ──────────────────────────────────────────────── Builtin extraction (from .ts)

function extractBuiltins() {
  return {
    functions: extractTNatives(path.join(ROOT, 'src/builtins.ts')),
    typeMethods: extractTypeMethods(),
  }
}

function extractTNatives(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  return extractTNativesFromSource(src)
}

function extractTypeMethods() {
  const typeFiles = {
    'Number':   'src/types/tnumber.ts',
    'List':     'src/types/tlist.ts',
    'Color':    'src/types/tcolor.ts',
    'Range':    'src/types/trange.ts',
    'String':   'src/types/tstring.ts',
    'Position': 'src/types/tposition.ts',
    'Timeline': 'src/types/ttimeline.ts',
    'Font':     'src/types/tfont.ts',
    'Bool':     'src/types/tbool.ts',
  }

  const iterableSrc = fs.readFileSync(path.join(ROOT, 'src/types/iterable.ts'), 'utf8')
  const types = {}

  for (const [typeName, relPath] of Object.entries(typeFiles)) {
    const filePath = path.join(ROOT, relPath)
    const src = fs.readFileSync(filePath, 'utf8')

    const methods = extractTNatives(filePath)

    // Add iterable mixin methods if used
    if (src.includes('Iterable.addToAttrs') || src.includes('addToAttrs(this)')) {
      methods.push(...extractTNativesFromSource(iterableSrc))
    }

    // Computed attributes via handle_attr_X()
    const attrs = []
    const attrRe = /handle_attr_(\w+)\s*\(\)/g
    let am
    while ((am = attrRe.exec(src)) !== null) {
      attrs.push({ name: am[1] })
    }

    // Operators
    const operators = []
    const opMap = {
      'Plus':'+', 'Minus':'-', 'Times':'*', 'Divide':'/',
      'Pow':'^', 'Equal_to':'==', 'Not_equal_to':'!=',
      'Less_than':'<', 'Less_than_or_equal_to':'<=',
      'Greater_than_than':'>', 'Greater_than_than_or_equal_to':'>=',
    }
    const seenOps = new Set()
    const opRe = /op(Plus|Minus|Times|Divide|Pow|Equal_to|Not_equal_to|Less_than_or_equal_to|Greater_than_than_or_equal_to|Less_than|Greater_than_than)\s*\(/g
    let om
    while ((om = opRe.exec(src)) !== null) {
      const sym = opMap[om[1]]
      if (sym && !seenOps.has(sym)) { seenOps.add(sym); operators.push(sym) }
    }

    types[typeName] = { methods, attrs, operators }
  }

  return types
}

function extractTNativesFromSource(src) {
  const results = []
  // Param list uses backtick-delimited entries which may contain ] (e.g. `[step]`)
  // The [\s`,]* prefix handles empty arrays like [ ] as well as spacing
  const re = /new TNative\(\s*`([^`]+)`\s*,\s*\[[\s`,]*((?:`[^`]*`[\s,]*)*)\]\s*,\s*((?:`[^`]*`\s*(?:\+\s*)?)+)/g
  let m
  while ((m = re.exec(src)) !== null) {
    const name = m[1].replace(/\(\)$/, '')
    const paramsStr = m[2]
    const descRaw = m[3]
    const desc = descRaw
      .replace(/`\s*\+\s*`/g, '')
      .replace(/^`|`$/g, '')
      .replace(/\$\{[^}]+\}/g, '…')
      .trim()
    const params = paramsStr
      ? paramsStr.split(',').map(p => p.trim().replace(/`/g, '')).filter(Boolean)
      : []
    results.push({ name, params, description: desc })
  }
  return results
}

// ──────────────────────────────────────────────── Description fixups

// Some TNative descriptions have template literals that reference runtime values.
// We resolve them here rather than trying to eval the source.
const DESC_FIXUPS = {
  'Style is one of:':
    'Apply easing to the interpolation. Style is one of: linear, cubicIn, cubicOut, cubic, quadIn, quadOut, quad, bounce',
}

function fixupDescriptions(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) { obj.forEach(fixupDescriptions); return obj }
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'description' && typeof v === 'string') {
      for (const [pattern, replacement] of Object.entries(DESC_FIXUPS)) {
        if (v.includes(pattern)) {
          obj[k] = replacement
          break
        }
      }
    } else {
      fixupDescriptions(v)
    }
  }
  return obj
}

// ──────────────────────────────────────────────── Assemble and write

const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    grammarFile: 'src/peg_parser/jp.pegjs',
    ruleCount: grammar.rules.length,
  },
  statements: extractStatements(),
  shapes: extractShapes(),
  animations: extractAnimations(),
  options: extractOptions(),
  expressions: extractExpressions(),
  values: extractValues(),
  builtins: extractBuiltins(),
}

fixupDescriptions(output)
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
console.log(`Wrote ${OUTPUT_FILE}`)
console.log(`  ${output.statements.length} statements`)
console.log(`  ${output.shapes.length} shapes`)
console.log(`  ${output.animations.length} animations`)
console.log(`  ${Object.keys(output.options).length} option groups`)
console.log(`  ${output.values.length} value types`)
console.log(`  ${output.builtins.functions.length} builtin functions`)
console.log(`  ${Object.keys(output.builtins.typeMethods).length} types with methods`)
