const isRawObject = require('../util').isRawObject
const Instance = require('./instance')

const prototype = {}

prototype.count = function (query) {
	this.coerceQuery(query)
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
	return this.deleteOne({_id})
}

prototype.deleteMany = function (query) {
	this.coerceQuery(query)
	if (this._hasDeleteHooks()) {
		let instances
		let deletedCount
		return this.find(query).then(found => {
			instances = found
			return Promise.all(instances.map(instance => {
				return promisifyHook(this.predelete, instance)
			}))
		}).then(() => {
			this.client.deleteMany(this.name, query).then(count => {
				return deletedCount = count
			})
		}).then(() => {
			return Promise.all(instances.map(instance => {
				return promisifyHook(this.postdelete, instance)
			}))
		}).then(() => {
			return deletedCount
		})
	}
	return this.client.deleteMany(this.name, query)
}

prototype.deleteOne = function (query) {
	this.coerceQuery(query)
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
	this.coerceQuery(query)
	return this.client.find(this.name, query, projection, this)
}

prototype.findById = function (_id, projection) {
	return this.findOne({_id}, projection)
}

prototype.findOne = function (query, projection) {
	this.coerceQuery(query)
	return this.client.findOne(this.name, query, projection, this)
}

prototype._hasDeleteHooks = function () {
	return this.hasOwnProperty('predelete') || this.hasOwnProperty('postdelete')
}

prototype._joinOne = function (ref, model, projection) {
	if (ref === null || ref === undefined) {
		return Promise.resolve(null)
	}
	let query = {}
	if (ref instanceof this.client.ObjectID) {
		query._id = ref
	} else if (typeof ref === 'object') {
		query._id = ref._id
	} else {
		query._id = ref
	}
	return model.findOne(query, projection)
}

prototype._join = function (instance, field, projection) {
	// field may not exist due to a projection
	if (!(field in instance)) {
		return Promise.resolve(instance)
	}
	const modelRef = this.references[field]

	if (modelRef === undefined) {
		throw new ReferenceError(`'${field}' is not a reference field`)
	}

	if(modelRef.isArray) {
		const joins = instance[field].map(ref => {
			return this._joinOne(ref, modelRef.model, projection)
		})
		return Promise.all(joins).then(joined => {
			// add directly to values, do not cause an update
			instance[field] = joined
		}).then(() => instance).catch(err => {
			console.error(err)
		})
	}

	return this._joinOne(instance[field], modelRef.model, projection).then(joined => {
		// add directly to values, do not cause an update
		instance[field] = joined
	}).then(() => instance).catch(err => {
		console.error(err)
	})
}

function runOncreate (hook, instance) {
	if (instance.__original) {
		return promisifyHook(hook, instance)
	}
	return Promise.resolve()
}

function promisifyHook (hook, instance) {
	if (!hook) {
		return Promise.resolve()
	}
	let returnedPromise
	const promisified = new Promise((resolve, reject) => {
		returnedPromise = hook.call(null, instance, function (err) {
			if (err instanceof Error) {
				return reject(err)
			}
			resolve()
		})
	})
	return returnedPromise instanceof Promise ? returnedPromise : promisified
}

function resetArrays (instance) {
	for (const field in instance) {
		if (Array.isArray(instance[field])) {
			const array = instance[field]
			delete array._$push
			delete array._$slice
			delete array._$pop
			delete array._$addToSet
			delete array._$pull
		}
	}
}

function resetProxies (instance) {
	for (const field of Object.keys(instance)) {
		if (Array.isArray(instance[field]) ||
		    instance[field] instanceof Instance ||
			isRawObject(instance[field])) {
			instance[field] = instance[field]
			delete instance[field]._replace
		}
	}
}

prototype._save = function (instance) {
	// coerce reference instances to references so we can save instances that have been joined
	for (const field in this.references) {
		//const _replace = instance[field]._replace
		instance[field] = this.references[field].ifTypeProcess('reference', instance[field], reference => {
			if (isRawObject(reference)) {
				if (reference._id === undefined) {
					throw new ReferenceError('Could not coerce instance to a reference. Perhaps the _id field was omitted in a projection?')
				}
				return reference._id
			}
			return reference
		})
		// do not let this coersion create unnecessary array replacement
		//instance[field]._replace = _replace
	}
	return runOncreate(this.oncreate, instance).then(() => {
		return promisifyHook(this.prevalidate, instance)
	}).then(() => {
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
		resetArrays(instance)
		resetProxies(instance)
	}).then(() => {
		return promisifyHook(this.postsave, instance)
	}).then(() => {
		// copy _updates values into _values
		for (const field in instance._updates) {
			instance._values[field] = instance._updates[field]
		}
		// reset _updates to empty object
		Object.defineProperty(instance, '_updates', {
			value: {},
			configurable: true,
		})
		return instance
	})
}

prototype._saveRefs = function (instance) {
	const toSave = []
	const savedFields = []
	for (const field in this.references) {
		const i = toSave.length
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
				if (reference._partial) {
					throw new TypeError('Refusing to save a partial reference')
				}
				didSave = true
				return this.references[field].model.create(reference)
			}
		})
		if (didSave) {
			savedFields.push(field)
			if (Array.isArray(refInstance)) {
				toSave.push(Promise.all(refInstance.map(ref => ref.save())).catch(err => {
					err.index = i
					throw err
				}))
			} else {
				toSave.push(refInstance.save().catch(err => {
					err.index = i
					throw err
				}))
			}
		}
	}
	return Promise.all(toSave).then(saved => {
		for (let i = 0; i < savedFields.length; i++) {
			instance[savedFields[i]] = saved[i]
		}
		return instance
	}).catch(err => {
		// map encountered error to the field that failed
		if (isRawObject(err)) {
			const errorObj = {}
			errorObj[savedFields[err.index]] = err
			delete err.index
			throw errorObj
		}
		delete err.index
		throw err
	})
}

//prototype.UPDATE = function (query, update) {
	//return this.client.UPDATE(this.name, query, update)
//}

module.exports = prototype
