---
title: How Layout Works
description: How picjs decides where to put things
layout: layouts/doc.njk
eleventyNavigation:
  key: How Layout Works
  order: 2
---

Layout rests on two things: a **current position** and a **current direction**.
Everything else follows from how shapes and commands move them.

## Shapes follow one another

A shape with no position of its own is placed against the previous one, edge to
edge, in the current direction. The direction starts out east.

```picjs example
Box "one"
Box "two"
Box "three"
```

## Face changes the direction

```picjs example
Face s
Box "one"
Box "two"
```

`Face` takes a cardinal — `n`, `se`, `east` — or an angle: `Face 45`.

## Gap leaves space

Without a gap, shapes touch. `Gap` opens up one unit; `Gap 0.3` opens up that
much. `Gap same` repeats whatever the last gap was.

```picjs example
Box "one"
Gap
Box "two"
Gap 0.2
Box "three"
```

## Goto and Skip move without drawing

`Goto` takes a position, or a direction and a distance. `Skip` takes a
position. Neither draws anything.

```picjs example
Box "here"
Goto (2.5, 1)
Box "there"
```

## Placing a shape yourself

A shape given `at` is centred on that point, and the ones after it carry on
from there.

```picjs example
Box "A" at (0, 0)
Box "B" at (2, 0.8)
Box "C"
```

Positions can be written relative to other shapes. Every shape has nine
cardinal points — `.n`, `.ne`, `.e`, `.se`, `.s`, `.sw`, `.w`, `.nw` and `.c` —
and you can do arithmetic on them.

```picjs example
a = Box "A"
Box "B" at a.e + (1, 0.5)
```

## Constrain relative positions with constraints

`at` places a shape once. `with` pins a point on it to a place and keeps it
there: if the target moves, the shape moves too.

```
Box "B" with .w at a.e + (1, 0)
```

That matters when things move. Here `b` is placed with `at` and `c` with
`with`. Watch `a` move: `c` keeps its distance, `b` stays where it was put.

```picjs animated
a = Box "a"
b = Box "b" at a.e + (0.5, 0)
c = Box "c" with .w at a.e + (2, 0)
move a east 1 take 1
```

## Lines between shapes

A line with no endpoints joins the shape before it to the shape after it, and
takes up a unit of space as it goes.

```picjs example
Box "A"
-> "sends"
Box "B"
```

Give a line endpoints and it uses them instead, leaving the current position
alone.

## Groups

A group is anchored at the centre of its contents and behaves as one shape: it
is placed by the same rules, and has its own cardinal points.

Inside a group the direction starts afresh, and whatever the group does to it
is forgotten on the way out.

```picjs example
Box "before"
Group {
  Face s
  Box "in"
  Box "group"
}
Box "after"
```

## Aside draws without moving

Shapes inside an `Aside` are drawn where you ask, but the current position is
left untouched, so what follows carries on as though the aside were not there.

```picjs example
Box "one"
Aside {
  Box "note" at (0.5, -1)
}
Box "two"
```
