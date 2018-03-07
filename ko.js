const Typeclass = require('./lib/typeclass')
const Models = require('./lib/models')
const clients = require('./lib/clients')
const util = require('./lib/util')

const ko = Object.create(Typeclass.types)

ko.Typeclass = Typeclass
ko.Instance = Models.Instance

ko.connect = function (config) {
	this.client = new clients[config.client](config)
	util.registerObjectID(this.client.ObjectID)
	this.models = Models(this.client)
	this.Model = this.models.Model
}

ko.close = function () {
	this.client.close()
	this.client = null
	this.models = null
	this.Model = null
}

module.exports = ko
