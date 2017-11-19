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

function isArray (type) {
	return Array.isArray(type) && type.length === 1
}

function isOption (type) {
	return Array.isArray(type) && type.length > 1
}

module.exports = {
	getBasicType,
	isArray,
	isOption
}
