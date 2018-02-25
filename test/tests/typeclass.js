const test = require('tape')

function runTests (ko, next) {
	const Typeclass = ko.Typeclass

	test('Typeclass.getBasicType should work for basic types', function (t) {
		t.equal(Typeclass.getBasicType('hello'), String, 'String')
		t.equal(Typeclass.getBasicType(123), Number, 'Number')
		t.equal(Typeclass.getBasicType(true), Boolean, 'Boolean')
		t.equal(Typeclass.getBasicType(null), null, 'null')
		t.equal(Typeclass.getBasicType(new Date()), Date, 'Date')
		t.end()
	})

	test('String typeclasses should validate correctly', async function (t) {
		let valid = await ko.String.check('fdsa')
		t.equal(valid, true, 'Base String type')
			
		valid = await ko.String.check(123)
		t.equal(valid, false, 'Base type returns false when not a String')

		valid = await ko.String[4].check('fdsa')
		t.equal(valid, true, 'Length limited String type')
		
		valid = await ko.String[4].check('12345')
		t.equal(valid, false, 'Length limited String type returns false when too long')

		valid = await ko.String.minlength(2).check('123')
		t.equal(valid, true, 'minlength accepts passing value')

		valid = await ko.String.minlength(2).check('1')
		t.equal(valid, false, 'minlength rejects non passing value')

		valid = await ko.String.range(1, 2).check('12')
		t.equal(valid, true, 'range accepts passing value')

		valid = await ko.String.range(1, 2).check('123')
		t.equal(valid, false, 'range rejects non passing value')

		valid = await ko.String.match(/fdsa/).check('fdsa')
		t.equal(valid, true, 'match accepts passing value')

		valid = await ko.String.match(/fdsa/).check('123')
		t.equal(valid, false, 'range rejects non passing value')

		t.end()
	})

	test('Number typetypes should validate correctly', async function (t) {
		let valid = await ko.Number.check(123)
		t.equal(valid, true, 'Base Number type')

		valid = await ko.Number.check('fdsa')
		t.equal(valid, false, 'Base Number type returns false when not a Number')

		valid = await ko.Number.min(0).check(123)
		t.equal(valid, true, 'Min value that passes')

		valid = await ko.Number.min(0).check(-123)
		t.equal(valid, false, 'Min value that does not pass')

		valid = await ko.Number.minx(0).check(0)
		t.equal(valid, false, 'Minx does not allow minimum value')

		valid = await ko.Number.maxx(1).check(1)
		t.equal(valid, false, 'Maxx does not allow maximum value')

		valid = await ko.Number.min(0).max(123).check(123)
		t.equal(valid, true, 'Min and Max value that passes')

		valid = await ko.Number.range(1, 3).check(2)
		t.equal(valid, true, 'Range value that passes')

		valid = await ko.Number.range(1, 3).check(4)
		t.equal(valid, false, 'Range value that does not pass')

		valid = await ko.Number.integer().check(4)
		t.equal(valid, true, 'Integer value that passes')

		valid = await ko.Number.integer().check(4.5)
		t.equal(valid, false, 'Integer value that does not pass')

		t.end()
	})

	test('Date types should validate correctly', async function (t) {
		let valid = await ko.Date.check(new Date())
		t.equal(valid, true, 'Base Date type')

		valid = await ko.Date.check('not a date')
		t.equal(valid, false, 'Base Date type rejects non passing value')

		valid = await ko.Date.after(new Date('2018-02-25')).check(new Date('2018-02-26'))
		t.equal(valid, true, 'Date.after accepts passing value')

		valid = await ko.Date.after(new Date('2018-02-25')).check(new Date('2018-02-24'))
		t.equal(valid, false, 'Date.after rejects non passing value')

		valid = await ko.Date.before(new Date('2018-02-25')).check(new Date('2018-02-24'))
		t.equal(valid, true, 'Date.before accepts passing value')

		valid = await ko.Date.before(new Date('2018-02-25')).check(new Date('2018-02-26'))
		t.equal(valid, false, 'Date.before rejects non passing value')

		valid = await ko.Date.past().check(new Date('2018-02-24'))
		t.equal(valid, true, 'Date.past accepts passing value')

		valid = await ko.Date.past().check(new Date('2045-01-01'))
		t.equal(valid, false, 'Date.past rejects non passing value')

		valid = await ko.Date.future().check(new Date('2045-01-01'))
		t.equal(valid, true, 'Date.future accepts passing value')

		valid = await ko.Date.future().check(new Date('2018-01-01'))
		t.equal(valid, false, 'Date.future rejects non passing value')

		valid = await ko.Date.range(new Date('2018-01-01'), new Date('2045-01-01')).check(new Date())
		t.equal(valid, true, 'Date.range accepts passing value')

		valid = await ko.Date.range(new Date('2018-01-01'), new Date('2045-01-01')).check(new Date('2017-12-31'))
		t.equal(valid, false, 'Date.range rejects non passing value')

		t.end()
	})

	test('Utility typeclasses should validate correctly', async function (t) {
		t.equal(await ko.Email.check('peter@nekodb.net'), true, 'Email type accepts matching value')
		t.equal(await ko.Email.check('garbage'), false, 'Email type rejects non matching value')
		t.equal(await ko.URL.check('www.nekodb.net'), true, 'URL type accepts matching value')
		t.equal(await ko.URL.check('garbage'), false, 'URL type rejects non matching value')
		t.equal(await ko.URL.Relative.check('/test/route'), true, 'URL.Relative type accepts matching value')
		t.equal(await ko.URL.Relative.check('ga#?@@##rbage'), false, 'URL.Relative type rejects non matching value')
		t.end()
	})

	test('Constant typeclasses should validate correctly', async function (t) {
		const constType = ko.String.constant('fdsa')
		t.equal(await constType.check('fdsa'), true, 'Constant String which matches')
		t.equal(await constType.check(undefined), true, 'Constant String passed undefined')
		t.equal(await constType.check(null), true, 'Constant String passed null')
		t.equal(await constType.check(null), true, 'Constant String passed null')
		t.equal(await constType.check('aaaa'), false, 'Constant String which does not match')
		t.end()
	})

	test('Optional classes should validate correctly', async function (t) {
		const optType = ko.String.optional()
		t.equal(await optType.check('fdsa'), true, 'Optional passed a string')
		t.equal(await optType.check(null), true, 'Optional passed null')
		t.equal(await optType.check(123), false, 'Optional passed non matching value')
		t.end()
	})

	test('Array types should validate correctly', async function (t) {
		const arrayType = ko.Array(ko.Number)
		
		t.equal(await arrayType.check([]), true, 'Array type works for empty array')
		t.equal(await arrayType.check([0]), true, 'Array type works for array of one element')
		t.equal(await arrayType.check([1, 2, 3]), true, 'Array type works for array of multiple elements')
		t.equal(await arrayType.check(['hello']), false, 'Array type returns false for non matching value')
		t.equal(await arrayType.check([0, 'hello']), false, 'Array type returns false for mixed values')
		t.equal(await arrayType.notEmpty().check([0]), true, 'notEmpty validator passes')
		t.equal(await arrayType.notEmpty().check([]), false, 'notEmpty validator fails for empty array')
		t.end()
	})

	test('Array of options should validate correctly', async function (t) {
		const arrayType = ko.Array(ko.Option([
			ko.String,
			ko.Boolean,
		]))
		
		t.equal(await arrayType.check([]), true, 'Option-Array type works for empty array')
		t.equal(await arrayType.check(['Hello']), true, 'Option-Array type works for single matching element')
		t.equal(await arrayType.check([true]), true, 'Option-Array type works for single matching element')
		t.equal(await arrayType.check([true, 'Hello']), true, 'Option-Array type works for mixed types')
		t.equal(await arrayType.check([true, 'Hello', null]), false, 'Option-Array type returns false for nonmatching values')
		t.end()
	})

	test('Embedded documents should validate correctly', async function (t) {
		const documentType = ko.Document({
			name: ko.String,
			age: ko.Number,
		})
		let valid = await documentType.check({name: 'John', age: 250})
		t.equal(valid, true, 'Matching subdocument type')

		valid = await documentType.check({name: 250, age: 'John'})
		t.equal(valid, false, 'Incompatible subdocument types')

		valid = await documentType.check({foo: 'bar'})
		t.equal(valid, false, 'Incompatible subdocument properties')
		t.end()
	})

	test('Creating custom typeclasses', async function (t) {
		const customType = ko.String.validate(function (value) {
			return value === 'ok' || value === 'OK'
		})
		const extendedType = ko.String.extend(function () {
			this.value = 'constant',
			this.validator = value => value === 'constant'
		})
		t.equal(await customType.check('ok'), true, 'Custom validator passes')
		t.equal(await customType.check('OK'), true, 'Custom validator passes')
		t.equal(await customType.check('not ok'), false, 'Custom validator rejects non matching value')
		t.equal(await extendedType.check('constant'), true, 'Extended validator passes')
		t.equal(await extendedType.check('not ok'), false, 'Extended validator rejects non matching value')
		t.end()
	})

	test('All done', function (t) {
		t.end()
		next()
	})
}

module.exports = runTests
