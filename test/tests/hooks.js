const test = require('tape')

function runTests (ko, next) {
	test('Hooks should run', function (t) {
		// 6 * 2 for running all hooks
		// 2 for checks
		t.plan(14)
		const HookModel = ko.Model('Hooks', {
			name: ko.String,
			$$hooks: {
				prevalidate: function (instance, next) {
					t.pass('Ran prevalidate hook')
					next()
				},
				postvalidate: function (instance, next) {
					t.pass('Ran postvalidate hook')
					next()
				},
				presave: function (instance, next) {
					t.pass('Ran presave hook')
					instance.name = 'New value'
					next()
				},
				postsave: function (instance, next) {
					t.pass('Ran postsave hook')
					instance.additionalValue = 'Added'
					next()
				},
				predelete: function (instance, next) {
					t.pass('Ran predelete hook')
					next()
				},
				postdelete: function (instance, next) {
					t.pass('Ran postdelete hook')
					next()
				},
			},
		})

		HookModel.create({
			name: 'Old value',
		}).save().then(instance => {
			t.equal(instance.additionalValue, 'Added', 'Added value in postsave')
		}).then(() => {
			return HookModel.count({name: 'New value'})
		}).then(count => {
			t.equal(count, 1, 'Saved to database with changed value')
			return HookModel.deleteOne({name: 'New value'})
		}).then(() => {
			return HookModel.create({
				name: 'Value',
			}).save()
		}).then(() => {
			return HookModel.deleteMany({})
		}).then(() => {
			t.end()
		}).catch(err => {
			t.error(err)
		})
	})

	test('All done', function (t) {
		t.end()
		next()
	})
}

module.exports = runTests
