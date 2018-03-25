const deepEqual = require('deep-equal')

const isRawObject = require('../util').isRawObject

// if any of these methods are called on an array, the array is modified beyond our ability to
// use native MongoDB array manipulation. Therefore the whole array must be replaced
const arrayModifyingMethods = ['fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']

function UpdateProxy (instance, field, target) {
	// first map any object elements in the target into Proxies
	if (Array.isArray(target)) {
		target.forEach((elem, i) => {
			if (Array.isArray(elem) || isRawObject(elem)) {
				target[i] = new UpdateProxy(instance, field, target[i])
			}
		})
	} else {
		for (const field of Object.keys(target)) {
			if (Array.isArray(target[field]) || isRawObject(target[field])) {
				target[field] = new UpdateProxy(instance, field, target[field])
			}
		}
	}
	return new Proxy(target, {
		get (target, prop) {
			if (Array.isArray(target)) {
				if (prop === '$push') {
					instance._updates[field] = instance[field]
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
					instance._updates[field] = instance[field]
					return function (direction) {
						defineProp(target, '_$pop', direction)
						$pop(target, direction)
					}
				}
				if (prop === '$addToSet') {
					instance._updates[field] = instance[field]
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
					instance._updates[field] = instance[field]
					return function (filter) {
						defineProp(target, '_$pull', filter)
						$pull(target, filter)
					}
				}
				if (arrayModifyingMethods.includes(prop)) {
					defineProp(target, '_replace', true)
					instance._updates[field] = instance[field]
				}
			}
			return target[prop]
		},
		set (target, prop, value) {
			if (Array.isArray(value) || isRawObject(value)) {
				target[prop] = new UpdateProxy(instance, field, value)
			} else {
				target[prop] = value
			}
			instance._updates[field] = instance[field]
			return true
		},
	})
}

function defineProp (obj, key, value) {
	Object.defineProperty(obj, key, {
		value: value,
		configurable: true,
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
