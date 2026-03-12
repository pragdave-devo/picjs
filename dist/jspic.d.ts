import { type Pik, type PList } from './types.ts';
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
export declare function jspic(text: string, options?: JspicOptions): JspicResult;
/**
 * Find all matching `<code>` elements and replace them with rendered SVG.
 * Default selector: 'code.jspic, pre > code.language-jspic'
 */
export declare function processCodeBlocks(selector?: string): void;
export { jspic as pikchr };
export type { JspicResult as PikchrResult, JspicOptions as PikchrOptions };
export type { Pik, PList };
//# sourceMappingURL=jspic.d.ts.map