export default function definePicjs(Prism) {
  Prism.languages.picjs = {
    comment: [
      { pattern: /\/\/.*/, greedy: true },
    ],

    string: [
      { pattern: /"""[\s\S]*?"""/, greedy: true },
      { pattern: /'''[\s\S]*?'''/, greedy: true },
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
      { pattern: /'(?:[^'\\]|\\.)*'/, greedy: true },
    ],

    color: /~[a-zA-Z]\w*(?:\.\w+(?:\([^)]*\))?)*/,

    number: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?%?\b/,

    animation: /\b(?:draw|move|pause|rotate|set|then)\b/,

    keyword: /\b(?:if|else|true|false|same|from|to|with|at|behind|above|below|inside|outside|close|about|by|until|even|level)\b/,

    shape: /\b(?:Arc|Aside|Box|Circle|Ellipse|Gap|Goto|Group|Line|Label|Oval|Shape|Skip|arc|box|circle|ellipse|line|oval)\b/,

    command: /\b(?:Face|Palette)\b/,

    attribute: /\b(?:fill|stroke|stroke_width|thickness|thick|width|wid|height|ht|radius|rad|rx|ry|rotation|rot|opacity|dashed|dotted|solid|straight|smooth|stepped|step|curved|curve|length|len|align|fit|maxwidth|nodraw|font|font_family|font_size|font_style|font_weight|font_variant|font_stretch|line_height|cw|ccw|turn|take|ease)\b/,

    builtin: /\b(?:sin|cos|tan|asin|acos|atan2|polar|d2r|r2d|ln|log10|push|pop|map|filter|sort|has|length)\b/,

    direction: /\b(?:north|northeast|northwest|south|southeast|southwest|east|west|up|down|left|right)\b/,

    cardinal: /\b(?:[ns][ew]?|[ew]|c)\b(?=\s)/,

    variable: /\$\w+/,

    self: /\bself\b/,

    inspect: /\?\?|@@/,

    arrow: /<->|=>|->|<-|<~|~>|--|~~/,

    operator: /[+\-*/%^]=?|[=!<>]=|&&|\|\||\.\.|\!/,

    hexcolor: /#[0-9A-Fa-f]{3,8}\b/,

    punctuation: /[{}()\[\],;.@]/,
  }
}
