const construction = require('./construction')
const Typeclass = construction.Typeclass
const MethodFactory = construction.MethodFactory

function _Number () {
	const o = Object.create(_Number.prototype)
	o.__init()
	o.type = Number
	return o
}
_Number.prototype = Object.create(Typeclass.prototype)
_Number.prototype.constructor = _Number

_Number.prototype.min = MethodFactory(function (min) {
	this.minimum = min
	this.validator = function (value) {
		return value >= this.minimum
	}
})

_Number.prototype.max = MethodFactory(function (max) {
	this.maximum = max
	this.validator = function (value) {
		return value <= this.maximum
	}
})

_Number.prototype.minx = MethodFactory(function (min) {
	this.minimum = min
	this.validator = function (value) {
		return value > this.minimum
	}
})

_Number.prototype.maxx = MethodFactory(function (max) {
	this.maximum = max
	this.validator = function (value) {
		return value < this.maximum
	}
})

_Number.prototype.integer = MethodFactory(function () {
	this.validator = function (value) {
		return Number.isInteger(value)
	}
})

module.exports = _Number
