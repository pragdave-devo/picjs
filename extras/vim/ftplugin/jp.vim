" Vim ftplugin file
" Language: JP (PIC-like diagram language)

if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

setlocal commentstring=//\ %s
setlocal comments=://
setlocal suffixesadd=.pic,.picjs,.jp

" Match braces, parens, brackets
setlocal matchpairs+=<:>

let b:undo_ftplugin = 'setlocal commentstring< comments< suffixesadd< matchpairs<'
