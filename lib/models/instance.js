// dummy constructor for testing: making sure model instances are in fact Instances
function Instance () {}

Instance.prototype.save = function () {
	return this._model._save(this)
}

Instance.prototype.saveRefs = function () {
	return this._model._saveRefs(this)
}

Instance.prototype.saveAll = function () {
	return this._model._saveRefs(this).then(() => {
		return this._model._save(this)
	})
}

Instance.prototype.delete = function () {
	return this._model.deleteOne(this.get_id())
}

Instance.prototype.join = function (fields) {
	fields = fields || Object.keys(this._model.references)
	const joins = fields.map(field => {
		return this._model._join(this, field)
	})
	return Promise.all(joins).then(() => {
		return this
	})
}

Instance.prototype.has_id = function () {
	return this._id !== null && this._id !== undefined
}

Instance.prototype.get_id = function () {
	return {_id: this._id}
}

Instance.prototype.constructor = Instance

Instance.ClassFactory = function (model) {

	function instanceFactory (values, original) {
		const o = Object.create(instanceFactory.prototype)

		const processed = o._model.preprocess((values || {}))
		for (const field in processed) {
			o[field] = processed[field]
		}

		if (original) {
			Object.defineProperty(o, '__original', {
				configurable: true,
				value: true
			})
		}
		return o
	}

	instanceFactory.prototype = Object.create(Instance.prototype)

	instanceFactory.prototype._model = model

	return instanceFactory
}

module.exports = Instance
