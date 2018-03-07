const test = require('tape')

function runTests (ko, next) {
	test('Model creation succeeds when schema contains references (created one at a time)', function (t) {
		try {
			ko.models({
				ko_db_test_ref1: {
					field: ko.String
				}
			})
			ko.models({
				ko_db_test_test1: {
					ref: ko.models.ko_db_test_ref1.reference()
				}
			})
			t.pass('Created models successfully')
			t.end()
		} catch (err) {
			t.error(err)
			t.end()
		}
	})

	test('Model creation succeeds when schema contains references (created together)', function (t) {
		try {
			ko.models({
				ko_db_test_ref2: {
					field: ko.String
				},
				ko_db_test_test2: {
					ref: ko.models.ko_db_test_ref2.ref()
				}
			})
			t.pass('Created models successfully')
			t.end()
		} catch (err) {
			t.error(err)
			t.end()
		}
	})

	test('Validation works for schemas that contain references', function (t) {
		try {
			ko.models({
				ko_db_test_ref3: {
					field: ko.String
				},
				ko_db_test_test3: {
					ref: ko.models.ko_db_test_ref3.reference()
				}
			})
			ko.models.ko_db_test_ref3.create({
				_id: '0',
				field: 'value'
			}).save().then(ref => {
				const model = ko.models.ko_db_test_test3.create({
					ref: '0',
				})
				return ko.models.ko_db_test_test3.validate(model)
			}).then(() => {
				// resolving promise means validation succeeded
				t.pass('Valid reference passes validation')
			}).then(() => {
				const model = ko.models.ko_db_test_test3.create({
					ref: '1',
				})
				ko.models.ko_db_test_test3.validate(model).then(() => {
					t.fail('Invalid reference passed validation')
					t.end()
				}).catch(err => {
					// rejected promise means validation failed
					t.equal(typeof err, 'object', 'Invalid reference fails validation')
					t.equal('ref' in err, true, 'Error contains correct field')
					t.end()
				})
			}).catch(err => {
				t.error(err)
				t.end()
			})
		} catch (err) {
			t.error(err)
			t.end()
		}
	})

	test('Validation works for schemas that contain embedded references', function (t) {
		ko.models({
			ko_db_test_ref4: {
				field: ko.String
			},
			ko_db_test_test4: {
				ref: ko.models.ko_db_test_ref4.embed()
			}
		})
		const model = ko.models.ko_db_test_test4.create({
			ref: { field: 'valid' },
		})
		ko.models.ko_db_test_test4.validate(model).then(() => {
			// resolved promise means validation passed
			t.pass('Valid embed passed validation')
			return ko.models.ko_db_test_test4.create({
				ref: { field: 100 },
			}).saveRefs()
		}).catch(err => {
			// rejected promise means validation failed
			t.equal(typeof err, 'object', 'Invalid embed fails validation')
			t.equal('ref' in err, true, 'Error contains correct field')
			t.end()
		})
	})

	test('Saving works for schemas that contain references', function (t) {
		ko.models({
			ko_db_test_ref5: {
				field: ko.String
			},
			ko_db_test_test5: {
				ref: ko.models.ko_db_test_ref5.reference()
			}
		})
		ko.models.ko_db_test_ref5.create({
			field: 'value'
		}).save().then(ref => {
			return ko.models.ko_db_test_test5.create({
				ref: ref._id
			}).save()
		})
		.then(doc => {
			t.pass('Successfully created document')
			t.end()
		}).catch(err => {
			t.error(err, 'Failed to save the document')
			t.end()
		})
	})

	test('Saving works for schemas that contain references (Using ref shorthand)', function (t) {
		ko.models({
			ko_db_test_ref5_1: {
				field: ko.String
			},
			ko_db_test_test5_1: {
				ref: ko.models.ko_db_test_ref5_1.ref()
			}
		})
		ko.models.ko_db_test_ref5_1.create({
			field: 'value'
		}).save().then(ref => {
			return ko.models.ko_db_test_test5_1.create({
				ref: ref._id
			}).save()
		})
		.then(doc => {
			t.pass('Successfully created document')
			t.end()
		}).catch(err => {
			t.error(err, 'Failed to save the document')
			t.end()
		})
	})

	test('Saving works for schemas that contain references (using Model shorthand)', function (t) {
		ko.models({
			ko_db_test_ref5_2: {
				field: ko.String
			},
			ko_db_test_test5_2: {
				ref: ko.models.ko_db_test_ref5_2
			}
		})
		ko.models.ko_db_test_ref5_2.create({
			field: 'value'
		}).save().then(ref => {
			return ko.models.ko_db_test_test5_2.create({
				ref: ref._id
			}).save()
		})
		.then(doc => {
			t.pass('Successfully created document')
			t.end()
		}).catch(err => {
			t.error(err, 'Failed to save the document')
			t.end()
		})
	})

	test('All done', function (t) {
		t.end()
		next()
	})
}

module.exports = runTests
