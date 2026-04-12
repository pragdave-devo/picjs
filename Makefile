PARSER = src/peg_parser/jp
PEGJS = node_modules/.bin/peggy
STARTS = Program,Expression
TRACE = #--trace
TARGET = dist/jp.js
TESTS  = test/

.PHONY: all 
all: $(TARGET)

.PHONY: play
play:
	npx vite

.PHONY: clean
clean:
	rm -f index.js $(PARSER).js $(PARSER)-test.js

.PHONY: test
test: $(PARSER)-test.js
	npm test 2>&1

# ---------

$(TARGET): $(PARSER).js
	npx vite build

$(PARSER).js: $(PARSER).pegjs Makefile
	node $(PEGJS) $(TRACE) --format es --dts -o $(PARSER).js $(PARSER).pegjs

$(PARSER)-test.js: $(PARSER).pegjs Makefile
	node $(PEGJS) $(TRACE) --format es --dts --allowed-start-rules $(STARTS) -o $(PARSER)-test.js $(PARSER).pegjs


