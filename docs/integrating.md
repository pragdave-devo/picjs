---
title: Integrating picjs
description: Using picjs in a site, a markdown file, or a page of your own
layout: layouts/doc.njk
eleventyNavigation:
  key: Integrating picjs
  order: 6
---

## Installing

```console
$ npm install @strike48/picjs
```

You do not need to install anything to try the language — the
[playground](/editor/) runs entirely in the browser.

## In a static site

If you control the Markdown-to-HTML step for your site, add picjs as a plugin
and ```` ```picjs ```` blocks are replaced by SVG in the output.

Plugins for Lume and Eleventy live in the
[extras/](https://github.com/pragdave-devo/picjs/tree/main/extras) directory.
Contributions of others are welcome.

Diagrams without animation are self-contained: the generated HTML needs nothing
else on the page.

Animated diagrams need the picjs runtime. The Eleventy plugin adds it for you;
elsewhere, include it yourself:

```html
<script type="module">
  import { initAnimations } from "picjs/runtime"
  initAnimations()
</script>
```

That finds every animated diagram on the page and gives it playback controls.

## In a markdown file

To put diagrams in something you do not control — a GitHub README, say — render
them before you push. The CLI rewrites a file in place:

```console
$ picjs process README.md
$ picjs watch README.md      # re-render whenever the file changes
```

It finds fenced blocks marked `picjs` and replaces each one with the diagram
it describes:

~~~markdown
```picjs
box "Hello" -> box "World"
```
~~~

| Fence | Result |
|-------|--------|
| ```` ```picjs ```` | the diagram only |
| ```` ```picjs example ```` | the diagram, then the source |
| ```` ```picjs 2up ```` | source and diagram side by side |

### Diagrams stay editable

The original source is kept in an HTML comment beside the diagram, with a
checksum:

```html
<!-- picjs:a1b2c3d4:plain
box "Hello" -> box "World"
-->
<svg>...</svg>
<!-- /picjs -->
```

On the next run an unchanged block is skipped, and an edited one is re-rendered.
So you can commit the rendered SVG and still edit the diagram later: change the
source in the comment and run `picjs process` again.

Files with no animation are static, and work anywhere — GitHub READMEs
included. Animated ones pull in the runtime to drive them.

### Rendering on push

To have GitHub render your diagrams for you, add
[this workflow](https://github.com/pragdave/picjs/blob/main/.github/workflows/render-diagrams.yml)
at `.github/workflows/render-diagrams.yml`. It builds picjs and renders the
diagrams whenever `README.md` changes on main, then commits the result — so you
can edit the README anywhere, including on GitHub itself.

## For an AI assistant

The `skills/` directory holds two skills files: one for the language, one for
animation. They are separate so you only load what you need.
