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

		//this.processBuffer(0, () => {
			//this.ready = true
		//})
		this.ready = true
		console.log(readyCb)
		readyCb()
	})
}

function MethodFactory (name) {
	return function (...args) {
		if (!this.ready) {
			return this._enqueue(name, ...args)
		}
		return new Promise((resolve, reject) => {
			this['_' + name](resolve, reject, ...args)
		})
	}
}

MongoClient.prototype._enqueue = function (op, ...args) {
	return new Promise((resolve, reject) => {
		this.buffer.push({
			op,
			args: [resolve, reject, ...args],
		})
	})
}

MongoClient.prototype.count = MethodFactory('count')

//MongoClient.prototype.count = function (collection, query, options) {
	//if (!this.ready) {
		//return this._enqueue('_count', collection, query, options)
	//}
	//return new Promise((resolve, reject) => {
		//this._count(collection, query, options, resolve, reject)
	//})
//}

MongoClient.prototype._count = function (resolve, reject, collection, query) {
	this.db.collection(collection).count(query, (err, count) => {
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

MongoClient.prototype.deleteMany = MethodFactory('deleteMany')

MongoClient.prototype._deleteMany = function (resolve, reject, collection, query) {
	this.db.collection(collection).deleteMany(query, (err, result) => {
		if (err) {
			return reject(err)
		}
		resolve(result.deletedCount)
	})
}

MongoClient.prototype.deleteOne = MethodFactory('deleteOne')

MongoClient.prototype._deleteOne = function (resolve, reject, collection, query) {
	this.db.collection(collection).deleteOne(query, (err, result) => {
		if (err) {
			return reject(err)
		}
		resolve(result.deletedCount)
	})
}

MongoClient.prototype.find = function (collection, query, projection, model) {
	if (!this.ready) {
		const cursor = new Cursor(null, this, model)
		this._enqueue('find', collection, query, projection, cursor)
		return cursor
	}
	return new Cursor(this.db.collection(collection).find(query, projection), this, model)
}

MongoClient.prototype._find = function (collection, query, projection, cursor) {
	cursor.cursor = this.db.collection(collection).find(query, projection)
	//cursor.ready() //?
}

MongoClient.prototype.findOne = function (collection, query, projection, model) { 
	if (!this.ready) {
		return new Defer(this._enqueue('findOne', collection, query, projection), model)
	}
	return new Defer(this.db.collection(collection).findOne(query, projection), model)
}

MongoClient.prototype._findOne = function (resolve, reject, collection, query, projection) {
	this.db.findOne(query, projection, (err, found) => {
		if (err) {
			return reject(err)
		}
		resolve(found)
	})
}

MongoClient.prototype.save = MethodFactory('save')

MongoClient.prototype._save = function (resolve, reject, collection, document) {
	if (document.__original) {
		return this.db.collection(collection).insertOne(document.slice(), (err, result) => {
			if (err) {
				return reject(err)
			}
			if (!document.has_id()) {
				document._id = result.insertedId
			}
			resolve(document)
		})
	}
	this.db.collection(collection).replaceOne({_id: document._id}, document.slice(), {upsert: false}, (err, result) => {
		if (err) {
			return reject(err)
		}
		resolve(result)
	})
}

MongoClient.prototype.ObjectID = MongoDB.ObjectID

module.exports = MongoClient
