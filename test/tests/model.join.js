const test = require('tape')

function runTests (ko, next) {
	let RefModel
	let JoinModel
	let JoinArrModel

	test('Setting up', function (t) {
		RefModel = ko.Model('ko_db_test_join_ref', {
			field: ko.String,
		})


		JoinModel = ko.Model('ko_db_test_join', {
			ref: RefModel,
			ref2: RefModel,
		})

		JoinArrModel = ko.Model('ko_db_test_join_multi', {
			refs: [RefModel],
		})

		Promise.all([
			RefModel.create({_id: 0, field: 'test value 0'}),
			RefModel.create({_id: 1, field: 'test value 1'}),
			RefModel.create({_id: 2, field: 'test value 2'}),
		].map(doc => doc.save())).then(() => {
			return Promise.all([
				JoinModel.create({_id: 0, ref: 0, ref2: 0}),
				JoinModel.create({_id: 1, ref: 1, ref2: 1}),
			].map(doc => doc.save()))
		})
		.then(() => {
			return JoinArrModel.create({
				_id: 0,
				refs: [0, 1, 2],
			}).save()
		})
		.then(() => {
			return JoinArrModel.create({
				_id: 1,
				refs: [],
			}).save()
		})
		.then(() => {
			t.end()
		})
		.catch(err => {
			console.error('Ran into an error creating test models!')
			t.error(err)
			t.end()
		})
	})

	test('Internal model._save method', function (t) {
		JoinModel.findOne({_id: 0}).then(instance => {
			return JoinModel._join(instance, 'ref').then(saved => {
				t.pass('Call to _join succeeded')
				t.equal(typeof saved.ref, 'object', 'After join, reference is an object')
				t.equal(saved.ref.field, 'test value 0', 'After join, reference has correct values')
				t.end()
			})
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Joining works when called on instances', function (t) {
		JoinModel.findOne({_id: 0}).then(instance => {
			return instance.join().then(instance => {
				t.pass('Join called without arguments')
				t.deepEqual(instance, {
					_id: 0,
					ref: {
						_id: 0,
						field: 'test value 0',
					},
					ref2: {
						_id: 0,
						field: 'test value 0',
					},
				}, 'All references were joined and have correct values')
			})
		}).then(() => {
			return JoinModel.findOne({_id: 0})
		}).then(instance => {
			t.equal(typeof instance.ref, 'number', 'Subsequent find returns original instance')
			return instance.join(['ref'])
		}).then(instance => {
			t.pass('Join called while specifying fields')
			t.deepEqual(instance, {
				_id: 0,
				ref: {
					_id: 0,
					field: 'test value 0',
				},
				ref2: 0,
			}, 'Only specified references were joined and have correct values')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Joining works when called as part of findOne', function (t) {
		JoinModel.findOne({_id: 0}).join().then(instance => {
			t.pass('Join called without arguments')
			t.deepEqual(instance, {
				_id: 0,
				ref: {
					_id: 0,
					field: 'test value 0',
				},
				ref2: {
					_id: 0,
					field: 'test value 0',
				},
			}, 'All references were joined and have correct values')
		}).then(() => {
			return JoinModel.findOne({_id: 0}).join(['ref'])
		}).then(instance => {
			t.pass('Join called specifying fields')
			t.deepEqual(instance, {
				_id: 0,
				ref: {
					_id: 0,
					field: 'test value 0',
				},
				ref2: 0,
			}, 'Only specified references were joined and have correct values')
		}).then(() => {
			return JoinModel.findOne({_id: 100}).join(['ref'])
		}).then(instance => {
			t.equal(instance, null, 'findOne and join returns null when findOne returns null')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Joining works when called as part of find', function (t) {
		JoinModel.find({}).sort({_id: 1}).join().then(instances => {
			t.pass('Join called without arguments')
			t.deepEqual(instances, [
				{
					_id: 0,
					ref: {
						_id: 0,
						field: 'test value 0',
					},
					ref2: {
						_id: 0,
						field: 'test value 0',
					},
				},
				{
					_id: 1,
					ref: {
						_id: 1,
						field: 'test value 1',
					},
					ref2: {
						_id: 1,
						field: 'test value 1',
					},
				},
			], 'All references were joined and have correct values')
		}).then(() => {
			return JoinModel.find({}).sort({_id: 1}).join(['ref'])
		}).then(instances => {
			t.pass('Join called without arguments')
			t.deepEqual(instances, [
				{
					_id: 0,
					ref: {
						_id: 0,
						field: 'test value 0',
					},
					ref2: 0,
				},
				{
					_id: 1,
					ref: {
						_id: 1,
						field: 'test value 1',
					},
					ref2: 1,
				},
			], 'Only selected references were joined and have correct values')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Can join a model that contains an array of references', function (t) {
		JoinArrModel.findOne({_id: 0}).join().then(instance => {
			t.deepEqual(instance, {
				_id: 0,
				refs: [{
					_id: 0,
					field: 'test value 0',
				}, {
					_id: 1,
					field: 'test value 1',
				}, {
					_id: 2,
					field: 'test value 2',
				}],
			}, 'All references were joined and have correct values')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Can join an array of models that each contain an array of references', function (t) {
		JoinArrModel.find({}).sort({_id: 1}).join().then(instances => {
			t.deepEqual(instances, [{
				_id: 0,
				refs: [{
					_id: 0,
					field: 'test value 0',
				}, {
					_id: 1,
					field: 'test value 1',
				}, {
					_id: 2,
					field: 'test value 2',
				}],
			}, {
				_id: 1,
				refs: [],
			}], 'All references were joined and have correct values')
			t.end()
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Join works when called as part of cursor.forEach', function (t) {
		t.plan(2)
		const expected = [
			[{
				_id: 0,
				field: 'test value 0',
			}, {
				_id: 1,
				field: 'test value 1',
			}, {
				_id: 2,
				field: 'test value 2',
			}],
			[],
		]
		let i = 0
		JoinArrModel.find({}).sort({_id: 1}).join().forEach(instance => {
			t.deepEqual(instance.refs, expected[i])
			i++
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
