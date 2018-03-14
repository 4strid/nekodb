// like a cursor, but for single document returning queries

const Cursor = require('./cursor')

function Defer (promise, model, projection) {
	this.promise = promise
	this.model = model
	this.projection = projection
}

Defer.prototype.catch = function (cb) {
	this.promise.catch(cb)
	return this
}

Defer.prototype.then = function (cb) {
	return this.promise.then(doc => {
		if (doc === null) {
			return cb(doc)
		}
		if (this.projection) {
			return cb(doc)
		}
		return cb(this.model.Instance(doc))
	})
}

Defer.prototype.join = function (fields) {
	this.joined = fields || true
	this.promise = this.promise.then(doc => {
		return Promise.all(this._join(doc)).then(() => {
			return doc
		})
	})
	return this
}

Defer.prototype._join = Cursor.prototype._join

module.exports = Defer
