const construction = require('./construction')
const type = require('./type')

const _String = require('./string')()
const _Number = require('./number')()
const _Date = require('./date')()
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
	if (typeof src === 'string') {
		return _String.constant(src)
	}
	if (Array.isArray(src)) {
		if (src.length === 1) {
			return construction.types.Array(Typeclass(src[0]))
		}
		return construction.types.Option(src.map(type => Typeclass(type)))
	}
	if (typeof src === 'object') {
		if (src === null) {
			return construction.types.null
		}
		const subtype = {}
		for (const prop in src) {
			subtype[prop] = Typeclass(src[prop])
		}
		return construction.types.Document(subtype)
	}
}

const types = {
	Array: function (type) {
		return construction.types.Array(Typeclass(type))
	},
	Option: construction.types.Option,
	Document: construction.types.Document,
	null: construction.types.null,
	String: _String,
	Number: _Number,
	Date: _Date,
	Boolean: construction.Typedef({
		type: Boolean
	}),
	Email: util.Email,
	URL: util.URL
}

Object.assign(Typeclass, construction, type, {
	types: types,
	// ... surely there must be a better way to do this
	registerModelConstructor: function (_Model) {
		Model = _Model
	}
})

module.exports = Typeclass
