const construction = require('./construction')
const type = require('./type')

const _String = require('./string')()
const _Number = require('./number')()

const Typeclass = function (src) {
	if (src instanceof construction.Typeclass) {
		return src
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
		// do the thing
		if (src === null) {
			return construction.types.null
		}
	}
	return construction.Typeclass()
}

const types = {
	Array: construction.types.Array,
	Option: construction.types.Option,
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

Object.assign(Typeclass, construction, type, {
	types: types
})

module.exports = Typeclass
