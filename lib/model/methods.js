const Instance = require('./instance')

const prototype = {}

prototype.create = function (values) {
	return Instance(this, values)
}

prototype.save = function (instance) {
	return this.collection.save(instance)
}

module.exports = prototype
