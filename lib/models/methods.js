const Instance = require('./instance')

const prototype = {}

prototype.count = function (query) {
	return this.client.count(this.name, query)
}

prototype.create = function (values) {
	return this.Instance(values)
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

// this is a bit of a doozy
// the instantiation parts probably belong in their own function
// I'm also still not 100% sure we should even support this functionality
prototype._save = function (instance) {
	// initialize references that are objects
	const toSave = []
	const savedFields = {}
	for (const field in this.references) {
		if (Array.isArray(this.references[field])) {
			let didSave = false
			const fieldSaves = instance[field].map(ref => {
				if (isRawObject(ref)) {
					didSave = true
					return this.references[field][0].model.Instance(ref).save()
				}
				return ref
			})
			if (didSave) {
				toSave.push(Promise.all(fieldSaves))
				savedFields[field] = null
			}
		}
		if (isRawObject(instance[field])) {
			instance[field] = this.references[field].model.Instance(instance[field])
			savedFields[field] = null
			toSave.push(instance[field].save())
		}
	}

	return Promise.all(toSave).then(saved => {
		let i = 0
		// push saved versions to instance / coerce back to an ID if it's a reference
		for (const field in this.savedFields) {
			if (Array.isArray(this.references[field]) && this.references[field][0].type === 'reference') {
				instance[field] = saved[i].map(ref => {
					return typeof ref === 'object' ? ref._id : ref
				})
			}
			if (this.references[field].type === 'reference') {
				instance[field] = saved[i]._id
			} else {
				instance[field] = saved[i]
			}
			i++
		}
	}).then(() => {
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
		console.log(saved)
		instance._id = saved._id
	}).then(() => {
		return promisifyHook(this.postsave, instance)
	}).then(() => {
		console.log(instance)
		return instance
	})
}

prototype.UPDATE = function (query, update) {
	return this.client.UPDATE(this.name, query, update)
}

module.exports = prototype
