// test-new-parser.ts — Test the new AST-based parser+evaluator
// Runs key tests with useNewParser=true and compares to old parser output

import { picjs, setUseNewParser } from './picjs.ts';

let passed = 0;
let failed = 0;

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

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg);
}

console.log('picjs — New Parser Tests\n');

// Test cases: pairs of (description, source)
const testCases: [string, string][] = [
  ['empty', ''],
  ['single box', 'box'],
  ['box with text', 'box "Hello"'],
  ['circle', 'circle'],
  ['ellipse', 'ellipse'],
  ['diamond', 'diamond'],
  ['cylinder', 'cylinder'],
  ['file', 'file'],
  ['oval', 'oval'],
  ['dot', 'dot'],
  ['text object', '"Just text"'],
  ['line', 'line'],
  ['arrow', 'arrow'],
  ['spline with then', 'spline right then down then left'],
  ['move', 'box; move; box'],
  ['arc', 'arc'],
  ['direction right', 'box "A"\narrow\nbox "B"'],
  ['direction down', 'down\nbox "A"\narrow\nbox "B"'],
  ['direction left', 'left\nbox "A"\narrow\nbox "B"'],
  ['direction up', 'up\nbox "A"\narrow\nbox "B"'],
  ['width and height', 'box width 2 height 1'],
  ['radius', 'circle radius 0.5'],
  ['color', 'box color red'],
  ['fill', 'box fill lightblue'],
  ['dashed', 'box dashed'],
  ['dotted', 'box dotted'],
  ['thickness', 'box thickness 0.05'],
  ['invisible', 'box invis'],
  ['chop', 'A: circle\nB: circle at 1 right of A\narrow from A to B chop'],
  ['rounded box', 'box rad 0.1'],
  ['at absolute', 'box at 0,0\nbox at 1,1'],
  ['at relative', 'A: box\nbox at 1 right of A'],
  ['with clause', 'A: box\nbox with .nw at A.ne'],
  ['from/to', 'A: box\nB: box at 2,0\narrow from A.e to B.w'],
  ['labeled objects', 'A: box "A"\nB: box "B"\narrow from A to B'],
  ['nth reference', 'box\nbox\nbox\narrow from 1st box to 3rd box'],
  ['last reference', 'box "A"\nbox "B"\narrow from last box.e right 0.5'],
  ['variable assignment', 'myvar = 2\nbox width myvar'],
  ['builtin override', 'boxwid = 1.5\nbox'],
  ['arithmetic', 'box width 0.5+0.5 height 2*0.5'],
  ['function call', 'box width abs(-1.5)'],
  ['percentage', 'box\nbox width 150%'],
  ['text above/below', 'box "above" above "below" below'],
  ['text alignment', 'box "left" ljust "right" rjust'],
  ['text bold italic', 'box "bold" bold "italic" italic'],
  ['text big small', 'box "big" big "small" small'],
  ['monospace', 'box "mono" mono'],
  ['sublist', '[\nbox "A"\narrow\nbox "B"\n]'],
  ['print', 'print 1+1'],
  ['assert success', 'assert( 1+1 == 2 )'],
  ['semicolons', 'box "A"; arrow; box "B"'],
  ['multiple objects', 'box\narrow\nbox\narrow\nbox\narrow\nbox'],
  ['same', 'box color red\nbox same'],
  ['fit', 'box "A long text string" fit'],
  ['define no args', 'define mybox { box "macro" }\nmybox'],
  ['compass points', 'A: box\ndot at A.n\ndot at A.ne\ndot at A.e\ndot at A.se\ndot at A.s\ndot at A.sw\ndot at A.w\ndot at A.nw'],
  ['for range', 'for x from 0 to 3 do { box }'],
  ['for in', 'for x in [0.5, 1.0, 1.5] do { circle rad x }'],
  ['macro with args', 'define labeled_box { box $1 }\nlabeled_box("hello")'],
  ['macro in position', 'define point { ( $2*cos($1), $2*sin($1) ) }\ntheta = 0\nr = 0.5\nbox at point(theta, r)'],
  ['assert position', 'A: box\nassert( A == A )'],
  ['direction change mid', 'box "A"\narrow\nbox "B"\ndown\narrow\nbox "C"'],
  ['nested sublist', '[\n  box "Outer"\n  [\n    box "Inner"\n  ] at 0.5 right of last box\n]'],
  ['even with', 'box "A"\nline right until even with 1 right of last box'],
  ['darkMode', 'box "Dark"'],
  ['between', 'A: box\nB: box at 2,0\nC: box at 0.5 between A and B'],
  ['string interpolation', 'x = 42\nbox "Value is ${x}"'],
];

// First, run with old parser to get reference output
console.log('Running comparison tests...\n');

let matchCount = 0;
let mismatchCount = 0;

for (const [name, source] of testCases) {
  test(name, () => {
    // Old parser
    setUseNewParser(false);
    const oldResult = picjs(source);

    // New parser
    setUseNewParser(true);
    const newResult = picjs(source);

    // Both should succeed or both should fail
    if (oldResult.isError !== newResult.isError) {
      if (newResult.isError) {
        // Extract error message
        const errMatch = newResult.svg.match(/ERROR: ([^\n<]+)/);
        const errMsg = errMatch ? errMatch[1].trim() : newResult.svg.substring(0, 200);
        throw new Error(`old parser succeeded but new parser failed: ${errMsg}`);
      } else {
        throw new Error(`old parser failed but new parser succeeded`);
      }
    }

    if (!oldResult.isError) {
      // Compare SVG output
      if (oldResult.svg === newResult.svg) {
        matchCount++;
      } else {
        mismatchCount++;
        // Find first difference
        const maxLen = Math.max(oldResult.svg.length, newResult.svg.length);
        let diffPos = 0;
        for (let i = 0; i < maxLen; i++) {
          if (oldResult.svg[i] !== newResult.svg[i]) { diffPos = i; break; }
        }
        const context = 40;
        const oldSnippet = oldResult.svg.substring(Math.max(0, diffPos - context), diffPos + context);
        const newSnippet = newResult.svg.substring(Math.max(0, diffPos - context), diffPos + context);
        throw new Error(
          `SVG mismatch at position ${diffPos}:\n` +
          `        old: ...${oldSnippet}...\n` +
          `        new: ...${newSnippet}...`
        );
      }
    }
  });
}

// ============================================================
// Test example files
// ============================================================
console.log('\nTesting example files...\n');

import * as fs from 'fs';
import * as path from 'path';

const examplesDir = path.resolve(import.meta.dirname || '.', '../examples');
if (fs.existsSync(examplesDir)) {
  const exampleFiles = fs.readdirSync(examplesDir).filter(f => f.endsWith('.picjs'));
  for (const f of exampleFiles) {
    test(`example: ${f}`, () => {
      const source = fs.readFileSync(path.join(examplesDir, f), 'utf-8');

      setUseNewParser(false);
      const oldResult = picjs(source);

      setUseNewParser(true);
      const newResult = picjs(source);

      if (oldResult.isError !== newResult.isError) {
        if (newResult.isError) {
          const errMatch = newResult.svg.match(/ERROR: ([^\n<]+)/);
          throw new Error(`new parser failed: ${errMatch ? errMatch[1].trim() : newResult.svg.substring(0, 200)}`);
        } else {
          throw new Error('old parser failed but new parser succeeded');
        }
      }
      if (!oldResult.isError && oldResult.svg !== newResult.svg) {
        const maxLen = Math.max(oldResult.svg.length, newResult.svg.length);
        let diffPos = 0;
        for (let i = 0; i < maxLen; i++) {
          if (oldResult.svg[i] !== newResult.svg[i]) { diffPos = i; break; }
        }
        const ctx = 60;
        throw new Error(
          `SVG mismatch at pos ${diffPos}:\n` +
          `  old: ...${oldResult.svg.substring(Math.max(0, diffPos - ctx), diffPos + ctx)}...\n` +
          `  new: ...${newResult.svg.substring(Math.max(0, diffPos - ctx), diffPos + ctx)}...`
        );
      }
    });
  }
}

// ============================================================
// Phase 2A: New feature tests (new parser only)
// ============================================================
console.log('\nPhase 2A: New feature tests (new parser only)...\n');

setUseNewParser(true);

// Boolean literals
test('yes literal equals 1', () => {
  const r = picjs('assert(yes == 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('no literal equals 0', () => {
  const r = picjs('assert(no == 0)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

// Comparison operators
test('greater than true', () => {
  const r = picjs('assert(2 > 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('greater than false', () => {
  const r = picjs('assert(1 > 2)');
  assert(r.isError, `expected failure but got success`);
});

test('less than', () => {
  const r = picjs('assert(1 < 2)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('greater or equal', () => {
  const r = picjs('assert(2 >= 2)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('less or equal', () => {
  const r = picjs('assert(1 <= 2)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('not equal', () => {
  const r = picjs('assert(1 != 2)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('not equal false', () => {
  const r = picjs('assert(1 != 1)');
  assert(r.isError, `expected failure but got success`);
});

test('comparison in expression', () => {
  const r = picjs('val = 1 + (2 > 1)\nassert(val == 2)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

// Logical operators
test('and true', () => {
  const r = picjs('assert(1 and 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('and false', () => {
  const r = picjs('assert(1 and 0)');
  assert(r.isError, `expected failure but got success`);
});

test('or true', () => {
  const r = picjs('assert(0 or 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('or false', () => {
  const r = picjs('assert(0 or 0)');
  assert(r.isError, `expected failure but got success`);
});

test('not true', () => {
  const r = picjs('assert(not 0)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('not false', () => {
  const r = picjs('assert(not 1)');
  assert(r.isError, `expected failure but got success`);
});

test('not not double negation', () => {
  const r = picjs('assert(not not 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('compound logical', () => {
  const r = picjs('assert(1 > 0 and 2 > 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('or short-circuit', () => {
  const r = picjs('assert(1 or 0)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('precedence: not binds tighter than and', () => {
  // not 0 and 1 => (not 0) and 1 => 1 and 1 => 1
  const r = picjs('assert(not 0 and 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('precedence: and binds tighter than or', () => {
  // 0 and 1 or 1 => (0 and 1) or 1 => 0 or 1 => 1
  const r = picjs('assert(0 and 1 or 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('comparison with arithmetic', () => {
  const r = picjs('assert(1 + 1 == 2)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('boolean in variable', () => {
  const r = picjs('flag = yes\nassert(flag == 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('between syntax still works', () => {
  // Verify < > in position context are still between-brackets
  const r = picjs('A: box\nB: box at 2,0\nC: box at 0.5 between A and B');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('angle bracket between syntax', () => {
  // Verify n<p1,p2> between syntax works
  const r = picjs('A: box\nB: box at 2,0\narrow from 1/2<A,B> to B');
  assert(!r.isError, `expected success: ${r.svg}`);
});

// Phase 2B: Functions
test('function producing shapes', () => {
  const r = picjs('$pair = fn() { box "A"; arrow; box "B" }\n$pair()');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('A'), 'should contain A');
  assert(r.svg.includes('B'), 'should contain B');
});

test('function with numeric params', () => {
  const r = picjs('$sized = fn(bw, bh) { box width bw height bh }\n$sized(2, 1)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('$variable assignment and read', () => {
  const r = picjs('$val = 42\nassert($val == 42)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('$pi backward compat', () => {
  const r = picjs('assert($pi > 3)');
  assert(!r.isError, `$pi should be accessible: ${r.svg}`);
});

test('function with color param', () => {
  const r = picjs('$cbox = fn(clr) { box color clr }\n$cbox(0xff0000)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('nested function calls', () => {
  const r = picjs('$a = fn() { box "alpha" }\n$b = fn() { $a(); arrow; box "beta" }\n$b()');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('alpha'), 'should contain "alpha"');
  assert(r.svg.includes('beta'), 'should contain "beta"');
});

test('function called multiple times', () => {
  const r = picjs('$bx = fn() { box "X" }\n$bx()\narrow\n$bx()');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('string expression in assignment', () => {
  const r = picjs('$s = "hello"');
  assert(!r.isError, `expected success: ${r.svg}`);
});

// Phase 2C: Case expressions
test('case basic match', () => {
  const r = picjs('$x = 1\ncase $x {\n  1 => { box "one" }\n  2 => { box "two" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('one'), 'should contain "one"');
});

test('case second arm match', () => {
  const r = picjs('$x = 2\ncase $x {\n  1 => { box "one" }\n  2 => { box "two" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('two'), 'should contain "two"');
});

test('case no match', () => {
  const r = picjs('$x = 3\ncase $x {\n  1 => { box "one" }\n  2 => { box "two" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(!r.svg.includes('one'), 'should not contain "one"');
  assert(!r.svg.includes('two'), 'should not contain "two"');
});

test('case with expression', () => {
  const r = picjs('$x = 1 + 1\ncase $x {\n  1 => { box "one" }\n  2 => { box "two" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('two'), 'should match 2');
});

test('case producing shapes', () => {
  const r = picjs('$shape = 1\ncase $shape {\n  1 => { box "alpha"; arrow; box "beta" }\n  2 => { circle "gamma" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('alpha'), 'should contain "alpha"');
  assert(r.svg.includes('beta'), 'should contain "beta"');
});

test('case with string matching', () => {
  const r = picjs('$s = "red"\ncase $s {\n  "blue" => { box "blue" }\n  "red" => { box "red" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('red'), 'should contain "red"');
});

test('case in for loop', () => {
  const r = picjs('for i from 1 to 3 do {\n  case i {\n    1 => { box "A" }\n    2 => { box "B" }\n    3 => { box "C" }\n  }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('A'), 'should contain "A"');
  assert(r.svg.includes('B'), 'should contain "B"');
  assert(r.svg.includes('C'), 'should contain "C"');
});

// Reset to old parser
setUseNewParser(false);

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`SVG matches: ${matchCount}, mismatches: ${mismatchCount}`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);
