import { PNum, PPoint, PBox, PToken, PClass, PObj, Pik } from './types.ts';
export declare let pikValueFn: (p: Pik, name: string) => number;
export declare function setPikValueFn(fn: (p: Pik, name: string) => number): void;
export declare let pikAppendStyleFn: (p: Pik, pObj: PObj, eFill: number) => void;
export declare function setPikAppendStyleFn(fn: (p: Pik, pObj: PObj, eFill: number) => void): void;
export declare let pikAppendTxtFn: (p: Pik, pObj: PObj, pBox: PBox | null) => void;
export declare function setPikAppendTxtFn(fn: (p: Pik, pObj: PObj, pBox: PBox | null) => void): void;
export declare let pikSizeToFitFn: (p: Pik, pObj: PObj, pFit: PToken, eWhich: number) => void;
export declare function setPikSizeToFitFn(fn: (p: Pik, pObj: PObj, pFit: PToken, eWhich: number) => void): void;
/**
 * Reduce the length of the line segment by amt (if possible) by
 * modifying the location of t.
 * Ported from pikchr.y lines 1958-1970.
 */
export declare function pikChop(f: PPoint, t: PPoint, amt: PNum): void;
/**
 * Draw an arrowhead on the end of the line segment from pFrom to pTo.
 * Also shorten the line segment so the shaft doesn't extend into the arrowhead.
 * Ported from pikchr.y lines 1977-2004.
 */
export declare function pikDrawArrowhead(p: Pik, f: PPoint, t: PPoint, pObj: PObj): void;
export declare function arcInit(p: Pik, pObj: PObj): void;
export declare const aClass: PClass[];
export declare const sublistClass: PClass;
export declare const noopClass: PClass;
//# sourceMappingURL=shapes.d.ts.map