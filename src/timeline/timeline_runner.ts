import { AnimationRunner } from "../animation_runner.js"
import { Dispatcher } from "../dispatcher.js"
import { SBase } from "../shapes.js"
import { ExportedTimelineEntry, Timeline } from "../timeline.js"
import { TLEntry, Animation } from "./tlentries.js"

export class TimelineRunner {
    paused = false
    index = 0
    private entries: ExportedTimelineEntry[]
    private resumeWithContext!: () => void

  constructor(
    private timeline: Timeline,
    private dispatcher: Dispatcher,
    private animationRunner: AnimationRunner,
    private statusCallback: (status: string, time: number, message?: string | null) => void
  ) {
    this.entries = timeline.entries()
  }

  runAll() {
    this.processUpToNextTime(0)
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
  startFrom(t: number) {
    let next = this.peek()
    while (next) {
      if (next.start > t) break                          // future entry — stop
      if (next instanceof Animation && next.end > t) break  // needs to run — stop
      next = this.peekNext()                             // skip: non-anim or elapsed anim
    }
    this.resumeWithContext = () => this.processUpToNextTime(t)
  }

  processUpToNextTime(nextTime: number) {
    if (this.paused) {
      this.resumeWithContext = () => {
        this.processUpToNextTime(nextTime)
      }
      this.statusCallback(`paused`, 0)
      return
    }

    let next = this.peek()

    while (next && next.start <= nextTime) {
      next.process(this.timeline)
      if (this.timeline.pauseRequested) {
        const msg = this.timeline.pauseMessage
        this.timeline.pauseRequested = false
        this.timeline.pauseMessage = null
        this.paused = true
        this.resumeWithContext = () => {
          this.processUpToNextTime(nextTime)
        }
        this.dispatcher.renderUpdatedShapes()
        this.statusCallback(`paused`, 0, msg)
        return
      }
      next = this.peekNext()
    }

    this.dispatcher.renderUpdatedShapes()

    if (next)
      this.waitForNextEvent(next, nextTime)
    else
      this.statusCallback(`done`, 0)
  }

  waitForNextEvent(next: TLEntry, currentTime: number) {
    // Update resumeWithContext in case we're externally paused before the timeout fires
    this.resumeWithContext = () => this.processUpToNextTime(next.start)
    const interval = next.start - currentTime
    const speed = this.animationRunner.speed || 1
    setTimeout(() => {
      this.processUpToNextTime(next.start)
    }, interval * 1000 / speed)
  }

  startAnimationsNowGeometryIsSettled() {
    this.animationRunner.maybeStartRunners()
  }

  pause() {
    this.paused = true
  }

  cancel() {
    this.paused = true
  }

  resume() {
    this.paused = false
    if (this.resumeWithContext) {
      this.resumeWithContext()
    }
  }

  private peek() {
    return this.entries[this.index]
  }

  private peekNext() {
    this.index++
    return this.entries[this.index]
  }
}
