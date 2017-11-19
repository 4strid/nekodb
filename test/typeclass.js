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


test('String typetypes should validate correctly', function (t) {
	t.equal(Typeclass.types.String.check('fdsa'), true, 'Base String type')
	t.equal(Typeclass.types.String.check(123), false, 'Base type returns false when not a String')
	t.equal(Typeclass.types.String[4].check('fdsa'), true, 'Length limited String type')
	t.equal(Typeclass.types.String[4].check('12345'), false, 'Length limited String type returns false when too long')
	t.equal(Typeclass.types.String.constant('fdsa').check('fdsa'), true, 'Constant String which matches')
	t.equal(Typeclass.types.String.constant('fdsa').check(undefined), true, 'Constant String passed undefined')
	t.equal(Typeclass.types.String.constant('fdsa').check(null), true, 'Constant String passed null')
	t.equal(Typeclass.types.String.constant('fdsa').check('aaaa'), false, 'Constant String which does not match')
	t.equal(Typeclass.types.String.optional().check('fdsa'), true, 'Optional passed a string')
	t.equal(Typeclass.types.String.optional().check(null), true, 'Optional passed null')
	t.equal(Typeclass.types.String.optional().check(123), false, 'Optional passed non matching value')
	t.end()
})


test('Number typetypes should validate correctly', function (t) {
	t.equal(Typeclass.types.Number.check(123), true, 'Base Number type')
	t.equal(Typeclass.types.Number.check('fdsa'), false, 'Base Number type returns false when not a String')
	t.equal(Typeclass.types.Number.min(0).check(123), true, 'Min value that passes')
	t.equal(Typeclass.types.Number.min(0).check(-123), false, 'Min value that does not pass')
	t.equal(Typeclass.types.Number.min(0).max(123).check(123), true, 'Min and Max value that passes')
	t.end()
})
