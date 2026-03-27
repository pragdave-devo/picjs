// test-new-parser.ts — Test the picjs parser and evaluator

import { picjs } from './picjs.ts';

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

console.log('picjs — Parser Tests\n');

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
  ['from/to explicit edges', 'A: box\nB: box at 2,0\narrow from A.e to B.w'],
  ['from/to implicit (auto-chop)', 'A: box "A"\nmove\nB: box "B"\narrow from A to B'],
  ['nth reference', 'box\nmove\nbox\nmove\nbox\narrow from 1st box to 3rd box'],
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
  ['for range', 'for _i from 0 to 3 do { box }'],
  ['for in', 'for _r in [0.5, 1.0, 1.5] do { circle rad _r }'],
  ['macro with args', 'define labeled_box { box $1 }\nlabeled_box("hello")'],
  ['macro in position', 'define point { ( $2*cos($1), $2*sin($1) ) }\ntheta = 0\nr = 0.5\nbox at point(theta, r)'],
  ['assert position', 'A: box\nassert( A == A )'],
  ['direction change mid', 'box "A"\narrow\nbox "B"\ndown\narrow\nbox "C"'],
  ['nested sublist', '[\n  box "Outer"\n  [\n    box "Inner"\n  ] at 0.5 right of last box\n]'],
  ['even with', 'box "A"\nline right until even with 1 right of last box'],
  ['darkMode', 'box "Dark"'],
  ['between', 'A: box\nB: box at 2,0\nC: box at 0.5 between A and B'],
  ['string interpolation', 'val = 42\nbox "Value is ${val}"'],
];

// Run basic syntax tests
console.log('Running basic syntax tests...\n');

for (const [name, source] of testCases) {
  test(name, () => {
    const result = picjs(source);
    if (result.isError) {
      const errMatch = result.svg.match(/ERROR: ([^\n<]+)/);
      const errMsg = errMatch ? errMatch[1].trim() : result.svg.substring(0, 200);
      throw new Error(`parse error: ${errMsg}`);
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
      const result = picjs(source);
      if (result.isError) {
        const errMatch = result.svg.match(/ERROR: ([^\n<]+)/);
        throw new Error(`parse error: ${errMatch ? errMatch[1].trim() : result.svg.substring(0, 200)}`);
      }
    });
  }
}

// ============================================================
// New feature tests
// ============================================================
console.log('\nNew feature tests...\n');

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

// Containing attribute
test('containing with $variable', () => {
  const r = picjs('$a = "hello"\nbox containing $a');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('hello'), 'should contain "hello"');
});

test('con shorthand', () => {
  const r = picjs('$a = "hello"\nbox con $a');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('hello'), 'should contain "hello"');
});

test('containing with literal string', () => {
  const r = picjs('box containing "literal"');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('literal'), 'should contain "literal"');
});

test('containing with number', () => {
  const r = picjs('$n = 42\nbox containing $n');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('42'), 'should contain "42"');
});

test('containing in function', () => {
  const r = picjs('$labeled = fn($txt) { box containing $txt }\n$labeled("dynamic")');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('dynamic'), 'should contain "dynamic"');
});

test('string interpolation with $var', () => {
  const r = picjs('$a = "world"\nbox "hello ${$a}"');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('hello'), 'should contain "hello"');
  assert(r.svg.includes('world'), 'should contain "world"');
});

// If/else statements
test('if true branch', () => {
  const r = picjs('$x = 5\nif $x > 3 { box "yes" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('yes'), 'should contain "yes"');
});

test('if false branch', () => {
  const r = picjs('$x = 2\nif $x > 3 { box "yes" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(!r.svg.includes('yes'), 'should not contain "yes"');
});

test('if-else true', () => {
  const r = picjs('$x = 5\nif $x > 3 { box "yes" } else { box "no" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('yes'), 'should contain "yes"');
  assert(!r.svg.includes('>no<'), 'should not contain "no"');
});

test('if-else false', () => {
  const r = picjs('$x = 2\nif $x > 3 { box "yes" } else { box "no" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(!r.svg.includes('>yes<'), 'should not contain "yes"');
  assert(r.svg.includes('no'), 'should contain "no"');
});

test('if with boolean', () => {
  const r = picjs('$flag = yes\nif $flag { box "on" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('on'), 'should contain "on"');
});

test('if with boolean false', () => {
  const r = picjs('$flag = no\nif $flag { box "on" } else { box "off" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('off'), 'should contain "off"');
});

test('if in loop', () => {
  const r = picjs('for i from 1 to 3 do {\n  if i == 2 { box "two" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('two'), 'should contain "two"');
});

// Case default arm
test('case with underscore default', () => {
  const r = picjs('$x = 99\ncase $x {\n  1 => { box "one" }\n  _ => { box "other" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('other'), 'should contain "other"');
});

test('case with else default', () => {
  const r = picjs('$x = 99\ncase $x {\n  1 => { box "one" }\n  else => { box "other" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('other'), 'should contain "other"');
});

test('case default not taken when matched', () => {
  const r = picjs('$x = 1\ncase $x {\n  1 => { box "one" }\n  _ => { box "other" }\n}');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('one'), 'should contain "one"');
  assert(!r.svg.includes('>other<'), 'should not contain "other"');
});

// List functions - Phase 1
test('len of list', () => {
  const r = picjs('$a = [1, 2, 3]\n$n = len($a)\nbox containing $n');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('3'), 'should contain "3"');
});

test('len of string', () => {
  const r = picjs('$s = "hello"\n$n = len($s)\nbox containing $n');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('head of list', () => {
  const r = picjs('$a = ["first", "second"]\n$h = head($a)\nbox containing $h');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('first'), 'should contain "first"');
});

test('last of list', () => {
  const r = picjs('$a = ["first", "second", "third"]\n$l = last($a)\nbox containing $l');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('third'), 'should contain "third"');
});

test('push to list', () => {
  const r = picjs('$a = [1, 2]\n$b = push($a, 3)\nbox containing len($b)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('3'), 'should contain "3"');
});

test('push does not mutate original', () => {
  const r = picjs('$a = [1, 2]\n$b = push($a, 3)\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('2'), 'should contain "2" (original unchanged)');
});

test('pop from list', () => {
  const r = picjs('$a = [1, 2, 3]\n$b = pop($a)\nbox containing len($b)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('2'), 'should contain "2"');
});

test('shift from list', () => {
  const r = picjs('$a = ["a", "b", "c"]\n$b = shift($a)\n$first = head($b)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('b'), 'should contain "b"');
});

test('unshift to list', () => {
  const r = picjs('$a = [2, 3]\n$b = unshift($a, 1)\n$first = head($b)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('1'), 'should contain "1"');
});

test('reverse list', () => {
  const r = picjs('$a = ["a", "b", "c"]\n$b = reverse($a)\n$first = head($b)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('c'), 'should contain "c"');
});

test('reverse string', () => {
  const r = picjs('$s = "abc"\n$r = reverse($s)\nbox containing $r');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('cba'), 'should contain "cba"');
});

test('contains true', () => {
  const r = picjs('$a = [1, 2, 3]\nif contains($a, 2) { box "found" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('found'), 'should contain "found"');
});

test('contains false', () => {
  const r = picjs('$a = [1, 2, 3]\nif contains($a, 5) { box "found" } else { box "missing" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('missing'), 'should contain "missing"');
});

test('contains string in string', () => {
  const r = picjs('$s = "hello world"\nif contains($s, "world") { box "found" }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('found'), 'should contain "found"');
});

test('list functions chained', () => {
  const r = picjs('$a = [1, 2, 3]\n$b = push(push($a, 4), 5)\nbox containing len($b)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

// List Phase 2 - join, split, concatenation
test('join list with separator', () => {
  const r = picjs('$a = ["a", "b", "c"]\n$s = join($a, "-")\nbox containing $s');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('a-b-c'), 'should contain "a-b-c"');
});

test('join numbers', () => {
  const r = picjs('$a = [1, 2, 3]\n$s = join($a, ",")\nbox containing $s');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('1,2,3'), 'should contain "1,2,3"');
});

test('split string', () => {
  const r = picjs('$s = "a-b-c"\n$a = split($s, "-")\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('3'), 'should contain "3"');
});

test('split and access', () => {
  const r = picjs('$s = "hello world"\n$a = split($s, " ")\n$first = head($a)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('hello'), 'should contain "hello"');
});

test('list concatenation with +', () => {
  const r = picjs('$a = [1, 2]\n$b = [3, 4]\n$c = $a + $b\nbox containing len($c)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('4'), 'should contain "4"');
});

test('string concatenation with +', () => {
  const r = picjs('$a = "hello"\n$b = "_world"\n$c = $a + $b\nbox containing $c');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('hello_world'), 'should contain "hello_world"');
});

test('string + number concatenation', () => {
  const r = picjs('$a = "value:"\n$b = 42\n$c = $a + $b\nbox containing $c');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('value:42'), 'should contain "value:42"');
});

// List Phase 3 - range expressions
test('numeric range ascending', () => {
  const r = picjs('$a = [1..5]\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('numeric range descending', () => {
  const r = picjs('$a = [5..1]\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('numeric range access', () => {
  const r = picjs('$a = [10..15]\n$third = head(shift(shift($a)))\nbox containing $third');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('12'), 'should contain "12"');
});

test('single char string range', () => {
  const r = picjs('$a = ["A".."E"]\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('single char string range access', () => {
  const r = picjs('$a = ["A".."E"]\n$third = head(shift(shift($a)))\nbox containing $third');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('C'), 'should contain "C"');
});

test('string range descending', () => {
  const r = picjs('$a = ["Z".."V"]\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('multi-char string range', () => {
  const r = picjs('$a = ["A1".."A5"]\nbox containing len($a)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('multi-char string range access', () => {
  const r = picjs('$a = ["X1".."X3"]\n$second = head(shift($a))\nbox containing $second');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('X2'), 'should contain "X2"');
});

test('range in for loop', () => {
  const r = picjs('for i in [1..3] do { box containing i }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('1'), 'should contain "1"');
  assert(r.svg.includes('2'), 'should contain "2"');
  assert(r.svg.includes('3'), 'should contain "3"');
});

test('char range in for loop', () => {
  // Note: string loop variables must use $-prefix for rich values
  const r = picjs('for $ch in ["A".."C"] do { box containing $ch }');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('A'), 'should contain "A"');
  assert(r.svg.includes('B'), 'should contain "B"');
  assert(r.svg.includes('C'), 'should contain "C"');
});

// List Phase 4 - map, filter, sort
test('map doubles numbers', () => {
  const r = picjs('$double = fn($x) { $result = $x * 2 }\n$a = [1, 2, 3]\n$b = map($a, $double)\nbox containing last($b)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('6'), 'should contain "6" (3*2)');
});

test('filter keeps evens', () => {
  const r = picjs('$even = fn($x) { $result = ($x / 2) == int($x / 2) }\n$a = [1, 2, 3, 4, 5, 6]\n$b = filter($a, $even)\nbox containing len($b)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('3'), 'should contain "3" (2, 4, 6)');
});

test('sort numbers ascending', () => {
  const r = picjs('$a = [3, 1, 4, 1, 5]\n$b = sort($a)\n$first = head($b)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('1'), 'should contain "1"');
});

test('sort strings', () => {
  const r = picjs('$a = ["c", "a", "b"]\n$b = sort($a)\n$first = head($b)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('a'), 'should contain "a"');
});

test('sort does not mutate', () => {
  const r = picjs('$a = [3, 1, 2]\n$b = sort($a)\n$first = head($a)\nbox containing $first');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('3'), 'should contain "3" (original unchanged)');
});

// Phase 2F: Implicit function return values (via last statement value)
test('function returns last assignment - number', () => {
  const r = picjs('$add = fn($a, $b) { $sum = $a + $b }\n$result = $add(3, 4)\nbox containing $result');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('7'), 'should contain "7"');
});

test('function returns last assignment - string', () => {
  const r = picjs('$greet = fn($name) { $msg = "Hello " + $name }\n$result = $greet("World")\nbox containing $result');
  assert(!r.isError, `expected success: ${r.svg}`);
  // SVG renderer converts spaces to NBSP (U+00A0)
  assert(r.svg.includes('Hello') && r.svg.includes('World'), 'should contain "Hello World"');
});

test('function returns value from if branch', () => {
  const r = picjs('$abs = fn($x) {\n  if $x < 0 { $r = 0 - $x } else { $r = $x }\n}\n$v = $abs(-5)\nbox containing $v');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('5'), 'should contain "5"');
});

test('function returns value from case', () => {
  const r = picjs('$grade = fn($score) {\n  case $score {\n    100 => { $g = "A+" }\n    90 => { $g = "A" }\n    _ => { $g = "B" }\n  }\n}\n$result = $grade(100)\nbox containing $result');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('A+'), 'should contain "A+"');
});

test('function returns shape as obj', () => {
  // Shapes return VObj which can be used for positioning
  const r = picjs('$make = fn($txt) { box containing $txt fit }\n$make("test")\narrow\nbox "after"');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('test'), 'should contain "test"');
  assert(r.svg.includes('after'), 'should contain "after"');
});

test('map with assignment return', () => {
  const r = picjs('$square = fn($x) { $r = $x * $x }\n$squares = map([1, 2, 3], $square)\nbox containing last($squares)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('9'), 'should contain "9" (3*3)');
});

test('filter with assignment return', () => {
  const r = picjs('$big = fn($x) { $r = $x > 2 }\n$filtered = filter([1, 2, 3, 4], $big)\nbox containing len($filtered)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.svg.includes('2'), 'should contain "2" (3 and 4)');
});

// Unified expression tests (positions, objects, edges as expressions)
console.log('\n--- Unified expressions ---');

test('position literal (x, y)', () => {
  const r = picjs('$p = (1, 2)\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('(1,2)'), 'should print (1,2)');
});

test('position addition', () => {
  const r = picjs('$p = (1, 2) + (3, 4)\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('(4,6)'), 'should print (4,6)');
});

test('position subtraction', () => {
  const r = picjs('$p = (5, 5) - (2, 1)\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('(3,4)'), 'should print (3,4)');
});

test('position * scalar', () => {
  const r = picjs('$p = (2, 3) * 2\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('(4,6)'), 'should print (4,6)');
});

test('position / scalar', () => {
  const r = picjs('$p = (6, 8) / 2\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('(3,4)'), 'should print (3,4)');
});

test('scalar * position', () => {
  const r = picjs('$p = 3 * (1, 2)\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('(3,6)'), 'should print (3,6)');
});

test('object edge as expression', () => {
  const r = picjs('B: box at (0, 0)\n$p = B.ne\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  // B.ne should be the northeast corner, some position
  assert(r.printOutput?.includes('('), 'should print a position');
});

test('object edge + offset', () => {
  const r = picjs('B: box at (0, 0)\n$p = B.ne + (1, 0)\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('('), 'should print a position');
});

test('$var.edge compass access', () => {
  const r = picjs('B: box\n$b = B\n$p = $b.n\nprint $p');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('('), 'should print a position');
});

test('indexed object edge: $arr[i].edge', () => {
  const r = picjs('Peg1: box\nPeg2: box\n$pegs = [Peg1, Peg2]\nmove to $pegs[0].s\nbox');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('from obj.edge right dist (direction after position)', () => {
  const r = picjs('box "A"\nbox "B"\narrow from last box.e right 0.5');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('right until even with syntax', () => {
  const r = picjs('A: box\nB: box at (2, 1)\nline from A.e right until even with B.w');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('right until even with position offset', () => {
  const r = picjs('A: box\nB: box at (2, 1)\nqtr = 0.25\nline from A.e right until even with B.n - (qtr, 0)');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('angle bracket between with nth object', () => {
  const r = picjs('A: circle\nB: box\nC: box\narrow to 5/8<A.w, 2nd last box>');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('bare nth object as expression', () => {
  const r = picjs('box\nbox\narrow to 2nd last box');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('2nd last box in position context', () => {
  const r = picjs('box\nbox\nmove to 2nd last box');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('simple angle bracket between', () => {
  const r = picjs('A: box\nB: box\narrow to 1/2<A, B>');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('angle bracket with edge', () => {
  const r = picjs('A: box\nB: box\narrow to 1/2<A.w, B.e>');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('angle bracket with last box', () => {
  const r = picjs('A: box\nB: box\narrow to 1/2<A.w, last box>');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('position+offset then direction attribute', () => {
  const r = picjs('A: box\nline from A.e + (0, 0.1) right 0.5');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('position+offset then until even with', () => {
  const r = picjs('A: box\nB: box at (2, 1)\nline from A.e + (0, 0.1) right until even with B.n');
  assert(!r.isError, `expected success: ${r.svg}`);
});

test('nested empty lists', () => {
  const r = picjs('$piles = [ [1,2], [], [] ]\nprint len($piles)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('3'), 'should have 3 elements');
});

test('list with variable then empty lists', () => {
  const r = picjs('$disks = [1, 2, 3]\n$piles = [ $disks, [], [] ]\nprint len($piles)');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('3'), 'should have 3 piles');
});

test('$arr[i].edge.x in expression', () => {
  const r = picjs('B1: box at (0, 0)\nB2: box at (2, 0)\n$pegs = [B1, B2]\nprint $pegs[1].c.x');
  assert(!r.isError, `expected success: ${r.svg}`);
  assert(r.printOutput?.includes('2'), 'should print x=2');
});

test('$arr[i].edge in alter value', () => {
  const r = picjs(`B1: box at (0, 0)
B2: box at (2, 0)
$pegs = [B1, B2]
$disk = B1
starting 0 take 0.5 { alter $disk.c.x to $pegs[1].c.x }`);
  assert(!r.isError, `expected success: ${r.svg}`);
});

// Phase 3A: Animation parsing
console.log('\n--- Animation parsing ---');

test('basic animation parses without error', () => {
  const r = picjs('box "A"\nstarting 0 take 1 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('animation with easing parses', () => {
  const r = picjs('box "A"\nstarting 0 take 1 ease cubic {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('animation with ease in/out parses', () => {
  const r = picjs('box "A"\nstarting 0 take 2 ease in quad ease out cubic {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('animation with bounce parses', () => {
  const r = picjs('box "A"\nstarting 0 take 1 bounce 0.3 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('animation assigned to variable parses', () => {
  const r = picjs('box "A"\n$s1 = starting 0 take 1 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('animation with ending keyword parses', () => {
  const r = picjs('box "A"\nending 5 take 2 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('animation with multiple alters parses', () => {
  const r = picjs('box "A"\ncircle "B"\nstarting 0 take 1 {\n  alter last box.fill to Red\n  alter last circle.fill to Blue\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
});

// Animation evaluation tests
console.log('\n--- Animation evaluation ---');

import { getAnimations } from './evaluator.ts';

test('animation creates descriptor with correct timing', () => {
  picjs('box "A"\nstarting 2.5 take 1.5 {\n  alter last box.fill to Red\n}');
  const anims = getAnimations();
  assert(anims.length === 1, `expected 1 animation, got ${anims.length}`);
  assert(anims[0].startTime === 2.5, `expected start=2.5, got ${anims[0].startTime}`);
  assert(anims[0].duration === 1.5, `expected dur=1.5, got ${anims[0].duration}`);
});

test('animation captures easing', () => {
  picjs('box "A"\nstarting 0 take 1 ease cubic {\n  alter last box.fill to Red\n}');
  const anims = getAnimations();
  assert(anims[0].easeIn === 'cubic', `expected easeIn=cubic, got ${anims[0].easeIn}`);
  assert(anims[0].easeOut === 'cubic', `expected easeOut=cubic, got ${anims[0].easeOut}`);
});

test('animation creates alter descriptor', () => {
  picjs('box "A"\nstarting 0 take 1 {\n  alter last box.fill to Red\n}');
  const anims = getAnimations();
  assert(anims[0].alterations.length === 1, 'expected 1 alteration');
  assert(anims[0].alterations[0].property === 'fill', `expected fill, got ${anims[0].alterations[0].property}`);
});

test('$var.start property access works', () => {
  const r = picjs('box "A"\n$s1 = starting 3 take 2 {\n  alter last box.fill to Red\n}\nprint $s1.start');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('$var.end property access works', () => {
  const r = picjs('box "A"\n$s1 = starting 3 take 2 {\n  alter last box.fill to Red\n}\nprint $s1.end');
  assert(!r.isError, 'should not error: ' + r.svg);
});

test('chained animation timing via $var.end', () => {
  const r = picjs('box "A"\ncircle "B"\n$s1 = starting 0 take 2 {\n  alter last box.fill to Red\n}\n$s2 = starting $s1.end + 1 take 3 {\n  alter last circle.fill to Blue\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
  const anims = getAnimations();
  assert(anims.length === 2, `expected 2 animations, got ${anims.length}`);
  // $s1.end = 0 + 2 = 2, so $s2 start = 2 + 1 = 3
  assert(anims[1].startTime === 3, `expected s2 start=3, got ${anims[1].startTime}`);
});

console.log('\n--- Opacity & constraints ---');
test('box with opacity renders style', () => {
  const r = picjs('box opacity 0.5');
  assert(!r.isError, 'should not error: ' + r.svg);
  assert(r.svg.includes('opacity:0.5'), `expected opacity in SVG, got: ${r.svg}`);
});

test('box with opacity 1 does not render opacity style', () => {
  const r = picjs('box');
  assert(!r.isError, 'should not error: ' + r.svg);
  assert(!r.svg.includes('opacity:'), 'default opacity should not appear in SVG');
});

test('box opacity 0 renders opacity:0', () => {
  const r = picjs('box opacity 0');
  assert(!r.isError, 'should not error: ' + r.svg);
  assert(r.svg.includes('opacity:0'), `expected opacity:0, got: ${r.svg}`);
});

test('opacity works on circle', () => {
  const r = picjs('circle opacity 0.3');
  assert(!r.isError, 'should not error: ' + r.svg);
  assert(r.svg.includes('opacity:0.3'), `expected opacity:0.3, got: ${r.svg}`);
});

console.log('\n--- Animation SVG output ---');
test('animated SVG contains JSON data block', () => {
  const r = picjs('box "A"\nstarting 0 take 1 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
  assert(r.isAnimated, 'should be animated');
  assert(r.svg.includes('data-picjs-anim'), 'should contain animation data script');
  assert(r.svg.includes('"animations"'), 'should contain animations key in JSON');
});

test('animated SVG wraps target in g with data-picjs-id', () => {
  const r = picjs('box "A"\nstarting 0 take 1 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error: ' + r.svg);
  assert(r.svg.includes('data-picjs-id='), 'should contain data-picjs-id attribute');
});

test('non-animated SVG has no animation data', () => {
  const r = picjs('box "Hello"');
  assert(!r.isError, 'should not error');
  assert(!r.isAnimated, 'should not be animated');
  assert(!r.svg.includes('data-picjs-anim'), 'should not contain animation data');
  assert(!r.svg.includes('data-picjs-id'), 'should not contain picjs-id');
});

test('isAnimated flag set correctly', () => {
  const r1 = picjs('box');
  assert(!r1.isAnimated, 'plain box should not be animated');
  const r2 = picjs('box\nstarting 0 take 1 {\n  alter last box.fill to Blue\n}');
  assert(r2.isAnimated, 'box with animation should be animated');
});

test('animated SVG contains animation data (JSON)', () => {
  const r = picjs('box\nstarting 0 take 1 {\n  alter last box.fill to Red\n}');
  assert(!r.isError, 'should not error');
  assert(r.svg.includes('data-picjs-anim'), 'should contain animation JSON data');
  assert(!r.svg.includes('requestAnimationFrame'), 'should NOT embed runtime JS');
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);
