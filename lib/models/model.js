const Typeclass = require('../typeclass')
const methodPrototype = require('./methods')

const Instance = require('./instance')
const ModelReference = require('./reference')

const hooks = ['prevalidate', 'postvalidate', 'presave', 'postsave', 'predelete', 'postdelete']

Typeclass.registerModelConstructor(Model)

function Model (name, client, schema) {
	const o = Object.create(Model.prototype)
	o.name = name
	o.client = client
	o.schema = {}
	o.references = {}
	o.Instance = Instance.ClassFactory(o)

	if ('$$hooks' in schema) {
		for (const hook in schema.$$hooks) {
			if (hooks.includes(hook)) {
				o[hook] = schema.$$hooks[hook]
			} else {
				throw new Error(hook + " is not a valid hook")
			}
		}
		delete schema.$$hooks
	}

	for (const field in schema) {
		const type = schema[field]
		const typeclass = Typeclass(type)
		o.schema[field] = typeclass
		// surely there is a better way to check that it's an array of References
		if (typeclass.type instanceof ModelReference || typeclass.type[0] && typeclass.type[0].type instanceof ModelReference) {
			o.references[field] = typeclass.type
		}
	}
	// _id is optional because it might need to be created
	o.schema._id = Typeclass([Typeclass.types.String, Typeclass.types.Number, null])
	return o
}

Model.prototype = Object.create(methodPrototype)

Model.prototype.preprocess = function (record) {
	const o = {}
	this.addValues(o)
	this.forEachType(function (type, field) {
		if (record[field] !== undefined) {
			o[field] = record[field]
		}
	})
	return o
}

Model.prototype.addValues = function (record) {
	this.forEachType(function (type, field) {
		if (typeof type.value === 'function') {
			return record[field] = type.value()
		}
		record[field] = type.value
	})
}

Model.prototype.validate = function (record) {
	return new Promise((resolve, reject) => {
		const errors = {}
		const promises = []
		this.forEachType(function (type, field) {
			const value = record[field]
			promises.push(type.check(record[field]).then(result => {
				return {
					field,
					value,
					result
				}
			}))
		})
		Promise.all(promises).then(outcomes => {
			outcomes.forEach(out => {
				// result is a model type check that failed
				if (typeof out.result === 'object') {
					return errors[out.field] = out.result
				}
				// else result is a boolean: true is passing, false is failing
				if (out.result === true) {
					return
				}
				errors[out.field] = out.value
			})
			if (Object.keys(errors).length === 0) {
				return resolve()
			}
			reject(errors)
		})
	})
}

Model.prototype.forEachType = function (fn) {
	for (const field in this.schema) {
		fn.call(this, this.schema[field], field)
	}
}

Model.prototype.reference = function () {
	return new ModelReference(this, null, 'reference')
}

Model.prototype.ref = Model.prototype.reference

Model.prototype.embed = function () {
	return new ModelReference(this, null, 'embed')
}

Model.prototype.embedOnly = function () {
	return new ModelReference(this, null, 'embedOnly')
}

// default hooks
Model.prototype.prevalidate = function (next) {
	next()
}

Model.prototype.postvalidate = function (next) {
	next()
}

Model.prototype.presave = function (next) {
	next()
}

Model.prototype.postsave = function (next) {
	next()
}

Model.prototype.predelete = function (next) {
	next()
}

Model.prototype.postdelete = function (next) {
	next()
}

// ----------------- Model.Stub ---------------

Model.Stub = function (models, name) {
	this.models = models
	this.name = name
}

Model.Stub.prototype.reference = function () {
	return new ModelReference(null, this, 'reference')
}

Model.Stub.prototype.ref = Model.Stub.prototype.reference

Model.Stub.prototype.embed = function () {
	return new ModelReference(null, this, 'embed')
}

Model.Stub.prototype.embedOnly = function () {
	return new ModelReference(null, this, 'embedOnly')
}

module.exports = Model
