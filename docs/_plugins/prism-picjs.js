export default function definePicjs(Prism) {
  Prism.languages.picjs = {
    comment: [
      { pattern: /\/\/.*/, greedy: true },
      { pattern: /\/\*[\s\S]*?\*\//, greedy: true },
    ],

    string: [
      { pattern: /"""[\s\S]*?"""/, greedy: true },
      {
        pattern: /"(?:[^"\\]|\\.)*"/,
        greedy: true,
        inside: {
          interpolation: {
            pattern: /#\{[^}]*\}/,
            inside: {
              punctuation: /^#\{|\}$/,
              expression: { pattern: /[\s\S]+/, alias: "variable" },
            },
          },
        },
      },
    ],

    color: /~[a-zA-Z]\w*(?:\.\w+(?:\([^)]*\))?)*/,

    number: /\b\d+(?:\.\d+)?\b/,

    keyword: /\b(?:if|else|case|for|in|fn|define|yes|no|true|false|and|or|not|same|from|to|then|with|at|behind|above|below|inside|outside|close|about|by)\b/,

    shape: /\b(?:[Aa]rc|[Bb]ox|[Cc]ircle|[Ee]llipse|[Oo]val|[Ll]ine|[Ll]abel|[Gg]roup|[Ss]kip|[Aa]side|[Pp]oint)\b/,

    command: /\b(?:[Ff]ace|[Gg]ap|[Gg]oto|[Pp]alette|move|take|ease)\b/,

    attribute: /\b(?:fill|stroke|stroke_width|thickness|thick|width|wid|height|ht|radius|rad|rx|ry|rotation|opacity|dashed|dotted|solid|straight|smooth|stepped|length|align|fit|maxwidth|font|font_family|font_size|font_style|font_weight|font_variant|font_stretch|line_height|containing|con)\b/,

    builtin: /\b(?:sin|cos|tan|asin|acos|atan|atan2|sqrt|abs|max|min|d2r|r2d|len|head|last|push|pop|shift|unshift|reverse|contains|join|split|map|filter|sort|each|steps|print)\b/,

    "class-name": /\.\w+(?=\s*\{|\s*$)/,

    arrow: /<->|=>|->|<-/,

    cardinal: /\b(?:[ns][ew]?|[ew]|[c])\b(?=\s)/,

    variable: /\$\w+/,

    operator: /[+\-*\/]=?|==|!=|>=?|<=?|\.\./,

    punctuation: /[{}()\[\],;.]/,
  }
}
