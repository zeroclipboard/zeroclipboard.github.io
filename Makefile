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
	@rm -f javascript/ZeroClipboard*
	@curl -O https://raw.github.com/zeroclipboard/zeroclipboard/v$(VERSION)/ZeroClipboard.js
	@mv ZeroClipboard.js javascripts/ZeroClipboard.js
	@curl -O https://raw.github.com/zeroclipboard/zeroclipboard/v$(VERSION)/ZeroClipboard.swf
	@mv ZeroClipboard.swf javascripts/ZeroClipboard.swf

commit: update
	git add .
	git commit -a -m "Update demo files to latest changes."
	git push

server: update
	open "http://localhost:$(PORT)/" && node node_server.js

.PHONY: all update commit server