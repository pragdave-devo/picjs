# jp Attributes Reference

## Attribute List

Every attribute, what type of value it takes, and what it does.

| Attribute | Value | Description |
|-----------|-------|-------------|
| `align` | cardinal (`.n`, `.w`, `.c`, etc.) | Text alignment within a label |
| `at` | position | Place shape at a specific position |
| `behind` | shape reference | Render this shape behind the referenced shape |
| `close` | — (flag) | Close a polyline into a polygon |
| `dashed` | — (flag) | Dashed stroke line style |
| `dotted` | — (flag) | Dotted stroke line style |
| `ease` | string | Easing function for an animation |
| `fill` | color | Fill color |
| `fit` | — (flag) | Auto-size shape to fit its label content |
| `font` | font-spec | CSS font specification (style, weight, size, family) |
| `font_family` | string | Font family name(s) |
| `font_size` | size | Font size (CSS units or keywords) |
| `font_stretch` | keyword/percentage | Font stretch |
| `font_style` | keyword | Font style (`italic`, `oblique`) |
| `font_variant` | keyword | Font variant (`small-caps`) |
| `font_weight` | keyword/number | Font weight (`bold`, `lighter`, `100`–`900`) |
| `from` | position | Line/arc start point |
| `height` / `ht` | number | Shape height |
| `length` / `len` | number | Line length |
| `line_height` | number | Line spacing for multi-line labels |
| `line_end` | `>` / `o` / `\|` | End marker on a line |
| `line_path` | `straight` / `smooth` / `stepped` | Line interpolation style |
| `line_start` | `<` / `o` / `\|` | Start marker on a line |
| `maxwidth` | number | Maximum text width before wrapping |
| `nodraw` | — (flag) | Create shape with draw_progress=0 (invisible until animated) |
| `opacity` | number (0–1) | Shape opacity |
| `radius` / `rad` / `r` | number | Circle/ellipse radius, or polyline corner radius |
| `rotation` / `rot` | number (degrees) | Rotation angle |
| `rx` | number | Horizontal corner radius |
| `ry` | number | Vertical corner radius |
| `same` | — (flag) | Copy attributes from previous shape of same type |
| `smooth` / `curve` / `curved` | — (flag) | Smooth (bezier) line path |
| `solid` | — (flag) | Solid stroke line style |
| `stepped` / `step` | — (flag) | Stepped (right-angle) line path |
| `straight` | — (flag) | Straight line path (default) |
| `stroke` | color | Stroke color |
| `stroke_width` | number | Stroke width (see also `thickness`) |
| `take` | number | Animation duration |
| `thickness` / `thick` | number | Stroke width (alias for `stroke_width`) |
| `to` | position | Line/arc end point |
| `turn` | `cw` / `ccw` / angle | Arc turn direction |
| `width` / `wid` | number | Shape width |
| `with` | constraint | Position constraint (see [Constraint](#constraint)) |
| `x` | number | X position |
| `y` | number | Y position |
| `.<class>` | — | CSS class applied to the SVG element |

### Labels (special attribute syntax)

| Syntax | Context | Description |
|--------|---------|-------------|
| `"text"` | shape attribute | Simple label |
| `("text" fill ~red .cls 14pt)` | shape attribute | Rich label with styling |
| `"text" above` | line attribute | Line label positioned above path |
| `"text" at 25% below` | line attribute | Line label at 25% along path, below |
| `"text" inside` / `outside` | line/arc attribute | Label on inside/outside of curve |

### Constraint

| Syntax | Description |
|--------|-------------|
| `with .<cardinal> at <place>` | Pin cardinal point to a position |
| `with at <place>` | Pin center to a position |
| `with self.<name>.<cardinal> at <place>` | Pin a named sub-element's cardinal point |

---

## Attribute–Shape Matrix

Columns are the built-in shapes and objects. Rows are attributes.

- ✓ = attribute is accepted. If the shape has a default value, it follows the checkmark.
- ✗ = attribute cannot be used with this shape.

Default values shown are for the `.normal` class using the Dark theme.
Theme-variable names (like `BoxFill0`) resolve to specific colors at runtime.

| Attribute | Box | Circle | Ellipse | Oval | Line | Polyline | Arc | Label | Group | Skip | Point |
|-----------|:---:|:------:|:-------:|:----:|:----:|:--------:|:---:|:-----:|:-----:|:----:|:-----:|
| **Labels** | | | | | | | | | | | |
| `"text"` (label) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ ¹ | ✓ | ✗ | ✗ |
| rich label `(...)` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ ¹ | ✓ | ✗ | ✗ |
| line label positioning (`above`/`below`/`at %`) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Position** | | | | | | | | | | | |
| `at` / `(x,y)` | ✓ | ✓ | ✓ | ✓ | ✗ ² | ✗ ² | ✗ ² | ✓ | ✓ | ✓ | ✗ |
| `x` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| `y` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| `from` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `to` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| `with` (constraint) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| **Size** | | | | | | | | | | | |
| `width` / `wid` | ✓ (1) | ✗ | ✗ | ✓ (1) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `height` / `ht` | ✓ (0.75) | ✗ | ✗ | ✓ (0.75) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `W x H` | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `radius` / `rad` / `r` | ✗ | ✓ (0.5) | ✗ | ✗ | ✗ | ✓ ³ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `rx` | ✓ (0.06) | ✗ | ✓ (0.5) | ✓ ⁴ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `ry` | ✓ (0.06) | ✗ | ✓ (0.5) | ✓ ⁴ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `length` / `len` | ✗ | ✗ | ✗ | ✗ | ✓ (1) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Appearance** | | | | | | | | | | | |
| `fill` | ✓ (#1a7a9a) | ✓ (#1a7a9a) | ✓ (#1a7a9a) | ✓ (#1a7a9a) | ✓ | ✓ (none) | ✓ | ✓ (#ffffff) | ✓ | ✗ | ✗ |
| `stroke` | ✓ (none) | ✓ (none) | ✓ (none) | ✓ (none) | ✓ (#5aacff) | ✓ (#5aacff) | ✓ (#5aacff) | ✓ | ✓ | ✗ | ✗ |
| `thickness` / `stroke_width` | ✓ (0.015) | ✓ (0.015) | ✓ (0.015) | ✓ (0.015) | ✓ (0.04) | ✓ (0.04) | ✓ (0.04) | ✓ | ✓ | ✗ | ✗ |
| `solid` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `dotted` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `dashed` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `opacity` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `rotation` / `rot` | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✗ | ✓ (0) |
| `rotation ... about` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Line-specific** | | | | | | | | | | | |
| line endings (`->`, `<~>`, etc.) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `straight` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `stepped` / `step` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `smooth` / `curve` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `nodraw` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `turn` (`cw`/`ccw`/angle) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (cw) | ✗ | ✗ | ✗ | ✗ |
| **Text** | | | | | | | | | | | |
| `align` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (c) | ✗ | ✗ | ✗ |
| `font` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `font_size` (as keyword: `14pt`, `large`, etc.) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (0.14) | ✗ | ✗ | ✗ |
| `maxwidth` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `line_height` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (0) | ✗ | ✗ | ✗ |
| **Other** | | | | | | | | | | | |
| `fit` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `same` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `behind` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `.<class>` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

**Notes:**

1. Label takes its text as a required first argument (`Label "text"`), not via a label attribute.
2. Lines use `from`/`to` for positioning, not `at`.
3. On polylines, `radius` sets corner rounding at waypoints (sets both `rx` and `ry`).
4. Oval auto-rounds: `rx`/`ry` default to half the smaller dimension (pill shape). Can be overridden.

### Label style classes

Labels have built-in style classes that set alignment, color, and font size:

| Class | Align | Font Size | Color (Dark theme) |
|-------|:-----:|:---------:|:------------------:|
| `.normal` | center | 0.14 | #ffffff |
| `.h1` | west | 0.63 | #ffc233 |
| `.h2` | west | 0.42 | #e8713a |
| `.h3` | west | 0.28 | #d4a020 |
| `.h4` | west | 0.21 | #6ab040 |
| `.p` | west | (inherited) | (inherited) |

### Box/Circle/Polyline color variants

Shapes have color variant classes that change the fill:

| Class | Fill (Dark theme) | Fill (Light theme) |
|-------|:-----------------:|:------------------:|
| `.normal` | #1a7a9a (cerulean) | #7cc8e0 (soft blue) |
| `.v1` | #7b2d8e (purple) | #c49ed8 (soft purple) |
| `.v2` | #2d6e2d (green) | #8ac08a (soft green) |
| `.v3` | #a84800 (orange) | #e8a070 (soft orange) |
| `.v4` | #0a6e68 (teal) | #7ac8c0 (soft teal) |
