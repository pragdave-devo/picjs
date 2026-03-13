// tokenizer.ts — Hand-written lexer for pikchr
// Ported from pikchr.y lines 4807-5317

import {
  type PToken, type Pik, type PMacro, type PNum,
  makeToken, pikError,
  TokenType, PIKCHR_TOKEN_LIMIT, MAX_CTX,
} from './types.ts';

// Forward declarations for functions from constants.ts
// These get wired in by the integration layer
export let findKeywordFn: (word: string, n: number) => { eType: number; eCode: number; eEdge: number } | null = () => null;
export let findClassFn: (name: string, n: number) => boolean = () => false;

export function setFindKeywordFn(fn: typeof findKeywordFn) { findKeywordFn = fn; }
export function setFindClassFn(fn: typeof findClassFn) { findClassFn = fn; }

const {
  T_WHITESPACE, T_ERROR, T_EOL, T_STRING, T_PLUS, T_MINUS, T_STAR,
  T_SLASH, T_PERCENT, T_LP, T_RP, T_LB, T_RB, T_COMMA, T_COLON,
  T_GT, T_LT, T_EQ, T_ASSIGN, T_RARROW, T_LARROW, T_LRARROW,
  T_NUMBER, T_NTH, T_CLASSNAME, T_ID, T_PLACENAME, T_PARAMETER,
  T_CODEBLOCK, T_DOT_E, T_DOT_XY, T_DOT_L, T_DOT_U,
  T_EDGEPT, T_START, T_END, T_X, T_Y, T_ISODATE,
} = TokenType;

function isUpper(c: string): boolean { return c >= 'A' && c <= 'Z'; }
function isLower(c: string): boolean { return c >= 'a' && c <= 'z'; }
function isDigit(c: string): boolean { return c >= '0' && c <= '9'; }
function isXDigit(c: string): boolean {
  return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
}
function isAlnum(c: string): boolean {
  return isDigit(c) || isUpper(c) || isLower(c);
}
function isSpace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\n';
}

/**
 * Return the length of the next token. Fill in token fields.
 * Port of pik_token_length() from pikchr.y lines 4807-5142.
 */
export function pikTokenLength(token: PToken, bAllowCodeBlock: boolean): number {
  const z = token.z;
  const n = z.length;
  if (n === 0) {
    token.eType = T_ERROR;
    return 0;
  }

  const c0 = z[0];

  switch (c0) {
    case '\\': {
      token.eType = T_WHITESPACE;
      let i = 1;
      while (i < n && (z[i] === '\r' || z[i] === ' ' || z[i] === '\t')) i++;
      if (i < n && z[i] === '\n') return i + 1;
      token.eType = T_ERROR;
      return 1;
    }

    case ';':
    case '\n': {
      token.eType = T_EOL;
      return 1;
    }

    case '"': {
      for (let i = 1; i < n; i++) {
        const c = z[i];
        if (c === '\\') {
          if (i + 1 >= n) break;
          i++;
          continue;
        }
        if (c === '"') {
          token.eType = T_STRING;
          return i + 1;
        }
      }
      token.eType = T_ERROR;
      return n;
    }

    case ' ':
    case '\t':
    case '\f':
    case '\r': {
      let i = 1;
      while (i < n) {
        const c = z[i];
        if (c !== ' ' && c !== '\t' && c !== '\r' && c !== '\f') break;
        i++;
      }
      token.eType = T_WHITESPACE;
      return i;
    }

    case '#': {
      let i = 1;
      while (i < n && z[i] !== '\n') i++;
      token.eType = T_WHITESPACE;
      return i;
    }

    case '/': {
      if (n > 1 && z[1] === '*') {
        let i = 2;
        while (i < n && !(z[i] === '*' && i + 1 < n && z[i + 1] === '/')) i++;
        if (i < n && z[i] === '*') {
          token.eType = T_WHITESPACE;
          return i + 2;
        } else {
          token.eType = T_ERROR;
          return i;
        }
      } else if (n > 1 && z[1] === '/') {
        let i = 2;
        while (i < n && z[i] !== '\n') i++;
        token.eType = T_WHITESPACE;
        return i;
      } else if (n > 1 && z[1] === '=') {
        token.eType = T_ASSIGN;
        token.eCode = T_SLASH;
        return 2;
      } else {
        token.eType = T_SLASH;
        return 1;
      }
    }

    case '+': {
      if (n > 1 && z[1] === '=') {
        token.eType = T_ASSIGN;
        token.eCode = T_PLUS;
        return 2;
      }
      token.eType = T_PLUS;
      return 1;
    }

    case '*': {
      if (n > 1 && z[1] === '=') {
        token.eType = T_ASSIGN;
        token.eCode = T_STAR;
        return 2;
      }
      token.eType = T_STAR;
      return 1;
    }

    case '%': { token.eType = T_PERCENT; return 1; }
    case '(': { token.eType = T_LP; return 1; }
    case ')': { token.eType = T_RP; return 1; }
    case '[': { token.eType = T_LB; return 1; }
    case ']': { token.eType = T_RB; return 1; }
    case ',': { token.eType = T_COMMA; return 1; }
    case ':': { token.eType = T_COLON; return 1; }
    case '>': { token.eType = T_GT; return 1; }

    case '=': {
      if (n > 1 && z[1] === '=') {
        token.eType = T_EQ;
        return 2;
      }
      token.eType = T_ASSIGN;
      token.eCode = T_ASSIGN;
      return 1;
    }

    case '-': {
      if (n > 1 && z[1] === '>') {
        token.eType = T_RARROW;
        return 2;
      } else if (n > 1 && z[1] === '=') {
        token.eType = T_ASSIGN;
        token.eCode = T_MINUS;
        return 2;
      } else {
        token.eType = T_MINUS;
        return 1;
      }
    }

    case '<': {
      if (n > 1 && z[1] === '-') {
        if (n > 2 && z[2] === '>') {
          token.eType = T_LRARROW;
          return 3;
        } else {
          token.eType = T_LARROW;
          return 2;
        }
      } else {
        token.eType = T_LT;
        return 1;
      }
    }

    case '{': {
      let i = 1;
      if (bAllowCodeBlock) {
        let depth = 1;
        while (i < n && depth > 0) {
          const x: PToken = makeToken(z.substring(i), n - i);
          const len = pikTokenLength(x, false);
          if (len === 1) {
            if (z[i] === '{') depth++;
            if (z[i] === '}') depth--;
          }
          i += len;
        }
        if (depth) {
          token.eType = T_ERROR;
          return 1;
        }
      } else {
        token.eType = T_ERROR;
        return 1;
      }
      token.eType = T_CODEBLOCK;
      return i;
    }

    case '&': {
      // HTML entity arrow shortcuts
      const entities = [
        { nByte: 6,  eCode: T_RARROW,  zEntity: '&rarr;' },
        { nByte: 12, eCode: T_RARROW,  zEntity: '&rightarrow;' },
        { nByte: 6,  eCode: T_LARROW,  zEntity: '&larr;' },
        { nByte: 11, eCode: T_LARROW,  zEntity: '&leftarrow;' },
        { nByte: 16, eCode: T_LRARROW, zEntity: '&leftrightarrow;' },
      ];
      for (const ent of entities) {
        if (z.startsWith(ent.zEntity)) {
          token.eType = ent.eCode;
          return ent.nByte;
        }
      }
      token.eType = T_ERROR;
      return 1;
    }

    default: {
      // UTF-8 arrow characters (← → ↔)
      if (c0 === '\u2190') { token.eType = T_LARROW; return 1; }
      if (c0 === '\u2192') { token.eType = T_RARROW; return 1; }
      if (c0 === '\u2194') { token.eType = T_LRARROW; return 1; }

      let c = c0;
      let i: number;

      // Dot handling
      if (c === '.') {
        if (n > 1 && isLower(z[1])) {
          // Dot followed by lowercase
          i = 2;
          while (i < n && z[i] >= 'a' && z[i] <= 'z') i++;
          const word = z.substring(1, i);
          const pFound = findKeywordFn(word, word.length);
          if (pFound && (pFound.eEdge > 0 ||
              pFound.eType === T_EDGEPT ||
              pFound.eType === T_START ||
              pFound.eType === T_END)) {
            token.eType = T_DOT_E;
          } else if (pFound && (pFound.eType === T_X || pFound.eType === T_Y)) {
            token.eType = T_DOT_XY;
          } else {
            token.eType = T_DOT_L;
          }
          return 1; // Only consume the dot itself
        } else if (n > 1 && isDigit(z[1])) {
          i = 0; // Fall through to number handling
        } else if (n > 1 && isUpper(z[1])) {
          i = 2;
          while (i < n && (isAlnum(z[i]) || z[i] === '_')) i++;
          token.eType = T_DOT_U;
          return 1; // Only consume the dot
        } else {
          token.eType = T_ERROR;
          return 1;
        }
      }

      // Number handling
      if ((c >= '0' && c <= '9') || c === '.') {
        let nDigit: number;
        let isInt = true;
        if (c !== '.') {
          nDigit = 1;
          i = 1;
          while (i < n && z[i] >= '0' && z[i] <= '9') { i++; nDigit++; }
          c = i < n ? z[i] : '';
          if (i === 1 && (c === 'x' || c === 'X')) {
            i = 2;
            while (i < n && isXDigit(z[i])) i++;
            token.eType = T_NUMBER;
            return i;
          }
        } else {
          isInt = false;
          nDigit = 0;
          i = 0;
          c = z[0];
        }
        if (i < n && z[i] === '.') {
          isInt = false;
          i++;
          while (i < n && z[i] >= '0' && z[i] <= '9') { i++; nDigit++; }
        }
        if (nDigit === 0) {
          token.eType = T_ERROR;
          return i;
        }
        c = i < n ? z[i] : '';
        if (c === 'e' || c === 'E') {
          const iBefore = i;
          i++;
          let c2 = i < n ? z[i] : '';
          if (c2 === '+' || c2 === '-') {
            i++;
            c2 = i < n ? z[i] : '';
          }
          if (c2 < '0' || c2 > '9') {
            i = iBefore;
          } else {
            i++;
            isInt = false;
            while (i < n && z[i] >= '0' && z[i] <= '9') i++;
          }
        }
        c = i < n ? z[i] : '';
        const c2 = (c && i + 1 < n) ? z[i + 1] : '';
        if (isInt) {
          if ((c === 't' && c2 === 'h') ||
              (c === 'r' && c2 === 'd') ||
              (c === 'n' && c2 === 'd') ||
              (c === 's' && c2 === 't')) {
            token.eType = T_NTH;
            return i + 2;
          }
        }
        if ((c === 'i' && c2 === 'n') ||
            (c === 'c' && c2 === 'm') ||
            (c === 'm' && c2 === 'm') ||
            (c === 'p' && c2 === 't') ||
            (c === 'p' && c2 === 'x') ||
            (c === 'p' && c2 === 'c')) {
          i += 2;
        }
        token.eType = T_NUMBER;
        return i;
      }

      // Lowercase identifier or keyword
      if (isLower(c)) {
        i = 1;
        while (i < n && (isAlnum(z[i]) || z[i] === '_')) i++;
        const word = z.substring(0, i);
        const pFound = findKeywordFn(word, i);
        if (pFound) {
          token.eType = pFound.eType;
          token.eCode = pFound.eCode;
          token.eEdge = pFound.eEdge;
          return i;
        }
        token.n = i;
        if (findClassFn(word, i)) {
          token.eType = T_CLASSNAME;
        } else {
          token.eType = T_ID;
        }
        return i;
      }

      // Uppercase identifier (PLACENAME / LABEL)
      if (c >= 'A' && c <= 'Z') {
        i = 1;
        while (i < n && (isAlnum(z[i]) || z[i] === '_')) i++;
        token.eType = T_PLACENAME;
        return i;
      }

      // Macro parameter $1..$9
      if (c === '$' && n > 1 && z[1] >= '1' && z[1] <= '9' &&
          !(n > 2 && isDigit(z[2]))) {
        token.eType = T_PARAMETER;
        token.eCode = z[1].charCodeAt(0) - '1'.charCodeAt(0);
        return 2;
      }

      // Variable names starting with _, $, @
      if (c === '_' || c === '$' || c === '@') {
        i = 1;
        while (i < n && (isAlnum(z[i]) || z[i] === '_')) i++;
        token.eType = T_ID;
        return i;
      }

      token.eType = T_ERROR;
      return 1;
    }
  }
}

/**
 * TokenStream - wraps tokenization for the recursive descent parser.
 * Handles whitespace skipping, macro expansion, and lookahead.
 */
export class TokenStream {
  private p: Pik;
  private tokens: PToken[] = [];
  private pos: number = 0;

  constructor(p: Pik) {
    this.p = p;
  }

  /** Tokenize input text and fill the token array, handling macros */
  tokenize(input: string): void {
    this.tokens = [];
    this.pos = 0;
    this._tokenizeInput({ z: input, n: input.length, eCode: 0, eType: 0, eEdge: 0 }, null);
  }

  private _tokenizeInput(pIn: PToken, aParam: PToken[] | null): void {
    const p = this.p;
    let i = 0;
    while (i < pIn.n && pIn.z[i] && p.nErr === 0) {
      const token: PToken = {
        z: pIn.z.substring(i),
        n: 0,
        eCode: 0,
        eType: 0,
        eEdge: 0,
      };
      const sz = pikTokenLength(token, true);
      if (token.eType === T_WHITESPACE) {
        i += sz;
        continue;
      }
      if (sz > 50000) {
        token.n = 1;
        pikError(p, token, 'token is too long - max length 50000 bytes');
        break;
      }
      if (token.eType === T_ERROR) {
        token.n = sz;
        pikError(p, token, 'unrecognized token');
        break;
      }
      if (sz + i > pIn.n) {
        token.n = pIn.n - i;
        pikError(p, token, 'syntax error');
        break;
      }
      token.n = sz;

      // Parameter substitution ($1..$9)
      if (token.eType === T_PARAMETER) {
        if (!aParam || aParam[token.eCode].n === 0) {
          i += sz;
          continue;
        }
        if (p.nCtx >= MAX_CTX) {
          pikError(p, token, 'macros nested too deep');
          break;
        }
        p.aCtx[p.nCtx++] = { ...token };
        this._tokenizeInput(aParam[token.eCode], null);
        p.nCtx--;
        if (p.nErr) break;
        i += sz;
        continue;
      }

      // Macro expansion
      if (token.eType === T_ID) {
        const macName = token.z.substring(0, token.n);
        const pMac = pikFindMacro(p, macName);
        if (pMac) {
          if (pMac.inUse) {
            pikError(p, pMac.macroName, 'recursive macro definition');
            break;
          }
          if (p.nCtx >= MAX_CTX) {
            pikError(p, token, 'macros nested too deep');
            break;
          }
          pMac.inUse = true;
          const args: PToken[] = new Array(9).fill(null).map(() => makeToken());
          p.aCtx[p.nCtx++] = { ...token };
          const j = i + sz;
          const argLen = pikParseMacroArgs(p, pIn.z.substring(j), pIn.n - j, args, aParam);
          this._tokenizeInput(pMac.macroBody, args);
          p.nCtx--;
          pMac.inUse = false;
          if (p.nErr) break;
          i = j + argLen;
          continue;
        }
      }

      // Regular token - check limit and add
      if (p.nToken++ > PIKCHR_TOKEN_LIMIT) {
        pikError(p, token, 'script is too complex');
        break;
      }

      // Handle ISODATE token
      if (token.eType === T_ISODATE) {
        token.z = '"pikchr"';
        token.n = 8;
        token.eType = T_STRING;
      }

      // Store the original source position info
      this.tokens.push({ ...token });
      i += sz;
    }
  }

  /** Peek at the current token without advancing.
   *  If the current token is a macro invocation, expand it first (unless expandMacros=false).
   */
  peek(expandMacros: boolean = true): PToken {
    // Loop to handle chained macro expansions
    while (this.pos < this.tokens.length) {
      const t = this.tokens[this.pos];

      // Check for macro expansion: if current token is T_ID matching a macro,
      // expand it. This handles macros defined earlier in the same input.
      if (expandMacros && t.eType === T_ID) {
        const macName = t.z.substring(0, t.n);
        const pMac = pikFindMacro(this.p, macName);
        if (pMac) {
          // Remove the macro name token
          this.tokens.splice(this.pos, 1);
          // Parse macro arguments from the token stream
          const args = this.parseMacroArgs() || new Array(9).fill(null).map(() => makeToken());
          // Expand the macro (inserts tokens at current position)
          this.expandMacro(pMac, args);
          // Loop again to handle nested macro or return first token
          continue;
        }
      }

      return t;
    }

    return makeToken('', 0, T_EOL);
  }

  /** Peek at the current token without expanding macros */
  peekRaw(): PToken {
    return this.peek(false);
  }

  /** Peek at a token N positions ahead */
  peekAhead(n: number): PToken {
    const idx = this.pos + n;
    if (idx >= this.tokens.length) {
      return makeToken('', 0, T_EOL);
    }
    return this.tokens[idx];
  }

  /** Advance past the current token and return it */
  advance(): PToken {
    if (this.pos >= this.tokens.length) {
      return makeToken('', 0, T_EOL);
    }
    return this.tokens[this.pos++];
  }

  /** If current token matches eType, advance and return it; else return null */
  match(eType: number): PToken | null {
    if (this.pos >= this.tokens.length) return null;
    const t = this.tokens[this.pos];
    if (t.eType === eType) {
      this.pos++;
      return t;
    }
    return null;
  }

  /** Expect the current token to be eType. Error if not. */
  expect(eType: number, msg: string): PToken {
    const t = this.peek();
    if (t.eType === eType) {
      return this.advance();
    }
    pikError(this.p, t.n > 0 ? t : this.lastToken(), msg);
    return t;
  }

  /** Expect the current token to be eType without macro expansion. Error if not. */
  expectRaw(eType: number, msg: string): PToken {
    const t = this.peekRaw();
    if (t.eType === eType) {
      return this.advance();
    }
    pikError(this.p, t.n > 0 ? t : this.lastToken(), msg);
    return t;
  }

  /** Check if we're at end of statement (EOL, end of input, or ]) */
  atStatementEnd(): boolean {
    const t = this.peek();
    return t.eType === T_EOL || this.pos >= this.tokens.length || t.eType === TokenType.T_RB;
  }

  /** Check if at end of input */
  atEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  /** Get the last consumed token (for error reporting) */
  lastToken(): PToken {
    if (this.pos > 0 && this.pos <= this.tokens.length) {
      return this.tokens[this.pos - 1];
    }
    return makeToken('', 0, T_EOL);
  }

  /** Save current position for backtracking */
  save(): number {
    return this.pos;
  }

  /** Restore to a saved position */
  restore(saved: number): void {
    this.pos = saved;
  }

  /**
   * Expand a macro and insert its tokens at the current position.
   * Called by the parser when it encounters a macro invocation.
   */
  expandMacro(pMac: PMacro, args: PToken[]): boolean {
    const p = this.p;
    if (pMac.inUse) {
      pikError(p, pMac.macroName, 'recursive macro definition');
      return false;
    }
    if (p.nCtx >= MAX_CTX) {
      pikError(p, pMac.macroName, 'macros nested too deep');
      return false;
    }

    pMac.inUse = true;
    p.aCtx[p.nCtx++] = { ...pMac.macroName };

    // Tokenize the macro body into a temporary array
    const expandedTokens: PToken[] = [];
    this._tokenizeMacroBody(pMac.macroBody, args, expandedTokens);

    p.nCtx--;
    pMac.inUse = false;

    if (p.nErr) return false;

    // Insert expanded tokens at current position
    this.tokens.splice(this.pos, 0, ...expandedTokens);
    return true;
  }

  /**
   * Tokenize a macro body with parameter substitution.
   * Results are pushed to the output array.
   */
  private _tokenizeMacroBody(pIn: PToken, aParam: PToken[] | null, out: PToken[]): void {
    const p = this.p;
    let i = 0;
    while (i < pIn.n && pIn.z[i] && p.nErr === 0) {
      const token: PToken = {
        z: pIn.z.substring(i),
        n: 0,
        eCode: 0,
        eType: 0,
        eEdge: 0,
      };
      const sz = pikTokenLength(token, true);
      if (token.eType === T_WHITESPACE) {
        i += sz;
        continue;
      }
      if (sz > 50000) {
        token.n = 1;
        pikError(p, token, 'token is too long - max length 50000 bytes');
        break;
      }
      if (token.eType === T_ERROR) {
        token.n = sz;
        pikError(p, token, 'unrecognized token');
        break;
      }
      if (sz + i > pIn.n) {
        token.n = pIn.n - i;
        pikError(p, token, 'syntax error');
        break;
      }
      token.n = sz;

      // Parameter substitution ($1..$9)
      if (token.eType === T_PARAMETER) {
        if (aParam && aParam[token.eCode].n > 0) {
          if (p.nCtx >= MAX_CTX) {
            pikError(p, token, 'macros nested too deep');
            break;
          }
          p.aCtx[p.nCtx++] = { ...token };
          this._tokenizeMacroBody(aParam[token.eCode], null, out);
          p.nCtx--;
          if (p.nErr) break;
        }
        i += sz;
        continue;
      }

      // Check for nested macro expansion
      if (token.eType === T_ID) {
        const macName = token.z.substring(0, token.n);
        const nestedMac = pikFindMacro(p, macName);
        if (nestedMac) {
          if (nestedMac.inUse) {
            pikError(p, nestedMac.macroName, 'recursive macro definition');
            break;
          }
          if (p.nCtx >= MAX_CTX) {
            pikError(p, token, 'macros nested too deep');
            break;
          }
          nestedMac.inUse = true;
          const nestedArgs: PToken[] = new Array(9).fill(null).map(() => makeToken());
          p.aCtx[p.nCtx++] = { ...token };
          const j = i + sz;
          const argLen = pikParseMacroArgs(p, pIn.z.substring(j), pIn.n - j, nestedArgs, aParam);
          this._tokenizeMacroBody(nestedMac.macroBody, nestedArgs, out);
          p.nCtx--;
          nestedMac.inUse = false;
          if (p.nErr) break;
          i = j + argLen;
          continue;
        }
      }

      // Regular token - check limit and add
      if (p.nToken++ > PIKCHR_TOKEN_LIMIT) {
        pikError(p, token, 'script is too complex');
        break;
      }

      // Handle ISODATE token
      if (token.eType === T_ISODATE) {
        token.z = '"pikchr"';
        token.n = 8;
        token.eType = T_STRING;
      }

      out.push({ ...token });
      i += sz;
    }
  }

  /**
   * Parse macro arguments from the token stream (for parser use).
   * Returns the argument tokens or null if no arguments present.
   */
  parseMacroArgs(): PToken[] | null {
    // Check if next token is LP
    if (this.pos >= this.tokens.length || this.tokens[this.pos].eType !== T_LP) {
      return null;
    }

    // We have arguments - need to collect them from the token stream
    // The parser has already tokenized everything, so we need to reassemble
    // the argument text from tokens between ( and )
    const args: PToken[] = new Array(9).fill(null).map(() => makeToken());
    let nArg = 0;
    let depth = 0;
    let argStart = this.pos + 1; // skip LP

    this.pos++; // consume LP

    while (this.pos < this.tokens.length) {
      const t = this.tokens[this.pos];

      if (t.eType === T_RP && depth === 0) {
        // End of arguments - capture last arg
        args[nArg] = this._collectArgTokens(argStart, this.pos);
        this.pos++; // consume RP
        return args;
      }

      if (t.eType === T_COMMA && depth === 0) {
        // Argument separator
        args[nArg] = this._collectArgTokens(argStart, this.pos);
        nArg++;
        if (nArg >= 9) {
          pikError(this.p, t, 'too many macro arguments - max 9');
          return null;
        }
        this.pos++; // consume comma
        argStart = this.pos;
        continue;
      }

      if (t.eType === T_LP || t.eType === T_LB) depth++;
      if (t.eType === T_RP || t.eType === T_RB) depth--;

      this.pos++;
    }

    // Unterminated
    pikError(this.p, this.tokens[argStart] || makeToken(), 'unterminated macro argument list');
    return null;
  }

  /**
   * Collect tokens in a range and create a pseudo-token for the argument.
   * This reconstructs the text representation for macro parameter substitution.
   */
  private _collectArgTokens(start: number, end: number): PToken {
    if (start >= end) {
      return makeToken();
    }
    // Reconstruct text from tokens
    const parts: string[] = [];
    for (let i = start; i < end; i++) {
      parts.push(this.tokens[i].z.substring(0, this.tokens[i].n));
    }
    const text = parts.join(' ');
    return { z: text, n: text.length, eType: 0, eCode: 0, eEdge: 0 };
  }
}

/** Find a macro by name */
export function pikFindMacro(p: Pik, name: string): PMacro | null {
  let pMac = p.pMacros;
  while (pMac) {
    const macName = pMac.macroName.z.substring(0, pMac.macroName.n);
    if (macName === name) return pMac;
    pMac = pMac.pNext;
  }
  return null;
}

/** Parse macro arguments (arg1, arg2, ...) - port of pik_parse_macro_args */
export function pikParseMacroArgs(
  p: Pik,
  z: string,
  n: number,
  args: PToken[],
  pOuter: PToken[] | null
): number {
  if (n === 0 || z[0] !== '(') return 0;
  let nArg = 0;
  let iStart = 1;
  let depth = 0;

  args[0].z = z.substring(1);
  let i: number;
  for (i = 1; i < n && z[i] !== ')'; ) {
    const x: PToken = makeToken(z.substring(i), n - i);
    const sz = pikTokenLength(x, false);
    if (sz === 1) {
      if (z[i] === ',' && depth <= 0) {
        args[nArg].n = i - iStart;
        if (nArg === 8) {
          const errTok = makeToken(z, 1);
          pikError(p, errTok, 'too many macro arguments - max 9');
          return 0;
        }
        nArg++;
        args[nArg].z = z.substring(i + 1);
        iStart = i + 1;
        depth = 0;
      } else if (z[i] === '(' || z[i] === '{' || z[i] === '[') {
        depth++;
      } else if (z[i] === ')' || z[i] === '}' || z[i] === ']') {
        depth--;
      }
    }
    i += sz;
  }

  if (i < n && z[i] === ')') {
    args[nArg].n = i - iStart;
    // Trim whitespace and handle $N parameter pass-through
    for (let j = 0; j <= nArg; j++) {
      const t = args[j];
      let tz = t.z;
      let tn = t.n;
      while (tn > 0 && isSpace(tz[0])) { tn--; tz = tz.substring(1); }
      while (tn > 0 && isSpace(tz[tn - 1])) { tn--; }
      t.z = tz;
      t.n = tn;
      if (tn === 2 && tz[0] === '$' && tz[1] >= '1' && tz[1] <= '9') {
        const idx = tz.charCodeAt(1) - '1'.charCodeAt(0);
        if (pOuter) {
          args[j] = { ...pOuter[idx] };
        } else {
          t.n = 0;
        }
      }
    }
    return i + 1;
  }

  const errTok = makeToken(z, 1);
  pikError(p, errTok, 'unterminated macro argument list');
  return 0;
}

/** Return the next non-whitespace token after pThis (for error messages) */
export function pikNextSemanticToken(z: string, offset: number): PToken {
  let i = offset;
  while (true) {
    const x: PToken = makeToken(z.substring(i), z.length - i);
    const sz = pikTokenLength(x, true);
    if (x.eType !== T_WHITESPACE) {
      x.n = sz;
      return x;
    }
    i += sz;
  }
}
