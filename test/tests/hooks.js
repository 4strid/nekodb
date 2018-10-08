const test = require('tape')

function runTests (ko, next) {
	test('Hooks should run', function (t) {
		// 7 * 2 for running all hooks
		// 2 for checks
		t.plan(16)
		const HookModel = ko.Model('Hooks', {
			name: ko.String,
			update: ko.String,
			$$hooks: {
				oncreate: function (instance, next) {
					t.pass('Ran oncreate hook')
					next()
				},
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

					if (instance.isUpdated('update')) {
						instance.update = 'this field was updated'
					}
					next()
				},
				postsave: function (instance) {
					t.pass('Ran postsave hook')
					instance.additionalValue = 'Added'
					// should be able to return a Promise rather than call next
					return Promise.resolve()
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
			update: 'Old value',
		}).save().then(instance => {
			t.equal(instance.additionalValue, 'Added', 'Added value in postsave')
		}).then(() => {
			return HookModel.countDocuments({name: 'New value', update: 'this field was updated'})
		}).then(count => {
			t.equal(count, 1, 'Saved to database with changed value')
			return HookModel.deleteOne({name: 'New value'})
		}).then(() => {
			return HookModel.create({
				name: 'Value',
				update: 'Value',
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
