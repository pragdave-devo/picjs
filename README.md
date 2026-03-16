# picjs
pic
Draw diagrams using plain-text descriptions. Embed drawing in (for example)
Markdown.

A bit like Mermaid, but:

* no specific drawing types
* dependable, consistent layout controls based on constraints
* variables, loops, and color support

<!-- picjs: example
define $t {
  box wid 3 $1 ljust mono ht 35% invis
}

S: [
    down
    $t("oval \"Input\" fill white" ljust)
    $t("arrow" ljust)
    $t("box \"Process\" fill lightgreen" ljust)
    $t("arrow" ljust)
    $t("oval \"Output\" same" ljust)

    $t("arc -> from last oval.n to first oval.n" ljust)
    $t("ellipse at last arc.n fill pink \"Adjust\" \"Weighting\"" ljust)
]

[
  line right \
       then up .2 \
       then down .4 right .3 \
       then down.4 left .3   \
       then up .2 \
       then left  \
       close fill 0xa0b0c0 color none rad .03
]

P: [
    oval "Input" fill white
    arrow
    box "Process" fill lightgreen
    arrow
    oval "Output" same

    arc -> from last oval.n to first oval.n
    ellipse at last arc.n fill pink "Adjust" "Weighting"
]

box at S wid S.wid + .2 ht max(S.ht,P.ht) + .2 fill 0xf0f0f0 color none behind S rad .1

box at P wid P.wid + .2 ht max(S.ht,P.ht) + .2 fill lightgrey color none behind S rad .1

-->
![](./_diagrams/example.svg)

* [Playground](https://pragdave-devo.github.io/picjs/)
* [Guide](https://pragdave-devo.github.io/picjs/Guide/)
* [Reference](https://pragdave-devo.github.io/picjs/Reference/)

### Extras

* Syntax highlighting support (currently vim and VSC) under `editor-support/`
* `SKILL.md` lets agents create diagrams
* CLI for local processing
* GitHub action for formatting README.md on push

## Examples

(click to open in playground)

| | | |
|--|--|--|
[![architecture](_diagrams/architecture.png)](https://pragdave-devo.github.io/picjs/?example=architecture) | [![economy](_diagrams/economy.png)](https://pragdave-devo.github.io/picjs/?example=economy) | [![gear](_diagrams/gear.png)](https://pragdave-devo.github.io/picjs/?example=gear)

[![kernighan-page-18](_diagrams/kernighan-page-18.png)](https://pragdave-devo.github.io/picjs/?example=kernighan-page-18) | [![snail](_diagrams/snail.png)](https://pragdave-devo.github.io/picjs/?example=snail) | [![spiro](_diagrams/spiro.png)](https://pragdave-devo.github.io/picjs/?example=spiro)

## CLI

* Give it a `picjs` file on stdin, or pass it the name of a file ending
  `.picjs` and it writes the generated SVG to stdout.

* Pass it a Markdown file and it will process `\`\`\` picjs` blocks. An SVG
  will be generated in a subdirectory (`_diagrams` by default) and the
  Markdown will embed that image. The original `picjs` markup is left in the
  file, but placed into an HTML comment. The CLI tool will also process
  pictures in these comments, so you can edit your diagram, rerun `picjs` and
  it will update the SVG.

## For The Impatient

1. Load the library
  ``` html
  <script src="https://cdn.jsdelivr.net/npm/picjs@0.1.2/dist/picjs.umd.js"></script>
  ```

2. Format  `picjs` code blocks in the page.
  ``` html
  <script>
    picjs.processCodeBlocks();
</</script>
  ```

3. Make pretty pictures.

  ```html
  <pre><code class="language-picjs">
  box "Hello"
  arrow
  box "World"
  </code></pre>
  ```

# With Thanks

To Brian Kernighan and the folks at Bell Labs who wrote the amazing
Designers Work Bench over fifty years ago. They changed the way we write
documents profoundly.

And to D. Richard Hipp, who created both SQLite and pikchr, the pic clone on
which this was based.


  # Copyright and License

  Copyright 2026 Devo, Inc

  Licensed under the [Mozilla Public License](LICENSE.md)
