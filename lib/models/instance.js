// dummy constructor for testing: making sure model instances are in fact Instances
function Instance () {}

Instance.prototype.save = function () {
	return this.__model()._save(this)
}

Instance.prototype.delete = function () {
	return this.__model().deleteOne(this.get_id())
}

Instance.prototype.join = function (fields) {
	fields = fields || Object.keys(this.__model().references)
	const joins = fields.map(field => {
		return this.__model()._join(this, field)
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

	function instanceFactory (values) {
		const o = Object.create(instanceFactory.prototype)

		const processed = o.__model().preprocess((values || {}))
		for (const field in processed) {
			o[field] = processed[field]
		}
		return o
	}

	instanceFactory.prototype = Object.create(Instance.prototype)

	instanceFactory.prototype.__model = function () {
		return model
	}

	return instanceFactory
}

module.exports = Instance
