---
title: The picjs Language
description: Variables, functions, closures and the values picjs works with
layout: layouts/doc.njk
eleventyNavigation:
  key: The picjs Language
  order: 4
---

Diagrams are programs. picjs has variables, functions and closures, and every
value carries attributes you can add to — which is what makes mixins and
constructors possible.

picjs is a mini programming language. It has variables:

~~~ picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
b1 = box "one"
Gap
b2 = box "two"
arc from b1.n to b2.n
~~~

picjs has lists, ranges, strings, booleans, and positions. It comes with the usual set of operators
(`+`, `-`) and so on, and it tries to apply them polymorphically:

``` picjs code
1 + 2         // 3
[ 1, 2 ] + 3  // [4, 5]
"cow" + 99    // "cow99"
3 * (2, 3)    // (6, 9)   (x,y) is a position
```

It has `if` statements:

```
if (condition)
  expression_or_block
else
  expression_or_block
```

_condition_ is an expression evaluating to a boolean.

_expression_or_block_ is either a single expression or a set of expressions enclosed in braces.

``` picjs code
if (name == "Dave")
  box "Hello"
else {
  circle "Sorry"
  oval   "Don't know you"
}
```
The `else` is optional.

## Functions

A function is created using the `=>` operator. It may be preceded by a list of parameters, and
it must be followed by an _expression_or_block_.

The _parameters_ are a list of names between parentheses, separated by commas. The parentheses
can be omitted if there is only one parameter.

``` picjs code

// a function that applies `* 2` to its parameter
n => n * 2

// return the (x,y) coordinates given polar coordinates
(r, theta) => r*(sin(theta), cos(theta))

// draw a circle inside a box
=> {
  b = box
  circle rad .3 fill ~f2 at b
}
```

You'll typically assign function values to variables or pass them to other functions.

~~~ picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
short_box = label =>
   box ht 0.3 "--#{label}--"

[1,2,3].each(short_box)
~~~

## Blocks and Groups

Blocks and groups have identical syntax: a set of expressions enclosed in braces.

A _block_ is used when you want to provide multiple expressions as the body of a function, or in
the arms of an `if` expression.

``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
if (Box.width < 2) {
  Box wid 1 "Hello"
  Box wid 2 "World"
}
```

A _group_ is used when you want to associate a set of drawing objects and treat them as a single
entity.

``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
{
  Box wid 1 "Hello"
  Box wid 2 "World"
}
```

The value of a block is the value of the last expression executed. The value of a group is a
shape object (an instance of `Group`).

The shapes inside a group are positioned relative to the group as a whole, and so when you
position the group, you position the shapes it contains. Also, if you set the `Face` direction
in a group, it is restored when the group exits.

This is a common pattern for centering variable height lists.

``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
{
  Face s
  box "A"
  box "B"
  box "C"
}
Gap .2
{
  Face s
  box "D"
  box "E"
}
Gap .2
box "F"
```

Because they're shapes, groups can be positioned.

``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
c = circle "Circle"
{
  box "A"
  box "B"
  box "C"
} with .s at c.n
```

A group can also paint a background behind its contents, and `pad` holds them
away from its edges.

``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
Group fill ~b7 pad .2 {
  box "Pat"
  Gap .2
  box "Joey"
  Gap .2
  box "Syd"
}
```

Because a group is a value, you can pass one to a function — and you do not
have to name it first. Here the second group is written straight into the call.

``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
Palette.current = "sunset"

titled = (g, title) => Label (title) with .s at g.n - (0, .1)

titled(Group fill ~b3 pad .2 {
  Face s
  box "Pat"
  box "Joey"
}, "Team One")

Gap .5

titled(Group fill ~b3 pad .2 {
  Face e
  box "Sam"
  box "Kim"
}, "Team Two")
```

## Functions Are Closures

~~~ picjs example scale=15
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
multiplier = a => {
  b => Label "#{a} x #{b} = #{a*b}"
}

times_2 = multiplier(2)
times_3 = multiplier(3)

Face s
Label.fill = ~black
times_2(5)
times_2(6)
times_3(7)
times_3(8)
~~~

In this example, `multiplier` is a function that returns another function. That second function
draws a label, using the `b`, its parameter and `a`, which is the enclosed value passed to the
function that created it.

## Attributes Are Dynamic

Every value in picjs can have attributes. Many value types have predefined attributes. When you
write `box.fill = ~b2` you're setting the `fill` attribute of a Box value, and when you write `len =
aline.length` you're accessing the `length` attribute of a line.
The [quick reference](./quick-reference) starts with a list of all predefined attributes, and the
[full reference](./picjs-reference) goes into more detail.

You can also add your own attributes to a value. If your attribute name is a valid variable name,
you just reference it as `value.some_name`. If the name isn't a valid variable name, use the syntax
`value[attr name]`. Both versions can be used both to fetch the current value and set a new value
(using assignment).

One use of this is to add flags to certain shapes. For example, in an animation of the Towers of
Hanoi, you might want to add an attribute to each disk saying which tower it is currently on.

Because functions are values, you can assign them to attributes. On its own, this ability is not
particularly useful. But a simple trick means you can use it to implement the equivalent of object
constructors.

## Functions + Closures == Constructors

Let's make a box that can hold other, smaller, boxes. Having created the outer box, we'd like it to
have a `.add` function that places its argument at the next available position in the box.


``` picjs example
//-
Box.stroke = ~f1
Box.thickness = 0.01
//+
make_container_of = shape => {
   next_nw = (0,0)
   shape.add = other => {
      other.nw = (shape.nw + next_nw)
      next_nw.x += other.width
      if (other.width + next_nw.x > shape.width) {
        next_nw.x = 0
        next_nw.y += 1
      }
  }
  shape
}

b = make_container_of(box 4x4)

[~red..~blue].steps(8, shade => {
  b.add(box "A" fill shade)
  b.add(box "B" fill shade.desaturate(.5))
})
```

We'll start towards the end of the code.

`b = make_container_of(box 4x4)` first creates a 4-by-4 box, then passes it to the
`make_container_of` function. This function augments the box with an `add` function.

The skeleton of this function is:

``` picjs code
make_container_of = shape => {
  // ...
  shape.add = other => {
    // ...
  }
  shape
}
```
This creates an `add` attribute on the shape we pass in. The value of that attribute is a function
that takes the shape we're adding. We'll get to that next.

Finally, the function returns the shape.

How does `add` work? It relies on the fact that function definitions act as closures.

``` picjs code
next_nw = (0,0)
shape.add = other => {
   other.nw = (shape.nw + next_nw)
   next_nw.x += other.width
   if (other.width + next_nw.x > shape.width) {
     next_nw.x = 0
     next_nw.y += 1
   }
}
```
We create a variable `next_nw` in the outer scope. This is the position within the outer shape that
we want to position the northwest corner of the next box we add. Then comes the `add` function body.
It makes copious use of the variables `shape` and `next_nw`. Both of these are defined outside the
body of `add`, so they are automatically enclosed: this particular incantation of `add` will have
these variables accessible even after `make_container_of` returns, and those variables will be
unique to that particular function. If we call `make_container_of` again on a new shape, then it
will have different `shape` and `next_nw` variables.
