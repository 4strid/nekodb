const Typeclass = require('./lib/typeclass')

prototype = {
	connect (db) {
		this.driver = MongoDBClient(db)
	}
}

const ko = new Proxy(Object.create(prototype), {
	get (target, name) {
		return name in target ? target[name] : new Error('whoops!')
	}
})


Object.assign(Model.prototype, {

})


function Models (db) {

	function register (schemas) {
		for (const name in schemas) {
			db.models[name] = Model(name, schemas[name])
			this.driver.create_collection(db.models[name])
		}
	}

	const models = new Proxy(register, {
		get (target, name) {
			return name in target ? target[name] : Model(name)
		}
	})

	return models
}



ko.models = Models()

ko.driver = NeDBClient()

function NeDBClient () {
	const o = Object.create(NeDBClient.prototype)
	o.db = {}
	return o
}

NeDBClient.prototype = {
	create_collection (model) {
		this.db[model.name] = new DataStore({
			filename: path.join(__dirname, 'db', name + '.db'),
			autoload: true,
		})
		if (model.schema.$$index) {
			for (const fieldName in schema.$$index) {
				const index = {
					fieldName
				}
				for (const prop in schema.$$index[fieldName]) {
					index[prop] = schema.$$index[fieldName][prop]
				}
				this.db[name].ensureIndex(index)
			}
		}
	},
	ready () {
		this.ready = true
		for (const op of fn.queue) {
			this.method_call(op)
		}
	}
}

ko.models({
	post: {
		user: ko.models.fuck
	}
})

module.exports = ko
