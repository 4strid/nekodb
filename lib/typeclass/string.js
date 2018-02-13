const Typeclass = require('./construction').Typeclass
const MethodFactory = require('./construction').MethodFactory

function _String () {
	const o = Object.create(_String.prototype)
	o.__init()
	o.type = String
	return o
}
_String.prototype = new Proxy(Object.create(Typeclass.prototype), {
	get (target, name) {
		if (name in target) {
			return target[name]
		}
		if (typeof name === 'symbol') {
			return target[name]
		}
		const length = Number(name)
		if (Number.isNaN(length)) {
			return target[name]
		}

		return _String().maxlength(length)
	}
})
_String.prototype.constructor = _String

_String.prototype.maxlength = MethodFactory(function (length) {
	this.validator = function (value) {
		return value.length <= length
	}
})

_String.prototype.length = MethodFactory(function (min, max) {
	this.validator = function (value) {
		return value.length >= min && value.length <= max
	}
})

_String.prototype.match = MethodFactory(function (regex) {
	this.validator = function (value) {
		return regex.test(value)
	}
})

module.exports = _String
