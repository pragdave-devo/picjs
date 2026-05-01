import { Dispatcher } from "./dispatcher.js"
import { Interpreter } from "./interpreter.js"
import { PlaybackController } from "./jp-web-playback.js"
import { nullLogger, calculateBoundingBox, viewBoxFromBounds, unionBounds } from "./render-utils.js"
import * as AST from "./ast.js"

const PLAYER_CSS = `
.picjs-player {
  position: relative;
}
.picjs-player svg {
  width: 100%;
  height: auto;
  display: block;
}
.picjs-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 0 0 6px 6px;
  font: 13px/1 system-ui, sans-serif;
  color: #94a3b8;
  user-select: none;
}
.picjs-controls button {
  background: none;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  line-height: 1;
}
.picjs-controls button:hover {
  border-color: #4a9eff;
  color: #4a9eff;
}
.picjs-controls input[type=range] {
  flex: 1;
  height: 4px;
  accent-color: #4a9eff;
  cursor: pointer;
}
.picjs-controls .picjs-speeds {
  display: flex;
  gap: 2px;
}
.picjs-controls .picjs-speeds button {
  font-size: 11px;
  padding: 1px 4px;
}
.picjs-controls .picjs-time {
  font-size: 11px;
  min-width: 8em;
  text-align: right;
  white-space: nowrap;
}
.picjs-player {
  container-type: inline-size;
}
@container (max-width: 449px) {
  .picjs-controls .picjs-speeds,
  .picjs-controls .picjs-time {
    display: none;
  }
}
`

let cssInjected = false

function injectCSS() {
  if (cssInjected) return
  cssInjected = true
  const style = document.createElement("style")
  style.textContent = PLAYER_CSS
  document.head.appendChild(style)
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  if (children) for (const c of children) {
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  }
  return node
}

function getEventTimes(dispatcher: Dispatcher): number[] {
  const times = new Set<number>()
  for (const entry of dispatcher.getTimeline().entries()) {
    times.add(entry.element.start)
  }
  return [...times].sort((a, b) => a - b)
}

export class PicjsPlayer {
  private ast: AST.Node
  private svgHolder: SVGSVGElement
  private controller: PlaybackController
  private dispatcher: Dispatcher | null = null
  private runNumber = 0
  private controlsBar: HTMLElement

  private playBtn: HTMLButtonElement
  private restartBtn: HTMLButtonElement
  private skipBackBtn: HTMLButtonElement
  private skipFwdBtn: HTMLButtonElement
  private scrubber: HTMLInputElement
  private timeDisplay: HTMLElement
  private speedBtns: HTMLButtonElement[]

  constructor(private container: HTMLElement) {
    injectCSS()

    const astScript = container.querySelector("script[data-picjs-ast]")
    if (!astScript?.textContent) {
      throw new Error("picjs player: no AST data found in container")
    }
    this.ast = JSON.parse(astScript.textContent)

    let svg = container.querySelector("svg")
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      svg.setAttribute("style", "width:100%;height:auto")
      container.insertBefore(svg, astScript)
    }
    this.svgHolder = svg as SVGSVGElement

    this.playBtn = el("button", { class: "picjs-play", title: "Play / Pause" }, ["▶"])
    this.restartBtn = el("button", { title: "Restart" }, ["⏮"])
    this.skipBackBtn = el("button", { title: "Skip to previous event" }, ["⏪"])
    this.skipFwdBtn = el("button", { title: "Skip to next event" }, ["⏩"])
    this.scrubber = el("input", { type: "range", min: "0", max: "1000", value: "0" })
    this.speedBtns = [
      el("button", { "data-speed": "0.25" }, ["¼"]),
      el("button", { "data-speed": "0.5" }, ["½"]),
      el("button", { "data-speed": "1" }, ["1×"]),
      el("button", { "data-speed": "2" }, ["2×"]),
      el("button", { "data-speed": "4" }, ["4×"]),
    ]
    this.timeDisplay = el("span", { class: "picjs-time" }, ["0.0s / 0.0s"])

    const speedsDiv = el("div", { class: "picjs-speeds" }, this.speedBtns)
    this.controlsBar = el("div", { class: "picjs-controls" }, [
      this.playBtn, this.restartBtn, this.skipBackBtn, this.skipFwdBtn,
      this.scrubber, speedsDiv, this.timeDisplay,
    ])

    container.appendChild(this.controlsBar)

    this.controller = new PlaybackController(
      this.playBtn,
      this.restartBtn,
      this.skipBackBtn,
      this.skipFwdBtn,
      this.scrubber,
      this.timeDisplay,
      this.controlsBar.querySelectorAll(".picjs-speeds button") as NodeListOf<HTMLButtonElement>,
      this.controlsBar,
      (t: number) => this.onSeek(t),
      () => this.run(),
    )

    this.run()
  }

  private run() {
    this.controller.cancel()
    this.dispatcher = null

    const dispatcher = new Dispatcher(nullLogger, this.svgHolder, this.runNumber++)
    this.dispatcher = dispatcher

    try {
      const { stylesheets } = dispatcher.start(this.ast)
      this.applyStylesheets(stylesheets)

      const animRunner = dispatcher.getAnimationRunner()
      animRunner.pause()

      dispatcher.applyTimelineUpTo(0)
      this.computeViewBox()

      const duration = dispatcher.totalDuration()
      if (duration > 0) {
        const runner = dispatcher.runTimelineFrom(0, this.statusCallback)
        const eventTimes = getEventTimes(dispatcher)
        const startFrom = Number(dispatcher.getTimeline().startFrom) || 0
        this.controller.attach(
          duration, runner, animRunner, 0,
          startFrom > 0 ? startFrom : null, eventTimes,
        )
      } else {
        this.controlsBar.style.display = "none"
      }
    } catch (e) {
      try { dispatcher.getAnimationRunner().stop() } catch {}
      const msg = e instanceof Error ? e.message : String(e)
      console.error("picjs player error:", msg)
      this.controlsBar.style.display = "none"
    }
  }

  private onSeek(t: number) {
    this.controller.cancel()

    const dispatcher = new Dispatcher(nullLogger, this.svgHolder, this.runNumber)
    this.dispatcher = dispatcher
    try {
      dispatcher.start(this.ast)
      dispatcher.applyTimelineUpTo(t)
      this.computeViewBox()
      const seekRunner = dispatcher.runTimelineFrom(t, this.statusCallback)
      const eventTimes = getEventTimes(dispatcher)
      this.controller.attach(
        dispatcher.totalDuration(), seekRunner,
        dispatcher.getAnimationRunner(), t, null, eventTimes,
      )
    } catch (e) {
      console.error("picjs seek error:", e)
    }
  }

  private computeViewBox() {
    const pad = 0.2
    const dispatcher = this.dispatcher!
    let bounds = calculateBoundingBox(dispatcher.shapes(), pad)

    const times = dispatcher.animationBoundaryTimes()
    if (times.length > 1) {
      const probeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      probeSvg.style.position = "absolute"
      probeSvg.style.left = "-9999px"
      probeSvg.style.width = "0"
      probeSvg.style.height = "0"
      document.body.appendChild(probeSvg)
      for (const t of times) {
        if (t === 0) continue
        const probe = new Dispatcher(nullLogger, probeSvg, -1)
        probe.start(this.ast)
        probe.applyTimelineUpTo(t)
        bounds = unionBounds(bounds, calculateBoundingBox(probe.shapes(), pad))
      }
      document.body.removeChild(probeSvg)
    }

    this.svgHolder.setAttribute("viewBox", viewBoxFromBounds(bounds, pad))
  }

  private styleEl: HTMLStyleElement | null = null

  private applyStylesheets(stylesheets: string[]) {
    if (stylesheets.length === 0) return
    if (!this.styleEl) {
      this.styleEl = document.createElement("style")
      this.container.insertBefore(this.styleEl, this.container.firstChild)
    }
    this.styleEl.textContent = stylesheets.join("\n")
  }

  private statusCallback = (_status: string, _time: number, _message?: string | null) => {}

  get duration(): number {
    return this.dispatcher?.totalDuration() ?? 0
  }

  get currentTime(): number {
    return 0
  }

  get playing(): boolean {
    return this.dispatcher?.getAnimationRunner()?.running ?? false
  }

  play() { this.controller.togglePlayPause() }
  pause() { this.controller.togglePlayPause() }
  restart() { this.controller.cancel(); this.run() }
  seek(t: number) { this.onSeek(t) }
  setSpeed(s: 0.25 | 0.5 | 1 | 2 | 4) { this.controller.setSpeed(s) }

  destroy() {
    this.controller.cancel()
    this.controlsBar.remove()
    if (this.styleEl) this.styleEl.remove()
    this.dispatcher = null
  }
}

export function initAnimations(selector: string = "[data-picjs-player]"): PicjsPlayer[] {
  const containers = document.querySelectorAll<HTMLElement>(selector)
  const players: PicjsPlayer[] = []
  for (const container of containers) {
    try {
      players.push(new PicjsPlayer(container))
    } catch (e) {
      console.error("picjs: failed to init player:", e)
    }
  }
  return players
}
