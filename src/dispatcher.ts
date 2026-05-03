import { Geometry } from "./geometry.js"
import { Interpreter } from "./interpreter.js"
import { Renderer } from "./render.js"
import { Timeline } from "./timeline.js"
import { ShapeGraph } from "./shape_graph.js"
import { WithConstraint } from "./shapes/_base.js"
import { LineLike, SBase, SLabel, SPolyline } from "./shapes.js"
import { SvgNode, serialize, IdGenerator } from "./svg-node.js"
import { Location } from "./location.js"
import { Binding } from "./binding.js"
import { XY, Cardinals } from "./position.js"
import { LoggerInterface } from "./types.js"
import { AnimatorBase } from "./animators/_base.js"
import { AnimationRunner } from "./animation_runner.js"
import * as TLE from "./timeline/tlentries.js"
import * as AST from "./ast.js"
export class Dispatcher {

  private interpreter: Interpreter
  private shapeGraph: ShapeGraph
  private geometry: Geometry
  private timeline: Timeline
  private renderer: Renderer
  private lastRenderNodes: SvgNode[] = []

  // Set while evaluating a shape's AST args/constraints, so the interpreter
  // can record variable→shape dependencies.
  currentEvaluatingShape: SBase | null = null
  asideDepth = 0
  isReEvaluating = false

  constructor(
    private logger: LoggerInterface,
    private svgHolder: SVGElement | null,
    runNumber: number
  ) {
    let width = 10, height = 7

    this.logger = logger
    this.interpreter = new Interpreter(this, runNumber)
    this.shapeGraph = new ShapeGraph(this)

    this.svgHolder = svgHolder
    if (svgHolder) {
      svgHolder.setAttribute("class", this.interpreter.cssPrefix)
      const vb = svgHolder.getAttribute(`viewBox`)
      if (vb) {
        const [ _x, _y, wid, ht ] = vb.split(" ").map(n => parseInt(n))
        if (wid && ht) {
          width = wid
          height = ht
        }
      }
    }
    this.geometry = new Geometry(this, width, height)
    this.timeline = new Timeline(this)
    this.renderer = new Renderer(this)
    this.interpreter.dispatcherIsReady()
  }

  
  start(content: AST.Node) {
    const output = this.interpreter.start(content)
    this.shapeGraph.resolveImplicitConnectorDependencies()
    const stylesheets = this.interpreter.stylesheets
    return { output, stylesheets }
  }

  valueOf(tree: AST.Node, binding: Binding) {
    const result =  this.interpreter.valueOf(tree, binding)
    return result
  }

  evaluateArgs(astArgs: Record<string, any>, binding: Binding) {
    return this.interpreter.evaluateArgs(astArgs, binding)
  }

  getCurrentBinding() {
    return this.interpreter.getCurrentBinding()
  }
  
  //////////////////////////////////////////////////  shapeGraph
  
  addShape(shapeName: string, astArgs: Record<string, any> | undefined, args: AST.Parameters, withConstraint?: WithConstraint) {
    return this.shapeGraph.create(shapeName, astArgs, args, withConstraint)
  }

  shapes() {
    return this.shapeGraph.shapes()
  }

  findLastShapeOfType(shapeName: string) {
    return this.shapeGraph.findLastOfType(shapeName)
  }

  renderUpdatedShapes() {
    const svgNodes = this.shapeGraph.renderUpdatedOn(this.renderer)
    this.lastRenderNodes = svgNodes
    if (this.svgHolder) {
      this.svgHolder.innerHTML = svgNodes.map((n: SvgNode) => serialize(n)).join("")
    }
  }

  renderToSvgNodes(): SvgNode[] {
    if (this.lastRenderNodes.length === 0) {
      this.renderUpdatedShapes()
    }
    return this.lastRenderNodes
  }

  setIdGenerator(gen: IdGenerator) {
    this.renderer.setIdGenerator(gen)
  }

  getUsedSlots(): Set<string> {
    return this.renderer.getUsedSlots()
  }

  //////////////////////////////////////////////////  timeline

  getTimeline() {
    return this.timeline
  }

  totalDuration(): number {
    return this.timeline.totalDuration()
  }

  animationBoundaryTimes(): number[] {
    return this.timeline.animationBoundaryTimes()
  }

  getAnimationRunner(): AnimationRunner {
    return this.timeline.animationRunner
  }

  applyTimelineUpTo(targetTime: number): void {
    for (const entry of this.timeline.entries()) {
      const e = entry.element
      if (e.start > targetTime) continue

      if (!(e instanceof TLE.Animation)) {
        // CreateShape, UpdateShapeNoAnimation, PositionShapeNoAnimation — process if start <= targetTime
        e.process(this.timeline)
        continue
      }

      // Animation entry
      if (e.end <= targetTime) {
        // Fully elapsed: snap to end state
        e.thing.start()
        e.thing.step(e.thing.duration())
      } else {
        // Mid-flight: interpolate
        e.thing.start()
        e.thing.step(targetTime - e.start)
      }
    }
    this.renderUpdatedShapes()
  }

  dumpTimeline() {
    this.timeline.dump()
  }

  updateAfterTimelineStep(_changedShapes: SBase[]) {
    // Dirty propagation now happens automatically via propagateDirty() when
    // shapes change. renderUpdatedShapes() handles re-evaluation and rendering.
    this.renderUpdatedShapes()
  }


  runTimeline(statusCallback: (...args: any[]) => void) {
    const runner = this.timeline.getRunner(statusCallback)

    runner.runAll()
    return runner
  }

  prepareTimeline(statusCallback: (...args: any[]) => void) {
    const runner = this.timeline.getRunner(statusCallback)
    runner.pause()
    runner.runAll()
    return runner
  }

  // Used after applyTimelineUpTo(t) to create a runner that can play from t.
  // The runner is paused (waiting for resume()) and won't re-process already-applied entries.
  runTimelineFrom(t: number, statusCallback: (...args: any[]) => void) {
    const runner = this.timeline.getRunner(statusCallback)
    runner.startFrom(t)
    return runner
  }

  currentRecordingTime() {
    return this.timeline.now()
  }

  setRecordingTime(time: number | "now") {
    this.timeline.setAtTime(time)
  }

  addAnimation(mover: AnimatorBase) {
    this.timeline.addAnimation(mover)
  }

  addPause(message: string | null) {
    this.timeline.addPause(message)
  }

  addCreateShapeToTimeline(shape: SBase) {
    this.timeline.addShape(shape)
  }

  // addImmediate(geometryChange) {
  //   this.timeline.addImmediate(geometryChange)
  // }

  // callbacks from shapes, because we have a timeline and they don't

  setCardinalToPoint(shape: SBase, cardinal: Cardinals, x: number, y: number) {
    this.timeline.setCardinalToPoint(shape, cardinal, { x, y })
  }

  updateOtherGeometry(shape: SBase, attr_name: string, attr_value: any) {
    this.timeline.updateOtherGeometry(shape, attr_name, attr_value)
  }

  updateShapeStyle(shape: SBase, attr_name: string, attr_value: any) {
    this.timeline.updateShapeStyle(shape, attr_name, attr_value)
  }

  ///////////////////////////////////////////////// geometry

  getLastShape(): SBase {
    return this.geometry.lastShape
  }

  setLastShape(shape: SBase) {
    this.geometry.lastShape = shape
  }

  getDirection(): XY {
    return { ...this.geometry.direction }
  }

  restoreDirection(direction: XY) {
    this.geometry.setDefaultDirection(direction)
  }

  getAutolayoutCount() {
    return this.geometry.autolayoutCount
  }

  addShapeToGeometry(shape: SBase) {
    this.geometry.addShape(shape)
  }

  setDirectionFromAngle(angle: number) {
    this.geometry.setDirectionFromAngle(angle)
  }

  setDefaultDirection(direction: XY) {
    this.geometry.setDefaultDirection(direction)
  }

  calculateDimensions(shape: SBase) {
    shape.calculateDimensions()
  }

  temporarilyAddSVGElement(element: SVGElement, callback: () => void) {
    if (!this.svgHolder) return
    this.svgHolder.appendChild(element)
    callback()
    this.svgHolder.removeChild(element)
  }
    
  positionLine(line: LineLike) {
    this.geometry.positionLine(line)
  }

  positionPolyline(poly: SPolyline) {
    this.geometry.positionPolyline(poly)
  }

  constrainedLayout(shape: SBase) {
    this.geometry.constrainedLayout(shape)
  }

  recordDependency(dependent: SBase, dependency: SBase) {
    this.shapeGraph.recordDependency(dependent, dependency)
  }

  recordVariableDependency(dependent: SBase, varName: string) {
    this.shapeGraph.recordVariableDependency(dependent, varName)
  }

  propagateDirtyFromVariable(varName: string) {
    this.shapeGraph.propagateDirtyFromVariable(varName)
  }

  resolveImplicitConnectorDependencies() {
    this.shapeGraph.resolveImplicitConnectorDependencies()
  }

  // Called by shapes when their position or an attribute changes.
  // Marks all transitive dependents as needing re-evaluation.
  propagateDirty(shape: SBase) {
    const dependents = this.shapeGraph.dependencyGraph.propagateDirty(shape)
    dependents.forEach(dep => dep.rememberRenderNeeded())
  }

  getAllDefaultAttributes(category: string, base: string, klass: string) {
    return this.interpreter.getAllDefaultAttributes(category, base, klass)
  }

  log(location: Location | undefined, value: any, source?: string ) {
    this.logger(location, value, source)
  }

}


