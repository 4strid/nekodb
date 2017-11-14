function getBasicType (value) {
	if (typeof value === 'string') {
		return String
	}
	if (typeof value === 'number') {
		return Number
	}
	if (typeof value === 'boolean') {
		return Boolean
	}
	if (value === null || value === undefined) {
		return null
	}
	if (typeof value === 'object') {
		if (value instanceof Date) {
			return Date
		}
	}
}

function compareTypes (type, compare) {
	if (type === getBasicType(compare)) {
		return true
	}
	if (Array.isArray(type)) {
		if (type.length === 1) {
			// type is an array. typecheck every element in the array
			return Array.isArray(compare) && compare.reduce(function (matches, elem) {
				return matches && compareTypes(type[0], elem)
			}, true)
		}
		// type is an option. check the value against each option
		return type.reduce(function (matches, option) {
			return matches || compareTypes(option, compare)
		}, false)
	}
	return false
}

module.exports = {
	getBasicType,
	compareTypes
}
