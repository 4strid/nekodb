const path = require('path')
const rmrf = require('rimraf')

const ko = require('../ko')

const typeclassTests = require('./tests/typeclass')
const methodsTests = require('./tests/model.methods')
const saveTests = require('./tests/model.save')
const referenceTests = require('./tests/model.reference')
const joinTests = require('./tests/model.join')
const cursorTests = require('./tests/cursor')
const hooksTests = require('./tests/hooks')
const indexTests = require('./tests/index')
const bufferTests = require('./tests/mongodb.buffer')
const arrayOpsTests = require('./tests/proxy.arrayops')
const proxySetTests = require('./tests/proxy.set')

const config = require('./config')

function runTests (next) {
	typeclassTests(ko, () => {
		methodsTests(ko, () => {
			saveTests(ko, () => {
				referenceTests(ko, () => {
					joinTests(ko, () => {
						cursorTests(ko, () => {
							hooksTests(ko, () => {
								indexTests(ko, () => {
									arrayOpsTests(ko, () => {
										proxySetTests(ko, () => {
											next()
										})
									})
								})
							})
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

// nedb in memory client
runTests(() => {
	ko.close()
	ko.connect({
		client: 'nedb',
		filepath: path.join(__dirname, 'db'),
	})
	// nedb file client
	runTests(() => {
		rmrf(path.join(__dirname, 'db'), () => {})
		ko.close()
		if (config.testMongo) {
			ko.connect(config)
			bufferTests(ko, () => {
				// mongodb client
				runTests(() => {
					ko.client.client.db(config.database).dropDatabase().then(() => {
						ko.close()
					})
				})
			})
		}
	})
})

