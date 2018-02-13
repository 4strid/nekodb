// contains utility Typeclasses

const isEmail = require('isemail')
const urlRegex = require('url-regex')

const Typedef = require('./construction').Typedef

const Email = Typedef({
	type: String,
	validator: function (value) {
		return isEmail.validate(value)
	}
})

const URL = Typedef({
	type: String,
	validator: function (value) {
		return urlRegex({exact: true}).test(value)
	}
})

// for local paths. this is hand written and probably deserves a second glance
// I'm having trouble finding what characters are valid where, and it needs support for encoded characters
URL.Relative = Typedef({
	type: String,
	validator: function (value) {
		return /^([a-zA-Z0-9_\-\.~[\]@!$'()\*+;,=\/])+(\?([a-zA-Z0-9\/?:@\-._~!$'()*+,;]+=[a-zA-Z0-9\/?:@\-._~!$'()*+,;]+&?)+)?(#[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,=\/]+)?$/.test(value)
	}
})

module.exports = { Email, URL }
