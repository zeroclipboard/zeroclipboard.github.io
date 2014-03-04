BRANCH = "gh-pages"
VERSION = "1.3.2"
PORT = "3000"

all: \
	node_modules \
	update \
	server \

node_modules:
	npm install

update:
	@git checkout $(BRANCH) javascripts/zc/ZeroClipboard_$(VERSION).js javascripts/zc/ZeroClipboard_$(VERSION).swf
	@rm -f javascript/ZeroClipboard*
	@cp javascripts/zc/ZeroClipboard_$(VERSION).js javascripts/ZeroClipboard.js
	@cp javascripts/zc/ZeroClipboard_$(VERSION).swf javascripts/ZeroClipboard.swf

commit: update
	git add .
	git commit -a -m "Update demo files to latest changes."
	git push

server: update
	open "http://localhost:$(PORT)/" && node node_server.js

.PHONY: all update commit server