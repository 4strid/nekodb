// returns a Mongo update query
function processUpdates (field, value, $positionSupported) {
	// process array operators
	if (value._replace) {
		return construct('$set', field, value)
	}
	if (value._$push) {
		// nedb does not support the position operator, fallback to replacing the array
		if (value._$position && !$positionSupported) {
			return construct('$set', field, value)
		} else {
			const val = { $each: value._$push }
			if (value._$slice) {
				val.$slice = value._$slice
			}
			if (value._$position) {
				val.$position = value._$position
			}
			return construct('$push', field, val)
		}
	} else if (value._$pop) {
		return construct('$pop', field, value._$pop)
	} else if (value._$addToSet) {
		return construct('$addToSet', field, {$each: value._$addToSet})
	} else if (value._$pull) {
		let val = value._$pull
		if (Array.isArray(value._$pull)) {
			val = {$in: value._$pull}
		}
		return construct('$pull', field, val)
	} else {
		// otherwise just set the value
		const updates = {$set: {}}
		const subupdates = traverseUpdates(field, value)
		for (const update in subupdates) {
			updates.$set[update] = subupdates[update]
		}
		return updates
	}
}

function construct (method, field, value) {
	const update = {}
	update[method] = {}
	update[method][field] = value
	return update
}

function traverseUpdates (field, value) {
	const updates = {}
	if (value._updates === undefined || Object.keys(value._updates).length === 0) {
		updates[field] = value
		return updates
	}
	for (const subfield in value._updates) {
		const subupdates = traverseUpdates(subfield, value._updates[subfield])
		for (const subupdate in subupdates) {
			updates[field + '.' + subupdate] = subupdates[subupdate]
		}
	}
	return updates
}

module.exports = processUpdates
