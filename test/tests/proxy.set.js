const test = require('tape')

function runTests (ko, next) {
	test('Set values in an array field', async t => {
		const ArrayModel = ko.Model('ko_db_test_proxyset_arr', {
			array: [ko.String[10]],
			arraysArray: [[ko.Number.max(100)]],
		})

		const model = ArrayModel.create({
			array: ['hello', 'goodbye'],
			arraysArray: [[1], [2]],
		})

		try {
			await model.save()

			model.array[1] = 'good night'
			await model.save()
			t.deepEqual(model.array._updates, {}, '_updates were reset after saving')
			let found = await ArrayModel.findOne(model.get_id())
			t.deepEqual(found.array, ['hello', 'good night'], 'Updated the value in the database')

			model.array[2] = 'howdy'
			await model.save()
			t.deepEqual(model.arraysArray._updates, {}, '_updates were reset after saving')
			t.deepEqual(model.arraysArray[0]._updates, {}, '_updates were reset after saving')
			found = await ArrayModel.findOne(model.get_id())
			t.deepEqual(found.array, ['hello', 'good night', 'howdy'], 'Added an element to the end of the array')

			model.arraysArray[0][0] = 2
			await model.save()
			found = await ArrayModel.findOne(model.get_id())
			t.deepEqual(found.arraysArray, [[2], [2]], 'Updated an element in the array of arrays')
		} catch (err) {
			t.error(err)
		}

		try {
			model.array[0] = 'way too long of a string'
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			//console.log(err)
			t.pass('Did not save an invalid field')
		}

		try {
			model.arraysArray[0][0] = 100000
			await model.save()
			t.fail('Model saved where it should have failed')
		} catch (err) {
			//console.log(err)
			t.pass('Did not save an invalid field')
		}

		t.end()
	})

	test('Set values in an embedded document field', async t => {
		const DocModel = ko.Model('ko_db_test_proxyset_doc', {
			document: {
				subfield: ko.String,
				subarray: [ko.String],
			},
		})

		const model = DocModel.create({
			document: {
				subfield: 'hello',
				subarray: ['good night'],
			},
		})

		try {
			await model.save()

			model.document.subfield = 'bonjour'
			model.document.subarray[0] = 'bon nuit'
			await model.save()
			t.deepEqual(model.document._updates, {}, '_updates were reset after saving')
			t.deepEqual(model.document.subarray._updates, {}, '_updates were reset after saving')
			let found = await DocModel.findOne(model.get_id())
			t.equal(found.document.subfield, 'bonjour', 'Saved newly set value to database')
			t.deepEqual(found.document.subarray, ['bon nuit'], 'Saved newly set value in subarray')
		} catch (err) {
			console.log(err)
			t.error(err)
		}

		t.end()
	})

	test('All done', t => {
		next()
		t.end()
	})
}

module.exports = runTests
