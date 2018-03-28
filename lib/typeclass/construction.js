const type = require('./type')

const ModelReference = require('../models/reference')

function Typeclass (type) {
	const o = Object.create(Typeclass.prototype)
	o.__init()
	o.type = type
	return o
}

Typeclass.prototype.constructor = Typeclass

Typeclass.prototype.check = function (value) {
	if (this.type instanceof ModelReference) {
		return this.type.validate(value)
	}
	if (this.type === type.getBasicType(value)) {
		return Promise.resolve(this.validators.reduce((valid, validator) => {
			return valid && validator.call(this, value)
		}, true))
	}
	return new Promise((resolve, reject) => {
		if (type.isOption(this.type)) {
			const promises = this.type.map(type => type.check(value))
			Promise.all(promises).then(matches => {
				// one must match
				resolve(matches.includes(true))
			}).catch(err => {
				reject(err)
			})
			return
		}
		if (type.isArray(this.type)) {
			if (!Array.isArray(value)) {
				return resolve(false)
			}
			const promises = value.map(elem => this.type[0].check(elem))
			Promise.all(promises).then(matches => {
				// all must match
				const valuesPass = !matches.includes(false)
				const validatorsPass = this.validators.reduce((valid, validator) => {
					return valid && validator.call(this, value)
				}, true)
				resolve(valuesPass && validatorsPass)
			})
			return
		}
		if (typeof this.type === 'object') {
			if (typeof value !== 'object') {
				return resolve(false)
			}
			// check each field
			const promises = []
			for (const prop of Object.keys(this.type)) {
				promises.push(this.type[prop].check(value[prop]))
				//if (!this.type[prop].check(value[prop])) {
					//return resolve(false)
				//}
			}
			Promise.all(promises).then(matches => {
				// all must match
				resolve(!matches.includes(false))
			})
			return
		}
		resolve(false)
	})
}

Typeclass.prototype.coerce = function (value) {
	if (this.type instanceof ModelReference) {
		if (this.type.type === 'reference') {
			// if it's an object, we're going to saveRefs it, so it should not be coerced now
			// or it's an ObjectID in which case we don't need to coerce it anyway
			if (typeof value === 'object') {
				return value
			}
			return this.type.model.schema._id.coerce(value)
		}
		if (this.type.type === 'embed' || this.type.type === 'embedOnly') {
			for (const field of Object.keys(value)) {
				value[field] = this.type.model.coerce(field, value[field])
			}
			return value
		}
	}
	if (this.type === Boolean) {
		if (value === 'true') {
			return true
		}
		if (value === 'false') {
			return false
		}
		return Boolean(value)
	}
	if (this.type === String) {
		return String(value)
	}
	if (this.type === Number) {
		return Number(value)
	}
	if (this.type === Date) {
		return new Date(value)
	}
	if (type.isArray(this.type)) {
		if (Array.isArray(value)) {
			return value.map(val => this.type[0].coerce(val))
		}
		return this.type[0].coerce(value)
	}
	// in the interest of keeping coerce synchronous, we will not perform type coersion on Option types
	// currently it's impossible to determine which type the value should be coerced to in a synchronous way
	if (type.isOption(this.type)) {
		return value
	}
	if (typeof this.type === 'object') {
		for (const prop of Object.keys(this.type)) {
			value[prop] = this.type[prop].coerce(value[prop])
		}
		return value
	}
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
		validators: [...this.validators],
	})
}

Object.defineProperty(Typeclass.prototype, 'validator', {
	set: function (validator) {
		this.validators.push(validator)
	},
})

Typeclass.prototype.default = MethodFactory(function (value) {
	this.value = value
})

Typeclass.prototype.validate = MethodFactory(function (validator) {
	this.validator = validator
})

Typeclass.prototype.extend = MethodFactory(function (extend) {
	if (typeof extend === 'function') {
		extend.call(this)
	} else {
		if (extend.value) {
			this.value = extend.value
		}
		if (extend.validator) {
			this.validator = extend.validator
		}
		if (extend.validators) {
			extend.validators.forEach(validator => {
				this.validator = validator
			})
		}
	}
})

Typeclass.prototype.constant = MethodFactory(function (value) {
	this.value = value
	this.validator = function (value) {
		return value === this.value
	}
})

Typeclass.prototype.optional = MethodFactory(function () {
	return types.Option([this, types.null])
})

Typeclass.prototype._isArray = function () {
	return type.isArray(this.type)
}

Typeclass.prototype._isDocument = function () {
	return type.isDocument(this.type)
}

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

function ArrayType (type) {
	const o = Object.create(ArrayType.prototype)
	o.__init()
	o.type = [type]
	return o
}

ArrayType.prototype = Object.create(Typeclass.prototype)

ArrayType.prototype.notEmpty = MethodFactory(function () {
	this.validator = function (value) {
		return value.length > 0
	}
})

const types = {
	Array: ArrayType,
	Option: Factory(function (types) {
		this.type = types
	}),
	Document: Factory(function (subtype) {
		this.type = subtype
	}),
	Reference: Factory(function (ref) {
		this.type = ref
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
