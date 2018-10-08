const MongoDB = require('mongodb')
const merge = require('merge').recursive

const Cursor = require('./cursor')
const Defer = require('./defer')
const processUpdates = require('./updates')

function MongoClient (config) {
	this.ready = false
	this.client = null
	this.db = null
	this.buffer = []

	let database = 'nekodb'
	let url = null
	if (config.url) {
		url = config.url
		const start = config.url.lastIndexOf('/') + 1
		database = config.url.slice(start)
	} else {
		const creds = config.username ? config.username + ':' + config.password + '@' : ''
		const db = config.database ? '/' + config.database : ''
		url = 'mongodb://' + creds + config.address + db
		database = config.database
	}

	// well. using new MongoClient(...) doesn't do anything, so we'll use the legacy method
	MongoDB.MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
		if (err) {
			throw err
		}
		this.client = client
		this.db = this.client.db(database)

		this._processBuffer(0, () => {
			this.ready = true
		})
	})
}

function MethodFactory (name) {
	return function (...args) {
		if (!this.ready) {
			return this._enqueue('_' + name, ...args)
		}
		return this['_' + name](...args)
	}
}

MongoClient.prototype._enqueue = function (op, ...args) {
	return new Promise((resolve, reject) => {
		this.buffer.push({
			op,
			args,
			resolve,
			reject,
		})
	})
}

MongoClient.prototype._processBuffer = function (i, exitCb) {
	if (i >= this.buffer.length) {
		return exitCb()
	}
	const cmd = this.buffer[i]
	this[cmd.op](...cmd.args).then(result => {
		cmd.resolve(result)
		this._processBuffer(++i, exitCb)
		return result
	}).catch(err => {
		cmd.reject(err)
	})
}

MongoClient.prototype.countDocuments = MethodFactory('countDocuments')

MongoClient.prototype.estimatedDocumentCount = MethodFactory('estimatedDocumentCount')

MongoClient.prototype.createCollection = MethodFactory('createCollection')

MongoClient.prototype.createIndex = MethodFactory('createIndex')

MongoClient.prototype.cursorToArray = MethodFactory('cursorToArray')

MongoClient.prototype.close = MethodFactory('close')

MongoClient.prototype.deleteMany = MethodFactory('deleteMany')

MongoClient.prototype.deleteOne = MethodFactory('deleteOne')

MongoClient.prototype.find = function (collection, query, projection, model) {
	if (!this.ready) {
		const cursor = new Cursor(null, this, model, projection)
		this._enqueue('_find', collection, query, { projection }, cursor)
		return cursor
	}
	return new Cursor(this.db.collection(collection).find(query, { projection }), this, model, projection)
}

MongoClient.prototype.findOne = function (collection, query, projection, model) {
	if (!this.ready) {
		return new Defer(this._enqueue('_findOne', collection, query, { projection }), model, projection)
	}
	return new Defer(this.db.collection(collection).findOne(query, { projection }), model, projection)
}

MongoClient.prototype.save = MethodFactory('save')

MongoClient.prototype._countDocuments = function (collection, query, options) {
	return this.db.collection(collection).countDocuments(query, options)
}

MongoClient.prototype._estimatedDocumentCount = function (collection, query, options) {
	return this.db.collection(collection).estimatedDocumentCount(query, options)
}

MongoClient.prototype._createCollection = function (name) {
	return new Promise((resolve, reject) => {
		try {
			this.db.collection(name)
			resolve()
		} catch (err) {
			reject(err)
		}
	})
}

MongoClient.prototype._createIndex = function (collection, fieldName, options) {
	return this.db.collection(collection).createIndex(fieldName, options)
}

MongoClient.prototype._cursorToArray = function (cursor) {
	cursor.buffer.forEach(cmd => {
		cursor.cursor[cmd.op](cmd.arg)
	})
	return cursor.cursor.toArray()
}

MongoClient.prototype._close = function () {
	return this.client.close()
}

MongoClient.prototype._deleteMany = function (collection, query) {
	return this.db.collection(collection).deleteMany(query).then(result => result.deletedCount)
}

MongoClient.prototype._deleteOne = function (collection, query) {
	return this.db.collection(collection).deleteOne(query).then(result => result.deletedCount)
}

MongoClient.prototype._find = function (collection, query, projection, cursor) {
	return new Promise(resolve => {
		cursor.cursor = this.db.collection(collection).find(query, projection)
		resolve()
	})
}

MongoClient.prototype._findOne = function (collection, query, projection) { 
	return this.db.collection(collection).findOne(query, projection)
}

MongoClient.prototype._save = function (collection, document) {
	if (document.__original) {
		return this.db.collection(collection).insertOne(document.slice()).then(result => {
			if (!document.has_id()) {
				document._id = result.insertedId
			}
			return document
		})
	}
	const updates = {}
	for (const field in document._updates) {
		const value = document._updates[field]
		const update = processUpdates(field, value, true)
		merge(updates, update)
	}

	if (Object.keys(updates).length === 0) {
		return Promise.resolve()
	}
	//if (Object.keys(document._updates).length === 0) {
		//return Promise.resolve(document)
	//}
	return this.db.collection(collection).updateOne(document.get_id(), updates, {upsert: false})
}

MongoClient.prototype.ObjectID = MongoDB.ObjectID

module.exports = MongoClient
