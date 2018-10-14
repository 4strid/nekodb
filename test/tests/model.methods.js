const test = require('tape')

function runTests (ko, next) {

	test('Model#count', function (t) {
		const CountModel = ko.Model('ko_db_test_methods_count', {
			name: ko.String,
		})

		Promise.all([
			CountModel.create({name: 'Barry'}).save(),
			CountModel.create({name: 'Berry'}).save(),
			CountModel.create({name: 'Bernie'}).save(),
			CountModel.create({name: 'Barry'}).save(),
		]).then(() => {
			return CountModel.count({})
		}).then(count => {
			t.equal(count, 4, 'Counts all the models correctly')
			return CountModel.count({name: 'Barry'})
		}).then(count => {
			t.equal(count, 2, 'Counts correctly when supplied a query')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
			next()
		})
	})

	test('Model#countDocuments', function (t) {
		const CountDocsModel = ko.Model('ko_db_test_methods_count_docs', {
			name: ko.String,
		})

		Promise.all([
			CountDocsModel.create({name: 'Barry'}).save(),
			CountDocsModel.create({name: 'Berry'}).save(),
			CountDocsModel.create({name: 'Bernie'}).save(),
			CountDocsModel.create({name: 'Barry'}).save(),
		]).then(() => {
			return CountDocsModel.countDocuments({})
		}).then(count => {
			t.equal(count, 4, 'Counts all the models correctly')
			return CountDocsModel.countDocuments({name: 'Barry'})
		}).then(count => {
			t.equal(count, 2, 'Counts correctly when supplied a query')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
			next()
		})
	})

	test('Model#estimatedDocumentCount', function (t) {
		const estCountModel = ko.Model('ko_db_test_methods_est_count', {
			name: ko.String,
		})

		Promise.all([
			estCountModel.create({name: 'Barry'}).save(),
			estCountModel.create({name: 'Berry'}).save(),
			estCountModel.create({name: 'Bernie'}).save(),
			estCountModel.create({name: 'Barry'}).save(),
		]).then(() => {
			return estCountModel.estimatedDocumentCount({})
		}).then(count => {
			t.equal(count, 4, 'Counts all the models correctly')
			return estCountModel.estimatedDocumentCount({name: 'Barry'})
		}).then(count => {
			t.equal(count, 2, 'Counts correctly when supplied a query')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
			next()
		})
	})

	test('Model#find', function (t) {
		const FindModel = ko.Model('ko_db_test_methods_find', {
			name: ko.String,
		})

		Promise.all([
			FindModel.create({name: 'Barry'}).save(),
			FindModel.create({name: 'Berry'}).save(),
			FindModel.create({name: 'Bernie'}).save(),
			FindModel.create({name: 'Barry'}).save(),
		]).then(() => {
			return FindModel.find({})
		}).then(docs => {
			t.equal(docs.length, 4, 'Found all the docs')
			return FindModel.find({name: 'Barry'})
		}).then(docs => {
			t.equal(docs.length, 2, 'Given a query, found correct number of docs')
			docs.forEach(doc => {
				t.equal(doc.name, 'Barry', 'Doc has correct name')
			})
			return FindModel.find({name: 'Matilda'})
		}).then(docs => {
			t.deepEqual(docs, [], 'Returned empty array for query that matched no docs')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Model#findOne', function (t) {
		const FindOneModel = ko.Model('ko_db_test_methods_findone', {
			name: ko.String,
		})

		Promise.all([
			FindOneModel.create({name: 'Barry'}).save(),
			FindOneModel.create({name: 'Berry'}).save(),
			FindOneModel.create({name: 'Bernie'}).save(),
			FindOneModel.create({name: 'Boris'}).save(),
		]).then(() => {
			return FindOneModel.findOne({name: 'Barry'})
		}).then(doc => {
			t.deepEqual(doc, {
				_id: doc._id,
				name: 'Barry',
			}, 'Found a matching document')
			return FindOneModel.findOne({name: 'Matilda'})
		}).then(doc => {
			t.equal(doc, null, 'Returned null for query that matched no docs')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Model#findById', function (t) {
		const FindByIdModel = ko.Model('ko_db_test_methods_findbyid', {
			_id: ko.String,
		})

		FindByIdModel.create({
			_id: '123',
		}).save().then(() => {
			return FindByIdModel.findById('123')
		}).then(doc => {
			t.deepEqual(doc, {_id: '123'}, 'Found the document with specified _id')
			return FindByIdModel.findById('hoopla')
		}).then(doc => {
			t.equal(doc, null, 'Returned null for _id not in the collection')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Projections', function (t) {
		const ProjectionModel = ko.Model('ko_db_test_methods_projections', {
			number: ko.Number,
			string: ko.String,
			bool: ko.Boolean,
		})

		ProjectionModel.create({
			number: 1,
			string: '1',
			bool: true,
		}).save().then(() => {
			return ProjectionModel.findOne({}, {_id: 0, number: 1})
		}).then(projected => {
			t.deepEqual(projected, {
				number: 1,
			}, 'findOne returned a projection containing the correct fields')
			return ProjectionModel.find({}, {_id: 0, bool: 0})
		}).then(projected => {
			t.deepEqual(projected, [{
				number: 1,
				string: '1',
			}], 'find returned a projection containing the correct fields')
			t.end()
		})
	})


	test('Deleting Models', function (t) {
		const DeleteModel = ko.Model('ko_db_test_methods_deletes', {
			name: ko.String,
		})

		Promise.all([
			DeleteModel.create({name: 'Barry'}).save(),
			DeleteModel.create({name: 'Berry'}).save(),
			DeleteModel.create({name: 'Bernie'}).save(),
			DeleteModel.create({name: 'Barry'}).save(),
			DeleteModel.create({name: 'Boris'}).save(),
		]).then(models => {
			return DeleteModel.deleteById(models[4]._id)
		}).then(() => {
			return DeleteModel.countDocuments({})
		}).then(count => {
			t.equal(count, 4, 'Deleted one document from the database with deleteById')
			return DeleteModel.deleteOne({name: 'Bernie'})
		}).then(() => {
			return DeleteModel.countDocuments({})
		}).then(count => {
			t.equal(count, 3, 'Deleted one document from the databse with deleteOne')
			return DeleteModel.deleteMany({name: 'Barry'})
		}).then(() => {
			return DeleteModel.countDocuments({})
		}).then(count => {
			t.equal(count, 1, 'Deleted two documents from the databse with deleteMany')
			return DeleteModel.deleteMany({})
		}).then(() => {
			return DeleteModel.countDocuments({})
		}).then(count => {
			t.equal(count, 0, 'Deleted remaining documents by passing {} to deleteMany')
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
