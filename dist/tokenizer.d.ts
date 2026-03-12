import { type PToken, type Pik, type PMacro } from './types.ts';
export declare let findKeywordFn: (word: string, n: number) => {
    eType: number;
    eCode: number;
    eEdge: number;
} | null;
export declare let findClassFn: (name: string, n: number) => boolean;
export declare function setFindKeywordFn(fn: typeof findKeywordFn): void;
export declare function setFindClassFn(fn: typeof findClassFn): void;
/**
 * Return the length of the next token. Fill in token fields.
 * Port of pik_token_length() from pikchr.y lines 4807-5142.
 */
export declare function pikTokenLength(token: PToken, bAllowCodeBlock: boolean): number;
/**
 * TokenStream - wraps tokenization for the recursive descent parser.
 * Handles whitespace skipping, macro expansion, and lookahead.
 */
export declare class TokenStream {
    private p;
    private tokens;
    private pos;
    constructor(p: Pik);
    /** Tokenize input text and fill the token array, handling macros */
    tokenize(input: string): void;
    private _tokenizeInput;
    /** Peek at the current token without advancing */
    peek(): PToken;
    /** Peek at a token N positions ahead */
    peekAhead(n: number): PToken;
    /** Advance past the current token and return it */
    advance(): PToken;
    /** If current token matches eType, advance and return it; else return null */
    match(eType: number): PToken | null;
    /** Expect the current token to be eType. Error if not. */
    expect(eType: number, msg: string): PToken;
    /** Check if we're at end of statement (EOL, end of input, or ]) */
    atStatementEnd(): boolean;
    /** Check if at end of input */
    atEnd(): boolean;
    /** Get the last consumed token (for error reporting) */
    lastToken(): PToken;
    /** Save current position for backtracking */
    save(): number;
    /** Restore to a saved position */
    restore(saved: number): void;
    /**
     * Expand a macro and insert its tokens at the current position.
     * Called by the parser when it encounters a macro invocation.
     */
    expandMacro(pMac: PMacro, args: PToken[]): boolean;
    /**
     * Tokenize a macro body with parameter substitution.
     * Results are pushed to the output array.
     */
    private _tokenizeMacroBody;
    /**
     * Parse macro arguments from the token stream (for parser use).
     * Returns the argument tokens or null if no arguments present.
     */
    parseMacroArgs(): PToken[] | null;
    /**
     * Collect tokens in a range and create a pseudo-token for the argument.
     * This reconstructs the text representation for macro parameter substitution.
     */
    private _collectArgTokens;
}
/** Find a macro by name */
export declare function pikFindMacro(p: Pik, name: string): PMacro | null;
/** Parse macro arguments (arg1, arg2, ...) - port of pik_parse_macro_args */
export declare function pikParseMacroArgs(p: Pik, z: string, n: number, args: PToken[], pOuter: PToken[] | null): number;
/** Return the next non-whitespace token after pThis (for error messages) */
export declare function pikNextSemanticToken(z: string, offset: number): PToken;
//# sourceMappingURL=tokenizer.d.ts.map