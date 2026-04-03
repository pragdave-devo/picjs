# Myopic: A language for creating animated web graphics.

### Simple Turtle Graphics

<table>
<tr>
<td width="50%">

~~~ js 
petal = (color) => {
  4.times(=> { 
    Arc stroke color
    Arc ccw stroke color.spin(10)
    Arc stroke color.spin(20)
  })
}

Skip to (350,300)

8.times(n => {
  Face 45*n     // 0°, 45°, 90° ...
  petal(#c7c.spin(n*30))
})
~~~

</td>
<td width="50%">

![Image drawn using arcs and 8-fold symmetry](./gh-assets/petal.png)

</td>
</tr>
</table>

### Run Towers of Hanoi, animating each move:

![Screen shot of the animation in action](./gh-assets/hanoi1.webp)

~~~ js 
NumDisks = 4
Box.pole.fill = ~brown.lighten(15%)
DiskColor = #8db

canHaveDisks = (aPole) => {
  disks = []
  aPole.push = (disk) => {
    disks.push(disk)
    // return the position of the bottom of the disk
    aPole.s - (0, disks.length * (disk.ht + 2))
  }
  aPole.pop = () => {
    disks.pop()
  }
}

drawPole = (number) => { 
  pole = Box .pole 20x150 rx 5  at (100 + number*230, 300)
  Box .pole 160x20 rx 7.5 at pole.s - (0,10)
  pole.number = number
  canHaveDisks(pole)
  pole
}

poles = [0..2].map(drawPole)

// create the disks and add them to pole #0
[NumDisks..1].each(d => {
  @ += 0.3
  disk =  Box ht 20 wid 40 + d*15 rx 10 ry 5 fill DiskColor.spin(d*30)
  disk.s = poles[0].push(disk)
})

@ += 0.3

moveDisk = (pFrom, pTo) => {
   distance = (pFrom.number - pTo.number).abs()  // will be 1 or 2
   disk = pFrom.pop()
   move disk.s      to pFrom.n - (0, 10) ease "cubicIn"
   then move disk.s to pTo.n - (0, 10)   ease "linear" take 0.4 + 0.3*distance
   then move disk.s to pTo.push(disk)    ease "cubicOut"
   @@
}

hanoi = (n, pFrom, pTo, pVia) => {
 if (n > 0)  { 
   hanoi(n-1, pFrom, pVia, pTo)
   moveDisk(pFrom, pTo)
   hanoi(n-1, pVia, pTo, pFrom)
 }
}

hanoi(NumDisks, poles[0], poles[2], poles[1])
~~~

### A Little Narrative

(The actual language description is [here](...)).


~~~ js 
NumDisks = 4
~~~

> Variables pop into existence when assigned to. The only reason that 
this one starts with an uppercase
letter is that it felt like a constant to me.


----

~~~ js 
Box.pole.fill = ~brown.lighten(15%) 
DiskColor = #8db
~~~

> `~brown` is a literal of type color. Myopic has a range 
of color manipulation functions (such as `lighten`).
> 
> `15%` is simply a numeric literal (whose value is 0.15).
> 
> `Box.pole.fill` sets the default fill color for Box shapes that have a class of `.pole`.
> 
> `#8db` is also a literal of type color.

----

~~~ js 
canHaveDisks = (aPole) => {
  disks = []
  aPole.push = (disk) => {
    disks.push(disk)
    // return the position of the bottom of the disk
    aPole.s - (0, disks.length * (disk.ht + 2))
  }
  aPole.pop = () => {
    disks.pop()
  }
}
~~~

> This code defines a function and assigns it to the variable `canHaveDisks`.
> This function effectively implements a _mixin_: we can call it, passing in a pole shape, 
> and it adds two functions to that pole (`push` and `pop`).
> 
> Because Myopic functions are closures, the local variable `disks` is available to the
> `push` and `pop` functions, but is otherwise hidden.
> 
> The line `aPole.s - (0, ...)` is an example of arithmetic on _positions_. `aPole.s` returns the
> coordinates of the center-bottom of `aPole` (`.s` means _south_). The code then subtracts from it the position
> `(0, disks.length * (disk.ht + 2))`. This leaves the `x` coordinate unchanged, but sets the `y` coordinate to this disks position on 
> the pole, multiplying the number of disks on the pole times the height of each disk (plus a little offset to leave a gap).

----

~~~ js 
drawPole = (number) => { 
  pole = Box .pole 20x150 rx 5  at (100 + number*230, 300)
  Box .pole 160x20 rx 7.5 at pole.s - (0,10)
  pole.number = number
  canHaveDisks(pole)
  pole
}
~~~

> The function assigned to `drawPole` uses two box shapes to draw a vertical pole and
> a horizontal base below it. We pass in the pole number (zero to 2), which determines
> how far across the screen the pole is drawn.
> 
> Looking at the first `Box`, we see it has 
> 
> * a_class_ (`.pole`, so will will inherit a brown fill).
> * a size (`20x150`). You can also specify widths and heights separately.
> * a corder radius (`rx 5`). You can set x and y radii independently, but setting just one 
>   will set the other, too.
> * a position. The syntax `at (x,y)` sets the location of the center of a shape. We also have other 
>   options.
> 
> The second box is wide and short, and it is positioned relative to the pole (`pole.s - (0,10)`)

----

~~~ js 
poles = [0..2].map(drawPole)
~~~

> `[0..2]` is a range, which we `map` through the `drawPole` function. The result is a list of three pole shapes.

----

~~~ js 
[NumDisks..1].each(d => {
  @ += 0.3
  disk =  Box ht 20 wid 40 + d*15 rx 10 ry 5 fill DiskColor.spin(d*30)
  disk.s = poles[0].push(disk)
})
~~~

> Here we create the disks, starting with the largest and ending with the smallest. 
> Each disk is pushed onto pole 0.
> 
> The disks are filled with different colors: `.spin(d*30)` takes a color and 
> rotates it around the color wheel by `d*30` degrees.
> 
> `@ += 0.3` is the first time we've seen the code manipulate _time_. The built-in variable `@` represents
> the program's timeline. By adding 0.3 seconds to it before we create each box, we make the disks appear sequentially
> when the animation is run.

----

~~~ js 
moveDisk = (pFrom, pTo) => {
   distance = (pFrom.number - pTo.number).abs()  // will be 1 or 2
   disk = pFrom.pop()
   move disk.s      to pFrom.n - (0, 10) ease "cubicIn"
   then move disk.s to pTo.n - (0, 10)   ease "linear" take 0.4 + 0.3*distance
   then move disk.s to pTo.push(disk)    ease "cubicOut"
   @@
}
~~~

> This code moves a disk from one pole to another. This takes three movements: we move it 
> just above the pole it is currently on, then move it to just about the target pole, then move it 
> down to rest on top of any disks already on that pole.
> 
> `move` is how we animate movement. We specify the destination using a _constraint_: the disk's `.s` point should end
> up at the given position by the end of the animation. We can specify easings and the animation duration.
> 
> Normally, `move` will start at whatever time is current on the timeline, and it will not update that time. 
> That allows us to specify multiple overlapping moves if we want. If we instead want the animations to run
> sequentially, one after the other, we prefix all but the first with the `then` modifier.
> 
> Finally, `@@` is shorthand for `@ = @.lastAnimationEnd`: it simply moves the current time forward to the time the last move
> animation completed.


----

~~~ js 
hanoi = (n, pFrom, pTo, pVia) => {
 if (n > 0)  { 
   hanoi(n-1, pFrom, pVia, pTo)
   moveDisk(pFrom, pTo)
   hanoi(n-1, pVia, pTo, pFrom)
 }
}

hanoi(NumDisks, poles[0], poles[2], poles[1])
~~~

> And here's the Hanoi algorithm. It doesn't know about the animation, but the calls to `moveDisk` drive 
> the changes the user sees in their browser.

## Features

* Integrates a JavaScript-like language with the drawing and animation DSL

* All values can be extended with attributes, allowing you to implement mixins and to tag shapes
  with extra information

* Functions with closures

* Timeline handling

* Built-in types include boolean, color, font,  function, list, number, position, range, and string. 

* Ranges allow interpolation (`45% * [~red..~blue]` is a color almost halfway between red and blue).

* Shapes may be positioned absolutely or relative to each other. Relative positioning can be one-off,
  or can act as a constraint (if the target shape moves, the dependent shape follows it to maintain the
  constraint.

* Shapes can be created and destroyed on the timeline

* Attributes can be animated. Where possible, the animation will interpolate the start and end values. Where
  not possible, the animation will do a cross fade (WIP).

* Comes with a browser based environment to let you experiment and debug your code.

## License

See [LICENSE.md](./LICENSE.md).
