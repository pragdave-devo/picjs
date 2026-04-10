import { TimelineRunner } from "./timeline/timeline_runner.js"
import { AnimationRunner } from "./animation_runner.js"

export class PlaybackController {
  private isPlaying = false
  private speed = 1
  private totalDuration = 0
  private currentAnimTime = 0
  private playStartWall = 0      // ms (performance.now()) when last play() anchored
  private playStartAnimTime = 0  // seconds at that anchor point
  private rafHandle = 0
  private runner: TimelineRunner | null = null
  private animRunner: AnimationRunner | null = null
  private stopAt: number | null = null  // auto-stop time for start_from feature
  private eventTimes: number[] = []     // sorted unique event start times

  constructor(
    private playBtn:     HTMLButtonElement,
    private restartBtn:  HTMLButtonElement,
    private skipBackBtn: HTMLButtonElement,
    private skipFwdBtn:  HTMLButtonElement,
    private scrubber:    HTMLInputElement,
    private timeDisplay: HTMLElement,
    private speedBtns:   NodeListOf<HTMLButtonElement>,
    private bar:         HTMLElement,
    private onSeek:      (t: number) => void,
    private onRun:       () => void
  ) {
    this.playBtn.addEventListener(`click`, () => this.togglePlayPause())
    this.restartBtn.addEventListener(`click`, () => this.restart())
    this.skipBackBtn.addEventListener(`click`, () => this.skipBackward())
    this.skipFwdBtn.addEventListener(`click`, () => this.skipForward())
    this.scrubber.addEventListener(`input`, () => this.scrubTo(parseInt(this.scrubber.value, 10)))
    this.speedBtns.forEach(btn => {
      btn.addEventListener(`click`, () => this.setSpeed(parseFloat(btn.dataset.speed!) as 0.25 | 0.5 | 1 | 2 | 4))
    })
    this.setSpeed(1)
  }

  attach(totalDuration: number, runner: TimelineRunner | null, animRunner: AnimationRunner | null, startTime = 0, stopAt: number | null = null, eventTimes: number[] = []): void {
    this.totalDuration = totalDuration
    this.runner = runner
    this.animRunner = animRunner
    if (this.animRunner) this.animRunner.setSpeed(this.speed)
    this.currentAnimTime = startTime
    this.stopAt = stopAt
    this.eventTimes = eventTimes
    this.bar.style.display = `flex`
    this.updateDisplay(startTime)

    // Auto-play to stopAt if specified
    if (stopAt !== null && stopAt > 0) {
      this.play()
    }
  }

  cancel(): void {
    if (this.runner) {
      this.runner.cancel()
      this.runner = null
    }
    if (this.animRunner) {
      this.animRunner.stop()   // fully halts rAF loop, not just pause()
      this.animRunner = null
    }
    if (this.rafHandle) {
      cancelAnimationFrame(this.rafHandle)
      this.rafHandle = 0
    }
    this.isPlaying = false
    this.playBtn.textContent = `▶`
  }

  play(): void {
    this.playStartAnimTime = this.currentAnimTime
    this.playStartWall = performance.now()
    this.isPlaying = true
    this.playBtn.textContent = `⏸`
    if (this.runner) this.runner.resume()
    if (this.animRunner) this.animRunner.resume()
    this.tick()
  }

  pause(): void {
    this.currentAnimTime = this.getCurrentAnimTime()
    this.isPlaying = false
    this.playBtn.textContent = `▶`
    if (this.runner) this.runner.pause()
    if (this.animRunner) this.animRunner.pause()
    if (this.rafHandle) {
      cancelAnimationFrame(this.rafHandle)
      this.rafHandle = 0
    }
  }

  togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause()
    } else if (!this.runner || this.currentAnimTime >= this.totalDuration) {
      this.onRun()
      this.play()
    } else {
      this.play()
    }
  }

  restart(): void {
    this.cancel()
    this.currentAnimTime = 0
    this.updateDisplay(0)
    this.onRun()
  }

  skipForward(): void {
    const wasPlaying = this.isPlaying
    const currentTime = this.getCurrentAnimTime()

    // Find next event time after current time
    const nextTime = this.eventTimes.find(t => t > currentTime + 0.001)
    if (nextTime !== undefined) {
      this.seekTo(nextTime, wasPlaying)
    } else {
      // No more events, skip to end
      this.seekTo(this.totalDuration, false)
    }
  }

  skipBackward(): void {
    const wasPlaying = this.isPlaying
    const currentTime = this.getCurrentAnimTime()

    // Find previous event times, but skip events within 0.5s of current time
    // to avoid getting stuck on the current event
    let targetTime: number | undefined
    for (let i = this.eventTimes.length - 1; i >= 0; i--) {
      const t = this.eventTimes[i]
      if (t < currentTime - 0.001) {
        targetTime = t
        // If we'd only move back < 0.5s, keep looking for an earlier event
        if (currentTime - t >= 0.5) break
      }
    }

    if (targetTime !== undefined) {
      this.seekTo(targetTime, wasPlaying)
    } else {
      // No earlier events, skip to start
      this.seekTo(0, wasPlaying)
    }
  }

  private seekTo(t: number, andPlay: boolean): void {
    this.cancel()
    this.currentAnimTime = t
    this.onSeek(t)
    this.updateDisplay(t)
    if (andPlay && t < this.totalDuration) {
      this.play()
    }
  }

  scrubTo(rangeValue: number): void {
    const t = (rangeValue / 1000) * this.totalDuration
    this.cancel()
    this.currentAnimTime = t
    this.onSeek(t)
    this.updateDisplay(t)
  }

  setSpeed(s: 0.25 | 0.5 | 1 | 2 | 4): void {
    if (this.isPlaying) {
      this.currentAnimTime = this.getCurrentAnimTime()
    }
    this.speed = s
    if (this.animRunner) this.animRunner.setSpeed(s)
    if (this.isPlaying) {
      this.playStartAnimTime = this.currentAnimTime
      this.playStartWall = performance.now()
    }
    this.speedBtns.forEach(btn => {
      const active = parseFloat(btn.dataset.speed!) === s
      btn.style.background = active ? `#1e3a5f` : `none`
      btn.style.borderColor = active ? `#4a9eff` : `#334155`
      btn.style.color = active ? `#4a9eff` : `#64748b`
    })
  }

  private getCurrentAnimTime(): number {
    if (!this.isPlaying) return this.currentAnimTime
    return Math.min(
      this.playStartAnimTime + (performance.now() - this.playStartWall) / 1000 * this.speed,
      this.totalDuration
    )
  }

  private tick(): void {
    const t = this.getCurrentAnimTime()
    this.updateDisplay(t)

    // Check if we've reached the auto-stop point (start_from feature)
    if (this.stopAt !== null && t >= this.stopAt) {
      this.currentAnimTime = this.stopAt
      this.stopAt = null  // clear so we don't stop again on resume
      this.rafHandle = 0
      this.pause()
      this.updateDisplay(this.currentAnimTime)
      return
    }

    if (t >= this.totalDuration && !(this.animRunner?.running)) {
      this.currentAnimTime = this.totalDuration
      this.rafHandle = 0   // clear before pause() so pause() doesn't try to cancel it again
      this.pause()
      this.updateDisplay(this.totalDuration)
      return
    }
    this.rafHandle = requestAnimationFrame(() => this.tick())
  }

  private updateDisplay(t: number): void {
    this.scrubber.value = String(Math.round((t / Math.max(this.totalDuration, 0.001)) * 1000))
    this.timeDisplay.textContent = `${t.toFixed(1)}s / ${this.totalDuration.toFixed(1)}s`
  }
}
