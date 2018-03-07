let ObjectID

function registerObjectID (objID) {
	ObjectID = objID
}

function isRawObject (obj) {
	if (obj instanceof Date ||
		obj === null ||
		Array.isArray(obj) ||
		obj instanceof Error ||
		obj instanceof ObjectID) {
		return false
	}
	return typeof obj === 'object'
}

module.exports = {
	registerObjectID,
	isRawObject,
}
