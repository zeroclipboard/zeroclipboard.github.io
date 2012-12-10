all: \
	node_modules \
	server \

node_modules:
	npm install

server:
	open "http://localhost:3000/" && node node_server.js

