const Model = require('./model')

function Models (client) {

	function register (schemas) {
		for (const name in schemas) {
			//models[name] = Model(name, client, schemas[name])
			register[name] = Model(name, client, schemas[name])
			client.createCollection(name)
		}
	}

	//const models = new Proxy(register, {
		//get (target, name) {
			//if (name in target) {
				//return target[name]
			//}
			//if (typeof name === 'symbol') {
				//return target[name]
			//}
			//return Model(name, client)
		//}
	//})

	Object.defineProperty(register, 'client', {
		value: client
	})

	//return models
	return register
}

module.exports = Models
