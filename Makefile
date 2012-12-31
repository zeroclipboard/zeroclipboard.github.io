BRANCH = "master"

all: \
	node_modules \
	update \
	server \

node_modules:
	npm install

update:
	@git checkout $(BRANCH) ZeroClipboard.js ZeroClipboard.swf
	@rm -f javascript/ZeroClipboard* test.html
	@mv ZeroClipboard.* javascripts/
	@cp t.html test.html

commit: update
	git add .
	git commit -a -m "Update demo files to latest changes."
	git push

server: update
	open "http://localhost:3000/" && node node_server.js

.PHONY: all update commit server