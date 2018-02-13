function Instance (model, values) {
	const o = Object.create(Instance.prototype)
	Object.defineProperty(o, '__model', {
		value: model
	})

	const processed = o.__model.preprocess((values || {}))
	for (const field in processed) {
		o[field] = processed[field]
	}
	return o
}

Instance.prototype.save = function () {
	return this.__model.save(this)
}

Instance.prototype.delete = function () {
	return this.__model.deleteOne(this.get_id())
}

Instance.prototype.has_id = function () {
	return this._id !== null && this._id !== undefined
}

Instance.prototype.get_id = function () {
	return {_id: this._id}
}

module.exports = Instance
