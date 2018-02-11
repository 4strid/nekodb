# kodm
Tiny ODM for MongoDB

```javascript
ko.models({
	user: {
		name: ko.String[50],
		age: ko.Number
	}
})

var instance = ko.models.user.create()

instance.name = 'Joe'
instance.age = 100

instance.save()

// alternately

ko.models.user.create({
	name: 'Bob',
	age: 32
}).save()

ko.models.user.find({}).then(function (users) {
	// do whatever you want with users
})

```

I'm just getting started!
