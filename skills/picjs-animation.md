---
name: picjs-animation
description: Animate picjs diagrams — timeline, move/rotate/set/draw, easing, chaining
---

# Animating picjs Diagrams

picjs diagrams can be animated. Animations happen on a **timeline** — a number
line where each value represents a point in time. Shapes are drawn at time 0;
animations happen at later times.

## The timeline (`@`)

`@` is the current time. Advance it to schedule animations in sequence.

```
Box "A"                // drawn at time 0
@ += 1                 // advance time by 1
Box "B"                // drawn at time 1
```

### `@@` — snap to end of last animation

```
move a to (100, 0) take 2
@@                     // @ is now at the end of the move (time 2)
move b to (200, 0)     // starts after the move finishes
```

### Timeline properties

```
@.last_animation_end   // time when most recent animation ends
@.start_from = @       // set a loop restart point
```

## Animation commands

### `move` — animate position

```
move shape to position                      // move center
move shape.s to position                    // move a cardinal point
move shape north 2                          // move in a direction by a distance
move shape.cardinal to pos take 1 ease "cubicOut"
```

### `rotate` — animate rotation

```
rotate shape by 90                          // rotate 90 degrees
rotate shape by 360 about (0, 0)            // rotate around a point
rotate shape by -45 take 2 ease "linear"
```

### `set` — animate any attribute

```
set shape.fill to ~red                      // animate fill color
set shape.opacity to 0 take 0.5            // fade out
set shape.wid to 2 take 1                  // animate width
set label.font_size to 0.3 take 0.5        // animate text size
```

### `draw` — animate shape drawing

Shapes created with `nodraw` start invisible. `draw` reveals them
progressively (lines trace their path, shapes fade in).

```
l = Line -> from a to b nodraw
@ += 0.5
draw l take 1                               // line traces over 1 second
```

### `pause` — stop playback

```
pause                        // stop, show play button
pause "Click to continue"   // stop with message
```

## Animation parameters

Every animation command accepts optional `take` and `ease`:

```
move a to b.e take 2 ease "cubicInOut"
```

### `take` — duration

```
take 1                       // 1 second
take 0.3 + 0.2*distance     // computed duration
```

### `ease` — easing function

```
ease "linear"                // constant speed
ease "cubicIn"               // slow start
ease "cubicOut"              // slow end
ease "cubicInOut"            // slow start and end
ease "cubic"                 // alias for cubicInOut
ease "quadIn"
ease "quadOut"
ease "quadInOut"
ease "sineIn"
ease "sineOut"
ease "sineInOut"
```

## Chaining with `then`

`then` sequences animations so each starts when the previous ends:

```
move disk.s to pole.n ease "cubicIn"
then move disk.s to target.n ease "linear" take 0.5
then move disk.s to slot ease "cubicOut"
@@                           // advance past the whole chain
```

Without `then`, animations at the same `@` time run in parallel:

```
move a to (1, 0)             // these two run simultaneously
move b to (2, 0)
```

## `nodraw` pattern

Create shapes invisible, then reveal them with `draw`:

```
// Create all shapes first (invisible)
shapes = [1..5].map(n => {
  Box "#{n}" nodraw
})

// Then animate them appearing one by one
shapes.each(s => {
  draw s take 0.3
  @@
})
```

## Scheduling shapes on the timeline

Shapes created after advancing `@` appear at that time:

```
a = Box "First"              // visible from time 0

@ += 1
b = Box "Second"             // appears at time 1

@ += 1
c = Box "Third"              // appears at time 2
```

## Common animation patterns

### Sequential reveal
```
items = [1..5].map(n => Box "Step #{n}" nodraw)

items.each(item => {
  @ += 0.3
  draw item take 0.5
})
```

### Move along a path
```
a = Box "Start"
@ += 0.5
move a.s to waypoint1 ease "cubicIn"
then move a.s to waypoint2 ease "linear"
then move a.s to destination ease "cubicOut"
@@
```

### Fade in and out
```
label = Label "Hello" opacity 0
@ += 0.5
set label.opacity to 1 take 0.5       // fade in
@ += 2
set label.opacity to 0 take 0.5       // fade out
```

### Animate attribute changes
```
b = Box "Growing" wid 1 ht 1
@ += 0.5
set b.wid to 3 take 1 ease "cubicOut"
set b.ht to 2 take 1 ease "cubicOut"  // parallel with width
```

### Spin continuously
```
gear = Group { ... }

@.start_from = @
set gear.rotation to 360 take 4
then set gear.rotation to 0 take 4 ease "cubic"
```

### Towers of Hanoi pattern (move with computed timing)
```
moveDisk = (pFrom, pTo) => {
  distance = (pFrom.number - pTo.number).abs()
  disk = pFrom.pop()
  move disk.s to pFrom.n - (0, 10) ease "cubicIn"
  then move disk.s to pTo.n - (0, 10) ease "linear" take 0.3 + 0.3*distance
  then move disk.s to pTo.push(disk) ease "cubicOut"
  @@
}
```

## Deploying animated diagrams

The Eleventy plugin automatically injects the runtime for animated diagrams.
For other setups, include the runtime on the page:

```html
<script type="module">
  import { initAnimations } from "picjs/runtime"
  initAnimations()
</script>
```

This finds all animated diagram containers and attaches playback controls.
