const isRawObject = require('../util').isRawObject
const UpdateProxy = require('./proxy')

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

Instance.prototype.isUpdated = function (field) {
	return field in this._updates
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
	const joins = []
	if (Array.isArray(fields)) {
		for (const field of fields) {
			joins.push(this._model._join(this, field))
		}
	// nothing was passed in: fully join all fields
	} else if (fields === undefined) {
		for (const field of Object.keys(this.model.references)) {
			joins.push(this._model._join(this, field))
		}
	} else {
		// object containing projections was passed in
		for (const field in fields) {
			// this.joined[field] is the projection to use when joining
			joins.push(this.model._join(this, field, fields[field]))
		}
	}
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

		// storage object for getters / setters
		Object.defineProperty(o, '_values', {
			value: {},
		})
		// only fields that have been updated will be validated / saved
		Object.defineProperty(o, '_updates', {
			value: {},
			configurable: true,
		})

		const processed = model.preprocess((values || {}))
		for (const field in processed) {
			Object.defineProperty(o, field, {
				configurable: true,
				enumerable: true,
				get () {
					return this._updates[field] === undefined ? this._values[field] : this._updates[field]
				},
				set (value) {
					const coerced = model.coerce(field, value)
					if (Array.isArray(value) ||
					    isRawObject(value)) {
						this._updates[field] = new UpdateProxy(o, field, coerced, model.schema[field])
						Object.defineProperty(this._updates[field], '_replace', {
							value: true,
							configurable: true,
						})
						return
					}
					this._updates[field] = coerced
				},
			})
			if (original === true) {
				o[field] = processed[field]
			} else if (Array.isArray(processed[field]) ||
					   isRawObject(processed[field])) {
				o._values[field] = new UpdateProxy(o, field, processed[field], model.schema[field])
			} else {
				o._values[field] = processed[field]
			}
			if (model.references[field]) {
				const reference = model.references[field].ifTypeProcess('embed', o[field], reference => {
					return model.references[field].model.Instance(reference)
				})
				if (Array.isArray(reference) || reference instanceof Instance) {
					o._values[field] = new UpdateProxy(o, field, reference, model.schema[field])
				} else {
					o._values[field] = reference
				}
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
