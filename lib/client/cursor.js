function Cursor (cursor, client, model) {
	this.cursor = cursor
	this.client = client
	this.model = model
	this.joined = null
}

Cursor.prototype.sort = function (params) {
	this.cursor.sort(params)
	return this
}

Cursor.prototype.skip = function (skip) {
	this.cursor.skip(skip)
	return this
}

Cursor.prototype.limit = function (limit) {
	this.cursor.limit(limit)
	return this
}

// schedule a join for once we have the documents and they have been converted to model instances
Cursor.prototype.join = function (fields) {
	this.joined = fields || true
	return this
}

Cursor.prototype._join = function (instance) {
	const joins = []
	if (this.joined === true) {
		for (const field in this.model.references) {
			joins.push(this.model._join(instance, field))
		}
	} else {
		for (const field of this.joined) {
			joins.push(this.model._join(instance, field))
		}
	}
	return joins
}

Cursor.prototype.then = function (cb) {
	return this.client.cursorToArray(this.cursor).then(docs => {
		const instances = docs.map(this.model.Instance)

		if (this.joined) {
			let joins = []
			for (const instance of instances) {
				joins = joins.concat(this._join(instance))
			}
			return Promise.all(joins).then(() => {
				cb(instances)
			})
		}
		cb(instances)
	})
}

Cursor.prototype.toArray = Cursor.prototype.then

Cursor.prototype.forEach = function (cb) {
	return new Promise((resolve, reject) => {
		this.client.cursorForEach(this.cursor, doc => {
			//cb(this.model.Instance(doc))
			// do joins here...
			const instance = this.model.Instance(doc)
			if (this.joined) {
				return Promise.all(this._join(instance)).then(() => {
					cb(instance)
					resolve()
				})
			}
			resolve()
			cb(instance)
		}, err => reject(err))
	})
}

module.exports = Cursor
