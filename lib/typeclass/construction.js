const type = require('./type')

function Typeclass () {
	const o = Object.create(Typeclass.prototype)
	o.__init()
	return o
}

Typeclass.prototype.constructor = Typeclass

Typeclass.prototype.check = function (value) {
	if (type.compareTypes(this.type, value)) {
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
	this.optional()
	this.validator = function (value) {
		return value === undefined || value === null || value === this.value
	}
})

Typeclass.prototype.optional = MethodFactory(function () {
	this.type = [this.type, null]
})

function Factory (Constructor) {
	return function (...args) {
		return Typedef(new Constructor(...args))
	}
}

function MethodFactory (method) {
	return function (...args) {
		const o = this.__instance()
		method.call(o, ...args)
		return o
	}
}

function Typedef (def) {
	const o = Typeclass()
	Object.assign(o, def)
	return o
}

const classes = {
	Array: Factory(function (type) {
		this.type = [type]
	}),
	Option: Factory(function (types) {
		this.type = types
	}),
}

module.exports = {
	Typeclass,
	Typedef,
	Factory,
	MethodFactory,
	classes,
}
