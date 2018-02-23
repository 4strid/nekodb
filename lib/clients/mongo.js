const MongoDB = require('mongodb')

const Cursor = require('./cursor')
const Defer = require('./defer')

function MongoClient (config, readyCb) {
	this.ready = false
	this.client = null
	this.db = null
	this.buffer = []

	const creds = config.username ? config.username + ':' + config.password + '@' : ''
	const db = config.database ? '/' + config.database : ''
	const url = 'mongodb://' + creds + config.address + db

	// well. using new MongoClient(...) doesn't do anything, so we'll use the legacy method
	MongoDB.MongoClient.connect(url, (err, client) => {
		if (err) {
			throw err
		}
		this.client = client
		this.db = this.client.db(config.database || 'nekodb')

		this.ready = true
		readyCb()
	})
}

MongoClient.prototype.count = function (collection, query, options) {
	return this.db.collection(collection).count(query, options)
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

MongoClient.prototype.deleteMany = function (collection, query) {
	return this.db.collection(collection).deleteMany(query).then(result => result.deletedCount)
}

MongoClient.prototype.deleteOne = function (collection, query) {
	return this.db.collection(collection).deleteOne(query).then(result => result.deletedCount)
}

MongoClient.prototype.find = function (collection, query, projection, model) {
	return new Cursor(this.db.collection(collection).find(query, projection), this, model)
}

MongoClient.prototype.findOne = function (collection, query, projection, model) { 
	return new Defer(this.db.collection(collection).findOne(query, projection), model)
}

MongoClient.prototype.save = function (collection, document) {
	if (document.__original) {
		return this.db.collection(collection).insertOne(document.slice()).then(result => {
			if (!document.has_id()) {
				document._id = result.insertedId
			}
			return document
		})
	}
	return this.db.collection(collection).replaceOne({_id: document._id}, document.slice(), {upsert: false})
}

MongoClient.prototype.ObjectID = MongoDB.ObjectID

module.exports = MongoClient
