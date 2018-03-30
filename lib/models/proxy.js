const deepEqual = require('deep-equal')
const traverse = require('traverse')

const ModelReference = require('./reference')
const isRawObject = require('../util').isRawObject

function UpdateProxy (parent, field, target, typeclass) {
	if (Array.isArray(target)) {
		return ArrayProxy(parent, field, target, typeclass)
	}
	return ObjectProxy(parent, field, target, typeclass)
}

// if any of these methods are called on an array, the array is modified beyond our ability to
// use native MongoDB array manipulation. Therefore the whole array must be replaced
const arrayModifyingMethods = ['fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']

function ArrayProxy (parent, field, target, typeclass) {
	// each proxy has its own _updates object which is also a proxy so that changes bubble up
	define_updates(parent, field, target)
	if (target._proxied) {
		resetChildProxies(target)
		return target
	}
	// map any object elements in the target into proxies
	for (const field of Object.keys(target)) {
		if (Array.isArray(target[field])) {
			target[field] = ArrayProxy(target, field, target[field], typeclass.type[0])
		}
		if (isRawObject(target[field])) {
			target[field] = ObjectProxy(target, field, target[field], typeclass.type[0])
		}
	}
	Object.defineProperty(target, '_proxied', {
		value: true,
	})
	return new Proxy(target, {
		get (target, prop) {
			if (prop === '$push') {
				parent._updates[field] = parent[field]
				return function (push, options) {
					push = typeclass.coerce(push)
					options = options || {}
					if (!('_$push' in target)) {
						defineProp(target, '_$push', [])
					}
					if (options.$slice !== undefined) {
						defineProp(target, '_$slice', options.$slice)
					}
					if (options.$position !== undefined) {
						defineProp(target, '_$position', options.$position)
					}
					if (Array.isArray(push)) {
						for (const p of push) {
							target._$push.push(p)
						}
					} else {
						target._$push.push(push)
					}
					$push(target, push, options.$slice, options.$position)
				}
			}
			if (prop === '$pop') {
				parent._updates[field] = parent[field]
				return function (direction) {
					defineProp(target, '_$pop', direction)
					$pop(target, direction)
				}
			}
			if (prop === '$addToSet') {
				parent._updates[field] = parent[field]
				return function (add) {
					add = typeclass.coerce(add)
					if (!('_$addToSet' in target)) {
						defineProp(target, '_$addToSet', [])
					}
					if (Array.isArray(add)) {
						for (const a of add) {
							target._$addToSet.push(a)
						}
					} else {
						target._$addToSet.push(add)
					}
					$addToSet(target, typeclass.coerce(add))
				}
			}
			if (prop === '$pull') {
				parent._updates[field] = parent[field]
				return function (filter) {
					defineProp(target, '_$pull', filter)
					$pull(target, filter)
				}
			}
			if (arrayModifyingMethods.includes(prop)) {
				defineProp(target, '_replace', true)
				parent._updates[field] = parent[field]
			}
			if (prop === 'push') {
				return function (...elems) {
					return target.push(...typeclass.coerce(elems))
				}
			}
			if (prop === 'unshift') {
				return function (...elems) {
					return target.unshift(...typeclass.coerce(elems))
				}
			}
			if (prop === 'splice') {
				return function (start, numRemoved, ...elems) {
					return target.splice(start, numRemoved, ...typeclass.coerce(elems))
				}
			}
			return target[prop]
		},
		set (target, prop, value) {
			const coerced = typeclass.type[0].coerce(value)
			if (Array.isArray(value)) {
				target[prop] = ArrayProxy(target, prop, coerced, typeclass.type[0])
			} else if (isRawObject(value)) {
				target[prop] = ObjectProxy(target, prop, coerced, typeclass.type[0])
			} else {
				target[prop] = coerced
			}
			// this will cause _updates to bubble up until they hit the instance
			target._updates[prop] = coerced
			return true
		},
	})
}

function ObjectProxy (parent, field, target, typeclass) {
	if (typeclass.type instanceof ModelReference) {
		// pretend like it's a normal typeclass
		typeclass = {
			type: typeclass.type.model.schema,
		}
	}
	// each proxy has its own _updates object which is also a proxy so that changes bubble up
	define_updates(parent, field, target)
	if (target._proxied) {
		resetChildProxies(target)
		return target
	}
	// map any object elements in the target into proxies
	for (const field of Object.keys(target)) {
		if (Array.isArray(target[field])) {
			target[field] = ArrayProxy(target, field, target[field], typeclass.type[field])
		}
		if (isRawObject(target[field])) {
			target[field] = ObjectProxy(target, field, target[field], typeclass.type[field])
		}
	}
	Object.defineProperty(target, '_proxied', {
		value: true,
	})
	// Object proxy
	return new Proxy(target, {
		set (target, prop, value) {
			const coerced = typeclass.type[prop].coerce(value)
			if (Array.isArray(value)) {
				target[prop] = ArrayProxy(target, prop, coerced, typeclass.type[prop])
			} else if (isRawObject(value)) {
				target[prop] = ObjectProxy(target, prop, coerced, typeclass.type[prop])
			} else {
				target[prop] = coerced
			}
			// this will cause _updates to bubble up until they hit the instance
			target._updates[prop] = coerced
			return true
		},
	})
}

function defineProp (obj, key, value) {
	Object.defineProperty(obj, key, {
		value: value,
		configurable: true,
		//enumerable: true,
	})
}

function define_updates (parent, field, target) {
	defineProp(target, '_updates', new Proxy({}, {
		set (target, prop, value) {
			parent._updates[field] = parent[field]
			target[prop] = value
			return true
		},
	}))
}

function resetChildProxies (target) {
	// might be better to try and use _updates to do this more efficiently
	traverse(target).forEach(function (target) {
		if (Array.isArray(target) || isRawObject(target)) {
			if (this.key !== undefined) {
				const parent = this.parent.node
				const field = this.key
				define_updates(parent, field, target)
			}
		}
	})
}

// use Array.prototype.method.call to avoid triggering array replacement
function $push (array, toPush, slice, position) {
	toPush = Array.isArray(toPush) ? toPush : [toPush]
	position = position === undefined ? array.length : position
	Array.prototype.splice.call(array, position, 0, ...toPush)
	if (slice) {
		Array.prototype.splice.call(array, slice)
	}
}

function $addToSet (array, toAdd) {
	toAdd = Array.isArray(toAdd) ? toAdd : [toAdd]
	for (const add of toAdd) {
		let contains = false
		for (const elem of array) {
			if (deepEqual(add, elem, {strict: true})) {
				contains = true
			}
		}
		if (!contains) {
			Array.prototype.push.call(array, add)
		}
	}
}

function $pop (array, direction) {
	if (direction === 1) {
		Array.prototype.pop.call(array)
	} else if (direction === -1) {
		Array.prototype.shift.call(array)
	}
}

function $pull (array, filter) {
	if (isRawObject(filter)) {
		return
	}
	filter = Array.isArray(filter) ? filter : [filter]
	for (let i = array.length - 1; i >= 0; i--) {
		let toPull = false
		for (const f of filter) {
			if (deepEqual(array[i], f)) {
				toPull = true
			}
		}
		if (toPull) {
			Array.prototype.splice.call(array, i, 1)
		}
	}
}

module.exports = UpdateProxy
