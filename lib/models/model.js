const Typeclass = require('../typeclass')
const methodPrototype = require('./methods')

function Model (name, client, schema) {
	const o = Object.create(Model.prototype)
	o.name = name
	o.client = client
	o.schema = {}
	for (const field in schema) {
		o.schema[field] = Typeclass(schema[field])
	}
	o.schema._id = Typeclass([Typeclass.types.String, null])

	return o
}

Model.prototype = Object.create(methodPrototype)

Model.prototype.preprocess = function (record) {
	const o = {}
	this.addValues(o)
	this.forEachType(function (type, field) {
		if (type.check(record[field])) {
			o[field] = record[field]
		}
	})
	return o
}

Model.prototype.process = function (record) {
	const o = {}
	this.addValues(record)
	const errors = this.validate(record)
	if (errors) {
		return {
			$$errors: errors
		}
	}
	this.forEachType(function (_, field) {
		o[field] = record[field]
	})
	return o
}

Model.prototype.addValues = function (record) {
	this.forEachType(function (type, field) {
		if (type.value) {
			record[field] = value
		}
	})
}

Model.prototype.validate = function (record) {
	const errors = {}
	this.forEachType(function (type, field) {
		const value = record[field]
		if (!type.check(value)) {
			errors[field] = value
		}
	})
	if (Object.keys(errors).length === 0) {
		return null
	}
	return errors
}

Model.prototype.forEachType = function (fn) {
	for (const field in this.schema) {
		fn.call(this, this.schema[field], field)
	}
}

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
