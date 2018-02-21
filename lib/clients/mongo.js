const MongoDB = require('mongodb')

const Cursor = require('./cursor')
const Defer = require('./defer')

function MongoClient (config) {
	this.collections = {}
	this.client = null
	this.db = null
	this.queue = []

	const creds = config.username ? config.username + ':' + config.password + '@' : ''
	const db = config.database ? '/' + config.database : ''
	const url = 'mongodb://' + creds + config.address + db

	MongoDB.MongoClient.connect(url, (err, client) => {
		if (err) {
			throw err
		}
		this.client = client
		this.db = this.client.db(config.database || 'nekodb')
	})
}
