while true; inotifywait  -e close_write test/**.js src/peg_parser/jp.pegjs Makefile; make test; end
