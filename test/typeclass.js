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
	t.plan(12)
	Typeclass.types.String.check('fdsa').then(valid => {
		t.equal(valid, true, 'Base String type')
	})
	Typeclass.types.String.check(123).then(valid => {
		t.equal(valid, false, 'Base type returns false when not a String')
	})
	Typeclass.types.String[4].check('fdsa').then(valid => {
		t.equal(valid, true, 'Length limited String type')
	})
	Typeclass.types.String[4].check('12345').then(valid => {
		t.equal(valid, false, 'Length limited String type returns false when too long')
	})
	Typeclass.types.String.constant('fdsa').check('fdsa').then(valid => {
		t.equal(valid, true, 'Constant String which matches')
	})
	Typeclass.types.String.constant('fdsa').check(undefined).then(valid => {
		t.equal(valid, true, 'Constant String passed undefined')
	})
	Typeclass.types.String.constant('fdsa').check(null).then(valid => {
		t.equal(valid, true, 'Constant String passed null')
	})
	Typeclass.types.String.constant('fdsa').check(null).then(valid => {
		t.equal(valid, true, 'Constant String passed null')
	})
	Typeclass.types.String.constant('fdsa').check('aaaa').then(valid => {
		t.equal(valid, false, 'Constant String which does not match')
	})
	Typeclass.types.String.optional().check('fdsa').then(valid => {
		t.equal(valid, true, 'Optional passed a string')
	})
	Typeclass.types.String.optional().check(null).then(valid => {
		t.equal(valid, true, 'Optional passed null')
	})
	Typeclass.types.String.optional().check(123).then(valid => {
		t.equal(valid, false, 'Optional passed non matching value')
	})
})


test('Number typetypes should validate correctly', function (t) {
	t.plan(5)
	Typeclass.types.Number.check(123).then(valid => {
		t.equal(valid, true, 'Base Number type')
	})
	Typeclass.types.Number.check('fdsa').then(valid => {
		t.equal(valid, false, 'Base Number type returns false when not a Number')
	})
	Typeclass.types.Number.min(0).check(123).then(valid => {
		t.equal(valid, true, 'Min value that passes')
	})
	Typeclass.types.Number.min(0).check(-123).then(valid => {
		t.equal(valid, false, 'Min value that does not pass')
	})
	Typeclass.types.Number.min(0).max(123).check(123).then(valid => {
		t.equal(valid, true, 'Min and Max value that passes')
	})
})

test('Array types should validate correctly', function (t) {
	t.plan(7)
	const arrayType = Typeclass.types.Array(Typeclass.types.Number)
	arrayType.check([]).then(valid => {
		t.equal(valid, true, 'Array type works for empty array')
	})
	arrayType.check([0]).then(valid => {
		t.equal(valid, true, 'Array type works for array of one element')
	})
	arrayType.check([1, 2, 3]).then(valid => {
		t.equal(valid, true, 'Array type works for array of multiple elements')
	})
	arrayType.check(['hello']).then(valid => {
		t.equal(valid, false, 'Array type returns false for non matching value')
	})
	arrayType.check([0, 'hello']).then(valid => {
		t.equal(valid, false, 'Array type returns false for mixed values')
	})
	arrayType.notEmpty().check([0]).then(valid => {
		t.equal(valid, true, 'notEmpty validator passes')
	})
	arrayType.notEmpty().check([]).then(valid => {
		t.equal(valid, false, 'notEmpty validator fails for empty array')
	})
})

test('Array of options should validate correctly', function (t) {
	t.plan(5)
	const arrayType = Typeclass.types.Array(Typeclass.types.Option([
		Typeclass.types.Number,
		Typeclass.types.String
	]))
	arrayType.check([]).then(valid => {
		t.equal(valid, true, 'Option-Array type works for empty array')
	})
	arrayType.check(['Hello']).then(valid => {
		t.equal(valid, true, 'Option-Array type works for single matching element')
	})
	arrayType.check([0]).then(valid => {
		t.equal(valid, true, 'Option-Array type works for single matching element')
	})
	arrayType.check([0, 'Hello']).then(valid => {
		t.equal(valid, true, 'Option-Array type works for mixed types')
	})
	arrayType.check([0, 'Hello', null]).then(valid => {
		t.equal(valid, false, 'Option-Array type returns false for nonmatching values')
	})
})

test('Embedded documents should validate correctly', function (t) {
	t.plan(3)
	const documentType = Typeclass.types.Document({
		name: Typeclass.types.String,
		age: Typeclass.types.Number
	})
	documentType.check({name: 'John', age: 250}).then(valid => {
		t.equal(valid, true, 'Matching subdocument type')
	})
	documentType.check({name: 250, age: 'John'}).then(valid => {
		t.equal(valid, false, 'Incompatible subdocument types')
	})
	documentType.check({foo: 'bar'}).then(valid => {
		t.equal(valid, false, 'Incompatible subdocument properties')
	})
})
