const test = require('tape')

function runTests (ko, next) {
	test('Directly modifying an array', async t => {
		const ArrayMod = ko.Model('ko_db_test_arrayop_mod', {
			array: [ko.String],
		})

		try {
			const model = await ArrayMod.create({
				array: [],
			}).save()

			model.array = ['hello']
			t.equal(model.array._replace, true, 'Setting to new array causes array replacement')

			await model.save()
			t.equal(model.array._replace, undefined, 'Saving resets _replace')

			let found = await ArrayMod.findOne(model.get_id())
			t.deepEqual(found.array, ['hello'], 'Model updated successfully')

			model.array.push('goodbye')
			t.equal(model.array._replace, true, 'Using native array methods causes array replacement')
			await model.save()
			found = await ArrayMod.findOne(model.get_id())
			t.deepEqual(found.array, ['hello', 'goodbye'], 'Model saved successfully')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Test array.$push method', async t => {
		const ArrPush = ko.Model('ko_db_test_arrayop_push', {
			array: [ko.String[10]],
		})

		const model = await ArrPush.create({
			array: [],
		})

		try {
			await model.save()

			model.array.$push('hello')
			t.equal(model.array._replace, undefined, 'Using $push method does not cause array replacement')
			t.deepEqual(model.array, ['hello'], 'Instance updated successfully')

			await model.save()
			let found = await ArrPush.findOne(model.get_id())
			t.deepEqual(found.array, ['hello'], 'Model updated in database')

			model.array.$push(['goodbye', 'au revoir'])
			t.deepEqual(model.array, ['hello', 'goodbye', 'au revoir'], 'Passing an array to $push updates the instance')
			await model.save()
			found = await ArrPush.findOne(model.get_id())
			t.deepEqual(found.array, ['hello', 'goodbye', 'au revoir'], 'Passing an array to $push updates the database')
		} catch (err) {
			t.error(err)
		}

		try {
			model.array.$push('too long of a string')
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			//console.log(err)
			t.pass('Threw an error when attempting to $push invalid value')
		}

		t.end()
	})

	test('Creating new references with $push and saveAll', async t => {
		const RefdModel = ko.Model('ko_db_test_arrayop_refd', {
			_id: ko.Number,
			field: ko.String,
		})

		const RefModel = ko.Model('ko_db_test_arrayop_ref', {
			refs: [RefdModel],
		})

		const model = RefModel.create({
			refs: [],
		})

		try {
			await model.save()

			model.refs.$push({
				_id: 1,
				field: 'ref1',
			})

			await model.saveAll()
			t.pass('Saved model when $pushing a new reference to an empty array')

			let found = await RefModel.findOne({})
			t.deepEqual(found.refs, [1], 'Saved reference as an _id')

			model.refs.$push({
				_id: 2,
				field: 'ref2',
			})
			await model.saveAll()
			t.pass('Saved model when $pushing a new reference to a nonempty array')

			found = await RefModel.findOne({})
			t.deepEqual(found.refs, [1, 2], 'Saved reference as an _id')

			let ref = await RefdModel.create({
				_id: 3,
				field: 'ref3',
			}).save()

			model.refs.$push(ref._id)
			await model.save()

			found = await RefModel.findOne({})
			t.deepEqual(found.refs, [1, 2, 3], 'Pushed new reference')

			ref = await RefdModel.create({
				_id: 4,
				field: 'ref4',
			}).save()

			const joined = await RefModel.findOne({}).join()
			joined.refs.push(ref._id)

			joined.refs[0].field = 'new ref1'

			await joined.saveAll()
			t.deepEqual(joined.refs, [1, 2, 3, 4], 'Joined model contains only references after saveAll')

			found = await RefModel.findOne({})
			t.deepEqual(found.refs, [1, 2, 3, 4], 'Pushed new reference after a join')
		} catch (err) {
			t.error(err)
		}

		try {
			const model = await RefModel.findOne({})
			model.refs.$push(5)

			await model.save()
			t.fail('Saved an invalid reference')
		} catch (err) {
			t.pass('Would not save an invalid reference')
		}

		t.end()
	})

	test('Test array.$pop method', async t => {
		const ArrPop = ko.Model('ko_db_test_arrayop_pop', {
			array: [ko.String],
		})

		const model = ArrPop.create({
			array: ['hello', 'goodbye', 'au revoir'],
		})

		try {
			await model.save()

			model.array.$pop(1)
			t.equal(model.array._replace, undefined, 'Using $pop method does not cause array replacement')
			t.deepEqual(model.array, ['hello', 'goodbye'], 'Instance was updated after method call')

			await model.save()
			let found = await ArrPop.findOne(model.get_id())
			t.deepEqual(found.array, ['hello', 'goodbye'], 'Saved changes to the database')

			model.array.$pop(-1)
			t.deepEqual(model.array, ['goodbye'], 'Instance was updated after method call')
			await model.save()
			found = await ArrPop.findOne(model.get_id())
			t.deepEqual(model.array, ['goodbye'], 'Saved changes to the database')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Test array.$addToSet method', async t => {
		const ArrAddToSet = ko.Model('ko_db_test_arrayop_addtoset', {
			array: [ko.String[10]],
		})

		const model = ArrAddToSet.create({
			array: [],
		})

		try {
			await model.save()

			model.array.$addToSet('hello')
			t.equal(model.array._replace, undefined, 'Using $addToSet method does not cause array replacement')
			t.deepEqual(model.array, ['hello'], 'Instance was updated after method call')

			await model.save()
			let found = await ArrAddToSet.findOne(model.get_id())
			t.deepEqual(found.array, ['hello'], 'Saved changes to the database')

			model.array.$addToSet('hello')
			t.deepEqual(model.array, ['hello'], 'Did not add duplicate value to instance')
			await model.save()
			found = await ArrAddToSet.findOne(model.get_id())
			t.deepEqual(found.array, ['hello'], 'Did not add duplicate value to database')

			model.array.$addToSet(['hello', 'goodbye', 'au revoir'])
			t.deepEqual(model.array, ['hello', 'goodbye', 'au revoir'], 'Passing an array to $addToSet updates the instance')
			await model.save()
			found = await ArrAddToSet.findOne(model.get_id())
			t.deepEqual(found.array, ['hello', 'goodbye', 'au revoir'], 'Passing an array to $addToSet updates the database')
		} catch (err) {
			t.error(err)
		}

		try {
			model.array.$addToSet('too long of a string')
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			//console.log(err)
			t.pass('Threw an error when attempting to $addToSet invalid value')
		}

		t.end()
	})

	test('Test array.$pull', async t => {
		const ArrPull = ko.Model('ko_db_test_arrayop_pull', {
			array: ko.Array(ko.String).notEmpty(),
		})

		const model = ArrPull.create({
			array: ['hello', 'goodbye', 'au revoir', 'ni hao'],
		})

		try {
			await model.save()

			model.array.$pull('hello')
			t.equal(model.array._replace, undefined, 'Using $pull method does not cause array replacement')
			t.deepEqual(model.array, ['goodbye', 'au revoir', 'ni hao'], 'Instance was updated after method call')

			await model.save()
			let found = await ArrPull.findOne(model.get_id())
			t.deepEqual(found.array, ['goodbye', 'au revoir', 'ni hao'], 'Element was removed from model')

			model.array.$pull(['au revoir', 'ni hao'])
			t.deepEqual(model.array, ['goodbye'], 'Pulled multiple values from instance')
			await model.save()
			found = await ArrPull.findOne(model.get_id())
			t.deepEqual(found.array, ['goodbye'], 'Pulled multiple values from array in the database')
		} catch (err) {
			t.error(err)
		}
		try {
			model.array.$pull(['goodbye'])
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			//console.log(err)
			t.pass('Model would not save an empty array')
		}

		t.end()
	})

	test('All done', t => {
		next()
		t.end()
	})
}

module.exports = runTests
