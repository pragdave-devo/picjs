---
layout: layouts/base.njk
title: READMEs and Ad Hoc Files
description: Using picjs to render diagrams in markdown files
permalink: /readme-files/
---

The `picjs` CLI can process markdown files, rendering `picjs` code blocks into
SVG diagrams. This is useful for READMEs, documentation, and any markdown file
where you want diagrams.

If your diagrams contain no animation, these files are purely static and ewill work (for
example) as GitHub READMEs.

If you _do_ use animation, then the preprocessor will load a library to support this.


## Basic Usage

```bash
picjs process README.md
```

This scans the file for fenced code blocks marked as `picjs`:

~~~markdown
```picjs
box "Hello" -> box "World"
```
~~~

and renders the SVG directly after each block.

Three display modes are available:

| Mode | Syntax | Result |
|------|--------|--------|
| plain | `` ```picjs `` | SVG only |
| example | `` ```picjs example `` | SVG followed by syntax-highlighted code |
| 2up | `` ```picjs 2up `` | Side-by-side table: code on left, SVG on right |

## How It Stays Editable

The CLI embeds the original source in an HTML comment after each rendered block:

```html
<!-- picjs:a1b2c3d4:plain
box "Hello" -> box "World"
-->
<svg>...</svg>
<!-- /picjs -->
```

The checksum (`a1b2c3d4`) is computed from the source. On subsequent runs:

- If the source hasn't changed, the block is skipped (idempotent)
- If you edit the source, it re-renders automatically
- The embedded source means the original code is never lost

This design lets you commit rendered SVGs to git while keeping the diagrams
editable—just modify the code block and re-run `picjs process`.

---

## Watch Mode

For iterative editing:

```bash
picjs watch README.md
```

This re-renders automatically whenever the file changes.## Block Modes

## GitHub README Automation

If you want your GitHub README diagrams to render automatically when you push
changes, you can use a GitHub Actions workflow.

Add [this workflow file](https://github.com/pragdave/picjs/blob/main/.github/workflows/render-diagrams.yml)
to your repository at `.github/workflows/render-diagrams.yml`.

It will:

1. Trigger when README.md changes on main
2. Build picjs and render the diagrams
3. Commit and push the rendered output

This means you can edit your README directly on GitHub (or anywhere) and the
diagrams will be rendered automatically.
