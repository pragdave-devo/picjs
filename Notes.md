 
## Positioning

Every type of Shape has an _anchor point_. For most shapes (boxes, circles, and so on), 
this is the center, $(\frac{width}{2}, \frac{height}2)$.

In the myopic language, when you refer to the position of a shape, with no qualifiers, 
you're talking about those anchor points. These are the `x` and `y` shape attributes:

~~~ js
s = Box (100,200)       // box with a center at 100,200
?? s.x                  // 100
~~~

In addition, every shape has nine cardinal points: nw, n, ne, e, se, s, sw, e, and c. 
These points are always defined internally as offsets from the anchor: they are never 
stored in a shape object.

When shapes are created, they may be given:

* a position constraint: `Box with .n at tree.s`
* an absolute position: `Box at (100, 200)` or `Box at tree.sw`
* no position: `Box fill ~red`


The geometry module is responsible to going through the shapes (in the order
they were created) and using this information to give each shape an absolute
anchor position.


### Shapes with a position constraint

~~~ js 
Box with .n at tree.s
~~~

The target of the constraint (`tree.s`) is evaluated. (This is done every time
the geometry is run, so that if the target moves, the dependent box will move to
maintain the constraint). This position is then adjusted by the offset from the
given cardinal point (`.n`) to arrive at the shape's anchor position. This
anchor position is stored in the shape.

### Shapes with an absolute position

~~~ js 
Box at (100, 200)   // or 
Box at tree.sw
~~~

The given position is used as the anchor position of the new shape.

### Shapes with no position (or a partial position)

~~~ js 
Box fill ~red
~~~

The geometry module keeps track of the position and size of the previously
processed shape. It also maintains a unit vector representing the current
default direction (set using the `Face` in myopic).

If the next shape to be added has no absolute or constrained position, the
geometry module knows that this shapes anchor must lie on the line defined by
the face vector that passes through the previous shape's anchor point. It
calculates the distance based on half the size of the previous added to half the
size of the new.

The calculation of the anchor is done independently for the `x` and `y`
coordinates: one may be fixed and the other may be automatically assigned.

## Rendering

Until this point, all our work has been in terms of abstract shapes and their
anchor positions. We now render these shapes into SVG elements; creating new
elements or updating existing ones as appropriate.[^redom]

[^redom]: We use the redom library to minimize dom changes.

SVG is somewhat inconsistent when specifying an elements position. Sometimes
this is done using `x` and `y` attributes. These attributes sometimes refer to
the top-left corner of the element, and (in the case of text), can also refer to
other places of the element. Sometimes SVG using `cx` and `cy` attributes for
positioning, and sometimes it uses values inside path strings.

To deal with this, each SVG element has its own rendering class. This class
defines a function that takes the required position (the anchor X and Y) and
returns the SVG attributes that would result in the shapes anchor point being
rendered when we want.

For example, if a Box is 40 wide and 30 high, an we set its anchor (its center)
to 100, calling this routine would return the SVG `rect` attributes `{ x: 80, y:
85 }`.

## Animation

There are three levels of animation support.

The outermost level is the _timeline_. This contains entries describing each animatable 
statement. It's a priority queue, ordered on the animation start time.

The timeline is traversed (with appropriate sleeps if the next entry doesn't
start for a while). When a timeline entry is reached, it triggers the creation
of an animation runner. This is a free-standing animation-frame handler that
keeps track of how far into the animation we are (based on the elapsed time and
the overall animation time). From that, it applies an easing function to
determine where in the animation it is. It then calls a animation object that
knows how to apply that eased value to the start and end points.

The lowest level are the animator objects. They are created as needed for a
particular shape, and are passed the start and end values of the animation.
There are two basic animators: positioning and attribute setting.

Positioning animators basically interpolate the position object representing the
center of the object being animated.

Attribute animators actually cheat and delegate the actually interpolation to
the underlying type of the attribute (in Myopic, types such as numbers and
colors all know how to interpolate themselves).

All of this animation work in done on Shape objects. Once the loop is finished, 
the animator looks for dependent shapes that may have been affected by the
repositioning of a shape. (For example, a line between two boxes will be updated
if either of the boxes moves).

#### During Rendering

The `renderer` function in `renderers/svg/_renderer.js` traverses a list of
shapes and renders, either by updating element attributes for already-rendered
shapes or by setting attributes into newly created shapes.

Each new element is represented by a rendering object. The constructor of this
object is passed a required position and the shape attributes. The required
position and the attributes are fetched from the shape object being rendered.

The polymorphic function `normalizePosition` is called in the render object constructor. 
This function is implemented by each renderer class, and returns an updated set
of attributes that now include whatever positioning is required to get the
element to display at the SVG position corresponding to our internal required
position.

#### Rotation

I decided not to use SVG transformations for rotations: it was just too messy
mapping between the internal Shape geometry and the assumed SVG geometry.

Instead, each `Shape` object has two attributes, `rotation` and
`rotationCenter`. These are passed to the renderers along with the position
information.

Rotations are performed by:

1. Normalizing the coordinates that define the shape by subtracting the
   rotation center from each.

2. Applying the rotation to these normalized points.

3. Adding the rotation center back it to determine the vertexes to be drawn.

The cool thing is that the rotation center is dynamically evaluated. As a
result, if shape one is rotated around the center of shape 2, and shape 2's
position is animated, shape one's orbit will follow shape 2.

## Mapping Myopic to JavaScript

_Shapes_ are the bridge between myopic language constructs and the interpreter
internals.

The are initialized by passing in myopic type objects (`TNumber`, `TColor`,
...). These type values are converted to native values and are stored in the
shape's `params` attribute.

Each Shape class defines a series of getters for its own attributes. These
getters always return native JavaScript types.

They also define an interface to allow myopic code to access these attributes.
This interface is a set of callbacks named `handle_attr_xxx`, where _xxx_ is the
name of the attribute. These callbacks will call the attributes getter, then
Look at the second line of this myopic code:

~~~ js 
b = Box 50x100
offset = b.width * 2 
~~~

The construct `b.width` caused the interpreter to invoke `handle_attr_width` in
the `SBox` object:

~~~ js 
handle_attr_width() { return new TNumber(this.width) }
~~~

This function invokes the native getter

~~~ js 
get width() { return this.params.width }
~~~

## Layers of Positioning

### Within Shapes

Shapes are concerned with two aspects of positioning:

* mapping between the anchor position and cardinal points, and
* determining the point when a line intersects the shape (for cropping)

#### Cardinal point mapping

The `SBase` class handles this for all shapes. In particular, the getting
functions for cardinal points use a helper function, `corner`. The `corner`
function polymorphically calls the shape-specific
`getCardinalOffsetsFromAnchor` function. The offsets are then used to derive the
cardinal positions.

#### Line intersection

The SBase class defines `cropLineTo`, which determines where a line from a
shape's center to a target position crosses the shape's boundary. This assumes
a rectangular cropping box. Shapes with a different cropping area (circles, for
example) override this function.




