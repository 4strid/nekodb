// like a cursor, but for single document returning queries

const Cursor = require('./cursor')

function Defer (promise, model) {
	this.promise = promise
	this.model = model
}

Defer.prototype.catch = function (cb) {
	return this.promise.catch(cb)
}

Defer.prototype.then = function (cb) {
	return this.promise.then(doc => {

		const instance = this.model.Instance(doc)

		console.log(instance)
		cb(this.model.Instance(doc))
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
