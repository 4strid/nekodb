const Typeclass = require('../lib/typeclass')
//const type = require('../lib/typeclass/type')
const test = require('tape')

test('Typeclass.getBasicType should work for basic types', function (t) {
	t.equal(Typeclass.getBasicType('hello'), String, 'String')
	t.equal(Typeclass.getBasicType(123), Number, 'Number')
	t.equal(Typeclass.getBasicType(true), Boolean, 'Boolean')
	t.equal(Typeclass.getBasicType(null), null, 'null')
	t.equal(Typeclass.getBasicType(new Date()), Date, 'Date')
	t.end()
})

test('Typeclass.compareTypes should work for basic types', function (t) {
	t.equal(Typeclass.compareTypes(String, 'fdsa'), true, 'String')
	t.equal(Typeclass.compareTypes(Number, 123), true, 'Number')
	t.equal(Typeclass.compareTypes(Boolean, true), true, 'Boolean')
	t.equal(Typeclass.compareTypes(null, null), true, 'null')
	t.equal(Typeclass.compareTypes(Date, new Date()), true, 'Date')
	t.equal(Typeclass.compareTypes(String, 123), false, 'False for non matching element')
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

test('String typeclasses should validate correctly', function (t) {
	t.equal(Typeclass.classes.String.check('fdsa'), true, 'Base String type')
	t.equal(Typeclass.classes.String.check(123), false, 'Base type returns false when not a String')
	t.equal(Typeclass.classes.String[4].check('fdsa'), true, 'Length limited String type')
	t.equal(Typeclass.classes.String[4].check('12345'), false, 'Length limited String type returns false when too long')
	t.equal(Typeclass.classes.String.constant('fdsa').check('fdsa'), true, 'Constant String which matches')
	t.equal(Typeclass.classes.String.constant('fdsa').check(undefined), true, 'Constant String passed undefined')
	t.equal(Typeclass.classes.String.constant('fdsa').check(null), true, 'Constant String passed null')
	t.equal(Typeclass.classes.String.constant('fdsa').check('aaaa'), false, 'Constant String which does not match')
	t.equal(Typeclass.classes.String.optional().check('fdsa'), true, 'Optional passed a string')
	t.equal(Typeclass.classes.String.optional().check(null), true, 'Optional passed null')
	t.equal(Typeclass.classes.String.optional().check(123), false, 'Optional passed non matching value')
	t.end()
})


test('Number typeclasses should validate correctly', function (t) {
	t.equal(Typeclass.classes.Number.check(123), true, 'Base Number type')
	t.equal(Typeclass.classes.Number.check('fdsa'), false, 'Base Number type returns false when not a String')
	t.equal(Typeclass.classes.Number.min(0).check(123), true, 'Min value that passes')
	t.equal(Typeclass.classes.Number.min(0).check(-123), false, 'Min value that does not pass')
	t.equal(Typeclass.classes.Number.min(0).max(123).check(123), true, 'Min and Max value that passes')
	t.end()
})
