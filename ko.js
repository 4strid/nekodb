const Typeclass = require('./lib/typeclass')
const Models = require('./lib/models')
const NeDBClient = require('./lib/client/nedb')

const chain = Object.create(Typeclass.types)

ko = Object.create(chain)

ko.client = NeDBClient()

ko.models = Models(ko.client)


module.exports = ko
