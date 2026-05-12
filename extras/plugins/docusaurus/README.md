# docusaurus-plugin-picjs

Render [PIC.js](https://github.com/pragdave-devo/picjs) diagrams in Docusaurus markdown at build time.

## Installation

```bash
npm install docusaurus-plugin-picjs @strike48/picjs
```

## Configuration

Add to your `docusaurus.config.ts`:

```ts
import type { Config } from "@docusaurus/types";
import { Prism } from "prism-react-renderer";
import { remarkPlugin as picjsRemark } from "docusaurus-plugin-picjs";
import { definePicjsLanguage } from "docusaurus-plugin-picjs/prism";

// Register picjs syntax highlighting
definePicjsLanguage(Prism);

const config: Config = {
  // ... other config

  plugins: ["docusaurus-plugin-picjs"],

  presets: [
    [
      "classic",
      {
        docs: {
          remarkPlugins: [picjsRemark()],
        },
      },
    ],
  ],
};

export default config;
```

## Usage

Use fenced code blocks with the `picjs` language:

~~~markdown
```picjs
box "Hello" -> box "World"
```
~~~

### Display Modes

| Mode | Syntax | Result |
|------|--------|--------|
| plain | `` ```picjs `` | SVG only |
| example | `` ```picjs example `` | Side-by-side: code + SVG |
| stacked | `` ```picjs stacked `` | Vertical: code above SVG |
| code | `` ```picjs code `` | Syntax-highlighted source only |
| animated | `` ```picjs animated `` | Interactive animation |

### Size Options

- `width=400px` - Container width
- `svgwidth=200px` - SVG wrapper width
- `scale=2` - Scale factor

Example:
~~~markdown
```picjs example width=600px
Palette.current = "shuksan"
box "A" -> box "B" fill ~b2
```
~~~

## Options

```ts
plugins: [
  [
    "docusaurus-plugin-picjs",
    {
      // Custom path to animation runtime (default: unpkg CDN)
      runtimePath: "/assets/picjs-runtime.js",
    },
  ],
],
```

## License

MIT
