# PicJS History

## 0.2.5

* Improve light-mode palette colors (pastel remap instead of muddy luma inversion)
* Allow palettes to define explicit `lightColors` overrides (sunset has hand-tuned set)
* Emit explicit dark text for labels in light mode instead of relying on `currentColor`
* Remove `.v1`–`.v4` shape variant classes; simplify `.h1`–`.h4` label classes to only set alignment and size
* Allow `font_weight`, `font_style`, `font_variant`, `font_stretch` as standalone Label attributes
* Fix `behind` constraint not working inside groups
* Fix `self.internal` broken in nested groups (inner group clobbered outer `self` binding)
* Line labels default to "above" with proper gap from the line path
* Use `currentColor` for label fills so they inherit page foreground correctly
* Fix renderAll by attaching SVG to DOM before rendering

## 0.2.4

* Add palette CSS style block to browser renderAll/render output

## 0.2.3

* Fix renderToString crash on labelled shapes in browser environments

## 0.2.2

* Fix rich label fill color being ignored
* Preserve individual label styling in multi-label shapes
* Fix palette color fills in labels (e.g., `~b6`)
* Allow `font_size` before or after label text
* Convert font sizes with units (pt, px, etc) to internal coordinates
* Rich labels with font_size units now compute valid dimensions
* Add directional line syntax (`line right 2`, `line right 2 up 1`)

## 0.2.1

* Fix issue with palettes and dark/light mode
* Fix arrows and end points of curved lines which meet shapes at an angle

## 0.2.0

* Initial public release

## 0.1.0

* Prototype
