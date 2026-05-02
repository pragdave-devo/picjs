---
layout: layouts/base.njk
title: picjs 
description: constraint-based drawing and animation language
permalink: /
---

> Use it like Mermaid. Draw what you want.

<div style="display: flex; gap: 3rem;">
<div style="max-width: 20rem; min-width: 19rem">
<ul>
<li>constraint-based positioning</li>
<li>build-in programming language</li>
<li>color palettes</li>
<li>animation</li>
<li>playground</li>
</ul>
</div>
<div style="max-width: 20rem; min-width: 19rem">
<pre><code>
~~~ picjs
<em>// your imagination goes here...</em>
~~~
</code></pre>
</div>
</div>

---

### Block Graphics

~~~ picjs example
//-
Palette.current = "sunset"
Box.fill = ~b3
Line.stroke = ~b2
//+
box "Hello" -> box "World!"
~~~

### With a Programming Language

~~~ picjs example scale=2
//-
Palette.current = "sunset"
Box.fill = ~b3
Line.stroke = ~b2
//+
[0..359].steps(10, theta => {
  circle at 2*(sin(theta), cos(theta))
})
~~~

And color manipulation:

~~~ picjs example
petals = 17

start_color = oklch(70%, .3, 0)

petal = (color) => {
  4.times(=> {
    Arc stroke color
    Arc ccw stroke color.spin(10)
    Arc stroke color.spin(20)
  })
}

petals.times(n => {
  Face 360/petals*n 
  petal(start_color.spin(n*30))
})
~~~

### And Animation

~~~ picjs
NumDisks = 5
Box.pole.fill = ~brown.lighten(5%)  // ~brown is a named color
DiskColor = rgb(220,180,140)


// This is just a regular function, but we're using it to define a mixin

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

// draw a pole with a base.

drawPole = (number) => {
  pole = Box 20x150 rad 4 .pole  at (100 + number*230, 300)
  Box .pole 160x20 rx 7.5 at pole.s - (0,10) // the base
  pole.number = number
  canHaveDisks(pole)
  pole
}

poles = [0..2].map(drawPole)

// create the disks and add them to pole #0
[NumDisks..1].each(d => {
  @ += 0.3
  disk =  Box ht 20 wid 40 + d*15 rx 10 ry 5 fill DiskColor.spin(d*40)
  disk.s = poles[0].push(disk)
})

@ += 0.3

moveDisk = (pFrom, pTo) => {
   distance = (pFrom.number - pTo.number).abs()  // will be 1 or 2
   disk = pFrom.pop()
   move disk.s      to pFrom.n - (0, 10) ease "cubicIn"
   then move disk.s to pTo.n - (0, 10)   ease "linear" take 0.3 + 0.3*distance
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

The code behind the Hanoi animation uses some interesting features of the language,
so there's a [page](./hanoi-breakdown/) that describes it.


---



