const Typeclass = require('./construction').Typeclass

function _ObjectID (ObjectID) {
	const o = Object.create(_ObjectID.prototype)
	o.__init()
	o.type = ObjectID
	return o
}

_ObjectID.prototype = Object.create(Typeclass.prototype)

_ObjectID.prototype.constructor = _ObjectID

_ObjectID.prototype.check = function (value) {
	if (value === null || value === undefined) {
		// null values are ok
		return Promise.resolve(true)
	}
	// nedb
	if (this.type === String) {
		return Promise.resolve(typeof value === 'string')
	} else {
		// mongodb
		return Promise.resolve(value instanceof this.type)
	}
}

_ObjectID.prototype.coerce = function (value) {
	// nedb
	if (value === null || value === undefined) {
		return value
	}
	if (this.type === String) {
		return String(value)
	} else {
		// mongodb
		if (value instanceof this.type) {
			return value
		}
		return this.type(value)
	}
}

module.exports = _ObjectID
