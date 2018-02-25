const path = require('path')
const rmrf = require('rimraf')

const ko = require('../ko')

const typeclassTests = require('./tests/typeclass')
const methodsTests = require('./tests/model.methods')
const saveTests = require('./tests/model.save')
const referenceTests = require('./tests/model.reference')
const joinTests = require('./tests/model.join')
const cursorTests = require('./tests/cursor')
const bufferTests = require('./tests/mongodb.buffer')

const config = require('./config')

function runTests (next) {
	typeclassTests(ko, () => {
		methodsTests(ko, () => {
			saveTests(ko, () => {
				referenceTests(ko, () => {
					joinTests(ko, () => {
						cursorTests(ko, () => {
							next()
						})
					})
				})
			})
		})
	})
}

ko.connect({
	client: 'nedb',
	inMemory: true,
})

runTests(() => {
	ko.close()
	ko.connect({
		client: 'nedb',
		filepath: path.join(__dirname, 'db'),
	})
	runTests(() => {
		rmrf(path.join(__dirname, 'db'), () => {})
		ko.close()
		if (config.testMongo) {
			ko.connect(config)
			bufferTests(ko, () => {
				runTests(() => {
					ko.client.client.db(config.database).dropDatabase().then(() => {
						ko.close()
					})
				})
			})
		}
	})
})

