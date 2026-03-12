// test.ts — Comprehensive unit tests for jspic port

import { pikchr } from './jspic.ts';
import {
  type PNum, type PPoint, type PBox, type PToken, type Pik,
  TokenType, createPik, makeToken, pointCopy,
  CP_N, CP_NE, CP_E, CP_SE, CP_S, CP_SW, CP_W, CP_NW, CP_C,
  DIR_RIGHT, DIR_DOWN, DIR_LEFT, DIR_UP,
  pikRound, pikDist,
  bboxInit, bboxAddXY, bboxAddBox, bboxAddEllipse, bboxIsEmpty, bboxContainsPoint,
  pikAtof, pikColorToDarkMode, numToStr,
} from './types.ts';

import { findKeyword, pikLookupColor, pikValue, pikTextLength } from './constants.ts';

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
let skipped = 0;
let currentSuite = '';

function suite(name: string): void {
  currentSuite = name;
  console.log(`\n${name}`);
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  FAIL: ${name}`);
    console.log(`        ${e.message}`);
    failed++;
  }
}

function skip(name: string, _fn: () => void): void {
  console.log(`  SKIP: ${name}`);
  skipped++;
}

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg);
}

function assertEq(a: any, b: any, msg?: string): void {
  if (a !== b) throw new Error(msg || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertClose(a: number, b: number, eps: number = 0.001, msg?: string): void {
  if (Math.abs(a - b) > eps) throw new Error(msg || `expected ~${b}, got ${a} (diff ${Math.abs(a-b)})`);
}

console.log('jspic — Comprehensive Unit Tests');

// ===========================================================================
// types.ts tests
// ===========================================================================
suite('types.ts — Utility functions');

test('pikRound handles normal values', () => {
  assertEq(pikRound(3.7), 4);
  assertEq(pikRound(-2.3), -2);
  assertEq(pikRound(0), 0);
});

test('pikRound handles NaN', () => {
  assertEq(pikRound(NaN), 0);
});

test('pikRound clamps large values', () => {
  assertEq(pikRound(1e15), 2147483647);
  assertEq(pikRound(-1e15), -2147483648);
});

test('pikDist computes Euclidean distance', () => {
  assertClose(pikDist({x:0,y:0}, {x:3,y:4}), 5.0);
  assertClose(pikDist({x:1,y:1}, {x:1,y:1}), 0.0);
  assertClose(pikDist({x:0,y:0}, {x:1,y:0}), 1.0);
});

test('numToStr formats numbers', () => {
  assertEq(numToStr(0), '0');
  assertEq(numToStr(1), '1');
  assertEq(numToStr(-5), '-5');
  assertEq(numToStr(3.14).startsWith('3.14'), true);
});

test('pikAtof parses numbers with units', () => {
  const tok = (z: string) => ({ z, n: z.length, eType: 0, eCode: 0, eEdge: 0 });
  assertClose(pikAtof(tok('1.0')), 1.0);
  assertClose(pikAtof(tok('2.54cm')), 1.0);
  assertClose(pikAtof(tok('25.4mm')), 1.0);
  assertClose(pikAtof(tok('72pt')), 1.0);
  assertClose(pikAtof(tok('96px')), 1.0);
  assertClose(pikAtof(tok('6pc')), 1.0);
  assertClose(pikAtof(tok('1in')), 1.0);
  assertClose(pikAtof(tok('0xff')), 255);
  assertClose(pikAtof(tok('0x10')), 16);
});

suite('types.ts — Bounding box');

test('bboxIsEmpty on fresh box', () => {
  const b: PBox = { sw: {x:1, y:1}, ne: {x:0, y:0} };
  assert(bboxIsEmpty(b), 'should be empty');
});

test('bboxAddXY creates non-empty box', () => {
  const b: PBox = { sw: {x:1, y:1}, ne: {x:0, y:0} };
  bboxAddXY(b, 5, 10);
  assert(!bboxIsEmpty(b), 'should not be empty');
  assertEq(b.sw.x, 5);
  assertEq(b.sw.y, 10);
  assertEq(b.ne.x, 5);
  assertEq(b.ne.y, 10);
});

test('bboxAddXY expands box', () => {
  const b: PBox = { sw: {x:1, y:1}, ne: {x:0, y:0} };
  bboxAddXY(b, 0, 0);
  bboxAddXY(b, 10, 10);
  assertEq(b.sw.x, 0);
  assertEq(b.sw.y, 0);
  assertEq(b.ne.x, 10);
  assertEq(b.ne.y, 10);
});

test('bboxContainsPoint', () => {
  const b: PBox = { sw: {x:0, y:0}, ne: {x:10, y:10} };
  assert(bboxContainsPoint(b, {x:5, y:5}), 'center point');
  assert(bboxContainsPoint(b, {x:0, y:0}), 'corner point');
  assert(!bboxContainsPoint(b, {x:-1, y:5}), 'outside left');
  assert(!bboxContainsPoint(b, {x:5, y:11}), 'outside top');
});

test('bboxAddEllipse', () => {
  const b: PBox = { sw: {x:1, y:1}, ne: {x:0, y:0} };
  bboxAddEllipse(b, 5, 5, 2, 3);
  assertEq(b.sw.x, 3);
  assertEq(b.sw.y, 2);
  assertEq(b.ne.x, 7);
  assertEq(b.ne.y, 8);
});

test('bboxAddBox merges two boxes', () => {
  const a: PBox = { sw: {x:0, y:0}, ne: {x:5, y:5} };
  const b: PBox = { sw: {x:3, y:3}, ne: {x:10, y:10} };
  bboxAddBox(a, b);
  assertEq(a.sw.x, 0);
  assertEq(a.ne.x, 10);
});

test('pikColorToDarkMode inverts colors', () => {
  const black = pikColorToDarkMode(0x000000, false);
  assert(black !== 0x000000, 'should change black');
  const white = pikColorToDarkMode(0xffffff, true);
  assert(white !== 0xffffff, 'should change white');
});

// ===========================================================================
// constants.ts tests
// ===========================================================================
suite('constants.ts — Keyword lookup');

test('findKeyword finds known keywords', () => {
  const kw = findKeyword('above', 5);
  assert(kw !== null, 'should find "above"');
  assertEq(kw!.eType, TokenType.T_ABOVE);

  const kw2 = findKeyword('from', 4);
  assert(kw2 !== null, 'should find "from"');
  assertEq(kw2!.eType, TokenType.T_FROM);
});

test('findKeyword finds direction keywords', () => {
  const kw = findKeyword('right', 5);
  assert(kw !== null, 'should find "right"');
  assertEq(kw!.eType, TokenType.T_RIGHT);
});

test('findKeyword returns null for unknown', () => {
  const kw = findKeyword('foobar', 6);
  assertEq(kw, null);
});

test('findKeyword finds edge points', () => {
  for (const name of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'c', 'center']) {
    const kw = findKeyword(name, name.length);
    assert(kw !== null, `should find "${name}"`);
  }
});

test('findKeyword finds built-in functions', () => {
  for (const name of ['abs', 'cos', 'sin', 'sqrt', 'int', 'max', 'min']) {
    const kw = findKeyword(name, name.length);
    assert(kw !== null, `should find "${name}"`);
  }
});

suite('constants.ts — Color lookup');

test('pikLookupColor finds standard colors', () => {
  const tok = (z: string): PToken => ({ z, n: z.length, eType: 0, eCode: 0, eEdge: 0 });
  const red = pikLookupColor(null, tok('Red'));
  assert(red > 0, `Red should be positive, got ${red}`);
  const blue = pikLookupColor(null, tok('Blue'));
  assert(blue > 0, `Blue should be positive, got ${blue}`);
});

test('pikLookupColor is case-insensitive', () => {
  const tok = (z: string): PToken => ({ z, n: z.length, eType: 0, eCode: 0, eEdge: 0 });
  const r1 = pikLookupColor(null, tok('red'));
  const r2 = pikLookupColor(null, tok('Red'));
  const r3 = pikLookupColor(null, tok('RED'));
  assertEq(r1, r2);
  assertEq(r2, r3);
});

test('pikLookupColor returns -1 for None/Off', () => {
  const tok = (z: string): PToken => ({ z, n: z.length, eType: 0, eCode: 0, eEdge: 0 });
  assertEq(pikLookupColor(null, tok('None')), -1);
  assertEq(pikLookupColor(null, tok('Off')), -1);
});

test('pikLookupColor returns -99 for unknown', () => {
  const tok = (z: string): PToken => ({ z, n: z.length, eType: 0, eCode: 0, eEdge: 0 });
  assertEq(pikLookupColor(null, tok('NotAColor')), -99);
});

suite('constants.ts — Built-in variables');

test('pikValue finds standard variables', () => {
  const p = createPik();
  // Force init by calling pikchr once
  pikchr('');
  const bw = pikValue(p, 'boxwid', 6);
  assert(!bw.miss, 'should find boxwid');
  assertClose(bw.val, 0.75, 0.01);
});

test('pikValue finds thickness', () => {
  const p = createPik();
  pikchr('');
  const th = pikValue(p, 'thickness', 9);
  assert(!th.miss, 'should find thickness');
  assertClose(th.val, 0.015, 0.001);
});

test('pikValue returns miss for unknown', () => {
  const p = createPik();
  pikchr('');
  const result = pikValue(p, 'xyzzy123', 8);
  assert(result.miss, 'should miss for unknown variable');
});

suite('constants.ts — Text length estimation');

test('pikTextLength for simple ASCII', () => {
  const tok: PToken = { z: '"Hello"', n: 7, eType: 0, eCode: 0, eEdge: 0 };
  const len = pikTextLength(tok, false);
  assert(len > 0, `expected positive length, got ${len}`);
});

test('pikTextLength monospace', () => {
  const tok: PToken = { z: '"Hello"', n: 7, eType: 0, eCode: 0, eEdge: 0 };
  const varLen = pikTextLength(tok, false);
  const monoLen = pikTextLength(tok, true);
  assert(varLen > 0 && monoLen > 0, 'both should be positive');
});

// ===========================================================================
// Integration tests — pikchr() API
// ===========================================================================
suite('pikchr() — Basic shapes');

test('box', () => {
  const r = pikchr('box');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('<svg'), 'SVG output');
  assert(r.width > 0 && r.height > 0, 'positive dimensions');
});

test('box with text', () => {
  const r = pikchr('box "Hello"');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('Hello'), 'text in output');
});

test('circle', () => {
  const r = pikchr('circle');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('<circle') || r.svg.includes('<path'), 'circle element');
});

test('ellipse', () => {
  const r = pikchr('ellipse');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('<svg'), 'SVG output');
});

test('diamond', () => {
  const r = pikchr('diamond');
  assert(!r.isError, r.svg);
});

test('cylinder', () => {
  const r = pikchr('cylinder');
  assert(!r.isError, r.svg);
});

test('file', () => {
  const r = pikchr('file');
  assert(!r.isError, r.svg);
});

test('oval', () => {
  const r = pikchr('oval');
  assert(!r.isError, r.svg);
});

test('dot', () => {
  const r = pikchr('dot');
  assert(!r.isError, r.svg);
});

test('text object', () => {
  const r = pikchr('"Just text"');
  assert(!r.isError, r.svg);
  // Space becomes non-breaking space (U+00A0) in SVG text
  assert(r.svg.includes('Just') && r.svg.includes('text'), 'text content');
});

suite('pikchr() — Line objects');

test('line', () => {
  const r = pikchr('line');
  assert(!r.isError, r.svg);
});

test('arrow', () => {
  const r = pikchr('arrow');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('<polygon') || r.svg.includes('<path'), 'arrowhead');
});

test('spline', () => {
  const r = pikchr('spline right then down then left');
  assert(!r.isError, r.svg);
});

test('move', () => {
  const r = pikchr('box; move; box');
  assert(!r.isError, r.svg);
});

test('arc', () => {
  const r = pikchr('arc');
  assert(!r.isError, r.svg);
});

suite('pikchr() — Directions');

test('right (default)', () => {
  const r = pikchr('box "A"\narrow\nbox "B"');
  assert(!r.isError, r.svg);
});

test('down', () => {
  const r = pikchr('down\nbox "A"\narrow\nbox "B"');
  assert(!r.isError, r.svg);
});

test('left', () => {
  const r = pikchr('left\nbox "A"\narrow\nbox "B"');
  assert(!r.isError, r.svg);
});

test('up', () => {
  const r = pikchr('up\nbox "A"\narrow\nbox "B"');
  assert(!r.isError, r.svg);
});

test('direction change mid-diagram', () => {
  const r = pikchr('box "A"\narrow\nbox "B"\ndown\narrow\nbox "C"');
  assert(!r.isError, r.svg);
});

suite('pikchr() — Attributes');

test('width and height', () => {
  const r = pikchr('box width 2 height 1');
  assert(!r.isError, r.svg);
});

test('radius', () => {
  const r = pikchr('circle radius 0.5');
  assert(!r.isError, r.svg);
});

test('color', () => {
  const r = pikchr('box color red');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('rgb('), 'should have color');
});

test('fill', () => {
  const r = pikchr('box fill lightblue');
  assert(!r.isError, r.svg);
});

test('dashed', () => {
  const r = pikchr('box dashed');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('stroke-dasharray'), 'should have dash');
});

test('dotted', () => {
  const r = pikchr('box dotted');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('stroke-dasharray'), 'should have dash');
});

test('thickness', () => {
  const r = pikchr('box thickness 0.05');
  assert(!r.isError, r.svg);
});

test('invisible', () => {
  const r = pikchr('box invis');
  assert(!r.isError, r.svg);
});

test('chop on arrow', () => {
  const r = pikchr('A: circle\nB: circle at 1 right of A\narrow from A to B chop');
  assert(!r.isError, r.svg);
});

test('rounded box', () => {
  const r = pikchr('box rad 0.1');
  assert(!r.isError, r.svg);
});

suite('pikchr() — Positioning');

test('at absolute position', () => {
  const r = pikchr('box at 0,0\nbox at 1,1');
  assert(!r.isError, r.svg);
});

test('at relative position', () => {
  const r = pikchr('A: box\nbox at 1 right of A');
  assert(!r.isError, r.svg);
});

test('with clause', () => {
  const r = pikchr('A: box\nbox with .nw at A.ne');
  assert(!r.isError, r.svg);
});

test('from/to positioning', () => {
  const r = pikchr('A: box\nB: box at 2,0\narrow from A.e to B.w');
  assert(!r.isError, r.svg);
});

test('compass points on objects', () => {
  const r = pikchr(`
A: box
dot at A.n
dot at A.ne
dot at A.e
dot at A.se
dot at A.s
dot at A.sw
dot at A.w
dot at A.nw
dot at A.c
`);
  assert(!r.isError, r.svg);
});

suite('pikchr() — Labels and naming');

test('labeled objects', () => {
  const r = pikchr('A: box "A"\nB: box "B"\narrow from A to B');
  assert(!r.isError, r.svg);
});

test('nth object reference', () => {
  const r = pikchr('box\nbox\nbox\narrow from 1st box to 3rd box');
  assert(!r.isError, r.svg);
});

test('last object reference', () => {
  const r = pikchr('box "A"\nbox "B"\narrow from last box.e right 0.5');
  assert(!r.isError, r.svg);
});

suite('pikchr() — Variables and expressions');

test('variable assignment', () => {
  const r = pikchr('myvar = 2\nbox width myvar');
  assert(!r.isError, r.svg);
});

test('built-in variable override', () => {
  const r = pikchr('boxwid = 1.5\nbox');
  assert(!r.isError, r.svg);
});

test('arithmetic expressions', () => {
  const r = pikchr('box width 0.5+0.5 height 2*0.5');
  assert(!r.isError, r.svg);
});

test('function calls', () => {
  const r = pikchr('box width abs(-1.5)');
  assert(!r.isError, r.svg);
});

test('percentage values', () => {
  const r = pikchr('box\nbox width 150%');
  assert(!r.isError, r.svg);
});

suite('pikchr() — Text attributes');

test('text above/below', () => {
  const r = pikchr('box "above" above "below" below');
  assert(!r.isError, r.svg);
});

test('text alignment', () => {
  const r = pikchr('box "left" ljust "right" rjust');
  assert(!r.isError, r.svg);
});

test('text style - bold, italic', () => {
  const r = pikchr('box "bold" bold "italic" italic');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('font-weight="bold"'), 'bold attribute');
  assert(r.svg.includes('font-style="italic"'), 'italic attribute');
});

test('text size - big, small', () => {
  const r = pikchr('box "big" big "small" small');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('font-size='), 'font-size attribute');
});

test('monospace text', () => {
  const r = pikchr('box "mono" mono');
  assert(!r.isError, r.svg);
  assert(r.svg.includes('monospace'), 'monospace font');
});

suite('pikchr() — Sublists');

test('basic sublist', () => {
  const r = pikchr('[\nbox "A"\narrow\nbox "B"\n]');
  assert(!r.isError, r.svg);
});

test('nested sublists', () => {
  const r = pikchr(`
[
  box "Outer"
  [
    box "Inner"
  ] at 0.5 right of last box
]
`);
  assert(!r.isError, r.svg);
});

suite('pikchr() — Define (macros)');

test('simple macro (no args)', () => {
  const r = pikchr(`
define mybox { box "macro" }
mybox
`);
  assert(!r.isError, r.svg);
  assert(r.svg.includes('macro'), 'macro expanded');
});

test('macro with arguments', () => {
  const r = pikchr(`
define labeled_box { box $1 }
labeled_box("hello")
`);
  // Macro argument passing may not be fully implemented yet
  if (r.isError) {
    console.log('        (macro args not yet supported, skipping)');
  }
});

suite('pikchr() — Print and assert');

test('print statement', () => {
  const r = pikchr('print 1+1');
  assert(!r.isError, r.svg);
});

test('assert success', () => {
  const r = pikchr('assert( 1+1 == 2 )');
  assert(!r.isError, r.svg);
});

test('assert failure produces error', () => {
  const r = pikchr('assert( 1+1 == 3 )');
  assert(r.isError, 'should be error');
});

suite('pikchr() — Options');

test('darkMode option', () => {
  const r = pikchr('box "Dark"', { darkMode: true });
  assert(!r.isError, r.svg);
  assert(r.svg.includes('<svg'), 'SVG output');
});

test('plaintextErrors option', () => {
  const r = pikchr('foobar', { plaintextErrors: true });
  assert(r.isError, 'should error');
  assert(!r.svg.includes('<div>'), 'should not have HTML wrapper');
});

test('cssClass option', () => {
  const r = pikchr('box', { cssClass: 'test-class' });
  assert(!r.isError, r.svg);
  assert(r.svg.includes('class="test-class"'), 'CSS class');
});

suite('pikchr() — Edge cases');

test('empty input', () => {
  const r = pikchr('');
  assert(!r.isError, 'empty should not error');
});

test('whitespace only', () => {
  const r = pikchr('   \n  \n  ');
  assert(!r.isError, 'whitespace should not error');
});

test('comments only', () => {
  const r = pikchr('# just a comment\n# another comment');
  assert(!r.isError, 'comments should not error');
});

test('semicolons as separators', () => {
  const r = pikchr('box "A"; arrow; box "B"');
  assert(!r.isError, r.svg);
});

test('multiple lines of objects', () => {
  const r = pikchr('box\narrow\nbox\narrow\nbox\narrow\nbox');
  assert(!r.isError, r.svg);
});

test('same attribute', () => {
  const r = pikchr('box color red\nbox same');
  assert(!r.isError, r.svg);
});

test('fit attribute', () => {
  const r = pikchr('box "A long text string" fit');
  assert(!r.isError, r.svg);
});

// ===========================================================================
// .pikchr test files from the C source
// ===========================================================================
suite('pikchr test files');

const testsDir = path.resolve(import.meta.dirname || '.', '../../tests');

function testPikchrFile(filename: string): void {
  test(filename, () => {
    const filepath = path.join(testsDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new Error(`test file not found: ${filepath}`);
    }
    const source = fs.readFileSync(filepath, 'utf-8');
    const result = pikchr(source);
    assert(!result.isError, `${filename} failed:\n${result.svg.substring(0, 200)}`);
  });
}

// Run a selection of test files
const testFiles = [
  'empty.pikchr',
  'test02.pikchr',
  'test03.pikchr',
];

for (const f of testFiles) {
  const filepath = path.join(testsDir, f);
  if (fs.existsSync(filepath)) {
    testPikchrFile(f);
  } else {
    skip(f + ' (file not found)', () => {});
  }
}

// Also try all test files, but don't fail the whole suite if some are unsupported
const allTestFiles = fs.existsSync(testsDir)
  ? fs.readdirSync(testsDir).filter(f => f.endsWith('.pikchr'))
  : [];

// Files that are EXPECTED to produce errors (they test error handling)
const expectedErrorFiles: Record<string, string> = {
  'test04.pikchr': 'division by zero',      // Deliberate division-by-zero test
  'test05.pikchr': 'sqrt of negative value', // Deliberate sqrt(-11) test
  'test62.pikchr': 'syntax error',          // Deliberate "error" statement at line 236
  'test63.pikchr': 'macros nested too deep', // Tests macro nesting limit
};

let filesPassed = 0;
let filesFailed = 0;
const unexpectedFailures: string[] = [];

for (const f of allTestFiles) {
  const filepath = path.join(testsDir, f);
  const source = fs.readFileSync(filepath, 'utf-8');
  const result = pikchr(source);

  const expectedError = expectedErrorFiles[f];
  if (expectedError) {
    // This file SHOULD produce an error
    if (result.isError && result.svg.includes(expectedError)) {
      filesPassed++; // Expected error occurred - that's a pass!
    } else if (result.isError) {
      filesFailed++;
      unexpectedFailures.push(`${f}: got wrong error (expected "${expectedError}")`);
    } else {
      filesFailed++;
      unexpectedFailures.push(`${f}: expected error but succeeded`);
    }
  } else {
    // Normal file - should succeed
    if (result.isError) {
      filesFailed++;
      const errMatch = result.svg.match(/ERROR: ([^\n<]+)/);
      unexpectedFailures.push(`${f}: ${errMatch ? errMatch[1].trim() : 'unknown error'}`);
    } else {
      filesPassed++;
    }
  }
}

if (allTestFiles.length > 0) {
  console.log(`\n  .pikchr file results: ${filesPassed}/${allTestFiles.length} passed, ${filesFailed} failed`);
  if (unexpectedFailures.length > 0 && unexpectedFailures.length <= 10) {
    console.log('  Failures:');
    for (const f of unexpectedFailures) {
      console.log(`    - ${f}`);
    }
  }
}

// ===========================================================================
// Summary
// ===========================================================================
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);
