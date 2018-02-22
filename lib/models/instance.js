// dummy constructor for testing: making sure model instances are in fact Instances
function Instance () {}

Instance.prototype.slice = function () {
	const slice = {}
	for (const field of Object.keys(this)) {
		if (Array.isArray(this[field]) &&
			this[field][0] &&
			this[field][0] instanceof Instance) {
			slice[field] = this[field].map(ref => ref.slice())
		} else if (this[field] instanceof Instance) {
			slice[field] = this[field].slice()
		} else {
			slice[field] = this[field]
		}
	}
	return slice
}

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

		const processed = model.preprocess((values || {}))
		for (const field in processed) {
			o[field] = processed[field]
			if (model.references[field] && !original) {
				o[field] = model.references[field].ifTypeProcess('embed', o[field], reference => {
					return model.references[field].model.Instance(reference)
				})
			}
		}

		if (original === true) {
			Object.defineProperty(o, '__original', {
				configurable: true,
				value: true,
			})
		}
		return o
	}

	instanceFactory.prototype = Object.create(Instance.prototype)

	instanceFactory.prototype._model = model

	return instanceFactory
}

module.exports = Instance
