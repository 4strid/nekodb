const test = require('tape')

const ko = require('../ko')



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
	}).then(() => {
		t.fail('Model creation succeeded where it should have failed')
		return SimpleModelFail.count({})
	}).catch(err => {
		t.equal(err instanceof Error, true, 'Got back an error')
		return SimpleModelFail.count({})
	}).then(count => {
		t.equal(count, 1, 'Did not add anything to the database')
		t.end()
	})
})

test('Saving works for schemas that contain embedded references', function (t) {
	const EmbeddedModel = ko.Model('ko_db_test_save_embedded', {
		string: ko.String
	})

	const EmbedModel = ko.Model('ko_db_test_save_embed', {
		ref: EmbeddedModel
	})
	EmbedModel.create({
		ref: {
			string: 'In the database'
		}
	}).saveRefs().then(doc => {
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

//test('Saving a model with a reference', function (t) {
	//const ReferencedModel = ko.Model('ko_db_test_save_referenced', {
		//string: ko.String
	//})

	//const ModelWithRef = ko.Model('ko_db_test_save_with_ref', {
		//field: ko.String,
		//ref: ReferencedModel
	//})

	//ReferencedModel.create({
		//_id: '0',
		//string: 'hello'
	//}).save().then(() => {
		//return ModelWithRef.create({
			//_id: '0',
			//field: 'zzz',
			//ref: '0'
		//}).save()
	//}).then(saved => {
		//t.end()
	//})
//})

// saving a model with a ref
// updating a model with a ref

// saving a model that has been joined
// updating the referenced model after a join
