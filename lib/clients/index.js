NeDBClient = require('./nedb')
MongoClient = require('./mongo')

module.exports = {
	nedb: NeDBClient,
	mongodb: MongoClient,
}
