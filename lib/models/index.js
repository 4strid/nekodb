const Model = require('./model')

const proxytype = {}

function Models (client) {

	function register (schemas) {
		for (const name in schemas) {
			//models[name] = Model(name, client, schemas[name])
			register[name] = Model(name, client, schemas[name])
			client.createCollection(name)
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
		}
	})

	models.client = client

	//return register
	return models
}

module.exports = Models