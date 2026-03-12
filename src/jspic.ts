// jspic.ts — Public API + Mermaid-style browser code block processor
// Native TypeScript implementation of PIC-like diagram language to SVG.

import {
  type Pik, type PList,
  DIR_RIGHT, PIKCHR_PLAINTEXT_ERRORS, PIKCHR_DARK_MODE,
  createPik,
} from './types.ts';

import { pikValue, pikLookupColor, findKeyword } from './constants.ts';
import { setFindKeywordFn, setFindClassFn } from './tokenizer.ts';
import {
  setShapeClasses, setAppendTxtFn,
  pikFindClass, pikSizeToFit,
} from './layout.ts';
import {
  aClass, sublistClass, noopClass, arcInit,
  setPikValueFn, setPikAppendStyleFn, setPikAppendTxtFn, setPikSizeToFitFn,
} from './shapes.ts';
import { pikAppendStyle, pikAppendTxt, pikRender } from './renderer.ts';
import { pikParse } from './parser.ts';

// Lazy-init flag
let _initialized = false;

function ensureInit(): void {
  if (_initialized) return;
  _initialized = true;

  // Wire up forward declarations between modules

  // tokenizer needs keyword lookup and class check
  setFindKeywordFn((word: string, n: number) => {
    const result = findKeyword(word, n);
    if (!result) return null;
    return { eType: result.eType, eCode: result.eCode, eEdge: result.eEdge };
  });
  setFindClassFn((name: string, n: number) => {
    const tok = { z: name, n, eType: 0, eCode: 0, eEdge: 0 };
    return pikFindClass(tok) !== null;
  });

  // layout needs shape classes
  setShapeClasses(aClass, sublistClass, noopClass, arcInit);

  // layout needs appendTxt for size-to-fit
  setAppendTxtFn(pikAppendTxt);

  // shapes needs pikValue, appendStyle, appendTxt, sizeToFit
  setPikValueFn((p: Pik, name: string) => {
    return pikValue(p, name, name.length).val;
  });
  setPikAppendStyleFn(pikAppendStyle);
  setPikAppendTxtFn(pikAppendTxt);
  setPikSizeToFitFn(pikSizeToFit);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface JspicResult {
  svg: string;
  width: number;
  height: number;
  isError: boolean;
}

export interface JspicOptions {
  cssClass?: string;
  darkMode?: boolean;
  plaintextErrors?: boolean;
}

/**
 * Compile PIC-like source text into SVG.
 */
export function jspic(text: string, options?: JspicOptions): JspicResult {
  ensureInit();

  const p = createPik();
  p.sIn = { z: text, n: text.length, eType: 0, eCode: 0, eEdge: 0 };
  p.eDir = DIR_RIGHT;
  p.zClass = options?.cssClass || null;
  let mFlags = 0;
  if (options?.darkMode) mFlags |= PIKCHR_DARK_MODE;
  if (options?.plaintextErrors) mFlags |= PIKCHR_PLAINTEXT_ERRORS;
  p.mFlags = mFlags;

  const pList = pikParse(p, text);

  if (p.nErr === 0 && pList) {
    pikRender(p, pList);
  }

  if (!p.zOut && p.nErr === 0) {
    p.zOut = '<!-- empty jspic diagram -->\n';
  }

  return {
    svg: p.zOut,
    width: p.nErr ? -1 : p.wSVG,
    height: p.nErr ? -1 : p.hSVG,
    isError: p.nErr > 0,
  };
}

// ---------------------------------------------------------------------------
// Mermaid-style code block processor
// ---------------------------------------------------------------------------

/**
 * Find all matching `<code>` elements and replace them with rendered SVG.
 * Default selector: 'code.jspic, pre > code.language-jspic'
 */
export function processCodeBlocks(selector?: string): void {
  if (typeof document === 'undefined') return;
  const sel = selector || 'code.jspic, pre > code.language-jspic';
  const elements = document.querySelectorAll(sel);
  elements.forEach((el) => {
    const text = el.textContent || '';
    const result = jspic(text);
    const container = document.createElement('div');
    container.className = 'jspic-container';
    container.innerHTML = result.svg;
    const parent = el.parentElement;
    if (parent && parent.tagName === 'PRE') {
      parent.replaceWith(container);
    } else {
      el.replaceWith(container);
    }
  });
}

// Backwards compatibility alias
export { jspic as pikchr };
export type { JspicResult as PikchrResult, JspicOptions as PikchrOptions };

// Re-export key types
export type { Pik, PList };
