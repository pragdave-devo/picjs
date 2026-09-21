# picjs

A language for drawing — and animating — diagrams. You describe what you want;
picjs works out where everything goes.

![A simple flow chart with three boxes, connected by arrows](./gh-assets/hello.png)

```
Palette.current = "shuksan"
box "Input" -> box "Process" fill ~b2 -> box "Output"
```

Have a play in the [**playground**](https://pragdave-devo.github.io/picjs/editor/),
or read the [**documentation**](https://pragdave-devo.github.io/picjs/).

## Diagrams in your markdown

Write a diagram where it belongs — in the document that talks about it:

~~~markdown
Here is how the parts fit together:

```picjs
box "Input" -> box "Process" -> box "Output"
```
~~~

Then run picjs over the file:

```console
$ npx picjs process README.md
```

Each block is replaced by the rendered SVG, with the source kept beside it in a
comment. Edit the source and run it again and the picture is redrawn; leave it
alone and nothing changes. The result is static SVG, so it works anywhere —
including here, on GitHub.

If you control your site's markdown pipeline, the
[Lume and Eleventy plugins](./extras/plugins) do the same thing at build time.

## It is a real language

<table>
<tr>
<td width="50%">

~~~
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

</td>
<td width="50%">

![Image drawn using arcs and 17-fold rotational symmetry](./gh-assets/petal.png)

</td>
</tr>
</table>

Shapes follow on from one another, so `petal` needs no coordinates at all. The
outer loop turns the drawing direction a little each time and shifts the hue to
match.

## And it animates

![Screenshot of the Towers of Hanoi animation](./gh-assets/hanoi1.png)

Towers of Hanoi, solved recursively, with every move animated — in under sixty
lines. There is a [walk-through of how it works](./docs/hanoi-breakdown.md).

## Installing

```console
$ npm install @strike48/picjs
```

In a page:

```html
<script type="module">
  import { renderAll } from '@strike48/picjs'
  renderAll('.picjs')          // renders every element with class "picjs"
</script>
<div class="picjs">box "Hello"</div>
```

On a server:

```typescript
import { renderToStringAsync } from '@strike48/picjs'
const { svg, width, height } = await renderToStringAsync('box "Hello"')
```

## Documentation

* [Guide](https://pragdave-devo.github.io/picjs/guide/) — start here
* [How layout works](https://pragdave-devo.github.io/picjs/layout/) — where things end up, and why
* [The language](https://pragdave-devo.github.io/picjs/language/) — variables, functions, closures
* [Animation](https://pragdave-devo.github.io/picjs/animation/)
* [Reference](https://pragdave-devo.github.io/picjs/picjs-reference/) — every shape and option
* [Playground](https://pragdave-devo.github.io/picjs/editor/) — nothing to install

The `skills/` directory has two skills files, should you want an AI to write
picjs with you.

## What you get

* Shapes that flow one after another, or sit where you pin them
* Constraints that hold: move a shape and whatever is attached follows
* Groups that nest, and behave as shapes themselves
* Colour palettes with light and dark variants, checked for contrast
* A timeline: shapes appear, move, and change over it
* Numbers, strings, lists, ranges, colours, positions and functions, with
  closures — and attributes on every value, which is enough to build mixins

## License

See [LICENSE.md](./LICENSE.md).
