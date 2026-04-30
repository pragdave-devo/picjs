import { Dispatcher } from "./dispatcher.js"
import * as Shapes    from "./shapes.js"
import { WithConstraint }    from "./shapes/_base.js"
import * as AST       from "./ast.js"
import { Renderer }   from "./render.js"
import { DependencyGraph } from "./dependency_graph.js"

export class ShapeGraph {

  private dispatcher:       Dispatcher
  private allShapes:        Shapes.SBase[]    = []
  private dependents:       Shapes.SBase[]    = []
  private connectors:       Shapes.LineLike[] = []
  readonly dependencyGraph: DependencyGraph   = new DependencyGraph()

  private sno = 1

  constructor(dispatcher: Dispatcher) {
    this.dispatcher = dispatcher
  }

  create(name: string, astArgs: Record<string, any> | undefined, args: Shapes.Args, withConstraint?: WithConstraint) {
    const ctr = Shapes.ShapeConstructors[name]

    // const ctr = (Shapes as Shapes.ShapeModule)[name])
    if (!ctr)
      throw new Error(`Unknown shape type: "${name}"`)

    const shape = new ctr({ ...args, _shapeName: name }, withConstraint, this.dispatcher)
    shape.astArgs = astArgs
    shape.id = `${name}-${this.sno++}`

    if (this.dispatcher.asideDepth > 0)
      shape.insideAside = true

    this.allShapes.push(shape)

    if (withConstraint)
      this.dependents.push(shape)

    if (shape instanceof Shapes.LineLike)
      this.connectors.push(shape)

    return shape
  }


  // returns a list of svg elements and any of their dependents
  //
  // Note to future self. You may be tempted to replace the dependency stuff with
  // some kind of tsort or depth-first tree. 
  //
  // Take it from your current self: bad idea. The constraints are dynamically
  // evaluated on each animation step, and could be a function. You can't
  // do a static dependency analysis. 
  //
  // To mitigate the overhead, we split possible dependents (connections and
  // shapes with `with` clauses into their own lists, so we don't have to
  // search every shape on each tick.
  //
  shapes(): Shapes.SBase[] {
    return this.allShapes
  }

  findLastOfType(shapeName: string): Shapes.SBase | undefined {
    for (let i = this.allShapes.length - 1; i >= 0; i--) {
      if (this.allShapes[i].shapeName === shapeName)
        return this.allShapes[i]
    }
    return undefined
  }

  recordDependency(dependent: Shapes.SBase, dependency: Shapes.SBase) {
    this.dependencyGraph.add(dependent, dependency)
  }

  recordVariableDependency(dependent: Shapes.SBase, varName: string) {
    this.dependencyGraph.add(dependent, varName)
  }

  propagateDirtyFromVariable(varName: string) {
    const dirty = this.dependencyGraph.propagateDirtyFromVariable(varName)
    for (const shape of dirty) {
      shape.rememberRenderNeeded()
      shape.variableDirty = true
    }
  }

  // Called after the full initial layout pass.  Scans allShapes to find
  // connectors that have no explicit _start or _end and assigns them implicit
  // predecessor/successor shapes, then records those as dependencies.
  resolveImplicitConnectorDependencies() {
    for (let i = 0; i < this.allShapes.length; i++) {
      const shape = this.allShapes[i]
      if (!(shape instanceof Shapes.LineLike)) continue

      if (!shape._start) {
        // Walk backwards to find the nearest non-child shape (including other connectors)
        for (let j = i - 1; j >= 0; j--) {
          const candidate = this.allShapes[j]
          if (!candidate.isChild()) {
            shape.predecessorShape = candidate
            this.dependencyGraph.add(shape, candidate)
            break
          }
        }
      }

      if (!shape._end) {
        // Walk forwards to find the nearest non-connector, non-child, non-aside shape.
        // Only auto-connect if the candidate was auto-positioned (no explicit `at`),
        // meaning it flows in sequence. Shapes with explicit `at` are independently
        // placed and shouldn't attract bare lines.
        for (let j = i + 1; j < this.allShapes.length; j++) {
          const candidate = this.allShapes[j]
          if (!(candidate instanceof Shapes.LineLike) && !candidate.isChild() && !candidate.insideAside) {
            if (!candidate.hasExplicitPosition()) {
              shape.successorShape = candidate
              this.dependencyGraph.add(shape, candidate)
            }
            break
          }
        }
      }
    }
  }

  renderUpdatedOn(renderer: Renderer) {
    // Re-evaluate dirty dependent shapes in topological order so that each
    // shape's dependencies are up-to-date before it is re-evaluated.
    this.dispatcher.isReEvaluating = true
    for (const shape of this.dependencyGraph.evaluationOrder()) {
      if (!shape.needsRendering()) continue

      // If a variable this shape depends on changed, re-evaluate all its
      // args from the stored AST so computed attributes (fill, stroke, etc.) update.
      if (shape.variableDirty) {
        shape.reEvaluateArgs()
        shape.variableDirty = false
      }

      // Skip repositioning for group children — they have fixed local coordinates
      // and SVG group transforms handle their absolute positioning.
      if (!shape.parentGroup) {
        if (shape instanceof Shapes.SPolyline) {
          this.dispatcher.positionPolyline(shape)
        } else if (shape instanceof Shapes.LineLike) {
          this.dispatcher.positionLine(shape)
        } else if (shape.withConstraint) {
          this.dispatcher.constrainedLayout(shape)
        }
      }
    }
    this.dispatcher.isReEvaluating = false

    const renderList = this.applyBehindConstraints(
      this.allShapes.filter(shape => shape.visible)
    )
    return renderer.render(renderList)
  }

  // Reorder shapes so that any shape with `behind X` appears before X.
  applyBehindConstraints(shapes: Shapes.SBase[]): Shapes.SBase[] {
    const result = [...shapes]
    for (let i = 0; i < result.length; i++) {
      const shape = result[i]
      if (!shape.behind) continue

      // If targeting a group, resolve to its first *visible* child — the group itself
      // sits after its children in allShapes and has no SVG element.
      let target: Shapes.SBase = shape.behind
      if (target instanceof Shapes.SGroup && target.groupChildren.length > 0) {
        target = target.groupChildren.find(c => result.includes(c)) ?? target.groupChildren[0]
      }

      const targetIdx = result.indexOf(target)
      if (targetIdx < 0 || targetIdx > i) continue  // target not found or already after us

      // Move shape to just before target (which is currently before us)
      result.splice(i, 1)
      const newTargetIdx = result.indexOf(target)
      result.splice(newTargetIdx, 0, shape)
      i--  // re-check this index since we shifted elements
    }
    return result
  }
}
