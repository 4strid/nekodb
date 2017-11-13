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
	if (typeof src === 'object') {
		o.type = undefined
		o.value = undefined
		o.validator = undefined
		Object.assign(o, src)
		return o
	}
}

Typeclass.prototype.constructor = Typeclass
Typeclass.prototype.check = function (value) {
	if (this.value) {
		return value === undefined || value === null || value === this.value
	}
	if (this.validator) {
		return this.validator(value)
	}
	return Typeclass.compareTypes(this.type, value)
}

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
		return Typeclass(new Constructor(...args))
	}
}


const _String = new Proxy(Typeclass({
	type: String
}), {
	get (target, name) {
		if (name in target) {
			return target[name]
		}
		const length = Number(name)
		if (Number.isNaN(length)) {
			throw new TypeError()
		}
		return _String.length(length)
	}
})

Object.assign(_String, {
	constant: Typeclass.Factory(function (value) {
		this.type = String
		this.value = value
	}),
	length: Typeclass.Factory(function (length) {
		this.type = String
		this.length = length
		this.validator = function (value) {
			return value.length <= this.length
		}
	})
})

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
	String: _String,
	Number: Typeclass({
		type: Number
	})
}

module.exports = Typeclass
