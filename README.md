# picjs

Draw diagrams using plain-text descriptions. Embed drawing in (for example)
Markdown.

A bit like Mermaid, but:

* no specific drawing types
* dependable, consistent layout controls based on constraints

``` picjs example
oval "Input"
arrow
box "Process" fill lightgreen
arrow
oval "Output"

arc -> from last oval.n to first oval.n
ellipse at last arc.n fill pink "Adjust" "Weighting"
```

* Playground
* Guide
* Reference

## For The Impatient


