const Instance = require('./instance')

const prototype = {}

prototype.count = function (query) {
	return this.client.count(this.name, query)
}

prototype.create = function (values) {
	return this.Instance(values, true)
}

prototype.deleteById = function (_id) {
	return this.client.deleteOne(this.name, {_id})
}

prototype.deleteMany = function (query) {
	return this.client.deleteMany(this.name, query)
}

prototype.deleteOne = function (query) {
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

function joinOne (instance, reference, field, modelRef, push) {
	const query = typeof reference === 'object' ? reference._id : {_id: reference}

	return new Promise((resolve, reject) => {
		modelRef.model.findOne(query).then(ref => {
			if (push) {
				instance[field].push(ref)
			} else {
				instance[field] = ref
			}
			resolve(instance)
		}).catch(err => {
			reject(err)
		})
	})
}

prototype._join = function (instance, field) {
	const modelRef = this.references[field]

	if(modelRef.isArray) {
		const refs = instance[field]
		instance[field] = []
		const joins = refs.map(ref => joinOne(instance, ref, field, modelRef, true))
		return Promise.all(joins).then(() => {
			return instance
		})
	}

	return joinOne(instance, instance[field], field, modelRef)
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
