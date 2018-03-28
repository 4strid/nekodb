const test = require('tape')

function runTests (ko, next) {
	test('Hooks should run', function (t) {
		// 7 * 2 for running all hooks
		// 2 for checks
		t.plan(16)
		const HookModel = ko.Model('Hooks', {
			name: ko.String,
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

	test('Named hooks should only run at the appropriate time', function (t) {
		const NamedHookModel = ko.Model('NamedHooks', {
			_id: ko.String,
			field1: ko.String.match(/^[a-z]*$/),
			field2: ko.String.match(/^[a-z]*$/),
		})
		NamedHookModel.presave = {
			field1: (instance, next) => {
				instance.field1 = '__' + instance.field1
				next()
			},
			field2: (instance, next) => {
				instance.field2 = '__' + instance.field2
				next()
			},
		}

		NamedHookModel.create({
			_id: '0',
			field1: 'abc',
			field2: 'def',
		}).save().then(model => {
			t.deepEqual(model, {
				_id: '0',
				field1: '__abc',
				field2: '__def',
			}, 'Presave hooks were run when model was created')
			model.field1 = 'ghi'
			return model.save()
		}).then(model => {
			t.equal(model.field1, '__ghi', 'Updated field ran presave hook')
			t.equal(model.field2, '__def', 'Not updated field did not run presave hook')
			return model.save()
		}).then(model => {
			t.equal(model.field1, '__ghi', 'When no updates occurred, hooks did not run')
			t.equal(model.field2, '__def', 'When no updates occurred, hooks did not run')
			t.end()
		}).catch(err => {
			console.log(err)
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
