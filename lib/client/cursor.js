function Cursor (cursor, client, transform) {
	this.cursor = cursor
	this.client = client
	this.transform = transform
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

Cursor.prototype.then = function (cb) {
	return this.client.cursorToArray(this.cursor).then(docs => {
		// do joins here...
		cb(docs.map(this.transform))
	})
}

Cursor.prototype.toArray = Cursor.prototype.then

Cursor.prototype.forEach = function (cb) {
	return new Promise((_, reject) => {
		this.client.cursorForEach(this.cursor, doc => {
			cb(this.transform(doc))
			// do joins here...
		}, err => reject(err))
	})
}

module.exports = Cursor
