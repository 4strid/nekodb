const test = require('tape')

const ko = require('../ko')

const SimpleModel = ko.Model('ko_db_test_save_simple', {
	string: ko.String,
})

const SimpleModelFail = ko.Model('ko_db_test_save_simple_fail', {
	string: ko.String[5],
	number: ko.Number
})

const ModelWithRef = ko.Model('ko_db_test_save_with_ref', {
	ref: SimpleModel
})

const EmbedModel = ko.Model('ko_db_test_save_embed', {
	ref: SimpleModel
})

test('Saving a simple model successfully', function (t) {
	SimpleModel.create({
		string: 'ok'
	}).save().then(simple => {
		t.equal('_id' in simple, true, 'Instance assigned an _id when not specified')
		t.equal(simple.string, 'ok', 'Instance has correct field')
		return SimpleModel.count({})
	}).then(count => {
		t.equal(count, 1, 'Count incremented after creation')
		return SimpleModel.create({_id: 1, string: 'nice'}).save().then(saved => {
			console.log(saved)
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
	SimpleModelFail.create({
		string: 'too long string',
		number: 0
	}).save().then(simple => {
		t.fail('Model creation succeeded where it should have failed')
		t.end()
	}).catch(fields => {
		t.deepEqual(fields, {
			string: 'too long string'
		}, 'Got back an error object that contained the invalid fields')
		//t.end()
		return SimpleModelFail.count({})
	//})
	}).then(count => {
		t.equal(count, 0, 'Did not add anything to the database')
		t.end()
	})
})
