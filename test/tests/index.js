const test = require('tape')

function runTests (ko, next) {
	test('Creating Indexes', function (t) {
		const IndexModel = ko.Model('IndexModel', {
			name: ko.String,
			$$indices: {
				name: {
					unique: true,
				},
			},
		})

		IndexModel.create({
			name: 'Not unique',
		}).save().then(() => {
			return IndexModel.create({
				name: 'Not unique',
			}).save()
		}).then(() => {
			t.fail('Model creation succeeded where it should have failed')
			return IndexModel.estimatedDocumentCount({})
		}).catch(() => {
			t.pass('Did not create repeated model')
			return IndexModel.estimatedDocumentCount({})
		}).then(count => {
			t.equal(count, 1, 'Only created one instance of the model')
			t.end()
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
