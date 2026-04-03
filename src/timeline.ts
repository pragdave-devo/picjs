// todo: make this switchable
import { MinPriorityQueue, PriorityQueueItem } from "@datastructures-js/priority-queue"
import { AnimationRunner } from "./animation_runner.js"
import { AnimatorBase } from "./animators/_base.js"
import { XY } from "./position.js"

// import { Geometry } from "./geometry.js"
import { TimelineRunner } from "./timeline/timeline_runner.js"
import * as TLE from "./timeline/tlentries.js"
import { BigNumber } from "./timeline/tlentries.js"
import { Dispatcher } from "./dispatcher.js"
import { SBase } from "./shapes.js"

export type ExportedTimelineEntry = PriorityQueueItem<TLE.TLEntry>

export class Timeline {
  recordingTime = 0
  currentShapes: SBase[] = []
  timeline: MinPriorityQueue<TLE.TLEntry>
  animationRunner: AnimationRunner

  lastAnimation: TLE.Animation | null = null
  frozen = false

  constructor(public dispatcher: Dispatcher) {
    this.timeline = new MinPriorityQueue({ priority: (entry) => entry.key })
    this.animationRunner = new AnimationRunner(dispatcher)
  }

  // interface to TTimeline
  now() {
    return this.recordingTime
  }
  
  maxTime() {
    const maxEntry = this.timeline.front()
    if (maxEntry)
      return maxEntry.element.end
    return 0
  }

  lastAnimationStart() {
    if (this.lastAnimation)
      return this.lastAnimation.start
    return 0
  }

  lastAnimationEnd() {
    if (this.lastAnimation)
      return this.lastAnimation.end
    return 0
  }

  totalDuration(): number {
    let max = 0
    for (const entry of this.entries()) {
      if (entry.element.end < BigNumber) {
        max = Math.max(max, entry.element.end)
      }
    }
    return max
  }


  // interface to the interpreter
  //
  addShape(shape: SBase) {
    this.addToTimeline(new TLE.CreateShape(shape, this.recordingTime))
    return shape
  }

  addAnimation(animation: AnimatorBase) {
    let start = this.recordingTime

    if (animation.followsPrevious() && this.lastAnimation)
      start = this.lastAnimation.end

    this.lastAnimation = new TLE.Animation(animation, start)
    this.addToTimeline(this.lastAnimation)
  }

  updateOtherGeometry(shape: SBase, attr: string, value: any) {
    this.addToTimeline(new TLE.UpdateShapeNoAnimation(shape, this.recordingTime, attr, value))
  }

  updateShapeStyle(shape: SBase, attr: string, value: any) {
    this.addToTimeline(new TLE.UpdateShapeNoAnimation(shape, this.recordingTime, attr, value))
  }

  setCardinalToPoint(shape: SBase, cardinal: string, pos: XY) {
    this.addToTimeline(new TLE.PositionShapeNoAnimation(shape, this.recordingTime, cardinal, pos))
  }

  setAtTime(time: `now` | number) {
    if (time === `now`) {
      this.recordingTime = this.lastAnimation ? this.lastAnimation.end : 0
    }
    else {
      this.recordingTime = time
    }
  }

  addToTimeline(thing: any) {
    if (this.frozen)
      throw new Error(`Attempt to add to frozen timeline`)
    this.timeline.enqueue(thing)
  }

  getRunner(statusCallback: (...args: any[]) => void) {
    this.frozen = true
    return new TimelineRunner(this, this.dispatcher, this.animationRunner, statusCallback)
  }

  processAnimationShouldBeRun(animation: TLE.Animation) {
    this.animationRunner.add(animation.thing)
  }

  entries(): ExportedTimelineEntry[] {
    return this.timeline.toArray()
  }

  dump() {
    this.entries().forEach(entry => entry.element.dump())
  }


  asArray() {
    return this.entries().map(entry => entry.element.toHash())
  }
}

