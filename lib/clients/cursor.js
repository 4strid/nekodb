function Cursor (cursor, client, model) {
	this.cursor = cursor
	this.client = client
	this.model = model
	this.joined = null
	this.buffer = []
}

Cursor.prototype.sort = function (params) {
	if (this.cursor === null) {
		this.buffer.push({
			op: 'sort',
			arg: params,
		})
		return this
	}
	this.cursor.sort(params)
	return this
}

Cursor.prototype.skip = function (skip) {
	if (this.cursor === null) {
		this.buffer.push({
			op: 'skip',
			arg: skip,
		})
		return this
	}
	this.cursor.skip(skip)
	return this
}

Cursor.prototype.limit = function (limit) {
	if (this.cursor === null) {
		this.buffer.push({
			op: 'limit',
			arg: limit,
		})
		return this
	}
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
	const fields = this.joined === true ? Object.keys(this.model.references) : this.joined
	for (const field of fields) {
		joins.push(this.model._join(instance, field))
	}
	return joins
}

Cursor.prototype.then = function (cb) {
	return this.client.cursorToArray(this).then(docs => {
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

Cursor.prototype._forEach = function (iterator, cb, exitCb) {
	const next = iterator.next()
	if (next.value === undefined) {
		return exitCb()
	}
	const doc = next.value
	const instance = this.model.Instance(doc)
	if (this.joined) {
		return Promise.all(this._join(instance)).then(() => {
			cb(instance)
			this._forEach(iterator, cb, exitCb)
		}).catch(err => {
			exitCb(err)
		})
	}
	cb(instance)
	this._forEach(iterator, cb, exitCb)
}

Cursor.prototype.forEach = function (cb) {
	return new Promise((resolve, reject) => {
		this.client.cursorToArray(this).then(docs => {
			const iterator = docs[Symbol.iterator]()
			this._forEach(iterator, cb, err => {
				if (err) {
					return reject(err)
				}
				resolve()
			})
		})
	})
}

module.exports = Cursor
