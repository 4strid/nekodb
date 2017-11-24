const Instance = require('./instance')

const prototype = {}

prototype.create = function (values) {
	return Instance(this, values)
}

prototype.save = function (instance) {
	const errors = this.validate(instance)
	if (errors) {
		return Promise.reject(errors)
	}
	return this.client.save(this.name, instance).then(function (save) {
		console.log ('hello')
		if (!instance.has_id()) {
			console.log('goodbye')
			instance._id = save._id
		}
		return Promise.resolve(instance)
	})

}

prototype.find = function (query, projection) {
	return this.client.find(this.name, query, projection).then(documents => {
		return documents.map(document => Instance(this, document))
	})
}

prototype.findOne = function (query, projection) {
	return this.client.findOne(this.name, query, projection).then(document => {
		return Instance(this, document)
	})
}

module.exports = prototype
