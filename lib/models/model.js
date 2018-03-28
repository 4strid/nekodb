const traverse = require('traverse')

const Typeclass = require('../typeclass')
const methodPrototype = require('./methods')

const Instance = require('./instance')
const ModelReference = require('./reference')

const hooks = ['oncreate', 'prevalidate', 'postvalidate', 'presave', 'postsave', 'predelete', 'postdelete']

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
				throw new Error(hook + ' is not a valid hook')
			}
		}
		delete schema.$$hooks
	}

	if ('$$indices' in schema) {
		schema.$$indexes = schema.$$indices
		delete schema.$$indices
	}

	if ('$$indexes' in schema) {
		const indexes = Object.keys(schema.$$indexes).map(field => {
			o.createIndex(field, schema.$$indexes[field])
		})
		delete schema.$$indexes
		Promise.all(indexes).catch(err => {
			throw err
		})
	}

	if (!('_id' in schema)) {
		// ObjectID by default. Can be overriden. The typeclass handles the null case directly.
		o.schema._id = Typeclass.types.ObjectID(client.ObjectID)
	}
	for (const field in schema) {
		const type = schema[field]
		const typeclass = Typeclass(type)
		o.schema[field] = typeclass
		if (typeclass.type instanceof ModelReference) {
			o.references[field] = typeclass.type
		} 
		//lord this is convoluted
		if (typeclass.type[0] && typeclass.type[0].type instanceof ModelReference) {
			typeclass.type[0].type.isArray = true
			o.references[field] = typeclass.type[0].type
		}
	}
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

Model.prototype.coerce = function (field, value) {
	return this.schema[field].coerce(value)
}

Model.prototype.coerceQuery = function (query) {
	const schema = this.schema
	const ObjectID = this.client.ObjectID
	// traverse the query and transform only leaf nodes
	traverse(query).forEach(function (value) {
		const field = this.path.filter(segment => {
			if (segment === '$and') return false
			if (segment === '$or') return false
			if (segment === '$not') return false
			if (segment === '$nor') return false
			return true
		})[0]
		if (this.isLeaf) {
			// ObjectIDs are Objects and so they will not be a leaf node. the leaf nodes should be ignored
			if (this.parent.node instanceof ObjectID) return
			// certain queries should not be coerced
			if (field === '$expr') return
			if (field === '$text') return
			if (field === '$where') return
			if (field === '$jsonSchema') return
			if (this.key === '$regex') return
			if (this.key === '$exists') return
			if (this.key === '$type') return
			if (this.key === '$size') {
				this.update(Number(value))
				return
			}
			if (this.key === '$near') return
			if (this.key === '$geoIntersects') return
			if (this.key === '$geoWithin') return
			if (this.key === '$nearSphere') return
			this.update(schema[field].coerce(value))
		}
	})
	const util = require('util')
	console.log(util.inspect(query, false, null))
}

Model.prototype.validate = function (record) {
	return new Promise((resolve, reject) => {
		const errors = {}
		const promises = []
		for (const field in record._updates) {
			const type = this.schema[field]
			let value = record[field]
			promises.push(type.check(value).then(result => {
				return {
					field,
					value,
					result,
				}
			}))
		}
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
