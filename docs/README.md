# Building the docs

The site renders its `picjs` examples with the built library, and animated
examples need the runtime alongside it, so build both first:

```console
$ npm run build           # in the repo root — creates dist/
$ cd docs
$ npm install             # once; the site has its own dependencies
```

Then either:

```console
$ npm run build           # writes _html/
$ npm start               # preview at http://localhost:8080/, rebuilding on save
```

Examples are fenced with `picjs`:

| Fence | Shows |
|-------|-------|
| ```` ```picjs ```` | the diagram only |
| ```` ```picjs example ```` | source beside the diagram |
| ```` ```picjs stacked ```` | source above the diagram |
| ```` ```picjs code ```` | source only, highlighted |
| ```` ```picjs animated ```` | the diagram with playback controls |

Add `scale=`, `width=` or `svgwidth=` to size a diagram.

Lines between `//-` and `//+` run but are hidden from the displayed source,
which is handy for palette setup.
