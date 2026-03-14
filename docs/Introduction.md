---
layout: base.njk
title: Introduction
---

# Introduction to picjs

**picjs** is a native TypeScript/JavaScript implementation of the [pikchr](https://pikchr.org) diagram description language. It compiles plain-text diagram descriptions directly to SVG in the browser—no WebAssembly, no server required.

## What picjs Does

- **Text to diagrams**: Write simple ASCII descriptions, get precise SVG output
- **Browser-native**: Pure TypeScript that runs anywhere JavaScript runs
- **Zero dependencies**: Single library, no runtime requirements
- **Mermaid-style integration**: Automatic code block processing for markdown-like workflows

```picjs example
box "Hello"
arrow
box "World"
```

This produces two boxes connected by an arrow, rendered as inline SVG.

## Why picjs?

### Problem: Diagram tools force a choice

Most diagram tools fall into two camps:

1. **GUI tools** (Visio, draw.io): Point-and-click, but diagrams live outside your codebase and drift out of sync
2. **Auto-layout tools** (Mermaid, Graphviz): Diagrams as code, but you surrender control over positioning

picjs offers a third option: **precise diagrams as code**. You describe where things go, and picjs renders exactly what you specify.

### Comparison to Mermaid

| Aspect | Mermaid | picjs |
|--------|---------|-------|
| Approach | Fixed chart types (flowchart, sequence, etc.) | Freeform positioning primitives |
| Layout | Automatic—algorithm decides placement | Constraint-based—you control placement |
| Flexibility | Customize within chart type limits | Full control over every element |
| Learning curve | Lower for standard charts | Lower for custom layouts |
| Best for | Standard diagrams quickly | Precise, publication-quality diagrams |

**Use Mermaid when**: You want a standard flowchart/sequence/class diagram and don't care about exact positioning.

**Use picjs when**: You need precise control, custom layouts, or diagrams that don't fit standard templates.

## Quick Example

### Simple Flow

```picjs example
arrow right 200% "Markdown" "Source"
box rad 10px "Markdown" "Formatter" "(picjs)" fit
arrow right 200% "HTML+SVG" "Output"
arrow <-> down from last box.s
box same "picjs" "Diagram" "Renderer" fit
```

### Styled Elements

```picjs example
box "Normal"
arrow
box "Dashed" dashed
arrow
box "Colored" color blue fill lightblue
arrow
box "Rounded" rad 0.15
```

### Decision Diamond

```picjs example
box "Input"
arrow
diamond "Valid?" fit
arrow right "Yes" above
box "Process"
arrow down from last diamond.s "No" ljust
box "Error" color red
```

## Heritage

picjs is a faithful port of [pikchr](https://pikchr.org) by D. Richard Hipp (creator of SQLite), which itself descends from Brian Kernighan's PIC language (1984). The language has proven remarkably durable—the same concepts work as well today as they did 40 years ago.

## Next Steps

- **[Guide](/Guide/)**: Tutorial from basics to advanced features
- **[Reference](/Reference/)**: Complete language specification
- **[Playground](/)**: Try picjs interactively
