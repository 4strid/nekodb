const path = require('path')
const DataStore = require('nedb')

const Cursor = require('./cursor')
const Defer = require('./defer')

function NeDBClient (config) {
	this.collections = {}
	this.filepath = config.filepath
	this.inMemory = config.inMemory
	this.autocompactionInterval = config.autocompactionInterval
	if (this.filepath === undefined && this.inMemory === undefined) {
		throw new Error('Did not specify a storage medium')
	}
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
	const config = {autoload: true}
	if (this.filepath !== undefined) {
		config.filename = path.join(this.filepath, name + '.db')
	} else if (this.inMemory) {
		config.inMemoryOnly = true
	}
	this.collections[name] = new DataStore(config)

	if (this.autocompactionInterval !== undefined) {
		this.collections[name].persistence.setAutocompactionInterval(this.autoCompactionInterval)
	}
}

NeDBClient.prototype.createIndex = function (collection, fieldName, options) {
	const db = this.collections[collection]
	options.fieldName = fieldName
	db.ensureIndex(options)
	return Promise.resolve()
}

NeDBClient.prototype.cursorToArray = function (cursor) {
	return new Promise((resolve, reject) => {
		cursor.cursor.exec((err, docs) => {
			if (err) {
				return reject(err)
			}
			resolve(docs)
		})
	})
}

NeDBClient.prototype.close = function (cb) {
	console.warn('NeDB does not support the close operation, this method actually does nothing')
	if (cb) {
		cb()
	}
	return Promise.resolve()
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

NeDBClient.prototype.find = function (collection, query, projection, model) {
	const db = this.collections[collection]
	return new Cursor(db.find(query, projection), this, model, projection)
}

NeDBClient.prototype.findOne = function (collection, query, projection, model) {
	const db = this.collections[collection]
	return new Defer(new Promise(function (resolve, reject) {
		db.findOne(query, projection, function (err, found) {
			if (err) {
				return reject(err)
			}
			resolve(found)
		})
	}), model, projection)
}

function traverseUpdates (field, value) {
	const updates = {}
	if (value._updates === undefined || Object.keys(value._updates).length === 0) {
		updates[field] = value
		return updates
	}
	for (const subfield in value._updates) {
		const subupdates = traverseUpdates(value._updates[subfield])
		for (const subupdate in subupdates) {
			updates[field + '.' + subupdate] = subupdates[subupdate]
		}
	}
	return updates
}

NeDBClient.prototype.save = function (collection, document) {
	const db = this.collections[collection]
	return new Promise(function (resolve, reject) {
		if (document.__original) {
			db.insert(document, function (err, inserted) {
				if (err) {
					return reject(err)
				}
				return resolve(inserted)
			})
		} else {
			const updates = { $set: {} }
			for (const field in document._updates) {
				const value = document._updates[field]
				// process array operators
				if (Array.isArray(value) && !value._replace) {
					if (value._$push) {
						// nedb does not support the position operator, fallback to replacing the array
						if (value._$position) {
							updates.$set[field] = value
						} else {
							updates.$push = updates.$push || {}
							updates.$push[field] = {$each: value._$push}
							if (value._$slice) {
								updates.$push[field].$slice = value._$slice
							}
						}
					}
					if (value._$pop) {
						updates.$pop = updates.$pop || {}
						updates.$pop[field] = value._$pop
					}
					if (value._$addToSet) {
						updates.$addToSet = updates.$addToSet || {}
						updates.$addToSet[field] = {$each: value._$addToSet}
					}
					if (value._$pull) {
						updates.$pull = updates.$pull || {}
						if (Array.isArray(value._$pull)) {
							updates.$pull[field] = {$in: value._$pull}
						} else {
							updates.$pull[field] = value._$pull
						}
					}
				} else {
					// otherwise just set the value
					const subupdates = traverseUpdates(value)
					for (const update of subupdates) {
						updates.$set[update] = subupdate[update]
					}
				}
			}
			console.log('xxxxxxxxxxxxxxxx')
			console.log(updates)
			db.update({_id: document._id}, updates, {upsert: false}, function (err, numAffected, affectedDocuments) {
				if (err) {
					return reject(err)
				}
				const writeResult = {}
				writeResult.nModified = numAffected
				return resolve(writeResult)
			})
		}
	})
}


// does not do validation! danger zone!
// uncomment it to use. this is our dirty little secret

//NeDBClient.prototype.UPDATE = function (collection, query, update) {
	//const db = this.collections[collection]
	//return new Promise(function (resolve, reject) {
		//db.update(query, update, function (err, updated) {
			//if (err) {
				//return reject(err)
			//}
			//resolve(updated)
		//})
	//});
//}

NeDBClient.prototype.ObjectID = String

module.exports = NeDBClient
