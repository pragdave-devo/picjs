from pygments.lexer import RegexLexer, words
from pygments.token import *

import re

       # Text:                          foreground,
       #  Escape:                        cyan,
       #  Error:                         red,

       #  Keyword:                       violet,
       #  Keyword.Constant:              cyan,
       #  Keyword.Declaration:           violet,
       #  Keyword.Namespace:             'italic ' + cyan,
       #  Keyword.Pseudo:                cyan,
       #  Keyword.Type:                  violet,

       #  Name:                          foreground,
       #  Name.Attribute:                violet,
       #  Name.Builtin:                  blue,
       #  Name.Builtin.Pseudo:           cyan,
       #  Name.Class:                    yellow,
       #  Name.Constant:                 foreground,
       #  Name.Decorator:                blue,
       #  Name.Entity:                   cyan,
       #  Name.Exception:                yellow,
       #  Name.Function:                 blue,
       #  Name.Function.Magic:           blue,
       #  Name.Label:                    blue,
       #  Name.Property:                 yellow,
       #  Name.Namespace:                yellow,
       #  Name.Other:                    foreground,
       #  Name.Tag:                      red,
       #  Name.Variable:                 cyan,
       #  Name.Variable.Class:           cyan,
       #  Name.Variable.Global:          cyan,
       #  Name.Variable.Instance:        cyan,
       #  Name.Variable.Magic:           blue,

       #  Literal:                       green,
       #  Literal.Date:                  green,

       #  String:                        green,
       #  String.Affix:                  violet,
       #  String.Backtick:               green,
       #  String.Char:                   green,
       #  String.Delimiter:              foreground,
       #  String.Doc:                    'italic ' + faded,
       #  String.Double:                 green,
       #  String.Escape:                 foreground,
       #  String.Heredoc:                green,
       #  String.Interpol:               cyan,
       #  String.Other:                  green,
       #  String.Regex:                  cyan,
       #  String.Single:                 green,
       #  String.Symbol:                 cyan,

       #  Number:                        orange,

       #  Operator:                      cyan,
       #  Operator.Word:                 'italic ' + cyan,

       #  Punctuation:                   cyan,

       #  Comment:                       'italic ' + faded,

       #  Generic:                       foreground,
       #  Generic.Deleted:               red,
       #  Generic.Emph:                  cyan,
       #  Generic.Error:                 red,
       #  Generic.Heading:               green,
       #  Generic.Inserted:              green,
       #  Generic.Output:                faded,
       #  Generic.Prompt:                yellow,
       #  Generic.Strong:                red,
       #  Generic.Subheading:            cyan,
       #  Generic.Traceback:             red,
    # }




class MyopicLexer(RegexLexer):
    name = 'Myopic'
    aliases = ['myopic']
    filenames = ['*.myopic', '*.pic']
    flags = re.M | re.X

    shapes = (words((
          'Arc',
          'Box',
          'Circle',
          'Ellipse',
          'Face',
          'Line',
          'Label',
          'Oval',
          'Skip',
          ), suffix=r'\b'), Name.Builtin) #, 'attributes_present')

    animators = (words((
        'move',  
        'set',    
        'then',   
        'wait'  
        ), suffix=r'\b'), Name.Function.Magic)

    attribute_names = (words((
               'align',        
               'at',           
               'ccw',          
               'curved',
               'curve',
               'cw',           
               'dashed',       
               'dotted',       
               'ease',         
               'fill',         
               'font',         
               'from',         
               'height',       
               'ht',           
               'len',       
               'length', 
               'r', 
               'rad',
               'radius',
               'rx',           
               'ry',           
               'smooth',
               'solid',        
               'step',     
               'stepped',
               'straight',     
               'stroke',       
               'take',         
               'thick',        
               'thickness',    
               'to',           
               'turn',         
               'wid',          
               'width',        
               'with',         
               'x',            
               'y'            
              ), prefix=r'(\.|\b)', suffix=r'\b'), Name.Attribute)
   
    cardinals = (words((
                  'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'c'
                ), prefix=r'(\.|\b)', suffix=r'\b'), Name.Attribute)

    tokens = {
        'root': [
            (r'\n', Whitespace),
            (r'\s+', Whitespace),
            (r'//(.*?)\n', Comment.Single),

            shapes,
            animators,
            attribute_names, 
            cardinals,

            (r'\?\?', Name.Label),
            (r'@', Name.Property),
            (r'(true|false)\b', Keyword.Constant),
            (r'(if|else)\b', Keyword),

            (r'[0-9]*\.[0-9]+[eE]-?[0-9]+%?', Number.Float),
            (r'[0-9]*\.[0-9]+%?', Number.Float),
            (r'[0-9]+[eE]-?[0-9]+%?', Number.Float),
            (r'[0-9]+%?', Number.Integer),

            (r'[{}()\[\],.]', Punctuation),
            (r'[+\-*/&|<>^!=]', Operator),

            (r'=>', Keyword.Declaration),
            (r'\#[0-9A-Fa-f]{3,8}', Name.Property),
            (r'~[a-z]+[0-9]*', Name.Property),
        ]
    }
