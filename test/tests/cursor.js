const test = require('tape')


function runTests (ko, next) {
	const Instance = ko.Instance

	test('Setting up', function (t) {
		ko.models({
			ko_db_test_cursor: {
				_id: ko.Number,
			},
		})

		Promise.all([
			ko.models.ko_db_test_cursor.create({_id: 3}),
			ko.models.ko_db_test_cursor.create({_id: 2}),
			ko.models.ko_db_test_cursor.create({_id: 0}),
			ko.models.ko_db_test_cursor.create({_id: 4}),
			ko.models.ko_db_test_cursor.create({_id: 1}),
		].map(doc => doc.save())).then(() => {
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Cursor should be able to sort', function (t) {
		const cursor = ko.models.ko_db_test_cursor.find({}).sort({_id: -1}).then(docs => {
			t.deepEqual(docs, [
				{_id: 4},
				{_id: 3},
				{_id: 2},
				{_id: 1},
				{_id: 0},
			], 'Results were sorted')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Cursor should be able to skip', function (t) {
		const cursor = ko.models.ko_db_test_cursor.find({}).sort({_id: 1}).skip(2).then(docs => {
			t.deepEqual(docs, [
				{_id: 2},
				{_id: 3},
				{_id: 4},
			], 'Results were skipped')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Cursor should be able to limit', function (t) {
		const cursor = ko.models.ko_db_test_cursor.find({}).sort({_id: 1}).limit(1).then(docs => {
			t.deepEqual(docs, [{_id: 0}], 'Results were limited')
			t.equal(docs[0] instanceof Instance, true, 'Result is a Model Instance')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})


	test('Cursor forEach works correctly', function (t) {
		t.plan(8)

		let id = 1

		function iterate (doc) {
			t.equal(doc instanceof Instance, true, 'Doc is a Model Instance')
			t.equal(doc._id, id, 'Correct _id ' + id)
			id++
		}

		ko.models.ko_db_test_cursor.find({}).skip(1).limit(4).sort({_id: 1}).forEach(iterate)
		.catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('All done', function (t) {
		t.end()
		next()
	})
}

module.exports = runTests
