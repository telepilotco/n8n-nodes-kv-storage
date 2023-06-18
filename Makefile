UNAME := $(shell uname)

.ONESHELL:

clean-local-n8n:
	rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-kv-storage

clean: clean-local-n8n
	rm -rf dist/

build: clean
	pnpm run build
	npm link
	cd ~/.n8n/ && mkdir -p nodes ; cd nodes ; npm link n8n-nodes-kv-storage

run-only:
	DEBUG=kv-storage EXECUTIONS_PROCESS=main n8n start

run: build run-only

prepublish:
	npm run lintfix
	npm run format
	npm run prepublishOnly

publish:
	npm publish

