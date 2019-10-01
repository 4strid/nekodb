const Model = require('./model')
const Instance = require('./instance')

const proxytype = {}

proxytype.Model = function (name, schema, config) {
	this.__client.createCollection(name, config)
	this[name] = Model(name, this.__client, schema)

	return this[name]
}

function Models (client) {

	function register (schemas) {
		for (const name in schemas) {
			client.createCollection(name)
			models[name] = Model(name, client, schemas[name])
		}
	}

	const models = new Proxy(register, {
		get (target, name) {
			if (name in target) {
				return target[name]
			}
			if (typeof name === 'symbol') {
				return target[name]
			}
			if (name in proxytype) {
				return function (...args) {
					return proxytype[name].apply(target, args)
				}
			}
			return new Model.Stub(models, name)
		},
	})

	models.__client = client

	//return register
	return models
}

Models.Instance = Instance

module.exports = Models
