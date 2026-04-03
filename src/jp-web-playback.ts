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

  constructor(
    private playBtn:     HTMLButtonElement,
    private restartBtn:  HTMLButtonElement,
    private scrubber:    HTMLInputElement,
    private timeDisplay: HTMLElement,
    private speedBtns:   NodeListOf<HTMLButtonElement>,
    private bar:         HTMLElement,
    private onSeek:      (t: number) => void,
    private onRun:       () => void
  ) {
    this.playBtn.addEventListener(`click`, () => this.togglePlayPause())
    this.restartBtn.addEventListener(`click`, () => this.restart())
    this.scrubber.addEventListener(`input`, () => this.scrubTo(parseInt(this.scrubber.value, 10)))
    this.speedBtns.forEach(btn => {
      btn.addEventListener(`click`, () => this.setSpeed(parseFloat(btn.dataset.speed!) as 0.25 | 0.5 | 1 | 2 | 4))
    })
    this.setSpeed(1)
  }

  attach(totalDuration: number, runner: TimelineRunner | null, animRunner: AnimationRunner | null, startTime = 0): void {
    this.totalDuration = totalDuration
    this.runner = runner
    this.animRunner = animRunner
    if (this.animRunner) this.animRunner.setSpeed(this.speed)
    this.currentAnimTime = startTime
    this.bar.style.display = `flex`
    this.updateDisplay(startTime)
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
