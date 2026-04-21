# picjs: Constraint-Base Drawing and Animation Language

> For reference material, have a look at [The picjs Reference](./picjs-reference) and
> the [Quick Reference Card](./quick-reference).

Before we start, a few notes:

* Play along with the examples in the guide using the [online editor](https://picjs.dev/editor) or install picjs locally using npm:

  ```console
  $ npm install -g picjs
  $ picjs --playground
  ```


*  Integrating picjs

  If you have control over the Markdown to HTML conversion used by your site, you can add picjs as a
  plugin, and <code>\`\`\` picjs</code> code blocks will be replaced by SVG in the output.

  You'll need to include the picjs library if your images use animation.

  ```
  MISSING
  ```

* Converting In Place

  You might want to use picjs to add diagrams to something like a Github README.md. In this case,
  you'll need to preprocess the file before you push it.

  The `picjs` command will convert each diagram in a file into SVG. It will then insert the SVG, and
  also include the original picjs as an HTML comment, along with a checksum. The resulting file will
  display the SVG in place of the diagram. If you want to alter a diagram, edit the picjs source in
  the comment and rerun the comand. It will compare the checksum with that of the source, and
  regenerate the SVG if the source has changed.

Enough boring stuff. Let's draw some pictures.


# Part 1: Drawing

picjs is a programming laguage oriented around drawing and animating simple diagrams. It is similar
to Mermaid; you typically embed diagrams in code blocks within Markdown documents.

``` picjs example
box "Hello" 
line -> 
box "World" fill ~red
```

`box` and `line` are built-in shapes. They have default sizes, colors, and other attributes. 
Unless you tell is otherwise, picjs will lay out shapes next to each other in the current default
direction. At the start of a drawing, that direction is east.

Shapes can take attributes. In this example, the first box has a string attribute, which is uses as
a label. The line has an `->` attribute, indicating where arrows should be drawn. The second box
also has a label, and has an additional `fill` attribute. This attribute has a parameter (the color
`~red`).

You'll notice that there are no parenetheses around a shape's attributes, and no commas between them.
picjs simply parses shape attributes until it comes across something that doesn't belong.

This means you could write the above as:

~~~ picjs example
box "Hello" line -> box "World" fill ~red
~~~

And because `->` is both an attribute and a shortcut, you can write:

~~~ picjs example
box "Hello" -> box "World" fill ~red
~~~

The current direction is set using the `Face` command.

~~~ picjs example
box "Hello" 
       -> circle "你好" 
Face s -> Oval "Hola"
Face w -> ellipse "привіт"
Face n ->
~~~

## Constraints

Every 2D shape has a bounding box with none associated positions:

``` picjs example
bounds = box rad 0
[ "nw", "n", "ne", 
  "w",  "c", "e",
  "sw", "s", "se"
].each(pos => Label pos at bounds[pos])
```

(Don't worry too much about the code: it'll make sense by the end.)

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

``` picjs example
box "A" at (1, 1)
box "B" at (1.5 1.5) fill ~b2
``` 

Each of the coordinates can be an expression:

``` picjs example
[0..359].steps(20, theta => {
  circle at (3*sin(theta), 3*cos(theta))
})
```
(The `[0..359].steps(20, theta => {...})` syntax iterates of the range from zero to 359, taking 20
steps, and passing the current interpolated value to the function as `theta`.)

Positions are also values, so you can perform arithmetic on them:

``` picjs example
[0..359].steps(20, theta => {
  circle at 3*(sin(theta), cos(theta))
})
```

#### Relative Positions

It's fairly unusual to use absolute positions, since they don't adapt to changes in the layout.
Instead, we locate shapes relative to each other. 

Each of the cardinal points of a shape is a position value. We can use `at` just as we did above,
but using a shape's position instead of an absolute one:

``` picjs example
b = box "A" fill ~b2
box "B" at b.se opacity 0.5
```

Using a shape value as a position selects the center of that shape, so the previous example
positioned the center of the second box at the southeast corner of the first.

Use the `with` clause to change the starting point of the position:

``` picjs example
b = box "A" fill ~b2
box "B" with .nw at b.se opacity .7
```

We can use arithmetic:

~~~ picjs example
b = box "A" fill ~b2
box "B" with .nw  at b.se - (.2,.2) opacity .7
~~~

Algebra works as expected on positions:
 
~~~ picj example
a = box "A"
b = box "B" at a.c + (2,1.5)
    circle radius .1 at a.se + (b.nw-a.se)*.25:w

    circle radius .1 at a.se + (b.nw-a.se)*.5
    circle radius .1 at a.se + (b.nw-a.se)*.75
~~~
