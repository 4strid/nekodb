const test = require('tape')

function runTests (ko, next) {

	test('Coercing boolean values', async t => {
		const BooleanModel = ko.Model('ko_db_test_coerce_boolean', {
			bool: ko.Boolean,
		})

		try {
			const model = BooleanModel.create({
				bool: true,
			})
			t.equal(typeof model.bool, 'boolean', 'Boolean values remain boolean values')
			t.equal(model.bool, true, 'Boolean values retain their value')
			model.bool = false
			t.equal(typeof model.bool, 'boolean', 'Boolean values remain boolean values')
			t.equal(model.bool, false, 'Boolean values retain their value')
			model.bool = 'true'
			t.equal(typeof model.bool, 'boolean', 'String value "true" is coerced to a boolean')
			t.equal(model.bool, true, 'String value "true" is coerced to true')
			model.bool = 'false'
			t.equal(typeof model.bool, 'boolean', 'String value "false" is coerced to a boolean')
			t.equal(model.bool, false, 'String value "false" is coerced to false')
			model.bool = 1
			t.equal(typeof model.bool, 'boolean', 'Number value 1 is coerced to a boolean')
			t.equal(model.bool, true, 'Number value 1 is coerced to true')
			model.bool = 0
			t.equal(typeof model.bool, 'boolean', 'Number value 0 is coerced to a boolean')
			t.equal(model.bool, false, 'Number value 0 is coerced to false')
			await model.save()

			const count = await BooleanModel.countDocuments({bool: false})
			t.equal(count, 1, 'Found the model when searching with a boolean value')

			let found = await BooleanModel.findOne({bool: 'false'})
			t.notEqual(found, null, 'Found the model when searching with a string value')

			found = await BooleanModel.findOne({bool: {$exists: true}})
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coercing number values', async t => {
		const NumberModel = ko.Model('ko_db_test_coerce_number', {
			num: ko.Number,
		})

		try {
			const model = NumberModel.create({
				num: 0,
			})
			t.equal(typeof model.num, 'number', 'Number values remain number values')
			t.equal(model.num, 0, 'Number values retain their value')
			model.num = 1
			t.equal(typeof model.num, 'number', 'Number values remain number values')
			t.equal(model.num, 1, 'Number values retain their value')
			model.num = '0'
			t.equal(model.num, 0, 'String values are coerced to numbers')

			await model.save()

			const count = await NumberModel.countDocuments({num: 0})
			t.equal(count, 1, 'Found the model when searching with a number value')

			let found = await NumberModel.findOne({num: '0'})
			t.notEqual(found, null, 'Found the model when searching with a string value')

			found = await NumberModel.findOne({num: {$in: [0, 1, 2]}})
			t.notEqual(found, null, 'Found the model when searching with a complex query with all numbers')

			found = await NumberModel.findOne({num: {$nin: ['0', 1, new Date()]}})
			t.equal(found, null, 'Did not find any models when querying with a $nin value which after coersion matched the value')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coercing string values', async t => {
		const StringModel = ko.Model('ko_db_test_coerce_string', {
			string: ko.String,
		})

		try {
			const model = StringModel.create({
				string: 'hello',
			})
			t.equal(typeof model.string, 'string', 'String values remain string values')
			t.equal(model.string, 'hello', 'String values retain their value')
			model.string = 'goodbye'
			t.equal(typeof model.string, 'string', 'String values remain string values')
			t.equal(model.string, 'goodbye', 'String values retain their value')
			model.string = 123
			t.equal(typeof model.string, 'string', 'Number values are coerced to strings')
			t.equal(model.string, '123', 'Number values are coerced to strings')

			await model.save()

			const count = await StringModel.countDocuments({string: '123'})
			t.equal(count, 1, 'Found the model when searching with a string value')

			let found = await StringModel.findOne({string: 123})
			t.notEqual(found, null, 'Found the model when searching with a number value')

			found = await StringModel.findOne({string: {$regex: /^\d/}})
			t.notEqual(found, null, 'Found the model when searching with a regular expression')
			
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coercing date values', async t => {
		const DateModel = ko.Model('ko_db_test_coerce_date', {
			date: ko.Date,
		})

		try {
			const date = new Date()
			const model = DateModel.create({
				date: date,
			})
			t.equal(model.date instanceof Date, true, 'Date values remain date values')
			t.deepEqual(model.date, date, 'Date values retain their value')
			model.date = '2018-03-27'
			t.equal(model.date instanceof Date, true, 'String values are coerced to dates')
			t.deepEqual(model.date, new Date('2018-03-27'), 'String values are coerced to dates')
			const time = Date.now()
			model.date = time
			t.equal(model.date instanceof Date, true, 'Number values are coerced to dates')
			t.deepEqual(model.date, new Date(time), 'String values are coerced to dates')

			await model.save()

			const count = await DateModel.countDocuments({date: new Date(time)})
			t.equal(count, 1, 'Found the model when searching with a date value')

			let found = await DateModel.findOne({date: time})
			t.notEqual(found, null, 'Found the model when searching with a number value')

			found = await DateModel.findOne({date: {$gt: new Date('1970-01-01')}})
			t.notEqual(found, null, 'Found the model when searching with a complex query with a date value')

			found = await DateModel.findOne({date: {$gt: '1970-01-01', $lte: Date.now()}})
			t.notEqual(found, null, 'Found the model when searching with a complex query which requires coersion')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coercing array values', async t => {
		const ArrayModel = ko.Model('ko_db_test_coerce_array', {
			arr: [ko.Number],
		})

		try {
			const model = ArrayModel.create({
				arr: [1, 2, 3],
			})
			t.deepEqual(model.arr, [1, 2, 3], 'Values which do not need to be coerced remain ok')
			await model.save()

			model.arr = ['-1', '2', '3']
			t.deepEqual(model.arr, [-1, 2, 3], 'Values are coerced when the array is set to a new array')
			await model.save()

			model.arr[3] = 4
			t.deepEqual(model.arr, [-1, 2, 3, 4], 'Values which do not need to be coerced can be set on the array')
			await model.save()

			model.arr[0] = '5'
			t.deepEqual(model.arr, [5, 2, 3, 4], 'Setting an array value coerces a string to a number')
			await model.save()

			model.arr.push('6')
			t.deepEqual(model.arr, [5, 2, 3, 4, 6], 'Pushing a value performs coersion')
			await model.save()

			model.arr.$addToSet(['5', '7'])
			t.deepEqual(model.arr, [5, 2, 3, 4, 6, 7], 'Array operator method $addToSet performs coersion')
			await model.save()

			model.arr.$push('8', {$position: 0, $slice: 4})
			t.deepEqual(model.arr, [8, 5, 2, 3], 'Array operator method $push performs coersion')

			await model.save()

			const count = await ArrayModel.countDocuments({arr: [8, 5, 2, 3]})
			t.equal(count, 1, 'Found the model when searching with an array of uncoerced values')

			let found = await ArrayModel.findOne({arr: ['8', '5', '2', '3']})
			t.notEqual(found, null, 'Found the model when searching with coerced values')

			found = await ArrayModel.findOne({arr: {$elemMatch: {$gt: 0}}})
			t.notEqual(found, null, 'Found the model when searching with uncoerced $elemMatch')

			found = await ArrayModel.findOne({arr: {$elemMatch: {$gt: '1'}}})
			t.notEqual(found, null, 'Found the model when searching with coerced $elemMatch')

			// $all is not supported by NeDB. a polyfill will be added at a later time
			//found = await ArrayModel.findOne({arr: {$all: [1, 2, 3, 4]}})
			//t.notEqual(found, null, 'Found the model when searching with uncoerced $all')

			//found = await ArrayModel.findOne({arr: {$all: ['1', 2, '3', 4]}})
			//t.notEqual(found, null, 'Found the model when searching with coerced $all')

			found = await ArrayModel.findOne({arr: {$size: 4}})
			t.notEqual(found, null, 'Found the model when searching with $size')

			found = await ArrayModel.findOne({arr: {$size: '4'}})
			t.notEqual(found, null, 'Found the model when searching with coerced $size')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coercing arrays of arrays', async t => {
		const ArraysModel = ko.Model('ko_db_test_coerce_arrays', {
			arrays: [[ko.Number]],
		})

		try {
			const model = ArraysModel.create({
				arrays: [[1, 2, 3], [4, 5]],
			})

			model.arrays[1][1] = '50'
			t.equal(model.arrays[1][1], 50, 'Coerced value when setting in nested array')

			model.arrays[1] = ['100']
			t.deepEqual(model.arrays[1], [100], 'Coerced value when setting a nested array to a new array')

			model.arrays = [['4', '5', '6'], ['7', '8']]
			t.deepEqual(model.arrays, [[4, 5, 6], [7, 8]], 'Coerced value when setting array of arrays to a new array')

			await model.save()

			let found = await ArraysModel.findOne({arrays: [['4', '5', '6'], ['7', '8']]})
			t.notEqual(found, null, 'Found array when searching by full array value')

			found = await ArraysModel.findOne({'arrays.1.1': '8'})
			t.notEqual(found, null, 'Found array when searching by nested nested value')

			found = await ArraysModel.findOne({'arrays.0': {$nin: ['100']}})
			t.notEqual(found, null, 'Found array when searching by nested field with complex query')
		} catch (err) {
			console.log(err)
			t.error(err)
		}

		t.end()
	})

	test('Coercing embedded documents', async t => {
		const DocumentModel = ko.Model('ko_db_test_coerce_document', {
			document: {
				number: ko.Number,
				boolean: ko.Boolean,
				array: [ko.Number],
			},
		})

		try {
			const model = DocumentModel.create({
				document: {
					number: 10,
					boolean: true,
					array: [12],
				},
			})

			model.document.number = '13'
			t.equal(model.document.number, 13, 'Embedded document field coerced from string to number')
			model.document.boolean = 'false'
			t.equal(model.document.boolean, false, 'Embedded document field coerced from string to boolean')
			model.document.array[0] = '99'
			t.equal(model.document.array[0], 99, 'Updating array field in embedded document was coerced')
			model.document.array = ['1', '2', '3']
			t.deepEqual(model.document.array, [1, 2, 3], 'Setting array field in embedded document causes coersion')

			await model.save()

			let found = await DocumentModel.findOne({
				document: {
					number: '13',
					boolean: 'false',
					array: ['1', '2', '3'],
				},
			})
			t.notEqual(found, null, 'Found the model when searching with string values')

			found = await DocumentModel.findOne({
				'document.number': '13',
			})
			t.notEqual(found, null, 'Found the model when querying on an embedded field')

		} catch (err) {
			console.log(err)
			t.error(err)
		}

		t.end()
	})

	test('Coercing option types', async t => {

		const OptionModel = ko.Model('ko_db_test_coerce_option', {
			optional: ko.Number.optional(),
			number: [ko.Number, ko.String],
			string: [ko.String, ko.Number],
		})

		try {
			const model = OptionModel.create()

			model.optional = '123'
			t.equal(model.optional, 123, 'Optional number coerced from string to number')
			model.optional = null
			t.equal(model.optional, null, 'Null value is not coerced')
			model.optional = 'null'
			t.equal(model.optional, null, 'String \'null\' is coerced to null')
			model.number = '123'
			t.equal(model.number, 123, 'Option with leading Number type is coerced to number')
			model.string = 123
			t.equal(model.string, '123', 'Option with leading String type is coerced to string')
			await model.save()

			let count = await OptionModel.countDocuments({optional: 'null'})
			t.equal(count, 1, 'Coerced string null to null in query')
			count = await OptionModel.countDocuments({number: '123'})
			t.equal(count, 1, 'Coerced string to number in query')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coercing references by objectID', async t => {
		const ReferencedModelObjectID = ko.Model('ko_db_test_coerce_refd_obj', {
			field: ko.String,
		})

		const RefModelByObjectID = ko.Model('ko_db_test_coerce_ref_obj', {
			ref: ReferencedModelObjectID,
		})

		try {
			const refObjID = await ReferencedModelObjectID.create({
				field: 'hello',
			}).save()

			const modelObj = RefModelByObjectID.create({
				ref: refObjID._id,
			})
			t.equal(modelObj.ref instanceof ReferencedModelObjectID.client.ObjectID ||
					typeof modelObj.ref === 'string', true, 'Can set a reference to an ObjectID')
			modelObj.ref = refObjID._id.toString()
			t.equal(modelObj.ref instanceof ReferencedModelObjectID.client.ObjectID ||
					typeof modelObj.ref === 'string', true, 'Coerced string value to ObjectID')

			await modelObj.save()

			let found = await RefModelByObjectID.findOne({ref: refObjID._id})
			t.notEqual(found, null, 'Found the model when searching by ObjectID')

			found = await RefModelByObjectID.findOne({ref: refObjID._id.toString()})
			t.notEqual(found, null, 'Found the model when searching by a string')
		} catch (err) {
			console.error(err)
			t.error(err)
		}

		t.end()
	})

	test('Coercing references by Number', async t => {
		const ReferencedModelNumberID = ko.Model('ko_db_test_coerce_refd_num', {
			_id: ko.Number,
			field: ko.String,
		})

		const RefModelByNumber = ko.Model('ko_db_test_coerce_ref_num', {
			ref: ReferencedModelNumberID,
		})

		try {
			const refNum = await ReferencedModelNumberID.create({
				_id: 0,
				field: 'hello',
			}).save()

			const model = RefModelByNumber.create({
				ref: refNum._id,
			})
			t.equal(typeof model.ref, 'number', 'Can set a reference to a number')
			t.equal(model.ref, 0, 'Can set a reference to a number')
			model.ref = '0'
			t.equal(typeof model.ref, 'number', 'Coerces a reference to the referenced model\'s _id type')
			t.equal(model.ref, 0, 'Coerced to correct value')

			await model.save()

			let found = await RefModelByNumber.findOne({ref: 0})
			t.notEqual(found, null, 'Found the model when searching by a number')

			found = await RefModelByNumber.findOne({ref: '0'})
			t.notEqual(found, null, 'Found the model when searching by a string')
		} catch (err) {
			t.error(err)
		}

		t.end()
	})

	test('Coerce complex queries', async t => {
		const ComplexModel = ko.Model('ko_db_test_coerce_queries', {
			string: ko.String,
			number: ko.Number,
			array: [ko.Boolean],
			date: ko.Date.now(),
		})

		const model1 = ComplexModel.create({
			string: 'Hello',
			number: 10,
			array: [true, true, true],
		})

		// not enough time passes for ko.Date.now() to return unique values
		await new Promise((resolve) => {
			setTimeout(() => resolve(), 10)
		})

		const model2 = ComplexModel.create({
			string: 'Hello',
			number: 11,
			array: [true, false, true],
		})

		const model3 = ComplexModel.create({
			string: 'Goodbye',
			number: 12,
			array: [false, false, false],
		})

		try {
			await model1.save()
			await model2.save()
			await model3.save()

			let found = await ComplexModel.findOne({
				$and: [
					{string: 'Hello'},
					{number: 10},
					{array: {$nin: [false]}},
				],
			})
			t.deepEqual(model1._id, found._id, 'Found the correct model where coersion was not necessary')

			found = await ComplexModel.findOne({
				$and: [
					{string: 'Hello'},
					{number: '10'},
					{array: {$nin: ['false']}},
				],
			})
			t.deepEqual(model1._id, found._id, 'Found the correct model where coersion of query was necessary')

			found = await ComplexModel.find({
				$and: [
					{$or: [{string: 'Goodbye'}, {string: 'Hello'}]},
					{$or: [{number: '11'}, {array: {$nin: ['false']}}]},
				],
			}).sort({date: 1})
			t.deepEqual(found, [model1, model2], 'Found all the documents with an and/or query with coerced values')
		} catch (err) {
			console.log(err)
			t.error(err)
		}

		t.end()
	})

	test('All done', t => {
		next()
		t.end()
	})
}

module.exports = runTests
