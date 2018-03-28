const construction = require('./construction')
const type = require('./type')

const _String = require('./string')()
const _Number = require('./number')()
const _Date = require('./date')()
const _ObjectID = require('./objectid')
const util = require('./util')

const ModelReference = require('../models/reference')

let Model

const Typeclass = function (src) {
	if (src instanceof construction.Typeclass) {
		return src
	}
	if (src instanceof ModelReference) {
		return construction.types.Reference(src)
	}
	if (src instanceof Model || src instanceof Model.Stub) {
		return construction.types.Reference(src.reference())
	}
	if (typeof src === 'number') {
		return _Number.constant(src)
	}
	if (typeof src === 'string') {
		return _String.constant(src)
	}
	if (typeof src === 'boolean') {
		return types.Boolean.constant(src)
	}
	if (src instanceof Date) {
		return _Date.constant(src)
	}
	if (Array.isArray(src)) {
		if (src.length === 1) {
			return types.Array(src[0])
		}
		return types.Option(src)
	}
	if (typeof src === 'object') {
		if (src === null) {
			return construction.types.null
		}
		return types.Document(src)
	}
}

const types = {
	Array: function (type) {
		return construction.types.Array(Typeclass(type))
	},
	Option: function (types) {
		return construction.types.Option(types.map(type => Typeclass(type)))
	},
	Document: function (schema) {
		const subtype = {}
		for (const prop in schema) {
			subtype[prop] = Typeclass(schema[prop])
		}
		return construction.types.Document(subtype)
	},
	null: construction.types.null,
	String: _String,
	Number: _Number,
	Date: _Date,
	Boolean: construction.Typedef({
		type: Boolean,
	}),
	ObjectID: _ObjectID,
	Email: util.Email,
	URL: util.URL,
}

Object.assign(Typeclass, construction, type, {
	types: types,
	// ... surely there must be a better way to do this
	registerModelConstructor: function (_Model) {
		Model = _Model
	},
})

module.exports = Typeclass
