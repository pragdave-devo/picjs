import { type PNum, type PToken, type Pik } from './types.ts';
export interface PikWord {
    zWord: string;
    nChar: number;
    eType: number;
    eCode: number;
    eEdge: number;
}
export declare const keywords: readonly PikWord[];
export declare function findKeyword(zIn: string, n: number): PikWord | null;
export declare const aColor: readonly {
    zName: string;
    val: number;
}[];
export declare function pikLookupColor(p: Pik | null, pId: PToken): number;
export declare function lookupColor(name: string): number;
export declare const aBuiltin: readonly {
    zName: string;
    val: PNum;
}[];
export declare function pikValue(p: Pik, z: string, n: number): {
    val: PNum;
    miss: boolean;
};
export declare function pikValueInt(p: Pik, z: string, n: number): {
    val: number;
    miss: boolean;
};
export declare function pikGetVar(p: Pik, pId: PToken): PNum;
export declare const awChar: readonly number[];
export declare function pikTextLength(pToken: PToken, isMonospace: boolean): number;
//# sourceMappingURL=constants.d.ts.map