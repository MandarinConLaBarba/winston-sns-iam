REPORTER = dot

test:
	  @./node_modules/.bin/mocha ./test --recursive --reporter $(REPORTER)

.PHONY: test
