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

function joinOne ()

prototype._join = function (instance, field) {
	const modelRef = this.references[field]

	if(Array.isArray(modelRef)) {
		
	}

	const ref = instance[field]
	const query = ref instanceof Instance ? ref.get_id() : {_id: ref}

	return new Promise((resolve, reject) => {
		modelRef.model.findOne(query).then(ref => {
			instance[field] = ref
			resolve(instance)
		}).catch(err => {
			reject(err)
		})
	})
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
prototype._save = function (instance) {
	// initialize references that are objects
	const toSave = []
	const savedFields = {}
	for (const field in this.references) {
		if (Array.isArray(this.references[field])) {
			// PROCESS ALL REFERENCES IN ARRAY
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
		instance._id = saved._id
	}).then(() => {
		return promisifyHook(this.postsave, instance)
	}).then(() => {
		return instance
	})
}

prototype.UPDATE = function (query, update) {
	return this.client.UPDATE(this.name, query, update)
}

module.exports = prototype
