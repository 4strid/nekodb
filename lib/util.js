let ObjectID

function registerObjectID (objID) {
	ObjectID = objID
}

function isRawObject (value) {
	if (obj instanceof Date || obj === null || Array.isArray(obj) || obj instanceof ObjectID) {
		return false
	}
	return typeof obj === 'object'
}

module.exports = {
	registerObjectID,
	isRawObject,
}
