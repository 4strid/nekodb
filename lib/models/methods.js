const Instance = require('./instance')

const prototype = {}

prototype.count = function (query) {
	return this.client.count(this.name, query)
}

prototype.create = function (values) {
	return Instance(this, values)
}

prototype.deleteMany = function (query) {
	return this.client.deleteMany(this.name, query)
}

prototype.deleteOne = function (query) {
	return this.client.deleteOne(this.name, query)
}

prototype.find = function (query, projection) {
	return this.client.find(this.name, query, projection).then(documents => {
		return documents.map(document => Instance(this, document))
	})
}

prototype.findOne = function (query, projection) {
	return this.client.findOne(this.name, query, projection).then(document => {
		if (document === null) {
			return null
		}
		return Instance(this, document)
	})
}

prototype.save = function (instance) {
	return this.validate(instance).then(() => {
		// process additional steps (defined when the schema is created)
		return Promise.all(this.additionalSteps.map(f => f(instance))).then(results => {
			results.forEach(function (result) {
				instance[result.field] = result.embedded
			})
			return this.client.save(this.name, instance)
		}).then(save => {
			if (!instance.has_id()) {
				instance._id = save._id
			}
			return instance
		})
	})
}

prototype.UPDATE = function (query, update) {
	return this.client.UPDATE(this.name, query, update)
}

module.exports = prototype
