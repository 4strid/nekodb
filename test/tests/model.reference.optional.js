const test = require('tape')

function runTests (ko, next) {
	test('Creating a model with an optional reference', async t => {

		try {
			const RefdModel = ko.Model('ko_db_test_optional_ref', {
				field: ko.String,
			})

			const Model = ko.Model('ko_db_test_optional_model', {
				ref: RefdModel.ref().optional(),
			})

			const ref = await RefdModel.create({field: 'hello'}).save()
			await Model.create({ref: ref._id}).save()

			let found = await Model.findOne({})
			t.equal(found.ref, ref._id, 'Optional reference was saved correctly')

			const empty = await Model.create({ref: null}).save()
			found = await Model.findOne({ref: null})
			t.equal(empty._id, found._id, 'Model with null reference was saved correctly')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Join works for optional references', async t => {
		const RefdModel = ko.Model('ko_db_test_join_optional_ref', {
			_id: ko.Number,
			field: ko.String,
		})

		const OptionalRef = ko.Model('ko_db_test_join_optional', {
			ref: RefdModel.ref().optional(),
		})
	})


	test('All done', function (t) {
		t.end()
		next()
	})
}

module.exports = runTests
