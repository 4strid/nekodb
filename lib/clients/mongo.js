const MongoDB = require('mongodb')

const Cursor = require('./cursor')
const Defer = require('./defer')

function MongoClient (config) {
	this.ready = false
	this.client = null
	this.db = null
	this.buffer = []

	const creds = config.username ? config.username + ':' + config.password + '@' : ''
	const db = config.database ? '/' + config.database : ''
	const url = 'mongodb://' + creds + config.address + db

	new MongoDB.MongoClient(url, (err, client) => {
		if (err) {
			throw err
		}
		this.client = client
		this.db = this.client.db(config.database || 'nekodb')

		this.processBuffer(0, () => {
			this.ready = true
		})
	})
}

MongoClient.prototype._enqueue = function (op, ...args) {
	return new Promise((resolve, reject) => {
		this.buffer.push({
			op,
			args: [...args, resolve, reject]
		})
	})
}

MongoClient.prototype.count = function (collection, query, options) {
	if (!this.ready) {
		return this._enqueue('_count', collection, query, options)
	}
	return new Promise((resolve, reject) => {
		this._count(collection, query, options, resolve, reject)
	})
}

MongoClient.prototype._count = function (collection, query, options, resolve, reject) {
	this.db.collection(collection).count(query, options, (err, count) => {
		if (err) {
			return reject(err)
		}
		resolve(count)
	})
}

MongoClient.prototype.createCollection = function (name) {
	this.db.collection(name)
}

MongoClient.prototype.cursorToArray = function (cursor) {
	return cursor.toArray()
}

MongoClient.prototype.close = function () {
	return this.client.close()
}
