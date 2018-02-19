const test = require('tape')

const ko = require('../ko')

const Instance = require('../lib/models/instance')


test('Saving a new simple model successfully', function (t) {
	const SimpleModel = ko.Model('ko_db_test_save_simple', {
		string: ko.String,
	})

	SimpleModel.create({
		string: 'ok'
	}).save().then(simple => {
		t.equal('_id' in simple, true, 'Instance assigned an _id when not specified')
		t.equal(simple.string, 'ok', 'Instance has correct field')
		return SimpleModel.count({})
	}).then(count => {
		t.equal(count, 1, 'Count incremented after creation')
		return SimpleModel.create({_id: 1, string: 'nice'}).save().then(saved => {
			return saved
		})
	}).then(simple => {
		t.deepEqual(simple, {
			_id: 1,
			string: 'nice'
		}, 'Instance uses assigned _id when specified and contains data')
		return SimpleModel.count({})
	}).then(count => {
		t.equal(count, 2, 'Count incremented after creation')
		t.end()
	}).catch(err => {
		t.error(err)
		t.end()
	})
})

test('Saving a simple model unsuccessfully', function (t) {
	const SimpleModelFail = ko.Model('ko_db_test_save_simple_fail', {
		string: ko.String[5],
		number: ko.Number
	})

	SimpleModelFail.create({}).save().then(simple => {
		t.fail('Model creation succeeded where it should have failed')
		return SimpleModelFail.count({})
	}).catch(fields => {
		t.pass('Failed to save when fields were missing')
		t.deepEqual(fields, {
			string: undefined,
			number: undefined
		}, 'Got back an error object that contained the invalid fields')
		//t.end()
		return SimpleModelFail.count({})
	}).then(count => {
		return SimpleModelFail.create({
			string: 'too long string',
			number: 0
		}).save()
	}).then(simple => {
		t.fail('Model creation succeeded where it should have failed')
		return SimpleModelFail.count({})
	}).catch(fields => {
		t.pass('Failed to save when a field failed validation')
		t.deepEqual(fields, {
			string: 'too long string'
		}, 'Got back an error object that contained the invalid fields')
		//t.end()
		return SimpleModelFail.count({})
	}).then(count => {
		t.equal(count, 0, 'Did not add anything to the database')
		return SimpleModelFail.create({
			_id: '1',
			string: 'ok',
			number: 123
		}).save()
	}).then(() => {
		return SimpleModelFail.create({
			_id: '1',
			string: 'ok',
			number: 123
		}).save()
	}).then(model => {
		console.log(model)
		t.fail('Model creation succeeded where it should have failed')
		return SimpleModelFail.count({})
	}).catch(err => {
		t.equal(err instanceof Error, true, 'Got back an error when creating a duplicate')
		return SimpleModelFail.count({})
	}).then(count => {
		t.equal(count, 1, 'Did not add anything to the database')
		t.end()
	})
})

test('Saving a model with a reference', function (t) {
	const ReferencedModel = ko.Model('ko_db_test_save_referenced', {
		string: ko.String
	})

	const ModelWithRef = ko.Model('ko_db_test_save_with_ref', {
		field: ko.String,
		ref: ReferencedModel
	})

	ReferencedModel.create({
		_id: '0',
		string: 'hello'
	}).save().then(() => {
		return ModelWithRef.create({
			_id: '0',
			field: 'zzz',
			ref: '0'
		}).save()
	}).then(saved => {
		t.deepEqual(saved, {
			_id: '0',
			field: 'zzz',
			ref: '0',
		}, 'Got back the saved model')
		return ModelWithRef.count({})
	}).then(count => {
		t.equal(count, 1, 'Saved document to the database')
		return ModelWithRef.findOne({_id: '0'})
	}).then(model => {
		model.field = 'yyy'
		return model.save()
	}).then(() => {
		return ModelWithRef.findOne({_id: '0'})
	}).then(model => {
		t.equal(model.field, 'yyy', 'Document was updated')
		return ModelWithRef.findOne({_id: '0'}).join()
	}).then(model => {
		model.field = 'xxx'
		return model.save()
	}).then(model => {
		return ModelWithRef.findOne({_id: '0'})
	}).then(model => {
		t.equal(model.field, 'xxx', 'Document was saved after a join')
		return ModelWithRef.create({
			_id: '1',
			field: 'aaa',
			ref: {
				_id: '1',
				string: 'goodbye'
			}
		}).saveAll()
	}).then(() => {
		t.pass('Created reference and document together')
		return ReferencedModel.count({})
	}).then(count => {
		t.equal(count, 2, 'Saved reference to the database')
		return ModelWithRef.findOne({_id: '1'})
	}).then(model => {
		t.deepEqual(model, {
			_id: '1',
			field: 'aaa',
			ref: '1'
		}, 'Saved document to the database')
		return model.join()
	}).then(model => {
		model.ref.string = 'konnichi wa'
		return model.saveRefs()
	}).then(() => {
		return ReferencedModel.findOne({_id: '1'})
	}).then(reference => {
		t.deepEqual(reference, {
			_id: '1',
			string: 'konnichi wa'
		}, 'Updated reference')
		t.end()
	}).catch(err => {
		t.error(err)
		t.end()
	})
})

test('Saving a model with an embedded reference', function (t) {
	const EmbeddedModel = ko.Model('ko_db_test_save_embedded', {
		string: ko.String
	})

	const EmbedModel = ko.Model('ko_db_test_save_embed', {
		ref: EmbeddedModel.embed()
	})
	EmbedModel.create({
		ref: {
			string: 'In the database'
		}
	}).saveAll().then(doc => {
		t.equal(typeof doc.ref._id, 'string', 'Embedded document received an id')
		return EmbeddedModel.count({_id: doc.ref._id})
	})
	.then(count => {
		t.equal(count, 1, 'Embedded document was saved to the database')
		t.end()
	}).catch(err => {
		t.error(err, 'Failed to save the document')
		t.end()
	})
})
