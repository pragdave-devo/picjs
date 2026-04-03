import { AnimatorBase, AnimationParams } from "./_base.js"
import { TNumber, TA } from "../types.js"
import * as Shape from "../shapes.js"

export class DrawAnimator extends AnimatorBase {

  private isBounce: boolean

  constructor(
    private shape: Shape.SBase,
    params: AnimationParams
  ) {
    // If bounce, use linear on the range — we handle easing ourselves
    const isBounce = params.ease === `bounce`
    if (isBounce) params = { ...params, ease: `linear` }
    super(params)
    this.isBounce = isBounce
  }

  start() {
    this.shape.setAnimatableAttr(`draw_progress`, new TNumber(0))
    this.setupRange(new TNumber(0), new TNumber(1))
  }

  step(timeIntoAnimation: number) {
    if (!this.isBounce) {
      super.step(timeIntoAnimation)
      return
    }

    const totalTime = this.params.take
    let ratio = timeIntoAnimation / totalTime
    if (ratio >= 1.0) { this._done = true; ratio = 1.0 }

    const bounceSec = bounceDuration(totalTime)
    const drawEnd = 1 - bounceSec / totalTime

    let progress: number
    if (ratio <= drawEnd) {
      // Draw phase: cubic in-out easing
      const t = ratio / drawEnd
      progress = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
    } else {
      // Bounce phase: damped oscillation around 1.0
      const t = (ratio - drawEnd) / (1 - drawEnd)
      progress = 1 - 0.1 * Math.exp(-6 * t) * Math.sin(3 * Math.PI * t)
    }

    this._step(new TNumber(progress))
  }

  _step(nextValue: TA) {
    this.shape.setAnimatableAttr(`draw_progress`, nextValue)
  }
}

function bounceDuration(totalTime: number): number {
  if (totalTime < 2) return 0.2 * totalTime
  if (totalTime < 10) return 0.05 * totalTime
  return 0.5
}
