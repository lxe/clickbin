MOCHA_OPTS=
REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
			--reporter $(REPORTER) \
			$(MOCHA_OPTS)

dev:
	sudo nodemon app.js --port=80 --domain=testb.in

.PHONY: test