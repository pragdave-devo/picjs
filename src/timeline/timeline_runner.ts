import { AnimationRunner } from "../animation_runner.js"
import { Dispatcher } from "../dispatcher.js"
import { SBase } from "../shapes.js"
import { ExportedTimelineEntry, Timeline } from "../timeline.js"
import { TLEntry, Animation } from "./tlentries.js"

type RenderCallback = (shapes: SBase[]) => void

export class TimelineRunner {
    paused = false
    index = 0
    private entries: ExportedTimelineEntry[]
    private resumeWithContext!: () => void

  constructor(
    private timeline: Timeline, 
    private dispatcher: Dispatcher, 
    private animationRunner: AnimationRunner,
    private statusCallback: (status: string, time: number) => void
  ) {
    this.entries = timeline.entries()
  }

  runAll(renderer: RenderCallback) {
    this.processUpToNextTime(renderer, 0)
  }

  // Called after applyTimelineUpTo(t) has already rendered a snapshot.
  // Advances past entries that were already applied, then primes resumeWithContext
  // so that resume() drives the timeline forward from t without re-processing them.
  //
  // Rules:
  //   - Non-animation entries (CreateShape, etc.) with start ≤ t: skip (idempotent, already applied)
  //   - Animation entries with end ≤ t: skip (fully elapsed)
  //   - Animation entries with end > t: KEEP — processUpToNextTime will add them to the
  //     AnimationRunner so they actually play (for start == t) or resume from the
  //     interpolated position (for mid-flight start < t < end)
  startFrom(t: number, renderer: RenderCallback) {
    let next = this.peek()
    while (next) {
      if (next.start > t) break                          // future entry — stop
      if (next instanceof Animation && next.end > t) break  // needs to run — stop
      next = this.peekNext()                             // skip: non-anim or elapsed anim
    }
    this.resumeWithContext = () => this.processUpToNextTime(renderer, t)
  }

  // TODO: Remove renderCallback?
  processUpToNextTime(renderer: RenderCallback, nextTime: number) {
    if (this.paused) {
      this.resumeWithContext = () => {
        this.processUpToNextTime(renderer, nextTime)
      }
      this.statusCallback(`paused`, 0)
      return
    }

    let next = this.peek()

    while (next && next.start <= nextTime) { 
      next.process(this.timeline)
      next = this.peekNext()
    }

    this.dispatcher.renderUpdatedShapes()
    
    if (next)
      this.waitForNextEvent(next, nextTime, renderer)
    else 
      this.statusCallback(`done`, 0)
  }

  waitForNextEvent(next: TLEntry, currentTime: number, renderer: RenderCallback) {
    const interval = next.start - currentTime
    const speed = this.animationRunner.speed || 1
    setTimeout(() => {
      this.processUpToNextTime(renderer, next.start)
    }, interval * 1000 / speed)
  }
  
  startAnimationsNowGeometryIsSettled() {
    this.animationRunner.maybeStartRunners()
  }

  pause() {
    this.paused = true
  }

  cancel(): void {
    this.paused = true
  }

  resume() {
    this.paused = false
    this.statusCallback(`continuing`, 0)
    if (this.resumeWithContext) this.resumeWithContext()
  }
  
  peek() {
    if (this.index < this.entries.length)
      return this.entries[this.index].element
    return false
  }

  peekNext() {
    this.index++
    return this.peek()
  }
}


