const test = require('tape')

function runTests (ko, next) {
	test('Hooks should run', function (t) {
		t.plan(8)
		const HookModel = ko.Model('Hooks', {
			name: ko.String,
			$$hooks: {
				prevalidate: function (next) {
					t.pass('Ran prevalidate hook')
					next()
				},
				postvalidate: function (next) {
					t.pass('Ran postvalidate hook')
					next()
				},
				presave: function (next) {
					t.pass('Ran presave hook')
					this.name = 'New value'
					next()
				},
				postsave: function (next) {
					t.pass('Ran postsave hook')
					this.additionalValue = 'Added'
					next()
				},
				predelete: function (next) {
					t.pass('Ran predelete hook')
					next()
				},
				postdelete: function (next) {
					t.pass('Ran postdelete hook')
					next()
				},
			},
		})

		HookModel.create({
			name: 'Old value',
		}).save().then(instance => {
			t.equal(instance.name, 'New value', 'Changed value before saving')
			t.equal(instance.additionalValue, 'Added', 'Added value in postsave')
		}).then(() => {
			return HookModel.deleteOne({name: 'New value'})
		}).then(() => {
		}).catch(err => {
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
