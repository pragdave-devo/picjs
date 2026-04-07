import { parseToAST, ParseResult, ParseStatus  } from "./parser.js"
import { RTE } from "./runtime_error.js"
import * as PEG from "./peg_parser/jp.js"
import * as Peggy from "peggy"
import { Dispatcher } from "./dispatcher.js"
import { Location } from "./parser.js"
import { Binding } from "./binding.js"
import { setTheme, getThemeName } from "./defaults.js"

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

// ─── Example definitions ──────────────────────────────────────────────────
//
// Each entry is { file, description }. The file is fetched from examples/ at
// selection time.  Add, remove, or reorder entries here to change the dropdown.

const examples: { file: string; description: string }[] = [
{ file: "911.pic",                        description: "A state machine" },
{ file: "architecture.pic",               description: "Basic Aerchitecturen diagram" },
{ file: "economy.pic",                    description: "Simple model of supply and demand" },
{ file: "gear.pic",                       description: "Prametric gear" },
{ file: "hanoi.pic",                      description: "Hanoi animation" },
{ file: "kernighan.pic",                  description: "Diagram from Kernighan's PIC paper" },
{ file: "line-labels.pic",                description: "Demo of labelling on lines" },
{ file: "petal.pic",                      description: "Petals/Pattens" },
{ file: "sequential_color_generator.pic", description: "Color interpolation" },
{ file: "snail.pic",                      description: "Spiral with sequential colors" },
{ file: "spiro.picjs",                    description: "Spirograph" },

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
setChildren(controlsBar, [playBtn, restartBtn, scrubber, speedsDiv, timeDisplay])

setChildren(svgHolder, [])

// ─── CodeMirror editor ─────────────────────────────────────────────────────

const STORAGE_KEY = `jp-source`
const savedSource = localStorage.getItem(STORAGE_KEY) ?? ``

let saveTimer: ReturnType<typeof setTimeout> | null = null
let renderTimer: ReturnType<typeof setTimeout> | null = null

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
      // Debounce render preview
      if (renderTimer) clearTimeout(renderTimer)
      renderTimer = setTimeout(() => {
        preview()
      }, 300)
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
const rightPanel = el(`div.right-panel`, [ svgContainer, controlsBar, errorHolder, logArea ])

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
  let msg = e.message
  if (e.context) {
    e.context.forEach(({ loc, interpreter }) => {
      console.log(e.showLocation(loc, msg))
      msg = `called from`
      console.table(
        Object.entries<any>(interpreter.bindingAsTable()).map(([k, val]) => [ k, val.toString() ])
      )
    })
  } else {
    console.error(msg)
  }
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

function statusCallback(...args: any[]) {
  console.log(`STATUS:`, ...args)
}

// ─── Result rendering ──────────────────────────────────────────────────────

function renderResult(output: any) {
  setChildren(resultHolder, [ renderAny(output, 0) ])
}

// ─── Run ───────────────────────────────────────────────────────────────────

let runNumber  = 0
let lastOutput: any = null
let shapeMap   = new Map<string, any>()

function onSeek(t: number): void {
  controller.cancel()  // re-entrant seek protection: cancel any in-flight runners first
  const src = editorView.state.doc.toString()
  const parsed: ParseResult = parseToAST((<unknown>PEG) as Peggy.Parser, src, `Start`)
  if (parsed.status !== ParseStatus.Ok) return

  const seekDispatcher = new Dispatcher(logger, svgHolder, runNumber)
  try {
    seekDispatcher.start(parsed.ast)
    seekDispatcher.applyTimelineUpTo(t)
    const seekRunner = seekDispatcher.runTimelineFrom(t, statusCallback)
    controller.attach(seekDispatcher.totalDuration(), seekRunner, seekDispatcher.getAnimationRunner(), t)
  } catch (e) {
    if (e instanceof RTE) {
      // seek failed — leave display where it was
    } else {
      console.error(`jp seek error:`, e)
    }
  }
}

const controller = new PlaybackController(
  playBtn, restartBtn, scrubber, timeDisplay,
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

  const src = editorView.state.doc.toString()
  const parsed: ParseResult = parseToAST((<unknown>PEG) as Peggy.Parser, src, `Start`)

  if (parsed.status === ParseStatus.Ok) {
    errorArea.textContent = ``

    const dispatcher = new Dispatcher(logger, svgHolder, runNumber++)
    currentDispatcher = dispatcher

    try {
      const { output, stylesheets } = dispatcher.start(parsed.ast)
      lastOutput = output
      for (const shape of dispatcher.shapes()) shapeMap.set(shape.id, shape)
      renderResult(output)
      extraStyles.textContent = stylesheets.join(`\n`)

      const duration = dispatcher.totalDuration()

      // Pause animation runner before applying timeline to prevent auto-start
      const animRunner = dispatcher.getAnimationRunner()
      animRunner.pause()

      // Render shapes at t=0 without starting animations
      dispatcher.applyTimelineUpTo(0)

      // Compute viewBox from shape geometry. Use a preliminary viewBox
      // first so font-size in user units maps to reasonable pixels,
      // then measure with getBBox for accurate text bounds.
      svgHolder.setAttribute(`viewBox`, `0 0 10 7`)
      // Force a layout so the preliminary viewBox takes effect
      svgHolder.getBoundingClientRect()
      const bbox = svgHolder.getBBox()
      const pad = 0.2
      svgHolder.setAttribute(`viewBox`,
        `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`)

      if (duration > 0) {
        // Has animations — show controls bar, set up for playback
        const runner = dispatcher.runTimelineFrom(0, statusCallback)
        controller.attach(duration, runner, animRunner, 0)
      } else {
        // No animations — hide controls bar
        controlsBar.style.display = `none`
      }
    } catch (e) {
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
    const loc = (parsed.error as any).location
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

exampleSelector.addEventListener(`change`, async () => {
  const file = exampleSelector.value
  if (!file) return
  try {
    const resp = await fetch(`/examples/${file}`)
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
    const src = await resp.text()
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: src },
    })
    run()
  } catch (e) {
    errorArea.textContent = `Failed to load example: ${e}`
  }
  exampleSelector.value = ``
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

console.log(`mounting`)
mount(document.body, playpen)
editorView.focus()
if (savedSource) preview()
