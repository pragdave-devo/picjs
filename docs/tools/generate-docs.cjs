#!/usr/bin/env node

// Phase 2: Read grammar-data.json and produce jp-language-reference.md

const fs   = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const DATA_FILE   = path.join(ROOT, 'docs/grammar-data.json')
const OUTPUT_FILE = path.join(ROOT, 'docs/jp-language-reference.md')

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
const lines = []

function emit(...args)  { lines.push(args.join('')) }
function blank()        { lines.push('') }
function heading(level, text, anchor) {
  if (anchor) {
    emit(`<a id="${anchor}"></a>`)
    blank()
  }
  emit(`${'#'.repeat(level)} ${text}`)
  blank()
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function link(text, anchor) { return `[${text}](#${anchor})` }
function code(s) { return `\`${s}\`` }

// ──────────────────────────────────────────────── Title & TOC

emit('# jp Language Reference')
blank()

// Navigation index with collapsible sections
emit('<details open><summary><strong>Contents</strong></summary>')
blank()

const tocSections = [
  ['Statements', 'statements'],
  ['Shapes', 'shapes',
    data.shapes.filter(s => s.variants.length > 0 || s.optionSets.length > 0)
      .map(s => [s.name, slugify(s.name)])],
  ['Animations', 'animations',
    data.animations.map(a => [a.name, slugify(a.name)])],
  ['Shape Options', 'shape-options'],
  ['Expressions', 'expressions'],
  ['Value Types', 'value-types',
    data.values.map(v => [v.name, slugify(v.name)])],
  ['Built-in Functions', 'built-in-functions'],
  ['Type Methods', 'type-methods',
    Object.entries(data.builtins.typeMethods)
      .filter(([, v]) => v.methods.length > 0 || v.attrs.length > 0)
      .map(([k]) => [k, slugify(k + '-methods')])],
]

for (const section of tocSections) {
  const [title, anchor, children] = section
  emit(`- ${link(title, anchor)}`)
  if (children) {
    for (const [childTitle, childAnchor] of children) {
      emit(`  - ${link(childTitle, childAnchor)}`)
    }
  }
}
blank()
emit('</details>')
blank()
emit('---')
blank()

// ──────────────────────────────────────────────── Statements

heading(2, 'Statements')

emit('| Statement | Description |')
emit('|-----------|-------------|')
for (const stmt of data.statements) {
  const name = stmt.name === 'Shape'
    ? link('Shape', 'shapes')
    : stmt.name === 'AnimationSequence'
    ? link('Animation', 'animations')
    : stmt.name
  emit(`| ${name} | ${stmt.description} |`)
}
blank()

for (const stmt of data.statements) {
  if (['Shape', 'AnimationSequence'].includes(stmt.name)) continue
  if (stmt.syntax.length === 0) continue
  emit(`**${stmt.name}**`)
  blank()
  for (const s of stmt.syntax) {
    emit(`- ${code(s)}`)
  }
  blank()
}

// ──────────────────────────────────────────────── Shapes

heading(2, 'Shapes')

emit(`Every shape accepts ${link('common options', 'common-options')} `)
emit(`(label, position, fill, stroke, rotation, CSS class) `)
emit(`plus the shape-specific options listed below.`)
blank()

for (const shape of data.shapes) {
  if (shape.variants.length === 0 && shape.optionSets.length === 0) continue

  heading(3, shape.name)

  if (shape.variants.length > 0) {
    for (const v of shape.variants) {
      emit(`- ${code(v)}`)
    }
    blank()
  }

  // List shape-specific option sets (skip SECommon, it's universal)
  const specificOpts = shape.optionSets.filter(o => o !== 'SECommon')
  if (specificOpts.length > 0) {
    emit('**Options:** ', specificOpts
      .map(o => link(optionDisplayName(o), 'opt-' + slugify(optionDisplayName(o))))
      .join(', '))
    blank()
  }
}

// ──────────────────────────────────────────────── Animations

heading(2, 'Animations')

emit(`Animations can be chained with ${code('then')} to run sequentially.`)
emit(`Each animation accepts optional ${code('take <duration>')} `)
emit(`and ${code('ease <name>')} parameters.`)
blank()

emit(`**Easing functions:** ${code('linear')}, ${code('cubicIn')}, ${code('cubicOut')}, `)
emit(`${code('cubic')}, ${code('quadIn')}, ${code('quadOut')}, ${code('quad')}, ${code('bounce')}`)
blank()

for (const anim of data.animations) {
  heading(3, anim.name)

  for (const v of anim.variants) {
    emit(`- ${code(v)}`)
  }
  blank()
}

// ──────────────────────────────────────────────── Shape Options

heading(2, 'Shape Options')

// Common options first
const common = data.options.SECommon
heading(3, 'Common Options', 'common-options')

emit(common.description + '.')
blank()

for (const s of common.syntax) {
  emit(`- ${code(s)}`)
}
blank()

// Other option groups
const OPTION_ORDER = [
  'SESize', 'SERadius', 'SERadii',
  'SELineEndings', 'SELineShape', 'SELineLength',
  'SEText', 'SETurn', 'WithConstraint',
]

for (const key of OPTION_ORDER) {
  const opt = data.options[key]
  if (!opt) continue

  const displayName = optionDisplayName(key)
  heading(3, displayName, 'opt-' + slugify(displayName))

  emit(opt.description + '.')
  blank()

  for (const s of opt.syntax) {
    emit(`- ${code(s)}`)
  }
  blank()
}

// ──────────────────────────────────────────────── Expressions

heading(2, 'Expressions')

heading(3, 'Operator Precedence')
emit('Lowest precedence first (loosest binding at top):')
blank()

emit('| Precedence | Name | Operators |')
emit('|:---:|------|-----------|')
for (const p of data.expressions.precedence) {
  emit(`| ${p.level} | ${p.name} | ${p.operators.map(code).join('  ')} |`)
}
blank()

heading(3, 'Access & Calls')
for (const q of data.expressions.qualifiers) {
  emit(`- ${code(q.syntax)} — ${q.description}`)
}
blank()

heading(3, 'Conditionals')
for (const c of data.expressions.conditionals) {
  emit(`- ${code(c)}`)
}
blank()

heading(3, 'Assignment')
emit(`${code('<target> <op> <expr>')} where ${code('<op>')} is one of: ${data.expressions.assignment.operators.map(code).join(', ')}`)
blank()

heading(3, 'Functions')
emit(`Arrow function syntax (see also ${link('Function type', 'function')}):`)
blank()
for (const s of data.expressions.functions.syntax) {
  emit(`- ${code(s)}`)
}
blank()

// ──────────────────────────────────────────────── Value Types

heading(2, 'Value Types')

for (const val of data.values) {
  heading(3, val.name)

  emit(val.description + '.')
  blank()

  for (const s of val.syntax) {
    emit(`- ${code(s)}`)
  }
  blank()

  if (val.examples) {
    emit(`**Examples:** ${val.examples.map(code).join(', ')}`)
    blank()
  }

  // Color models sub-table
  if (val.models) {
    emit('**Color models:**')
    blank()
    emit('| Model | Parameters |')
    emit('|-------|------------|')
    for (const [model, info] of Object.entries(val.models)) {
      emit(`| ${code(model)} | ${info.params.join(', ')} |`)
    }
    blank()
  }
}

// ──────────────────────────────────────────────── Built-in Functions

heading(2, 'Built-in Functions')

emit('| Function | Parameters | Description |')
emit('|----------|------------|-------------|')
for (const fn of data.builtins.functions) {
  const params = fn.params.length > 0 ? fn.params.join(', ') : '—'
  emit(`| ${code(fn.name)} | ${params} | ${fn.description} |`)
}
blank()

// ──────────────────────────────────────────────── Type Methods

heading(2, 'Type Methods')

emit(`Methods and properties available on each ${link('value type', 'value-types')}.`)
blank()

for (const [typeName, info] of Object.entries(data.builtins.typeMethods)) {
  if (info.methods.length === 0 && info.attrs.length === 0) continue

  heading(3, `${typeName}`, slugify(typeName + '-methods'))

  if (info.attrs.length > 0) {
    emit(`**Properties:** ${info.attrs.map(a => code('.' + a.name)).join(', ')}`)
    blank()
  }

  if (info.operators.length > 0) {
    emit(`**Operators:** ${info.operators.map(code).join(' ')}`)
    blank()
  }

  if (info.methods.length > 0) {
    emit('| Method | Parameters | Description |')
    emit('|--------|------------|-------------|')
    for (const m of info.methods) {
      const params = m.params.length > 0 ? m.params.join(', ') : '—'
      // Clean up _emphasis_ from descriptions for markdown
      const desc = m.description.replace(/_([^_]+)_/g, '*$1*')
      emit(`| ${code('.' + m.name + '()')} | ${params} | ${desc} |`)
    }
    blank()
  }
}

// ──────────────────────────────────────────────── Footer

emit('---')
blank()
emit(`*Generated from ${data.meta.grammarFile} (${data.meta.ruleCount} rules) on ${data.meta.generatedAt.split('T')[0]}*`)
blank()

// ──────────────────────────────────────────────── Helpers

function optionDisplayName(key) {
  const names = {
    SECommon:       'Common Options',
    SELabel:        'Label',
    SEPos:          'Position',
    SERotation:     'Rotation',
    SEFill:         'Fill',
    SEStroke:       'Stroke',
    SEStrokeAttr:   'Stroke',
    SEClass:        'CSS Class',
    SESize:         'Size',
    SERadius:       'Radius',
    SERadii:        'Corner Radii',
    SELineEndings:  'Line Endings',
    SELineShape:    'Line Shape',
    SELineLength:   'Line Length',
    SEText:         'Text Options',
    SETurn:         'Turn Direction',
    WithConstraint: 'Constraint',
  }
  return names[key] || key
}

// ──────────────────────────────────────────────── Write output

const output = lines.join('\n')
fs.writeFileSync(OUTPUT_FILE, output)
console.log(`Wrote ${OUTPUT_FILE} (${lines.length} lines)`)
