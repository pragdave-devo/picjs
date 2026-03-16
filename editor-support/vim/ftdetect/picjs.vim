" Vim filetype detection for picjs
" Detects .picjs and .pikchr files

autocmd BufRead,BufNewFile *.picjs set filetype=picjs
autocmd BufRead,BufNewFile *.pikchr set filetype=picjs
