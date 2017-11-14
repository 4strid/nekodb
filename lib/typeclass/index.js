const construction = require('./construction')
const type = require('./type')

const _String = require('./string')()
const _Number = require('./number')()

const classes = construction.classes

const Typeclass = function (src) {
	if (src instanceof construction.Typeclass) {
		return src
	}
	if (typeof src === 'string') {
		return _String.constant(src)
	}
	if (Array.isArray(src)) {
		if (src.length === 1) {
			return classes.Array(Typeclass(src[0]))
		}
		return classes.Option(src.map(type => Typeclass(type)))
	}
	if (typeof src === 'object') {
		// do the thing
	}
	return construction.Typeclass()
}

Object.assign(classes, {
	Email: Typeclass({
		type: String,
		validator: function (value) {
			return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(value) // thanks w3c
		}
	}),
	Url: Typeclass({
		type: String,
		validator: function (value) {
			return true // come back to this
		}
	}),
	String: _String,
	Number: _Number
})

Object.assign(Typeclass, construction, type, {
	classes: classes
})

module.exports = Typeclass
