import { StreamLanguage } from "@codemirror/language"
import { tags } from "@lezer/highlight"

const shapes      = new Set(["Box","Circle","Line","Arc","Label","Ellipse","Oval","Face","Skip"])
const animVerbs   = new Set(["move","rotate","set"])
const controlKw   = new Set(["if","else","then","when","true","false"])
const attrKw      = new Set([
  "take","to","from","at","by","about","fill","dashed","dotted","ease",
  "font","align","wait","over","above","below","left","right",
  "width","height","color","opacity","stroke","shadow","start","end",
])

// Cardinals: .n .s .e .w .c .nw .ne .sw .se
const CARDINAL_RE = /^\.(nw|ne|sw|se|[nsewc])(?![A-Za-z0-9_])/

export const jpLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null

    // Line comments
    if (stream.match("//")) {
      stream.skipToEnd()
      return "lineComment"
    }

    // @@ before @ — both are time-related animation primitives
    if (stream.match("@@") || stream.match("@")) return "animTime"

    // Strings
    const q = stream.peek()
    if (q === `"` || q === `'`) {
      stream.next()
      while (!stream.eol()) {
        const ch = stream.next()
        if (ch === `\\`) stream.next()   // skip escape
        else if (ch === q) break
      }
      return "string"
    }

    // Hex colours  #rrggbb / #rgb
    if (stream.peek() === `#`) {
      if (stream.match(/^#[0-9a-fA-F]{3,8}/)) return "color"
      stream.next()
      return null
    }

    // Numbers (integers and decimals, no leading minus — that's an operator)
    if (stream.match(/^\d+(\.\d+)?/)) return "number"

    // Cardinal access  .n  .se  etc.
    if (stream.peek() === `.` && stream.match(CARDINAL_RE)) return "cardinal"

    // → arrow and × multiplication
    if (stream.match("->") || stream.match("×")) return "operator"

    // Words — keywords and identifiers
    const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)
    if (word) {
      const w = word[0]
      if (shapes.has(w))    return "shapeName"
      if (animVerbs.has(w)) return "animVerb"
      if (controlKw.has(w)) return "controlKw"
      if (attrKw.has(w))    return "attrKw"
      return null           // plain identifier
    }

    // Operators: arithmetic, comparison, assignment
    if (stream.match(/^[+\-*\/=<>!%^&|~]+/)) return "operator"

    // Consume one unrecognised character
    stream.next()
    return null
  },

  tokenTable: {
    lineComment: tags.lineComment,
    shapeName:   tags.typeName,
    animVerb:    tags.function(tags.variableName),
    animTime:    tags.function(tags.variableName),
    controlKw:   tags.controlKeyword,
    attrKw:      tags.modifier,
    cardinal:    tags.propertyName,
    operator:    tags.operator,
    string:      tags.string,
    number:      tags.number,
    color:       tags.color,
  },
})
