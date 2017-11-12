function Typedef (descriptor) {
	const o = Object.create(Typedef.prototype)
	Object.assign(o, descriptor)
	return o
}
Typedef.prototype.constructor = Typedef

function Typeclass (src) {
	if (src instanceof Typeclass) {
		return src
	}
	if (typeof src === 'string') {
		return typeclasses.String(src)
	}
	if (Array.isArray(src)) {
		if (src.length === 1) {
			return typeclasses.Array(Typeclass(src[0]))
		} else {
			return typeclasses.Option(src)
		}
	}
	const o = Object.create(Typeclass.prototype)
	if (src instanceof Typedef) {
		Object.assign(o, src)
		return o
	}
}
Typeclass.prototype.constructor = Typeclass
Typeclass.prototype.checkType = function (value) {
	if (this.value) {
		return value === undefined || value === null || value === this.value
	}
	if (this.validator) {
		return this.validator(value)
	}
	return Typeclass.compareTypes(this.type, value.getType())
	
}
Typeclass.Typedef = Typedef

Typeclass.getBasicType = function (value) {
	if (typeof value === 'string') {
		return String
	}
	if (typeof value === 'number') {
		return Number
	}
	if (typeof value === 'boolean') {
		return Boolean
	}
	if (value === null) {
		return null
	}
	if (typeof value === 'object') {
		if (value instanceof Date) {
			return Date
		}
	}
}
Typeclass.compareTypes = function (type, compare) {
	if (type === Typeclass.getBasicType(compare)) {
		return true
	}
	if (Array.isArray(type)) {
		if (type.length === 1) {
			return Array.isArray(compare) && compare.reduce(function (matches, elem) {
				return matches && Typeclass.compareTypes(type[0], elem)
			}, true)
		}
		else {
			return type.reduce(function (matches, option) {
				return matches || Typeclass.compareTypes(option, compare)
			}, false)
		}
	}
	return false
}

Typeclass.Factory = function (Constructor) {
	return function (...args) {
		const def = Typedef(new Constructor(...args))
		return Typeclass(def)
	}
}

Typeclass.classes = {
	Email: Typeclass({
		type: String,
		validator (value) {
			return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(value) // thanks w3c
		}
	}),
	Url: Typeclass({
		type: String,
		validator (value) {
			return true // come back to this
		}
	}),
	Array: Typeclass.Factory(function (type) {
		this.type = [Typeclass(type)]
	}),
	Option: Typeclass.Factory(function (types) {
		this.type = types.map(type => Typeclass(type))
	}),
	String: Typeclass.Factory(function (value) {
		this.type = String
		this.value = value
	}),
}

module.exports = Typeclass
