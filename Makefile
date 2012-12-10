BRANCH = "master"

all: \
	node_modules \
	server \

node_modules:
	npm install

update:
	@git checkout $(BRANCH) ZeroClipboard.min.js ZeroClipboard.swf
	@rm -f javascript/ZeroClipboard*
	@mv ZeroClipboard.* javascripts/

commit:
	git add .
	git commit -a -m "Update demo files to latest changes."
	git push

server:
	open "http://localhost:3000/" && node node_server.js

