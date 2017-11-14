const construction = require('./construction')
const Typeclass = construction.Typeclass
const MethodFactory = construction.MethodFactory

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
		const length = Number(name)
		if (Number.isNaN(length)) {
			return target[name]
		}

		return _String().maxlength(length)
	}
})
_String.prototype.constructor = _String
_String.prototype.maxlength = MethodFactory(function (length) {
	this.length = length
	this.validator = function (value) {
		return value.length <= this.length
	}
})

module.exports = _String
