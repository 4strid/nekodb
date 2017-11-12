const Typeclass = require('../lib/typeclass.js')
const test = require('tape')

test('Typeclass.getBasicType should work for basic types', function (t) {
	t.equal(Typeclass.getBasicType('hello'), String, 'String')
	t.equal(Typeclass.getBasicType(123), Number, 'Number')
	t.equal(Typeclass.getBasicType(true), Boolean, 'Boolean')
	t.equal(Typeclass.getBasicType(null), null, 'null')
	t.equal(Typeclass.getBasicType(new Date()), Date, 'Date')
	t.end()
})

test('Typeclass.compareTypes should work for arrays', function (t) {
	t.equal(Typeclass.compareTypes([String], []), true, 'Empty array')
	t.equal(Typeclass.compareTypes([String], ['fdsa']), true, 'Array of one element')
	t.equal(Typeclass.compareTypes([String], ['fdsa', 'asdf']), true, 'Array of multiple elements')
	t.equal(Typeclass.compareTypes([String], [123, 456]), false, 'False when incompatible elements')
	t.equal(Typeclass.compareTypes([String], null), false, 'False when not array')
	t.end()
})

test('Typeclass.compareTypes should work for options', function (t) {
	t.equal(Typeclass.compareTypes([String, Boolean], 'fdsa'), true, 'Optional string')
	t.equal(Typeclass.compareTypes([String, Boolean], true), true, 'Array of one element')
	t.equal(Typeclass.compareTypes([String, Boolean], 123), false, 'False for incompatible element')
	t.end()
})

test('Typeclass.compareTypes should work for an array of options', function (t) {
	t.equal(Typeclass.compareTypes([[String, Boolean]], []), true, 'Empty array')
	t.equal(Typeclass.compareTypes([[String, Boolean]], ['fdsa']), true, 'Array of one element')
	t.equal(Typeclass.compareTypes([[String, Boolean]], ['fdsa', true]), true, 'Array of multiple elements')
	t.equal(Typeclass.compareTypes([[String, Boolean]], null), false, 'False when not array')
	t.equal(Typeclass.compareTypes([[String, Boolean]], [123]), false, 'False for incompatible elements')
	t.end()
})
