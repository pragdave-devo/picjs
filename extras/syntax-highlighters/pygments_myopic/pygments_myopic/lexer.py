from pygments.lexer import RegexLexer, words
from pygments.token import *

import re


class PicjsLexer(RegexLexer):
    name = 'PicJS'
    aliases = ['picjs', 'jp']
    filenames = ['*.picjs', '*.jp']
    flags = re.M | re.X

    shapes = (words((
          'Arc',
          'Aside',
          'Box',
          'Circle',
          'Ellipse',
          'Gap',
          'Goto',
          'Group',
          'Line',
          'Label',
          'Oval',
          'Shape',
          'Skip',
          'arc',
          'box',
          'circle',
          'ellipse',
          'line',
          'oval',
          ), suffix=r'\b'), Name.Builtin)

    commands = (words((
        'Face',
        ), suffix=r'\b'), Name.Builtin)

    animators = (words((
        'draw',
        'move',
        'pause',
        'rotate',
        'set',
        'then',
        ), suffix=r'\b'), Name.Function.Magic)

    attribute_names = (words((
               'above',
               'align',
               'at',
               'behind',
               'below',
               'ccw',
               'close',
               'curve',
               'curved',
               'cw',
               'dashed',
               'dotted',
               'ease',
               'fill',
               'fit',
               'font',
               'font_family',
               'font_size',
               'font_stretch',
               'font_style',
               'font_variant',
               'font_weight',
               'from',
               'height',
               'ht',
               'inside',
               'len',
               'length',
               'line_height',
               'maxwidth',
               'nodraw',
               'opacity',
               'outside',
               'r',
               'rad',
               'radius',
               'rotation',
               'rot',
               'rx',
               'ry',
               'same',
               'smooth',
               'solid',
               'step',
               'stepped',
               'straight',
               'stroke',
               'stroke_width',
               'take',
               'thick',
               'thickness',
               'to',
               'turn',
               'wid',
               'width',
               'with',
               'x',
               'y',
              ), prefix=r'(\.|\b)', suffix=r'\b'), Name.Attribute)

    directions = (words((
               'north', 'northeast', 'northwest',
               'south', 'southeast', 'southwest',
               'east', 'west',
               'up', 'down', 'left', 'right',
              ), suffix=r'\b'), Keyword.Pseudo)

    cardinals = (words((
                  'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'c'
                ), prefix=r'\.', suffix=r'\b'), Name.Attribute)

    waypoints = (words((
               'about', 'until', 'even', 'level', 'each', 'by',
              ), suffix=r'\b'), Keyword.Pseudo)

    tokens = {
        'root': [
            (r'\n', Whitespace),
            (r'\s+', Whitespace),
            (r'//(.*?)\n', Comment.Single),

            shapes,
            commands,
            animators,
            waypoints,
            attribute_names,
            directions,
            cardinals,

            (r'\?\?', Name.Label),
            (r'@@', Name.Label),
            (r'@', Name.Property),
            (r'\$[a-zA-Z_][a-zA-Z0-9_]*', Name.Variable),
            (r'\bself\b', Name.Variable),
            (r'(true|false)\b', Keyword.Constant),
            (r'(if|else)\b', Keyword),

            (r'[0-9]*\.[0-9]+[eE]-?[0-9]+%?', Number.Float),
            (r'[0-9]*\.[0-9]+%?', Number.Float),
            (r'[0-9]+[eE]-?[0-9]+%?', Number.Float),
            (r'[0-9]+%?', Number.Integer),

            (r'"""', String.Double, 'triple_double'),
            (r"'''", String.Single, 'triple_single'),
            (r'"', String.Double, 'double_string'),
            (r"'", String.Single, 'single_string'),

            (r'[{}()\[\],.]', Punctuation),
            (r'=>', Keyword.Declaration),
            (r'&&|\|\|', Operator),
            (r'\.\.', Operator),
            (r'[=!<>]=', Operator),
            (r'[+\-*/&|<>^!=]', Operator),

            (r'\#[0-9A-Fa-f]{3,8}', Name.Property),
            (r'~[a-zA-Z][a-zA-Z0-9]*', Name.Property),
            (r'\b(oklch|rgb|hsl|hsv)a?\b', Name.Property),
        ],
        'double_string': [
            (r'#\{', String.Interpol, 'interpolation'),
            (r'\\[bfnrtv\\"#]', String.Escape),
            (r'[^"\\#]+', String.Double),
            (r'#', String.Double),
            (r'"', String.Double, '#pop'),
        ],
        'single_string': [
            (r"\\[bfnrtv\\']", String.Escape),
            (r"[^'\\]+", String.Single),
            (r"'", String.Single, '#pop'),
        ],
        'triple_double': [
            (r'#\{', String.Interpol, 'interpolation'),
            (r'\\[bfnrtv\\"#]', String.Escape),
            (r'"""', String.Double, '#pop'),
            (r'[^"\\#]+', String.Double),
            (r'#', String.Double),
            (r'"', String.Double),
        ],
        'triple_single': [
            (r"\\[bfnrtv\\']", String.Escape),
            (r"'''", String.Single, '#pop'),
            (r"[^'\\]+", String.Single),
            (r"'", String.Single),
        ],
        'interpolation': [
            (r'\}', String.Interpol, '#pop'),
            (r'[^}]+', String.Interpol),
        ],
    }
