function Instance (model, values) {
	const o = Object.create(Instance.prototype)
	Object.defineProperty(o, 'model', {
		value: model
	})

	const processed = o.model.preprocess((values || {}))
	for (const field in processed) {
		o[field] = processed[field]
	}
	return o
}

Instance.prototype.save = function () {
	return this.model.save(this)
}

Instance.prototype.has_id = function () {
	return this._id !== null && this._id !== undefined
}

module.exports = Instance
