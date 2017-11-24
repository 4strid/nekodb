var path = require('path')
var DataStore = require('nedb')

function NeDBClient () {
	const o = Object.create(NeDBClient.prototype)
	o.collections = {}
	return o
}

console.log(__dirname)

NeDBClient.prototype.createCollection = function (name) {
	this.collections[name] = new DataStore({
		filename: path.join('__dirname', '..', 'db', name + '.db'),
		autoload: true,
	})
}

NeDBClient.prototype.save = function (collection, document) {
	const client = this
	return new Promise(function (resolve, reject) {
		const db = client.collections[collection]
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

NeDBClient.prototype.find = function (collection, query, projection) {
	const client = this
	return new Promise(function (resolve, reject) {
		const db = client.collections[collection]
		db.find(query, projection, function (err, found) {
			if (err) {
				return reject(err)
			}
			resolve(found)
		})
	})
}

NeDBClient.prototype.findOne = function (collection, query, projection) {
	const client = this
	return new Promise(function (resolve, reject) {
		const db = client.collections[collection]
		db.findOne(query, projection, function (err, found) {
			if (err) {
				return reject(err)
			}
			resolve(found)
		})
	})
}

module.exports = NeDBClient
