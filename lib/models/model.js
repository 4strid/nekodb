const Typeclass = require('../typeclass')
const methodPrototype = require('./methods')

const ModelReference = require('./reference')

Typeclass.registerModelConstructor(Model)

function Model (name, client, schema) {
	const o = Object.create(Model.prototype)
	o.name = name
	o.client = client
	o.additionalSteps = []
	if (schema) {
		o.schema = {}
		for (const field in schema) {
			o.schema[field] = Typeclass(schema[field])
			// schedule creation of embedded instances
			if (schema[field] instanceof ModelReference &&
				schema[field].type === 'embed') {
				o.additionalSteps.push(function (instance) {
					const embedded = schema[field].model.create(instance[field])
					return embedded.save().then(save => {
						return {
							field,
							embedded: save
						}
					})
				})
			}
		}
		// _id is optional because it might need to be created
		o.schema._id = Typeclass([Typeclass.types.String, null])
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

/*
 * // not used
 *Model.prototype.process = function (record) {
 *    const o = {}
 *    this.addValues(record)
 *    const errors = this.validate(record)
 *    if (errors) {
 *        return {
 *            $$errors: errors
 *        }
 *    }
 *    this.forEachType(function (_, field) {
 *        o[field] = record[field]
 *    })
 *    return o
 *}
 */

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

Object.defineProperties(Model.prototype, {
	ref: {
		get: function () {
			return this.reference
		}
	},
	reference: {
		get: function () {
			return new ModelReference(this, null, 'reference')
		}
	},
	embed: {
		get: function () {
			return new ModelReference(this, null, 'embed')
		}
	},
	embedOnly: {
		get: function () {
			return new ModelReference(this, null, 'embedOnly')
		}
	}
})

Model.Stub = function (models, name) {
	this.models = models
	this.name = name
}

Object.defineProperties(Model.Stub.prototype, {
	ref: {
		get: function () {
			return this.reference
		}
	},
	reference: {
		get: function () {
			return new ModelReference(null, this, 'reference')
		}
	},
	embed: {
		get: function () {
			return new ModelReference(null, this, 'embed')
		}
	},
	embedOnly: {
		get: function () {
			return new ModelReference(null, this, 'embedOnly')
		}
	}
})

//function ModelStub (name) {
	//// 'this' refers the the db creating the model
	//const o = Object.create(Model.fk_prototype)
	//o.path = this.name + '.' + name
	//return o
//}


//Model.fk_prototype = {

//}

//Model.prototype = Object.create(Model.fk_prototype)

module.exports = Model
