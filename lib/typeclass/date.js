const Typeclass = require('./construction').Typeclass
const MethodFactory = require('./construction').MethodFactory

function _Date () {
	const o = Object.create(_Date.prototype)
	o.__init()
	o.type = Date
	return o
}

_Date.prototype = Object.create(Typeclass.prototype)
_Date.prototype.constructor = _Date

_Date.prototype.after = MethodFactory(function (minDate) {
	if (!(minDate instanceof Date)) {
		throw new TypeError("min date must be a Date object")
	}
	this.validator = function (value) {
		return value >= minDate
	}
})

_Date.prototype.before = MethodFactory(function (maxDate) {
	if (!(maxDate instanceof Date)) {
		throw new TypeError("max date must be a Date object")
	}
	this.validator = function (value) {
		return value <= maxDate
	}
})

_Date.prototype.range = MethodFactory(function (min, max) {
	if (!(min instanceof Date) || !(max instanceof Date)) {
		throw new TypeError("min and max dates must be Date objects")
	}
	this.validator = function (value) {
		return value >= min && value <= max
	}
})

_Date.prototype.now = MethodFactory(function () {
	this.value = function () {
		return new Date()
	}
})

module.exports = _Date
