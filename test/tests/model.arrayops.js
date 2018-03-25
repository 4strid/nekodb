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
			t.equal(model.array._replaceArray, true, 'Setting to new array causes array replacement')

			await model.save()
			t.equal(model.array._replaceArray, undefined, 'Saving resets _replaceArray')

			let saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello'], 'Model updated successfully')

			model.array.push('goodbye')
			t.equal(model.array._replaceArray, true, 'Using native array methods causes array replacement')
			await model.save()
			saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello', 'goodbye'], 'Model saved successfully')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Test array.$push method', async t => {
		const ArrPush = ko.Model('ko_db_test_arrayop_push', {
			array: [ko.String],
		})

		const model = await ArrPush.create({
			array: [],
		})

		try {
			await model.save()

			model.array.$push('hello')
			t.equal(model.array._replaceArray, undefined, 'Using $push method does not cause array replacement')

			await model.save()
			let saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello'], 'Model updated successfully')

			model.array.$push(['goodbye', 'au revoir'])
			await model.save()
			saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello', 'goodbye', 'au revoir'], 'Passing an array to $push updates the model')
		} catch (err) {
			t.error(err)
		}

		try {
			model.array.$push(100)
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			console.log(err)
			t.pass('Threw an error when attempting to $push invalid value')
		}

		t.end()
	})

	test('Test array.$addToSet method', async t => {
		const ArrAddToSet = ko.Model('ko_db_test_arrayop_addtoset', {
			array: [ko.String],
		})

		const model = await ArrAddToSet.create({
			array: [],
		})

		try {
			await model.save()

			model.array.$addToSet('hello')
			t.equal(model.array._replaceArray, undefined, 'Using $addToSet method does not cause array replacement')

			await model.save()
			let saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello'], 'Model updated successfully')

			model.array.$addToSet('hello')
			await model.save()
			saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello'], 'Did not add duplicate')

			model.array.$addToSet(['hello', 'goodbye', 'au revoir'])
			await model.save()
			saved = await ArrayMod.findOne(model.get_id())
			t.deepEqual(saved.array, ['hello', 'goodbye', 'au revoir'], 'Passing an array to $addToSet updates the model')
		} catch (err) {
			t.error(err)
		}

		try {
			model.array.$addToSet(100)
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			console.log(err)
			t.pass('Threw an error when attempting to $addToSet invalid value')
		}

		t.end()
	})

	test('Test array.$pull', async t => {
		const ArrPull = ko.Model('ko_db_test_arrayop_pull', {
			array: ko.Array(ko.String).notEmpty()
		})

		const model = ArrPull.create({
			array: ['hello', 'goodbye', 'au revoir', 'ni hao'],
		})

		try {
			await model.save()

			model.array.$pull({array: 'hello'})
			t.equal(model.array._replaceArray, undefined, 'Using $pull method does not cause array replacement')

			await model.save()
			let saved = await ArrPull.findOne(model.get_id())
			t.deepEqual(saved.array, ['goodbye', 'au revoir', 'ni hao'], 'Element was removed from model')

			model.array.$pull({array: ['au revoir', 'ni hao']})
			await model.save()
			saved = await ArrPull.findOne(model.get_id())
			t.deepEqual(saved.array, ['goodbye'], 'Pulled multiple values from array')
		} catch (err) {
			t.error(err)
		}
		try {
			model.array.$pull({array: ['goodbye']})
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			console.log(err)
			t.pass('Model would not save an empty array')
		}
	})

	test('All done', t => {
		next()
		t.end()
	})
}

module.exports = runTests
