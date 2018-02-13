const construction = require('./construction')
const type = require('./type')

const _String = require('./string')()
const _Number = require('./number')()

const ModelReference = require('../models/reference')

const Typeclass = function (src) {
	if (src instanceof construction.Typeclass) {
		return src
	}
	if (src instanceof Model) {
		return construction.types.Reference(src.reference)
	}
	if (src instanceof ModelReference) {
		return construction.types.Reference(src)
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
	// empty typeclass in case everything is in the Typedef
	return Typeclass()
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
	//Email: construction.Typedef({
		//type: String,
		//validator: function (value) {
			//return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(value) // thanks w3c
		//}
	//}),
	//Url: construction.Typedef({
		//type: String,
		//validator: function (value) {
			//return true // come back to this
		//}
	//}),
}

let Model

Object.assign(Typeclass, construction, type, {
	types: types,
	registerModelConstructor: function (_Model) {
		Model = _Model
	}
})

module.exports = Typeclass
