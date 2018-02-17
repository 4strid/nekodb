const test = require('tape')

runTests()

function runTests () {
	const ko = require('../ko')

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
				return ko.models.ko_db_test_test3.validate({
					ref: '0'
				})
			}).then(() => {
				// resolving promise means validation succeeded
				t.pass('Valid reference passes validation')
			}).then(() => {
				ko.models.ko_db_test_test3.validate({
					ref: '1'
				}).then(() => {
					t.fail('Invalid reference passed validation')
					t.end()
				}).catch(err => {
					// rejected promise means validation failed
					t.equal(typeof err, 'object', 'Invalid reference fails validation')
					t.equal('ref' in err, true, 'Error contains correct field')
					t.end()
				})
			}).catch(err => {
				console.error('unexpected error')
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
		ko.models.ko_db_test_test4.validate({
			ref: {
				field: 'valid!'
			}
		}).then(() => {
			// resolved promise means validation passed
			t.pass('Valid embed passed validation')
			ko.models.ko_db_test_test4.validate({
				ref: {
					field: 100
				}
			}).then(() => {
				// resolved promise means validation passed
				t.fail('Invalid embed passed validation')
				t.end()
			}).catch(err => {
				// rejected promise means validation failed
				t.equal(typeof err, 'object', 'Invalid embed fails validation')
				t.equal('ref' in err, true, 'Error contains correct field')
				t.end()
			})
		}).catch(err => {
			console.error('unexpected error')
			t.error(err)
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

	test('Saving works for schemas that contain embedded references', function (t) {
		ko.models({
			ko_db_test_ref6: {
				field: ko.String
			},
			ko_db_test_test6: {
				ref: ko.models.ko_db_test_ref6.embed()
			}
		})
		ko.models.ko_db_test_test6.create({
			ref: {
				field: 'In the database'
			}
		}).save().then(doc => {
			t.pass('Successfully created document')
			t.equal('_id' in doc.ref, true, 'Embedded document received an id')
			return ko.models.ko_db_test_ref6.count({_id: doc.ref._id})
		})
		.then(count => {
			t.equal(count, 1, 'Embedded document was saved to the database')
			t.end()
		}).catch(err => {
			t.error(err, 'Failed to save the document')
			t.end()
		})
	})
}

