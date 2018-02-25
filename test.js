const ko = require('./ko')

ko.connect({client: 'nedb', inMemory: true})

module.exports = ko
