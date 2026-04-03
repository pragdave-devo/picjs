import { AnimatorBase } from "./animators/_base.js"
import { EasingNames } from "./animators/_base.js"
import { Dispatcher } from "./dispatcher.js"

class Runner {
  duration: number
  durationMs: number
  progressPerMilli: number
  currentProgress = 0

  pendingStart = true
  done = false
  easing: EasingNames
  addedAtElapsed: number  // elapsed time (seconds) when this runner was added

  constructor(public animation: AnimatorBase, addedAtElapsed: number) {
    this.duration = animation.duration()
    this.durationMs = this.duration * 1000
    this.easing = animation.ease()
    this.progressPerMilli = 1.0 / (1000 * this.duration)
    this.addedAtElapsed = addedAtElapsed
  }

  ensureStarted() {
    if (this.pendingStart) {
      this.animation.start()
      this.pendingStart = false
    }
  }
}

export class AnimationRunner {

  running = false
  paused = false
  pausedAt = 0  // ELAPSED TIME (ms) WHEN PAUSED
  currentRunners: Runner[] = []
  startTime: number | null = null
  speed = 1

  constructor(public dispatcher: Dispatcher) {
  }

  add(animation: AnimatorBase) {
    const elapsed = this.currentElapsed()
    this.currentRunners.push(new Runner(animation, elapsed))
    this.maybeStartRunners()
  }

  // Returns the current scaled elapsed time in seconds, or 0 if not yet started
  private currentElapsed(): number {
    if (this.startTime === null) return 0
    if (this.paused) return this.pausedAt / 1000 * this.speed
    return (performance.now() - this.startTime) / 1000 * this.speed
  }

  maybeStartRunners() {
    if (!this.running && this.currentRunners.length > 0) {
      this.scheduleRunner()
    }
  }

  scheduleRunner() {
    this.running = true

    window.requestAnimationFrame(ts => {
      if (!this.startTime)
        this.startTime = ts - this.pausedAt

      if (this.paused) {
        this.pausedAt = ts - this.startTime
      }
      else {
        const elapsed = (ts - this.startTime) / 1000 * this.speed
        this.animationStep(elapsed)
      }
    })
  }

  animationStep(elapsed: number) {
    const newCurrentRunners: Runner[] = []

    this.currentRunners.forEach(runner => {
      runner.ensureStarted()

      const localElapsed = elapsed - runner.addedAtElapsed
      runner.animation.step(localElapsed)

      if (runner.animation.done()) {
        runner.animation.stop()
      }
      else {
        newCurrentRunners.push(runner)
      }
    })

    this.currentRunners = newCurrentRunners

    if (this.currentRunners.length > 0) {
      this.scheduleRunner()
    }
    else {
      this.paused = false
      this.running = false
      this.startTime = null
      this.pausedAt = 0
    }
    this.dispatcher.renderUpdatedShapes()
  }

  setSpeed(s: number) {
    if (this.startTime !== null && !this.paused) {
      // Re-anchor: convert elapsed so far at old speed into raw ms, then rebase startTime
      const now = performance.now()
      const rawElapsed = now - this.startTime  // raw ms elapsed
      // scaledElapsed at old speed = rawElapsed * oldSpeed / 1000
      // We want: rawElapsed_new such that rawElapsed_new * newSpeed = rawElapsed * oldSpeed
      // => rawElapsed_new = rawElapsed * oldSpeed / newSpeed
      const adjustedRaw = rawElapsed * this.speed / s
      this.startTime = now - adjustedRaw
    } else if (this.paused && this.startTime !== null) {
      // pausedAt is raw ms — adjust similarly
      this.pausedAt = this.pausedAt * this.speed / s
    }
    this.speed = s
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
    this.maybeStartRunners();
  }

  stop(): void {
    this.paused = true
    this.running = false
    this.currentRunners = []
    this.startTime = null
    this.pausedAt = 0
  }

}
