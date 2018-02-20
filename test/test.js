const path = require('path')
const fs = require('fs')
const rmrf = require('rimraf')

const ko = require('../ko')

const typeclass = require('./tests/typeclass')
const methods = require('./tests/model.methods')
const save = require('./tests/model.save')
const reference = require('./tests/model.reference')
const join = require('./tests/model.join')
const cursor = require('./tests/cursor')

function runTests (next) {
	typeclass(ko, () => {
		methods(ko, () => {
			save(ko, () => {
				reference(ko, () => {
					join(ko, () => {
						cursor(ko, () => {
							next()
						})
					})
				})
			})
		})
	})
}

// run tests for each client
ko.connect({
	client: 'nedb',
	inMemory: true,
})

runTests(() => {
	ko.close()
	ko.connect({
		client: 'nedb',
		filepath: path.join(__dirname, 'db')
	})
	runTests(() => {
		rmrf(path.join(__dirname, 'db'), () => {})
	})
})
