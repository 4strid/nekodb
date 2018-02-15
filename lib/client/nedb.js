var path = require('path')
var fs = require('fs')
var DataStore = require('nedb')

var Cursor = require('./cursor')

function NeDBClient () {
	const o = Object.create(NeDBClient.prototype)
	o.collections = {}
	return o
}

NeDBClient.prototype.count = function (collection, query) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		db.count(query, function (err, count) {
			if (err) {
				return reject(err)
			}
			resolve(count)
		})
	})
}

NeDBClient.prototype.createCollection = function (name) {
	this.collections[name] = new DataStore({
		filename: path.join('__dirname', '..', 'db', name + '.db'),
		autoload: true,
	})
}

NeDBClient.prototype.cursorForEach = function (cursor, cb, errHandler) {
	cursor.exec((err, docs) => {
		if (err) {
			return errHandler(err)
		}
		docs.forEach(cb)
	})
}

NeDBClient.prototype.cursorToArray = function (cursor) {
	return new Promise((resolve, reject) => {
		cursor.exec((err, docs) => {
			if (err) {
				return reject(err)
			}
			resolve(docs)
		})
	})
}

NeDBClient.prototype.deleteMany = function (collection, query) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		db.remove(query, {multi: true}, function (err, numRemoved) {
			if (err) {
				return reject(err)
			}
			resolve(numRemoved)
		})
	})
}

NeDBClient.prototype.deleteOne = function (collection, query) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		db.remove(query, {}, function (err, numRemoved) {
			if (err) {
				return reject(err)
			}
			resolve(numRemoved)
		})
	})
}

NeDBClient.prototype.find = function (collection, query, projection, transform) {
	const db = this.collections[collection]
	return new Cursor(db.find(query, projection), this, transform)
}

NeDBClient.prototype.findOne = function (collection, query, projection) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		db.findOne(query, projection, function (err, found) {
			if (err) {
				return reject(err)
			}
			resolve(found)
		})
	})
}

NeDBClient.prototype.save = function (collection, document) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		if (document._id === null || document._id === undefined) {
			db.insert(document, function (err, inserted) {
				if (err) {
					return reject(err)
				}
				return resolve(inserted)
			})
		} else {
			db.update({_id: document._id}, document, {upsert: true}, function (err, numAffected, affectedDocuments, upsert) {
				if (err) {
					return reject(err)
				}
				// this should match MongoDB better
				return resolve({
					numAffected,
					affected: affectedDocuments,
					upsert,
				})
			})
		}
	})
}

// does not do validation! danger zone!
NeDBClient.prototype.UPDATE = function (collection, query, update) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		db.update(query, update, function (err, updated) {
			if (err) {
				return reject(err)
			}
			resolve(updated)
		})
	});
}

module.exports = NeDBClient
