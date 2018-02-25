const Instance = require('./instance')

const prototype = {}

prototype.count = function (query) {
	return this.client.count(this.name, query)
}

prototype.create = function (values) {
	return this.Instance(values, true)
}

prototype.createIndex = function (field, options) {
	let fieldName = field
	if (typeof field === 'object') {
		options = field
		fieldName = options.fieldName
	}
	return this.client.createIndex(this.name, fieldName, options)
}

prototype.deleteById = function (_id) {
	return this.client.deleteOne(this.name, {_id})
}

prototype.deleteMany = function (query) {
	if (this._hasDeleteHooks()) {
		let instances
		let deletedCount
		return this.find(query).then(found => {
			instances = found
			return Promise.all(instances.map(instance => {
				return promisifyHook(this.predelete(instance))
			}))
		}).then(() => {
			this.client.deleteMany(this.name, query).then(count => {
				return deletedCount = count
			})
		}).then(() => {
			return Promise.all(instances.map(instance => {
				return promisifyHook(this.postdelete(instance))
			}))
		}).then(() => {
			return deletedCount
		})
	}
	return this.client.deleteMany(this.name, query)
}

prototype.deleteOne = function (query) {
	if (this._hasDeleteHooks()) {
		let instance
		let deletedCount
		return this.findOne(query).then(found => {
			instance = found
			return promisifyHook(this.predelete, instance)
		}).then(() => {
			this.client.deleteOne(this.name, query).then(count => {
				return deletedCount = count
			})
		}).then(() => {
			return promisifyHook(this.postdelete, instance)
		}).then(() => {
			return deletedCount
		})
	}
	return this.client.deleteOne(this.name, query)
}

prototype.find = function (query, projection) {
	return this.client.find(this.name, query, projection, this)
}

prototype.findById = function (_id, projection) {
	return this.client.findOne(this.name, {_id}, projection, this)
}

prototype.findOne = function (query, projection) {
	return this.client.findOne(this.name, query, projection, this)
}

prototype._hasDeleteHooks = function () {
	return this.hasOwnProperty('predelete') || this.hasOwnProperty('postdelete')
}

prototype._joinOne = function (ref, model) {
	let query = {}
	if (ref instanceof this.client.ObjectID) {
		query._id = ref
	} else if (typeof ref === 'object') {
		query._id = ref._id
	} else {
		query._id = ref
	}
	return model.findOne(query)
}

prototype._join = function (instance, field) {
	const modelRef = this.references[field]

	if(modelRef.isArray) {
		const joins = instance[field].map(ref => {
			return this._joinOne(ref, modelRef.model)
		})
		return Promise.all(joins).then(joined => {
			instance[field] = joined
		}).then(() => instance)
	}

	return this._joinOne(instance[field], modelRef.model).then(joined => {
		instance[field] = joined
	}).then(() => instance)
}

// this might be useful elsewhere
function isRawObject (obj) {
	if (obj instanceof Date || obj === null || Array.isArray(obj)) {
		return false
	}
	return typeof obj === 'object'
}

function promisifyHook (hook, instance) {
	return new Promise((resolve, reject) => {
		hook.call(instance, function (err) {
			if (err instanceof Error) {
				return reject(err)
			}
			resolve()
		})
	})
}

prototype._save = function (instance) {
	// coerce reference instances to references so we can save instances that have been joined
	for (const field in this.references) {
		instance[field] = this.references[field].ifTypeProcess('reference', instance[field], reference => {
			if (reference instanceof Instance) {
				return reference._id
			}
			return reference
		})
	}
	
	return promisifyHook(this.prevalidate, instance).then(() => {
		return this.validate(instance)
	}).then(() => {
		return promisifyHook(this.postvalidate, instance)
	}).then(() => {
		return promisifyHook(this.presave, instance)
	}).then(() => {
		return this.client.save(this.name, instance)
	}).then(saved => {
		if (instance.__original) {
			delete instance.__original
			instance._id = saved._id
		}
	}).then(() => {
		return promisifyHook(this.postsave, instance)
	}).then(() => {
		return instance
	})
}

prototype._saveRefs = function (instance) {
	const toSave = []
	const savedFields = []
	for (const field in this.references) {
		if (this.references[field].type === 'embedOnly') {
			continue
		}
		let didSave = false
		const refInstance = this.references[field].process(instance[field], reference => {
			if (reference instanceof Instance) {
				didSave = true
				return reference
			}
			if (isRawObject(reference)) {
				didSave = true
				return this.references[field].model.create(reference)
			}
		})
		if (didSave) {
			savedFields.push(field)
			if (Array.isArray(refInstance)) {
				toSave.push(Promise.all(refInstance.map(ref => ref.save())))
			} else {
				toSave.push(refInstance.save())
			}
		}
	}
	return Promise.all(toSave).then(saved => {
		for (let i = 0; i < savedFields.length; i++) {
			instance[savedFields[i]] = saved[i]
		}
		return instance
	})
}

prototype.UPDATE = function (query, update) {
	return this.client.UPDATE(this.name, query, update)
}

module.exports = prototype
