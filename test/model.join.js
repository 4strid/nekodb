const test = require('tape')

let ko
let Instance
let RefModel
let JoinModel

let refs = []

setup()

function setup () {
	ko = require('../ko')

	Instance = require('../lib/models/instance')

	RefModel = ko.Model('ko_db_test_join_ref', {
		field: ko.String
	})


	JoinModel = ko.Model('ko_db_test_join', {
		ref: RefModel
	})

	JoinArrModel = ko.Model('ko_db_test_join_multi', {
		ref: [RefModel]
	})

	Promise.all([
		RefModel.create({_id: 0, field: 'test value 0'}),
		RefModel.create({_id: 1, field: 'test value 1'}),
		RefModel.create({_id: 2, field: 'test value 2'}),
	].map(doc => doc.save())).then(() => {
		return Promise.all([
			JoinModel.create({_id: 0, ref: 0}),
			JoinModel.create({_id: 1, ref: 1}),
		].map(doc => doc.save()))
	})
	.then(() => {
		return JoinArrModel.create({
			_id: 0,
			ref: [0, 1, 2]
		}).save()
	})
	.then(runTests).catch(err => {
		console.error('Ran into an error creating test models!')
		console.error(err)
	})
}

function runTests () {
	test('Internal model._save method', function (t) {
		t.plan(3)
		JoinModel.findOne({_id: 0}).then(instance => {
			return JoinModel._join(instance, 'ref').then(saved => {
				t.pass('Call to _join succeeded')
				t.equal(typeof saved.ref, 'object', 'After join, reference is an object')
				t.equal(saved.ref.field, 'test value 0', 'After join, reference has correct values')
			})
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Joining works when called on instances', function (t) {
		t.plan(7)

		JoinModel.findOne({_id: 0}).then(instance => {
			instance.join().then(instance => {
				t.pass('Join called without arguments')
				t.equal(typeof instance.ref, 'object', 'After join, reference is an object')
				t.equal(instance.ref.field, 'test value 0', 'After join, reference has correct values')
			})
		}).then(() => {
			return JoinModel.findOne({_id: 0})
		}).then(instance => {
			// this test will not work when we switch to MongoDB
			t.equal(typeof instance.ref, 'number', 'Subsequent find returns original instance')
			return instance.join(['ref'])
		}).then(instance => {
			t.pass('Join called while specifying fields')
			t.equal(typeof instance.ref, 'object', 'After join, reference is an object')
			t.equal(instance.ref.field, 'test value 0', 'After join, reference has correct values')
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})

	test('Joining works when called as part of findOne', function (t) {
		t.plan(6)
		JoinModel.findOne({_id: 0}).join().then(instance => {
			t.pass('Join called without arguments')
			t.equal(typeof instance.ref, 'object', 'After join, reference is an object')
			t.equal(instance.ref.field, 'test value 0', 'After join, reference has correct values')
		}).then(() => {
			return JoinModel.findOne({_id: 0}).join(['ref'])
		}).then(instance => {
			t.pass('Join called specifying fields')
			t.equal(typeof instance.ref, 'object', 'After join, reference is an object')
			t.equal(instance.ref.field, 'test value 0', 'After join, reference has correct values')
		}).catch(err => {
			t.error(err)
			t.end()
		})
	})
}
