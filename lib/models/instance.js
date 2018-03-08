const isRawObject = require('../util').isRawObject

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

function UpdateProxy (instance, field, target) {
	// first map any object elements in the target into Proxies
	if (Array.isArray(target)) {
		target.forEach((elem, i) => {
			if (Array.isArray(elem) || isRawObject(elem)) {
				target[i] = new UpdateProxy(instance, field, target[i])
			}
		})
	} else {
		for (const field of Object.keys(target)) {
			if (Array.isArray(target[field]) || isRawObject(target[field])) {
				target[field] = new UpdateProxy(instance, field, target[field])
			}
		}
	}
	return new Proxy(target, {
		get (target, prop) {
			return target[prop]
		},
		set (target, prop, value) {
			if (Array.isArray(value) || isRawObject(value)) {
				target[prop] = new UpdateProxy(instance, field, value)
			} else {
				target[prop] = value
			}
			instance._updates[field] = instance[field]
			return true
		},
	})
}

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
					if (Array.isArray(value) ||
					    value instanceof Instance ||
					    isRawObject(value)) {
						this._updates[field] = new UpdateProxy(o, field, value)
						return
					}
					this._updates[field] = value
				}
			})
			if (original === true) {
				o[field] = processed[field]
			}
			else if (Array.isArray(processed[field]) ||
					   processed[field] instanceof Instance ||
					   isRawObject(processed[field])) {
				o._values[field] = new UpdateProxy(o, field, processed[field])
			} else {
				o._values[field] = processed[field]
			}
			if (model.references[field]) {
				const reference = model.references[field].ifTypeProcess('embed', o[field], reference => {
					return model.references[field].model.Instance(reference)
				})
				if (Array.isArray(reference) || reference instanceof Instance) {
					o._values[field] = new UpdateProxy(o, field, reference)
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
