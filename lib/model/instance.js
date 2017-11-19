function Instance (model, values) {
	const o = Object.create(Instance.prototype)
	Object.defineProperty(o, 'model', {
		value: model
	})

	const processed = o.model.process(values)
	if (processed.$$errors) {
		// what is the point of this
		return ErrorInstance(model, processed.$$errors)
		// what is a better way to handle errors
	}

	for (const field in processed) {
		o[field] = values[field]
	}
	return o
}

Instance.prototype.save = function () {
	return this.model.save(this)
}

module.exports = Instance
