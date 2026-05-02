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

[![Screenshot of towers of hanoi](./assets/hanoi1.png)](./hanoi-breakdown)

(GitHub won't run it, so see it in [the playground](/picjs/playground)


---



