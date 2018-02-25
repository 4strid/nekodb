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

	// well. using new MongoClient(...) doesn't do anything, so we'll use the legacy method
	MongoDB.MongoClient.connect(url, (err, client) => {
		if (err) {
			throw err
		}
		this.client = client
		this.db = this.client.db(config.database || 'nekodb')

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

MongoClient.prototype.count = MethodFactory('count')

MongoClient.prototype.createCollection = MethodFactory('createCollection')

MongoClient.prototype.createIndex = function (collection, fieldName, options) {
	return this.db.collection(collection).createIndex(fieldName, options)
}

MongoClient.prototype.cursorToArray = MethodFactory('cursorToArray')

MongoClient.prototype.close = MethodFactory('close')

MongoClient.prototype.deleteMany = MethodFactory('deleteMany')

MongoClient.prototype.deleteOne = MethodFactory('deleteOne')

MongoClient.prototype.find = function (collection, query, projection, model) {
	if (!this.ready) {
		const cursor = new Cursor(null, this, model)
		this._enqueue('_find', collection, query, projection, cursor)
		return cursor
	}
	return new Cursor(this.db.collection(collection).find(query, projection), this, model)
}

MongoClient.prototype.findOne = function (collection, query, projection, model) {
	if (!this.ready) {
		return new Defer(this._enqueue('_findOne', collection, query, projection), model)
	}
	return new Defer(this.db.collection(collection).findOne(query, projection), model)
}

MongoClient.prototype.save = MethodFactory('save')

MongoClient.prototype._count = function (collection, query, options) {
	return this.db.collection(collection).count(query, options)
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
	return this.db.collection(collection).replaceOne({_id: document._id}, document.slice(), {upsert: false})
}

MongoClient.prototype.ObjectID = MongoDB.ObjectID

module.exports = MongoClient
