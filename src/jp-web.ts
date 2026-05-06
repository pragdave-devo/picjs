import { parseToAST, ParseResult, ParseStatus  } from "./parser.js"
import { RTE } from "./runtime_error.js"
import { parse as pegParse } from "./peg_parser/jp.js"
import { Dispatcher } from "./dispatcher.js"
import { nullLogger, calculateBoundingBox, unionBounds } from "./render-utils.js"
import { Location } from "./location.js"
import { Binding } from "./binding.js"
import { setTheme, getThemeName, resetTheme, applyPaletteToTheme, getDarkThemeValue } from "./defaults.js"
import { Palette } from "./palette.js"
import { computeSlotColors, generateCSS } from "./palette-css.js"
import { BUILD_STAMP } from "./build-stamp.js"

import { el, mount, setChildren, svg } from "redom"
import { PlaybackController } from "./jp-web-playback.js"

import { EditorView, basicSetup } from "codemirror"
import { oneDark } from "@codemirror/theme-one-dark"
import { jpLanguage } from "./jp-language.js"
import { StateEffect, StateField } from "@codemirror/state"
import { Decoration } from "@codemirror/view"
import type { DecorationSet } from "@codemirror/view"

// ─── Error-line highlighting ────────────────────────────────────────────────

const setErrorLine = StateEffect.define<number | null>()

const errorLineField = StateField.define<DecorationSet>({
  create() { return Decoration.none },
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) {
      if (e.is(setErrorLine)) {
        if (e.value === null) {
          deco = Decoration.none
        } else {
          const lineNo = e.value
          try {
            const line = tr.state.doc.line(lineNo)
            deco = Decoration.set([
              Decoration.line({ class: `cm-error-line` }).range(line.from),
            ])
          } catch {
            deco = Decoration.none
          }
        }
      }
    }
    return deco
  },
  provide: f => EditorView.decorations.from(f),
})

// ─── Configuration ────────────────────────────────────────────────────────

const examplesBase = (window as any).__PICJS_EXAMPLES_BASE ?? `/examples/`

// ─── Example definitions ──────────────────────────────────────────────────
//
// Each entry is { file, description }. The file is fetched from examples/ at
// selection time.  Add, remove, or reorder entries here to change the dropdown.

const examples: { file: string; description: string }[] = [
  { file: "state-machine.picjs",              description: "A state machine" },
  { file: "architecture.picjs",               description: "Basic Architecture diagram" },
  { file: "economy.picjs",                    description: "Simple model of supply and demand" },
  { file: "gear.picjs",                       description: "Parametric gear" },
  { file: "hanoi.picjs",                      description: "Hanoi animation" },
  { file: "kernighan.picjs",                  description: "Diagram from Kernighan's PIC paper" },
  { file: "line-labels.picjs",                description: "Demo of labelling on lines" },
  { file: "palette.picjs",                    description: "Themes and palettes" },
  { file: "petal.picjs",                      description: "Petals/Pattens" },
  { file: "sequential_color_generator.picjs", description: "Color interpolation" },
  { file: "snail.picjs",                      description: "Spiral with sequential colors" },
  { file: "spiro.picjs",                      description: "Spirograph" },
]

// ─── DOM elements ──────────────────────────────────────────────────────────

const extraStyles = el(`style`, { type: `text/css` })
const svgContainer = el(`div.svg-container`)
const svgHolder   = svg(`svg`, { style: `width:100%;height:100%` })
const errorArea   = el(`code.error-area`)
const errorHolder = el(`pre`, errorArea)
const resultHolder = el(`div.result-area`)
const logArea     = el(`div.log-area`)

const controlsBar  = el(`div.controls-bar`) as HTMLElement
const playBtn      = el(`button.ctrl-icon`, `▶`, { title: `Play / Pause` }) as HTMLButtonElement
const restartBtn   = el(`button.ctrl-icon`, `⏮`, { title: `Restart` }) as HTMLButtonElement
const skipBackBtn  = el(`button.ctrl-icon`, `⏪`, { title: `Skip to previous event` }) as HTMLButtonElement
const skipFwdBtn   = el(`button.ctrl-icon`, `⏩`, { title: `Skip to next event` }) as HTMLButtonElement
const scrubber     = el(`input`, { type: `range`, min: `0`, max: `1000`, value: `0` }) as HTMLInputElement
const speedBtns    = [
  el(`button`, `¼`,  { 'data-speed': `0.25` }),
  el(`button`, `½`,  { 'data-speed': `0.5` }),
  el(`button`, `1×`, { 'data-speed': `1` }),
  el(`button`, `2×`, { 'data-speed': `2` }),
  el(`button`, `4×`, { 'data-speed': `4` }),
] as HTMLButtonElement[]
const speedsDiv    = el(`div.ctrl-speeds`, speedBtns)
const timeDisplay  = el(`span.ctrl-time`, `0.0s / 0.0s`) as HTMLElement
setChildren(controlsBar, [playBtn, restartBtn, skipBackBtn, skipFwdBtn, scrubber, speedsDiv, timeDisplay])
const pauseOverlay = el(`div.pause-overlay`) as HTMLElement
pauseOverlay.style.display = `none`

setChildren(svgHolder, [])

// ─── CodeMirror editor ─────────────────────────────────────────────────────

const STORAGE_KEY = `jp-source`
const savedSource = localStorage.getItem(STORAGE_KEY) ?? ``

let saveTimer: ReturnType<typeof setTimeout> | null = null

let renderDebounce: ReturnType<typeof setTimeout> | null = null
let lastRenderMs = 0

function schedulePreview() {
  if (renderDebounce) clearTimeout(renderDebounce)
  // Scale debounce to last render time: fast programs get snappy feedback,
  // heavy programs (spirograph, palette grid) get longer pauses between renders
  const delay = Math.max(300, lastRenderMs * 1.5)
  renderDebounce = setTimeout(() => {
    renderDebounce = null
    const t0 = performance.now()
    preview()
    lastRenderMs = performance.now() - t0
  }, delay)
}

const editorView = new EditorView({
  doc: savedSource,
  extensions: [
    basicSetup,
    oneDark,
    jpLanguage,
    errorLineField,
    EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": { overflow: "auto" },
    }),
    EditorView.updateListener.of(update => {
      if (!update.docChanged) return
      // Debounce localStorage save
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, editorView.state.doc.toString())
      }, 300)
      schedulePreview()
    }),
  ],
})

// ─── Layout ────────────────────────────────────────────────────────────────

const exampleSelector = el(`select#example-selector`,
  [
    el(`option`, `— Examples —`, { value: `` }),
    ...examples.map(ex => el(`option`, ex.description, { value: ex.file })),
  ]
) as HTMLSelectElement

const runBtn = el(`button#run-btn`, `Run`) as HTMLButtonElement
const themeBtn = el(`button#theme-btn`, getThemeName()) as HTMLButtonElement

const editorTitle = el(`h2.editor-title`, [ `jp`, exampleSelector, themeBtn, runBtn ])
const leftPanel   = el(`div.left-panel`, [ editorTitle ])
leftPanel.appendChild(editorView.dom)

setChildren(svgContainer, [svgHolder])
const rightPanel = el(`div.right-panel`, [ svgContainer, controlsBar, pauseOverlay, errorHolder, logArea ])

const playpen = el(`div.playpen`, [
  extraStyles,
  leftPanel,
  rightPanel,
])

// ─── Helpers ───────────────────────────────────────────────────────────────

function highlightErrorLine(line: number | null) {
  editorView.dispatch({ effects: setErrorLine.of(line) })
}

/** Recursively render any runtime value the way console.dir does. */
function renderAny(v: any, depth = 0): HTMLElement {
  if (depth > 6) return el(`span.dir-value`, `…`)

  if (v === null || v === undefined)
    return el(`span.dir-value`, `null`)

  if (typeof v !== `object`)
    return el(`span.dir-value`, String(v))

  // TBase with user-defined attrs
  let entries: [string, any][] | null = null
  let typeName = ``

  if (`attributesAsTable` in v) {
    const a = v.attributesAsTable() as Record<string, any>
    if (Object.keys(a).length > 0) entries = Object.entries(a)
    typeName = v.typeName ?? v.constructor?.name ?? ``
  }

  // SBase shapes store display data in params (raw JS values)
  if (!entries && `params` in v && v.params && typeof v.params === `object`) {
    entries = Object.entries(v.params)
    typeName = v.constructor?.name ?? ``
  }

  // Plain JS object (e.g. position {x, y})
  if (!entries) {
    const keys = Object.keys(v)
    if (keys.length > 0) {
      entries = Object.entries(v)
      typeName = v.constructor?.name !== `Object` ? (v.constructor?.name ?? ``) : ``
    }
  }

  if (entries) {
    const items = entries.map(([k, child]) =>
      el(`li.dir-item`, [el(`span.dir-key`, k + `:`), renderAny(child, depth + 1)])
    )
    const list = el(`ul.dir-list`, items)
    const label = typeName || `{…}`
    const summary = el(`summary.dir-typename`, label)
    const details = el(`details.dir-node`, [summary, list]) as HTMLDetailsElement
    if (depth === 0) details.open = true
    return details
  }

  return el(`span.dir-value`, v?.toString() ?? `null`)
}

function tableOfBindings(binding: Binding, level: number): HTMLElement | [] {
  if (level > 2) return []
  const items = Object.entries(binding).map(([k, v]) =>
    el(`li.dir-item`, [el(`span.dir-key`, k + `:`), renderAny(v, level + 1)])
  )
  return el(`ul.dir-list`, items)
}

function webBacktrace(e: RTE, sourceCode?: string) {
  const locStr = e.locationString
  const headerText = locStr ? `${locStr} ${e.message}` : e.message
  const header = el(`h3`, headerText)
  let backtrace: HTMLElement[] = []
  if (e.context) {
    let msg = `Error happened here`
    backtrace = e.context.map(({ loc, interpreter }) => {
      const srcLine  = el(`div.source`, e.showLocation(loc, msg, sourceCode))
      msg = `… called from`
      const binding  = interpreter.bindingAsTable()
      const bindings = tableOfBindings(binding, 0)
      return el(`div.stackframe`, [ srcLine, bindings ])
    })
  }
  setChildren(errorArea, [ header, ...backtrace ])
}

function consoleBacktrace(e: RTE) {
  console.log(`[backtrace start]`)
  let msg = e.message
  if (e.context) {
    e.context.forEach(({ loc, interpreter }, i) => {
      console.log(`[frame ${i}]`)
      console.log(e.showLocation(loc, msg))
      msg = `called from`
      const table = interpreter.bindingAsTable()
      console.log(`[table ready, ${Object.keys(table).length} entries]`)
      console.table(
        Object.entries<any>(table).map(([k, val]) => [ k, val.toString() ])
      )
    })
  } else {
    console.error(msg)
  }
  console.log(`[backtrace done]`)
}

export function consoleLogger(loc: Location | undefined, result: any, src?: string) {
  const line = loc?.start?.line ?? `?`
  const col = loc?.start?.column ?? `?`
  if (src) {
    console.log(`%c${line}:${col}» %c${src} = %c${result.toString()}`,
                `color: gray;`, `color: darkseagreen;`, `font-weight: bold; color: darkgreen;`)
  } else {
    console.log(`%c${line}:${col}» %c${result.toString()}`,
                `color: gray;`, `color: forestgreen;`)
  }
}

function webLogger(loc: Location | undefined, result: any, src?: string) {
  const logline = el(`p.log-line`, [
    el(`span.location-line`, loc?.start?.line?.toString() ?? ``),
    el(`span.location-col`,  loc?.start?.column?.toString() ?? ``),
    src ? el(`span.src`, src) : [],
    el(`span.result`, result),
  ])
  logArea.appendChild(logline)
}

function logger(loc: Location | undefined, result: any, src?: string) {
  consoleLogger(loc, result, src)
  webLogger(loc, result, src)
}

function doBacktrace(e: RTE, sourceCode?: string) {
  consoleBacktrace(e)
  webBacktrace(e, sourceCode)
}

function stripLocation(k: string, v: any) {
  if (k === `location`) return undefined
  return v
}

function showPauseMessage(msg: string) {
  pauseOverlay.textContent = msg
  pauseOverlay.style.display = `flex`
}

function hidePauseMessage() {
  pauseOverlay.style.display = `none`
}

function statusCallback(status: string, _time: number, message?: string | null) {
  console.log(`STATUS:`, status, message ?? ``)
  if (status === `paused` && message) {
    showPauseMessage(message)
  } else {
    hidePauseMessage()
  }
}

// ─── Result rendering ──────────────────────────────────────────────────────

function renderResult(output: any) {
  setChildren(resultHolder, [ renderAny(output, 0) ])
}

// ─── Run ───────────────────────────────────────────────────────────────────

let runNumber  = 0
let lastOutput: any = null
let shapeMap   = new Map<string, any>()

function getEventTimes(dispatcher: Dispatcher): number[] {
  const times = new Set<number>()
  for (const entry of dispatcher.getTimeline().entries()) {
    times.add(entry.element.start)
  }
  return [...times].sort((a, b) => a - b)
}

function onSeek(t: number): void {
  controller.cancel()  // re-entrant seek protection: cancel any in-flight runners first
  const src = editorView.state.doc.toString()
  const parsed: ParseResult = parseToAST(pegParse, src, `Start`)
  if (parsed.status !== ParseStatus.Ok) return

  const seekDispatcher = new Dispatcher(logger, svgHolder, runNumber)
  try {
    seekDispatcher.start(parsed.ast)
    seekDispatcher.applyTimelineUpTo(t)
    const seekRunner = seekDispatcher.runTimelineFrom(t, statusCallback)
    const eventTimes = getEventTimes(seekDispatcher)
    controller.attach(seekDispatcher.totalDuration(), seekRunner, seekDispatcher.getAnimationRunner(), t, null, eventTimes)
  } catch (e) {
    if (e instanceof RTE) {
      // seek failed — leave display where it was
    } else {
      console.error(`jp seek error:`, e)
    }
  }
}

const controller = new PlaybackController(
  playBtn, restartBtn, skipBackBtn, skipFwdBtn, scrubber, timeDisplay,
  controlsBar.querySelectorAll(`.ctrl-speeds button`) as NodeListOf<HTMLButtonElement>,
  controlsBar,
  onSeek,
  () => run()
)

let currentDispatcher: Dispatcher | null = null

/** Preview: render shapes up to t=0 without starting animations */
function preview() {
  controller.cancel()
  setChildren(logArea, [])
  setChildren(resultHolder, [])
  highlightErrorLine(null)
  lastOutput = null
  shapeMap.clear()
  currentDispatcher = null
  resetTheme()
  Palette.setCurrent(`sunset`)
  applyPaletteToTheme(Palette.getCurrentColors())

  const src = editorView.state.doc.toString()
  const parsed: ParseResult = parseToAST(pegParse, src, `Start`)

  if (parsed.status === ParseStatus.Ok) {
    errorArea.textContent = ``

    const dispatcher = new Dispatcher(logger, svgHolder, runNumber++)
    currentDispatcher = dispatcher

    try {
      const { output, stylesheets } = dispatcher.start(parsed.ast)
      lastOutput = output
      for (const shape of dispatcher.shapes()) shapeMap.set(shape.id, shape)
      renderResult(output)

      const duration = dispatcher.totalDuration()
      const startFrom = Number(dispatcher.getTimeline().startFrom) || 0

      // Pause animation runner before applying timeline to prevent auto-start
      const animRunner = dispatcher.getAnimationRunner()
      animRunner.pause()

      // Render shapes at t=0
      dispatcher.applyTimelineUpTo(0)

      // Generate palette CSS after render so all used slots are populated
      const usedSlots = dispatcher.getUsedSlots()
      let css = stylesheets.join(`\n`)
      if (usedSlots.size > 0) {
        const slotColors = computeSlotColors(
          usedSlots,
          (pal, slot) => Palette.getColorForPalette(pal, slot),
          getDarkThemeValue('NativeFg') as string,
          getDarkThemeValue('NativeBg') as string
        )
        const paletteCss = generateCSS(usedSlots, slotColors)
        if (paletteCss) css = css ? `${css}\n${paletteCss}` : paletteCss
      }
      extraStyles.textContent = css

      // Compute viewBox: start with getBBox for accurate text bounds at t=0,
      // then union with geometry bounds at sampled animation times.
      svgHolder.setAttribute(`viewBox`, `0 0 10 7`)
      svgHolder.getBoundingClientRect()
      const bbox = svgHolder.getBBox()
      const pad = 0.2
      let bounds = { minX: bbox.x, minY: bbox.y, maxX: bbox.x + bbox.width, maxY: bbox.y + bbox.height, width: bbox.width, height: bbox.height }
      const times = dispatcher.animationBoundaryTimes()
      if (times.length > 1) {
        // Sample at most 20 evenly spaced times (always include the last)
        const MAX_PROBES = 20
        let probeTimes: number[]
        if (times.length <= MAX_PROBES) {
          probeTimes = times.filter(t => t > 0)
        } else {
          probeTimes = []
          const step = (times.length - 1) / (MAX_PROBES - 1)
          for (let i = 1; i < MAX_PROBES - 1; i++) {
            probeTimes.push(times[Math.round(i * step)])
          }
          probeTimes.push(times[times.length - 1])
        }
        const probeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
        probeSvg.style.cssText = "position:absolute;left:-9999px;width:0;height:0"
        document.body.appendChild(probeSvg)
        for (const t of probeTimes) {
          const probe = new Dispatcher(nullLogger, probeSvg, -1)
          probe.start(parsed.ast)
          probe.applyTimelineUpTo(t)
          bounds = unionBounds(bounds, calculateBoundingBox(probe.shapes(), pad))
        }
        document.body.removeChild(probeSvg)
      }
      const vbX = bounds.minX - pad
      const vbY = bounds.minY - pad
      svgHolder.setAttribute(`viewBox`,
        `${vbX} ${vbY} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`)

      // Build stamp
      const oldStamp = svgHolder.querySelector('.picjs-stamp')
      if (oldStamp) oldStamp.remove()
      const stampEl = document.createElementNS("http://www.w3.org/2000/svg", "text")
      stampEl.setAttribute("class", "picjs-stamp")
      stampEl.setAttribute("x", String(vbX + 0.05))
      stampEl.setAttribute("y", String(vbY + 0.12))
      stampEl.setAttribute("font-size", "0.08")
      stampEl.setAttribute("fill", "#888")
      stampEl.setAttribute("font-family", "monospace")
      stampEl.textContent = BUILD_STAMP
      svgHolder.appendChild(stampEl)

      if (duration > 0) {
        // Has animations — show controls bar, set up for playback
        const runner = dispatcher.runTimelineFrom(0, statusCallback)
        const eventTimes = getEventTimes(dispatcher)
        controller.attach(duration, runner, animRunner, 0, startFrom > 0 ? startFrom : null, eventTimes)
      } else {
        // No animations — hide controls bar
        controlsBar.style.display = `none`
      }
    } catch (e) {
      // Ensure any animation runners are stopped on error
      try {
        dispatcher.getAnimationRunner().stop()
      } catch { /* ignore cleanup errors */ }

      if (e instanceof RTE) {
        const errorLine = e.context?.[0]?.loc?.start?.line ?? null
        highlightErrorLine(errorLine)
        doBacktrace(e, src)
      } else {
        const msg = e instanceof Error ? e.message : String(e)
        errorArea.textContent = msg
        console.error(`jp error:`, e)
      }
      controlsBar.style.display = `none`
    }
  } else {
    const loc = parsed.error.location
    const errorLine = loc?.start?.line ?? null
    const errorCol  = loc?.start?.column ?? null

    // Format error with source pointer
    if (errorLine && errorCol) {
      const lines = src.split(/\n/)
      const srcLine = lines[errorLine - 1] ?? ``
      const prefix = `«${errorLine}:${errorCol}»: `
      errorArea.textContent =
        `${prefix}${srcLine}\n` +
        `${``.padStart(prefix.length + errorCol - 1)}^——— ${parsed.error.message}`
    } else {
      errorArea.textContent = parsed.error.toString()
    }

    highlightErrorLine(errorLine)

    controlsBar.style.display = `none`
  }
}

/** Run: same as preview but used by play button restart */
function run() {
  preview()
}

// ─── Hover-to-inspect ──────────────────────────────────────────────────────

svgHolder.addEventListener(`mouseover`, (e: Event) => {
  const el = (e.target as SVGElement).closest(`[data-jp-id]`) as SVGElement | null
  const id = el?.getAttribute(`data-jp-id`)
  if (id && shapeMap.has(id)) renderResult(shapeMap.get(id))
})

svgHolder.addEventListener(`mouseleave`, () => {
  if (lastOutput !== null) renderResult(lastOutput)
})

// ─── Global error handler ──────────────────────────────────────────────────

window.addEventListener(`error`, (ev) => {
  errorArea.textContent = ev.message
  console.error(`jp uncaught:`, ev.error)
})

window.addEventListener(`unhandledrejection`, (ev) => {
  const msg = ev.reason instanceof Error ? ev.reason.message : String(ev.reason)
  errorArea.textContent = msg
  console.error(`jp uncaught promise:`, ev.reason)
})

// ─── Example selector ─────────────────────────────────────────────────────

async function loadExample(file: string) {
  try {
    const resp = await fetch(`${examplesBase}${file}`)
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
    const src = await resp.text()
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: src },
    })
    run()
  } catch (e) {
    errorArea.textContent = `Failed to load example: ${e}`
  }
}

exampleSelector.addEventListener(`change`, async () => {
  const file = exampleSelector.value
  if (!file) return
  const url = new URL(window.location.href)
  url.searchParams.set(`example`, file)
  history.pushState(null, ``, url)
  await loadExample(file)
})

runBtn.addEventListener(`click`, () => preview())

themeBtn.addEventListener(`click`, () => {
  const next = getThemeName() === 'Dark' ? 'Light' : 'Dark'
  setTheme(next)
  themeBtn.textContent = next
  document.body.setAttribute(`data-theme`, next.toLowerCase())
  preview()
})

// ─── Bootstrap ─────────────────────────────────────────────────────────────

const mountTarget = document.getElementById(`playground-container`) ?? document.body
mount(mountTarget, playpen)
editorView.focus()

window.addEventListener(`popstate`, () => {
  const file = new URL(window.location.href).searchParams.get(`example`)
  if (file) {
    exampleSelector.value = file
    loadExample(file)
  }
})

const initialUrl = new URL(window.location.href)

// ?reset — emergency escape hatch: clear saved source and reload clean
if (initialUrl.searchParams.has(`reset`)) {
  localStorage.removeItem(STORAGE_KEY)
  initialUrl.searchParams.delete(`reset`)
  window.location.replace(initialUrl.toString())
} else {
  const initialExample = initialUrl.searchParams.get(`example`)
  if (initialExample && examples.some(e => e.file === initialExample)) {
    exampleSelector.value = initialExample
    loadExample(initialExample)
  } else if (savedSource) {
    // Defer so the page is interactive before a heavy render
    requestAnimationFrame(() => preview())
  }
}
