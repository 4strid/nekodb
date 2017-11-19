const type = require('./type')

function Typeclass (type) {
	const o = Object.create(Typeclass.prototype)
	o.__init()
	o.type = type
	return o
}

Typeclass.prototype.constructor = Typeclass

Typeclass.prototype.check = function (value) {
	if (type.isOption(this.type)) {
		return this.type.reduce(function (matches, type) {
			return matches || type.check(value)
		}, false)
	}
	if (type.isArray(this.type)) {
		return Array.isArray(value) && value.reduce(function (matches, elem) {
			return matches && this.type[0].check(elem)
		}, true)
	}
	if (this.type === type.getBasicType(value)) {
		return this.validators.reduce((valid, validator) => {
			return valid && validator.call(this, value)
		}, true)
	}
	return false
}

Typeclass.prototype.__init = function (src) {
	this.type = undefined
	this.value = undefined
	this.validators = []
	Object.assign(this, src)
}

Typeclass.prototype.__instance = function () {
	if (this.__instanced) {
		return this
	}
	const o = new this.constructor()
	return Object.assign(o, this, {
		__instanced: true,
		validators: [...this.validators]
	})
	return o
}

Object.defineProperty(Typeclass.prototype, 'validator', {
	set: function (validator) {
		this.validators.push(validator)
	}
})

Typeclass.prototype.constant = MethodFactory(function (value) {
	this.value = value
	this.validator = function (value) {
		return value === this.value
	}
	return this.optional()
})

Typeclass.prototype.optional = MethodFactory(function () {
	return types.Option([this, types.null])
})

function Factory (Constructor) {
	return function (...args) {
		return Typedef(new Constructor(...args))
	}
}

function MethodFactory (method) {
	return function (...args) {
		const o = this.__instance()
		const result = method.call(o, ...args)
		return result || o
	}
}

function Typedef (def) {
	const o = Typeclass()
	Object.assign(o, def)
	return o
}

const types = {
	Array: Factory(function (type) {
		this.type = [type]
	}),
	Option: Factory(function (types) {
		this.type = types
	}),
	null: Typeclass(null),
}

module.exports = {
	Typeclass,
	Typedef,
	Factory,
	MethodFactory,
	types,
}
