const deepEqual = require('deep-equal')
const traverse = require('traverse')

const isRawObject = require('../util').isRawObject

// if any of these methods are called on an array, the array is modified beyond our ability to
// use native MongoDB array manipulation. Therefore the whole array must be replaced
const arrayModifyingMethods = ['fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']

function UpdateProxy (parent, field, target, typeclass) {
	// each proxy has its own _updates object which is also a proxy so that changes bubble up
	defineProp(target, '_updates', new Proxy({}, {
		set (target, prop, value) {
			parent._updates[field] = parent[field]
			target[prop] = value
			return true
		},
	}))
	if (target._proxied) {
		// reset all child proxies
		// might be better to try and use _updates to do this more efficiently
		traverse(target).forEach(function (target) {
			if (Array.isArray(target) || isRawObject(target)) {
				if (this.key !== undefined) {
					const parent = this.parent.node
					const field = this.key
					defineProp(target, '_updates', new Proxy({}, {
						set (target, prop, value) {
							parent._updates[field] = parent[field]
							target[prop] = value
							return true
						},
					}))
				}
			}
		})
		return target
	}
	// map any object elements in the target into proxies
	for (const field of Object.keys(target)) {
		if (Array.isArray(target[field]) || isRawObject(target[field])) {
			const typeField = Array.isArray(target) ? 0 : field
			target[field] = new UpdateProxy(target, field, target[field], typeclass.type[typeField])
		}
	}
	Object.defineProperty(target, '_proxied', {
		value: true,
	})
	return new Proxy(target, {
		get (target, prop) {
			if (Array.isArray(target)) {
				if (prop === '$push') {
					parent._updates[field] = parent[field]
					return function (push, options) {
						options = options || {}
						if (!('_$push' in target)) {
							defineProp(target, '_$push', [])
						}
						if (options.$slice) {
							defineProp(target, '_$slice', options.$slice)
						}
						if (options.$position) {
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
						$addToSet(target, add)
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
			}
			return target[prop]
		},
		set (target, prop, value) {
			const typeField = Array.isArray(target) ? 0 : prop
			if (Array.isArray(value) || isRawObject(value)) {
				target[prop] = new UpdateProxy(target, prop, value, typeclass.type[typeField])
			} else {
				target[prop] = typeclass.type[typeField].coerce(value)
			}
			// this will cause _updates to bubble up until they hit the instance
			target._updates[prop] = typeclass.type[typeField].coerce(value)
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

function $push (array, toPush, slice, position) {
	toPush = Array.isArray(toPush) ? toPush : [toPush]
	position = position === undefined ? array.length : position
	Array.prototype.splice.call(array, position, 0, ...toPush)
	if (slice) {
		Array.prototype.slice.call(array, 0, slice)
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
		if (filter.includes(array[i])) {
			Array.prototype.splice.call(array, i, 1)
		}
	}
}

module.exports = UpdateProxy
