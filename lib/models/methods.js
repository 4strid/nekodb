const Instance = require('./instance')

const prototype = {}

prototype.count = function (query) {
	return this.client.count(this.name, query)
}

prototype.create = function (values) {
	return this.Instance(values, true)
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

	if(Array.isArray(modelRef)) {
		const refs = instance[field]
		instance[field] = []
		const joins = refs.map(ref => joinOne(instance, ref, field, modelRef[0], true))
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
		if (this.references[field].type === 'reference') {
			if (instance[field] instanceof Instance) {
				instance[field] = instance[field]._id
			}
		}
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
		if (Array.isArray(this.references[field])) {
			let didSave = false
			const fieldSaves = instance[field].map(ref => {
				if (isRawObject(ref)) {
					didSave = true
					let refInstance = ref
					if (!(ref instanceof Instance)) {
						refInstance = this.references[field][0].model.create(ref)
					}
					return refInstance.save()
				}
				return ref
			})
			if (didSave) {
				savedFields.push(field)
				toSave.push(Promise.all(fieldSaves))
			}
		}
		if (isRawObject(instance[field])) {
			if (!(instance[field] instanceof Instance)) {
				instance[field] = this.references[field].model.create(instance[field])
			}
			savedFields.push(field)
			toSave.push(instance[field].save())
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
