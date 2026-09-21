---
title: picjs Guide
description: An introduction to picjs, a constraint-based drawing and animation language
date: 2026-04-21
layout: layouts/doc.njk
eleventyNavigation:
  key: picjs Guide
  order: 1
---

This is the tour. It covers drawing: putting shapes down, saying where they go,
and colouring them in.

From here, [How Layout Works](/layout/) sets out the placement rules,
[The picjs Language](/language/) covers variables and functions,
[Animation](/animation/) covers movement, and the
[Reference](/picjs-reference/) has the details of every shape and option.

Play along in the [playground](/editor/) — nothing to install. To put picjs
into a site or a markdown file, see [Integrating picjs](/integrating/).

## Hello World: default positioning

~~~ picjs example
box  "Hello"
line ->
box  "World"
~~~

`box` and `line` are shapes. By default, picjs draws shapes from west to east.

picjs is written using expressions, not statements, and each expression ends when picjs comes across
something that doesn't belong. Whitespace (including newlines) are irrelevant, unless they are
separating two tokens. That means the previous example can be written:

~~~ picjs example
box "Hello" line -> box "World"
~~~

And because `->` is both an attribute and a shortcut, you can write:

~~~ picjs example
box "Hello" -> box "World"
~~~

The current direction is set using the `Face` command.

~~~ picjs example scale=5
Face s
box "Hello" -> box "World"
~~~

The connections between shapes are centered on the direction we're drawing.

~~~ picjs example
box "Hello"
       -> circle "你好"
Face s -> Oval "Hola"
Face w -> ellipse "привіт"
Face n ->
~~~

## Constraints

Every 2D shape has a bounding box with nine associated positions:

``` picjs scale=10
bounds = box rad 0 fill ~MediumAquamarine stroke ~MediumTurquoise
[ "nw", "n", "ne",
  "w",  "c", "e",
  "sw", "s", "se"
].each(pos => Label (pos) at bounds[pos] fill ~black)
box at bounds wid bounds.width*140% height bounds.height*140% fill ~Gainsboro behind bounds
```

So far we've used the default layout method. If we're facing east, then the next shape's `.w` is
located at the previous shape's `.e`. If we're facing south, then `.n` is placed at the previous
`.s`, and so on.

You can override that positioning using _constraints_. A constraint is a relationship between a shape and some
other _position_.

### Positions

Drawings are made on an X/Y plane, where the X coordinate increases to the east and the Y coordinate
increases to the south. A position is a point on that plane.

Absolute positions are simply two expressions between parentheses. The comma is optional as long as
there's a space between them.

``` picjs example scale=8
box wid 3 ht 3 with .nw at (-.5, -.5) fill ~gray
[0..2].each(n => {
  h = line from (-.1, n) to (2,n) thick 0.01 stroke ~skyblue
  v = line from (n, 0) to (n,2.1)  same
  Label "#{n}" with .e at h.w - (.1,0)
  Label "#{n}" with .n at v.s + (0,.1)
})

box "A" at (1, 1)
box "B" at (1.5 1.5) fill ~b2
```

Each of the coordinates can be an expression:

``` picjs example scale=3
[0..359].steps(10, theta => {
  circle at (2*sin(theta), 2*cos(theta))
})
```
(The `[0..359].steps(10, theta => {...})` syntax iterates over the range from zero to 359, taking 10
steps, and passing the current interpolated value to the function as `theta`.)

Positions are also values, so you can perform arithmetic on them:

``` picjs example scale=3
[0..359].steps(10, theta => {
  circle at 2*(sin(theta), cos(theta))
})
```

You can also interpolate between them:

~~~picjs example
[(0,0)..(2,1)].steps(7, pos =>
  circle fill ~b4 stroke ~f4 at pos
)
~~~

### Relative Positions

It's fairly unusual to use absolute positions, since they don't adapt to changes in the layout.
Instead, we locate shapes relative to each other.

Each of the cardinal points of a shape is a position value. We can use `at` just as we did above,
but using a shape's position instead of an absolute one:

``` picjs example scale="8"
a = box "A" fill ~b2
box "B" at a.se opacity 0.5
```

Using a shape value as a position selects the center of that shape, so the previous example
positioned the center of the second box at the southeast corner of the first.

Use the `with` clause to change the starting point of the position:

``` picjs example
a = box "A" fill ~b2
box "B" with .nw at a.se opacity .7
```

We can use arithmetic:

~~~ picjs example
a = box "A" fill ~b2
box "B" with .nw  at a.se - (.2,.2) opacity .7
~~~

Algebra works as expected on positions:

~~~ picjs example
a = box "A"
b = box "B" at a.c + (2,1)
circle radius .1 at a.se + (b.nw-a.se) * 25%
circle radius .1 at a.se + (b.nw-a.se) * 50%
circle radius .1 at a.se + (b.nw-a.se) * 75%
~~~

## Colors

Most shapes have fill colors and stroke colors (lines only have stroke colors, and labels only
have fill). These are set using the `fill` and `stroke` attributes.

~~~ picjs example
box fill ~Salmon stroke ~FireBrick
line stroke ~green
circle fill ~pink stroke ~purple
~~~

These examples used the `~` notation for named colors. All the CSS named colors are supported.
In addition you can use the color functions `rgb`, `hsl`, and `oklch`. They each take three
parameters, along with a fourth optional opacity.

However, if you want consistency, use a color palette. Picjs ships with a number of palettes,
and each has eight foreground colors (`~f1`–`~f8`) and eight background colors (`~b1`–`~b8`).

As a general guide, the `~b1` is darker than `~b2` and so on, but that depends on the palette.

The colors are chosen so that using a given foreground color on a background color of the same
number will ensure WCAG accessibility.

~~~ picjs example
Palette.current = "sunset"

b1 = box fill ~b1
b2 = box fill ~b2 with .nw at b1
b3 = box fill ~b3 with .sw at b2
b4 = box fill ~b4 with .nw at b3
~~~

The `Palette` object lets you switch the palette used for all subsequent objects. You can also
define your own palettes by assigning to `Palette.b1`, `Palette.b2` and so on.

There's a table showing the available palettes in the [editor](/editor/?example=palette.picjs).

### Color Interpolation

You can interpolate between two colors.

~~~ picjs example
Palette.current = "ocean"
[~b1..~b8].steps(7, color =>
  box fill color stroke ~black thickness .03
)
~~~

### Color Manipulation

~~~ picjs example
Face s
{
  Face e
  ["", "Lighten", "Darken", "Desaturate", "Saturate"].each(head => {
    box (head) ht .3 rad 0 fill ~grey
  })
}

{
  [60..360].steps(8, rotation => {
    {
      base_color = ~b3.spin(rotation)
      Face e
      box fill base_color ("#{base_color}" fill ~black)
      box fill base_color.lighten(.2)
      box fill base_color.darken(.2)
      box fill base_color.desaturate(.3)
      box fill base_color.saturate(.3)

    }
  })
}

Gap .1

Face s
box ht .3 wid 5*Box.width rad 0  "Grayscale" fill ~gray

{
  [~cyan, ~red, ~green, ~blue, ~purple].each(base_color => {
    Face e
    {
      Face s
      box ht Box.height/2 fill base_color rad 0
      box same fill base_color.grayscale()
    }
  })
}
~~~

# Next...

* Open up the [playground](/editor) and draw stuff.
* While you're in the [playground](/editor), look at the examples for more ideas.
* If you come up with cool images and animations, send them to me (dave@pragdave.me): I'd like to
  start a gallery.

Have fun.

Dave
